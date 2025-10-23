"use client"

import React, { useMemo, type ReactNode, useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  ArrowRight,
  BookOpen,
  Eye,
  TrendingUp,
  Moon,
  Link2,
  Palette
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScientificReference } from "@/components/shared/ui"
import { UnifiedAnalysisDashboard } from "@/components/unified-analysis-dashboard"
import QuantitativeMetricsDashboard from "@/components/quantitative-metrics-dashboard"
import REMAnalysisDashboard from "@/components/rem-analysis-dashboard"
import ContinuityAnalysisDashboard from "@/components/continuity-analysis-dashboard"
import StickyMiniMenu from "@/components/StickyMiniMenu"
import DreamScene from "@/components/DreamScene"
import EmotionChart from "@/components/emotion-chart"
import MotifExtraction from "@/components/motif-extraction"
import UnifiedSummary from "@/components/UnifiedSummary"
import { AdvancedDreamAnalysis } from "@/lib/advanced-dream-analysis"
import { ChevronDown, ChevronUp } from "lucide-react"
import { CATEGORY_ICONS, CATEGORY_COLORS } from "@/constants/theme-config"
import { logger } from "@/lib/logger"
import type {
  DreamAnalysisResult,
  QuantitativeAnalysisResult,
  ScientificResults,
  Demographics
} from "@/lib/types"
import type { EmotionResult } from "@/lib/emotion-analysis"
import type { AnalysisBundle } from "@/lib/analysis/types"

interface MenuItem {
  id: string
  label: string
  icon: ReactNode
}

interface VisualTheme {
  theme: string
  color: string
  emoji: string
  description: string
}

interface AnalysisResultsProps {
  bundle?: AnalysisBundle;
  analysisResult: DreamAnalysisResult
  advancedAnalysis: AdvancedDreamAnalysis | null
  scientificResults: ScientificResults | null
  quantitativeResult?: QuantitativeAnalysisResult | null
  emotionAnalysisResult?: any
  remAnalysis?: any
  continuityAnalysis?: any
  resetAnalysis: () => void
  showDreamInput: boolean
  setShowDreamInput: (show: boolean) => void
  t: (key: string, values?: Record<string, unknown>) => string
  isAdvancedAnalysisLoading: boolean
  demographics: Demographics | null
  setShowDemographics: (show: boolean) => void
  language: string
}

const THEME_COLOR_SEQUENCE = [
  "#8B5CF6",
  "#14B8A6",
  "#F97316",
  "#6366F1",
  "#EC4899",
  "#F59E0B",
  "#0EA5E9",
  "#10B981"
] as const

type MotifCategory = keyof typeof CATEGORY_ICONS
// Theme metadata to avoid "Bilinmeyen Tema" and enrich emoji/colors
const THEME_META: Record<string, { emoji: string; color: string; displayTr?: string }> = {
  'dönüşüm': { emoji: '🦋', color: 'from-purple-400 to-blue-400', displayTr: 'Dönüşüm' },
  'şehir': { emoji: '🏙️', color: 'from-slate-400 to-indigo-400', displayTr: 'Şehir' },
  'kimlik': { emoji: '🪪', color: 'from-emerald-400 to-cyan-400', displayTr: 'Kimlik' },
  'ulaşım': { emoji: '🚇', color: 'from-amber-400 to-orange-500', displayTr: 'Ulaşım' },
  'zaman': { emoji: '⏳', color: 'from-pink-400 to-rose-400', displayTr: 'Zaman' },
  'su': { emoji: '🌊', color: 'from-blue-500 to-teal-500', displayTr: 'Su' },
}

