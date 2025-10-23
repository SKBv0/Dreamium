import { analyzeBizarrenessSemantics } from './analysis/nlp/bizarreness-detector';
import { logger } from './logger';

export interface REMSleepMetrics {
  estimatedSleepStage: 'REM' | 'NREM' | 'unknown';
  dreamVividness: number; // 0-100 scale
  emotionalIntensity: number; // 0-100 scale
  bizarrenessScore: number; // 0-100 scale
  narrativeCoherence: number; // 0-100 scale
  memoryIncorporation: number; // 0-100 scale
  temporalDistortion: number; // 0-100 scale
}

export interface REMAnalysisResult {
  sleepStageEstimate: REMSleepMetrics;
  circadianFactors: {
    timeOfNight: 'early' | 'middle' | 'late' | 'unknown';
    remProbability: number; // 0-1
    dreamLikelihood: number; // 0-1
  };
  neuroscientificInsights: {
    prefrontalActivity: 'low' | 'moderate' | 'high';
    limbicActivation: 'low' | 'moderate' | 'high';
    acetylcholineLevel: 'low' | 'moderate' | 'high';
    dopamineActivity: 'low' | 'moderate' | 'high';
  };
  cognitiveProcessing: {
    memoryConsolidation: number; // 0-100
    emotionalProcessing: number; // 0-100
    creativeInsight: number; // 0-100
    problemSolving: number; // 0-100
  };
  recommendations: string[];
  scientificReferences: Array<{
    authors: string;
    year: number;
    title: string;
    journal: string;
    finding: string;
  }>;
}

/**
 * Analyze dream content for REM sleep patterns
 * Based on neurobiological sleep research
 */
export function analyzeREMPatterns(
  dreamText: string,
  reportTime?: string,
  emotionIntensity?: number,
  language: string = 'tr'
): REMAnalysisResult {

  const sleepStageEstimate = estimateSleepStage(dreamText, emotionIntensity);
  const circadianFactors = analyzeCircadianFactors(reportTime, sleepStageEstimate);
  const neuroscientificInsights = inferNeurobiologicalActivity(dreamText, sleepStageEstimate);
  const cognitiveProcessing = analyzeCognitiveProcessing(dreamText, sleepStageEstimate);
  const recommendations = generateREMRecommendations(sleepStageEstimate, circadianFactors, language);

  return {
    sleepStageEstimate,
    circadianFactors,
    neuroscientificInsights,
    cognitiveProcessing,
    recommendations,
    scientificReferences: getREMReferences()
  };
}

/**
 * Estimate sleep stage based on dream characteristics
 */
