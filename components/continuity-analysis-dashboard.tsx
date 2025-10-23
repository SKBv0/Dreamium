"use client"

import React from "react"
import { motion } from "framer-motion"
import type { ComponentType, SVGProps } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ContinuityAnalysisResult } from "@/lib/types"
import type { AnalysisBundle } from "@/lib/analysis/types"
import { Layers, Cpu, Users, Sparkles } from "lucide-react"
import { logger } from '@/lib/logger'

interface ContinuityAnalysisDashboardProps {
  bundle?: AnalysisBundle;
  continuityAnalysis?: ContinuityAnalysisResult | null; // Keep for backward compatibility
  t: (key: string) => string
}

const animationVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 }
}

const getContinuitySections = (t: (key: string) => string): Array<{
  key: keyof ContinuityAnalysisResult["continuityTypes"]
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
}> => [
  { key: "thematic", icon: Layers, label: t("continuity.types.thematic") },
  { key: "emotional", icon: Cpu, label: t("continuity.types.emotional") },
  { key: "social", icon: Users, label: t("continuity.types.social") },
  { key: "cognitive", icon: Sparkles, label: t("continuity.types.cognitive") }
]

const scoreToBadge = (value: number, t: (key: string) => string) => {
  if (value >= 75) return { variant: "default" as const, label: t("quantitative.high") }
  if (value >= 45) return { variant: "secondary" as const, label: t("quantitative.medium") }
  return { variant: "outline" as const, label: t("quantitative.low") }
}

