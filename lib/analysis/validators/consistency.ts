/**
 * Consistency validators for analysis results
 * Implements rules from the consistency report to prevent data conflicts
 */

import type { 
  EmotionIndex, 
  EntityIndex, 
  SleepStage, 
  Plausibility, 
  ThemeIndex, 
  ValidationResult,
  ThemeNormalizationMode 
} from '../types';

/**
 * D-EMO-01: Tone/Valence consistency
 * Prevents "neutral tone" with 93% negative content
 */
export function determineTone(pos: number, neg: number, neu: number): "positive" | "negative" | "neutral" {
  const max = Math.max(pos, neg, neu);
  
  // If no emotion is dominant (all < 60%), consider neutral
  if (max < 60) {
    return "neutral";
  }
  
  // Return the dominant emotion
  if (max === neg) return "negative";
  if (max === pos) return "positive";
  return "neutral";
}

/**
 * D-REAL-01: Metamorphosis penalty
 * Prevents 100% realism when impossible transformations occur
 */
export function applyMetamorphosisPenalty(
  plausibility: Plausibility, 
  hasMetamorphosis: boolean
): Plausibility {
  const result = { ...plausibility };
  
  if (hasMetamorphosis) {
    // Physical plausibility capped at 50% if metamorphosis detected
    result.physical = Math.min(result.physical, 50);
  }
  
  // Calculate overall realism with bizarreness penalty
  const base = (result.logical + result.physical + result.social) / 3;
  const alpha = 0.5; // penalty coefficient
  result.overall = Math.round(base * (1 - alpha * (result.bizarreness / 100)));
  
  return result;
}

/**
 * D-SLP-01: Sleep stage harmonization
 * Prevents showing "0% REM" with "unknown" status
 */
export function harmonizeSleepStage(sleep: SleepStage): SleepStage {
  const result = { ...sleep };
  
  if (result.stage === "unknown") {
    // Remove probability field if stage is unknown
    delete result.prob;
  }
  
  return result;
}

/**
 * D-ENT-01: Entity count enforcement
 * Ensures all character/animal counts derive from single source
 */
export function enforceEntitySOT(entities: EntityIndex): EntityIndex {
  // Deduplicate arrays and ensure consistency
  const result: EntityIndex = {
    people: [...new Set(entities.people)],
    animals: [...new Set(entities.animals)],
    places: [...new Set(entities.places)],
    objects: [...new Set(entities.objects)],
    events: [...new Set(entities.events)]
  };
  
  return result;
}

/**
 * Format percentage with consistent decimal places
 * Prevents "41.75045120088853%" display
 */
export function formatPercent(x: number): string {
  const clamped = Math.max(0, Math.min(100, x));
  
  // Special case for very small values
  if (clamped > 0 && clamped < 1) {
    return "< %1";
  }
  
  return `${clamped.toFixed(1)}%`;
}

/**
 * Normalize theme scores
 * Either softmax (sum=100%) or independent (raw scores)
 */
export function normalizeThemes(
  themes: ThemeIndex[], 
  mode: ThemeNormalizationMode
): ThemeIndex[] {
  if (themes.length === 0) return themes;
  
  if (mode === "softmax") {
    // Softmax normalization: sum = 100%
    const total = themes.reduce((sum, theme) => sum + theme.scoreRaw, 0);
    
    return themes.map(theme => ({
      ...theme,
      scoreNorm: total > 0 ? (theme.scoreRaw / total) * 100 : 0
    }));
  } else {
    // Independent mode: keep raw scores but add label
    return themes.map(theme => ({
      ...theme,
      scoreNorm: theme.scoreRaw
    }));
  }
}

/**
 * Validate emotion consistency
 * Ensures tone matches valence distribution
 */