function estimateSleepStage(dreamText: string, emotionIntensity?: number): REMSleepMetrics {
  const words = dreamText.toLowerCase().split(/\s+/);
  const length = words.length;

  // REM indicators (bilingual)
  const remIndicators = [
    // Turkish
    'uçuyor', 'kaçıyor', 'renkli', 'tuhaf', 'garip', 'yabancı', 'değişiyor',
    'dönüştü', 'birden', 'aniden', 'ilginç', 'korku', 'heyecan',
    // English
    'flying', 'fleeing', 'colorful', 'strange', 'weird', 'bizarre', 'changing',
    'transformed', 'suddenly', 'abruptly', 'interesting', 'fear', 'excitement'
  ];

  // NREM indicators (bilingual)
  const nremIndicators = [
    // Turkish
    'ev', 'işyeri', 'tanıdık', 'normal', 'sıradan', 'günlük', 'basit',
    // English
    'home', 'work', 'familiar', 'normal', 'ordinary', 'daily', 'simple'
  ];

  const remCount = remIndicators.reduce((count, indicator) =>
    count + (words.filter(word => word.includes(indicator)).length), 0);

  const nremCount = nremIndicators.reduce((count, indicator) =>
    count + (words.filter(word => word.includes(indicator)).length), 0);

  // Bizarreness scoring using semantic NLP analysis
  // This replaces the old pattern-based approach with a more maintainable,
  // scalable semantic detection system
  const bizarrenessAnalysis = analyzeBizarrenessSemantics(dreamText);
  const bizarrenessScore = Math.round(bizarrenessAnalysis.total);

  // Vividness (detail and sensory content) - bilingual
  const sensoryWords = [
    // Turkish
    'gördüm', 'duydum', 'kokladım', 'dokundum', 'tattım', 'hissettim',
    // English
    'saw', 'heard', 'smelled', 'touched', 'tasted', 'felt', 'feeling', 'see', 'hear'
  ];
  const colorWords = [
    // Turkish
    'kırmızı', 'mavi', 'yeşil', 'sarı', 'mor', 'turuncu', 'siyah', 'beyaz',
    // English
    'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'black', 'white', 'gray', 'pink'
  ];

  // Vividness calculation: sensory words (70%) + bizarreness contribution (30%)
  // High bizarreness indicates vivid, memorable dream imagery
  const sensoryScore = sensoryWords.reduce((count, word) =>
    count + (dreamText.toLowerCase().includes(word) ? 10 : 0), 0) +
    colorWords.reduce((count, word) =>
      count + (dreamText.toLowerCase().includes(word) ? 5 : 0), 0) +
    Math.min(length / 2, 30); // Length bonus

  const vividnessScore = Math.round(
    Math.min((sensoryScore * 0.7) + (bizarrenessAnalysis.total * 0.3), 100));

  // Emotional intensity factor
  const baseEmotionalIntensity = Math.round(
    emotionIntensity || estimateEmotionalIntensity(dreamText));

  // Narrative coherence - bilingual
  const coherenceMarkers = [
    // Turkish
    'önce', 'sonra', 'ardından', 'daha sonra', 've', 'ama', 'çünkü',
    // English
    'before', 'after', 'then', 'later', 'and', 'but', 'because'
  ];
  const coherenceScore = Math.round(
    Math.min(
      coherenceMarkers.reduce((score, marker) =>
        score + (dreamText.toLowerCase().includes(marker) ? 8 : 0), 0) + 20, 100));

  // Memory incorporation (familiar elements) - bilingual
  const memoryElements = [
    // Turkish
    'ev', 'aile', 'arkadaş', 'iş', 'okul', 'araba', 'telefon',
    // English
    'home', 'house', 'family', 'friend', 'work', 'school', 'car', 'phone'
  ];
  const memoryScore = Math.round(
    Math.min(
      memoryElements.reduce((score, element) =>
        score + (dreamText.toLowerCase().includes(element) ? 12 : 0), 0) + 10, 100));

  // Temporal distortion - bilingual
  const timeDistortors = [
    // Turkish
    'birden', 'aniden', 'hızla', 'yavaş', 'dur', 'geç', 'erken',
    // English
    'suddenly', 'abruptly', 'quickly', 'slowly', 'stop', 'late', 'early'
  ];
  const temporalScore = Math.round(
    Math.min(
      timeDistortors.reduce((score, distortor) =>
        score + (dreamText.toLowerCase().includes(distortor) ? 15 : 0), 0), 100));

  // Determine most likely sleep stage
  const remScore = (remCount * 10) + bizarrenessScore + (vividnessScore * 0.5) + (baseEmotionalIntensity * 0.3);
  const nremScore = (nremCount * 10) + coherenceScore + (memoryScore * 0.5);

  let estimatedStage: 'REM' | 'NREM' | 'unknown' = 'unknown';
  if (remScore > nremScore && remScore > 30) {
    estimatedStage = 'REM';
  } else if (nremScore > 30) {
    estimatedStage = 'NREM';
  }

  return {
    estimatedSleepStage: estimatedStage,
    dreamVividness: vividnessScore,
    emotionalIntensity: baseEmotionalIntensity,
    bizarrenessScore,
    narrativeCoherence: coherenceScore,
    memoryIncorporation: memoryScore,
    temporalDistortion: temporalScore
  };
}

/**
 * Analyze circadian rhythm factors
 */
