import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '@/contexts/LanguageContext'
import { storage, StorageKeys } from '@/lib/storage'
import { logger } from '@/lib/logger'
import type {
  DreamAnalysisResult,
  Demographics,
  SimpleAnalysisHistory,
  ScientificResults
} from '@/lib/types'
import type { AnalysisBundle } from '@/lib/analysis/types'

type GenderOption = 'male' | 'female' | 'other' | 'prefer_not_to_say';
type CultureOption = 'turkish' | 'western' | 'eastern' | 'mixed' | 'other';

const clampConfidence = (value?: number): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }
  const normalized = value > 1 ? value / 100 : value;
  return Math.min(Math.max(normalized, 0), 1);
};

// Helper functions for theme/emotion mapping
const getThemeColor = (themeId: string): string => {
  const colorMap: Record<string, string> = {
    'korku': 'from-red-400 to-red-600',
    'kontrol_kaybı': 'from-orange-400 to-orange-600',
    'dönüşüm': 'from-purple-400 to-purple-600',
    'yer_değişimi': 'from-blue-400 to-blue-600',
    'belirsizlik': 'from-gray-400 to-gray-600',
    'default': 'from-indigo-400 to-indigo-600'
  };
  return colorMap[themeId] || colorMap.default;
};

const getThemeEmoji = (themeId: string): string => {
  const emojiMap: Record<string, string> = {
    'korku': '😨',
    'kontrol_kaybı': '😰',
    'dönüşüm': '🔄',
    'yer_değişimi': '🏠',
    'belirsizlik': '❓',
    'default': '💭'
  };
  return emojiMap[themeId] || emojiMap.default;
};

const getThemeDescription = (themeId: string): string => {
  const descMap: Record<string, string> = {
    'korku': 'Fear and anxiety themes',
    'kontrol_kaybı': 'Loss of control themes',
    'dönüşüm': 'Transformation and change',
    'yer_değişimi': 'Location and place changes',
    'belirsizlik': 'Uncertainty and confusion',
    'default': 'General dream theme'
  };
  return descMap[themeId] || descMap.default;
};

const getEmotionColor = (emotion: string): string => {
  const colorMap: Record<string, string> = {
    'korku': 'from-red-400 to-red-600',
    'üzüntü': 'from-blue-400 to-blue-600',
    'öfke': 'from-orange-400 to-orange-600',
    'mutlu': 'from-green-400 to-green-600',
    'kızgın': 'from-red-400 to-red-600',
    'default': 'from-yellow-400 to-orange-400'
  };
  return colorMap[emotion] || colorMap.default;
};

const normalizeGender = (value?: string | null): GenderOption | undefined => {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized === 'male' || normalized === 'erkek') return 'male';
  if (normalized === 'female' || normalized === 'kadın') return 'female';
  if (normalized === 'other') return 'other';
  if (normalized === 'prefer_not_to_say') return 'prefer_not_to_say';
  return undefined;
};

const normalizeCulture = (value?: string | null): CultureOption | undefined => {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized === 'turkish' || normalized === 'türk') return 'turkish';
  if (normalized === 'western' || normalized === 'batı') return 'western';
  if (normalized === 'eastern' || normalized === 'doğu') return 'eastern';
  if (normalized === 'mixed' || normalized === 'karışık') return 'mixed';
  if (normalized === 'other') return 'other';
  return undefined;
};

