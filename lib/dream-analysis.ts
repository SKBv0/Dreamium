import themes from './themes.json'
import placesData from './places.json'
import actionsData from './actions.json'
import affectLexicon from './affect_lexicon.json'
import { translateThemeName, type Language } from './translations'

export interface AnalyzedTheme {
  name: string;
  count: number;
  matches: string[];
  emoji: string;
  color: string;
  description: string;
  source: string;
  weight: number;
}

export interface AnalyzedAction {
  action: string;
  type: string;
  valence: string;
  count: number;
  psychological_meaning: string;
}

export interface AnalyzedPlace {
  place: string;
  type: string;
  valence: string;
  count: number;
  psychological_meaning: string;
}

export interface AnalyzedEmotion {
  emotion: string;
  type: string;
  valence: string;
  intensity: number;
  count: number;
}

export interface HallVdCMetrics {
  characters: {
    total: number;
    male: number;
    female: number;
    unknown: number;
    familiar: number;
    unfamiliar: number;
  };
  socialInteractions: {
    friendly: number;
    aggressive: number;
    sexual: number;
  };
  emotions: {
    positive: number;
    negative: number;
    neutral: number;
  };
  activities: {
    physical: number;
    verbal: number;
    cognitive: number;
  };
  aggression: {
    physical: number;
    nonPhysical: number;
    selfDirected: number;
  };
  settings: {
    indoor: number;
    outdoor: number;
    familiar: number;
    unfamiliar: number;
  };
  outcome: string;
}

export interface DreamAnalysisResult {
  themes: AnalyzedTheme[];
  actions: AnalyzedAction[];
  places: AnalyzedPlace[];
  emotions: AnalyzedEmotion[];
  metrics: HallVdCMetrics;
  dominantThemes: string[];
  emotionalTone: string;
  dominantEmotions: string[];
  jungianArchetypes: string[];
  psychologicalSummary: string;
}

/**
 * Main function to analyze dream content
 */
export function analyzeDream(dreamText: string, language: Language = 'en'): DreamAnalysisResult {
  const cleanText = preprocessText(dreamText);
  const words = cleanText.split(/\s+/);
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  const extractedThemes = extractThemes(cleanText, language);
  const extractedActions = extractActions(cleanText, words);
  const extractedPlaces = extractPlaces(cleanText, words);
  const extractedEmotions = extractEmotions(cleanText, sentences);
  
  const hallVdCMetrics = calculateHallVdCMetrics(
    cleanText, 
    extractedThemes, 
    extractedActions, 
    extractedPlaces, 
    extractedEmotions
  );
  
  const dominantThemes = getDominantThemes(extractedThemes);
  
  const emotionalTone = getEmotionalTone(extractedEmotions);
  
  const dominantEmotions = getDominantEmotions(extractedEmotions);
  
  const jungianArchetypes = identifyJungianArchetypes(cleanText, extractedThemes, extractedActions);
  
  const psychologicalSummary = generatePsychologicalSummary(
    extractedThemes,
    extractedActions,
    extractedPlaces,
    extractedEmotions,
    hallVdCMetrics,
    dominantThemes,
    emotionalTone,
    jungianArchetypes
  );
  
  return {
    themes: extractedThemes,
    actions: extractedActions,
    places: extractedPlaces,
    emotions: extractedEmotions,
    metrics: hallVdCMetrics,
    dominantThemes,
    emotionalTone,
    dominantEmotions,
    jungianArchetypes,
    psychologicalSummary
  };
}

/**
 * Preprocess dream text for analysis
 */
function preprocessText(text: string): string {
  let cleanText = text.toLowerCase();
  
  cleanText = cleanText.replace(/\s+/g, ' ').trim();
  
  cleanText = cleanText.replace(/[^\w\s.!?,öçşığüÖÇŞİĞÜ]/g, '');
  
  return cleanText;
}

/**
 * Extract themes from dream text
 */