/* Unused - can be removed in future cleanup
const MOTIF_CATEGORIES: Record<MotifCategory, readonly string[]> = {
  people: [
    "mother",
    "father",
    "friend",
    "teacher",
    "child",
    "family",
    "crowd",
    "man",
    "woman",
    "boy",
    "girl",
    "brother",
    "sister",
    "boss",
    "colleague",
    "anne",
    "baba",
    "arkadas",
    "ogretmen",
    "cocuk",
    "adam",
    "kadin"
  ],
  animals: [
    "dog",
    "cat",
    "bird",
    "horse",
    "fish",
    "wolf",
    "lion",
    "tiger",
    "bear",
    "snake",
    "insect",
    "butterfly",
    "kus",
    "kopek",
    "kedi",
    "balik",
    "ayi",
    "aslan",
    "at"
  ],
  places: [
    "house",
    "home",
    "school",
    "office",
    "forest",
    "sea",
    "ocean",
    "mountain",
    "city",
    "street",
    "village",
    "temple",
    "room",
    "library",
    "castle",
    "park",
    "garden",
    "hospital",
    "ev",
    "okul",
    "orman",
    "deniz",
    "dag",
    "sehir",
    "sokak"
  ],
  actions: [
    "running",
    "run",
    "flying",
    "fly",
    "falling",
    "fall",
    "chasing",
    "chase",
    "swimming",
    "swim",
    "hiding",
    "hide",
    "fighting",
    "fight",
    "talking",
    "talk",
    "dancing",
    "dance",
    "searching",
    "search",
    "opening",
    "open",
    "closing",
    "close",
    "kosmak",
    "ucmak",
    "dusmek",
    "kovalamak",
    "yuzmek",
    "saklanmak",
    "konusmak",
    "dans",
    "acmak",
    "kapatmak"
  ],
  objects: [
    "key",
    "door",
    "book",
    "phone",
    "mirror",
    "car",
    "bed",
    "window",
    "letter",
    "clock",
    "watch",
    "light",
    "lamp",
    "chair",
    "table",
    "ring",
    "mask",
    "bag",
    "bridge",
    "anahtar",
    "kapi",
    "kitap",
    "telefon",
    "ayna",
    "araba",
    "yatak",
    "pencere",
    "mektup",
    "saat",
    "isik",
    "masa",
    "yuzuk"
  ]
}
*/

/* Unused - can be removed in future cleanup
const normalizeMotifText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
*/


