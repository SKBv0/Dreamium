import { logger } from './logger';
import { createHash } from 'crypto';
import { z } from 'zod';
import { getSystemMessageForLanguage } from './system-messages';
import { QuantitativeAnalysisResult, type Demographics } from './types';
import type { EmotionAnalysisResult } from './emotion-analysis';
import { normalizeQuantitativeResponse } from './quantitative-analysis-normalizer';

const ANALYSIS_CONSTANTS = {
  MIN_DREAM_LENGTH: 20,
  HIGH_EMOTION_THRESHOLD: 70,
  MEDIUM_EMOTION_THRESHOLD: 40,
  MAX_THEME_COUNT: 8,
} as const;
const QUANT_ANALYZER_VERSION = '2025.02.17';
const REQUEST_CACHE_TTL_MS = 30 * 60 * 1000; // Increased from 10 to 30 minutes for better caching
const CODE_FENCE_REGEX = /^```(?:json)?\s*|\s*```$/g;

// More robust strip for code-fenced JSON blocks
function stripCodeFence(text: string): string {
  let s = (text ?? '').trim();
  
  // Handle various code fence patterns
  if (s.startsWith('```')) {
    // Remove opening fence (with optional language specifier)
    s = s.replace(/^```(?:json|JSON)?\s*\n?/, '');
    // Remove closing fence
    s = s.replace(/\n?```\s*$/, '');
  }
  
  // Handle cases where AI might include extra text after JSON
  // Look for the end of valid JSON structure
  const jsonEndPatterns = [
    /\}\s*$/m,  // Ends with closing brace
    /\]\s*$/m,  // Ends with closing bracket
  ];
  
  // If the text doesn't end with proper JSON structure, try to find where it should end
  if (!jsonEndPatterns.some(pattern => pattern.test(s))) {
    // Try to find the last complete JSON structure
    const lastBrace = s.lastIndexOf('}');
    const lastBracket = s.lastIndexOf(']');
    const lastComplete = Math.max(lastBrace, lastBracket);
    
    if (lastComplete > 0) {
      s = s.substring(0, lastComplete + 1);
    }
  }
  
  return s.trim();
}
const ensureSocialInteractions = (value: any): QuantitativeAnalysisResult['socialInteractions'] => {
  const zero = { aggressive: 0, friendly: 0, sexual: 0, neutral: 0 };
  if (!value || typeof value !== 'object') {
    return { total: 0, types: { ...zero } };
  }
  const types = value.types && typeof value.types === 'object' ? value.types : {};
  const aggressive = Number.isFinite(types.aggressive) ? Math.max(0, types.aggressive) : 0;
  const friendly = Number.isFinite(types.friendly) ? Math.max(0, types.friendly) : 0;
  const sexual = Number.isFinite(types.sexual) ? Math.max(0, types.sexual) : 0;
  const neutral = Number.isFinite(types.neutral) ? Math.max(0, types.neutral) : 0;
  const total = Number.isFinite(value.total) ? Math.max(0, value.total) : aggressive + friendly + sexual + neutral;
  return {
    total,
    types: { aggressive, friendly, sexual, neutral },
  };
};

const ensureSetting = (value: any, fallback: QuantitativeAnalysisResult['setting']): QuantitativeAnalysisResult['setting'] => {
  if (!value || typeof value !== 'object') return { ...fallback };
  const location = typeof value.location === 'string' ? value.location : fallback.location;
  const familiarity = typeof value.familiarity === 'string' ? value.familiarity : fallback.familiarity;
  const description = typeof value.description === 'string' ? value.description : fallback.description;
  return { location, familiarity, description };
};

const ensureSuccessFailure = (value: any, fallback: QuantitativeAnalysisResult['successFailureRatio']): QuantitativeAnalysisResult['successFailureRatio'] => {
  if (!value || typeof value !== 'object') return { ...fallback };
  const success = Number.isFinite(value.success) ? Math.max(0, value.success) : fallback.success;
  const failure = Number.isFinite(value.failure) ? Math.max(0, value.failure) : fallback.failure;
  return { success, failure };
};

const ensureCharacters = (
  value: any,
  fallback: QuantitativeAnalysisResult['characters'],
  humanLabel: string,
  dreamerPresent: boolean
): QuantitativeAnalysisResult['characters'] => {
  let candidates: Array<{ type: string; count: number }> = Array.isArray(value)
    ? value.filter(item => item && typeof item.type === 'string' && Number.isFinite(item.count))
    : [];

  if (candidates.length === 0) {
    candidates = [...fallback];
  }

  if (candidates.length === 0 && dreamerPresent) {
    candidates.push({ type: humanLabel, count: 1 });
  }

  return candidates.map(char => ({ type: char.type, count: Math.max(0, Math.floor(char.count)) }));
};

const buildFallbackQuantitative = (
  raw: any,
  hints: QuantitativeAnalysisResult,
  isEn: boolean,
  dreamerPresent: boolean
): QuantitativeAnalysisResult => {
  const hydrated: any = raw && typeof raw === 'object' ? JSON.parse(JSON.stringify(raw)) : {};

  const humanLabel = isEn ? 'human' : 'insan';

  hydrated.characters = ensureCharacters(hydrated.characters, hints.characters, humanLabel, dreamerPresent);
  hydrated.characterCount = Number.isFinite(hydrated.characterCount)
    ? Math.max(0, Math.floor(hydrated.characterCount))
    : hydrated.characters.reduce((sum: number, char: any) => sum + (Number.isFinite(char.count) ? char.count : 0), 0);

  hydrated.socialInteractions = ensureSocialInteractions(hydrated.socialInteractions);
  hydrated.setting = ensureSetting(hydrated.setting, hints.setting);
  hydrated.successFailureRatio = ensureSuccessFailure(hydrated.successFailureRatio, hints.successFailureRatio);

  if (!Array.isArray(hydrated.emotions)) {
    hydrated.emotions = hints.emotions ?? [];
  }

  return hydrated as QuantitativeAnalysisResult;
};

type CachedRequest = {
  promise: Promise<string>;
  expiresAt: number;
};

const requestCache = new Map<string, CachedRequest>();

const QuantitativeResultSchema = z.object({
  characterCount: z.number().int().nonnegative(),
  characters: z.array(
    z.object({
      type: z.string().min(0),
      count: z.number().int().nonnegative(),
    })
  ).min(0),
  socialInteractions: z.object({
    total: z.number().int().nonnegative(),
    types: z.object({
      aggressive: z.number().int().nonnegative(),
      friendly: z.number().int().nonnegative(),
      sexual: z.number().int().nonnegative(),
      neutral: z.number().int().nonnegative(),
    }),
  }),
  setting: z.object({
    familiarity: z.enum(['familiar', 'unfamiliar', 'mixed']),
    location: z.enum(['indoors', 'outdoors', 'mixed']),
    description: z.string().min(0),
  }),
  successFailureRatio: z.object({
    success: z.number().int().nonnegative(),
    failure: z.number().int().nonnegative(),
  }),
  consciousnessScore: z.number().min(0).max(100).optional(),
  emotions: z.array(
    z.object({
      type: z.string().min(0),
      count: z.number().int().nonnegative(),
    })
  ).min(0),
});