function extractThemes(text: string, language: Language = 'en'): AnalyzedTheme[] {
  const extractedThemes: AnalyzedTheme[] = [];

  themes.forEach((theme: any) => {
    const regex = new RegExp(theme.regex, 'gi');
    const matches = text.match(regex);

    if (matches && matches.length > 0) {
      // Context check: If single match and context is not related to theme, don't add
      const contextValid = validateThemeContext(theme.name, matches, text);

      if (contextValid) {
        extractedThemes.push({
          name: translateThemeName(theme.name, language),
          count: matches.length,
          matches: [...new Set(matches)],
          emoji: theme.emoji,
          color: theme.color,
          description: theme.description,
          source: theme.source,
          weight: theme.weight
        });
      }
    }
  });

  // Sort by count * weight
  return extractedThemes.sort((a, b) => (b.count * b.weight) - (a.count * a.weight));
}

/**
 * Validate theme context with more permissive rules
 * Previous version was too strict, causing valid themes to be rejected
 */
function validateThemeContext(themeName: string, matches: string[], text: string): boolean {
  if (matches.length >= 2) return true;

  const singleMatch = matches[0].toLowerCase();
  const textLower = text.toLowerCase();

  const matchIndex = textLower.indexOf(singleMatch);
  if (matchIndex === -1) return true; // Couldn't find match, allow it

  const contextBefore = textLower.substring(Math.max(0, matchIndex - 10), matchIndex);
  const contextAfter = textLower.substring(matchIndex + singleMatch.length, matchIndex + singleMatch.length + 15);

  const negationWords = ['değil', 'yok', 'hiç', 'asla', 'not', 'no', 'never'];
  const hasNegation = negationWords.some(neg =>
    contextBefore.includes(neg) || contextAfter.includes(neg)
  );

  return !hasNegation;
}

/**
 * Extract actions from dream text
 */
function extractActions(text: string, words: string[]): AnalyzedAction[] {
  const extractedActions: AnalyzedAction[] = [];
  const actionCounts: Record<string, number> = {};
  
  words.forEach(word => {
    Object.entries(actionsData).forEach(([category, actions]) => {
      Object.entries(actions as Record<string, any>).forEach(([action, details]) => {
        if (word === action || text.includes(` ${action} `)) {
          actionCounts[action] = (actionCounts[action] || 0) + 1;
          
          const existingAction = extractedActions.find(a => a.action === action);
          if (!existingAction) {
            extractedActions.push({
              action,
              type: details.type,
              valence: details.valence,
              count: actionCounts[action],
              psychological_meaning: details.psychological_meaning
            });
          } else {
            existingAction.count = actionCounts[action];
          }
        }
      });
    });
  });
  
  // Sort by count
  return extractedActions.sort((a, b) => b.count - a.count);
}

/**
 * Extract places from dream text
 */
function extractPlaces(text: string, words: string[]): AnalyzedPlace[] {
  const extractedPlaces: AnalyzedPlace[] = [];
  const placeCounts: Record<string, number> = {};
  
  words.forEach(word => {
    Object.entries(placesData).forEach(([category, places]) => {
      Object.entries(places as Record<string, any>).forEach(([place, details]) => {
        if (word === place || text.includes(` ${place} `)) {
          placeCounts[place] = (placeCounts[place] || 0) + 1;
          
          const existingPlace = extractedPlaces.find(p => p.place === place);
          if (!existingPlace) {
            extractedPlaces.push({
              place,
              type: details.type,
              valence: details.valence,
              count: placeCounts[place],
              psychological_meaning: details.psychological_meaning
            });
          } else {
            existingPlace.count = placeCounts[place];
          }
        }
      });
    });
  });
  
  // Sort by count
  return extractedPlaces.sort((a, b) => b.count - a.count);
}

/**
 * Extract emotions considering negations and intensifiers
 */
