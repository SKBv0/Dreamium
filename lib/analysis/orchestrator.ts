/**
 * Analysis orchestrator - Single Source of Truth for all analysis results
 * Coordinates all analysis engines and applies consistency validation
 */

import { logger } from '../logger';
import { analyzeEmotions } from '../emotion-analysis';
import { performQuantitativeAnalysis } from '../quantitative-analysis';
import { analyzeREMPatterns } from '../rem-sleep-analysis';
import { analyzeContinuityHypothesis } from '../continuity-hypothesis';
import { performAdvancedDreamAnalysis } from '../advanced-dream-analysis';
import { detectMetamorphosis, detectDialogue, extractEntitiesFromText, detectEmotionalContent, detectBizarreness } from './nlp/detectors';
import { validateBundle, determineTone, applyMetamorphosisPenalty } from './validators/consistency';
import type { 
  AnalysisBundle, 
  RawAnalysisResults, 
  Demographics, 
  EmotionIndex, 
  EntityIndex, 
  SleepStage, 
  Plausibility, 
  Continuity, 
  ThemeIndex 
} from './types';

/**
 * Main orchestration function
 * Calls all analysis engines and returns validated, consistent bundle + raw results
 */
export async function orchestrate(
  dreamText: string,
  language: string,
  demographics?: Demographics,
  t?: (key: string, values?: Record<string, any>) => string
): Promise<{ bundle: AnalysisBundle; rawResults: RawAnalysisResults }> {
  logger.info('🎭 [Orchestrator] Starting analysis', {
    textLength: dreamText.length,
    language
  });

  try {
    // Step 1: Call all analysis engines
    const rawResults = await callAllAnalysisEngines(dreamText, language, demographics, t);

    // Step 2: Merge raw results into preliminary bundle
    const preliminaryBundle = mergeRawResults(rawResults, dreamText, language);

    // Step 3: Normalize all numeric values
    const normalizedBundle = normalizeBundle(preliminaryBundle);

    // Step 4: Apply consistency validation and corrections
    const { bundle: validatedBundle, results: validationResults } = validateBundle(normalizedBundle);

    // Step 5: Derive additional fields
    const derivedBundle = deriveAdditionalFields(validatedBundle, dreamText);

    // Step 6: Apply auto-healing (UI visibility flags)
    const finalBundle = applyAutoHealing(derivedBundle);

    logger.info('✅ [Orchestrator] Analysis completed', {
      themes: finalBundle.themes.length,
      emotions: finalBundle.emotions.labels.length,
      entities: finalBundle.entities.people.length + finalBundle.entities.animals.length,
      stage: finalBundle.sleep.stage,
      confidence: finalBundle.confidence
    });

    // Return both bundle and raw results for backward compatibility
    return {
      bundle: finalBundle,
      rawResults: rawResults
    };
  } catch (error) {
    logger.error('❌ [Orchestrator] Analysis orchestration failed', error);
    throw error;
  }
}

/**
 * Call all analysis engines in parallel
 */
async function callAllAnalysisEngines(
  dreamText: string,
  language: string,
  demographics?: Demographics,
  t?: (key: string, values?: Record<string, any>) => string
): Promise<RawAnalysisResults> {
  // First, run emotion analysis (needed by quantitative analysis)
  const emotionResult = analyzeEmotions(dreamText, language);

  // Call remaining engines in parallel for better performance
  const [
    quantitativeResult,
    remResult,
    continuityResult,
    advancedResult
  ] = await Promise.all([
    // Quantitative analysis (uses emotion result)
    performQuantitativeAnalysis(dreamText, language, {
      demographics,
      modelVersion: process.env.NEXT_PUBLIC_QUANT_MODEL ?? 'unknown-model',
      settings: { allowFallback: false },
      emotionAnalysis: emotionResult
    }),
    
    // REM analysis
    Promise.resolve((async () => {
      const bedtime = demographics?.sleepPatterns?.bedtime;
      logger.debug('[Orchestrator] REM Analysis - Bedtime:', {
        hasDemographics: !!demographics,
        hasSleepPatterns: !!demographics?.sleepPatterns,
        bedtime,
        language
      });
      return analyzeREMPatterns(
        dreamText,
        bedtime || undefined, // Use user's bedtime if available
        undefined, // emotionIntensity will be calculated later
        language
      );
    })()),

    // Continuity analysis
    Promise.resolve(analyzeContinuityHypothesis(
      dreamText,
      demographics || undefined,
      language
    )),
    
    // Advanced analysis
    Promise.resolve(performAdvancedDreamAnalysis(dreamText, language, t || undefined))
  ]);

  return {
    emotionResult,
    quantitativeResult,
    remResult,
    continuityResult,
    advancedResult
  };
}

