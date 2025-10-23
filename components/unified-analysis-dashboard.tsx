"use client"

import React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { MetricCard } from "@/components/shared/ui"
import { fixTurkishMojibake } from "@/lib/text-normalize"
import { formatEmotionLabel } from "@/lib/format-emotion-label"
import { translateThemeName, type Language } from "@/lib/translations"
import type {
  DreamAnalysisResult,
  QuantitativeAnalysisResult,
  ContinuityAnalysisResult,
  REMAnalysisResult,
} from "@/lib/types"
import type { EmotionAnalysisResult } from "@/lib/emotion-analysis"
import type { AnalysisBundle } from "@/lib/analysis/types"
import {
  Activity,
  Moon,
  Gauge,
  Sparkles,
} from "lucide-react"

interface UnifiedAnalysisDashboardProps {
  bundle?: AnalysisBundle;
  analysisResult: DreamAnalysisResult
  quantitativeResult?: QuantitativeAnalysisResult | null
  emotionAnalysisResult?: EmotionAnalysisResult | null
  remAnalysis?: REMAnalysisResult | null
  continuityAnalysis?: ContinuityAnalysisResult | null
  language: string
  t: (key: string) => string
}

const formatPercentage = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "N/A"
  return `${Math.round(value)}%`
}

const formatList = (items?: string[] | null, prefix = "item") =>
  (items && items.length > 0 ? items : []).map((item, index) => (
    <li key={`${prefix}-${index}`} className="text-sm text-slate-300">
      {fixTurkishMojibake(item)}
    </li>
  ))

const SectionTitle: React.FC<{ label: string; pill?: string }> = ({ label, pill }) => (
  <div className="flex items-center justify-between">
    <CardTitle className="text-white text-lg">{label}</CardTitle>
    {pill && <Badge variant="outline" className="text-xs uppercase tracking-wide text-slate-300 border-slate-600">{pill}</Badge>}
  </div>
)

