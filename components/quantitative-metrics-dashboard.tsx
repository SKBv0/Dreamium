"use client"

import React, { useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, TrendingUp, Cpu, Eye, Target, Info, Heart, Scale } from "lucide-react"
import { QuantitativeAnalysisResult } from "@/lib/types"
import { EmotionAnalysisResult } from "@/lib/emotion-analysis"
import type { AnalysisBundle } from "@/lib/analysis/types"
import {
  OptimizedRadarChart,
  OptimizedBarChart,
  OptimizedPieChart,
  OptimizedLineChart
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
import { LazyChart } from "@/components/LazyChart"
import {
  MetricCard,
  ProgressMetric
} from "@/components/shared/ui"
import { useTranslation } from "@/contexts/LanguageContext"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip"
import { logger } from '@/lib/logger'
import { formatEmotionLabel } from '@/lib/format-emotion-label'

interface QuantitativeMetricsDashboardProps {
  bundle?: AnalysisBundle;
  quantitativeData?: QuantitativeAnalysisResult | null; // Keep for backward compatibility
  emotionData?: EmotionAnalysisResult;
  dreamText: string;
}

const COLORS = {
  primary: '#8B5CF6',    // brand purple
  secondary: '#F59E0B',  // brand orange
  success: '#10B981',    // green for success
  warning: '#F59E0B',    // orange for warning
  danger: '#EF4444',     // red for danger
  neutral: '#64748B',    // slate for neutral
  chart: {
    primary: '#8B5CF6',    // brand purple
    secondary: '#F59E0B',  // brand orange
    tertiary: '#06B6D4',   // cyan
    quaternary: '#84CC16', // lime
    accent: '#EC4899'      // pink
  }
};

const QuantitativeMetricsDashboard = React.memo(function QuantitativeMetricsDashboard({
  bundle,
  quantitativeData,
  emotionData,
  dreamText
}: QuantitativeMetricsDashboardProps) {
  const { t } = useTranslation();

  // Helper function to get data from bundle or fallback to legacy data
  const getEntityData = useCallback(() => {
    if (bundle) {
      return {
        people: bundle.entities.people,
        animals: bundle.entities.animals,
        places: bundle.entities.places,
        objects: bundle.entities.objects,
        events: bundle.entities.events,
        totalCharacters: bundle.entities.people.length + bundle.entities.animals.length
      };
    }

    // Fallback to legacy data
    if (quantitativeData?.characters) {
      const people = quantitativeData.characters.filter((c: any) =>
        c.type.includes('insan') || c.type.includes('human')
      );
      const animals = quantitativeData.characters.filter((c: any) =>
        c.type.includes('hayvan') || c.type.includes('animal')
      );
      return {
        people: people.map((c: any) => c.type),
        animals: animals.map((c: any) => c.type),
        places: quantitativeData.setting ? [quantitativeData.setting.description] : [],
        objects: [],
        events: [],
        totalCharacters: quantitativeData.characterCount || 0
      };
    }

    return {
      people: [],
      animals: [],
      places: [],
      objects: [],
      events: [],
      totalCharacters: 0
    };
  }, [bundle, quantitativeData]);

  const getEmotionData = useCallback(() => {
    if (bundle) {
      return {
        primaryEmotion: bundle.emotions.labels[0] || null,
        secondaryEmotions: bundle.emotions.labels.slice(1),
        emotionalComplexity: bundle.emotions.labels.length,
        valenceBalance: {
          positive: bundle.emotions.pos,
          negative: bundle.emotions.neg,
          neutral: bundle.emotions.neu
        }
      };
    }

    // Fallback to legacy data
    return emotionData || {
      primaryEmotion: null,
      secondaryEmotions: [],
      emotionalComplexity: 0,
      valenceBalance: { positive: 0, negative: 0, neutral: 100 }
    };
  }, [bundle, emotionData]);

  // Memoize basic text metrics - MUST be called before early return
  const { wordCount, avgWordsPerSentence, lexicalDiversity, bizarrenessScore } = useMemo(() => {
    const wordCount = dreamText.split(/\s+/).length;
    const sentenceCount = dreamText.split(/[.!?]+/).filter(s => s.trim()).length;
    const avgWordsPerSentence = Math.round(wordCount / Math.max(sentenceCount, 1));

    const stopWords = new Set([
      // English common words
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her',
      'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      // Turkish common words
      'bir', 've', 'veya', 'ama', 'fakat', 'da', 'de', 'ile', 'için', 'gibi',
      'ben', 'sen', 'o', 'biz', 'siz', 'onlar', 'bu', 'şu', 'her', 'bazı',
      'olan', 'oldu', 'var', 'yok', 'mi', 'mı', 'mu', 'mü'
    ]);

    // Calculate complexity metrics with stop word filtering
    const words = dreamText.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
    const uniqueWords = new Set(words).size;
    const lexicalDiversity = Math.round((uniqueWords / Math.max(words.length, 1)) * 100);

    // Bizarreness calculation (simple heuristic)
    const bizarreElements = ['uçmak', 'canavar', 'renk değiştir', 'kaybolmak', 'döngü'];
    const bizarrenessScore = bizarreElements.reduce((score, element) =>
      dreamText.toLowerCase().includes(element) ? score + 1 : score, 0);

    return { wordCount, sentenceCount, avgWordsPerSentence, lexicalDiversity, bizarrenessScore };
  }, [dreamText]);

  // Memoize entity data
  const entityData = useMemo(() => getEntityData(), [getEntityData]);

  // Memoize character data for visualization
  const characterData = useMemo(() => {
    const data = [];

    if (entityData.people.length > 0) {
      data.push({
        name: t('quantitative.people'),
        value: entityData.people.length,
        fill: COLORS.primary
      });
    }

    if (entityData.animals.length > 0) {
      data.push({
        name: t('quantitative.animals'),
        value: entityData.animals.length,
        fill: COLORS.secondary
      });
    }

    if (entityData.places.length > 0) {
      data.push({
        name: t('quantitative.places'),
        value: entityData.places.length,
        fill: COLORS.chart.tertiary
      });
    }

    return data;
  }, [entityData, t]);

  // Memoize social interaction data
  const interactionData = useMemo(() => {
    if (!quantitativeData) return [];

    const rawData = [
      { name: t('quantitative.aggressive') || 'Agresif', value: quantitativeData.socialInteractions.types.aggressive, fill: COLORS.danger },
      { name: t('quantitative.friendly') || 'Arkadaşça', value: quantitativeData.socialInteractions.types.friendly, fill: COLORS.success },
      { name: t('quantitative.sexual') || 'Cinsel', value: quantitativeData.socialInteractions.types.sexual, fill: COLORS.warning },
      { name: t('quantitative.neutral') || 'Nötr', value: quantitativeData.socialInteractions.types.neutral, fill: COLORS.neutral }
    ];

    logger.debug('📊 [Quantitative Dashboard] Social interaction data:', {
      rawData,
      socialInteractionsTypes: quantitativeData.socialInteractions.types,
      filtered: rawData.filter(item => item.value > 0)
    });

    return rawData.filter(item => item.value > 0);
  }, [quantitativeData, t]);

  // Emotion intensity data
  const emotionIntensityData = useMemo(() => {
    // Debug logging
    console.log('[Emotion Intensity] Data sources:', {
      hasBundle: !!bundle,
      hasBundleEmotions: !!bundle?.emotions,
      hasBundleLabels: !!bundle?.emotions?.labels,
      bundleLabelsLength: bundle?.emotions?.labels?.length || 0,
      hasEmotionData: !!emotionData,
      hasPrimaryEmotion: !!emotionData?.primaryEmotion,
      hasSecondaryEmotions: !!emotionData?.secondaryEmotions,
      secondaryEmotionsLength: emotionData?.secondaryEmotions?.length || 0
    });

    // Try bundle first
    if (bundle?.emotions?.labels && bundle.emotions.labels.length > 0) {
      const bundleEmotions = bundle.emotions.labels.slice(0, 6).map(e => ({
        emotion: formatEmotionLabel(e.tag),
        intensity: e.intensity,
        confidence: 80 // Default confidence for bundle data
      }));
      
      console.log('[Emotion Intensity] Using bundle data:', bundleEmotions);
      return bundleEmotions;
    }

    // Fallback to emotionData
    if (emotionData?.primaryEmotion) {
      const emotions = [
        emotionData.primaryEmotion,
        ...(emotionData.secondaryEmotions || [])
      ].filter(e => e && e.emotion).slice(0, 6).map(emotion => ({
        emotion: formatEmotionLabel(emotion.emotion),
        intensity: emotion.intensity || 0,
        confidence: emotion.confidence || 0
      }));
      
      console.log('[Emotion Intensity] Using emotionData fallback:', emotions);
      
      if (emotions.length > 0) {
        return emotions;
      }
    }

    console.log('[Emotion Intensity] No emotion data found, returning empty array');
    return [];
  }, [bundle, emotionData]);

  // Emotional trajectory data
  const emotionalTrajectory = useMemo(() => {
    if (emotionData?.emotionalTrajectory && emotionData.emotionalTrajectory.length > 0) {
      return emotionData.emotionalTrajectory;
    }
    
    return [];
  }, [emotionData]);

  // Memoize radar chart data for dream characteristics
  const dreamCharacteristics = useMemo(() => {
    const emotionData = getEmotionData();
    
    return [
      {
        characteristic: t('quantitative.emotionalIntensity'),
        value: emotionData.primaryEmotion?.intensity || 30
      },
      {
        characteristic: t('quantitative.complexity'),
        value: emotionData.emotionalComplexity || lexicalDiversity
      },
    {
      characteristic: t('quantitative.socialInteraction'),
      value: quantitativeData ? Math.min(quantitativeData.socialInteractions.total * 20, 100) : 20
    },
    {
      characteristic: t('quantitative.narrativeCoherence'),
      value: Math.max(100 - (bizarrenessScore * 15), 20)
    },
    {
      characteristic: t('quantitative.lexicalRichness'),
      value: lexicalDiversity
    },
    {
      characteristic: t('quantitative.detailLevel'),
      value: Math.min((wordCount / 10), 100)
    }
    ];
  }, [getEmotionData, quantitativeData, lexicalDiversity, bizarrenessScore, wordCount, t]);

  const { rawConsciousnessScore, displayConsciousnessScore, consciousnessLevel } = useMemo(() => {
    const rawConsciousnessScore =
      typeof quantitativeData?.consciousnessScore === 'number'
        ? quantitativeData.consciousnessScore
        : null;
    const displayConsciousnessScore =
      rawConsciousnessScore !== null ? Math.round(rawConsciousnessScore) : 'N/A';
    const consciousnessLevel =
      rawConsciousnessScore === null
        ? t('quantitative.noData')
        : rawConsciousnessScore >= 70
          ? t('quantitative.high')
          : rawConsciousnessScore >= 40
            ? t('quantitative.medium')
            : t('quantitative.low');

    return { rawConsciousnessScore, displayConsciousnessScore, consciousnessLevel };
  }, [quantitativeData?.consciousnessScore, t]);

  // Log quantitative analysis data
  React.useEffect(() => {
    logger.debug('📊 [Quantitative Dashboard] Rendering with data:', {
      hasQuantitativeData: !!quantitativeData,
      hasEmotionData: !!emotionData,
      dreamTextLength: dreamText?.length || 0,
      dreamTextPreview: dreamText?.substring(0, 100) + '...',
      quantitativeData: quantitativeData ? {
        characterCount: quantitativeData.characterCount,
        characters: quantitativeData.characters,
        socialInteractions: quantitativeData.socialInteractions,
        setting: quantitativeData.setting,
        successFailureRatio: quantitativeData.successFailureRatio,
        consciousnessScore: quantitativeData.consciousnessScore
      } : null,
      emotionData: emotionData ? {
        primaryEmotion: emotionData.primaryEmotion?.emotion,
        secondaryEmotions: emotionData.secondaryEmotions?.length || 0,
        emotionalComplexity: emotionData.emotionalComplexity,
        valenceBalance: emotionData.valenceBalance
      } : null
    });
  }, [quantitativeData, emotionData, dreamText]);

  // Early return AFTER all hooks
  if (!quantitativeData && !emotionData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8"
      >
        <div className="w-12 h-12 mx-auto mb-4 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
          <Cpu className="w-6 h-6 text-white/60" />
        </div>
        <p className="text-slate-400">{t('quantitative.noData')}</p>
      </motion.div>
    );
  }

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          label={t('quantitative.wordCount')}
          value={wordCount}
          icon={<Eye className="w-4 h-4" />}
          color="blue"
          subtitle={t('quantitative.avgWordsPerSentence', { count: avgWordsPerSentence })}
        />

        <MetricCard
          label={t('quantitative.lexicalDiversity')}
          value={`${lexicalDiversity}%`}
          icon={<Cpu className="w-4 h-4" />}
          color="purple"
          progress={lexicalDiversity}
        />

        <MetricCard
          label={t('quantitative.characterCount')}
          value={getEntityData().totalCharacters}
          icon={<Target className="w-4 h-4" />}
          color="green"
          subtitle={(() => {
            const entityData = getEntityData();
            const parts: string[] = [];
            if (entityData.people.length > 0) parts.push(`${t('quantitative.human')}: ${entityData.people.length}`);
            if (entityData.animals.length > 0) parts.push(`${t('quantitative.animal')}: ${entityData.animals.length}`);
            // Preferred separator for readability
            return parts.length ? parts.join(' · ') : undefined;
            return parts.join(' • ') || undefined;
          })()}
        />

        {rawConsciousnessScore !== null && (
          <MetricCard
            label={t('quantitative.unconsciousScore')}
            value={displayConsciousnessScore}
            icon={
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-slate-400 hover:text-slate-200 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent
                    className="max-w-xs text-xs leading-snug"
                    side="top"
                    align="center"
                  >
                    {t('quantitative.consciousnessFormulaTooltip') || 'Formül: duygu çeşitliliği (maks 30) + karakter çeşitliliği (maks 25) + etkileşim çeşitliliği (maks 20) + etkileşim hacmi (maks 25) = 0-100'}
                  </TooltipContent>
                </Tooltip>
              </div>
            }
            color="yellow"
            subtitle={consciousnessLevel}
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {characterData.length > 0 && (
          <Card className="card-soft card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="w-5 h-5 text-brand-purple" />
                {t('quantitative.characterDistribution')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LazyChart>
                <OptimizedPieChart
                  data={characterData}
                  height={280}
                  innerRadius={80}
                  outerRadius={120}
                  label={true}
                />
              </LazyChart>
            </CardContent>
          </Card>
        )}

        <Card className="card-soft card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Target className="w-5 h-5 text-brand-purple" />
              {t('quantitative.dreamCharacteristicsProfile')}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-slate-400 hover:text-slate-200 cursor-help" />
                </TooltipTrigger>
                <TooltipContent
                  className="max-w-xs text-xs leading-snug space-y-1"
                  side="top"
                  align="center"
                >
                  <p>{t('quantitative.complexityTooltip')}</p>
                  <p>{t('quantitative.arousalTooltip')}</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <p className="text-sm text-slate-400">
              {t('quantitative.multidimensionalMetrics')}
            </p>
          </CardHeader>
          <CardContent>
            <LazyChart>
              <OptimizedRadarChart
                data={dreamCharacteristics}
                height={280}
                dataKey="value"
                angleKey="characteristic"
              />
            </LazyChart>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {interactionData.length > 0 && (
          <Card className="card-soft card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="w-5 h-5 text-brand-orange" />
                {t('quantitative.socialInteractions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LazyChart>
                <OptimizedBarChart
                  data={interactionData}
                  height={280}
                />
              </LazyChart>
            </CardContent>
          </Card>
        )}

        {emotionalTrajectory.length > 0 && (
          <Card className="card-soft card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="w-5 h-5 text-brand-orange" />
                {t('quantitative.emotionalTrajectory')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LazyChart>
                <OptimizedLineChart
                  data={emotionalTrajectory}
                  height={280}
                  xDataKey="position"
                  dataKey="intensity"
                  showDots={true}
                />
              </LazyChart>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8">

        {emotionIntensityData.length > 0 && (
          <Card className="card-soft card-hover">
            <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Heart className="w-5 h-5 text-white" />
              {t('quantitative.emotionIntensity')}
            </CardTitle>
            </CardHeader>
            <CardContent>
              <LazyChart>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={emotionIntensityData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
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
                      dataKey="emotion"
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.7)' }}
                      width={90}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                      formatter={(value: number) => [`${value}%`, t('quantitative.intensity')]}
                    />
                    <Bar
                      dataKey="intensity"
                      fill={COLORS.chart.primary}
                      radius={[0, 8, 8, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </LazyChart>
            </CardContent>
          </Card>
        )}
      </div>

      {quantitativeData && (quantitativeData.successFailureRatio.success > 0 || quantitativeData.successFailureRatio.failure > 0) && (
        <Card className="card-soft card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="w-5 h-5 text-brand-orange" />
              {t('quantitative.successFailureAnalysis')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">
                  {quantitativeData.successFailureRatio.success}
                </div>
                <p className="text-sm text-slate-400">{t('quantitative.success')}</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400">
                  {quantitativeData.successFailureRatio.failure}
                </div>
                <p className="text-sm text-slate-400">{t('quantitative.failure')}</p>
              </div>
            </div>
            <ProgressMetric
              label={t('quantitative.successRate')}
              value={
                quantitativeData.successFailureRatio.success /
                Math.max(quantitativeData.successFailureRatio.success + quantitativeData.successFailureRatio.failure, 1) * 100
              }
              color="green"
            />
          </CardContent>
        </Card>
      )}

      {emotionData && (
        <Card className="card-soft card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Scale className="w-5 h-5 text-brand-purple" />
              {t('quantitative.emotionalBalance')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <ProgressMetric
                label={t('quantitative.positive')}
                value={emotionData.valenceBalance.positive}
                color="green"
              />
              <ProgressMetric
                label={t('quantitative.negative')}
                value={emotionData.valenceBalance.negative}
                color="red"
              />
              <ProgressMetric
                label={t('quantitative.neutral')}
                value={emotionData.valenceBalance.neutral}
                color="gray"
              />
            </div>
          </CardContent>
        </Card>
      )}
      </motion.div>
    </TooltipProvider>
  );
});

export default QuantitativeMetricsDashboard;
