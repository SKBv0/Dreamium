import { DreamAnalysisResult, Theme, Emotion, QuantitativeAnalysisResult } from './types'
import type { AdvancedDreamAnalysis } from './advanced-dream-analysis'
import type { EmotionAnalysisResult } from './emotion-analysis'
import { getSystemMessageForLanguage } from './system-messages'

export interface UserFriendlySummary {
  title: string
  mainInsight: string
  sections: {
    whatHappened: string
    whatItMeans: string
    emotions: string
    symbols: string
    practicalInsights: string
    scientificNote: string
  }
}

type Language = 'tr' | 'en'

function normalizeLanguage(value?: string | null): Language {
  return value === 'en' ? 'en' : 'tr'
}

const DEFAULT_MAIN_SUMMARY_SYSTEM_PROMPT: Record<Language, string> = {
  tr: `Sıcak ama profesyonel bir rüya analistisiniz. DREAM_DATA bloğundaki bilgileri kullanarak Markdown formatında 3-4 paragraf uzunluğunda bir ana içgörü yazın. Ton empatik ve erişilebilir olmalı; teknik kavramları sade dille açıklayın. Rüyadaki baskın temalara, duygulara ve gündelik yaşam bağlantılarına odaklanın. DREAM_DATA içindeki kantitatif veya bilimsel verileri doğal biçimde anlatıma yerleştirin ve sonunda gerektiğinde profesyonel destek hatırlatması ekleyin. DREAM_DATA dışında hiçbir bilgi uydurmayın.`,
  en: `You are a warm yet evidence-aware dream analyst. Use the information inside the DREAM_DATA block to craft a Markdown response of 3–4 concise paragraphs. Keep the tone empathetic and accessible while staying professional. Interpret the dominant themes, emotional tone, and possible waking-life links. Weave any quantitative or scientific metrics from DREAM_DATA naturally into the prose and close with a brief reminder about seeking professional support when appropriate. Do not invent details that are not present in DREAM_DATA.`
}

function resolveMainSummarySystemPrompt(language: Language): string {
  const message = getSystemMessageForLanguage('userMainSummary', language)
  if (message?.isActive && message.content.trim().length > 0) {
    return message.content
  }
  return DEFAULT_MAIN_SUMMARY_SYSTEM_PROMPT[language]
}

export async function createUserFriendlySummary(
  analysisResult: DreamAnalysisResult,
  advancedAnalysis: AdvancedDreamAnalysis | null,
  quantitativeResult: QuantitativeAnalysisResult | null,
  emotionAnalysisResult: EmotionAnalysisResult | null,
  language: string = 'tr'
): Promise<UserFriendlySummary> {
  const lang = normalizeLanguage(language)

  const mainInsight = await createSimpleMainInsight(
    analysisResult,
    advancedAnalysis,
    quantitativeResult,
    emotionAnalysisResult,
    lang
  )

  return {
    title: lang === 'tr' ? 'Rüya Analizi' : 'Dream Analysis',
    mainInsight,
    sections: {
      whatHappened: createSimpleWhatHappened(analysisResult, quantitativeResult, lang),
      whatItMeans: createSimpleWhatItMeans(analysisResult, lang),
      emotions: createSimpleEmotions(analysisResult, emotionAnalysisResult, lang),
      symbols: createSimpleSymbols(analysisResult, lang),
      practicalInsights: createSimplePracticalInsights(analysisResult, lang),
      scientificNote: createSimpleScientificNote(analysisResult, quantitativeResult, lang)
    }
  }
}

// Cache with TTL for preventing duplicate calls and storing results
import { createHash } from 'crypto'

type CachedSummary = {
  promise: Promise<string>
  expiresAt: number
}

const SUMMARY_CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes
const summaryRequestCache = new Map<string, CachedSummary>()

function hashPayload(value: unknown): string {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value)
  return createHash('sha256').update(serialized).digest('hex')
}

function buildSummaryCacheKey(
  dreamText: string,
  language: string,
  demographics: any | null,
  modelVersion: string,
  analyzerVersion: string,
  settings: Record<string, unknown>
): string {
  return hashPayload([
    'user-friendly-summary',
    hashPayload(dreamText),
    language,
    demographics ? hashPayload(demographics) : 'no-demographics',
    modelVersion,
    analyzerVersion,
    hashPayload(settings)
  ])
}