function extractEmotions(text: string, sentences: string[]): AnalyzedEmotion[] {
  const extractedEmotions: AnalyzedEmotion[] = [];
  const emotionCounts: Record<string, {count: number, intensity: number}> = {};
  
  sentences.forEach(sentence => {
    let negated = false;
    let intensifier = 1;
    
    Object.keys(affectLexicon.negators).forEach(negator => {
      if (sentence.includes(` ${negator} `) || sentence.startsWith(negator)) {
        negated = true;
      }
    });
    
    Object.entries(affectLexicon.intensifiers).forEach(([intensifierWord, value]) => {
      if (sentence.includes(` ${intensifierWord} `) || sentence.startsWith(intensifierWord)) {
        intensifier = value as number;
      }
    });
    
    Object.entries(affectLexicon.positive).forEach(([emotion, details]) => {
      if (sentence.includes(` ${emotion} `) || sentence.includes(` ${emotion}.`) || sentence.includes(` ${emotion},`) || sentence.startsWith(emotion)) {
        const emotionType = negated ? 'negative' : 'positive';
        const valence = negated ? 'neg' : 'pos';
        const emotionKey = `${emotion}_${emotionType}`;
        
        if (!emotionCounts[emotionKey]) {
          emotionCounts[emotionKey] = { count: 0, intensity: (details as any).intensity * intensifier };
        }
        
        emotionCounts[emotionKey].count += 1;
      }
    });
    
    Object.entries(affectLexicon.negative).forEach(([emotion, details]) => {
      if (sentence.includes(` ${emotion} `) || sentence.includes(` ${emotion}.`) || sentence.includes(` ${emotion},`) || sentence.startsWith(emotion)) {
        const emotionType = negated ? 'positive' : 'negative';
        const valence = negated ? 'pos' : 'neg';
        const emotionKey = `${emotion}_${emotionType}`;
        
        if (!emotionCounts[emotionKey]) {
          emotionCounts[emotionKey] = { count: 0, intensity: (details as any).intensity * intensifier };
        }
        
        emotionCounts[emotionKey].count += 1;
      }
    });
    
    Object.entries(affectLexicon.neutral).forEach(([emotion, details]) => {
      if (sentence.includes(` ${emotion} `) || sentence.includes(` ${emotion}.`) || sentence.includes(` ${emotion},`) || sentence.startsWith(emotion)) {
        const emotionType = 'neutral';
        const valence = 'neu';
        const emotionKey = `${emotion}_${emotionType}`;
        
        if (!emotionCounts[emotionKey]) {
          emotionCounts[emotionKey] = { count: 0, intensity: (details as any).intensity * intensifier };
        }
        
        emotionCounts[emotionKey].count += 1;
      }
    });
  });
  
  Object.entries(emotionCounts).forEach(([key, value]) => {
    const [emotion, type] = key.split('_');
    const valence = type === 'positive' ? 'pos' : (type === 'negative' ? 'neg' : 'neu');
    
    extractedEmotions.push({
      emotion,
      type,
      valence,
      intensity: value.intensity,
      count: value.count
    });
  });
  
  return extractedEmotions.sort((a, b) => (b.count * b.intensity) - (a.count * a.intensity));
}

/**
 * Calculate Hall-Van de Castle metrics for dream content analysis
 */
