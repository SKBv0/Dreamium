import { analyzeDream } from './dream-analysis'
import { useTranslation } from '@/contexts/LanguageContext'
import type { Language } from './translations'

// Strength union uses clean ASCII labels (TR + EN)
export type Strength = 'dusuk' | 'orta' | 'yuksek' | 'low' | 'medium' | 'high'

export interface AdvancedDreamAnalysis {
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
  structuredInsights?: Array<{
    title: string
    content: string[]
    type: string
  }>
  themes: Array<{
    theme: string
    emoji: string
    description: string
    scorePct?: number
    strength?: Strength
    psychological_theory?: string
    cognitive_domain?: string
    color?: string
    intensity?: number
    confidence?: number
    frequency?: number
    keywords_found?: string[]
    symbolic_connections?: Array<{ symbol: string; meaning: string }>
    strengthTag?: string
    strengthEmoji?: string
    source_tag?: string
    evidence?: string
    detection_reason?: string
    validation_status?: {
      valid: boolean
      reason: string
      evidence_level?: 'low' | 'medium' | 'high'
    }
  }>
  emotions: Array<{
    emotion: string
    emoji: string
    intensity: number
    evidence?: string
    evidence_level?: 'low' | 'medium' | 'high'
  }>
  synthesis?: {
    title?: string
    content?: string
    evidence_level?: 'low' | 'medium' | 'high'
    scientific_disclaimer?: string
  }
  devils_advocate?: {
    title?: string
    content?: string
    evidence_level?: 'low' | 'medium' | 'high'
  }
  cultural_context?: {
    culturalSymbols?: string[]
    culturalInterpretations?: string[]
    evidence_level?: 'low' | 'medium' | 'high'
  }
  emotionAnalysis?: any
  remAnalysis?: any
  continuityAnalysis?: any
  evidence_based_interventions?: {
    imagery_rehearsal?: string
    structured_journaling?: string
    sleep_hygiene?: string
    evidence_level?: 'low' | 'medium' | 'high'
    sources?: Array<{
      authors: string
      year: number
      title: string
      journal: string
      finding: string
    }>
  }
}

// ASCII-only emoji fallbacks
const EMOTION_EMOJIS: Record<string, string> = {
  fear: '😨',
  joy: '😊',
  happiness: '😊',
  sadness: '😢',
  anger: '😠',
  surprise: '😲',
  disgust: '🤢',
  love: '❤️',
  anxiety: '😰',
  calm: '😌',
  awe_fear: '😱',
  existential_anxiety: '🫨'
}

const DEFAULT_THEME_SOURCE = 'hall-van-de-castle'

const clampScore = (value: number, max = 100): number => Math.max(0, Math.min(max, Math.round(value)))

const translateStrength = (score: number) => {
  if (score >= 70) return { label: 'yuksek', emoji: '!!' }
  if (score >= 45) return { label: 'orta', emoji: '!' }
  return { label: 'dusuk', emoji: '.' }
}

function mapThemes(themes: ReturnType<typeof analyzeDream>['themes']): AdvancedDreamAnalysis['themes'] {
  if (!Array.isArray(themes) || themes.length === 0) {
    return []
  }

  const maxScore = themes.reduce((max, theme) => Math.max(max, theme.count * theme.weight), 0) || 1

  return themes.slice(0, 5).map((theme) => {
    const rawScore = theme.count * theme.weight
    const normalized = clampScore((rawScore / maxScore) * 100)
    const strength = translateStrength(normalized)

    return {
      theme: theme.name,
      emoji: theme.emoji || '🔹',
      description: theme.description || '',
      scorePct: normalized,
      strength: strength.label as Strength,
      strengthTag: strength.label.charAt(0).toUpperCase() + strength.label.slice(1),
      strengthEmoji: strength.emoji,
      psychological_theory: theme.source || 'Hall-Van de Castle',
      cognitive_domain: 'symbolic',
      color: theme.color,
      intensity: normalized,
      confidence: Math.min(1, rawScore / 5),
      frequency: theme.count,
      keywords_found: theme.matches || [],
      symbolic_connections: [],
      source_tag: `[${(theme.source || DEFAULT_THEME_SOURCE).toUpperCase()}]`,
      detection_reason: theme.matches?.length ? `Anahtar kelimeler: ${theme.matches.join(', ')}` : undefined,
      evidence: theme.description,
      validation_status: {
        valid: normalized >= 35,
        reason: `Tema agirligi ${normalized} olarak hesaplandi`,
        evidence_level: normalized >= 70 ? 'medium' : 'low'
      }
    }
  })
}

