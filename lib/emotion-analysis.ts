import { logger } from './logger';
import affectLexicon from './affect_lexicon.json';

interface LexiconEntry {
  valence: string;
  emo: string;
  intensity: number;
  cognitive_domain: string;
}

interface LexiconData {
  [category: string]: {
    [word: string]: LexiconEntry;
  };
}

export interface EmotionResult {
  emotion: string;
  emoji: string;
  intensity: number;
  confidence: number;
  evidence_level: 'low' | 'medium' | 'high';
  evidence_words: string[];
  cognitive_domain: string;
  valence: 'pos' | 'neg' | 'neu';
  arousal: number; // 0-1 scale
}

export interface EmotionAnalysisResult {
  primaryEmotion: EmotionResult;
  secondaryEmotions: EmotionResult[];
  emotionalComplexity: number; // 0-100 scale
  valenceBalance: {
    positive: number;
    negative: number;
    neutral: number;
  };
  emotionalTrajectory: Array<{
    position: number;
    emotion: string;
    intensity: number;
  }>;
  dominantCognitiveDomain: string;
  overallArousal: number;
}



const TURKISH_SUFFIXES = [
  'lardan',
  'lerden',
  'lar\u0131m\u0131z',
  'lerimiz',
  'lar\u0131n\u0131n',
  'lerinin',
  'lar\u0131',
  'leri',
  'lara',
  'lere',
  'dan',
  'den',
  'tan',
  'ten',
  'nda',
  'nde',
  'yla',
  'yle',
  'ya',
  'ye',
  'y\u0131',
  'yi',
  'yu',
  'y\u00FC',
  'da',
  'de',
  'ta',
  'te',
  'n\u0131',
  'ni',
  'nu',
  'n\u00FC',
  'n\u0131n',
  'nin',
  'nun',
  'n\u00FCn',
  '\u0131n',
  'in',
  'un',
  '\u00FCn',
  'm\u0131z',
  'miz',
  'muz',
  'm\u00FCz',
  '\u0131m\u0131z',
  'imiz',
  'umuz',
  '\u00FCm\u00FCz',
  '\u0131m',
  'im',
  'um',
  '\u00FCm',
  'm',
  'sin',
  's\u0131n',
  'sun',
  's\u00FCn',
  'siniz',
  's\u0131n\u0131z',
  'sunuz',
  's\u00FCn\u00FCz',
  'l\u0131k',
  'lik',
  'luk',
  'l\u00FCk'
];

const TURKISH_CHAR_FOLD_MAP: Record<string, string> = {
  'ç': 'c',
  'Ç': 'c',
  'ğ': 'g',
  'Ğ': 'g',
  'ı': 'i',
  'İ': 'i',
  'ö': 'o',
  'Ö': 'o',
  'ş': 's',
  'Ş': 's',
  'ü': 'u',
  'Ü': 'u',
  'â': 'a',
  'Â': 'a',
  'ê': 'e',
  'Ê': 'e',
  'î': 'i',
  'Î': 'i',
  'ô': 'o',
  'Ô': 'o',
  'û': 'u',
  'Û': 'u',
};

const foldTurkishChars = (input: string): string =>
  input.replace(/[çÇğĞıİöÖşŞüÜâÂêÊîÎôÔûÛ]/g, char => TURKISH_CHAR_FOLD_MAP[char] ?? char.toLowerCase());

const TURKISH_SUFFIXES_ASCII = TURKISH_SUFFIXES.map(s =>
  foldTurkishChars(
    s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
  )
).sort((a, b) => b.length - a.length);

const TURKISH_EVIDENCE_STOPWORDS = new Set<string>(['iceri', 'ic', 'yansi', 'yans', 'yansima']);

const normalizeEvidenceToken = (word: string): string =>
  foldTurkishChars(
    word
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
  ).replace(/[^a-z]/g, '');

const stripTurkishSuffixes = (word: string): string => {
  let stem = word;
  let previous = '';
  while (stem.length > 2 && stem !== previous) {
    previous = stem;
    for (const suffix of TURKISH_SUFFIXES_ASCII) {
      if (!suffix) continue;
      if (stem.length <= suffix.length + 1) continue;
      if (stem.endsWith(suffix)) {
        stem = stem.slice(0, -suffix.length);
        break;
      }
    }
  }
  return stem;
};

const dedupeEvidenceWords = (candidates: string[], isTurkish: boolean): string[] => {
  const lemmaToOriginal = new Map<string, string>();

  candidates.forEach(entry => {
    entry
      .split(/[,;]/)
      .map(token => token.trim())
      .filter(Boolean)
      .forEach(token => {
        const normalized = normalizeEvidenceToken(token);
        if (!normalized) return;
        const lemma = isTurkish ? stripTurkishSuffixes(normalized) : normalized;
        const keyCandidates = [normalized, lemma];
        if (keyCandidates.some(candidate => candidate.length > 0 && TURKISH_EVIDENCE_STOPWORDS.has(candidate))) {
          return;
        }
        const key = lemma.length >= 2 ? lemma : normalized;
        if (key.length < 2) return;
        if (!lemmaToOriginal.has(key)) {
          lemmaToOriginal.set(key, token);
        }
      });
  });

  return Array.from(lemmaToOriginal.values());
};

const normalizeEmotionKey = (value: string): string =>
  foldTurkishChars(value.toLowerCase()).replace(/[^a-z0-9]+/g, '_');

const DEFAULT_VALENCE_WEIGHTS: Record<string, { positive: number; negative: number; neutral: number }> = {
  pos: { positive: 1, negative: 0, neutral: 0 },
  neg: { positive: 0, negative: 1, neutral: 0 },
  neu: { positive: 0, negative: 0, neutral: 1 },
};

const EMOTION_VALENCE_OVERRIDES: Record<string, { positive: number; negative: number; neutral: number }> = {
  awe_fear: { positive: 0.2, negative: 0.8, neutral: 0 },
  existential_anxiety: { positive: 0.1, negative: 0.9, neutral: 0 },
  awe: { positive: 0.6, negative: 0.4, neutral: 0 },
  hayranlik: { positive: 0.6, negative: 0.4, neutral: 0 },
  varolus_kaygi: { positive: 0.1, negative: 0.9, neutral: 0 },
};

const getEmotionValenceWeights = (emotion: EmotionResult): { positive: number; negative: number; neutral: number } => {
  const override = EMOTION_VALENCE_OVERRIDES[normalizeEmotionKey(emotion.emotion)];
  if (override) {
    return override;
  }
  return DEFAULT_VALENCE_WEIGHTS[emotion.valence] ?? DEFAULT_VALENCE_WEIGHTS.neu;
};