const hashPayload = (value: unknown): string => {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  return createHash('sha256').update(serialized).digest('hex');
};

const buildCacheKey = (parts: unknown[]): string => {
  return hashPayload(parts.map(part => (typeof part === 'string' ? part : JSON.stringify(part))).join('|'));
};

const pruneRequestCache = (now: number = Date.now()) => {
  for (const [key, entry] of requestCache.entries()) {
    if (entry.expiresAt <= now) {
      requestCache.delete(key);
    }
  }
};

const normalizeWord = (word: string) =>
  word
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,!?;:\\"'()\[\]{}]/g, '')
    .replace(/[\p{P}\p{S}]/gu, '');

const countOccurrencesExact = (words: string[], dictionary: string[]): number => {
  const lookup = new Set(dictionary.map(normalizeWord));
  return words.reduce((count, word) => count + (lookup.has(normalizeWord(word)) ? 1 : 0), 0);
};

const countOccurrencesStem = (words: string[], stems: string[]): number => {
  const normStems = stems.map(normalizeWord).filter(Boolean);
  return words.reduce((count, w) => {
    const n = normalizeWord(w);
    return count + (normStems.some(stem => stem.length > 1 && n.startsWith(stem)) ? 1 : 0);
  }, 0);
};

const countOccurrences = (words: string[], dictionary: string[]): number => {
  const lookup = new Set(dictionary.map(normalizeWord));
  return words.reduce((count, word) => count + (lookup.has(normalizeWord(word)) ? 1 : 0), 0);
};

/**
 * Validate AI-generated text against source dream text
 * Prevents hallucinations by checking word overlap
 */
function validateAgainstSource(aiText: string, sourceText: string): boolean {
  if (!aiText || !sourceText) return false;

  // Normalize both texts for comparison
  const normalizeForValidation = (text: string) =>
    text.toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,!?;:\\"'()\[\]{}]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3); // Only meaningful words

  const aiWords = new Set(normalizeForValidation(aiText));
  const sourceWords = new Set(normalizeForValidation(sourceText));

  // Calculate overlap: how many AI words exist in source?
  let overlapCount = 0;
  aiWords.forEach(word => {
    if (sourceWords.has(word)) overlapCount++;
  });

  const overlapRatio = aiWords.size > 0 ? overlapCount / aiWords.size : 0;

  // Require at least 30% overlap to pass validation
  // This prevents completely fabricated descriptions
  return overlapRatio >= 0.3;
}

const describeSetting = (dreamText: string, fallback: string): string => {
  const trimmed = dreamText.trim();
  if (trimmed.length === 0) return fallback;
  const sentences = trimmed.split(/[.!?]/).map(sentence => sentence.trim()).filter(Boolean);
  if (sentences.length === 0) return fallback;
  const description = sentences[0].length > 140 ? `${sentences[0].slice(0, 137)}...` : sentences[0];

  // Validate description is actually from the dream text (not hallucinated)
  const isValid = validateAgainstSource(description, dreamText);
  return isValid ? description : fallback;
};