/**
 * Merge raw results into preliminary bundle
 */
function mergeRawResults(
  raw: RawAnalysisResults,
  dreamText: string,
  language: string
): Partial<AnalysisBundle> {

  // Extract emotion data
  const pos = raw.emotionResult?.valenceBalance?.positive || 0;
  const neg = raw.emotionResult?.valenceBalance?.negative || 0;
  const neu = raw.emotionResult?.valenceBalance?.neutral || 100;

  // Build emotion labels array: primary emotion first, then secondary emotions
  const emotionLabels = [];

  // Add primary emotion as first item (highest intensity)
  if (raw.emotionResult?.primaryEmotion) {
    emotionLabels.push({
      tag: raw.emotionResult.primaryEmotion.emotion,
      score: raw.emotionResult.primaryEmotion.intensity,
      intensity: raw.emotionResult.primaryEmotion.intensity,
      valence: raw.emotionResult.primaryEmotion.valence,
      arousal: raw.emotionResult.primaryEmotion.arousal * 100
    });
  }

  // Add secondary emotions
  if (raw.emotionResult?.secondaryEmotions) {
    emotionLabels.push(...raw.emotionResult.secondaryEmotions.map((emotion: any) => ({
      tag: emotion.emotion,
      score: emotion.intensity,
      intensity: emotion.intensity,
      valence: emotion.valence,
      arousal: emotion.arousal * 100
    })));
  }

  const emotions: EmotionIndex = {
    pos,
    neg,
    neu,
    labels: emotionLabels,
    confidence: raw.emotionResult?.primaryEmotion?.confidence || 0,
    tone: determineTone(pos, neg, neu)
  };

  // Extract entity data from quantitative analysis
  // Helper to categorize character types
  const isAnimal = (type: string): boolean => {
    const normalized = type.toLowerCase();
    return normalized.includes('hayvan') || normalized.includes('animal') ||
           normalized === 'at' || normalized === 'horse' ||
           normalized === 'ayı' || normalized === 'bear' ||
           normalized === 'kuş' || normalized === 'bird' ||
           normalized === 'kedi' || normalized === 'cat' ||
           normalized === 'köpek' || normalized === 'dog' ||
           normalized === 'kurt' || normalized === 'wolf' ||
           normalized === 'yılan' || normalized === 'snake' ||
           normalized === 'aslan' || normalized === 'lion';
  };

  const characters = raw.quantitativeResult?.characters || [];
  const people = characters.filter((c: any) => !isAnimal(c.type));
  const animals = characters.filter((c: any) => isAnimal(c.type));

  const entities: EntityIndex = {
    people: people.map((c: any) => c.type),
    animals: animals.map((c: any) => c.type),
    places: raw.quantitativeResult?.setting?.description ? [raw.quantitativeResult.setting.description] : [],
    objects: [], // Will be extracted from text
    events: [] // Will be extracted from text
  };

  // Extract sleep data
  const sleep: SleepStage = {
    stage: raw.remResult?.sleepStageEstimate?.estimatedSleepStage || 'unknown',
    prob: raw.remResult?.circadianFactors?.remProbability ? raw.remResult.circadianFactors.remProbability * 100 : undefined,
    confidence: 75, // Default confidence
    vividness: raw.remResult?.sleepStageEstimate?.dreamVividness || 0,
    emotionalIntensity: raw.remResult?.sleepStageEstimate?.emotionalIntensity || 0,
    bizarrenessScore: raw.remResult?.sleepStageEstimate?.bizarrenessScore || 0,
    narrativeCoherence: raw.remResult?.sleepStageEstimate?.narrativeCoherence || 0
  };

  // Extract plausibility data from continuity analysis
  const plausibility: Plausibility = {
    logical: raw.continuityResult?.realityTesting?.logicalConsistency || 0,
    physical: raw.continuityResult?.realityTesting?.physicalPlausibility || 0,
    social: raw.continuityResult?.realityTesting?.socialPlausibility || 0,
    bizarreness: raw.continuityResult?.realityTesting?.overallRealism ? 100 - raw.continuityResult.realityTesting.overallRealism : 0,
    overall: raw.continuityResult?.realityTesting?.overallRealism || 0
  };

  // Extract continuity data
  const continuity: Continuity = {
    thematic: raw.continuityResult?.continuityTypes?.thematic || 0,
    emotional: raw.continuityResult?.continuityTypes?.emotional || 0,
    social: raw.continuityResult?.continuityTypes?.social || 0,
    cognitive: raw.continuityResult?.continuityTypes?.cognitive || 0,
    overall: raw.continuityResult?.continuityScore || 0,
    hasDayData: false // Will be determined later
  };

  // Extract themes from advanced analysis
  const themes: ThemeIndex[] = raw.advancedResult?.themes?.map((theme: any) => ({
    id: theme.theme,
    scoreRaw: theme.confidence || 0,
    evidenceSpans: theme.evidenceSpans || [],
    strength: theme.strength || 'low',
    evidenceLevel: theme.evidence_level || 'low'
  })) || [];

  return {
    emotions,
    entities,
    sleep,
    plausibility,
    continuity,
    themes,
    sourceText: dreamText,
    language,
    analysisVersion: '1.0.0',
    timestamp: new Date().toISOString(),
    confidence: 75
  };
}

