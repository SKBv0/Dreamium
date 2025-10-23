import type { ScientificAnalysisResult } from './scientific-engine/types';
export interface DreamAnalysisResult {
  themes: Theme[]
  emotions: Emotion[]
  insights: string[]
  structuredInsights: StructuredInsight[]
  dreamText: string
  confidenceScore: ConfidenceScore
  advancedAnalysis?: AdvancedDreamAnalysis
  scientificResults?: ScientificResults
  quantitativeResult?: QuantitativeAnalysisResult
  remAnalysis?: REMAnalysisResult
  continuityAnalysis?: ContinuityAnalysisResult
}

export interface Theme {
  theme: string
  color: string
  emoji: string
  description: string
  scorePct?: number
  evidence?: string
  evidence_level?: 'low' | 'medium' | 'high'
}

export interface Emotion {
  emotion: string
  intensity: number
  evidence?: string
  evidence_level?: 'low' | 'medium' | 'high'
  count?: number
  rawIntensity?: number
  color?: string
  cognitive_domain?: string
  dominance?: number
  foundWords?: string[]
  translatedName?: string
}

export interface StructuredInsight {
  title: string
  content: string[]
  type: 'psychological' | 'scientific' | 'practical' | 'cultural'
  confidence: number
}

export interface ConfidenceScore {
  score: number
  level: string
  validThemes: number
  totalThemes: number
  emotionCount: number
  maxEmotionIntensity: number
  highestThemeScore: number
  expectedMinThemes: number
  themeRatio: number
  formula: string
}

export interface AdvancedDreamAnalysis {
  themes: Theme[]
  emotions: Array<{
    emotion: string
    emoji: string
    intensity: number
    evidence?: string
    evidence_level?: 'low' | 'medium' | 'high'
  }>
  jungian_analysis?: {
    dominant_archetypes?: string[]
    archetypal_conflicts?: string[]
    individuation_stage?: string
    evidence_level?: 'low' | 'medium' | 'high'
  }
  freudian_analysis?: {
    repressed_content?: string[]
    sexual_symbolism?: string[]
    defense_mechanisms?: string[]
    unconscious_desires?: string[]
    evidence_level?: 'low' | 'medium' | 'high'
  }
  adlerian_analysis?: {
    power_dynamics?: string[]
    inferiority_feelings?: string[]
    striving_for_superiority?: string[]
    social_interest?: string[]
    evidence_level?: 'low' | 'medium' | 'high'
  }
  gestalt_analysis?: {
    disowned_parts?: string[]
    unfinished_business?: string[]
    integration_suggestions?: string[]
    evidence_level?: 'low' | 'medium' | 'high'
  }
  synthesis: {
    overall_interpretation: string
    key_insights: string[]
    therapeutic_recommendations: string[]
    evidence_level: 'low'
    scientific_disclaimer: string
  }
  devils_advocate: {
    alternative_interpretations: string[]
    limitations: string[]
    evidence_level: 'low'
  }
  cultural_context: {
    cultural_symbols: string[]
    societal_pressures: string[]
    generational_themes: string[]
    evidence_level: 'low'
  }
}

export type ScientificResults = ScientificAnalysisResult;

export interface QuantitativeAnalysisResult {
  characterCount: number
  characters: { type: string; count: number }[]
  socialInteractions: {
    total: number
    types: {
      aggressive: number
      friendly: number
      sexual: number
      neutral: number
    }
  }
  setting: {
    familiarity: 'familiar' | 'unfamiliar' | 'mixed'
    location: 'indoors' | 'outdoors' | 'mixed'
    description: string
  }
  successFailureRatio: {
    success: number
    failure: number
  }
  consciousnessScore?: number
  emotions: { type: string; count: number }[]
}

export interface REMAnalysisResult {
  sleepStageEstimate: {
    estimatedSleepStage: 'REM' | 'NREM' | 'unknown'
    dreamVividness: number
    emotionalIntensity: number
    bizarrenessScore: number
    narrativeCoherence: number
    memoryIncorporation: number
    temporalDistortion: number
  }
  circadianFactors: {
    timeOfNight: 'early' | 'middle' | 'late' | 'unknown'
    remProbability: number
    dreamLikelihood: number
  }
  neuroscientificInsights: {
    prefrontalActivity: 'low' | 'moderate' | 'high'
    limbicActivation: 'low' | 'moderate' | 'high'
    acetylcholineLevel: 'low' | 'moderate' | 'high'
    dopamineActivity: 'low' | 'moderate' | 'high'
  }
  cognitiveProcessing: {
    memoryConsolidation: number
    emotionalProcessing: number
    creativeInsight: number
    problemSolving: number
  }
  recommendations: string[]
}

export interface ContinuityAnalysisResult {
  continuityScore: number
  wakingLifeConnections: {
    personalConcerns: string[]
    recentExperiences: string[]
    ongoingStressors: string[]
    socialRelationships: string[]
  }
  continuityTypes: {
    thematic: number
    emotional: number
    social: number
    cognitive: number
  }
  developmentalFactors: {
    ageAppropriate: boolean
    cognitiveMaturity: 'child' | 'adolescent' | 'adult'
    concernComplexity: 'simple' | 'moderate' | 'complex'
  }
  repetitionPattern: {
    hasRecurringElements: boolean
    recurringSymbols: string[]
    recurringThemes: string[]
    repetitionIntensity: number
  }
  realityTesting: {
    logicalConsistency: number
    physicalPlausibility: number
    socialPlausibility: number
    overallRealism: number
  }
  recommendations: string[]
  scientificReferences: Array<{
    authors: string
    year: number
    title: string
    journal: string
    finding: string
  }>
}

export interface Demographics {
  age?: number
  gender?: string
  occupation?: string
  concerns?: string[]
  sleepPatterns?: {
    bedtime: string
    wakeTime: string
    sleepQuality: number
  }
  culturalBackground?: string
  language?: string
}

export interface PersistedAnalysisPayload {
  dreamText: string
  analysis: DreamAnalysisResult
  [key: string]: unknown
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface HistoryAPIResponse extends APIResponse {
  current?: DreamAnalysisResult
  history?: SimpleAnalysisHistory[]
}

export interface SimpleAnalysisHistory {
  filename: string
  date: string
}