function analyzeCircadianFactors(
  reportTime?: string,
  sleepMetrics?: REMSleepMetrics
): {
  timeOfNight: 'early' | 'middle' | 'late' | 'unknown';
  remProbability: number;
  dreamLikelihood: number;
} {
  let timeOfNight: 'early' | 'middle' | 'late' | 'unknown' = 'unknown';
  let remProbability = 0; // Will be 0 if no time data (indicates unknown)
  let dreamLikelihood = 0; // Will be 0 if no time data (indicates unknown)

  logger.debug('[REM Analysis] analyzeCircadianFactors called:', {
    reportTime,
    hasReportTime: !!reportTime,
    reportTimeType: typeof reportTime
  });

  if (reportTime) {
    // Parse time from "HH:mm" format (e.g., "03:30") or ISO string
    let hour = 0;
    try {
      // Try HH:mm format first
      const timeParts = reportTime.split(':');
      if (timeParts.length === 2 && timeParts[0].length <= 2) {
        hour = parseInt(timeParts[0], 10);
        logger.debug('[REM Analysis] Parsed HH:mm format:', { reportTime, hour });
      } else {
        // Fallback: try ISO string or Date constructor
        const date = new Date(reportTime);
        if (!isNaN(date.getTime())) {
          hour = date.getHours();
          logger.debug('[REM Analysis] Parsed ISO time:', { reportTime, hour });
        } else {
          logger.warn('[REM Analysis] Failed to parse reportTime:', reportTime);
          return { timeOfNight: 'unknown', remProbability: 0, dreamLikelihood: 0 };
        }
      }
    } catch (error) {
      // If parsing fails, leave hour as 0 and timeOfNight as 'unknown'
      logger.warn('[REM Analysis] Failed to parse reportTime:', reportTime, error);
      return { timeOfNight: 'unknown', remProbability: 0, dreamLikelihood: 0 };
    }

    // Validate hour is in valid range
    if (isNaN(hour) || hour < 0 || hour > 23) {
      logger.warn('[REM Analysis] Invalid hour extracted:', hour, 'from', reportTime);
      return { timeOfNight: 'unknown', remProbability: 0, dreamLikelihood: 0 };
    }

    // Classify time of night based on typical sleep cycles
    if (hour >= 22 || hour <= 2) {
      timeOfNight = 'early';
      remProbability = 0.3; // Early sleep: more NREM
      dreamLikelihood = 0.4;
    } else if (hour >= 3 && hour <= 5) {
      timeOfNight = 'middle';
      remProbability = 0.6; // Middle of night: mixed
      dreamLikelihood = 0.7;
    } else if (hour >= 6 && hour <= 9) {
      timeOfNight = 'late';
      remProbability = 0.8; // Late sleep: more REM
      dreamLikelihood = 0.9;
    } else {
      // Daytime (9-22) - unusual dream report time
      timeOfNight = 'unknown';
      remProbability = 0.2;
      dreamLikelihood = 0.3;
    }

    // Adjust based on dream characteristics only if we have time data
    if (sleepMetrics?.estimatedSleepStage === 'REM') {
      remProbability = Math.min(remProbability + 0.2, 1.0);
      dreamLikelihood = Math.min(dreamLikelihood + 0.1, 1.0);
    } else if (sleepMetrics?.estimatedSleepStage === 'NREM') {
      remProbability = Math.max(remProbability - 0.2, 0.1);
      dreamLikelihood = Math.max(dreamLikelihood - 0.2, 0.2);
    }
  }
  // If no reportTime, timeOfNight remains 'unknown' and probabilities remain 0

  return {
    timeOfNight,
    remProbability: Math.round(remProbability * 100) / 100,
    dreamLikelihood: Math.round(dreamLikelihood * 100) / 100
  };
}

/**
 * Infer neurobiological activity patterns
 */