// Optimized Dream Summary Component
function DreamSummary({
  analysisResult,
  showDreamInput,
  setShowDreamInput,
  resetAnalysis,
  t
}: {
  analysisResult: DreamAnalysisResult
  showDreamInput: boolean
  setShowDreamInput: (show: boolean) => void
  resetAnalysis: () => void
  t: (key: string) => string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="bg-slate-900/20 border border-slate-800/50 rounded-xl backdrop-blur-xl overflow-hidden mb-6">
        <div className="flex items-center justify-between cursor-pointer group p-4">
          <div className="flex items-center gap-3">
            <Eye className="w-4 h-4 text-cyan-400" />
            <h3 className="text-lg font-medium text-white">
              {t("results.analyzedDream")}
            </h3>
            <div className="text-xs text-slate-500 bg-slate-800/30 px-2 py-1 rounded-full">
              {analysisResult.dreamText?.length > 120
                ? `${analysisResult.dreamText.substring(0, 120)}...`
                : analysisResult.dreamText || t("results.noDreamText")}
            </div>
          </div>
          <motion.div
            animate={{ rotate: showDreamInput ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="group-hover:text-white transition-colors"
            onClick={() => setShowDreamInput(!showDreamInput)}
          >
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </motion.div>
        </div>

        {showDreamInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-slate-800/50"
          >
            <div className="p-4 pt-0">
              <div className="bg-slate-800/20 rounded-lg p-3 border border-slate-700/20 max-h-64 overflow-y-auto">
                <p className="text-slate-200 text-sm md:text-base leading-relaxed">
                  {analysisResult.dreamText || t("results.noDreamTextDetail")}
                </p>
              </div>

              <div className="mt-3 text-center">
                <Button
                  onClick={() => {
                    resetAnalysis()
                    setShowDreamInput(true)
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-slate-800/30 border-slate-700/50 text-slate-400 hover:bg-slate-700/50 hover:border-slate-600/50 hover:text-white text-xs"
                >
                  <BookOpen className="w-3 h-3 mr-2" />
                  {t("results.editDream")}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// Optimized Summary Cards Component
function SummaryCards({
  bundle,
  analysisResult,
  t
}: {
  bundle?: AnalysisBundle;
  analysisResult: DreamAnalysisResult
  t: (key: string) => string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
    >
      <div className="group card-soft card-hover hover-soft-lift p-5 text-center">
        <div className="text-3xl font-semibold heading-gradient mb-1 flex items-center justify-center gap-2">
          {bundle?.themes?.length ?? analysisResult.themes?.length ?? 0}
        </div>
        <div className="text-xs text-slate-500">
          {t("summary.themes")}
        </div>
      </div>

      <div className="group card-soft card-hover hover-soft-lift p-5 text-center">
        <div className="text-3xl font-semibold heading-gradient mb-1 flex items-center justify-center gap-2">
          {analysisResult.emotions?.length ?? 0}
        </div>
        <div className="text-xs text-slate-500">
          {t("summary.emotions")}
        </div>
      </div>


      <div className="group card-soft card-hover hover-soft-lift p-5 text-center">
        <div
          className={`text-3xl font-semibold heading-gradient mb-1 flex items-center justify-center gap-2 ${
            analysisResult.confidenceScore?.level === "high"
              ? "text-green-400"
              : analysisResult.confidenceScore?.level === "medium"
              ? "text-yellow-400"
              : "text-red-400"
          }`}
        >
          {analysisResult.confidenceScore?.score ?? 0}%
        </div>
        <div className="text-xs text-slate-500">
          {t("summary.confidence")}
        </div>
      </div>
    </motion.div>
  )
}


function AnalysisResults({
  bundle,
  analysisResult,
  advancedAnalysis,
  scientificResults,
  quantitativeResult,
  emotionAnalysisResult,
  remAnalysis,
  continuityAnalysis,
  resetAnalysis,
  showDreamInput,
  setShowDreamInput,
  t,
  isAdvancedAnalysisLoading,
  demographics,
  setShowDemographics,
  language
}: AnalysisResultsProps) {
  
  // Debug: Log when AnalysisResults component renders
  console.log('[AnalysisResults] Component rendered with props:', {
    hasBundle: !!bundle,
    hasAnalysisResult: !!analysisResult,
    hasAdvancedAnalysis: !!advancedAnalysis,
    hasQuantitativeResult: !!quantitativeResult,
    hasEmotionAnalysisResult: !!emotionAnalysisResult,
    hasRemAnalysis: !!remAnalysis,
    hasContinuityAnalysis: !!continuityAnalysis,
    language
  });
  const referenceGroups = useMemo(() => {
    const groups: {
      key: string;
      title: string;
      subtitle?: string;
      icon: ReactNode;
      references: { authors: string; year: number; title: string; journal: string; finding: string }[];
    }[] = [];

    if (advancedAnalysis?.remAnalysis?.scientificReferences?.length) {
      groups.push({
        key: 'rem',
        title: t('references.remTitle'),
        subtitle: t('references.remSubtitle'),
        icon: <Moon className="w-5 h-5 text-purple-300" />,
        references: advancedAnalysis.remAnalysis.scientificReferences,
      });
    }

    if (advancedAnalysis?.continuityAnalysis?.scientificReferences?.length) {
      groups.push({
        key: 'continuity',
        title: t('references.continuityTitle'),
        subtitle: t('references.continuitySubtitle'),
        icon: <Link2 className="w-5 h-5 text-blue-300" />,
        references: advancedAnalysis.continuityAnalysis.scientificReferences,
      });
    }

    return groups;
  }, [advancedAnalysis?.continuityAnalysis?.scientificReferences, advancedAnalysis?.remAnalysis?.scientificReferences, t]);


  const visualThemes = useMemo<VisualTheme[]>(() => {
    // Determine which source we're actually using (not just which exists)
    let themeSource: 'advanced' | 'bundle' | 'legacy' = 'legacy'
    let rawThemes: any[] = []

    if (advancedAnalysis?.themes && advancedAnalysis.themes.length > 0) {
      themeSource = 'advanced'
      rawThemes = advancedAnalysis.themes
    } else if (bundle?.themes && bundle.themes.length > 0) {
      themeSource = 'bundle'
      rawThemes = bundle.themes
    } else {
      themeSource = 'legacy'
      rawThemes = analysisResult?.themes || []
    }

    logger.debug('[AnalysisResults] Theme source determination:', {
      source: themeSource,
      rawThemeCount: rawThemes.length,
      firstTheme: rawThemes[0] || null
    })

    if (rawThemes.length === 0) {
      return []
    }

    const fallbackDescription = t("results.noThemeDescription", { defaultValue: "Detailed description not found." })
    const fallbackName = t("results.unknownTheme", { defaultValue: "Unknown Theme" })
    const seen = new Set<string>()

    return rawThemes
      .slice()
      .sort((a, b) => {
        // Use correct score property based on actual source
        const aScore = themeSource === 'bundle' ?
          ((a as any).scoreNorm || 0) :
          (typeof (a as any).scorePct === "number" ? (a as any).scorePct : typeof (a as any).intensity === "number" ? (a as any).intensity : 0)
        const bScore = themeSource === 'bundle' ?
          ((b as any).scoreNorm || 0) :
          (typeof (b as any).scorePct === "number" ? (b as any).scorePct : typeof (b as any).intensity === "number" ? (b as any).intensity : 0)
        return bScore - aScore
      })
      .reduce<VisualTheme[]>((acc, theme) => {
        // Use correct property based on actual source (not just existence check)
        const themeName = themeSource === 'bundle'
          ? ((theme as any).id || fallbackName)           // Bundle uses .id
          : ((theme as any)?.theme?.trim() || fallbackName)  // Advanced/legacy use .theme
        const normalized = themeName.toLowerCase()
        const meta = THEME_META[normalized]
        if (seen.has(normalized)) {
          return acc
        }
        seen.add(normalized)

        const themeEmoji = (theme as any)?.emoji || "🔹"

        const __emoji = /�/.test(String(themeEmoji)) ? (meta?.emoji || '🔹') : themeEmoji
        acc.push({
          theme: meta?.displayTr || themeName,
          color:
            (theme as any)?.color || meta?.color || THEME_COLOR_SEQUENCE[acc.length % THEME_COLOR_SEQUENCE.length],
          emoji: __emoji,
          description: themeSource === 'bundle' ?
            ((theme as any).description || fallbackDescription) :
            ((theme as any)?.description || (theme as any)?.evidence || fallbackDescription)
        })

        return acc
      }, [])
      .slice(0, 8)
  }, [advancedAnalysis?.themes, bundle?.themes, analysisResult?.themes, t])

  // Log visual themes for debugging (runs once when themes change)
  useEffect(() => {
    if (visualThemes.length > 0) {
      logger.debug('[AnalysisResults] Visual themes loaded:', {
        count: visualThemes.length,
        themes: visualThemes.map(t => ({ theme: t.theme, emoji: t.emoji }))
      })
    }
  }, [visualThemes])

  const emotionChartData = useMemo(() => {
    const distribution: Record<string, number> = {}

    if (emotionAnalysisResult) {
      try {
        const addEmotion = (emotion?: EmotionResult | null) => {
          if (!emotion || !emotion.emotion) return

          const key = emotion.emotion.toLowerCase()
          const value = typeof emotion.intensity === "number" ? Math.round(emotion.intensity) : 0

          if (value > 0) {
            distribution[key] = Math.max(distribution[key] ?? 0, value)
          }
        }

        addEmotion(emotionAnalysisResult.primaryEmotion)
        emotionAnalysisResult.secondaryEmotions?.forEach(addEmotion)
      } catch (error) {
        logger.warn("Emotion analysis failed for visualization", error)
      }
    }

    if (quantitativeResult?.emotions && Array.isArray(quantitativeResult.emotions)) {
      quantitativeResult.emotions.forEach(item => {
        if (!item?.type) return
        const key = String(item.type).toLowerCase()
        const value = Number(item.count) || 0

        if (value > 0) {
          distribution[key] = Math.max(distribution[key] ?? 0, value * 10)
        }
      })
    }

    return distribution
  }, [emotionAnalysisResult, quantitativeResult])

  const motifData = useMemo(() => {
    if (!analysisResult?.dreamText) {
      return (Object.keys(CATEGORY_ICONS) as MotifCategory[]).reduce<Record<MotifCategory, string[]>>((acc, key) => {
        acc[key] = []
        return acc
      }, {} as Record<MotifCategory, string[]>)
    }

    const text = analysisResult.dreamText.toLowerCase()
    const motifs: Record<MotifCategory, string[]> = {
      characters: [],
      animals: [],
      places: [],
      activities: [],
      objects: []
    }

    // Karakter motifleri
    const characterKeywords = ['insan', 'kişi', 'adam', 'kadın', 'çocuk', 'bebek', 'arkadaş', 'aile', 'anne', 'baba', 'kardeş']
    characterKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        motifs.characters.push(keyword)
      }
    })

    // Hayvan motifleri
    const animalKeywords = ['köpek', 'kedi', 'kuş', 'at', 'inek', 'koyun', 'tavuk', 'balık', 'yılan', 'ayı', 'aslan', 'kaplan']
    animalKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        motifs.animals.push(keyword)
      }
    })

    // Yer motifleri
    const placeKeywords = ['ev', 'oda', 'okul', 'iş', 'sokak', 'şehir', 'köy', 'deniz', 'orman', 'dağ', 'yol', 'araba']
    placeKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        motifs.places.push(keyword)
      }
    })

    // Aktivite motifleri
    const activityKeywords = ['uçmak', 'koşmak', 'yüzmek', 'düşmek', 'uçmak', 'yemek', 'içmek', 'konuşmak', 'dans', 'şarkı']
    activityKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        motifs.activities.push(keyword)
      }
    })

    // Nesne motifleri
    const objectKeywords = ['kapı', 'ayna', 'gölge', 'ışık', 'su', 'ateş', 'rüzgar', 'yağmur', 'kar', 'güneş']
    objectKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        motifs.objects.push(keyword)
      }
    })

    return motifs
  }, [analysisResult?.dreamText])

  const hasVisualThemes = visualThemes.length > 0
  const hasEmotionData = Object.values(emotionChartData).some(value => value > 0)
  const hasMotifMatches = Object.values(motifData).some(items => items.length > 0)
  const hasVisualSection = useMemo(() =>
    hasVisualThemes || hasEmotionData || hasMotifMatches,
    [hasVisualThemes, hasEmotionData, hasMotifMatches]
  )

  const menuItems = useMemo(() => {
    const items: MenuItem[] = []

    if (hasVisualSection) {
      items.push({
        id: 'visual',
        label: t('results.visualRepresentation'),
        icon: <Palette className="w-4 h-4" />
      })
    }

    // AI Expert Analysis removed - now using unified summary

    console.log('[AnalysisResults] Checking quant-dashboard conditions:', {
      hasQuantitativeResult: !!quantitativeResult,
      hasAdvancedAnalysis: !!advancedAnalysis,
      hasEmotionAnalysis: !!advancedAnalysis?.emotionAnalysis,
      quantitativeResultKeys: quantitativeResult ? Object.keys(quantitativeResult) : [],
      advancedAnalysisKeys: advancedAnalysis ? Object.keys(advancedAnalysis) : []
    });

    if (quantitativeResult || advancedAnalysis?.emotionAnalysis) {
      items.push({ id: 'quant-dashboard', label: t('results.quantDashboard'), icon: <TrendingUp className="w-4 h-4" /> });
      console.log('[AnalysisResults] Added quant-dashboard to menu');
    } else {
      console.log('[AnalysisResults] quant-dashboard NOT added to menu - conditions not met');
    }

    if (remAnalysis) {
      items.push({ id: 'rem', label: t('results.remAnalysis'), icon: <Moon className="w-4 h-4" /> });
    }

    if (continuityAnalysis) {
      items.push({ id: 'continuity', label: t('results.continuityAnalysis'), icon: <Link2 className="w-4 h-4" /> });
    }

    if (referenceGroups.length > 0) {
      items.push({ id: 'references', label: t('results.references'), icon: <BookOpen className="w-4 h-4" /> });
    }

    return items;
  }, [hasVisualSection, t, quantitativeResult, advancedAnalysis?.emotionAnalysis, remAnalysis, continuityAnalysis, referenceGroups.length]);

  const accordionKeys = useMemo(() => menuItems.map(item => item.id), [menuItems])

  const [open, setOpen] = useState<string[]>(() => accordionKeys)

  useEffect(() => {
    setOpen(prev => {
      if (prev.length === accordionKeys.length && prev.every((id, index) => id === accordionKeys[index])) {
        return prev
      }
      return accordionKeys
    })
  }, [accordionKeys])

  const copyAnchor = useCallback((id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`
    navigator.clipboard?.writeText(url)
  }, [])

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.6 }}
      className="max-w-7xl mx-auto"
    >
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-3 mb-8"
      >
        <Button
          onClick={resetAnalysis}
          variant="outline"
          className="bg-slate-900/30 border-slate-700/50 text-slate-300 hover:bg-slate-800/50 hover:border-slate-600/50 hover:text-white transition-all duration-300 rounded-xl"
        >
          <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
          {t("results.newAnalysis")}
        </Button>
        <div className="text-xs text-slate-500">
          {t("results.newAnalysisSubtitle")}
        </div>
      </motion.div>
      <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-8">
        <aside className="hidden lg:block">
          <StickyMiniMenu items={menuItems} title={t('sections')} />
        </aside>
        <main className="space-y-8">
          {isAdvancedAnalysisLoading && (
            <div className="rounded-xl border border-slate-800/50 bg-slate-900/30 p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand-purple border-t-transparent"></div>
                <span className="text-sm text-slate-300">{t('results.loadingAdvancedAnalysis')}</span>
              </div>
              <p className="text-xs text-slate-400">
                {t('results.loadingAdvancedAnalysisDesc', { defaultValue: 'Analyzing dream patterns and generating insights...' })}
              </p>
            </div>
          )}
          {/* Optimized Components */}
          <section id="summary" className="anchor-offset">
            <DreamSummary
              analysisResult={analysisResult}
              showDreamInput={showDreamInput}
              setShowDreamInput={setShowDreamInput}
              resetAnalysis={resetAnalysis}
              t={t}
            />
          </section>

          {/* Unified Summary - Replaces old two summaries */}
          <section aria-labelledby="unified-summary" className="space-y-3">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-8" />
            <UnifiedSummary
              bundle={bundle || undefined}
              analysisResult={analysisResult}
              advancedAnalysis={advancedAnalysis}
              quantitativeResult={quantitativeResult || null}
              emotionAnalysisResult={emotionAnalysisResult}
              language={language}
              t={t}
            />
          </section>



          {(quantitativeResult || emotionAnalysisResult || advancedAnalysis) && (
            <section id="detailed-report" className="anchor-offset space-y-6">
              <UnifiedAnalysisDashboard
                bundle={bundle}
                analysisResult={analysisResult}
                quantitativeResult={quantitativeResult ?? null}
                emotionAnalysisResult={emotionAnalysisResult ?? null}
                remAnalysis={remAnalysis}
                continuityAnalysis={continuityAnalysis}
                language={language}
                t={t}
              />
            </section>
          )}

          <SummaryCards bundle={bundle} analysisResult={analysisResult} t={t} />

          <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-8" />

          {hasVisualSection && (
            <>
              <section id="visual" className="anchor-offset">
                <div className="group relative">
                  <button
                    onClick={() => copyAnchor('visual')}
                    className="hidden lg:block absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white"
                    aria-label="Copy link"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>
                  <div
                    className="flex items-center justify-between cursor-pointer py-4 border-b border-slate-800/40 hover:border-brand-purple/40 transition-colors"
                    onClick={() => setOpen(open.includes('visual') ? open.filter(id => id !== 'visual') : [...open, 'visual'])}
                    aria-expanded={open.includes('visual')}
                    aria-controls="visual-content"
                    role="button"
                  >
                    <div className="flex items-center gap-3">
                      <Palette className="w-5 h-5 text-brand-purple" />
                      <h2 id="visual-heading" className="text-xl font-medium text-white">{t('results.visualRepresentation')}</h2>
                    </div>
                    {open.includes('visual') ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                  {open.includes('visual') && (
                    <div id="visual-content" className="mt-6 space-y-6" role="region" aria-labelledby="visual-heading">
                      <Card className="card-soft card-hover">
                        <CardHeader className="space-y-1">
                          <CardTitle className="text-white text-lg">
                            {t('results.themeConstellations')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {hasVisualThemes ? (
                            <div className="h-32 w-full">
                              <DreamScene themes={visualThemes.slice(0, 6)} />
                            </div>
                          ) : (
                            <div className="flex h-32 w-full items-center justify-center text-sm text-slate-400">
                              {t('results.noThemeVisualization')}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <Card className="card-soft card-hover">
                          <CardHeader className="space-y-1">
                            <CardTitle className="text-white text-lg">
                              {t('results.emotionLandscape')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-64 w-full">
                              <EmotionChart emotions={emotionChartData} />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="card-soft card-hover">
                          <CardHeader className="space-y-1">
                            <CardTitle className="text-white text-lg">
                              {t('results.motifHighlights')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="max-h-64 overflow-y-auto pr-2">
                              <MotifExtraction
                                motifs={motifData}
                                categoryIcons={CATEGORY_ICONS}
                                categoryColors={CATEGORY_COLORS}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-8" />

          {/* Collapsible sections with clean headers */}
          <div className="space-y-8">
            {/* AI Expert Analysis section removed - now using unified summary */}

            {/* Quantitative Dashboard */}
            {(quantitativeResult || advancedAnalysis?.emotionAnalysis) && (
              <section id="quant-dashboard" className="anchor-offset">
                <div className="group relative">
                  <button onClick={() => copyAnchor('quant-dashboard')} className="hidden lg:block absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white" aria-label="Copy link"><Link2 className="w-4 h-4" /></button>
                  <div
                    className="flex items-center justify-between cursor-pointer py-4 border-b border-slate-800/40 hover:border-brand-orange/40 transition-colors"
                    onClick={() => setOpen(open.includes('quant-dashboard') ? open.filter(id => id !== 'quant-dashboard') : [...open, 'quant-dashboard'])}
                    aria-expanded={open.includes('quant-dashboard')}
                    aria-controls="quant-dashboard-content"
                    role="button"
                  >
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-brand-orange" />
                      <h2 id="quant-dashboard-heading" className="text-xl font-medium text-white">{t("results.quantDashboard")}</h2>
                    </div>
                    {open.includes('quant-dashboard') ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                  {open.includes('quant-dashboard') && (
                    <div id="quant-dashboard-content" className="mt-6" role="region" aria-labelledby="quant-dashboard-heading">
                      {(() => {
                        console.log('[AnalysisResults] Rendering QuantitativeMetricsDashboard with props:', {
                          hasBundle: !!bundle,
                          hasQuantitativeResult: !!quantitativeResult,
                          hasEmotionAnalysisResult: !!emotionAnalysisResult,
                          dreamTextLength: analysisResult.dreamText?.length || 0
                        });
                        return (
                          <QuantitativeMetricsDashboard
                            bundle={bundle}
                            quantitativeData={quantitativeResult}
                            emotionData={emotionAnalysisResult}
                            dreamText={analysisResult.dreamText}
                          />
                        );
                      })()}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* REM Analysis */}
            {remAnalysis && (
              <section id="rem" className="anchor-offset">
                <div className="group relative">
                  <button onClick={() => copyAnchor('rem')} className="hidden lg:block absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white" aria-label="Copy link"><Link2 className="w-4 h-4" /></button>
                  <div 
                    className="flex items-center justify-between cursor-pointer py-4 border-b border-slate-800/40 hover:border-brand-purple/40 transition-colors"
                    onClick={() => setOpen(open.includes('rem') ? open.filter(id => id !== 'rem') : [...open, 'rem'])}
                  >
                    <div className="flex items-center gap-3">
                      <Moon className="w-5 h-5 text-brand-purple" />
                      <h2 className="text-xl font-medium text-white">{t("results.remAnalysis")}</h2>
                    </div>
                    {open.includes('rem') ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                  {open.includes('rem') && (
                    <div className="mt-6">
                      <REMAnalysisDashboard remAnalysis={remAnalysis} />
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Continuity Analysis */}
            {continuityAnalysis && (
              <section id="continuity" className="anchor-offset">
                <div className="group relative">
                  <button onClick={() => copyAnchor('continuity')} className="hidden lg:block absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white" aria-label="Copy link"><Link2 className="w-4 h-4" /></button>
                  <div 
                    className="flex items-center justify-between cursor-pointer py-4 border-b border-slate-800/40 hover:border-brand-orange/40 transition-colors"
                    onClick={() => setOpen(open.includes('continuity') ? open.filter(id => id !== 'continuity') : [...open, 'continuity'])}
                  >
                    <div className="flex items-center gap-3">
                      <Link2 className="w-5 h-5 text-brand-orange" />
                      <h2 className="text-xl font-medium text-white">{t("results.continuityAnalysis")}</h2>
                    </div>
                    {open.includes('continuity') ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                  {open.includes('continuity') && (
                    <div className="mt-6">
                      <ContinuityAnalysisDashboard continuityAnalysis={continuityAnalysis}  t={t} />
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* References */}
            {referenceGroups.length > 0 && (
              <section id="references" className="anchor-offset">
                <div className="group relative">
                  <button onClick={() => copyAnchor('references')} className="hidden lg:block absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white" aria-label="Copy link"><Link2 className="w-4 h-4" /></button>
                  <div 
                    className="flex items-center justify-between cursor-pointer py-4 border-b border-slate-800/40 hover:border-brand-purple/40 transition-colors"
                    onClick={() => setOpen(open.includes('references') ? open.filter(id => id !== 'references') : [...open, 'references'])}
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-brand-purple" />
                      <h2 className="text-xl font-medium text-white">{t("results.references")}</h2>
                    </div>
                    {open.includes('references') ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                  {open.includes('references') && (
                    <div className="mt-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {referenceGroups.map(group => (
                          <Card key={group.key} className="card-soft card-hover">
                            <CardHeader className="space-y-1">
                              <CardTitle className="flex items-center gap-2 text-white">
                                {group.icon}
                                {group.title}
                              </CardTitle>
                              {group.subtitle && (
                                <p className="text-xs text-slate-400">{group.subtitle}</p>
                              )}
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {group.references.slice(0, 3).map((ref, refIndex) => (
                                  <ScientificReference
                                    key={`${group.key}-${refIndex}`}
                                    reference={ref}
                                    index={refIndex}
                                  />
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Scientific Analysis Warning */}
          {!scientificResults && !demographics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 text-yellow-400 mt-0.5">âš ï¸</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-yellow-300 mb-2">
                      {t("warnings.simpleAnalysisMode")}
                    </h4>
                    <p className="text-xs text-yellow-200 mb-3">
                      {t("warnings.simpleAnalysisText")}
                    </p>
                    <Button
                      onClick={() => setShowDemographics(true)}
                      size="sm"
                      className="bg-yellow-800/50 border border-yellow-700/50 text-yellow-200 hover:bg-yellow-700/50 text-xs"
                    >
                      {t("warnings.enableScientificAnalysis")}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </motion.div>
  )
}

// Wrap component with React.memo to prevent unnecessary re-renders
export default React.memo(AnalysisResults);