function pruneSummaryCache(now: number = Date.now()) {
  for (const [key, entry] of summaryRequestCache.entries()) {
    if (entry.expiresAt <= now) {
      summaryRequestCache.delete(key)
    }
  }
}

async function createSimpleMainInsight(
  analysisResult: DreamAnalysisResult,
  advancedAnalysis: AdvancedDreamAnalysis | null,
  quantitativeResult: QuantitativeAnalysisResult | null,
  emotionAnalysisResult: EmotionAnalysisResult | null,
  language: Language
): Promise<string> {
  const dreamText = analysisResult.dreamText || ''

  if (dreamText.trim().length < 20) {
    return language === 'tr'
      ? 'Rüya metni oldukça kısa olduğu için derinlemesine analiz yapmak güçleşiyor. Biraz daha detay eklersen daha kapsamlı bir yorum hazırlayabiliriz.'
      : 'The dream text is rather short, which makes it challenging to build a deeper interpretation. Adding a few more details would unlock a richer analysis.'
  }

  try {
    const now = Date.now()
    pruneSummaryCache(now)

    const modelVersion = process.env.NEXT_PUBLIC_APP_VERSION || 'unknown-model'
    const analyzerVersion = 'summary-v1'
    const demographics = null // Demographics not directly stored in result
    const settings = {}

    const cacheKey = buildSummaryCacheKey(
      dreamText,
      language,
      demographics,
      modelVersion,
      analyzerVersion,
      settings
    )

    const cached = summaryRequestCache.get(cacheKey)
    if (cached && cached.expiresAt > now) {
      return cached.promise
    }

    if (cached) {
      summaryRequestCache.delete(cacheKey)
    }

    const prompt = buildMainInsightPrompt(
      analysisResult,
      advancedAnalysis,
      quantitativeResult,
      emotionAnalysisResult,
      language
    )
    const systemPrompt = resolveMainSummarySystemPrompt(language)

    const requestPromise = (async () => {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          systemPrompt,
          language
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data?.success && typeof data.text === 'string' && data.text.trim().length > 0) {
          let text: string = data.text.trim()
          // Enforce minimum depth: if too short, blend with fallback
          const tooShort = text.replace(/\s+/g, ' ').length < 400 || (text.match(/\n/g) || []).length < 2
          if (tooShort) {
            const fallback = buildMainInsightFallback(analysisResult, quantitativeResult, language)
            text = `${text}\n\n${fallback}`.trim()
          }
          return text
        }
      }
      throw new Error('Invalid response')
    })()

    summaryRequestCache.set(cacheKey, {
      promise: requestPromise,
      expiresAt: now + SUMMARY_CACHE_TTL_MS
    })

    try {
      return await requestPromise
    } catch (error) {
      summaryRequestCache.delete(cacheKey)
      throw error
    }
  } catch (error) {
    console.warn('AI main insight generation failed, using fallback.', error)
  }

  return buildMainInsightFallback(analysisResult, quantitativeResult, language)
}