const computeQuantitativeHints = (dreamText: string, isEn: boolean): QuantitativeAnalysisResult => {
  const words = dreamText
    .replace(/\*\*/g, ' ')
    .replace(/\*/g, ' ')
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);

  // ====== COMPREHENSIVE CHARACTER DETECTION (FUTURE-PROOF) ======

  // Individual humans
  const humanWords = isEn
    ? ['person', 'people', 'friend', 'family', 'mother', 'father', 'child', 'crowd', 'man', 'woman']
    : ['insan', 'arkadaş', 'aile', 'anne', 'baba', 'çocuk', 'kalabalık', 'adam', 'kadın', 'memur', 'görevli', 'kişi'];

  // Collective characters (EN) - COMPREHENSIVE
  const collectiveHumansEN = [
    'everyone', 'everybody', 'people', 'crowd', 'group',
    'society', 'humanity', 'audience', 'congregation', 'gathering',
    'swarm', 'horde', 'mass', 'multitude', 'public',
    'community', 'population', 'citizens', 'villagers', 'townsfolk',
    'mob', 'throng', 'assembly', 'party', 'guests'
  ];

  // Collective characters (TR) - COMPREHENSIVE
  const collectiveHumansTR = [
    'herkes', 'insanlar', 'kalabalık', 'grup', 'topluluk',
    'toplum', 'insanlık', 'izleyici', 'cemaat', 'toplanma',
    'sürü', 'kitle', 'yığın', 'halk', 'kamu',
    'topluluk', 'nüfus', 'vatandaşlar', 'köylüler', 'şehirliler',
    'güruh', 'meclis', 'parti', 'misafirler', 'konuklar'
  ];

  // Abstract/Symbolic characters (EN) - MAXIMUM FUTURE-PROOF
  const abstractCharactersEN = [
    'shadow', 'reflection', 'figure', 'silhouette', 'shape',
    'voice', 'whisper', 'announcement', 'call', 'echo',
    'presence', 'entity', 'being', 'consciousness', 'spirit',
    'child.*reflection', 'younger.*self', 'older.*self', // From test dreams
    'eye', 'gaze', 'pupil', 'watcher', 'observer',
    'symbol', 'representation', 'embodiment', 'manifestation'
  ];

  // Abstract/Symbolic characters (TR) - MAXIMUM FUTURE-PROOF
  const abstractCharactersTR = [
    'gölge', 'yansıma', 'figür', 'siluet', 'şekil',
    'ses', 'fısıltı', 'duyuru', 'çağrı', 'yankı',
    'varlık', 'varlık', 'bilinç', 'ruh', 'tin',
    'çocuk.*yansıma', 'genç.*ben', 'yaşlı.*ben', // From test dreams
    'göz', 'bakış', 'göz.*bebeği', 'gözlemci', 'izleyici',
    'sembol', 'temsil', 'cisimleşme', 'tezahür'
  ];

  const animalWords = isEn ? ['bird', 'cat', 'dog', 'horse', 'wolf', 'lion', 'snake'] : ['kuş', 'kedi', 'köpek', 'at', 'kurt', 'aslan', 'yılan'];
  const otherEntities = isEn ? ['robot', 'spirit', 'ghost', 'dragon', 'shadow', 'voice'] : ['robot', 'ruh', 'hayalet', 'ejderha', 'gölge', 'ses'];

  const friendlyWords = isEn
    ? ['hug', 'help', 'talk', 'smile', 'greet', 'support', 'speak', 'ask', 'tell', 'show', 'give', 'gave', 'take', 'share', 'listen', 'hand', 'handed', 'offer', 'offered', 'present', 'presented', 'gift', 'drawing', 'drew', 'draw', 'waving', 'waved', 'wave', 'speaking', 'spoke', 'saying', 'said']
    : ['sarıl', 'yardım', 'konuş', 'gülümse', 'gülüş', 'sırıt', 'selam', 'destek', 'konuşmak', 'sormak', 'söylemek', 'göstermek', 'vermek', 'almak', 'paylaşmak', 'dinlemek', 'uzat', 'sun', 'hediye', 'çiz', 'çiziyor', 'çizdi', 'salla', 'salladı', 'sallıyor', 'konuşuyor', 'dedi', 'söyledi'];
  const aggressiveWords = isEn
    ? ['fight', 'attack', 'hit', 'run', 'fear', 'yell', 'threaten', 'chase', 'hurt', 'kill', 'destroy']
    : ['savaş', 'saldır', 'vur', 'kaç', 'kaçır', 'kork', 'bağır', 'tehdit', 'kovala', 'acı', 'öldür', 'yoket'];
  const sexualWords = isEn
    ? ['kiss', 'touch', 'desire', 'love', 'embrace', 'caress']
    : ['öp', 'dokun', 'arzu', 'sevgi', 'sarıl', 'okşa'];

  // Enhanced social interaction patterns
  const socialInteractionPatterns = isEn
    ? [
        /\b(said|told|asked|spoke|whispered|shouted)\b/gi,
        /\b(looked at|watched|stared|gazed)\b/gi,
        /\b(touched|held|grabbed|pushed|pulled)\b/gi,
        /\b(followed|pursued|avoided|ignored)\b/gi,
        /\b(helped|assisted|supported|aided)\b/gi,
        /\b(argued|fought|disagreed|quarreled)\b/gi,
        /\b(loved|cared|adored|cherished)\b/gi,
        // Teaching/demonstrating actions
        /\b(teacher|professor|instructor).*(drawing|drew|showing|showed|teaching|explaining)\b/gi,
        /\b(drawing|drew|showing|showed).*(shapes|symbols|pictures|diagrams)\b/gi
      ]
    : [
        /\b(dedi|söyledi|sordu|konuştu|fısıldadı|bağırdı)\b/gi,
        /\b(baktı|izledi|gözledi|dikizledi)\b/gi,
        /\b(dokundu|tuttu|yakaladı|itti|çekti)\b/gi,
        /\b(takip|kovala|kaçındı|görmezden)\b/gi,
        /\b(yardım|destek|asist|kolaylık)\b/gi,
        /\b(tartış|tartışma|savaş|görüş)\b/gi,
        /\b(sevdi|sevgi|tapındı|değer)\b/gi,
        // Teaching/demonstration actions
        /\b(öğretmen|hoca|eğitmen).*(çiz|çiziyor|göster|gösteriyor|öğret|açıklıyor)\b/gi,
        /\b(çiz|çiziyor|göster|gösteriyor).*(şekil|sembol|resim|diyagram)\b/gi
      ];

  // Animal interaction patterns (friendly by default)
  const animalInteractionPatterns = isEn
    ? [
        /\b(bird|cat|dog|horse|animal).*(said|told|spoke|speaking|whispered|talked)\b/gi,
        /\b(heard|hear).*(bird|cat|dog|animal).*(say|speak|talk)\b/gi,
        /\b(with|alongside|beside).*(bird|cat|dog|horse|animal)\b/gi,
        /\b(bird|cat|dog|animal).*(gave|handed|offered|showed|guided)\b/gi
      ]
    : [
        /\b(kuş|kedi|köpek|at|hayvan).*(dedi|söyledi|konuştu|fısıldadı)\b/gi,
        /\b(duydum|duymak).*(kuş|kedi|köpek|hayvan).*(de|söyle|konuş)\b/gi,
        /\b(ile|yanında|beraber).*(kuş|kedi|köpek|at|hayvan)\b/gi,
        /\b(kuş|kedi|köpek|hayvan).*(verdi|uzattı|sundu|gösterdi|yönlendirdi)\b/gi
      ];

  const indoorWords = isEn
    ? ['room', 'home', 'house', 'office', 'hall']
    : ['oda', 'ev', 'bina', 'ofis', 'salon'];
  const outdoorWords = isEn
    ? ['sky', 'forest', 'street', 'city', 'sea', 'mountain']
    : ['gökyüzü', 'orman', 'sokak', 'şehir', 'deniz', 'dağ'];

  const familiarWords = isEn ? ['home', 'school', 'office'] : ['ev', 'okul', 'ofis'];
  const unfamiliarWords = isEn ? ['unknown', 'strange', 'foreign'] : ['bilinmeyen', 'yabancı', 'tuhaf'];

  const successWords = isEn ? ['success', 'escape', 'found', 'won', 'flew'] : ['başardım', 'kaçtım', 'buldum', 'kazandım', 'uçtum'];
  const failureWords = isEn ? ['fail', 'fall', 'lose', 'lost'] : ['kaybettim', 'düştüm', 'başaramadım', 'kaybed'];

  const emotionWords = isEn
    ? {
        fear: ['fear', 'afraid', 'scared', 'terror'],
        joy: ['joy', 'happy', 'excited', 'delighted'],
        awe: ['awe', 'wonder', 'astonished', 'marvel'],
        calm: ['calm', 'peaceful', 'serene', 'relaxed'],
        love: ['love', 'loved', 'passion', 'romance'],
        anger: ['anger', 'angry', 'furious', 'rage'],
        sadness: ['sad', 'sadness', 'depressed', 'grief'],
        anxiety: ['anxiety', 'worried', 'nervous', 'stressed']
      }
    : {
        fear: ['korku', 'korktum', 'korkuyordum', 'korkutucu', 'korkunç'],
        joy: ['sevinç', 'mutlu', 'mutluluk', 'heyecanlı', 'coşku'],
        love: ['aşk', 'sevgi', 'aşık', 'sevdim', 'sevindim'],
        awe: ['hayranlık', 'şaşkınlık', 'büyülü'],
        calm: ['sakin', 'huzurlu', 'dingin'],
      };

  // Enhanced character counting with context analysis and future-proof patterns
  const collectiveHumans = isEn ? collectiveHumansEN : collectiveHumansTR;
  const abstractCharacters = isEn ? abstractCharactersEN : abstractCharactersTR;

  // Count collective characters using regex for pattern matching
  const countRegexPatterns = (patterns: string[], text: string): number => {
    return patterns.filter(pattern => {
      try {
        const regex = new RegExp(pattern, 'i');
        return regex.test(text);
      } catch {
        return text.toLowerCase().includes(pattern.toLowerCase());
      }
    }).length;
  };

  const collectiveCount = countOccurrencesExact(words, collectiveHumans) + countRegexPatterns(collectiveHumans, dreamText);
  const abstractCount = countRegexPatterns(abstractCharacters, dreamText);

  const humanCount = countOccurrencesExact(words, humanWords) + countContextualHumans(dreamText) + collectiveCount;
  const animalCount = countOccurrencesExact(words, animalWords) + countContextualAnimals(dreamText);
  const otherCount = countOccurrencesExact(words, otherEntities) + countContextualOthers(dreamText) + abstractCount;

  const friendlyCount = isEn ? countOccurrencesExact(words, friendlyWords) : countOccurrencesStem(words, friendlyWords);
  const aggressiveCount = isEn ? countOccurrencesExact(words, aggressiveWords) : countOccurrencesStem(words, aggressiveWords);
  const sexualCount = isEn ? countOccurrencesExact(words, sexualWords) : countOccurrencesStem(words, sexualWords);

  // Count pattern-based social interactions
  let patternFriendlyCount = 0;
  let patternAggressiveCount = 0;
  let patternSexualCount = 0;

  socialInteractionPatterns.forEach((pattern, index) => {
    const matches = dreamText.match(pattern);
    if (matches) {
      const count = matches.length;
      if (index < 9) patternFriendlyCount += count;
      else if (index < 12) patternAggressiveCount += count;
      else patternSexualCount += count;
    }
  });

  // Count animal-based interactions (friendly by default)
  let animalInteractionCount = 0;
  animalInteractionPatterns.forEach((pattern) => {
    const matches = dreamText.match(pattern);
    if (matches) {
      animalInteractionCount += matches.length;
    }
  });

  // Combine word-based, pattern-based, and animal interaction counts
  const totalFriendly = friendlyCount + patternFriendlyCount + animalInteractionCount;
  const totalAggressive = aggressiveCount + patternAggressiveCount;
  const totalSexual = sexualCount + patternSexualCount;

  const neutralCountBase = Math.max(0, Math.floor(words.length / 60) - (totalFriendly + totalAggressive + totalSexual));
  const neutralCount = (totalFriendly + totalAggressive + totalSexual) === 0 ? 0 : neutralCountBase;

  const indoorCount = countOccurrencesExact(words, indoorWords);
  const outdoorCount = countOccurrencesExact(words, outdoorWords);

  const familiarCount = countOccurrencesExact(words, familiarWords);
  const unfamiliarCount = countOccurrencesExact(words, unfamiliarWords);

  const success = countOccurrencesExact(words, successWords);
  const failure = countOccurrencesExact(words, failureWords);

  const matchedEmotions = Object.entries(emotionWords)
    .map(([type, dictionary]) => ({
      type: isEn ? type : ({ fear: 'korku', joy: 'sevinç', awe: 'hayranlık', calm: 'sakinlik', love: 'aşk', anger: 'öfke', sadness: 'üzüntü', anxiety: 'kaygı' } as Record<string, string>)[type] || type,
      count: countOccurrencesExact(words, dictionary),
    }))
    .filter(item => item.count > 0);

  const characterResults: QuantitativeAnalysisResult['characters'] = [];
  if (humanCount > 0) characterResults.push({ type: isEn ? 'human' : 'insan', count: humanCount });
  if (animalCount > 0) characterResults.push({ type: isEn ? 'animal' : 'hayvan', count: animalCount });
  if (otherCount > 0) characterResults.push({ type: isEn ? 'other' : 'diÃ„Å¸er', count: otherCount });

  if (characterResults.length === 0) {
    characterResults.push({ type: isEn ? 'human' : 'insan', count: 1 });
  }

  const totalInteractions = friendlyCount + aggressiveCount + sexualCount + Math.max(neutralCount, 0);

  const socialInteractions = {
    total: totalInteractions,
    types: {
      aggressive: aggressiveCount,
      friendly: friendlyCount,
      sexual: sexualCount,
      neutral: neutralCount
    }
  };

  // BilinÃƒÂ§dÃ„Â±Ã…Å¸Ã„Â± skoru hesapla
  const consciousnessScore = calculateConsciousnessScore(matchedEmotions, characterResults, socialInteractions);

  const location: QuantitativeAnalysisResult['setting']['location'] = indoorCount > 0 && outdoorCount > 0
    ? 'mixed'
    : indoorCount >= outdoorCount
    ? 'indoors'
    : 'outdoors';

  const familiarity: QuantitativeAnalysisResult['setting']['familiarity'] = familiarCount > 0 && unfamiliarCount > 0
    ? 'mixed'
    : familiarCount >= unfamiliarCount
    ? 'familiar'
    : 'unfamiliar';

  return {
    characterCount: characterResults.reduce((sum, item) => sum + item.count, 0),
    characters: characterResults,
    socialInteractions: {
      total: totalInteractions,
      types: {
        aggressive: aggressiveCount,
        friendly: friendlyCount,
        sexual: sexualCount,
        neutral: Math.max(neutralCount, 0),
      },
    },
    setting: {
      familiarity,
      location,
      description: describeSetting(dreamText, isEn ? 'A dream setting is described.' : 'Rüya mekanı betimleniyor.'),
    },
    successFailureRatio: {
      success,
      failure,
    },
    consciousnessScore,
    emotions: matchedEmotions.length > 0 ? matchedEmotions : [{ type: isEn ? 'neutral' : 'nötr', count: 1 }],
  };
};

