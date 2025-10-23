import type { BiasDetectionResult } from '../bias-mitigation';
export type EvidenceLevel = 'low' | 'medium' | 'high';

export type ReliabilityBand = 'poor' | 'questionable' | 'acceptable' | 'good' | 'excellent';

export type NormalizationMetric = 'themeIntensity' | 'emotionalIntensity' | 'overallSignificance';

export type GenderIdentity = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type CulturalBackground = 'turkish' | 'western' | 'eastern' | 'mixed' | 'other';

export type EducationLevel = 'elementary' | 'secondary' | 'university' | 'graduate' | 'unknown';

export type SleepQuality = 'poor' | 'fair' | 'good' | 'excellent' | 'unknown';

export type StressLevel = 'low' | 'moderate' | 'high' | 'unknown';

export interface ScientificTheme {
  theme: string;
  confidence: number;
  emoji?: string;
  color?: string;
  description?: string;
  scorePct?: number;
  evidence?: string;
  evidenceLevel?: EvidenceLevel;
  adjustmentApplied?: boolean;
  normalizedAdjustment?: number;
  clinicalSignificance?: boolean;
  [key: string]: unknown;
}

export interface ScientificEmotionProfile {
  dominantEmotion?: string;
  dominantScore?: number;
  confidence?: number;
  averageIntensity?: number;
  distribution?: Array<{ emotion: string; intensity: number }>;
  trend?: Array<{ position: number; emotion: string; intensity: number }>;
  adjustmentApplied?: boolean;
  [key: string]: unknown;
}

export interface ScientificDemographics {
  age?: number;
  gender?: GenderIdentity;
  culturalBackground?: CulturalBackground;
  educationLevel?: EducationLevel;
  language?: string;
  sleepQuality?: SleepQuality;
  stressLevel?: StressLevel;
}

export interface ScientificAnalysisInput {
  dreamText: string;
  themes: ScientificTheme[];
  emotions: ScientificEmotionProfile;
  demographics?: ScientificDemographics;
}

export interface NormalizedScore {
  metric: NormalizationMetric;
  raw: number;
  normalized: number;
  percentile: number;
  zScore: number;
  confidence: number;
  demographicAdjustment: number;
  sampleSize: number;
  interpretation: string;
}

export interface NormalizedScoreSet {
  themeIntensity: NormalizedScore;
  emotionalIntensity: NormalizedScore;
  overallSignificance: NormalizedScore;
}

export interface ReliabilitySnapshot {
  internalConsistency: number;
  estimatedReliability: ReliabilityBand;
  confidence?: number;
  testRetestReliability?: number;
  interRaterReliability?: number;
  splitHalfReliability?: number;
  cronbachAlpha?: number;
  recommendations?: string[];
}

export interface ScientificEnhancedResults {
  adjustedThemes: ScientificTheme[];
  adjustedEmotions: ScientificEmotionProfile;
  scientificConfidence: number;
  validityScore: number;
  coherenceScore: number;
  emotionConsistency: number;
}

export interface ScientificReport {
  summary: string;
  methodology: string;
  limitations: string;
  recommendations: string[];
  disclaimers: string[];
}

export interface ScientificAnalysisResult {
  originalAnalysis: {
    themes: ScientificTheme[];
    emotions: ScientificEmotionProfile;
    overallConfidence: number;
  };
  normalizedScores: NormalizedScoreSet;
  biasAssessment: BiasDetectionResult;
  reliabilityMetrics?: ReliabilitySnapshot;
  enhancedResults: ScientificEnhancedResults;
  scientificReport: ScientificReport;
}

export interface DemographicProfile {
  age: number;
  gender: GenderIdentity;
  culturalBackground: CulturalBackground;
  educationLevel: EducationLevel;
  sleepQuality: SleepQuality;
  stressLevel: StressLevel;
  language?: string;
}