export function UnifiedAnalysisDashboard({
  bundle,
  analysisResult,
  quantitativeResult,
  emotionAnalysisResult,
  remAnalysis,
  continuityAnalysis,
  language,
  t,
}: UnifiedAnalysisDashboardProps) {
  const isTurkish = language === "tr"

  const confidence = analysisResult.confidenceScore;

  const labels = React.useMemo(() => ({
    detailedTitle: t('dashboard.detailedTitle'),
    highlights: t('dashboard.highlights'),
    themes: t('dashboard.themes'),
    emotions: t('dashboard.emotions'),
    meaning: t('dashboard.meaning'),
    symbols: t('dashboard.symbols'),
    quantitative: t('dashboard.quantitative'),
    rem: t('dashboard.rem'),
    continuity: t('dashboard.continuity'),
    confidence: t('dashboard.confidence'),
    noData: t('dashboard.noData'),
    themesDesc: t('dashboard.themesDesc'),
    emotionsDesc: t('dashboard.emotionsDesc'),
  }), [t])

  const insights = React.useMemo(() => (analysisResult.insights || []).slice(0, 5), [analysisResult.insights])
  const themes = React.useMemo(() => bundle?.themes || analysisResult.themes || [], [bundle?.themes, analysisResult.themes])
  const structuredInsights = React.useMemo(() => (analysisResult.structuredInsights || []).filter((s: any) => s.type !== 'practical'), [analysisResult.structuredInsights])
  const dreamEmotions = React.useMemo(() => emotionAnalysisResult
    ? [
        emotionAnalysisResult.primaryEmotion,
        ...(emotionAnalysisResult.secondaryEmotions || []),
      ].filter(Boolean)
    : analysisResult.emotions || [], [emotionAnalysisResult, analysisResult.emotions])

  const valenceBalance = emotionAnalysisResult?.valenceBalance

  const characterBreakdown = quantitativeResult?.characters || []
  const interactionTypes = quantitativeResult?.socialInteractions?.types

  const remMissing = remAnalysis === null
  const contMissing = continuityAnalysis === null

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {remMissing && contMissing ? (
          <Card className="card-soft card-hover border-yellow-700/30 bg-yellow-900/10">
            <CardContent className="py-6 text-center space-y-2">
              <Moon className="w-8 h-8 mx-auto text-yellow-500/50" />
              <p className="text-sm text-yellow-200">
                {t('dashboard.completeDemographicsBoth')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {remAnalysis ? (
              <Card className="card-soft card-hover">
                <CardHeader>
                  <SectionTitle label={labels.rem} pill="REM" />
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-300">
                  <p>
                    <strong className="text-slate-200">{t('rem.sleepStageEstimate')}:</strong>{" "}
                    {fixTurkishMojibake(remAnalysis.sleepStageEstimate.estimatedSleepStage)} ({formatPercentage(remAnalysis.sleepStageEstimate.dreamVividness)} {t('rem.vividness')})
                  </p>
                  <p>
                    <strong className="text-slate-200">{t('rem.neurochemistry')}:</strong>{" "}
                    {t('rem.acetylcholine')}: {remAnalysis.neuroscientificInsights.acetylcholineLevel}, {t('rem.dopamine')}: {remAnalysis.neuroscientificInsights.dopamineActivity}
                  </p>
                  <p>
                    <strong className="text-slate-200">{t('rem.circadianRhythm')}:</strong>{" "}
                    {fixTurkishMojibake(remAnalysis.circadianFactors.timeOfNight)} ({formatPercentage((remAnalysis.circadianFactors.remProbability as number) * 100)} REM)
                  </p>
                </CardContent>
              </Card>
            ) : remMissing ? (
              <Card className="card-soft card-hover border-yellow-700/30 bg-yellow-900/10">
                <CardContent className="py-6 text-center space-y-2">
                  <Moon className="w-8 h-8 mx-auto text-yellow-500/50" />
                  <p className="text-sm text-yellow-200">
                    {t('dashboard.completeDemographicsRem')}
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {continuityAnalysis ? (
              <Card className="card-soft card-hover">
                <CardHeader>
                  <SectionTitle label={labels.continuity} pill="Continuity" />
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
                  <div>
                    <p className="font-semibold text-slate-200 mb-1">{t('dashboard.wakingLifeLinks')}</p>
                    <ul className="list-disc list-inside space-y-1">
                      {formatList(continuityAnalysis.wakingLifeConnections.personalConcerns, "concern")}
                      {formatList(continuityAnalysis.wakingLifeConnections.recentExperiences, "recent")}
                      {formatList(continuityAnalysis.wakingLifeConnections.ongoingStressors, "stressor")}
                      {formatList(continuityAnalysis.wakingLifeConnections.socialRelationships, "social")}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200 mb-1">{t('dashboard.continuityScores')}</p>
                    <p>{t('dashboard.thematic')}: {formatPercentage(continuityAnalysis.continuityTypes.thematic)}</p>
                    <p>{t('dashboard.emotional')}: {formatPercentage(continuityAnalysis.continuityTypes.emotional)}</p>
                    <p>{t('dashboard.social')}: {formatPercentage(continuityAnalysis.continuityTypes.social)}</p>
                    <p>{t('dashboard.cognitive')}: {formatPercentage(continuityAnalysis.continuityTypes.cognitive)}</p>
                  </div>
                </CardContent>
              </Card>
            ) : contMissing ? (
              <Card className="card-soft card-hover border-yellow-700/30 bg-yellow-900/10">
                <CardContent className="py-6 text-center space-y-2">
                  <Activity className="w-8 h-8 mx-auto text-yellow-500/50" />
                  <p className="text-sm text-yellow-200">
                    {t('dashboard.completeDemographicsContinuity')}
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </>
        )}
      </div>

      <Card className="card-soft card-hover">
        <CardHeader>
          <SectionTitle label={labels.highlights} pill={t('dashboard.summary')} />
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="emotions" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border border-slate-700">
              <TabsTrigger value="emotions">{labels.emotions}</TabsTrigger>
              <TabsTrigger value="themes">{labels.themes}</TabsTrigger>
              <TabsTrigger value="meaning">{labels.meaning}</TabsTrigger>
            </TabsList>

            <TabsContent value="emotions" className="mt-4">
              <p className="text-xs text-slate-400 mb-4 italic">{labels.emotionsDesc}</p>
              {dreamEmotions.length === 0 && (
                <p className="text-sm text-slate-400">{labels.noData}</p>
              )}
              <div className="space-y-3">
                {dreamEmotions.map((emotion: any, index) => (
                  <div
                    key={`${emotion.emotion}-${index}`}
                    className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{emotion.emoji || "🙂"}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {formatEmotionLabel(fixTurkishMojibake(emotion.emotion || emotion.type))}
                        </p>
                        {typeof emotion.intensity === "number" && (
                          <span className="text-xs text-slate-400">
                            {t('dashboard.intensity')}: {formatPercentage(emotion.intensity)}
                          </span>
                        )}
                      </div>
                    </div>
                    {typeof emotion.confidence === "number" && (
                      <Badge variant="outline" className="text-xs text-slate-300 border-slate-600">
                        {formatPercentage(emotion.confidence)}
                      </Badge>
                    )}
                  </div>
                ))}

                {valenceBalance && (
                  <div className="mt-6">
                    <p className="text-xs font-semibold text-slate-300 mb-3">
                      {t('dashboard.emotionalValenceBalance')}
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <MetricCard
                        label={t('dashboard.positive')}
                        value={formatPercentage(valenceBalance.positive)}
                        icon={<Sparkles className="w-4 h-4" />}
                        color="green"
                      />
                      <MetricCard
                        label={t('dashboard.negative')}
                        value={formatPercentage(valenceBalance.negative)}
                        icon={<Activity className="w-4 h-4" />}
                        color="red"
                      />
                      <MetricCard
                        label={t('dashboard.neutral')}
                        value={formatPercentage(valenceBalance.neutral)}
                        icon={<Gauge className="w-4 h-4" />}
                        color="gray"
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="themes" className="mt-4 space-y-3">
              <p className="text-xs text-slate-400 mb-4 italic">{labels.themesDesc}</p>
              {themes.length === 0 && (
                <p className="text-sm text-slate-400">{labels.noData}</p>
              )}
              {themes.map((theme, index) => {
                const themeName = bundle?.themes ? (theme as any).id : (theme as any).theme
                const themeScore = bundle?.themes ? (theme as any).scoreNorm : (theme as any).scorePct
                const themeDescription = bundle?.themes ? (theme as any).description : (theme as any).description
                const translatedThemeName = translateThemeName(themeName, language as Language)

                return (
                  <div
                    key={`${themeName}-${index}`}
                    className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-4"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">🔹</span>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {fixTurkishMojibake(translatedThemeName)}
                        </p>
                        {typeof themeScore === "number" && (
                          <span className="text-xs text-slate-400">
                            {formatPercentage(themeScore)}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {fixTurkishMojibake(themeDescription)}
                    </p>
                  </div>
                )
              })}
            </TabsContent>

            <TabsContent value="meaning" className="mt-4">
              {structuredInsights.length === 0 && (
                <p className="text-sm text-slate-400">{labels.noData}</p>
              )}
              <div className="space-y-3">
                {structuredInsights.map((entry, index) => (
                  <div
                    key={`${entry.title}-${index}`}
                    className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs uppercase tracking-wide text-slate-300 border-slate-600">
                        {t(`analysisSteps.categories.${entry.type}`) || fixTurkishMojibake(entry.type)}
                      </Badge>
                      <p className="text-sm font-semibold text-white">
                        {fixTurkishMojibake(entry.title)}
                      </p>
                    </div>
                    <ul className="space-y-2 list-disc list-inside text-sm text-slate-300">
                      {entry.content.map((item: string, idx: number) => (
                        <li key={idx}>{fixTurkishMojibake(item)}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