function buildMainInsightPrompt(
  analysisResult: DreamAnalysisResult,
  advancedAnalysis: AdvancedDreamAnalysis | null,
  quantitativeResult: QuantitativeAnalysisResult | null,
  emotionAnalysisResult: EmotionAnalysisResult | null,
  language: Language
): string {
  const topThemes = analysisResult.themes.slice(0, 3).map(theme => theme.theme).join(', ')
  const topEmotions = analysisResult.emotions.slice(0, 3).map(emotion => emotion.emotion).join(', ')
  const sanitizedInsights = analysisResult.insights
    .map(text => text.trim())
    .filter(text => text.length > 0)
  const insightBlock = sanitizedInsights.length > 0
    ? sanitizedInsights.map((text, index) => `${index + 1}. ${text}`).join('\n')
    : 'None'

  const quantitativeSummary = quantitativeResult
    ? [
        `characters=${quantitativeResult.characterCount}`,
        `interactions=${quantitativeResult.socialInteractions?.total ?? 0}`,
        `unconscious=${formatPercentage(quantitativeResult.consciousnessScore)}`
      ].join('; ')
    : 'None'

  const emotionSummary = emotionAnalysisResult
    ? [
        `primary=${emotionAnalysisResult.primaryEmotion?.emotion ?? 'unknown'}`,
        `complexity=${formatPercentage(emotionAnalysisResult.emotionalComplexity)}`,
        `balance=pos${formatPercentage(emotionAnalysisResult.valenceBalance.positive)}/neg${formatPercentage(emotionAnalysisResult.valenceBalance.negative)}/neu${formatPercentage(emotionAnalysisResult.valenceBalance.neutral)}`
      ].join('; ')
    : 'None'

  const advancedSynthesis = advancedAnalysis?.synthesis?.content ?? ''
  const scientificNote = advancedAnalysis?.synthesis?.scientific_disclaimer ?? ''
  const culturalContext = advancedAnalysis?.cultural_context?.culturalSymbols?.join(', ') ?? ''
  const alternativeView = advancedAnalysis?.devils_advocate?.content ?? ''

  const sections = [
    '=== DREAM_DATA ===',
    `LANGUAGE: ${language === 'tr' ? 'Turkish' : 'English'}`,
    `DREAM_TEXT:\n${analysisResult.dreamText}`,
    `TOP_THEMES: ${topThemes || 'None'}`,
    `TOP_EMOTIONS: ${topEmotions || 'None'}`,
    `INSIGHTS:\n${insightBlock}`,
    `QUANTITATIVE: ${quantitativeSummary}`,
    `EMOTION_ANALYSIS: ${emotionSummary}`
  ]

  if (advancedSynthesis) {
    sections.push(`ADVANCED_SYNTHESIS: ${advancedSynthesis}`)
  }

  if (scientificNote) {
    sections.push(`SCIENTIFIC_NOTE: ${scientificNote}`)
  }

  if (culturalContext) {
    sections.push(`CULTURAL_CONTEXT: ${culturalContext}`)
  }

  if (alternativeView) {
    sections.push(`ALTERNATIVE_VIEW: ${alternativeView}`)
  }

  return sections.join('\n\n')
}

function buildMainInsightFallback(
  analysisResult: DreamAnalysisResult,
  quantitativeResult: QuantitativeAnalysisResult | null,
  language: Language
): string {
  const dominantTheme = analysisResult.themes[0]?.theme
  const themeText = dominantTheme || (language === 'tr' ? 'belirgin bir tema' : 'a core motif')
  const dominantEmotion = analysisResult.emotions[0]
  const emotionText = dominantEmotion
    ? `${dominantEmotion.emotion} (${formatPercentage(dominantEmotion.intensity)})`
    : language === 'tr'
      ? 'karma bir duygu karışımı'
      : 'a blend of emotions'

  const quantitativeLine = quantitativeResult
    ? language === 'tr'
      ? `Metindeki kantitatif izler ${quantitativeResult.characterCount} karakter ve ${quantitativeResult.socialInteractions?.total ?? 0} sosyal temas gösteriyor; bu da ilişkisel dinamiklerin de bilinçdışında çalıştığını düşündürüyor.`
      : `Quantitative signals show ${quantitativeResult.characterCount} characters and ${quantitativeResult.socialInteractions?.total ?? 0} social interactions, hinting that relational dynamics are active in the subconscious.`
    : language === 'tr'
      ? 'Kantitatif veri sınırlı olduğu için odak daha çok içsel deneyime kayıyor.'
      : 'With limited quantitative data, the focus leans toward an inner, self-reflective process.'

  if (language === 'tr') {
    return [
      `Rüyanın merkezinde **${themeText}** teması belirgin. Bu motif, bilinçdışında tekrar tekrar düşündüğün bir meseleye işaret ediyor olabilir.`,
      `Duygusal tonun baskın rengi **${emotionText}**. Bu his, rüyadaki olaylara içten verdiğin tepkiyi açık ediyor.`,
      quantitativeLine,
      'Genel olarak rüyada, içsel sorgulamalarla birlikte ilerleyen katmanlı duygular görünüyor. Bu işaretleri ciddiye alıp sezgilerini dinlemek, rüyanın sana açmaya çalıştığı kapıları fark etmene yardım edebilir.'
    ].join('\n\n')
  }

  return [
    `The dream pivots around **${themeText}**, a motif that often mirrors a focus your subconscious keeps revisiting.`,
    `Emotionally, **${emotionText}** colours the scene, capturing the inner response that accompanies the events.`,
    quantitativeLine,
    'Overall the dream sketches a phase of inward questioning wrapped in layered feelings. Staying attentive to these cues can reveal what your intuition wants you to acknowledge right now.'
  ].join('\n\n')
}