function detectDreamerPresence(text: string, isEn: boolean): boolean {
  const tokens = text
    .replace(/\*\*|\*/g, ' ')
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);
  const set = new Set(tokens);
  if (isEn) {
    return ['i', 'me', 'my', 'myself', 'we', 'us', 'our', 'ourselves'].some(t => set.has(t));
  } else {
    const stems = ['ben', 'bana', 'beni', 'biz', 'bize', 'bizi', 'benden', 'bende', 'ruyam', 'ruyamda'];
    return tokens.some(w => stems.some(s => normalizeWord(w).startsWith(normalizeWord(s))));
  }
}

/**
 * Normalize character type to English canonical form
 * Handles multilingual character labels (TR/EN) to prevent duplicates
 */
function normalizeCharacterType(type: string): string {
  const normalized = type.toLowerCase().trim();

  // Multilingual mapping to English canonical labels
  const typeMap: Record<string, string> = {
    'human': 'human',
    'insan': 'human',
    'kişi': 'human',
    'adam': 'human',
    'kadın': 'human',
    'person': 'human',
    'people': 'human',

    'animal': 'animal',
    'hayvan': 'animal',
    'yaratık': 'animal',
    'creature': 'animal',

    'other': 'other',
    'diğer': 'other',
    'başka': 'other',
    'varlık': 'other',
    'entity': 'other'
  };

  return typeMap[normalized] || normalized;
}