function mapEmotions(emotions: ReturnType<typeof analyzeDream>['emotions']): AdvancedDreamAnalysis['emotions'] {
  if (!Array.isArray(emotions) || emotions.length === 0) {
    return []
  }

  return emotions
    .slice()
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 5)
    .map((emotion) => {
      const label = emotion.emotion.replace(/_/g, ' ')
      const emoji = EMOTION_EMOJIS[emotion.emotion] || '...'
      const intensity = clampScore(emotion.intensity * 25)
      return {
        emotion: label,
        emoji,
        intensity,
        evidence: `Metinde ${emotion.count} kez gecti`,
        evidence_level: intensity >= 60 ? 'medium' : 'low'
      }
    })
}

function buildSynthesis(summary: string, language: string): AdvancedDreamAnalysis['synthesis'] {
  const title = language === 'tr' ? 'Analiz Ozeti' : 'Analysis Summary'
  const disclaimer = language === 'tr'
    ? 'Bu yorumlar sembolik hipotezlerdir ve kesin psikolojik teshis olarak degerlendirilmemelidir.'
    : 'These interpretations are exploratory hypotheses and not clinical diagnoses.'

  return {
    title,
    content: summary || (language === 'tr' ? 'Ruyadan cikarilabilecek belirgin bir tema bulunamadi.' : 'No dominant pattern detected in the dream.'),
    evidence_level: 'low',
    scientific_disclaimer: disclaimer
  }
}

function buildArchetypeSection(archetypes: string[]): AdvancedDreamAnalysis['jungian_analysis'] {
  if (!archetypes || archetypes.length === 0) {
    return undefined
  }

  return {
    dominant_archetypes: archetypes.slice(0, 5),
    evidence_level: 'low'
  }
}

function buildDevilsAdvocate(dominantThemes: string[], language: string): AdvancedDreamAnalysis['devils_advocate'] {
  if (!dominantThemes || dominantThemes.length === 0) {
    return {
      title: language === 'tr' ? 'Alternatif Yorum' : 'Alternative View',
      content: language === 'tr'
        ? 'Ruyanin tamamen notr bir uyku deneyimi olma olasiligi da vardir; bilinc disi mesaj aramak yerine gun ici deneyimlerin bir yansimasi olabilir.'
        : 'It is also possible that the dream is a neutral sleep experience reflecting daytime residue rather than symbolic messages.',
      evidence_level: 'low'
    }
  }

  return {
    title: language === 'tr' ? 'Alternatif Yorum' : 'Alternative View',
    content: language === 'tr'
      ? `"${dominantThemes[0]}" temasinin baskin gorunmesi, sadece gun icindeki deneyimlerinizi yansitiyor olabilir; sembolik anlam yuklemeden once guncel olaylari ve duygularinizi da gozden gecirin.`
      : `The prominence of "${dominantThemes[0]}" may simply reflect recent waking-life experiences; review current events before attributing symbolic meaning.`,
    evidence_level: 'low'
  }
}

function buildCulturalContext(places: ReturnType<typeof analyzeDream>['places'], language: string): AdvancedDreamAnalysis['cultural_context'] {
  if (!places || places.length === 0) {
    return undefined
  }

  const topPlaces = places.slice(0, 3).map(place => place.place)

  return {
    culturalSymbols: topPlaces,
    culturalInterpretations: language === 'tr'
      ? topPlaces.map(symbol => `${symbol} mekani, kisisel tarih ve aidiyet duygularinizi gozden gecirmenizi onerir.`)
      : topPlaces.map(symbol => `${symbol} may highlight personal history and sense of belonging.`),
    evidence_level: 'low'
  }
}

function buildInterventions(language: string): AdvancedDreamAnalysis['evidence_based_interventions'] {
  const imagery = language === 'tr'
    ? 'Rahatsizlik veren sahneleri uyanik halde yeniden yazip, yatmadan once 10 dakika hayal ederek Imagery Rehearsal calismasi uygulayin.'
    : 'Practice imagery rehearsal by rewriting distressing scenes and visualising the preferred outcome for 10 minutes before sleep.'

  const journaling = language === 'tr'
    ? 'Ruyadan hemen sonra iki cumlelik ozet ve gun ici duygu tetikleyicilerini not alin; haftalik desenleri takip edin.'
    : 'Capture a two-sentence summary and daytime triggers immediately after waking; review weekly patterns.'

  const sleep = language === 'tr'
    ? 'Uyku hijyenini desteklemek icin yatmadan 1 saat once ekran suresini sinirlayin ve nefes egzersizi uygulayin.'
    : 'Support sleep hygiene by limiting screens 1 hour before bed and practicing a breathing protocol.'

  return {
    imagery_rehearsal: imagery,
    structured_journaling: journaling,
    sleep_hygiene: sleep,
    evidence_level: 'high',
    sources: [
      {
        authors: 'Krakow et al.',
        year: 2001,
        title: 'Imagery Rehearsal Therapy for Chronic Nightmares',
        journal: 'JAMA',
        finding: 'Demonstrated significant reductions in nightmare distress through imagery rehearsal.'
      }
    ]
  }
}