function createSimpleWhatHappened(
  analysisResult: DreamAnalysisResult,
  quantitativeResult: QuantitativeAnalysisResult | null,
  language: Language
): string {
  const insightsPreview = analysisResult.insights.slice(0, 3)
  const themes = analysisResult.themes.slice(0, 2)
  
  const quickSummary = language === 'tr' 
    ? 'Rüyanızın analizi tamamlandı. Temel unsurlar ve ana temalar belirlendi.'
    : 'Your dream analysis is complete. Core elements and main themes have been identified.'
  
  const dominantTheme = themes.length > 0 
    ? (language === 'tr' 
        ? `**Baskın Tema:** ${themes[0].theme}`
        : `**Dominant Theme:** ${themes[0].theme}`)
    : ''

  const insightLines = insightsPreview.map((insight, index) => {
    if (index === 0) {
      return `- ${insight}`
    } else {
      return `- ${insight}`
    }
  })

  const insightBlock = insightLines.length > 0
    ? `**Öne Çıkan Gözlemler:**\n\n${insightLines.join('\n\n')}`
    : ''

  return [quickSummary, dominantTheme, insightBlock].filter(Boolean).join('\n\n')
}

function createSimpleWhatItMeans(
  analysisResult: DreamAnalysisResult,
  language: Language
): string {
  const themeNarratives = analysisResult.themes
    .slice(0, 3) // Show fewer themes
    .map(theme => describeTheme(theme, language))
    .filter(Boolean)

  if (themeNarratives.length === 0) {
    const fallback = language === 'tr'
      ? 'Rüyanızın detaylarını artırarak daha kapsamlı bir analiz elde edebilirsiniz.'
      : 'Adding more details to your dream will provide a more comprehensive analysis.'
    return fallback
  }

  const extendedReflection = language === 'tr'
    ? 'Bu analiz, günlük yaşamınızdaki mevcut durumunuzu ve içsel süreçlerinizi yansıtıyor olabilir.'
    : 'This analysis may reflect your current life situation and internal processes.'

  return [themeNarratives.join('\n\n'), extendedReflection].join('\n\n')
}

function createSimpleEmotions(
  analysisResult: DreamAnalysisResult,
  emotionAnalysisResult: EmotionAnalysisResult | null,
  language: Language
): string {
  const emotionLines = analysisResult.emotions
    .slice(0, 3) // Show fewer emotions
    .map(emotion => describeEmotion(emotion, language))
    .filter(Boolean)

  if (emotionLines.length === 0 && !emotionAnalysisResult) {
    return language === 'tr'
      ? 'Rüyanızda belirgin duygu verisi tespit edilemedi. Duygusal detayları ekleyerek analizi zenginleştirebilirsiniz.'
      : 'No distinct emotional data detected in your dream. Adding emotional details would enrich the analysis.'
  }

  const analyticalExtension = emotionAnalysisResult
    ? describeEmotionAnalysis(emotionAnalysisResult, language)
    : ''

  return [emotionLines.join('\n\n'), analyticalExtension].filter(Boolean).join('\n\n')
}

function createSimpleSymbols(
  analysisResult: DreamAnalysisResult,
  language: Language
): string {
  const symbolBlocks = analysisResult.themes
    .slice(0, 3) // Show fewer symbols
    .map(theme => formatSymbolBlock(theme, language))
    .filter(Boolean)

  if (symbolBlocks.length === 0) {
    const fallback = language === 'tr'
      ? 'Rüyanızda belirgin semboller tespit edilemedi. Daha detaylı bir rüya anlatımı sembolik analizi zenginleştirecektir.'
      : 'No distinct symbols detected in your dream. A more detailed dream description would enrich the symbolic analysis.'
    return fallback
  }

  return symbolBlocks.join('\n\n')
}

function createSimplePracticalInsights(
  analysisResult: DreamAnalysisResult,
  language: Language
): string {
  const themeSuggestions = analysisResult.themes
    .slice(0, 2)
    .map(theme => buildThemeSuggestion(theme, language))
    .filter(Boolean)

  if (themeSuggestions.length === 0) {
    return ''
  }

  const header = language === 'tr'
    ? '## Tema-Spesifik Öneriler'
    : '## Theme-Specific Suggestions'

  return [header, themeSuggestions.join('\n\n')].join('\n\n')
}