function coerceWithHints(
  result: QuantitativeAnalysisResult,
  hints: QuantitativeAnalysisResult,
  dreamerPresent: boolean,
  isEn: boolean
): QuantitativeAnalysisResult {
  const coerced: QuantitativeAnalysisResult = JSON.parse(JSON.stringify(result));

  const humanLabel = 'human'; // Always use English canonical labels internally
  const animalLabel = 'animal';
  const otherLabel = 'other';

  // ✨ CRITICAL FIX: Normalize and deduplicate character types before processing
  // This prevents "human" and "insan" from both appearing in the final result
  const characterMap = new Map<string, number>();

  coerced.characters.forEach(char => {
    const normalizedType = normalizeCharacterType(char.type);
    const existing = characterMap.get(normalizedType) || 0;
    characterMap.set(normalizedType, existing + char.count);
  });

  // Rebuild characters array with normalized, deduplicated types
  coerced.characters = Array.from(characterMap.entries()).map(([type, count]) => ({
    type,
    count
  }));

  // Desired human count: at least 1 if dreamer present; allow extras only if hinted by tokens
  const hintedHuman = (hints.characters.find(c => normalizeCharacterType(c.type) === humanLabel)?.count) || 0;
  const desiredHuman = dreamerPresent ? Math.max(1, hintedHuman) : hintedHuman;
  const humanIdx = coerced.characters.findIndex(c => normalizeCharacterType(c.type) === humanLabel);

  if (desiredHuman > 0) {
    if (humanIdx === -1) coerced.characters.push({ type: humanLabel, count: desiredHuman });
    else coerced.characters[humanIdx].count = desiredHuman;
  } else if (humanIdx !== -1) {
    // If no dreamer and no hinted humans, drop human entry
    coerced.characters.splice(humanIdx, 1);
  }

  // Ensure animals presence matches hints minimally
  const hintedAnimal = (hints.characters.find(c => normalizeCharacterType(c.type) === animalLabel)?.count) || 0;
  const animalIdx = coerced.characters.findIndex(c => normalizeCharacterType(c.type) === animalLabel);

  if (hintedAnimal > 0) {
    if (animalIdx === -1) coerced.characters.push({ type: animalLabel, count: hintedAnimal });
    else coerced.characters[animalIdx].count = Math.max(coerced.characters[animalIdx].count, hintedAnimal);
  }

  // Filter out characters with zero count to maintain consistency
  coerced.characters = coerced.characters.filter(c => c.count > 0);

  // Ensure at least one character exists
  if (coerced.characters.length === 0 && dreamerPresent) {
    coerced.characters.push({ type: humanLabel, count: 1 });
  }

  coerced.characterCount = coerced.characters.reduce((sum, c) => sum + (typeof c.count === 'number' ? c.count : 0), 0);

  if (coerced.socialInteractions && coerced.socialInteractions.types) {
    const types = coerced.socialInteractions.types;
    const hintTotal = hints.socialInteractions?.total || 0;
    if (hintTotal === 0) {
      types.aggressive = 0;
      types.friendly = 0;
      types.sexual = 0;
      types.neutral = Math.min(coerced.socialInteractions.total || 0, 1);
      coerced.socialInteractions.total = types.aggressive + types.friendly + types.sexual + types.neutral;
    } else {
      coerced.socialInteractions.total = types.aggressive + types.friendly + types.sexual + Math.max(0, types.neutral);
    }
  }

  const validLoc = new Set<QuantitativeAnalysisResult['setting']['location']>(['indoors', 'outdoors', 'mixed']);
  const validFam = new Set<QuantitativeAnalysisResult['setting']['familiarity']>(['familiar', 'unfamiliar', 'mixed']);
  if (!validLoc.has(coerced.setting.location)) coerced.setting.location = hints.setting.location;
  if (!validFam.has(coerced.setting.familiarity)) coerced.setting.familiarity = hints.setting.familiarity;

  return coerced;
}

/**
 * Count contextual humans based on pronouns and references
 */
function countContextualHumans(dreamText: string): number {
  const text = dreamText.toLowerCase();
  let count = 0;

  // Detect language from text content
  const isEn = !/[çğıöşü]/.test(dreamText.toLowerCase());

  // Count personal pronouns that imply human presence
  const humanPronouns = isEn
    ? /\b(i|me|my|mine|we|us|our|ours|you|your|yours|he|him|his|she|her|hers|they|them|their|theirs)\b/g
    : /\b(ben|beni|benim|bana|biz|bizi|bizim|bize|sen|seni|senin|sana|o|onu|onun|ona|onlar|onları|onların|onlara)\b/g;

  const pronounMatches = text.match(humanPronouns);
  if (pronounMatches) {
    count += Math.min(pronounMatches.length, 3); // Max 3 additional humans from pronouns
  }

  // Count references to people in context
  const contextualHumans = [
    /\b(annem|babam|kardeşim|ablam|arkadaşım|komşu|tanıdık)\b/gi,
    /\b(mother|father|sibling|friend|neighbor|acquaintance)\b/gi
  ];

  contextualHumans.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  });

  return Math.min(count, 2); // Cap at 2 additional humans
}

/**
 * Count contextual animals based on references and descriptions
 */
function countContextualAnimals(dreamText: string): number {
  const text = dreamText.toLowerCase();
  let count = 0;

  // Detect language from text content
  const isEn = !/[çğıöşü]/.test(dreamText.toLowerCase());

  // Count animal descriptions and references
  const animalReferences = isEn
    ? [
        /\b(animal|creature|being|entity)\b/gi,
        /\b(bird|cat|dog|horse|wolf|lion|snake)\b/gi
      ]
    : [
        /\b(hayvan|canlı|yaratık|varlık)\b/gi,
        /\b(kuş|kedi|köpek|at|kurt|aslan|yılan)\b/gi
      ];

  animalReferences.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) count += Math.min(matches.length, 1); // Max 1 additional animal per category
  });

  return Math.min(count, 1); // Cap at 1 additional animal
}

/**
 * Count contextual other entities (ghosts, shadows, etc.)
 */
function countContextualOthers(dreamText: string): number {
  const text = dreamText.toLowerCase();
  let count = 0;

  // Detect language from text content
  const isEn = !/[çğıöşü]/.test(dreamText.toLowerCase());

  // Count supernatural and abstract entities
  const otherReferences = isEn
    ? [
        /\b(shadow|invisible|spirit|ghost|voice|child|baby|robot|dragon)\b/gi,
        /\b(entity|being|presence|figure|shape|form)\b/gi
      ]
    : [
        /\b(gölge|görünmez|ruh|hayalet|ses|çocuk|bebek|robot|ejderha)\b/gi,
        /\b(varlık|yaratık|figür|şekil|form)\b/gi
      ];

  otherReferences.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  });

  return Math.min(count, 3); // Cap at 3 additional others
}