/**
 * Normalize all numeric values to 0-100 range
 */
function normalizeBundle(bundle: Partial<AnalysisBundle>): Partial<AnalysisBundle> {

  const normalized = { ...bundle };

  // Normalize emotion values
  if (normalized.emotions) {
    const total = normalized.emotions.pos + normalized.emotions.neg + normalized.emotions.neu;
    if (total > 0) {
      normalized.emotions.pos = (normalized.emotions.pos / total) * 100;
      normalized.emotions.neg = (normalized.emotions.neg / total) * 100;
      normalized.emotions.neu = (normalized.emotions.neu / total) * 100;
    }
  }

  // Normalize theme scores
  if (normalized.themes && normalized.themes.length > 0) {
    const maxScore = Math.max(...normalized.themes.map(t => t.scoreRaw));
    if (maxScore > 0) {
      normalized.themes = normalized.themes.map(theme => ({
        ...theme,
        scoreNorm: (theme.scoreRaw / maxScore) * 100
      }));
    }
  }

  return normalized;
}

/**
 * Derive additional fields based on text analysis
 */
function deriveAdditionalFields(bundle: Partial<AnalysisBundle>, dreamText: string): Partial<AnalysisBundle> {

  const derived = { ...bundle };

  // Detect metamorphosis
  const hasMetamorphosis = detectMetamorphosis(dreamText);
  derived.hasMetamorphosis = hasMetamorphosis;
  
  // Apply metamorphosis penalty to plausibility
  if (derived.plausibility) {
    derived.plausibility = applyMetamorphosisPenalty(derived.plausibility, hasMetamorphosis);
  }

  // Detect dialogue for social plausibility
  const hasDialogue = detectDialogue(dreamText);

  // Extract additional entities from text
  const textEntities = extractEntitiesFromText(dreamText);
  if (derived.entities) {
    derived.entities = {
      people: [...new Set([...derived.entities.people, ...textEntities.people])],
      animals: [...new Set([...derived.entities.animals, ...textEntities.animals])],
      places: [...new Set([...derived.entities.places, ...textEntities.places])],
      objects: [...new Set([...derived.entities.objects, ...textEntities.objects])],
      events: [...new Set([...derived.entities.events, ...textEntities.events])]
    };
  }

  // Detect emotional content
  const hasEmotionalContent = detectEmotionalContent(dreamText);

  // Detect bizarreness
  const bizarrenessScore = detectBizarreness(dreamText);
  if (derived.plausibility) {
    derived.plausibility.bizarreness = Math.max(derived.plausibility.bizarreness, bizarrenessScore);
  }

  // Update continuity hasDayData flag
  if (derived.continuity) {
    derived.continuity.hasDayData = false; // For now, always false
  }

  return derived;
}

/**
 * Apply auto-healing (UI visibility flags)
 */
function applyAutoHealing(bundle: Partial<AnalysisBundle>): AnalysisBundle {

  const healed = { ...bundle } as AnalysisBundle;

  // Hide emotion cards if no emotional content
  healed.hideEmotionCards = !bundle.emotions?.labels?.length;

  // Hide sleep percentages if stage is unknown
  healed.hideSleepPercentages = bundle.sleep?.stage === 'unknown';

  // Hide continuity data if no day data
  healed.hideContinuityData = !bundle.continuity?.hasDayData;

  return healed;
}