/**
 * Build structured insights from psychological framework analyses
 */
function buildStructuredInsights(
  jungian: AdvancedDreamAnalysis['jungian_analysis'],
  freudian: AdvancedDreamAnalysis['freudian_analysis'],
  adlerian: AdvancedDreamAnalysis['adlerian_analysis'],
  gestalt: AdvancedDreamAnalysis['gestalt_analysis'],
  language: string,
  t: (key: string) => string
): Array<{ title: string; content: string[]; type: string }> {
  const insights: Array<{ title: string; content: string[]; type: string }> = []
  const isTurkish = language === 'tr'

  // Jungian Analysis
  if (jungian && (jungian.dominant_archetypes?.length || jungian.archetypal_conflicts?.length || jungian.individuation_stage)) {
    const content: string[] = []

    if (jungian.dominant_archetypes && jungian.dominant_archetypes.length > 0) {
      const label = t('advancedAnalysis.psychologicalFrameworks.dominantArchetypes')
      content.push(`${label}: ${jungian.dominant_archetypes.join(', ')}`)
    }

    if (jungian.archetypal_conflicts && jungian.archetypal_conflicts.length > 0) {
      const label = t('advancedAnalysis.psychologicalFrameworks.archetypalConflicts')
      content.push(`${label}: ${jungian.archetypal_conflicts.join(', ')}`)
    }

    if (jungian.individuation_stage) {
      const label = t('advancedAnalysis.psychologicalFrameworks.individuationStage')
      content.push(`${label}: ${jungian.individuation_stage}`)
    }

    if (content.length > 0) {
      insights.push({
        title: t('advancedAnalysis.psychologicalFrameworks.jungian'),
        content,
        type: 'jungian'
      })
    }
  }

  // Freudian Analysis
  if (freudian && (freudian.repressed_content?.length || freudian.defense_mechanisms?.length || freudian.unconscious_desires?.length)) {
    const content: string[] = []

    if (freudian.repressed_content && freudian.repressed_content.length > 0) {
      freudian.repressed_content.forEach(item => content.push(item))
    }

    if (freudian.defense_mechanisms && freudian.defense_mechanisms.length > 0) {
      freudian.defense_mechanisms.forEach(item => content.push(item))
    }

    if (freudian.unconscious_desires && freudian.unconscious_desires.length > 0) {
      freudian.unconscious_desires.forEach(item => content.push(item))
    }

    if (content.length > 0) {
      insights.push({
        title: t('advancedAnalysis.psychologicalFrameworks.freudian'),
        content,
        type: 'freudian'
      })
    }
  }

  // Adlerian Analysis
  if (adlerian && (adlerian.power_dynamics?.length || adlerian.inferiority_feelings?.length || adlerian.social_interest?.length)) {
    const content: string[] = []

    if (adlerian.power_dynamics && adlerian.power_dynamics.length > 0) {
      adlerian.power_dynamics.forEach(item => content.push(item))
    }

    if (adlerian.inferiority_feelings && adlerian.inferiority_feelings.length > 0) {
      adlerian.inferiority_feelings.forEach(item => content.push(item))
    }

    if (adlerian.social_interest && adlerian.social_interest.length > 0) {
      adlerian.social_interest.forEach(item => content.push(item))
    }

    if (content.length > 0) {
      insights.push({
        title: t('advancedAnalysis.psychologicalFrameworks.adlerian'),
        content,
        type: 'adlerian'
      })
    }
  }

  // Gestalt Analysis
  if (gestalt && (gestalt.disowned_parts?.length || gestalt.unfinished_business?.length || gestalt.integration_suggestions?.length)) {
    const content: string[] = []

    if (gestalt.unfinished_business && gestalt.unfinished_business.length > 0) {
      gestalt.unfinished_business.forEach(item => content.push(item))
    }

    if (gestalt.disowned_parts && gestalt.disowned_parts.length > 0) {
      gestalt.disowned_parts.forEach(item => content.push(item))
    }

    if (gestalt.integration_suggestions && gestalt.integration_suggestions.length > 0) {
      gestalt.integration_suggestions.forEach(item => content.push(item))
    }

    if (content.length > 0) {
      insights.push({
        title: t('advancedAnalysis.psychologicalFrameworks.gestalt'),
        content,
        type: 'gestalt'
      })
    }
  }

  // If no psychological framework insights were generated, provide basic insights
  if (insights.length === 0) {
    const basicInsights = []
    
    // Add basic dream analysis insight
    if (isTurkish) {
      basicInsights.push({
        title: "Rüya Analizi",
        content: ["Bu rüya, bilinçdışı süreçlerinizin bir yansımasıdır. Rüyadaki semboller ve temalar, günlük yaşamınızdaki deneyimlerinizi ve duygularınızı yansıtabilir."],
        type: 'basic'
      })
    } else {
      basicInsights.push({
        title: "Dream Analysis",
        content: ["This dream is a reflection of your unconscious processes. The symbols and themes in the dream may reflect your daily life experiences and emotions."],
        type: 'basic'
      })
    }
    
    return basicInsights
  }

  return insights
}