function inferNeurobiologicalActivity(
  dreamText: string,
  sleepMetrics: REMSleepMetrics
): {
  prefrontalActivity: 'low' | 'moderate' | 'high';
  limbicActivation: 'low' | 'moderate' | 'high';
  acetylcholineLevel: 'low' | 'moderate' | 'high';
  dopamineActivity: 'low' | 'moderate' | 'high';
} {

  // Prefrontal cortex activity (logical reasoning, reality testing)
  let prefrontalActivity: 'low' | 'moderate' | 'high' = 'low';
  if (sleepMetrics.narrativeCoherence > 70 && sleepMetrics.bizarrenessScore < 30) {
    prefrontalActivity = 'high';
  } else if (sleepMetrics.narrativeCoherence > 50) {
    prefrontalActivity = 'moderate';
  }

  // Limbic system activation (emotions, fear, memory)
  let limbicActivation: 'low' | 'moderate' | 'high' = 'low';
  if (sleepMetrics.emotionalIntensity > 70) {
    limbicActivation = 'high';
  } else if (sleepMetrics.emotionalIntensity > 40) {
    limbicActivation = 'moderate';
  }

  // Acetylcholine (REM sleep, vivid dreams)
  let acetylcholineLevel: 'low' | 'moderate' | 'high' = 'low';
  if (sleepMetrics.estimatedSleepStage === 'REM' && sleepMetrics.dreamVividness > 60) {
    acetylcholineLevel = 'high';
  } else if (sleepMetrics.dreamVividness > 40) {
    acetylcholineLevel = 'moderate';
  }

  // Dopamine (reward, motivation, bizarre content)
  let dopamineActivity: 'low' | 'moderate' | 'high' = 'low';
  const rewardWords = ['başarı', 'kazanmak', 'bulmak', 'sevgi', 'mutluluk'];
  const rewardContent = rewardWords.some(word => dreamText.toLowerCase().includes(word));

  if (sleepMetrics.bizarrenessScore > 60 || rewardContent) {
    dopamineActivity = 'high';
  } else if (sleepMetrics.bizarrenessScore > 30) {
    dopamineActivity = 'moderate';
  }

  return {
    prefrontalActivity,
    limbicActivation,
    acetylcholineLevel,
    dopamineActivity
  };
}

/**
 * Analyze cognitive processing functions
 */
function analyzeCognitiveProcessing(
  dreamText: string,
  sleepMetrics: REMSleepMetrics
): {
  memoryConsolidation: number;
  emotionalProcessing: number;
  creativeInsight: number;
  problemSolving: number;
} {

  // Memory consolidation (familiar elements + new combinations)
  const memoryConsolidation = Math.min(
    sleepMetrics.memoryIncorporation +
    (sleepMetrics.estimatedSleepStage === 'REM' ? 20 : 0), 100);

  // Emotional processing (intensity + resolution patterns) - BILINGUAL
  const emotionalWords = [
    // Turkish
    'hissettim', 'korktum', 'sevindim', 'üzüldüm', 'şaştım', 'duygu', 'his',
    // English
    'felt', 'scared', 'happy', 'sad', 'surprised', 'emotion', 'feeling'
  ];
  const emotionalProcessing = Math.min(
    sleepMetrics.emotionalIntensity +
    (emotionalWords.some(word => dreamText.toLowerCase().includes(word)) ? 15 : 0), 100);

  // Creative insight (novel combinations + problem-solving) - BILINGUAL
  const creativeElements = [
    // Turkish
    'çözüm', 'fikir', 'keşfetmek', 'yaratmak', 'buluş', 'yenilik', 'hayal',
    // English
    'solution', 'idea', 'discover', 'create', 'invention', 'innovation', 'imagination'
  ];
  const creativeInsight = Math.min(
    sleepMetrics.bizarrenessScore * 0.7 +
    (creativeElements.some(word => dreamText.toLowerCase().includes(word)) ? 25 : 0) +
    (sleepMetrics.temporalDistortion * 0.3), 100);

  // Problem solving (logical elements + decision making) - BILINGUAL
  const problemSolvingElements = [
    // Turkish
    'karar', 'seçim', 'çözüm', 'problem', 'sorun', 'düşün', 'analiz',
    // English
    'decision', 'choice', 'solution', 'problem', 'issue', 'think', 'analyze'
  ];
  const problemSolving = Math.min(
    sleepMetrics.narrativeCoherence * 0.6 +
    (problemSolvingElements.some(word => dreamText.toLowerCase().includes(word)) ? 20 : 0) +
    (sleepMetrics.bizarrenessScore * 0.2), 100);

  return {
    memoryConsolidation: Math.round(memoryConsolidation),
    emotionalProcessing: Math.round(emotionalProcessing),
    creativeInsight: Math.round(creativeInsight),
    problemSolving: Math.round(problemSolving)
  };
}

/**
 * Generate REM-based recommendations
 */