export function validateEmotionConsistency(emotions: EmotionIndex): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // Check tone-valence consistency
  const calculatedTone = determineTone(emotions.pos, emotions.neg, emotions.neu);
  
  if (calculatedTone !== emotions.tone) {
    results.push({
      rule: "D-EMO-01",
      passed: false,
      message: `Tone mismatch: calculated "${calculatedTone}" but stored "${emotions.tone}"`,
      originalValue: emotions.tone,
      correctedValue: calculatedTone
    });
  }
  
  // Check for impossible combinations
  if (emotions.tone === "neutral" && Math.max(emotions.pos, emotions.neg) >= 60) {
    results.push({
      rule: "D-EMO-01",
      passed: false,
      message: "Neutral tone with dominant emotion detected",
      originalValue: emotions.tone,
      correctedValue: calculatedTone
    });
  }
  
  return results;
}

/**
 * Validate entity count consistency
 * Ensures all panels show same counts
 */
export function validateEntityConsistency(entities: EntityIndex): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // Check for duplicate entities
  const allEntities = [
    ...entities.people,
    ...entities.animals, 
    ...entities.places,
    ...entities.objects,
    ...entities.events
  ];
  
  const duplicates = allEntities.filter((item, index) => allEntities.indexOf(item) !== index);
  
  if (duplicates.length > 0) {
    results.push({
      rule: "D-ENT-01",
      passed: false,
      message: `Duplicate entities found: ${duplicates.join(", ")}`,
      originalValue: entities,
      correctedValue: enforceEntitySOT(entities)
    });
  }
  
  return results;
}

/**
 * Validate sleep stage consistency
 * Ensures unknown stage doesn't have probability
 */
export function validateSleepConsistency(sleep: SleepStage): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  if (sleep.stage === "unknown" && sleep.prob !== undefined) {
    results.push({
      rule: "D-SLP-01",
      passed: false,
      message: "Unknown sleep stage should not have probability",
      originalValue: sleep,
      correctedValue: harmonizeSleepStage(sleep)
    });
  }
  
  return results;
}

/**
 * Validate plausibility consistency
 * Ensures metamorphosis penalty is applied
 */
export function validatePlausibilityConsistency(
  plausibility: Plausibility, 
  hasMetamorphosis: boolean
): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  if (hasMetamorphosis && plausibility.physical > 50) {
    results.push({
      rule: "D-REAL-01",
      passed: false,
      message: "Physical plausibility too high with metamorphosis detected",
      originalValue: plausibility.physical,
      correctedValue: 50
    });
  }
  
  return results;
}

/**
 * Apply all consistency validations
 * Returns corrected bundle and validation results
 */
export function validateBundle(bundle: any): { bundle: any; results: ValidationResult[] } {
  const results: ValidationResult[] = [];
  let correctedBundle = { ...bundle };
  
  // Validate emotions
  if (correctedBundle.emotions) {
    const emotionResults = validateEmotionConsistency(correctedBundle.emotions);
    results.push(...emotionResults);
    
    // Apply corrections
    if (emotionResults.some(r => !r.passed)) {
      correctedBundle.emotions.tone = determineTone(
        correctedBundle.emotions.pos,
        correctedBundle.emotions.neg,
        correctedBundle.emotions.neu
      );
    }
  }
  
  // Validate entities
  if (correctedBundle.entities) {
    const entityResults = validateEntityConsistency(correctedBundle.entities);
    results.push(...entityResults);
    
    if (entityResults.some(r => !r.passed)) {
      correctedBundle.entities = enforceEntitySOT(correctedBundle.entities);
    }
  }
  
  // Validate sleep
  if (correctedBundle.sleep) {
    const sleepResults = validateSleepConsistency(correctedBundle.sleep);
    results.push(...sleepResults);
    
    if (sleepResults.some(r => !r.passed)) {
      correctedBundle.sleep = harmonizeSleepStage(correctedBundle.sleep);
    }
  }
  
  // Validate plausibility
  if (correctedBundle.plausibility) {
    const hasMetamorphosis = correctedBundle.hasMetamorphosis || false;
    const plausibilityResults = validatePlausibilityConsistency(correctedBundle.plausibility, hasMetamorphosis);
    results.push(...plausibilityResults);
    
    if (plausibilityResults.some(r => !r.passed)) {
      correctedBundle.plausibility = applyMetamorphosisPenalty(correctedBundle.plausibility, hasMetamorphosis);
    }
  }
  
  return { bundle: correctedBundle, results };
}

