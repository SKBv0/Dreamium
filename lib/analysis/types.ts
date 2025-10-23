/**
 * Core analysis types for consistent data flow across all components
 * Single Source of Truth (SOT) for all analysis results
 */

export interface EmotionIndex {
  pos: number; // 0-100 percentage
  neg: number; // 0-100 percentage  
  neu: number; // 0-100 percentage
  labels: Array<{
    tag: string; // "korku", "üzüntü", "öfke", etc.
    score: number; // 0-100 percentage
    intensity: number; // 0-100 percentage
    valence: 'pos' | 'neg' | 'neu';
    arousal: number; // 0-100 percentage
  }>;
  confidence: number; // 0-100 percentage
  tone: 'positive' | 'negative' | 'neutral'; // derived from pos/neg/neu
}

export interface EntityIndex {
  people: string[]; // ["anne", "baba", "arkadaş"]
  animals: string[]; // ["at", "ayı", "köpek"]
  places: string[]; // ["ev", "okul", "park"]
  objects: string[]; // ["masa", "kitap", "telefon"]
  events: string[]; // ["kar", "yağmur", "güneş"] - environmental events
}

export interface SleepStage {
  stage: 'REM' | 'NREM' | 'unknown';
  prob?: number; // 0-100 percentage, only if stage !== "unknown"
  confidence: number; // 0-100 percentage
  vividness: number; // 0-100 percentage
  emotionalIntensity: number; // 0-100 percentage
  bizarrenessScore: number; // 0-100 percentage
  narrativeCoherence: number; // 0-100 percentage
}

export interface Plausibility {
  logical: number; // 0-100 percentage
  physical: number; // 0-100 percentage
  social: number; // 0-100 percentage
  bizarreness: number; // 0-100 percentage
  overall: number; // 0-100 percentage (calculated)
}

export interface Continuity {
  thematic: number; // 0-100 percentage
  emotional?: number; // 0-100 percentage, undefined if no day data
  social?: number; // 0-100 percentage, undefined if no day data
  cognitive?: number; // 0-100 percentage, undefined if no day data
  overall: number; // 0-100 percentage
  hasDayData: boolean; // flag for UI visibility
}

export interface ThemeIndex {
  id: string; // "korku", "kontrol_kaybı", etc.
  scoreRaw: number; // raw model output
  scoreNorm?: number; // 0-100 percentage (if normalized)
  evidenceSpans: number[]; // character positions in text
  strength: 'low' | 'medium' | 'high';
  evidenceLevel: 'low' | 'medium' | 'high';
}

export interface AnalysisBundle {
  // Core data
  emotions: EmotionIndex;
  entities: EntityIndex;
  sleep: SleepStage;
  plausibility: Plausibility;
  continuity: Continuity;
  themes: ThemeIndex[];
  
  // Source data
  sourceText: string;
  language: string;
  
  // UI visibility flags
  hideEmotionCards?: boolean;
  hideSleepPercentages?: boolean;
  hideContinuityData?: boolean;
  
  // Analysis flags
  hasMetamorphosis?: boolean;
  
  // Metadata
  analysisVersion: string;
  timestamp: string;
  confidence: number; // overall analysis confidence 0-100
}

export interface RawAnalysisResults {
  emotionResult?: any;
  quantitativeResult?: any;
  remResult?: any;
  continuityResult?: any;
  advancedResult?: any;
}

// Demographics interface - imported from main types file to avoid duplication
export type { Demographics } from '@/lib/types';

export interface ValidationResult {
  rule: string; // "D-EMO-01", "D-REAL-01", etc.
  passed: boolean;
  message: string;
  originalValue?: any;
  correctedValue?: any;
}

export type ThemeNormalizationMode = 'softmax' | 'independent';