function generateREMRecommendations(
  sleepMetrics: REMSleepMetrics,
  circadianFactors: any,
  language: string = 'tr'
): string[] {
  const recommendations = [];

  if (sleepMetrics.estimatedSleepStage === 'REM') {
    recommendations.push(
      language === 'en'
        ? "REM sleep characteristics detected. This period is important for creativity and emotional processing."
        : "REM uykusu özellikleri tespit edildi. Bu dönem yaratıcılık ve duygusal işleme için önemlidir."
    );

    if (sleepMetrics.emotionalIntensity > 70) {
      recommendations.push(
        language === 'en'
          ? "Intense emotional content may indicate daytime stress. Try relaxation techniques."
          : "Yoğun duygusal içerik gün içi stresi işaret edebilir. Gevşeme tekniklerini deneyin."
      );
    }

    if (sleepMetrics.bizarrenessScore > 60) {
      recommendations.push(
        language === 'en'
          ? "High bizarreness score indicates creative mind activity. Focus on art/writing activities."
          : "Yüksek tuhaflık skoru yaratıcı zihnin aktifliğini gösterir. Sanat/yazı aktivitelerine yönelin."
      );
    }
  }

  if (circadianFactors.timeOfNight === 'late') {
    recommendations.push(
      language === 'en'
        ? "Early morning REM sleep is high quality. Maintain regular sleep schedule."
        : "Sabah erken REM uykusu kaliteli. Düzenli uyku saatleri sürdürün."
    );
  } else if (circadianFactors.timeOfNight === 'early') {
    recommendations.push(
      language === 'en'
        ? "Early sleep is NREM-focused. Optimize sleep environment for deep sleep."
        : "Erken uyku NREM odaklı. Derin uyku için uyku ortamını optimize edin."
    );
  }

  if (sleepMetrics.narrativeCoherence < 50) {
    recommendations.push(
      language === 'en'
        ? "Fragmented dream structure may indicate sleep quality issues. Review sleep hygiene."
        : "Parçalı rüya yapısı uyku kalitesi sorunları işaret edebilir. Uyku hijyenini gözden geçirin."
    );
  }

  return recommendations;
}

/**
 * Estimate emotional intensity from text
 */
function estimateEmotionalIntensity(dreamText: string): number {
  const intensityWords = {
    high: ['dehşet', 'panik', 'çok korktum', 'aşırı', 'müthiş', 'inanılmaz'],
    medium: ['korku', 'heyecan', 'mutluluk', 'üzüntü', 'şaşkınlık'],
    low: ['biraz', 'hafif', 'az', 'belki']
  };

  let score = 30; // Base score

  intensityWords.high.forEach(word => {
    if (dreamText.toLowerCase().includes(word)) score += 20;
  });

  intensityWords.medium.forEach(word => {
    if (dreamText.toLowerCase().includes(word)) score += 10;
  });

  intensityWords.low.forEach(word => {
    if (dreamText.toLowerCase().includes(word)) score += 5;
  });

  return Math.min(score, 100);
}

/**
 * Get scientific references for REM analysis
 */
function getREMReferences(): Array<{
  authors: string;
  year: number;
  title: string;
  journal: string;
  finding: string;
}> {
  return [
    {
      authors: "Hobson, J. A., & McCarley, R. W.",
      year: 1977,
      title: "The brain as a dream state generator: An activation-synthesis hypothesis",
      journal: "American Journal of Psychiatry, 134(12), 1335-1348",
      finding: "REM dreams show high bizarreness due to random brainstem activation"
    },
    {
      authors: "Nielsen, T. A.",
      year: 2000,
      title: "A review of mentation in REM and NREM sleep: Covert REM sleep as a possible reconciliation",
      journal: "Behavioral and Brain Sciences, 23(6), 851-866",
      finding: "REM and NREM dreams differ in vividness and emotional intensity"
    },
    {
      authors: "Stickgold, R.",
      year: 2005,
      title: "Sleep-dependent memory consolidation",
      journal: "Nature, 437(7063), 1272-1278",
      finding: "REM sleep facilitates memory consolidation and emotional processing"
    },
    {
      authors: "Cartwright, R. D.",
      year: 2010,
      title: "The twenty-four hour mind: The role of sleep and dreaming in our emotional lives",
      journal: "Oxford University Press",
      finding: "Dreams process emotional memories and regulate mood"
    },
    {
      authors: "Domhoff, G. W.",
      year: 2003,
      title: "The scientific study of dreams: Neural networks, cognitive development, and content analysis",
      journal: "American Psychological Association",
      finding: "Dream content reflects waking concerns and cognitive patterns"
    }
  ];
}