const SUPPLEMENTARY_EMOTION_LEXICON: Record<string, LexiconEntry> = {
  merhamet: { valence: 'pos', emo: 'love', intensity: 0.55, cognitive_domain: 'compassion' },
  merhametli: { valence: 'pos', emo: 'love', intensity: 0.55, cognitive_domain: 'compassion' },
  \u00f6zlem: { valence: 'neg', emo: 'sadness', intensity: 0.65, cognitive_domain: 'longing' },
  pi\u015fmanl\u0131k: { valence: 'neg', emo: 'sadness', intensity: 0.6, cognitive_domain: 'regret' },
  pi\u015fman: { valence: 'neg', emo: 'sadness', intensity: 0.6, cognitive_domain: 'regret' },
  \u00f6fke: { valence: 'neg', emo: 'anger', intensity: 0.7, cognitive_domain: 'anger' },
  affet: { valence: 'pos', emo: 'love', intensity: 0.6, cognitive_domain: 'forgiveness' },
  affetmek: { valence: 'pos', emo: 'love', intensity: 0.6, cognitive_domain: 'forgiveness' },
  affetme: { valence: 'pos', emo: 'love', intensity: 0.6, cognitive_domain: 'forgiveness' },
  teslimiyet: { valence: 'neu', emo: 'acceptance', intensity: 0.6, cognitive_domain: 'acceptance' },
  yorgunluk: { valence: 'neg', emo: 'sadness', intensity: 0.45, cognitive_domain: 'fatigue' }
};