function calculateConsciousnessScore(
  emotions: { type: string; count: number }[],
  characters: { type: string; count: number }[],
  socialInteractions: { total: number; types: { aggressive: number; friendly: number; sexual: number; neutral: number } }
): number {
  // Unconscious element factors
  const emotionalComplexity = emotions.length
  const characterComplexity = characters.length
  const socialComplexity = Object.values(socialInteractions.types).filter(count => count > 0).length
  const totalCharacters = characters.reduce((sum, char) => sum + char.count, 0)
  const totalInteractions = socialInteractions.total

  // 1. Calculate raw component scores (0-100 scale)
  const emotionDiversity = Math.min(emotionalComplexity * 10, 30) // Max 30
  const characterDiversity = Math.min(characterComplexity * 10, 25) // Max 25
  const interactionDiversity = Math.min(socialComplexity * 10, 20) // Max 20
  const interactionVolume = Math.min(totalInteractions * 5, 25) // Max 25

  // 2. Calculate raw total (0-100)
  const rawTotal = emotionDiversity + characterDiversity +
                   interactionDiversity + interactionVolume

  // 3. Apply sigmoid normalization for more discriminative scores
  // Formula: 100 / (1 + e^(-k * (x - midpoint)))
  const k = 0.08 // Steepness factor (higher = steeper curve)
  const midpoint = 50 // Inflection point (center of the S-curve)

  const normalizedScore = 100 / (1 + Math.exp(-k * (rawTotal - midpoint)))

  // 4. Apply penalties for low activity
  let finalScore = normalizedScore

  // Penalty 1: Zero interactions penalty
  if (totalInteractions === 0) {
    finalScore *= 0.85 // -15% for no interactions
  }

  // Penalty 2: Low character diversity penalty
  if (characterComplexity < 3) {
    finalScore *= 0.95 // -5% for limited character diversity
  }

  // Penalty 3: Low emotional complexity penalty
  if (emotionalComplexity < 2) {
    finalScore *= 0.90 // -10% for very simple emotional content
  }

  // 5. Ensure score is within 0-100 range and round
  return Math.min(Math.max(Math.round(finalScore), 0), 100)
}

const overrideEmotionsWithAnalysis = (
  result: QuantitativeAnalysisResult,
  emotionAnalysis?: EmotionAnalysisResult | null
) => {
  if (!emotionAnalysis) return;
  const allEmotions = [
    emotionAnalysis.primaryEmotion,
    ...(emotionAnalysis.secondaryEmotions || []),
  ].filter(Boolean);

  if (!allEmotions.length) return;

  const deduped = new Map<string, number>();
  allEmotions.forEach(emotion => {
    if (!emotion) return;
    const type = emotion.emotion?.trim();
    if (!type) return;
    const weight = Number.isFinite(emotion.intensity)
      ? Math.max(1, Math.round(emotion.intensity / 25))
      : 1;
    deduped.set(type, Math.max(deduped.get(type) || 0, weight));
  });

  if (deduped.size === 0) return;

  result.emotions = Array.from(deduped.entries()).map(([type, count]) => ({
    type,
    count,
  }));
};

const normalizeSocialInteractions = (result: QuantitativeAnalysisResult) => {
  const types = result.socialInteractions?.types;
  if (!types) {
    throw new Error('Social interaction types missing');
  }

  const ensureInt = (value: number) => Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  types.aggressive = ensureInt(types.aggressive);
  types.friendly = ensureInt(types.friendly);
  types.sexual = ensureInt(types.sexual);
  types.neutral = ensureInt(types.neutral);

  const totalFromTypes =
    types.aggressive + types.friendly + types.sexual + types.neutral;

  const characterCount = ensureInt(result.characterCount);
  const maxInteractions =
    characterCount < 2
      ? 0
      : Math.floor((characterCount * (characterCount - 1)) / 2);

  if (characterCount < 2 || totalFromTypes === 0) {
    types.aggressive = 0;
    types.friendly = 0;
    types.sexual = 0;
    types.neutral = 0;
    result.socialInteractions.total = 0;
    return;
  }

  const cappedTotal = Math.min(totalFromTypes, maxInteractions);
  if (cappedTotal === totalFromTypes) {
    result.socialInteractions.total = cappedTotal;
    return;
  }

  const order: Array<keyof typeof types> = ['aggressive', 'friendly', 'sexual', 'neutral'];
  const scaled: Record<string, number> = {};
  const scale = cappedTotal / totalFromTypes;
  let allocated = 0;

  order.forEach(key => {
    const raw = types[key] * scale;
    const value = Math.floor(raw);
    scaled[key] = Math.min(types[key], value);
    allocated += scaled[key];
  });

  let remainder = cappedTotal - allocated;
  if (remainder > 0) {
    for (const key of order) {
      if (remainder === 0) break;
      if (scaled[key] < types[key]) {
        scaled[key] += 1;
        remainder -= 1;
      }
    }
  }

  types.aggressive = scaled.aggressive || 0;
  types.friendly = scaled.friendly || 0;
  types.sexual = scaled.sexual || 0;
  types.neutral = scaled.neutral || 0;
  result.socialInteractions.total =
    types.aggressive + types.friendly + types.sexual + types.neutral;
};

const assertQuantitativeResultConsistency = (result: QuantitativeAnalysisResult) => {
  if (!Array.isArray(result.characters) || result.characters.length === 0) {
    throw new Error('Quantitative result missing characters array');
  }

  const computedCharacterCount = result.characters.reduce((sum, character) => {
    if (typeof character.count !== 'number' || character.count < 0) {
      throw new Error('Invalid character count entry detected');
    }
    return sum + character.count;
  }, 0);

  if (computedCharacterCount !== result.characterCount) {
    throw new Error(
      `Character count mismatch: expected ${computedCharacterCount}, received ${result.characterCount}`
    );
  }

  if (!result.socialInteractions || !result.socialInteractions.types) {
    throw new Error('Quantitative result missing social interaction breakdown');
  }

  const { aggressive, friendly, sexual, neutral } = result.socialInteractions.types;
  const totalFromTypes = aggressive + friendly + sexual + neutral;
  if (totalFromTypes !== result.socialInteractions.total) {
    throw new Error('Social interaction totals inconsistent with type breakdown');
  }

  if (!Array.isArray(result.emotions)) {
    throw new Error('Quantitative result missing emotions array');
  }

  const uniqueEmotionTypes = new Set(result.emotions.map(item => item.type));
  if (uniqueEmotionTypes.size !== result.emotions.length) {
    throw new Error('Quantitative result contains duplicate emotion types');
  }
};