function calculateHallVdCMetrics(
  text: string,
  themes: AnalyzedTheme[],
  actions: AnalyzedAction[],
  places: AnalyzedPlace[],
  emotions: AnalyzedEmotion[]
): HallVdCMetrics {
  const metrics: HallVdCMetrics = {
    characters: { total: 0, male: 0, female: 0, unknown: 0, familiar: 0, unfamiliar: 0 },
    socialInteractions: { friendly: 0, aggressive: 0, sexual: 0 },
    emotions: { positive: 0, negative: 0, neutral: 0 },
    activities: { physical: 0, verbal: 0, cognitive: 0 },
    aggression: { physical: 0, nonPhysical: 0, selfDirected: 0 },
    settings: { indoor: 0, outdoor: 0, familiar: 0, unfamiliar: 0 },
    outcome: 'neutral'
  };
  
  emotions.forEach(emotion => {
    if (emotion.valence === 'pos') {
      metrics.emotions.positive += emotion.count;
    } else if (emotion.valence === 'neg') {
      metrics.emotions.negative += emotion.count;
    } else {
      metrics.emotions.neutral += emotion.count;
    }
  });
  
  actions.forEach(action => {
    if (['Movement_action', 'Falling_action', 'Water_action'].includes(action.type)) {
      metrics.activities.physical += action.count;
    } else if (['Communication_action'].includes(action.type)) {
      metrics.activities.verbal += action.count;
    } else if (['Perception_action', 'Search_action'].includes(action.type)) {
      metrics.activities.cognitive += action.count;
    }
    
    if (['Comfort_action', 'Intimacy_action', 'Love_action'].includes(action.type)) {
      metrics.socialInteractions.friendly += action.count;
    } else if (['Conflict_action', 'Escape_action'].includes(action.type)) {
      metrics.socialInteractions.aggressive += action.count;
    }
    
    if (['Conflict_action'].includes(action.type)) {
      metrics.aggression.physical += action.count;
    }
  });
  
  places.forEach(place => {
    if (['Home_place', 'School_place', 'Work_place', 'Medical_place'].includes(place.type)) {
      metrics.settings.indoor += place.count;
      metrics.settings.familiar += place.count;
    } else if (['Nature_place', 'Water_place'].includes(place.type)) {
      metrics.settings.outdoor += place.count;
    }
  });
  
  const positiveRatio = metrics.emotions.positive / 
    (metrics.emotions.positive + metrics.emotions.negative + metrics.emotions.neutral || 1);
  
  if (positiveRatio > 0.6) {
    metrics.outcome = 'positive';
  } else if (positiveRatio < 0.4) {
    metrics.outcome = 'negative';
  } else {
    metrics.outcome = 'neutral';
  }
  
  return metrics;
}

/**
 * Get dominant themes from analyzed themes
 */
function getDominantThemes(themes: AnalyzedTheme[]): string[] {
  if (themes.length === 0) return [];
  
  return themes.slice(0, Math.min(3, themes.length)).map(theme => theme.name);
}

/**
 * Get emotional tone from analyzed emotions
 */
function getEmotionalTone(emotions: AnalyzedEmotion[]): string {
  if (emotions.length === 0) return 'Neutral';
  
  // Count valence types
  const valenceCounts = emotions.reduce((counts, emotion) => {
    counts[emotion.valence] = (counts[emotion.valence] || 0) + (emotion.count * emotion.intensity);
    return counts;
  }, {} as Record<string, number>);
  
  const totalIntensity = Object.values(valenceCounts).reduce((sum, count) => sum + count, 0);
  const posRatio = (valenceCounts['pos'] || 0) / totalIntensity;
  const negRatio = (valenceCounts['neg'] || 0) / totalIntensity;
  
  if (posRatio > 0.6) return 'Positive';
  if (negRatio > 0.6) return 'Negative';
  if (posRatio > negRatio) return 'Mixed (Positive Leaning)';
  if (negRatio > posRatio) return 'Mixed (Negative Leaning)';
  return 'Balanced';
}

/**
 * Get dominant emotions from analyzed emotions
 */
function getDominantEmotions(emotions: AnalyzedEmotion[]): string[] {
  if (emotions.length === 0) return [];
  
  const emotionsByType = emotions.reduce((grouped, emotion) => {
    if (!grouped[emotion.type]) {
      grouped[emotion.type] = { type: emotion.type, totalIntensity: 0 };
    }
    grouped[emotion.type].totalIntensity += (emotion.count * emotion.intensity);
    return grouped;
  }, {} as Record<string, {type: string, totalIntensity: number}>);
  
  return Object.values(emotionsByType)
    .sort((a, b) => b.totalIntensity - a.totalIntensity)
    .slice(0, 3)
    .map(item => item.type);
}

/**
 * Identify Jungian archetypes in dream content
 */
