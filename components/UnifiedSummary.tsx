"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Cpu, Heart, Lightbulb, Shield, BookOpen, Loader2 } from 'lucide-react'
import { createUserFriendlySummary, UserFriendlySummary } from '@/lib/user-friendly-summary'
import { DreamAnalysisResult } from '@/lib/types'
import { AdvancedDreamAnalysis } from '@/lib/advanced-dream-analysis'
import { QuantitativeAnalysisResult } from '@/lib/types'
import type { EmotionResult } from '@/lib/emotion-analysis'
import type { AnalysisBundle } from '@/lib/analysis/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { fixTurkishMojibake } from '@/lib/text-normalize'
import { generateDreamInterpretation, createFallbackInterpretation } from '@/lib/ai-dream-interpreter'
import { useTranslation } from '@/contexts/LanguageContext'

// Helper function to create summary from AnalysisBundle
async function createSummaryFromBundle(bundle: AnalysisBundle, language: string, t: (key: string) => string): Promise<UserFriendlySummary> {
  const isTurkish = language === 'tr'

  const topThemes = bundle.themes
    .sort((a, b) => (b.scoreNorm || 0) - (a.scoreNorm || 0))
    .slice(0, 3)

  let title = t('summaryLabels.dreamAnalysis')
  if (topThemes.length > 0) {
    const mainTheme = topThemes[0]
    title = isTurkish
      ? `${mainTheme.id.charAt(0).toUpperCase() + mainTheme.id.slice(1)} Temalı Rüya`
      : `${mainTheme.id.charAt(0).toUpperCase() + mainTheme.id.slice(1)} Themed Dream`
  }

  let mainInsight = ""

  try {
    console.log('[UnifiedSummary] Generating AI dream interpretation...')

    mainInsight = await generateDreamInterpretation({
      dreamText: bundle.sourceText,
      analysisBundle: bundle,
      language
    })

    console.log('[UnifiedSummary] AI interpretation generated successfully:', {
      length: mainInsight.length,
      preview: mainInsight.substring(0, 100)
    })
  } catch (error) {
    console.error('[UnifiedSummary] AI interpretation failed, using fallback:', error)

    // Use fallback interpretation when AI fails
    mainInsight = createFallbackInterpretation(bundle, language)
  }
  
  const emotionCount = bundle.emotions.labels.length
  const themeCount = topThemes.length
  const hasMetamorphosis = bundle.hasMetamorphosis

  return {
    title,
    mainInsight,
    sections: {
      whatHappened: t('summaryLabels.dreamContentAnalyzed'),
      whatItMeans: t('summaryLabels.emotionalThematicAnalysisCompleted'),
      emotions: `${t('summaryLabels.emotionalTone')}: ${bundle.emotions.tone}`,
      symbols: `${themeCount} ${t('summaryLabels.themesDetected')}`,
      practicalInsights: "",
      scientificNote: isTurkish
        ? `Analiz Metrikleri: ${emotionCount} duygu, ${themeCount} tema, ${bundle.sleep.stage} uyku evresi${hasMetamorphosis ? ', metamorfoz tespiti' : ''}. Hall-Van de Castle ve Domhoff metodolojileri kullanıldı.`
        : `Analysis Metrics: ${emotionCount} emotions, ${themeCount} themes, ${bundle.sleep.stage} sleep stage${hasMetamorphosis ? ', metamorphosis detected' : ''}. Used Hall-Van de Castle and Domhoff methodologies.`
    }
  }
}

interface UnifiedSummaryProps {
  bundle?: AnalysisBundle
  analysisResult?: DreamAnalysisResult // Keep for backward compatibility
  advancedAnalysis?: AdvancedDreamAnalysis | null
  quantitativeResult?: QuantitativeAnalysisResult | null
  emotionAnalysisResult?: any
  language: string
  t: (key: string) => string
}