async function callGenerativeAI(
  prompt: string,
  systemPrompt?: string,
  options: {
    retryCount?: number;
    cacheKeyParts?: unknown[];
  } = {}
): Promise<string> {
  const { retryCount = 0, cacheKeyParts = [] } = options;
  const now = Date.now();
  pruneRequestCache(now);

  const cacheKey = buildCacheKey([
    'quantitative-analysis',
    QUANT_ANALYZER_VERSION,
    prompt,
    systemPrompt || '',
    ...cacheKeyParts,
  ]);

  const cached = requestCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    logger.debug('[AI API] Returning cached request for duplicate prompt', {
      cacheKey,
      ttlMs: cached.expiresAt - now,
    });
    return cached.promise;
  }

  if (cached) {
    requestCache.delete(cacheKey);
  }

  logger.debug('[AI API] Making request to /api/ai/generate:', {
    promptLength: prompt.length,
    promptStart: prompt.substring(0, 100),
    retryCount,
    systemPromptLength: systemPrompt?.length ?? 0,
    cacheKey,
  });

  const requestPromise = (async () => {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, systemPrompt }),
    });

    logger.debug('[AI API] Response received:', {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[AI API] Error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    logger.debug('[AI API] Response data:', {
      success: data.success,
      hasText: !!data.text,
      textLength: data.text?.length || 0,
      textStart: data.text?.substring(0, 100) || 'No text',
    });

    if (!data.success || !data.text) {
      logger.error('[AI API] Invalid response format:', data);
      throw new Error('Invalid API response format');
    }

    return data.text;
  })();

  requestCache.set(cacheKey, {
    promise: requestPromise,
    expiresAt: now + REQUEST_CACHE_TTL_MS,
  });

  try {
    return await requestPromise;
  } catch (error) {
    requestCache.delete(cacheKey);
    throw error;
  }
}