function createSimpleScientificNote(
  analysisResult: DreamAnalysisResult,
  quantitativeResult: QuantitativeAnalysisResult | null,
  language: Language
): string {
  // Clinical assessment feature removed - not implemented
  const riskLevel = undefined
  const referralSuggested = undefined
  const consciousness = quantitativeResult?.consciousnessScore

  const lines: string[] = []

  if (language === 'tr') {
    lines.push(
      'Bu yorum bilgilendirme amaçlıdır; klinik tanı yerine geçmez. Rahatsız edici tekrar eden rüyalar veya yoğun duygusal zorlanmalar yaşıyorsan bir uzmandan destek alman önerilir.'
    )
    if (typeof consciousness === 'number') {
      const depth = consciousness >= 75 ? 'yüksek' : consciousness >= 50 ? 'orta' : 'düşük'
      lines.push(`- Bilinçdışı derinlik skoru: ${formatPercentage(consciousness)} (${depth})`)
    }
    if (riskLevel) {
      const label = riskLevel === 'high' ? 'yüksek' : riskLevel === 'medium' ? 'orta' : 'düşük'
      lines.push(`- Klinik risk değerlendirmesi: ${label}`)
      if (referralSuggested) {
        lines.push('- Gerekirse bir uzmana başvurman öneriliyor.')
      }
    }
  } else {
    lines.push(
      'This interpretation is informative and should not be mistaken for a clinical diagnosis. If the dream recurs frequently or triggers intense distress, consider consulting a professional.'
    )
    if (typeof consciousness === 'number') {
      const depth = consciousness >= 75 ? 'high' : consciousness >= 50 ? 'moderate' : 'low'
      lines.push(`- Unconscious depth score: ${formatPercentage(consciousness)} (${depth})`)
    }
    if (riskLevel) {
      const label = riskLevel === 'high' ? 'high' : riskLevel === 'medium' ? 'moderate' : 'low'
      lines.push(`- Clinical risk level: ${label}`)
      if (referralSuggested) {
        lines.push('- A professional referral is recommended if symptoms persist.')
      }
    }
  }

  return lines.join('\n\n')
}

function describeTheme(theme: Theme, language: Language): string {
  const entry = THEME_LIBRARY.find(item =>
    item.keywords.some(keyword => theme.theme.toLowerCase().includes(keyword))
  )

  if (!entry) {
    const description = theme.description && theme.description.trim().length > 0
      ? theme.description
      : theme.theme
    return language === 'tr'
      ? `**${theme.theme}:** ${description}`
      : `**${theme.theme}:** ${description}`
  }

  return language === 'tr' ? entry.tr : entry.en
}

function describeEmotion(emotion: Emotion, language: Language): string {
  const name = emotion.emotion
  const value = typeof emotion.intensity === 'number' ? ` (${formatPercentage(emotion.intensity)})` : ''
  return language === 'tr'
    ? `**${name}:** Yoğunluk${value}`
    : `**${name}:** Intensity${value}`
}

function describeEmotionAnalysis(result: EmotionAnalysisResult, language: Language): string {
  const lines: string[] = []
  
  if (result.primaryEmotion) {
    lines.push(
      language === 'tr'
        ? `**Ana duygu:** ${result.primaryEmotion.emotion}`
        : `**Primary emotion:** ${result.primaryEmotion.emotion}`
    )
  }
  
  if (result.valenceBalance) {
    const isPositive = result.valenceBalance.positive > result.valenceBalance.negative
    lines.push(
      language === 'tr'
        ? `**Duygusal ton:** ${isPositive ? 'Pozitif' : 'Negatif'} ağırlıklı`
        : `**Emotional tone:** ${isPositive ? 'Positive' : 'Negative'} weighted`
    )
  }

  return lines.join('\n\n')
}

function formatSymbolBlock(theme: Theme, language: Language): string | '' {
  const title = `**${theme.theme}**`
  const desc = theme.description?.trim() || ''
  const body = desc.length > 0 ? desc : (language === 'tr' ? 'Bu motif rüyada dikkat çekiyor.' : 'This motif stands out in the dream.')
  return `${title}: ${body}`
}

function buildThemeSuggestion(theme: Theme, language: Language): string | '' {
  const base = theme.theme.toLowerCase()
  const entry = THEME_SUGGESTIONS.find(item => item.keywords.some(k => base.includes(k)))
  if (!entry) return ''
  return language === 'tr' ? entry.tr : entry.en
}

function formatPercentage(value?: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'N/A'
  }

  const normalized = Math.abs(value) <= 1 ? value * 100 : value
  return `${Math.round(normalized)}%`
}

interface ThemeNarrative {
  keywords: string[]
  tr: string
  en: string
}