// Fallback translation function with interpolation support
const fallbackTranslation = (key: string, values?: Record<string, any>): string => {
  if (values) {
    let result = key;
    Object.keys(values).forEach(k => {
      result = result.replace(`{${k}}`, values[k]);
    });
    return result;
  }
  return key;
};

export async function performAdvancedDreamAnalysis(dreamText: string, language: string = 'tr', t?: (key: string, values?: Record<string, any>) => string): Promise<AdvancedDreamAnalysis> {
  const normalizedText = dreamText.trim()
  if (normalizedText.length === 0) {
    return {
      themes: [],
      emotions: [],
      synthesis: buildSynthesis('', language)
    }
  }

  const baseAnalysis = analyzeDream(normalizedText, language as Language)
  const mappedThemes = mapThemes(baseAnalysis.themes)

  const mappedEmotions = mapEmotions(baseAnalysis.emotions)
  const synthesis = buildSynthesis(baseAnalysis.psychologicalSummary, language)
  const archetypeSection = buildArchetypeSection(baseAnalysis.jungianArchetypes)
  const devilsAdvocate = buildDevilsAdvocate(baseAnalysis.dominantThemes, language)
  const culturalContext = buildCulturalContext(baseAnalysis.places, language)
  const interventions = buildInterventions(language)

  const jungian_analysis = archetypeSection
  const freudian_analysis = {
    repressed_content: baseAnalysis.dominantThemes?.map(theme =>
      (t || fallbackTranslation)('advancedAnalysis.psychologicalFrameworks.repressedContentTemplate', { theme })
    ),
    defense_mechanisms: baseAnalysis.emotionalTone ? [
      `${(t || fallbackTranslation)('advancedAnalysis.psychologicalFrameworks.dreamEmotionalTone')}: ${baseAnalysis.emotionalTone}`
    ] : undefined,
    evidence_level: 'low' as const
  }
  const adlerian_analysis = {
    power_dynamics: baseAnalysis.dominantThemes?.map(theme =>
      (t || fallbackTranslation)('advancedAnalysis.psychologicalFrameworks.powerDynamicsTemplate', { theme })
    ),
    inferiority_feelings: baseAnalysis.dominantEmotions?.map(emotion =>
      (t || fallbackTranslation)('advancedAnalysis.psychologicalFrameworks.inferiorityFeelingsTemplate', { emotion })
    ),
    evidence_level: 'low' as const
  }
  const gestalt_analysis = {
    unfinished_business: mappedThemes.map(theme =>
      (t || fallbackTranslation)('advancedAnalysis.psychologicalFrameworks.unfinishedBusinessTemplate', { theme: theme.theme })
    ),
    integration_suggestions: mappedThemes.map(theme =>
      (t || fallbackTranslation)('advancedAnalysis.psychologicalFrameworks.integrationSuggestionsTemplate', { theme: theme.theme })
    ),
    evidence_level: 'low' as const
  }

  // Build structured insights from psychological frameworks
  const structuredInsights = buildStructuredInsights(
    jungian_analysis,
    freudian_analysis,
    adlerian_analysis,
    gestalt_analysis,
    language,
    t || fallbackTranslation // Fallback function if t is not provided
  )

  return {
    themes: mappedThemes,
    emotions: mappedEmotions,
    synthesis,
    jungian_analysis,
    freudian_analysis,
    adlerian_analysis,
    gestalt_analysis,
    cultural_context: culturalContext,
    devils_advocate: devilsAdvocate,
    evidence_based_interventions: interventions,
    structuredInsights
  }
}