function identifyJungianArchetypes(
  text: string,
  themes: AnalyzedTheme[],
  actions: AnalyzedAction[]
): string[] {
  const archetypes: string[] = [];
  const lowerText = text.toLowerCase();

  if (
    themes.some(t => ['Korku', 'Gölge', 'Fear', 'Shadow'].includes(t.name)) ||
    actions.some(a => ['kaçmak', 'korkmak', 'escape', 'fear', 'flee', 'run away'].includes(a.action)) ||
    /\b(shadow|dark|fear|unknown|hidden|secret)\b/i.test(lowerText)
  ) {
    archetypes.push('Gölge');
  }

  if (
    themes.some(t => ['Dönüşüm', 'Özgürlük', 'Transformation', 'Freedom'].includes(t.name)) ||
    text.includes('bütün') || text.includes('tam') || text.includes('daire') ||
    /\b(whole|complete|circle|unity|integration|self)\b/i.test(lowerText)
  ) {
    archetypes.push('Benlik');
  }

  if (
    themes.some(t => ['İlişkiler', 'Relationships', 'Love'].includes(t.name)) ||
    actions.some(a => ['sevmek', 'öpmek', 'love', 'kiss', 'embrace'].includes(a.action)) ||
    /\b(romantic|lover|beloved|attraction|feminine|masculine)\b/i.test(lowerText)
  ) {
    archetypes.push('Anima/Animus');
  }

  if (
    text.includes('yaşlı') || text.includes('bilge') || text.includes('öğretmen') ||
    text.includes('rehber') || text.includes('tavsiye') ||
    /\b(elderly|wise|teacher|mentor|guide|advisor|counsel|sage|professor|instructor)\b/i.test(lowerText)
  ) {
    archetypes.push('Bilge Yaşlı');
  }

  if (
    text.includes('şaka') || text.includes('kandır') || text.includes('kural') ||
    text.includes('aldatmak') || text.includes('oyun') ||
    /\b(joke|trick|deceive|mischief|prank|fool|cheat|rule|break|chaos)\b/i.test(lowerText)
  ) {
    archetypes.push('Hilebaz');
  }

  if (
    themes.some(t => ['Güç', 'Arayış', 'Power', 'Quest', 'Journey'].includes(t.name)) ||
    actions.some(a => ['kurtarmak', 'savaşmak', 'tırmanmak', 'rescue', 'save', 'fight', 'battle', 'climb'].includes(a.action)) ||
    /\b(quest|journey|rescue|save|challenge|overcome|victory|conquer)\b/i.test(lowerText)
  ) {
    archetypes.push('Kahraman');
  }

  if (
    text.includes('anne') || text.includes('doğum') || text.includes('beslemek') ||
    actions.some(a => ['büyümek', 'grow', 'nurture', 'feed'].includes(a.action)) ||
    /\b(mother|birth|nurture|care|protect|nature|earth|womb|feed)\b/i.test(lowerText)
  ) {
    archetypes.push('Büyük Anne');
  }

  return archetypes;
}

/**
 * Generate psychological summary based on all analyzed components
 */
function generatePsychologicalSummary(
  themes: AnalyzedTheme[],
  actions: AnalyzedAction[],
  places: AnalyzedPlace[],
  emotions: AnalyzedEmotion[],
  metrics: HallVdCMetrics,
  dominantThemes: string[],
  emotionalTone: string,
  jungianArchetypes: string[]
): string {
  // Build summary
  let summary = '';
  
  if (dominantThemes.length > 0) {
    summary += `Rüyanız esas olarak ${dominantThemes.join(', ')} temalarını içeriyor. `;
  }
  
  summary += `Duygusal tonu genellikle ${emotionalTone.toLowerCase()}. `;
  
  if (places.length > 0) {
    const mainPlace = places[0];
    summary += `Rüyanın ${mainPlace.place} ortamında geçmesi, ${mainPlace.psychological_meaning} ile ilişkili olabilir. `;
  }
  
  if (actions.length > 0) {
    const mainAction = actions[0];
    summary += `Rüyada "${mainAction.action}" eyleminin öne çıkması, ${mainAction.psychological_meaning} göstergesi olabilir. `;
  }
  
  if (jungianArchetypes.length > 0) {
    summary += `Jungcu bakış açısından, rüyanızda ${jungianArchetypes.join(', ')} arketipleri belirgin. `;
  }
  
  summary += `Hall-VdC analizi, rüyanın ${metrics.outcome} bir sonuçla tamamlandığını gösteriyor. `;
  
  if (themes.some(t => t.name === 'Korku' || t.name === 'Tehlike')) {
    summary += `Revonsuo'nun (2000) Tehdit Simülasyonu Teorisi'ne göre, bu tür rüyalar evrimsel olarak tehlikeli durumları prova etme işlevi görebilir. `;
  }
  
  if (metrics.emotions.positive > metrics.emotions.negative) {
    summary += `Walker ve Van der Helm'in (2009) çalışmalarına göre, pozitif duygusal içerikli rüyalar duygu düzenleme süreçlerine katkıda bulunabilir.`;
  } else {
    summary += `Hartmann'ın (2011) çalışmaları, negatif duygusal içerikli rüyaların travmatik veya güçlü deneyimleri işlemeye yardımcı olabileceğini göstermektedir.`;
  }
  
  return summary;
} 