const ContinuityAnalysisDashboard = React.memo(function ContinuityAnalysisDashboard({
  bundle,
  continuityAnalysis,
  t
}: ContinuityAnalysisDashboardProps) {
  // Helper function to get continuity data from bundle or fallback to legacy data
  const getContinuityData = () => {
    if (bundle) {
      return {
        continuityScore: bundle.continuity.overall,
        continuityTypes: {
          thematic: bundle.continuity.thematic,
          emotional: bundle.continuity.emotional || 0,
          social: bundle.continuity.social || 0,
          cognitive: bundle.continuity.cognitive || 0
        },
        hasDayData: bundle.continuity.hasDayData,
        hideContinuityData: bundle.hideContinuityData || false
      };
    }
    
    // Fallback to legacy data
    if (continuityAnalysis) {
      return {
        continuityScore: continuityAnalysis.continuityScore,
        continuityTypes: continuityAnalysis.continuityTypes,
        hasDayData: true, // Assume legacy data has day data
        hideContinuityData: false
      };
    }
    
    return {
      continuityScore: 0,
      continuityTypes: {
        thematic: 0,
        emotional: 0,
        social: 0,
        cognitive: 0
      },
      hasDayData: false,
      hideContinuityData: true
    };
  };
  
  // Log continuity analysis data
  React.useEffect(() => {
    logger.debug('🔗 [Continuity Analysis Dashboard] Rendering with data:', {
      hasContinuityAnalysis: !!continuityAnalysis,
      continuityAnalysis: continuityAnalysis ? {
        continuityScore: continuityAnalysis.continuityScore,
        wakingLifeConnections: continuityAnalysis.wakingLifeConnections,
        continuityTypes: continuityAnalysis.continuityTypes,
        developmentalFactors: continuityAnalysis.developmentalFactors,
        recommendations: continuityAnalysis.recommendations,
        scientificReferences: continuityAnalysis.scientificReferences?.length || 0
      } : null
    });
  }, [continuityAnalysis]);

  const continuityData = getContinuityData();
  
  if (continuityData.hideContinuityData) {
    return (
      <motion.div
        className="text-center py-8 text-slate-400"
        initial="hidden"
        animate="visible"
        variants={animationVariants}
      >
        {t("continuity.noData")}
      </motion.div>
    )
  }

  const {
    continuityScore,
    continuityTypes,
    hasDayData
  } = continuityData;
  
  const {
    developmentalFactors = {
      ageAppropriate: true,
      cognitiveMaturity: 'normal',
      concernComplexity: 'moderate'
    },
    wakingLifeConnections = {
      personalConcerns: []
    },
    realityTesting = {
      logicalConsistency: 0,
      physicalPlausibility: 0,
      socialPlausibility: 0,
      overallRealism: 0
    },
    recommendations = []
  } = continuityAnalysis || {};

  const CONTINUITY_SECTIONS = getContinuitySections(t)
  const continuityBadge = scoreToBadge(continuityScore, t)

  return (
    <motion.div
      className="grid grid-cols-1 xl:grid-cols-2 gap-6"
      initial="hidden"
      animate="visible"
      variants={animationVariants}
      transition={{ staggerChildren: 0.08 }}
    >
      <motion.div variants={animationVariants}>
        <Card className="card-soft card-hover h-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <span>{t("continuity.overallScore")}</span>
              <Badge variant={continuityBadge.variant}>{continuityBadge.label}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-4xl font-semibold text-brand-purple">{continuityScore}</p>
              <p className="text-xs text-slate-400">
                {t("continuity.scoreDescription")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {CONTINUITY_SECTIONS.map(({ key, icon: Icon, label }) => {
                const value = continuityTypes[key]
                const isEmotional = key === 'emotional'
                const hasNoDayData = isEmotional && !hasDayData
                
                if (hasNoDayData) {
                  return (
                    <div key={key} className="rounded-xl bg-slate-900/40 p-4 border border-white/5">
                      <div className="flex items-center gap-2 text-sm text-white/80">
                        <Icon className="h-4 w-4 text-brand-purple" />
                        <span>{label}</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold text-white">--</span>
                        <Badge variant="outline" className="border-yellow-500 text-yellow-300">
                          {t("continuity.noData")}
                        </Badge>
                      </div>
                    </div>
                  )
                }
                
                const badge = scoreToBadge(value, t)
                return (
                  <div key={key} className="rounded-xl bg-slate-900/40 p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <Icon className="h-4 w-4 text-brand-purple" />
                      <span>{label}</span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-semibold text-white">{value}</span>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={animationVariants}>
        <Card className="card-soft card-hover h-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              {t("continuity.developmentalFactors")}
              <Badge variant={developmentalFactors.ageAppropriate ? "default" : "secondary"}>
                {developmentalFactors.ageAppropriate
                  ? t("continuity.ageAppropriate")
                  : t("continuity.needsAttention")}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <div className="flex justify-between">
              <span>{t("continuity.cognitiveMaturity")}</span>
              <span className="text-white font-medium">
                {t(`continuity.cognitive.${developmentalFactors.cognitiveMaturity}`)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t("continuity.concernComplexity")}</span>
              <span className="text-white font-medium">
                {t(`continuity.concern.${developmentalFactors.concernComplexity}`)}
              </span>
            </div>
            {wakingLifeConnections.personalConcerns.length > 0 && (
              <div className="space-y-1 pt-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {t("continuity.personalConcerns")}
                </p>
                <ul className="space-y-1">
                  {wakingLifeConnections.personalConcerns.map((item, index) => (
                    <li key={`concern-${index}`} className="text-white/80">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={animationVariants}>
        <Card className="card-soft card-hover h-full">
          <CardHeader>
            <CardTitle className="text-white">
              {t("continuity.realityTesting")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm text-slate-300">
            {Object.entries(realityTesting).map(([key, value]) => (
              <div key={key} className="rounded-xl bg-slate-900/40 p-4 border border-white/5">
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  {t(`continuity.reality.${key}`)}
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={animationVariants}>
        <Card className="card-soft card-hover h-full">
          <CardHeader>
            <CardTitle className="text-white">
              {t("continuity.recommendations")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recommendations.map((item, index) => (
                <li key={`recommendation-${index}`} className="flex items-start gap-3 text-sm">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand-purple" aria-hidden />
                  <span className="text-slate-200">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
});

export default ContinuityAnalysisDashboard;