export async function performQuantitativeAnalysis(
  dreamText: string,
  language: string = 'tr',
  options: {
    demographics?: Demographics | null;
    modelVersion?: string;
    analyzerVersion?: string;
    settings?: Record<string, unknown>;
    emotionAnalysis?: EmotionAnalysisResult | null;
  } = {}
): Promise<QuantitativeAnalysisResult | null> {
  const startTime = Date.now()
  const trimmed = dreamText.trim()
  if (trimmed.length < ANALYSIS_CONSTANTS.MIN_DREAM_LENGTH) {
    return null
  }

  const analyzerVersion = options.analyzerVersion ?? QUANT_ANALYZER_VERSION
  const modelVersion =
    options.modelVersion ?? process.env.NEXT_PUBLIC_QUANT_MODEL ?? process.env.NEXT_PUBLIC_APP_VERSION ?? 'unknown-model'
  const settings = options.settings ?? {}
  const demographicsSummary = options.demographics
    ? {
        age: options.demographics.age ?? null,
        gender: options.demographics.gender ?? null,
        culture: options.demographics.culturalBackground ?? null,
      }
    : null

  const isEn = language === 'en'
  const quantitativeHints = computeQuantitativeHints(trimmed, isEn)

  const systemMessage = getSystemMessageForLanguage('quantitativeAnalysis', language as 'tr' | 'en')
  if (!systemMessage || !systemMessage.isActive) {
    throw new Error('Sistem mesajÃ„Â± bulunamadÃ„Â± veya devre dÃ„Â±Ã…Å¸Ã„Â±')
  }

  const languageLabels = {
    human: isEn ? 'human' : 'insan',
    animal: isEn ? 'animal' : 'hayvan',
    other: isEn ? 'other' : 'diğer',
    aggressive: isEn ? 'aggressive' : 'agresif',
    friendly: isEn ? 'friendly' : 'arkadaşça',
    sexual: isEn ? 'sexual' : 'cinsel',
    neutral: isEn ? 'neutral' : 'nötr',
    indoors: isEn ? 'indoors' : 'iç mekan',
    outdoors: isEn ? 'outdoors' : 'dış mekan',
    mixed: isEn ? 'mixed' : 'karışık',
    familiar: isEn ? 'familiar' : 'tanıdık',
    unfamiliar: isEn ? 'unfamiliar' : 'yabancı',
    fear: isEn ? 'fear' : 'korku',
    anxiety: isEn ? 'anxiety' : 'kaygı',
  }

  let systemPrompt = systemMessage.content
  Object.entries(languageLabels).forEach(([key, value]) => {
    systemPrompt = systemPrompt.replace(new RegExp(`\{${key}\}`, 'g'), value)
  })

  systemPrompt = systemPrompt.replace('{familiarity}', quantitativeHints.setting.familiarity)
  systemPrompt = systemPrompt.replace('{location}', quantitativeHints.setting.location)
  systemPrompt = systemPrompt.replace('{settingDescription}', quantitativeHints.setting.description)
  systemPrompt = systemPrompt.replace('{dreamText}', trimmed)
  systemPrompt = systemPrompt.replace('{language}', isEn ? 'English' : 'Turkish')

  // Retry logic: attempt up to 2 times
  let attempt = 0
  const maxAttempts = 2
  let lastError: Error | null = null

  while (attempt < maxAttempts) {
    try {
      attempt++

      logger.info('[Quantitative Analysis] Starting analysis attempt:', {
        attempt,
        maxAttempts,
        length: trimmed.length,
        language,
        analyzerVersion,
        modelVersion,
        firstWords: trimmed.substring(0, 100),
      })

      const dreamHash = hashPayload(trimmed)

      const referenceData = {
        hints: quantitativeHints,
        wordCount: trimmed.split(/\s+/).filter(Boolean).length,
        paragraphCount: trimmed.split(/\n{2,}/).filter(Boolean).length,
        analyzerVersion,
      }

      const userPrompt = `REFERENCE_DATA:\n${JSON.stringify(referenceData, null, 2)}`

      const jsonText = await callGenerativeAI(userPrompt, systemPrompt, {
        cacheKeyParts: [
          analyzerVersion,
          modelVersion,
          language,
          dreamHash,
          hashPayload(referenceData),
          demographicsSummary,
          settings,
          attempt, // Include attempt in cache key to avoid cache hits on retry
        ],
      })

      logger.debug('[Quantitative Analysis] Raw AI response received:', {
        attempt,
        length: jsonText.length,
        startsWithMarkdown: jsonText.startsWith('```'),
        firstChars: jsonText.substring(0, 50),
        lastChars: jsonText.substring(Math.max(jsonText.length - 50, 0)),
        hasCompleteJson: jsonText.includes('}') && jsonText.lastIndexOf('}') > jsonText.length - 100,
      })

      const cleanedText = stripCodeFence(jsonText)
      
      // Check if response seems incomplete (no closing brace or very short)
      if (cleanedText.length < 100 || !cleanedText.includes('}')) {
        logger.warn('[Quantitative Analysis] Response appears incomplete, retrying:', {
          attempt,
          cleanedLength: cleanedText.length,
          hasClosingBrace: cleanedText.includes('}'),
          cleanedText: cleanedText.substring(0, 200),
        })
        
        if (attempt < maxAttempts) {
          logger.warn('[Quantitative Analysis] Incomplete response detected, retrying:', {
            attempt,
            maxAttempts,
            cleanedLength: cleanedText.length,
            hasClosingBrace: cleanedText.includes('}')
          })
          continue // Retry
        }
      }

      let parsedJson: unknown
      try {
        parsedJson = JSON.parse(cleanedText)
      } catch (parseError) {
        logger.error('[Quantitative Analysis] JSON parsing failed', {
          attempt,
          snippet: cleanedText.substring(0, 200),
          fullLength: cleanedText.length,
          errorPosition: parseError instanceof Error && parseError.message.includes('position') 
            ? parseError.message.match(/position (\d+)/)?.[1] 
            : 'unknown',
          message: parseError instanceof Error ? parseError.message : 'unknown',
          rawResponse: jsonText.substring(0, 300),
          cleanedResponse: cleanedText.substring(0, 300),
        })
        
        // Try to recover by using hints as fallback
        if (attempt === maxAttempts) {
          logger.warn('[Quantitative Analysis] Using hints as fallback after JSON parsing failure on final attempt')
          const dreamerPresent = detectDreamerPresence(trimmed, isEn)
          const fallbackResult = coerceWithHints(quantitativeHints, quantitativeHints, dreamerPresent, isEn)
          overrideEmotionsWithAnalysis(fallbackResult, options.emotionAnalysis ?? null)
          normalizeSocialInteractions(fallbackResult)
          return fallbackResult
        }
        
        logger.warn('[Quantitative Analysis] JSON parsing failed, will retry:', {
          attempt,
          maxAttempts,
          error: parseError instanceof Error ? parseError.message : 'unknown'
        })
        
        throw new Error('Quantitative analysis response is not valid JSON')
      }

      // ✨ MULTILINGUAL SUPPORT: Normalize AI response to English schema format
      // This allows AI to respond in Turkish, English, or any supported language
      // The normalizer converts all enum values to English before validation
      const normalizedJson = normalizeQuantitativeResponse(parsedJson);

      logger.debug('[Quantitative Analysis] Normalized multilingual response:', {
        attempt,
        originalLocation: (parsedJson as any)?.setting?.location,
        normalizedLocation: (normalizedJson as any)?.setting?.location,
        originalFamiliarity: (parsedJson as any)?.setting?.familiarity,
        normalizedFamiliarity: (normalizedJson as any)?.setting?.familiarity,
      });

      // 🔧 DEDUPLICATION: Merge duplicate character types after normalization
      // This fixes the bug where AI returns both "insan" and "human", which both
      // normalize to "human", causing duplicates in the final result
      if (Array.isArray(normalizedJson.characters)) {
        const characterMap = new Map<string, number>();
        normalizedJson.characters.forEach((char: any) => {
          const existing = characterMap.get(char.type) || 0;
          characterMap.set(char.type, existing + (char.count || 0));
        });

        normalizedJson.characters = Array.from(characterMap.entries()).map(([type, count]) => ({
          type,
          count
        }));

        // Recalculate character count to match deduplicated total
        normalizedJson.characterCount = normalizedJson.characters.reduce(
          (sum: number, char: any) => sum + char.count,
          0
        );

        logger.debug('[Quantitative Analysis] Deduplicated character types:', {
          attempt,
          originalCharacterCount: (parsedJson as any)?.characterCount,
          deduplicatedCharacterCount: normalizedJson.characterCount,
          characterTypes: normalizedJson.characters.map((c: any) => `${c.type}:${c.count}`).join(', '),
        });
      }

      const parsed = QuantitativeResultSchema.parse(normalizedJson)
      const dreamerPresent = detectDreamerPresence(trimmed, isEn)
      const result = coerceWithHints(parsed, quantitativeHints, dreamerPresent, isEn)

      // Prefer deterministic emotion analysis if LLM returned empty list
      overrideEmotionsWithAnalysis(result, options.emotionAnalysis ?? null)
      if (!result.emotions || result.emotions.length === 0) {
        result.emotions = [{ type: isEn ? 'neutral' : 'nötr', count: 1 }]
      }

      normalizeSocialInteractions(result)
      assertQuantitativeResultConsistency(result)
      result.consciousnessScore = calculateConsciousnessScore(result.emotions, result.characters, result.socialInteractions)

      const totalTime = Date.now() - startTime
      logger.info('[Quantitative Analysis] Analysis completed successfully:', {
        attempt,
        characterCount: result.characterCount,
        emotions: result.emotions?.length || 0,
        socialInteractions: result.socialInteractions?.total || 0,
        totalAttempts: attempt,
        totalTimeMs: totalTime,
        avgTimePerAttempt: Math.round(totalTime / attempt),
      })

      return result // Success!

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')

      // If it's a Zod validation error and we have attempts left, retry with explicit instructions
      if (error instanceof z.ZodError && attempt < maxAttempts) {
        const missingFields = error.issues
          .map(issue => issue.path.join('.'))
          .join(', ')

        logger.warn('[Quantitative Analysis] Validation failed, will retry:', {
          attempt,
          maxAttempts,
          missingFields,
          errorCount: error.issues.length,
        })

        const { toast } = await import('@/lib/toast')
        const taskName = language === 'tr' ? 'Kantitatif Analiz' : 'Quantitative Analysis'
        toast.retry(taskName, attempt, maxAttempts, language as 'tr' | 'en')

        systemPrompt += `\n\n⚠️ CRITICAL ERROR IN PREVIOUS ATTEMPT: You did NOT include these required fields: ${missingFields}. YOU MUST include ALL required fields listed in the JSON format above. DO NOT SKIP ANY FIELD!`

        // Continue to next attempt
        continue
      }

      // If not a Zod error or max attempts reached, log and throw
      const totalTime = Date.now() - startTime
      logger.error('[Quantitative Analysis] Failed after attempts:', {
        totalAttempts: attempt,
        maxAttempts,
        error: lastError.message,
        dreamLength: trimmed.length,
        language,
        analyzerVersion,
        modelVersion,
        totalTimeMs: totalTime,
        avgTimePerAttempt: Math.round(totalTime / attempt),
      })

      throw lastError
    }
  }

  // Should never reach here, but just in case
  throw lastError || new Error('Quantitative analysis failed after maximum attempts')
}