export async function processDreamAnalysis(data: any, dreamText: string) {

  let processedData = JSON.parse(JSON.stringify(data));
  
  if (processedData.analysis && processedData.analysis.structuredInsights) {
    processedData.analysis.structuredInsights = processedData.analysis.structuredInsights.map((insight: any) => {
      if (insight.content && Array.isArray(insight.content)) {
        insight.content = insight.content.map((text: string) => {
          return resolveVariableReferences(text, processedData.analysis);
        });
      }
      return insight;
    });
  }
  
  if (processedData.analysis && processedData.analysis.insights && Array.isArray(processedData.analysis.insights)) {
    processedData.analysis.insights = processedData.analysis.insights.map((text: string) => {
      return resolveVariableReferences(text, processedData.analysis);
    });
  }
  
  return processedData;
}

function resolveVariableReferences(text: string, analysisData: any): string {
  if (!text) return text;
  
  text = text.replace(/themes\.labels\.([\w_]+)/g, (match, themeName) => {
    if (analysisData.themes && Array.isArray(analysisData.themes)) {
      // Find theme by theme name
      const theme = analysisData.themes.find((t: any) => t.theme === themeName);
      if (theme) {
        return theme.theme; // Return theme name
      }
    }
    return themeName;
  });
  
  text = text.replace(/themes\.explanations\.([\w_]+)/g, (match, themeName) => {
    if (analysisData.themes && Array.isArray(analysisData.themes)) {
      // Find theme by theme name
      const theme = analysisData.themes.find((t: any) => t.theme === themeName);
      if (theme) {
        return theme.description || themeName;
      }
    }
    return `${themeName} explanation`; // Return default text if theme not found
  });
  
  // Resolve emotions.labels.X references
  text = text.replace(/emotions\.labels\.([\w_]+)/g, (match, emotionName) => {
    if (analysisData.emotions) {
      // Find emotion name
      const emotion = Object.entries(analysisData.emotions).find(([key]) => key === emotionName);
      if (emotion && emotion[1] && typeof emotion[1] === 'object') {
        const emotionData = emotion[1] as { translatedName?: string };
        return emotionData.translatedName || emotionName;
      }
    }
    return emotionName; // Return original name if emotion not found
  });
  
  text = text.replace(/emotions\.explanations\.([\w_]+)/g, (match, emotionName) => {
    if (analysisData.emotions) {
      // Find emotion explanation
      const emotion = Object.entries(analysisData.emotions).find(([key]) => key === emotionName);
      if (emotion && emotion[1] && typeof emotion[1] === 'object') {
        const emotionData = emotion[1] as { intensity?: number };
        // Return explanation (or default text)
        return `${emotionName} emotion intensity: ${emotionData.intensity || 0}%`;
      }
    }
    return `${emotionName} emotion explanation`; // Return default text if emotion not found
  });
  
  text = text.replace(/aiResponse\.recommendations\.themes\.([\w_]+)/g, (match, themeName) => {
    return `"${themeName}" teması için öneriler: Bu tema üzerinde düşünmek ve günlük hayatınızda nasıl ortaya çıktığını fark etmek önemli.`;
  });
  
  text = text.replace(/aiResponse\.recommendations\.emotions\.([\w_]+)/g, (match, emotionName) => {
    return `"${emotionName}" duygusu için öneriler: Bu duygunun günlük yaşamınızda nasıl ifade edildiğine dikkat edin.`;
  });
  
  return text;
} 