export function useDreamAnalysis() {
  const { t, language } = useTranslation()
  const [dreamText, setDreamText] = useState("")
  const [dreamTime, setDreamTime] = useState<string>("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<DreamAnalysisResult | null>(null)
  const [analysisBundle, setAnalysisBundle] = useState<AnalysisBundle | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [showDreamInput, setShowDreamInput] = useState(true)
  const [showDemographics, setShowDemographics] = useState(false)
  const [demographics, setDemographics] = useState<Demographics | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [scientificResults, setScientificResults] = useState<ScientificResults | null>(null)
  // Legacy states - kept for backward compatibility with existing UI components
  const [advancedAnalysis, setAdvancedAnalysis] = useState<any>(null)
  const [quantitativeResult, setQuantitativeResult] = useState<any>(null)
  const [remAnalysis, setRemAnalysis] = useState<any>(null)
  const [continuityAnalysis, setContinuityAnalysis] = useState<any>(null)
  const [emotionAnalysisResult, setEmotionAnalysisResult] = useState<any>(null)
  const [isAdvancedAnalysisLoading, setIsAdvancedAnalysisLoading] = useState(false)
  const [history, setHistory] = useState<SimpleAnalysisHistory[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [analysisSteps, setAnalysisSteps] = useState<string[]>([])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    
    const savedDemographics = storage.getItem<Demographics>(StorageKeys.DEMOGRAPHICS)
    if (savedDemographics) {
      setDemographics(savedDemographics)
      setShowDemographics(false)
    }

    const savedDreamTime = storage.getItem<string>(StorageKeys.DREAM_TIME_MEMORY)
    if (savedDreamTime) {
      setDreamTime(savedDreamTime)
    }
  }, [isClient])

  useEffect(() => {
    if (!isClient || !dreamTime) return
    
    storage.setItem(StorageKeys.DREAM_TIME_MEMORY, dreamTime)
  }, [dreamTime, isClient])

  const resetAnalysis = useCallback(() => {
    setAnalysisResult(null)
    setAnalysisBundle(null)
    setScientificResults(null)
    setAdvancedAnalysis(null)
    setCurrentStep(0)
    setShowDreamInput(true)
    setAnalysisSteps([])
  }, [])

  const loadAnalysis = useCallback(async (analysisId: string) => {
    if (!isClient) return

    setIsLoadingHistory(true)
    setIsAnalyzing(true)

    try {
      const response = await fetch(`/api/history?file=${analysisId}`)
      const data = await response.json()

      if (data.success && data.analysis) {
        const result = data.analysis
        setAnalysisResult({
          themes: result.analysis.themes,
          emotions: result.analysis.emotions,
          insights: result.analysis.insights,
          structuredInsights: result.analysis.structuredInsights,
          dreamText: result.dreamText,
          confidenceScore: result.analysis.confidenceScore,
        })
        setAdvancedAnalysis(result.analysis.advancedAnalysis)
        setScientificResults(result.analysis.scientificResults)
      } else {
        logger.error("Failed to load analysis:", data.message)
        resetAnalysis()
      }
    } catch (error) {
      logger.error("Failed to load analysis", error)
      resetAnalysis()
    } finally {
      setIsLoadingHistory(false)
      setIsAnalyzing(false)
    }
  }, [resetAnalysis])

  const analyzeDream = useCallback(async () => {
    if (!dreamText.trim()) return

    setIsAnalyzing(true)
    setIsAdvancedAnalysisLoading(true)
    setCurrentStep(0)
    setShowDreamInput(false)

    try {
      // Merge dreamTime into demographics.sleepPatterns.bedtime for REM analysis
      const enhancedDemographics: Demographics | undefined = dreamTime
        ? {
            ...demographics,
            sleepPatterns: {
              ...demographics?.sleepPatterns,
              bedtime: dreamTime, // HH:mm format (e.g., "04:00")
              wakeTime: demographics?.sleepPatterns?.wakeTime || '',
              sleepQuality: demographics?.sleepPatterns?.sleepQuality || 50
            }
          }
        : demographics || undefined

      logger.debug('[useDreamAnalysis] Enhanced demographics with dreamTime:', {
        dreamTime,
        bedtime: enhancedDemographics?.sleepPatterns?.bedtime
      })

      // Use orchestrator for coordinated analysis
      const { orchestrate } = await import('@/lib/analysis/orchestrator')
      const { bundle, rawResults } = await orchestrate(dreamText, language, enhancedDemographics, t)

      setAnalysisBundle(bundle)
      setIsAdvancedAnalysisLoading(false)

      setQuantitativeResult(rawResults.quantitativeResult || null)
      setRemAnalysis(rawResults.remResult || null)
      setContinuityAnalysis(rawResults.continuityResult || null)
      setAdvancedAnalysis(rawResults.advancedResult || null)
      setEmotionAnalysisResult(rawResults.emotionResult || null)

      const legacyAnalysisResult: DreamAnalysisResult = {
        themes: bundle.themes.map((theme) => ({
          theme: theme.id,
          color: '#6366f1', // Will be overridden by UI theme mapping
          emoji: '🔹', // Will be overridden by UI theme mapping
          description: '', // Not available in bundle
          scorePct: theme.scoreNorm || theme.scoreRaw,
          evidence: '', // Not available in bundle
          evidence_level: theme.evidenceLevel
        })),
        emotions: bundle.emotions.labels.map((label) => ({
          emotion: label.tag,
          intensity: label.intensity,
          evidence: '', // Not available in simplified bundle
          evidence_level: 'medium' as const,
          count: 1,
          rawIntensity: label.intensity,
          color: '#6366f1',
          cognitive_domain: 'general' as const,
          dominance: label.intensity / 100,
          foundWords: [],
          translatedName: label.tag,
          emoji: label.valence === 'pos' ? '😊' : label.valence === 'neg' ? '😢' : '😐'
        })),
        insights: [],
        structuredInsights: rawResults.advancedResult?.structuredInsights || [], // Psychological framework analyses
        dreamText,
        confidenceScore: {
          score: bundle.confidence,
          level: bundle.confidence >= 70 ? 'High' : bundle.confidence >= 40 ? 'Medium' : 'Low',
          validThemes: bundle.themes.length,
          totalThemes: bundle.themes.length,
          emotionCount: bundle.emotions.labels.length,
          maxEmotionIntensity: Math.max(...bundle.emotions.labels.map(l => l.intensity), 0),
          highestThemeScore: Math.max(...bundle.themes.map(t => t.scoreNorm || t.scoreRaw), 0),
          expectedMinThemes: 3,
          themeRatio: 100,
          formula: 'Orchestrated analysis'
        }
      };

      setAnalysisResult(legacyAnalysisResult)

      // Log analysis for debugging
      try {
        await fetch("/api/log-analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dreamText,
            analysis: legacyAnalysisResult
          }),
        })
      } catch (error) {
        logger.error("Failed to log analysis to file:", error)
      }
    } catch (error) {
      logger.error('[Dream Analysis Hook] Analysis failed:', error)
      logger.error("Analysis failed:", error)
      resetAnalysis()
    } finally {
      setIsAnalyzing(false)
    }
  }, [dreamText, dreamTime, language, demographics, resetAnalysis])

  const fetchHistory = useCallback(async () => {
    if (!isClient) return

    setIsLoadingHistory(true)
    try {
      const response = await fetch('/api/log-analysis')
      const data = await response.json()
      
      if (data.success) {
        setHistory(data.history || [])
      } else {
        logger.error('Failed to fetch history:', data.message)
      }
    } catch (error) {
      logger.error('Failed to fetch history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [isClient])

  const deleteAnalysis = useCallback(async (filename: string) => {
    if (!isClient) return false

    try {
      const response = await fetch(`/api/history/delete?action=single&filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Refresh history after successful deletion
        await fetchHistory()
        return true
      } else {
        logger.error('Failed to delete analysis:', data.message)
        return false
      }
    } catch (error) {
      logger.error('Failed to delete analysis:', error)
      return false
    }
  }, [isClient, fetchHistory])

  const clearAllHistory = useCallback(async () => {
    if (!isClient) return false

    try {
      const response = await fetch('/api/history/delete?action=all', {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Refresh history after successful deletion
        await fetchHistory()
        return true
      } else {
        logger.error('Failed to clear history:', data.message)
        return false
      }
    } catch (error) {
      logger.error('Failed to clear history:', error)
      return false
    }
  }, [isClient, fetchHistory])

  // Fetch analysis history when component mounts
  useEffect(() => {
    if (isClient) {
      fetchHistory()
    }
  }, [isClient, fetchHistory])

  return {
    dreamText,
    setDreamText,
    dreamTime,
    setDreamTime,
    isAnalyzing,
    analysisResult,
    analysisBundle,
    currentStep,
    showDreamInput,
    setShowDreamInput,
    showDemographics,
    setShowDemographics,
    demographics,
    setDemographics,
    isClient,
    scientificResults,
    advancedAnalysis,
    quantitativeResult,
    remAnalysis,
    continuityAnalysis,
    emotionAnalysisResult,
    isAdvancedAnalysisLoading,
    analysisSteps,
    history,
    isLoadingHistory,
    analyzeDream,
    resetAnalysis,
    loadAnalysis,
    fetchHistory,
    deleteAnalysis,
    clearAllHistory,
  }
}