function tokenizeDreamText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[.,!?;:()"'\[\]]/g, ' ')
    .replace(/[\u2026\u201C\u201D\u2019`]/g, ' ')
    .replace(/\*\*/g, ' ')
    .replace(/\*/g, ' ')
    .split(/\s+/)
    .map(token => token.trim())
    .filter(token => token.length > 1 && !token.startsWith('*') && !token.endsWith('*'));
}

function normalizeToken(token: string): string {
  const normalized = token
    .normalize('NFKD')
    .replace(/\u0300-\u036f/g, '')
    .replace(/\u2019/g, "'");

  return normalized.replace(/^[^a-z\u00E7\u011F\u0131\u00F6\u015F\u00FC\u00E2\u00EE\u00FB]+|[^a-z\u00E7\u011F\u0131\u00F6\u015F\u00FC\u00E2\u00EE\u00FB]+$/g, '');
}

function generateCandidateForms(token: string): string[] {
  const base = normalizeToken(token);
  if (!base) {
    return [];
  }

  const queue: string[] = [base];
  const seen = new Set<string>();

  while (queue.length > 0) {
    const current = queue.pop()!;
    if (!current || seen.has(current)) {
      continue;
    }

    seen.add(current);

    for (const suffix of TURKISH_SUFFIXES) {
      if (current.length > suffix.length + 2 && current.endsWith(suffix)) {
        const trimmed = current.slice(0, -suffix.length);
        if (trimmed.length >= 3 && !seen.has(trimmed)) {
          queue.push(trimmed);
        }
      }
    }

    if (current.endsWith('ğ')) {
      const soft = current.slice(0, -1);
      if (soft.length >= 2 && !seen.has(soft)) {
        queue.push(soft);
      }
      const hard = `${soft}k`;
      if (soft.length >= 2 && !seen.has(hard)) {
        queue.push(hard);
      }
    }

    if (current.endsWith('ç')) {
      const alt = `${current.slice(0, -1)}c`;
      if (!seen.has(alt)) {
        queue.push(alt);
      }
    }
  }

  return Array.from(seen);
}

function findLexiconEntry(word: string, modifierCategories: string[]): { entry: LexiconEntry; category: string } | null {
  for (const category in affectLexicon) {
    if (modifierCategories.includes(category)) {
      continue;
    }

    const categoryData = affectLexicon[category as keyof typeof affectLexicon];
    if (typeof categoryData === 'object' && categoryData && word in categoryData) {
      const entry = (categoryData as Record<string, LexiconEntry>)[word];
      if (entry && entry.emo) {
        return { entry, category };
      }
    }
  }

  if (word in SUPPLEMENTARY_EMOTION_LEXICON) {
    return { entry: SUPPLEMENTARY_EMOTION_LEXICON[word], category: 'supplementary' };
  }

  return null;
}

/**
 * Analyze emotions in dream text using affect lexicon
 */
export function analyzeEmotions(dreamText: string, language: string = 'tr'): EmotionAnalysisResult {
  logger.debug('[Emotion Analysis] Starting emotion analysis:', {
    dreamLength: dreamText.length,
    language,
    firstWords: dreamText.substring(0, 100)
  });

  const words = dreamText.toLowerCase()
    .replace(/[.,!?;:()"']/g, ' ')
    .replace(/\*\*/g, ' ')
    .replace(/\*/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !word.startsWith('*') && !word.endsWith('*'));

  logger.debug('[Emotion Analysis] Processed words:', {
    totalWords: words.length,
    sampleWords: words.slice(0, 20)
  });

  // Use enhanced emotion detection algorithm
  const emotionMatches = detectEmotionsEnhanced(dreamText, words);

  logger.debug('[Emotion Analysis] Enhanced emotion detection completed:', {
    totalMatches: emotionMatches.length,
    matches: emotionMatches.slice(0, 5).map(m => ({ word: m.word, emotion: m.emotion, intensity: m.intensity }))
  });

  return processEmotionsLegacy(emotionMatches, emotionMatches, words, language);
}

/**
 * Enhanced emotion detection algorithm
 */
function detectEmotionsEnhanced(dreamText: string, words: string[]): Array<{
  word: string;
  position: number;
  emotion: string;
  intensity: number;
  valence: string;
  cognitive_domain: string;
  emo: string;
  contextMultiplier: number;
}> {
  const emotionMatches: Array<{
    word: string;
    position: number;
    emotion: string;
    intensity: number;
    valence: string;
    cognitive_domain: string;
    emo: string;
    contextMultiplier: number;
  }> = [];

  // Enhanced emotion detection with context analysis
  const sentences = dreamText.split(/[.!?]+/).filter(s => s.trim().length > 0);

  words.forEach((word, index) => {
    const modifierCategories = ['intensifiers', 'negators', 'temporal_markers'];

    for (const category in affectLexicon) {
      if (modifierCategories.includes(category)) {
        continue;
      }
      const categoryData = affectLexicon[category as keyof typeof affectLexicon];
      if (typeof categoryData === 'object' && word in categoryData) {
        const lexiconEntry = (categoryData as any)[word];
        if (lexiconEntry) {
          // Analyze context for better emotion detection
          const contextMultiplier = analyzeEmotionContext(word, index, words, sentences);

          emotionMatches.push({
            word,
            position: index,
            emotion: lexiconEntry.emo,
            intensity: lexiconEntry.intensity * contextMultiplier,
            valence: lexiconEntry.valence,
            cognitive_domain: lexiconEntry.cognitive_domain,
            emo: lexiconEntry.emo,
            contextMultiplier
          });
        }
      }
    }
  });

  const impliedEmotions = detectImpliedEmotions(dreamText, sentences, words);
  emotionMatches.push(...impliedEmotions);

  return consolidateEmotionMatches(emotionMatches);
}

/**
 * Analyze emotion context to determine intensity multiplier
 */
function analyzeEmotionContext(word: string, position: number, words: string[], sentences: string[]): number {
  let multiplier = 1.0;

  const beforeWords = words.slice(Math.max(0, position - 3), position);
  const intensifiers = ['çok', 'fazla', 'aşırı', 'inanılmaz', 'son', 'derin', 'şiddetli'];
  if (beforeWords.some(w => intensifiers.includes(w))) {
    multiplier *= 1.3;
  }

  const negators = ['değil', 'hiç', 'asla', 'yok'];
  if (beforeWords.some(w => negators.includes(w))) {
    multiplier *= 0.7;
  }

  const wordSentence = sentences.find(sentence =>
    sentence.toLowerCase().includes(word.toLowerCase())
  );

  if (wordSentence) {
    const sentenceWords = wordSentence.toLowerCase().split(/\s+/);
    const exclamationCount = (wordSentence.match(/!/g) || []).length;
    const questionCount = (wordSentence.match(/\?/g) || []).length;

    if (exclamationCount > 0) multiplier *= 1.2;
    if (questionCount > 0) multiplier *= 0.9;

    const emotionalWords = ['kalp', 'gözyaşı', 'acı', 'mutluluk', 'üzüntü', 'korku'];
    if (sentenceWords.some(w => emotionalWords.includes(w))) {
      multiplier *= 1.1;
    }
  }

  return Math.max(0.3, Math.min(2.0, multiplier));
}

/**
 * Detect implied emotions based on context and situations
 */
function detectImpliedEmotions(dreamText: string, sentences: string[], words: string[]): Array<{
  word: string;
  position: number;
  emotion: string;
  intensity: number;
  valence: string;
  cognitive_domain: string;
  emo: string;
  contextMultiplier: number;
}> {
  const impliedEmotions: Array<{
    word: string;
    position: number;
    emotion: string;
    intensity: number;
    valence: string;
    cognitive_domain: string;
    emo: string;
    contextMultiplier: number;
  }> = [];

  // Pattern-based implied emotion detection
  const patterns = [
    // Fear patterns - expanded for better detection
    {
      pattern: /\b(korku|korktu|korktum|korkutucu|korkuyordum|korkuyorum|korkuyla|korkutuyor)\b/gi,
      emotion: 'fear',
      intensity: 0.9,
      valence: 'neg'
    },
    {
      pattern: /\b(karanlık|gölge|tehdit|tehlikeli|uğultu|çığlık|bağır|kaç|dönemem|kaçtım|kaçıyor)\b/gi,
      emotion: 'fear',
      intensity: 0.8,
      valence: 'neg'
    },
    {
      pattern: /\b(nefes\s+al\w+|kalp\s+atış|ritim|titri|eril|çözül|kaybol|titreme|terle)\b/gi,
      emotion: 'anxiety',
      intensity: 0.7,
      valence: 'neg'
    },
    {
      pattern: /\b(ters\s+dön|göz\s+bebe|ayna|geri\s+çek|çekil|dondu|sırıttı|gülümse)\b/gi,
      emotion: 'fear',
      intensity: 0.8,
      valence: 'neg'
    },
    {
      pattern: /\b(hatırla|uyana|bitmez|sürek|sonsuza|tekrar|döngü|sonsuz)\b/gi,
      emotion: 'anxiety',
      intensity: 0.6,
      valence: 'neg'
    },
    {
      pattern: /\b(memur|görevli|otorite|resmi|ciddi|sert)\b/gi,
      emotion: 'anxiety',
      intensity: 0.6,
      valence: 'neg'
    },
    {
      pattern: /\b(garip|tuhaf|acayip|ürkütücü|rahatsız\w*|huzursuz)\b/gi,
      emotion: 'anxiety',
      intensity: 0.7,
      valence: 'neg'
    },
    {
      pattern: /\b(şaşır\w*|anlam\w+veremedi|anlamadım|kavramadım)\b/gi,
      emotion: 'confusion',
      intensity: 0.6,
      valence: 'neu'
    },
    {
      pattern: /\b(sessizlik|sessizce|sakin\s+ama|yalnız|tek\s+başına)\b/gi,
      emotion: 'anxiety',
      intensity: 0.5,
      valence: 'neg'
    },
    {
      pattern: /\b(kimlik|benlik|adım|yitir|kaybet|çürü|eridi)\b/gi,
      emotion: 'existential_anxiety',
      intensity: 0.85,
      valence: 'neg'
    },
    {
      pattern: /\b(rüya\s+seni\s+görüyor|gökyüzü|göz|karardı|dev\s+bir)\b/gi,
      emotion: 'awe_fear',
      intensity: 0.9,
      valence: 'neg'
    },
    // Sadness/Loss/Nostalgia patterns - ADDED for museum dream
    {
      pattern: /\b(unut\w*|kaybed\w*|kaybol\w*|yitir\w*|kaybedil\w*)\b/gi,
      emotion: 'sadness',
      intensity: 0.75,
      valence: 'neg'
    },
    {
      pattern: /\b(özle\w*|nostalji|geçmiş|an\w*|hatıra\w*)\b/gi,
      emotion: 'sadness',
      intensity: 0.7,
      valence: 'neg'
    },
    {
      pattern: /\b(buğu\w*|sis\w*|belirsiz|netleş\w*|anla\w*veremed\w*)\b/gi,
      emotion: 'confusion',
      intensity: 0.65,
      valence: 'neu'
    },
    {
      pattern: /\b(karışık|muğlak|açık\s+olmayan|anlaşılmaz)\b/gi,
      emotion: 'confusion',
      intensity: 0.6,
      valence: 'neu'
    },
    {
      pattern: /\b(müze|sergi\w*|vitrin\w*|eser\w*|bak\w*|incele\w*|keşfet\w*)\b/gi,
      emotion: 'curiosity',
      intensity: 0.55,
      valence: 'pos'
    },
    {
      pattern: /\b(merak\w*|ilgi\w*|araştır\w*|gözlem\w*)\b/gi,
      emotion: 'curiosity',
      intensity: 0.6,
      valence: 'pos'
    },
    // Original patterns
    {
      pattern: /\b(kendimi?\s+(kayıp|yalnız|hissediyorum|bulamıyorum))\b/gi,
      emotion: 'sadness',
      intensity: 0.6,
      valence: 'neg'
    },
    {
      pattern: /\b(herkes\s+beni\s+(terk|unutuyor|bulamıyor))\b/gi,
      emotion: 'sadness',
      intensity: 0.7,
      valence: 'neg'
    },
    {
      pattern: /\b(korku\s+(içinde|içimde|içinden))\b/gi,
      emotion: 'fear',
      intensity: 0.8,
      valence: 'neg'
    },
    {
      pattern: /\b(merhamet\s+(hissediyorum|duyuyorum))\b/gi,
      emotion: 'love',
      intensity: 0.6,
      valence: 'pos'
    },
    {
      pattern: /\b(yorgun\s+(hissediyorum|oluyorum|düşüyorum))\b/gi,
      emotion: 'sadness',
      intensity: 0.5,
      valence: 'neg'
    },


    // ENGLISH SUBTLE EMOTIONS
    // Conflict & Tension (EN)
    {
      pattern: /\b(struggle|wrestle|grapple|torn|conflict|tension)\b/gi,
      emotion: 'conflict',
      intensity: 0.7,
      valence: 'neg'
    },
    {
      pattern: /\b(pressure|burden|weight|heavy|crushing|overwhelming)\b/gi,
      emotion: 'anxiety',
      intensity: 0.75,
      valence: 'neg'
    },
    {
      pattern: /\b(dilemma|crossroads|impossible.*choice|cannot.*decide)\b/gi,
      emotion: 'anxiety',
      intensity: 0.7,
      valence: 'neg'
    },

    // Longing & Desire (EN)
    {
      pattern: /\b(longing|yearning|yearn|desire|crave|craving|wish)\b/gi,
      emotion: 'longing',
      intensity: 0.65,
      valence: 'neg'
    },
    {
      pattern: /\b(miss|missing|missed|long.*for|ache.*for)\b/gi,
      emotion: 'longing',
      intensity: 0.6,
      valence: 'neg'
    },
    {
      pattern: /\b(unreachable|unattainable|beyond.*reach|distant)\b/gi,
      emotion: 'longing',
      intensity: 0.7,
      valence: 'neg'
    },

    {
      pattern: /\b(vulnerable|fragile|weak|exposed|defenseless|helpless)\b/gi,
      emotion: 'vulnerability',
      intensity: 0.65,
      valence: 'neg'
    },
    {
      pattern: /\b(naked|bare|unprotected|stripped|raw)\b/gi,
      emotion: 'vulnerability',
      intensity: 0.7,
      valence: 'neg'
    },
    {
      pattern: /\b(break|broken|shatter|crumble|fall.*apart|collapse)\b/gi,
      emotion: 'sadness',
      intensity: 0.75,
      valence: 'neg'
    },

    // Hope & Renewal (EN)
    {
      pattern: /\b(hope|hopeful|renewal|renew|dawn|sunrise|awakening)\b/gi,
      emotion: 'hope',
      intensity: 0.6,
      valence: 'pos'
    },
    {
      pattern: /\b(sunrise.*cool|fresh.*start|new.*beginning|rebirth)\b/gi,
      emotion: 'hope',
      intensity: 0.65,
      valence: 'pos'
    },
    {
      pattern: /\b(possibility|potential|might.*could|perhaps|maybe)\b/gi,
      emotion: 'hope',
      intensity: 0.5,
      valence: 'pos'
    },

    {
      pattern: /\b(nostalgia|nostalgic|memory|memories|remember|past)\b/gi,
      emotion: 'nostalgia',
      intensity: 0.6,
      valence: 'neg'
    },
    {
      pattern: /\b(distant.*laughter|faded|echo|ghost|shadow.*past)\b/gi,
      emotion: 'nostalgia',
      intensity: 0.7,
      valence: 'neg'
    },
    {
      pattern: /\b(melancholy|melancholic|wistful|bittersweet|sorrow)\b/gi,
      emotion: 'melancholy',
      intensity: 0.65,
      valence: 'neg'
    },
    {
      pattern: /\b(used.*to|once.*was|before|long.*ago|years.*ago)\b/gi,
      emotion: 'nostalgia',
      intensity: 0.55,
      valence: 'neg'
    },

    // Awe & Wonder (EN) - FUTURE-PROOF
    {
      pattern: /\b(awe|wonder|magnificent|sublime|majestic|breathtaking)\b/gi,
      emotion: 'awe',
      intensity: 0.7,
      valence: 'pos'
    },
    {
      pattern: /\b(vast|infinite|endless|boundless|immense|enormous)\b/gi,
      emotion: 'awe',
      intensity: 0.65,
      valence: 'pos'
    },
    {
      pattern: /\b(overwhelming.*beauty|cosmic|universe|celestial)\b/gi,
      emotion: 'awe',
      intensity: 0.8,
      valence: 'pos'
    },

    // Shame & Guilt (EN)
    {
      pattern: /\b(shame|ashamed|embarrassed|humiliated|mortified)\b/gi,
      emotion: 'shame',
      intensity: 0.75,
      valence: 'neg'
    },
    {
      pattern: /\b(guilt|guilty|regret|remorse|sorry|apologize)\b/gi,
      emotion: 'guilt',
      intensity: 0.7,
      valence: 'neg'
    },

    {
      pattern: /\b(alone|lonely|isolation|isolated|alienated|disconnected)\b/gi,
      emotion: 'loneliness',
      intensity: 0.7,
      valence: 'neg'
    },
    {
      pattern: /\b(nobody.*understands|no.*one.*sees|invisible|unseen)\b/gi,
      emotion: 'loneliness',
      intensity: 0.75,
      valence: 'neg'
    },
    {
      pattern: /\b(stranger|foreign|unfamiliar|outcast|outsider)\b/gi,
      emotion: 'alienation',
      intensity: 0.65,
      valence: 'neg'
    },

    {
      pattern: /\b(dread|dreading|ominous|foreboding|impending)\b/gi,
      emotion: 'dread',
      intensity: 0.8,
      valence: 'neg'
    },
    {
      pattern: /\b(waiting|wait|anticipate|expect|coming|approaching)\b/gi,
      emotion: 'anticipation',
      intensity: 0.6,
      valence: 'neu'
    },

    // Relief & Release (EN)
    {
      pattern: /\b(relief|relieved|release|freed|escape|escaped)\b/gi,
      emotion: 'relief',
      intensity: 0.65,
      valence: 'pos'
    },
    {
      pattern: /\b(finally|at.*last|exhale|breathe.*again)\b/gi,
      emotion: 'relief',
      intensity: 0.6,
      valence: 'pos'
    },

    // TURKISH SUBTLE EMOTIONS
    // Conflict & Tension (TR)
    {
      pattern: /\b(mücadele|boğuşma|çatışma|gerilim|gerginlik)\b/gi,
      emotion: 'conflict',
      intensity: 0.7,
      valence: 'neg'
    },
    {
      pattern: /\b(baskı|yük|ağırlık|ağır|ezici|bunaltıcı)\b/gi,
      emotion: 'anxiety',
      intensity: 0.75,
      valence: 'neg'
    },
    {
      pattern: /\b(ikilem|çıkmaz|imkansız.*seçim|karar.*veremiyorum)\b/gi,
      emotion: 'anxiety',
      intensity: 0.7,
      valence: 'neg'
    },

    // Longing & Desire (TR)
    {
      pattern: /\b(özlem|hasret|arzu|istek|özle|arzula)\b/gi,
      emotion: 'longing',
      intensity: 0.65,
      valence: 'neg'
    },
    {
      pattern: /\b(özle|özlüyor|özledim|uzak|mesafe|ayrı)\b/gi,
      emotion: 'longing',
      intensity: 0.6,
      valence: 'neg'
    },
    {
      pattern: /\b(ulaşılamaz|erişilmez|uzak|el.*değmez)\b/gi,
      emotion: 'longing',
      intensity: 0.7,
      valence: 'neg'
    },

    {
      pattern: /\b(kırılgan|zayıf|savunmasız|çaresiz|korumasız)\b/gi,
      emotion: 'vulnerability',
      intensity: 0.65,
      valence: 'neg'
    },
    {
      pattern: /\b(çıplak|açık|korunmasız|soyulmuş)\b/gi,
      emotion: 'vulnerability',
      intensity: 0.7,
      valence: 'neg'
    },
    {
      pattern: /\b(kır|kırık|parçalan|ufalandı|dağıl|çökertmek)\b/gi,
      emotion: 'sadness',
      intensity: 0.75,
      valence: 'neg'
    },

    // Umut & Yenilenme (TR)
    {
      pattern: /\b(umut|umutlu|yenilenme|yenile|şafak|gün.*doğumu)\b/gi,
      emotion: 'hope',
      intensity: 0.6,
      valence: 'pos'
    },
    {
      pattern: /\b(şafak.*serin|yeni.*başla|yeniden.*doğ|diriliş)\b/gi,
      emotion: 'hope',
      intensity: 0.65,
      valence: 'pos'
    },
    {
      pattern: /\b(olasılık|potansiyel|belki|mümkün|olabilir)\b/gi,
      emotion: 'hope',
      intensity: 0.5,
      valence: 'pos'
    },

    // Nostalji & Melankoli (TR)
    {
      pattern: /\b(nostalji|anı|hatıra|hatırla|geçmiş)\b/gi,
      emotion: 'nostalgia',
      intensity: 0.6,
      valence: 'neg'
    },
    {
      pattern: /\b(uzak.*kahkaha|solgun|yankı|hayalet|geçmiş.*gölge)\b/gi,
      emotion: 'nostalgia',
      intensity: 0.7,
      valence: 'neg'
    },
    {
      pattern: /\b(melankoli|melankolik|hüzün|acı.*tatlı|keder)\b/gi,
      emotion: 'melancholy',
      intensity: 0.65,
      valence: 'neg'
    },
    {
      pattern: /\b(eskiden|bir.*zamanlar|önce|çok.*önce|yıllar.*önce)\b/gi,
      emotion: 'nostalgia',
      intensity: 0.55,
      valence: 'neg'
    },
    {
      pattern: /\b(mutfak.*koku|kahkaha.*uzak|eski.*günler)\b/gi, // From test dreams
      emotion: 'nostalgia',
      intensity: 0.7,
      valence: 'neg'
    },

    // Awe & Wonder (TR) - FUTURE-PROOF
    {
      pattern: /\b(huşu|hayret|muhteşem|yüce|görkemli|nefes.*kesici)\b/gi,
      emotion: 'awe',
      intensity: 0.7,
      valence: 'pos'
    },
    {
      pattern: /\b(uçsuz.*bucaksız|sonsuz|sınırsız|muazzam|devasa)\b/gi,
      emotion: 'awe',
      intensity: 0.65,
      valence: 'pos'
    },
    {
      pattern: /\b(ezici.*güzellik|kozmik|evren|göksel)\b/gi,
      emotion: 'awe',
      intensity: 0.8,
      valence: 'pos'
    },

    // Shame & Guilt (TR)
    {
      pattern: /\b(utanç|utandı|utandım|mahcup|rezil)\b/gi,
      emotion: 'shame',
      intensity: 0.75,
      valence: 'neg'
    },
    {
      pattern: /\b(suç|suçlu|pişman|pişmanlık|özür|affetme)\b/gi,
      emotion: 'guilt',
      intensity: 0.7,
      valence: 'neg'
    },

    {
      pattern: /\b(yalnız|yalnızlık|tecrit|izole|yabancı|kopuk)\b/gi,
      emotion: 'loneliness',
      intensity: 0.7,
      valence: 'neg'
    },
    {
      pattern: /\b(kimse.*anlamaz|kimse.*görmüyor|görünmez|kayıp)\b/gi,
      emotion: 'loneliness',
      intensity: 0.75,
      valence: 'neg'
    },
    {
      pattern: /\b(yabancı|öteki|dışarıdan|gurbetçi|misafir)\b/gi,
      emotion: 'alienation',
      intensity: 0.65,
      valence: 'neg'
    },

    // Fear & Anxiety (TR)
    {
      pattern: /\b(dehşet|ürküntü|ürküyorum|uğursuz|kötü.*his)\b/gi,
      emotion: 'dread',
      intensity: 0.8,
      valence: 'neg'
    },
    {
      pattern: /\b(bekle|bekliyorum|geleceğinden.*korkuyorum|yaklaşıyor)\b/gi,
      emotion: 'anticipation',
      intensity: 0.6,
      valence: 'neu'
    },

    // Relief & Salvation (TR)
    {
      pattern: /\b(rahatlama|rahatladım|kurtuluş|kurtuldum|kaçış|kaçtım)\b/gi,
      emotion: 'relief',
      intensity: 0.65,
      valence: 'pos'
    },
    {
      pattern: /\b(sonunda|nihayet|nefes.*al|tekrar.*nefes)\b/gi,
      emotion: 'relief',
      intensity: 0.6,
      valence: 'pos'
    },

    {
      pattern: /\b(varoluş|varoluşsal|kimlik.*kaybı|ben.*kim)\b/gi,
      emotion: 'existential_anxiety',
      intensity: 0.85,
      valence: 'neg'
    },
    {
      pattern: /\b(existence|existential|identity.*loss|who.*am.*i)\b/gi,
      emotion: 'existential_anxiety',
      intensity: 0.85,
      valence: 'neg'
    },
    {
      pattern: /\b(boşluk.*hissi|anlamsızlık|kaybolmuş|hiçlik)\b/gi, // From test dreams
      emotion: 'existential_anxiety',
      intensity: 0.8,
      valence: 'neg'
    },
    {
      pattern: /\b(emptiness|meaninglessness|void|nothingness)\b/gi,
      emotion: 'existential_anxiety',
      intensity: 0.8,
      valence: 'neg'
    }
  ];

  patterns.forEach(({ pattern, emotion, intensity, valence }) => {
    const matches = dreamText.match(pattern);
    if (matches) {
      matches.forEach((match, index) => {
        const position = (dreamText.indexOf(match) / dreamText.length) * 100;
        impliedEmotions.push({
          word: match,
          position,
          emotion,
          intensity,
          valence,
          cognitive_domain: 'contextual',
          emo: emotion,
          contextMultiplier: 1.0
        });
      });
    }
  });

  return impliedEmotions;
}

/**
 * Turkish and English stop words / filler words to filter from emotion evidence
 */
const EMOTION_EVIDENCE_STOPWORDS = new Set([
  // Turkish filler words
  'bir', 'iki', 'üç', 'dört', 'beş', 'gibi', 'daha', 'çok', 'az', 'şey',
  'yer', 'zaman', 'anda', 'için', 'ile', 'den', 'dan', 'ten', 'tan',
  'var', 'yok', 'olan', 'içinde', 'üzere', 'sonra', 'önce', 'tekrar',
  'hep', 'her', 'hiç', 'bazı', 'tüm', 'bütün', 'kendi', 'böyle', 'şöyle',

  // English filler words
  'the', 'and', 'but', 'for', 'was', 'were', 'has', 'have', 'had',
  'one', 'two', 'some', 'any', 'all', 'this', 'that', 'these', 'those',
  'very', 'just', 'only', 'also', 'then', 'than', 'when', 'where',

  // Common noise words in dreams
  'anons', 'görevli', 'memur' // Generic role words without emotional content
]);

/**
 * Consolidate similar emotion matches and combine intensities
 * Enhanced: Filters filler words and aggressive deduplication
 */
function consolidateEmotionMatches(matches: Array<{
  word: string;
  position: number;
  emotion: string;
  intensity: number;
  valence: string;
  cognitive_domain: string;
  emo: string;
  contextMultiplier: number;
}>): Array<{
  word: string;
  position: number;
  emotion: string;
  intensity: number;
  valence: string;
  cognitive_domain: string;
  emo: string;
  contextMultiplier: number;
}> {
  const consolidated = new Map<string, {
    word: string;
    position: number;
    emotion: string;
    intensity: number;
    valence: string;
    cognitive_domain: string;
    emo: string;
    contextMultiplier: number;
    evidenceWords: Set<string>;
  }>();

  matches.forEach(match => {
    const key = match.emotion;

    const individualWords = match.word
      .split(/[,;\s]+/)
      .map(w => w.trim().toLowerCase())
      .filter(w => {
        if (w.length < 3) return false;

        // Not a stopword/filler
        if (EMOTION_EVIDENCE_STOPWORDS.has(w)) return false;

        // Not purely numeric
        if (/^\d+$/.test(w)) return false;

        // Must contain at least one letter
        if (!/[a-zçğıöşüâêîôû]/i.test(w)) return false;

        return true;
      });

    // Skip this match entirely if no valid words remain
    if (individualWords.length === 0) return;

    if (consolidated.has(key)) {
      const existing = consolidated.get(key)!;
      existing.intensity = Math.max(existing.intensity, match.intensity);

      individualWords.forEach(word => existing.evidenceWords.add(word));
    } else {
      consolidated.set(key, {
        ...match,
        evidenceWords: new Set(individualWords)
      });
    }
  });

  return Array.from(consolidated.values())
    .filter(item => item.evidenceWords.size > 0) // Only keep emotions with valid evidence
    .map(item => ({
      word: Array.from(item.evidenceWords).join(', '),
      position: item.position,
      emotion: item.emotion,
      intensity: item.intensity,
      valence: item.valence,
      cognitive_domain: item.cognitive_domain,
      emo: item.emo,
      contextMultiplier: item.contextMultiplier
    }));
}

/**
 * Legacy emotion processing for backward compatibility
 */
function processEmotionsLegacy(
  consolidatedMatches: Array<{
    word: string;
    position: number;
    emotion: string;
    intensity: number;
    valence: string;
    cognitive_domain: string;
    emo: string;
    contextMultiplier: number;
  }>,
  emotionMatches: Array<{
    word: string;
    position: number;
    emotion: string;
    intensity: number;
    valence: string;
    cognitive_domain: string;
    emo: string;
    contextMultiplier: number;
  }>,
  words: string[],
  language: string = 'tr'
) {
  // Aggregate emotions by type
  const emotionCounts = new Map<string, {
    count: number;
    totalIntensity: number;
    words: string[];
    domains: Set<string>;
    valences: string[];
  }>();
  const isLikelyTurkish = words.some(token => /[ğüşöçıİ]/i.test(token));

  logger.debug('[Emotion Analysis] Processing emotion matches:', {
    totalMatches: consolidatedMatches.length,
    matches: consolidatedMatches.map(m => ({
      word: m.word,
      emotion: m.emotion,
      intensity: m.intensity,
      valence: m.valence
    }))
  });

  consolidatedMatches.forEach(match => {
    const key = match.emotion;
    if (!emotionCounts.has(key)) {
      emotionCounts.set(key, {
        count: 0,
        totalIntensity: 0,
        words: [],
        domains: new Set(),
        valences: []
      });
    }

    const entry = emotionCounts.get(key)!;
    entry.count++;
    entry.totalIntensity += match.intensity;
    entry.words.push(match.word);
    entry.domains.add(match.cognitive_domain);
    entry.valences.push(match.valence);
  });

  const emotionResults: EmotionResult[] = [];

  logger.debug('[Emotion Analysis] Processing emotion counts:', {
    emotionCountsSize: emotionCounts.size,
    emotionTypes: Array.from(emotionCounts.keys())
  });

  emotionCounts.forEach((data, emotionType) => {
    logger.debug('[Emotion Analysis] Processing emotion type:', {
      emotionType,
      count: data.count,
      words: data.words,
      totalIntensity: data.totalIntensity
    });

    const avgIntensity = data.totalIntensity / data.count;
    const confidenceScore = calculateEmotionConfidence(data.count, avgIntensity, data.words.length);
    const evidenceLevel = getEvidenceLevel(confidenceScore);

    const emotionLabel = getEmotionLabel(emotionType, language);
    const emotionEmoji = getEmotionEmoji(emotionType);

    logger.debug('[Emotion Analysis] Generated labels:', {
      emotionType,
      emotionLabel,
      emotionEmoji,
      avgIntensity,
      confidenceScore
    });

    const evidenceWords = dedupeEvidenceWords(data.words, isLikelyTurkish);

    emotionResults.push({
      emotion: emotionLabel,
      emoji: emotionEmoji,
      intensity: Math.round(avgIntensity * 100),
      confidence: confidenceScore,
      evidence_level: evidenceLevel,
      evidence_words: evidenceWords,
      cognitive_domain: getMostCommonDomain(data.domains),
      valence: getMostCommonValence(data.valences),
      arousal: calculateArousal(emotionType, avgIntensity)
    });
  });

  // Sort by intensity
  emotionResults.sort((a, b) => b.intensity - a.intensity);

  const emotionalTrajectory = calculateEmotionalTrajectory(emotionMatches, words.length);

  logger.debug('[Emotion Analysis] About to calculate complexity:', {
    emotionResultsLength: emotionResults.length,
    emotionResults: emotionResults.map(e => ({
      emotion: e.emotion,
      intensity: e.intensity,
      valence: e.valence
    }))
  });

  const emotionalComplexity = calculateEmotionalComplexity(emotionResults);
  logger.debug('[Emotion Analysis] Complexity calculated:', {
    emotionalComplexity,
    isNaN: isNaN(emotionalComplexity)
  });

  // Calculate valence balance
  const valenceBalance = calculateValenceBalance(emotionResults);

  const dominantCognitiveDomain = getDominantCognitiveDomain(emotionResults);

  // Calculate overall arousal
  const overallArousal = calculateOverallArousal(emotionResults);

  const result = {
    primaryEmotion: emotionResults[0] || createNeutralEmotion(language),
    secondaryEmotions: emotionResults.slice(1, 4), // Top 3 secondary emotions
    emotionalComplexity,
    valenceBalance,
    emotionalTrajectory,
    dominantCognitiveDomain,
    overallArousal
  };

  logger.debug('[Emotion Analysis] Analysis completed:', {
    totalMatches: emotionMatches.length,
    emotionResults: emotionResults.length,
    primaryEmotion: result.primaryEmotion.emotion,
    secondaryEmotions: result.secondaryEmotions.map(e => e.emotion),
    complexity: emotionalComplexity,
    valenceBalance,
    arousal: overallArousal
  });

  return result;
}

/**
 * Calculate confidence score for emotion detection
 */
function calculateEmotionConfidence(count: number, intensity: number, uniqueWords: number): number {
  let confidence = Math.min(count * 15, 50);

  // Intensity bonus
  confidence += intensity * 30;

  // Unique word diversity bonus
  confidence += Math.min(uniqueWords * 5, 20);

  return Math.min(confidence, 100);
}

/**
 * Get evidence level from confidence score
 */
function getEvidenceLevel(confidence: number): 'low' | 'medium' | 'high' {
  if (confidence >= 70) return 'high';
  if (confidence >= 45) return 'medium';
  return 'low';
}

/**
 * Get emotion label with language support
 */
function getEmotionLabel(emotionType: string, language: string = 'tr'): string {
  if (language === 'en') {
    const labelsEn: Record<string, string> = {
      'joy': 'Joy',
      'sadness': 'Sadness',
      'fear': 'Fear',
      'anger': 'Anger',
      'surprise': 'Surprise',
      'disgust': 'Disgust',
      'anticipation': 'Anticipation',
      'trust': 'Trust',
      'love': 'Love',
      'neutral': 'Neutral',
      'awareness': 'Awareness',
      'memory': 'Memory',
      'learning': 'Learning',
      'comprehension': 'Comprehension',
      'confusion': 'Confusion',
      'analysis': 'Analysis',
      'anxiety': 'Anxiety',
      'existential_anxiety': 'Existential Anxiety',
      'awe_fear': 'Awe & Fear',
      'awe': 'Awe',
      'curiosity': 'Curiosity',
      'conflict': 'Conflict',
      'longing': 'Longing',
      'vulnerability': 'Vulnerability',
      'hope': 'Hope',
      'nostalgia': 'Nostalgia',
      'melancholy': 'Melancholy',
      'shame': 'Shame',
      'guilt': 'Guilt',
      'loneliness': 'Loneliness',
      'alienation': 'Alienation',
      'dread': 'Dread',
      'relief': 'Relief',
      'öfke': 'Anger',
      'korku': 'Fear'
    };
    return labelsEn[emotionType] || emotionType.charAt(0).toUpperCase() + emotionType.slice(1);
  }

  // Turkish labels (default)
  const labelsTr: Record<string, string> = {
    'joy': 'sevinç',
    'sadness': 'üzüntü',
    'fear': 'korku',
    'anger': 'öfke',
    'surprise': 'şaşkınlık',
    'disgust': 'tiksinti',
    'anticipation': 'beklenti',
    'trust': 'güven',
    'love': 'sevgi',
    'neutral': 'nötr',
    'awareness': 'farkındalık',
    'memory': 'hafıza',
    'learning': 'öğrenme',
    'comprehension': 'anlayış',
    'confusion': 'karışıklık',
    'analysis': 'analiz',
    'anxiety': 'kaygı',
    'existential_anxiety': 'varoluşsal kaygı',
    'awe_fear': 'huşu korkusu',
    'awe': 'huşu',
    'curiosity': 'merak',
    // New subtle emotions
    'conflict': 'çatışma',
    'longing': 'özlem',
    'vulnerability': 'kırılganlık',
    'hope': 'umut',
    'nostalgia': 'nostalji',
    'melancholy': 'melankoli',
    'shame': 'utanç',
    'guilt': 'suçluluk',
    'loneliness': 'yalnızlık',
    'alienation': 'yabancılaşma',
    'dread': 'dehşet',
    'relief': 'rahatlama',
    'öfke': 'öfke',
    'korku': 'korku'
  };

  return labelsTr[emotionType] || emotionType;
}

/**
 * Get emotion emoji
 */
function getEmotionEmoji(emotionType: string): string {
  const emojis: Record<string, string> = {
    joy: '😊',
    sadness: '😢',
    fear: '😨',
    anger: '😠',
    surprise: '😲',
    disgust: '🤢',
    anticipation: '🤔',
    trust: '🤝',
    love: '❤️',
    neutral: '😐',
    awareness: '🧠',
    memory: '🧠',
    learning: '📘',
    comprehension: '🧩',
    confusion: '❓',
    analysis: '📊',
    anxiety: '😰',
    awe_fear: '😱',
    awe: '🌀',
    existential_anxiety: '🫨',
    curiosity: '🤨',
    // New subtle emotions
    conflict: '⚔️',
    longing: '🌙',
    vulnerability: '🥀',
    hope: '🌅',
    nostalgia: '🕰️',
    melancholy: '🌧️',
    shame: '😳',
    guilt: '😔',
    loneliness: '🌑',
    alienation: '👤',
    dread: '🌩️',
    relief: '😌',
    hayranlik: '🌀',
    varolus_kaygi: '🫨',
    öfke: '😠',
    korku: '😨'
  };

  const normalized = normalizeEmotionKey(emotionType);
  return emojis[normalized] || emojis[emotionType] || '🎭';
}

/**
 * Calculate arousal level for emotion type
 */
function calculateArousal(emotionType: string, intensity: number): number {
  const arousalLevels: Record<string, number> = {
    'fear': 0.9,
    'anger': 0.8,
    'joy': 0.7,
    'surprise': 0.6,
    'anticipation': 0.5,
    'curiosity': 0.5,
    'confusion': 0.4,
    'disgust': 0.4,
    'sadness': 0.3,
    'trust': 0.2,
    'neutral': 0.1
  };

  const baseArousal = arousalLevels[emotionType] || 0.3;
  return Math.min(baseArousal * intensity, 1.0);
}

/**
 * Get most common domain from set
 */
function getMostCommonDomain(domains: Set<string>): string {
  return Array.from(domains)[0] || 'general';
}

/**
 * Get most common valence from array
 */
function getMostCommonValence(valences: string[]): 'pos' | 'neg' | 'neu' {
  const counts = valences.reduce((acc, v) => {
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostCommon = Object.entries(counts)
    .sort(([,a], [,b]) => b - a)[0];

  return (mostCommon ? mostCommon[0] : 'neu') as 'pos' | 'neg' | 'neu';
}

/**
 * Calculate emotional trajectory through text
 */
function calculateEmotionalTrajectory(
  matches: Array<{position: number; emotion: string; intensity: number}>,
  totalWords: number
): Array<{position: number; emotion: string; intensity: number}> {
  // Group by position ranges (10% chunks)
  const chunks = new Array(10).fill(0).map((_, i) => ({
    position: i * 10 + 5, // Middle of chunk
    emotions: [] as Array<{emotion: string; intensity: number}>
  }));

  matches.forEach(match => {
    const chunkIndex = Math.floor(match.position / 10);
    if (chunkIndex < chunks.length) {
      chunks[chunkIndex].emotions.push({
        emotion: match.emotion,
        intensity: match.intensity
      });
    }
  });

  return chunks
    .filter(chunk => chunk.emotions.length > 0)
    .map(chunk => {
      const emotionCounts = new Map<string, {count: number; totalIntensity: number}>();

      chunk.emotions.forEach(e => {
        if (!emotionCounts.has(e.emotion)) {
          emotionCounts.set(e.emotion, {count: 0, totalIntensity: 0});
        }
        const entry = emotionCounts.get(e.emotion)!;
        entry.count++;
        entry.totalIntensity += e.intensity;
      });

      const dominantEmotion = Array.from(emotionCounts.entries())
        .sort((a, b) => b[1].totalIntensity - a[1].totalIntensity)[0];

      return {
        position: chunk.position,
        emotion: dominantEmotion[0],
        intensity: Math.round(dominantEmotion[1].totalIntensity / dominantEmotion[1].count * 100)
      };
    });
}

/**
 * Calculate emotional complexity score.
 * Formula: variety (emotion count * 10, max 40) +
 * intensity spread (variance/10, max 30) +
 * valence diversity (distinct valence types * 10, max 30) → capped at 100.
 */
function calculateEmotionalComplexity(emotions: EmotionResult[]): number {
  // Factors: number of emotions, intensity variance, valence mixing
  const numEmotions = emotions.length;
  const intensityVariance = calculateVariance(emotions.map(e => e.intensity));
  const valenceTypes = new Set(emotions.map(e => e.valence)).size;

  let complexity = 0;
  complexity += Math.min(numEmotions * 10, 40); // Max 40 for variety
  complexity += Math.min(intensityVariance / 10, 30); // Max 30 for intensity spread
  complexity += valenceTypes * 10; // Max 30 for mixed valences

  return Math.min(complexity, 100);
}

/**
 * Calculate valence balance
 */
function calculateValenceBalance(emotions: EmotionResult[]): {positive: number; negative: number; neutral: number} {
  if (!emotions.length) {
    return {positive: 0, negative: 0, neutral: 100};
  }

  let positive = 0;
  let negative = 0;
  let neutral = 0;

  emotions.forEach(emotion => {
    const weights = getEmotionValenceWeights(emotion);
    const intensityWeight = Math.max(1, emotion.intensity);

    positive += intensityWeight * weights.positive;
    negative += intensityWeight * weights.negative;
    neutral += intensityWeight * weights.neutral;
  });

  const total = positive + negative + neutral;
  if (total <= 0) {
    return {positive: 0, negative: 0, neutral: 100};
  }

  let positivePct = (positive / total) * 100;
  let negativePct = (negative / total) * 100;
  let neutralPct = (neutral / total) * 100;

  const sumPct = positivePct + negativePct + neutralPct;
  if (sumPct > 0) {
    const factor = 100 / sumPct;
    positivePct *= factor;
    negativePct *= factor;
    neutralPct *= factor;
  }

  const rounded = [
    Number(positivePct.toFixed(2)),
    Number(negativePct.toFixed(2)),
    Number(neutralPct.toFixed(2)),
  ];
  const correction = Number((100 - (rounded[0] + rounded[1] + rounded[2])).toFixed(2));
  if (correction !== 0) {
    const maxIndex = rounded.indexOf(Math.max(...rounded));
    rounded[maxIndex] = Number((rounded[maxIndex] + correction).toFixed(2));
  }

  return {positive: rounded[0], negative: rounded[1], neutral: rounded[2]};
}

/**
 * Get dominant cognitive domain
 */
function getDominantCognitiveDomain(emotions: EmotionResult[]): string {
  const domainWeights = new Map<string, number>();

  emotions.forEach(emotion => {
    const weight = emotion.intensity * emotion.confidence / 100;
    domainWeights.set(emotion.cognitive_domain,
      (domainWeights.get(emotion.cognitive_domain) || 0) + weight);
  });

  const dominantDomain = Array.from(domainWeights.entries())
    .sort((a, b) => b[1] - a[1])[0];

  return dominantDomain ? dominantDomain[0] : 'general';
}

/**
 * Calculate overall arousal level.
 * Weighted average of per-emotion arousal values where weights combine
 * intensity (0-100) and confidence (0-100) → both normalized to keep the result in [0,1].
 */
function calculateOverallArousal(emotions: EmotionResult[]): number {
  if (emotions.length === 0) return 0;

  const weightedArousal = emotions.reduce((sum, emotion) => {
    return sum + (emotion.arousal * emotion.intensity * emotion.confidence / 10000);
  }, 0);

  const totalWeight = emotions.reduce((sum, emotion) => {
    return sum + (emotion.intensity * emotion.confidence / 10000);
  }, 0);

  return totalWeight > 0 ? weightedArousal / totalWeight : 0;
}

/**
 * Calculate variance of array
 */
function calculateVariance(numbers: number[]): number {
  if (numbers.length === 0) return 0;

  const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;

  return variance;
}

/**
 * Create neutral emotion for fallback
 */
function createNeutralEmotion(language: string = 'tr'): EmotionResult {
  return {
    emotion: language === 'en' ? 'Neutral' : 'nötr',
    emoji: '😐',
    intensity: 30,
    confidence: 20,
    evidence_level: 'low',
    evidence_words: [],
    cognitive_domain: 'general',
    valence: 'neu',
    arousal: 0.1
  };
}