export default function UnifiedSummary({
  bundle,
  analysisResult,
  advancedAnalysis,
  quantitativeResult,
  emotionAnalysisResult,
  language,
  t
}: UnifiedSummaryProps) {
  const [summary, setSummary] = useState<UserFriendlySummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Track last processed data to prevent duplicate generation
  const lastProcessedRef = useRef<{ 
    bundleId?: string; 
    analysisResultId?: string; 
    language: string 
  } | null>(null)

  useEffect(() => {
    // Create unique identifiers for the data
    const bundleId = bundle ? `${bundle.sourceText.slice(0, 50)}-${language}` : null
    const analysisResultId = analysisResult ? `${analysisResult.dreamText.slice(0, 50)}-${language}` : null
    
    // Check if we've already processed this exact data
    if (lastProcessedRef.current) {
      const sameBundle = bundleId && lastProcessedRef.current.bundleId === bundleId
      const sameAnalysisResult = analysisResultId && lastProcessedRef.current.analysisResultId === analysisResultId
      const sameLanguage = lastProcessedRef.current.language === language

      if (sameLanguage && (sameBundle || (!bundleId && sameAnalysisResult))) {
        console.log('[UnifiedSummary] Skipping duplicate AI call - same data already processed')
        return
      }
    }

    // Mark as processing IMMEDIATELY to prevent duplicate calls
    lastProcessedRef.current = { 
      bundleId: bundleId || undefined, 
      analysisResultId: analysisResultId || undefined,
      language 
    }

    const loadSummary = async () => {
      try {
        setIsLoading(true)
        setError(null)
        setSummary(null)

        // Use bundle if available, otherwise fall back to legacy approach
        if (bundle) {
          const result = await createSummaryFromBundle(bundle, language, t)
          setSummary(result)
        } else if (analysisResult) {
          const result = await createUserFriendlySummary(
            analysisResult,
            advancedAnalysis || null,
            quantitativeResult || null,
            emotionAnalysisResult || null,
            language
          )
          setSummary(result)
        }
      } catch (error) {
        console.error('Failed to generate summary:', error)
        setSummary(null)
        const fallbackMessage = t('summaryLabels.summaryCurrentlyUnavailable')
        setError(fallbackMessage)
      } finally {
        setIsLoading(false)
      }
    }

    loadSummary()
  }, [bundle, analysisResult, advancedAnalysis, quantitativeResult, emotionAnalysisResult, language])
  
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        <Card className="card-soft card-hover border-brand-purple/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-light text-white">
              <div className="p-2 bg-brand-purple/20 rounded-lg border border-brand-purple/30">
                <Cpu className="w-4 h-4 text-brand-purple" />
              </div>
              <div className="flex items-center gap-2">
                <span className="h-subsection">
                  {t('summaryLabels.generatingDreamInterpretation')}
                </span>
                <Loader2 className="w-4 h-4 animate-spin text-brand-purple" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-slate-300 text-sm">
              {language === 'tr'
                ? 'AI rüya yorumcusu, rüyanızı psikolojik çerçeveler kullanarak analiz ediyor...'
                : 'AI dream analyst is interpreting your dream using psychological frameworks...'
              }
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }
  
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <Card className="card-soft border-red-500/40 bg-red-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
              <div className="p-2 bg-red-500/20 rounded-lg border border-red-500/40">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <span>{t('summaryLabels.summaryUnavailable')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-100/80 leading-relaxed">{error}</p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }
  
  if (!summary) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-6"
    >
      {/* Main Title and Summary - Minimal */}
      <Card className="card-soft card-hover border-brand-purple/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium text-white">
            <div className="p-1.5 bg-white/10 backdrop-blur-sm rounded border border-white/20">
              <Cpu className="w-3 h-3 text-white" />
            </div>
            <span>📌 {fixTurkishMojibake(summary.title)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-slate-200 leading-snug text-sm prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => <h2 className="text-sm font-semibold text-white mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xs font-medium text-slate-200 mb-1.5">{children}</h3>,
                p: ({ children }) => <p className="text-slate-200 text-sm mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="mb-2 last:mb-0 space-y-1 ml-3">{children}</ul>,
                ol: ({ children }) => <ol className="mb-2 last:mb-0 space-y-1 ml-3">{children}</ol>,
                li: ({ children }) => <li className="text-slate-300 text-sm">{children}</li>,
                strong: ({ children }) => <strong className="text-white font-medium text-sm">{children}</strong>,
                em: ({ children }) => <em className="text-slate-100 italic text-sm">{children}</em>,
                table: ({ children }) => (
                  <div className="table-responsive">
                    <table className="min-w-full border border-slate-600 rounded overflow-hidden">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-slate-700/50">{children}</thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="bg-slate-800/30">{children}</tbody>
                ),
                tr: ({ children }) => (
                  <tr className="border-b border-slate-600">{children}</tr>
                ),
                th: ({ children }) => (
                  <th className="px-2 py-1 text-left text-xs font-medium text-white border-r border-slate-600 last:border-r-0">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-2 py-1 text-xs text-slate-300 border-r border-slate-600 last:border-r-0">
                    {children}
                  </td>
                ),
              }}
            >
              {fixTurkishMojibake(summary.mainInsight)}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>


      {/* Practical Recommendations - REMOVED per user feedback */}
      {summary.sections.practicalInsights && summary.sections.practicalInsights.trim().length > 0 && (
        <Card className="card-soft card-hover border-brand-orange/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-white">
              <Lightbulb className="w-3 h-3 text-brand-orange" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xs text-slate-300 leading-tight prose prose-invert prose-xs max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-1 last:mb-0 text-slate-300 text-xs">{children}</p>,
                  ul: ({ children }) => <ul className="mb-1 last:mb-0 space-y-0.5 ml-2">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-1 last:mb-0 space-y-0.5 ml-2">{children}</ol>,
                  li: ({ children }) => <li className="text-slate-300 text-xs">{children}</li>,
                  strong: ({ children }) => <strong className="text-slate-100 font-medium text-xs">{children}</strong>,
                  em: ({ children }) => <em className="text-slate-200 italic text-xs">{children}</em>,
                  h2: ({ children }) => <h2 className="text-sm font-medium text-white mb-1">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-xs font-medium text-slate-200 mb-0.5">{children}</h3>,
                  table: ({ children }) => (
                    <div className="table-responsive">
                      <table className="min-w-full border border-slate-600 rounded overflow-hidden">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-slate-700/50">{children}</thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="bg-slate-800/30">{children}</tbody>
                  ),
                  tr: ({ children }) => (
                    <tr className="border-b border-slate-600">{children}</tr>
                  ),
                  th: ({ children }) => (
                    <th className="px-2 py-1 text-left text-xs font-medium text-white border-r border-slate-600 last:border-r-0">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-2 py-1 text-xs text-slate-300 border-r border-slate-600 last:border-r-0">
                      {children}
                    </td>
                  ),
                }}
              >
                {fixTurkishMojibake(summary.sections.practicalInsights)}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scientific Note */}
      <Card className="card-soft border-slate-700/50 bg-slate-800/20">
        <CardContent className="pt-4">
          <div className="text-xs text-slate-400 leading-relaxed">
            {fixTurkishMojibake(summary.sections.scientificNote)}
          </div>
        </CardContent>
      </Card>

      <div className="sticky-cta">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {t('summaryLabels.newDreamAnalysis')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('summaryLabels.analyzeAnotherDream')}
              </p>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-brand-purple/20 hover:bg-brand-purple/30 border border-brand-purple/30 rounded-lg text-sm font-medium text-brand-purple transition-colors"
          >
            {t('summaryLabels.newDream')}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

