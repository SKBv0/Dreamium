"use client"

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Cpu, Moon, Lightbulb, Heart, Clock, Zap, BookOpen } from "lucide-react"
import { REMAnalysisResult } from "@/lib/rem-sleep-analysis"
import type { AnalysisBundle } from "@/lib/analysis/types"
import {
  OptimizedRadarChart,
  OptimizedBarChart
} from "@/components/shared/charts"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts'
import {
  MetricCard,
  ProgressMetric
} from "@/components/shared/ui"
import { useTranslation } from "@/contexts/LanguageContext"
import { logger } from '@/lib/logger'

interface REMAnalysisDashboardProps {
  bundle?: AnalysisBundle;
  remAnalysis?: REMAnalysisResult; // Keep for backward compatibility
}

const COLORS = {
  rem: '#8B5CF6',      // brand purple
  nrem: '#F59E0B',     // brand orange
  low: '#8B5CF6',      // purple variant
  moderate: '#F59E0B', // orange
  high: '#8B5CF6',     // purple variant
  primary: '#8B5CF6',  // brand purple
  secondary: '#F59E0B' // brand orange
};

const REMAnalysisDashboard = React.memo(function REMAnalysisDashboard({ bundle, remAnalysis }: REMAnalysisDashboardProps) {
  const { t } = useTranslation();
  
  // Helper function to get sleep data from bundle or fallback to legacy data
  const getSleepData = () => {
    if (bundle) {
      return {
        stage: bundle.sleep.stage,
        prob: bundle.sleep.prob,
        confidence: bundle.sleep.confidence,
        vividness: bundle.sleep.vividness,
        emotionalIntensity: bundle.sleep.emotionalIntensity,
        bizarrenessScore: bundle.sleep.bizarrenessScore,
        narrativeCoherence: bundle.sleep.narrativeCoherence,
        hidePercentages: bundle.hideSleepPercentages || false
      };
    }
    
    // Fallback to legacy data
    if (remAnalysis) {
      return {
        stage: remAnalysis.sleepStageEstimate.estimatedSleepStage,
        prob: remAnalysis.circadianFactors?.remProbability ? remAnalysis.circadianFactors.remProbability * 100 : undefined,
        confidence: 75, // Default confidence
        vividness: remAnalysis.sleepStageEstimate.dreamVividness,
        emotionalIntensity: remAnalysis.sleepStageEstimate.emotionalIntensity,
        bizarrenessScore: remAnalysis.sleepStageEstimate.bizarrenessScore,
        narrativeCoherence: remAnalysis.sleepStageEstimate.narrativeCoherence,
        hidePercentages: false
      };
    }
    
    return {
      stage: 'unknown' as const,
      prob: undefined,
      confidence: 0,
      vividness: 0,
      emotionalIntensity: 0,
      bizarrenessScore: 0,
      narrativeCoherence: 0,
      hidePercentages: true
    };
  };
  
  // Log REM analysis data
  React.useEffect(() => {
    logger.debug('🌙 [REM Analysis Dashboard] Rendering with data:', {
      hasRemAnalysis: !!remAnalysis,
      remAnalysis: remAnalysis ? {
        sleepStageEstimate: remAnalysis.sleepStageEstimate,
        dreamVividness: remAnalysis.sleepStageEstimate.dreamVividness,
        emotionalIntensity: remAnalysis.sleepStageEstimate.emotionalIntensity,
        bizarrenessScore: remAnalysis.sleepStageEstimate.bizarrenessScore,
        narrativeCoherence: remAnalysis.sleepStageEstimate.narrativeCoherence,
        memoryIncorporation: remAnalysis.sleepStageEstimate.memoryIncorporation,
        temporalDistortion: remAnalysis.sleepStageEstimate.temporalDistortion,
        circadianFactors: remAnalysis.circadianFactors,
        neuroscientificInsights: remAnalysis.neuroscientificInsights,
        scientificReferences: remAnalysis.scientificReferences?.length || 0
      } : null
    });
  }, [remAnalysis]);
  
  // Memoize all data arrays to prevent infinite re-renders
  const sleepData = getSleepData();
  const sleepStageColor = useMemo(() => 
    sleepData.stage === 'REM' ? COLORS.rem :
    sleepData.stage === 'NREM' ? COLORS.nrem : '#6b7280',
    [sleepData.stage]
  );

  const neuralActivityData = useMemo(() => {
    // Default values if no data available
    const defaultActivity = 50;

    if (bundle) {
      // Calculate neural activity from bundle sleep data
      // Based on inferNeurobiologicalActivity logic from lib/rem-sleep-analysis.ts

      // Prefrontal cortex (logical reasoning, reality testing)
      let prefrontalActivity = 35; // default: low
      if (bundle.sleep.narrativeCoherence > 70 && bundle.sleep.bizarrenessScore < 30) {
        prefrontalActivity = 85; // high
      } else if (bundle.sleep.narrativeCoherence > 50) {
        prefrontalActivity = 60; // moderate
      }

      // Limbic system (emotions, fear, memory)
      let limbicActivation = 35; // default: low
      if (bundle.sleep.emotionalIntensity > 70) {
        limbicActivation = 85; // high
      } else if (bundle.sleep.emotionalIntensity > 40) {
        limbicActivation = 60; // moderate
      }

      // Acetylcholine (REM sleep, vivid dreams)
      let acetylcholineLevel = 35; // default: low
      if (bundle.sleep.stage === 'REM' && bundle.sleep.vividness > 60) {
        acetylcholineLevel = 85; // high
      } else if (bundle.sleep.vividness > 40) {
        acetylcholineLevel = 60; // moderate
      }

      // Dopamine (reward, motivation, bizarre content)
      let dopamineActivity = 35; // default: low
      if (bundle.sleep.bizarrenessScore > 60) {
        dopamineActivity = 85; // high
      } else if (bundle.sleep.bizarrenessScore > 30) {
        dopamineActivity = 60; // moderate
      }

      return [
        { region: t('rem.regions.prefrontal'), activity: prefrontalActivity },
        { region: t('rem.regions.limbic'), activity: limbicActivation },
        { region: t('rem.regions.acetylcholine'), activity: acetylcholineLevel },
        { region: t('rem.regions.dopamine'), activity: dopamineActivity }
      ];
    }

    if (remAnalysis) {
      return [
        {
          region: t('rem.regions.prefrontal'),
          activity: remAnalysis.neuroscientificInsights.prefrontalActivity === 'high' ? 85 :
                    remAnalysis.neuroscientificInsights.prefrontalActivity === 'moderate' ? 60 : 35
        },
        {
          region: t('rem.regions.limbic'),
          activity: remAnalysis.neuroscientificInsights.limbicActivation === 'high' ? 85 :
                    remAnalysis.neuroscientificInsights.limbicActivation === 'moderate' ? 60 : 35
        },
        {
          region: t('rem.regions.acetylcholine'),
          activity: remAnalysis.neuroscientificInsights.acetylcholineLevel === 'high' ? 85 :
                    remAnalysis.neuroscientificInsights.acetylcholineLevel === 'moderate' ? 60 : 35
        },
        {
          region: t('rem.regions.dopamine'),
          activity: remAnalysis.neuroscientificInsights.dopamineActivity === 'high' ? 85 :
                    remAnalysis.neuroscientificInsights.dopamineActivity === 'moderate' ? 60 : 35
        }
      ];
    }

    return [
      { region: t('rem.regions.prefrontal'), activity: defaultActivity },
      { region: t('rem.regions.limbic'), activity: defaultActivity },
      { region: t('rem.regions.acetylcholine'), activity: defaultActivity },
      { region: t('rem.regions.dopamine'), activity: defaultActivity }
    ];
  }, [bundle, remAnalysis]);

  const cognitiveData = useMemo(() => {
    if (remAnalysis?.cognitiveProcessing) {
      return [
        {
          name: t('rem.cognitiveFunctions.memoryConsolidation'),
          value: remAnalysis.cognitiveProcessing.memoryConsolidation,
          fill: COLORS.primary
        },
        {
          name: t('rem.cognitiveFunctions.emotionalProcessing'),
          value: remAnalysis.cognitiveProcessing.emotionalProcessing,
          fill: COLORS.secondary
        },
        {
          name: t('rem.cognitiveFunctions.creativeInsight'),
          value: remAnalysis.cognitiveProcessing.creativeInsight,
          fill: '#10b981'
        },
        {
          name: t('rem.cognitiveFunctions.problemSolving'),
          value: remAnalysis.cognitiveProcessing.problemSolving,
          fill: '#ef4444'
        }
      ];
    }

    // Fallback: use sleep stage emotional intensity for emotional processing
    return [
      { name: t('rem.cognitiveFunctions.memoryConsolidation'), value: 50, fill: COLORS.primary },
      { name: t('rem.cognitiveFunctions.emotionalProcessing'), value: sleepData.emotionalIntensity || 50, fill: COLORS.secondary },
      { name: t('rem.cognitiveFunctions.creativeInsight'), value: 50, fill: '#10b981' },
      { name: t('rem.cognitiveFunctions.problemSolving'), value: 50, fill: '#ef4444' }
    ];
  }, [remAnalysis, sleepData.emotionalIntensity, t]);

  const circadianData = useMemo(() => {
    if (bundle && sleepData.prob && !sleepData.hidePercentages) {
      return [
        {
          name: t('rem.probability'),
          value: sleepData.prob,
          fill: COLORS.rem
        },
        {
          name: t('rem.dreamProbability'),
          value: sleepData.prob * 0.8, // Estimate
          fill: COLORS.nrem
        }
      ];
    }

    if (remAnalysis) {
      return [
        {
          name: t('rem.probability'),
          value: remAnalysis.circadianFactors.remProbability * 100,
          fill: COLORS.rem
        },
        {
          name: t('rem.dreamProbability'),
          value: remAnalysis.circadianFactors.dreamLikelihood * 100,
          fill: COLORS.nrem
        }
      ];
    }

    return [
      { name: t('rem.probability'), value: 0, fill: COLORS.rem },
      { name: t('rem.dreamProbability'), value: 0, fill: COLORS.nrem }
    ];
  }, [bundle, remAnalysis, sleepData.prob, sleepData.hidePercentages]);

  const hasCircadianData = useMemo(() => {
    return circadianData.some(item => item.value > 0);
  }, [circadianData]);

  const timeOfNight = useMemo(() => {
    if (bundle) return 'unknown';
    if (remAnalysis?.circadianFactors?.timeOfNight) {
      return remAnalysis.circadianFactors.timeOfNight;
    }
    return 'unknown';
  }, [bundle, remAnalysis]);

  const sleepMetrics = useMemo(() => [
    {
      label: t('rem.vividness'),
      value: sleepData.vividness,
      icon: <Cpu className="w-4 h-4" />,
      color: 'blue'
    },
    {
      label: t('rem.metrics.emotionalIntensity'),
      value: sleepData.emotionalIntensity,
      icon: <Heart className="w-4 h-4" />,
      color: 'red'
    },
    {
      label: t('rem.metrics.bizarrenessScore'),
      value: sleepData.bizarrenessScore,
      icon: <Zap className="w-4 h-4" />,
      color: 'purple'
    },
    {
      label: t('rem.metrics.narrativeCoherence'),
      value: sleepData.narrativeCoherence,
      icon: <BookOpen className="w-4 h-4" />,
      color: 'green'
    }
  ], [sleepData, t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-soft card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Moon className="w-5 h-5" style={{ color: sleepStageColor }} />
              {t('rem.sleepStageEstimate')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div
                className="text-4xl font-bold mb-2"
                style={{ color: sleepStageColor }}
              >
                {sleepData.stage === 'REM' ? 'REM' :
                 sleepData.stage === 'NREM' ? 'NREM' : t('rem.uncertain')}
              </div>
              <Badge
                variant="outline"
                className={`
                  ${sleepData.stage === 'REM' ? 'border-purple-500 text-purple-300' :
                    sleepData.stage === 'NREM' ? 'border-cyan-500 text-cyan-300' :
                    'border-gray-500 text-gray-300'}
                `}
              >
                {sleepData.stage !== 'unknown' ? 
                  `${t('rem.confidence')}: ${sleepData.confidence}%` : 
                  `${t('rem.timingLabel')}: ${t('rem.timing.uncertain')}`
                }
              </Badge>
              {sleepData.prob && !sleepData.hidePercentages && (
                <div className="mt-2 text-sm text-slate-400">
                  {t('rem.probability')}: {sleepData.prob.toFixed(1)}%
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {sleepMetrics.map((metric, index) => (
                <MetricCard
                  key={index}
                  label={metric.label}
                  value={`${metric.value}%`}
                  icon={metric.icon}
                  color={metric.color as any}
                  progress={metric.value}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-soft card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Clock className="w-5 h-5 text-brand-orange" />
              {t('rem.circadianRhythm')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasCircadianData ? (
              <>
                <OptimizedBarChart
                  data={circadianData}
                  height={200}
                />

                <div className="mt-4 text-sm text-slate-400">
                  <p className="mb-2">
                    <strong>{t('rem.sleepTiming')}:</strong> {
                      timeOfNight === 'early' ? t('rem.timing.early') :
                      timeOfNight === 'middle' ? t('rem.timing.middle') :
                      timeOfNight === 'late' ? t('rem.timing.late') : t('rem.timing.uncertain')
                    }
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="w-12 h-12 text-slate-500 mb-4" />
                <p className="text-slate-400 text-sm mb-2">
                  <strong>{t('rem.noSleepTimeInfo')}</strong>
                </p>
                <p className="text-slate-500 text-xs max-w-xs">
                  {t('rem.sleepTimeInfoDescription')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-soft card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Cpu className="w-5 h-5 text-white" />
              {t('rem.neurobiologicalActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OptimizedRadarChart
              data={neuralActivityData}
              height={250}
              dataKey="activity"
              angleKey="region"
            />

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              {bundle ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Prefrontal Korteks:</span>
                    <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-300">
                      Orta
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Limbik Sistem:</span>
                    <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-300">
                      Orta
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Asetilkolin:</span>
                    <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-300">
                      Orta
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dopamin:</span>
                    <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-300">
                      Orta
                    </Badge>
                  </div>
                </>
              ) : remAnalysis ? (
                Object.entries(remAnalysis.neuroscientificInsights).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-slate-400">
                      {key === 'prefrontalActivity' ? t('rem.regions.prefrontal') :
                       key === 'limbicActivation' ? t('rem.regions.limbic') :
                       key === 'acetylcholineLevel' ? t('rem.regions.acetylcholine') : t('rem.regions.dopamine')}:
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        value === 'high' ? 'border-green-500 text-green-300' :
                        value === 'moderate' ? 'border-yellow-500 text-yellow-300' :
                        'border-red-500 text-red-300'
                      }`}
                    >
                      {value === 'high' ? t('rem.high') : value === 'moderate' ? t('rem.moderate') : t('rem.low')}
                    </Badge>
                  </div>
                ))
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="card-soft card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Lightbulb className="w-5 h-5 text-brand-orange" />
              {t('rem.cognitiveProcessing')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={cognitiveData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.7)' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.7)' }}
                  width={110}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                  formatter={(value: number) => [`${value}%`, t('rem.intensity')]}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 8, 8, 0]}
                  fill="#8B5CF6"
                />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {cognitiveData.map((item, index) => (
                <ProgressMetric
                  key={index}
                  label={item.name}
                  value={item.value}
                  color="yellow"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {remAnalysis?.recommendations && remAnalysis.recommendations.length > 0 && (
        <Card className="card-soft card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Lightbulb className="w-5 h-5 text-brand-orange" />
              Öneriler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {remAnalysis.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
                  <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {recommendation}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </motion.div>
  );
});

export default REMAnalysisDashboard;