interface ThemeSuggestion {
  keywords: string[]
  tr: string
  en: string
}

const THEME_LIBRARY: ThemeNarrative[] = [
  {
    keywords: ['su', 'water', 'deniz', 'ocean'],
    tr: '- **Su teması:** Duygusal akışın, bilinçdışının ve arınma ihtiyacının sembolü olabilir. Suyun sakin veya dalgalı oluşu, duyguları nasıl taşıdığını anlatır.',
    en: '- **Water theme:** Often reflects emotional flow, the subconscious, and a desire for cleansing. Whether the water is calm or turbulent mirrors how you hold your feelings.'
  },
  {
    keywords: ['korku', 'fear'],
    tr: '- **Korku teması:** Kontrol kaybı hissi veya bekleyen bir yüzleşme ihtiyacını işaret edebilir.',
    en: '- **Fear motif:** May point toward a sense of lost control or an overdue confrontation.'
  },
  {
    keywords: ['kimlik', 'identity', 'benlik', 'self'],
    tr: '- **Kimlik vurgusu:** Değerleri, roller veya yön bulma ihtiyacının yeniden değerlendirildiği bir dönemden geçildiğine işaret eder.',
    en: '- **Identity focus:** Suggests a phase where you are reassessing your values, roles, or sense of direction.'
  },
  {
    keywords: ['dönüşüm', 'transformation', 'değişim', 'change'],
    tr: '- **Dönüşüm sembolü:** Eski bir kalıbı bırakıp yeni bir zihinsel alan açmaya hazır olunabileceğini gösterir.',
    en: '- **Transformation motif:** Indicates readiness to release an old pattern and invite a new mental space.'
  },
  {
    keywords: ['ev', 'home', 'yuva', 'house'],
    tr: '- **Ev teması:** Güvenlik, aidiyet ve iç dünyaya dönme ihtiyacını temsil eder. Evdeki detaylar hangi duyguyu aradığını anlatır.',
    en: '- **Home theme:** Represents safety, belonging, and a desire to return inward. The details of the home reveal the feeling you seek.'
  },
  {
    keywords: ['uçuş', 'flying', 'uçmak'],
    tr: '- **Uçma hissi:** Özgürleşme ve sınırları aşma arzusunun sembolü olabilir.',
    en: '- **Flying sensation:** Often symbolises freedom, breaking limitations, and unleashing creative energy.'
  },
  {
    keywords: ['karanlık', 'dark', 'shadow'],
    tr: '- **Gölge alanlar:** Karanlık sahneler, fark edilmeyi bekleyen içsel parçalara işaret edebilir.',
    en: '- **Shadow zones:** Dark scenes may signal inner parts seeking illumination and acknowledgment.'
  }
]

const THEME_SUGGESTIONS: ThemeSuggestion[] = [
  {
    keywords: ['su', 'water'],
    tr: '- **Su ile çalış:** Gün içinde duygu durumunu kısa notlarla izle; ritmini fark etmek rahatlatıcı olabilir.',
    en: '- **Work with water:** Track your mood briefly during the day; recognising its rhythm can feel soothing.'
  },
  {
    keywords: ['korku', 'fear'],
    tr: '- **Korkuyu tanı:** Güvendiğin biriyle korkunu paylaş ya da küçük adımlarla gerçek hayattaki karşılığını gözlemle.',
    en: '- **Name the fear:** Share it with someone you trust or observe its real-life trigger in manageable steps.'
  },
  {
    keywords: ['kimlik', 'identity'],
    tr: '- **Kimlik defteri:** Kendine ait üç değer yaz; birini bu hafta gündelik hayatta görünür kıl.',
    en: '- **Identity journal:** List three core values and highlight one in your daily life this week.'
  },
  {
    keywords: ['dönüşüm', 'transformation'],
    tr: '- **Dönüşüm ritüeli:** Bırakmak istediğin bir alışkanlığı not et ve yerine koymak istediğin yeni davranışı seç.',
    en: '- **Transformation ritual:** Note a habit you want to release and choose a new behaviour to invite.'
  },
  {
    keywords: ['ev', 'home'],
    tr: '- **Güvenli alan:** Yaşadığın mekânda seni rahatlatan küçük bir köşe oluştur; zihinsel olarak da dönüp dinlenebileceğin sembolik bir yer yarat.',
    en: '- **Safe spot:** Create a calming corner in your space; a symbolic place to mentally return and rest.'
  }
]

