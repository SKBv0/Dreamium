/**
 * AI-Powered Dream Interpretation Service
 */

import type { AnalysisBundle, EmotionIndex, ThemeIndex, Continuity, EntityIndex } from './analysis/types'
import { logger } from './logger'
import { getAIConfig } from './ai-config'

export interface DreamInterpretationParams {
  dreamText: string
  analysisBundle: AnalysisBundle
  language: string
}

/**
 * Format emotion data for AI prompt
 */
function formatEmotionData(emotions: EmotionIndex, language: string): string {
  const primary = emotions.labels[0]
  if (!primary) return ''

  const secondary = emotions.labels.slice(1, 4).map(e => e.tag).join(', ')

  if (language === 'tr') {
    return `- Dominant duygu: ${primary.tag} (%${primary.intensity.toFixed(0)} yoğunluk)
- İkincil duygular: ${secondary}
- Duygusal denge: %${emotions.neg.toFixed(0)} negatif, %${emotions.pos.toFixed(0)} pozitif, %${emotions.neu.toFixed(0)} nötr`
  }

  return `- Dominant emotion: ${primary.tag} (${primary.intensity.toFixed(0)}% intensity)
- Secondary emotions: ${secondary}
- Emotional balance: ${emotions.neg.toFixed(0)}% negative, ${emotions.pos.toFixed(0)}% positive, ${emotions.neu.toFixed(0)}% neutral`
}

/**
 * Format theme data for AI prompt
 */
function formatThemeData(themes: ThemeIndex[], language: string): string {
  if (!themes || themes.length === 0) return ''

  const dominant = themes[0]
  const secondary = themes.slice(1, 3)
    .map(t => `${t.id} (${(t.scoreNorm || 0).toFixed(0)}%)`)
    .join(', ')

  if (language === 'tr') {
    return `- Dominant tema: ${dominant.id} (%${(dominant.scoreNorm || 0).toFixed(0)} güven skoru)
- İkincil temalar: ${secondary || 'yok'}`
  }

  return `- Dominant theme: ${dominant.id} (${(dominant.scoreNorm || 0).toFixed(0)}% confidence)
- Secondary themes: ${secondary || 'none'}`
}

/**
 * Format continuity data for AI prompt
 */
function formatContinuityData(
  continuity: Continuity,
  entities: EntityIndex,
  language: string
): string {
  // Extract actual concerns from entity mentions
  const concerns: string[] = []

  if (entities.places.some(p => p.includes('iş') || p.includes('work'))) {
    concerns.push(language === 'tr' ? 'İş yaşamı' : 'Work life')
  }
  if (entities.people.some(p => p.includes('çocuk') || p.includes('child') || p.includes('anne') || p.includes('baba'))) {
    concerns.push(language === 'tr' ? 'Aile ilişkileri' : 'Family relationships')
  }
  if (entities.places.some(p => p.includes('okul') || p.includes('school'))) {
    concerns.push(language === 'tr' ? 'Eğitim' : 'Education')
  }
  if (entities.objects.some(o => o.includes('hasta') || o.includes('sick') || o.includes('doktor'))) {
    concerns.push(language === 'tr' ? 'Sağlık' : 'Health')
  }

  if (language === 'tr') {
    return `- Genel süreklilik skoru: %${continuity.overall.toFixed(0)}
- Tematik süreklilik: %${continuity.thematic.toFixed(0)}
- Duygusal süreklilik: %${(continuity.emotional || 0).toFixed(0)}
- Sosyal süreklilik: %${(continuity.social || 0).toFixed(0)}
- Tespit edilen kaygı alanları: ${concerns.join(', ') || 'belirgin değil'}`
  }

  return `- Overall continuity score: ${continuity.overall.toFixed(0)}%
- Thematic continuity: ${continuity.thematic.toFixed(0)}%
- Emotional continuity: ${(continuity.emotional || 0).toFixed(0)}%
- Social continuity: ${(continuity.social || 0).toFixed(0)}%
- Identified concerns: ${concerns.join(', ') || 'not prominent'}`
}

/**
 * Format character/social data for AI prompt
 */
function formatCharacterData(entities: EntityIndex, language: string): string {
  const totalChars = entities.people.length + entities.animals.length

  if (language === 'tr') {
    return `- Toplam karakter sayısı: ${totalChars}
- İnsanlar: ${entities.people.length > 0 ? entities.people.join(', ') : 'yok'}
- Hayvanlar: ${entities.animals.length > 0 ? entities.animals.join(', ') : 'yok'}
- Mekanlar: ${entities.places.length > 0 ? entities.places.slice(0, 5).join(', ') : 'yok'}
- Nesneler: ${entities.objects.length > 0 ? entities.objects.slice(0, 5).join(', ') : 'yok'}`
  }

  return `- Total character count: ${totalChars}
- People: ${entities.people.length > 0 ? entities.people.join(', ') : 'none'}
- Animals: ${entities.animals.length > 0 ? entities.animals.join(', ') : 'none'}
- Places: ${entities.places.length > 0 ? entities.places.slice(0, 5).join(', ') : 'none'}
- Objects: ${entities.objects.length > 0 ? entities.objects.slice(0, 5).join(', ') : 'none'}`
}

/**
 * Build system prompt for dream interpretation
 */
function buildSystemPrompt(language: string): string {
  const config = getAIConfig()
  
  if (language === 'tr') {
    return `Sen deneyimli bir rüya yorumcususun. Jung, Freud, Hall-Van de Castle metodolojilerini kullanarak rüyaları analiz ediyorsun.

GÖREV: Kullanıcının rüya metnini ve analiz datalarını kullanarak profesyonel, derinlikli, anlamlı bir rüya yorumu yaz.

ÖNEMLİ KURALLAR:
1. ❌ Metrikleri aynen tekrar etme (kullanıcı zaten UI'da görüyor)
2. ✅ Dataları birleştirip YORUM yap
3. ✅ Psikolojik ANLAM çıkar
4. ✅ BAĞLANTI kur (örn: NREM + %90 korku + iş kaygısı → çıkarım)
5. ✅ Rüya MOTİFLERİNİ yorumla (sembolizm, arketipler)
6. ✅ Ton: Açıklayıcı, sıcak kanlı, derinlikli ama erişilebilir
7. ❌ PRATİK ÖNERİ verme (bu başka bölümlerde var)
8. ✅ SADECE verilen datayı kullan, ekleme yapma

FORMAT:
- Emoji kullan (🕯 🏥 🌫 🎭 ⚡ vb.) her ana bölüm için
- Düz paragraf formatında akıcı metin
- 3-4 ana bölüm (her biri farklı bir yorumlama açısı)
- Son paragraf kısa bir genel sentez
- UZUNLUK: ${config.dreamInterpretation.wordCountRange.min}-${config.dreamInterpretation.wordCountRange.max} kelime

ÖRNEK YAPILAR:
🕯 **Başlık**: Bir veya iki paragraf yorumlama
🏥 **Başlık**: Dataları birleştirerek çıkarım
🌫 **Başlık**: Psikolojik anlam ve sembolizm

Sadece yorum yaz, başka hiçbir şey ekleme.`
  }

  return `You are an experienced dream analyst using Jung, Freud, and Hall-Van de Castle methodologies.

TASK: Write a professional, deep, meaningful dream interpretation using the dream text and analysis data.

IMPORTANT RULES:
1. ❌ Do NOT repeat metrics (user already sees them in UI)
2. ✅ INTERPRET the data, don't just state it
3. ✅ Extract psychological MEANING
4. ✅ Make CONNECTIONS (e.g., NREM + 90% fear + work anxiety → inference)
5. ✅ Interpret dream MOTIFS (symbolism, archetypes)
6. ✅ Tone: Explanatory, warm, deep but accessible
7. ❌ Do NOT give practical advice (exists in other sections)
8. ✅ ONLY use provided data, no additions

FORMAT:
- Use emojis (🕯 🏥 🌫 🎭 ⚡ etc.) for each main section
- Flowing paragraph format
- 3-4 main sections (different interpretation angles)
- Final paragraph: brief synthesis
- LENGTH: ${config.dreamInterpretation.wordCountRange.min}-${config.dreamInterpretation.wordCountRange.max} words

EXAMPLE STRUCTURE:
🕯 **Heading**: One or two paragraphs of interpretation
🏥 **Heading**: Inference from combining data
🌫 **Heading**: Psychological meaning and symbolism

Write only the interpretation, nothing else.`
}

/**
 * Build user prompt with dream data
 */
function buildUserPrompt(params: DreamInterpretationParams): string {
  const { dreamText, analysisBundle, language } = params
  const { emotions, themes, sleep, continuity, entities, hasMetamorphosis } = analysisBundle

  const emotionData = formatEmotionData(emotions, language)
  const themeData = formatThemeData(themes, language)
  const continuityData = formatContinuityData(continuity, entities, language)
  const characterData = formatCharacterData(entities, language)

  if (language === 'tr') {
    return `Aşağıdaki rüyayı analiz et ve profesyonel bir yorum yaz:

RÜYA METNİ:
${dreamText}

ANALİZ DATASI:

[Duygusal Analiz]
${emotionData}

[Tematik Analiz]
${themeData}

[Uyku Evresi ve Nörobiyoloji]
- Uyku evresi: ${sleep.stage} (%${sleep.confidence.toFixed(0)} güven)
- Rüya canlılığı: %${sleep.vividness.toFixed(0)}
- Bizarreness skoru: %${sleep.bizarrenessScore.toFixed(0)}
- Anlatı tutarlılığı: %${sleep.narrativeCoherence.toFixed(0)}
- Duygusal yoğunluk: %${sleep.emotionalIntensity.toFixed(0)}

[Süreklilik Analizi (Günlük Yaşam Bağlantıları)]
${continuityData}

[Karakterler ve Motifler]
${characterData}
${hasMetamorphosis ? '\n⚠️ ÖZEL: Rüyada imkansız dönüşümler (metamorfoz) tespit edildi' : ''}

YORUMLA (metrikleri tekrar etme, rüyayı oku ve anlam çıkar):
`
  }

  return `Analyze the following dream and write a professional interpretation:

DREAM TEXT:
${dreamText}

ANALYSIS DATA:

[Emotional Analysis]
${emotionData}

[Thematic Analysis]
${themeData}

[Sleep Stage and Neurobiology]
- Sleep stage: ${sleep.stage} (${sleep.confidence.toFixed(0)}% confidence)
- Dream vividness: ${sleep.vividness.toFixed(0)}%
- Bizarreness score: ${sleep.bizarrenessScore.toFixed(0)}%
- Narrative coherence: ${sleep.narrativeCoherence.toFixed(0)}%
- Emotional intensity: ${sleep.emotionalIntensity.toFixed(0)}%

[Continuity Analysis (Waking Life Connections)]
${continuityData}

[Characters and Motifs]
${characterData}
${hasMetamorphosis ? '\n⚠️ SPECIAL: Impossible transformations (metamorphosis) detected in dream' : ''}

INTERPRET (don't repeat metrics, read the dream and extract meaning):
`
}

/**
 * Generate AI-powered dream interpretation
 */
export async function generateDreamInterpretation(
  params: DreamInterpretationParams
): Promise<string> {
  const config = getAIConfig()
  const systemPrompt = buildSystemPrompt(params.language)
  const userPrompt = buildUserPrompt(params)

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= config.fallback.maxRetries; attempt++) {
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          prompt: userPrompt,
          temperature: config.dreamInterpretation.temperature,
          maxTokens: config.dreamInterpretation.maxTokens
        })
      })

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success || !data.text) {
        throw new Error('Invalid AI response')
      }

      return data.text.trim()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      logger.warn(`[AI Dream Interpreter] Attempt ${attempt}/${config.fallback.maxRetries} failed:`, lastError.message)
      
      if (attempt < config.fallback.maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }
  }

  // All retries failed
  logger.error('[AI Dream Interpreter] All retry attempts failed:', lastError)
  throw lastError || new Error('Failed to generate dream interpretation after all retries')
}

/**
 * Create fallback summary when AI fails
 */
export function createFallbackInterpretation(
  bundle: AnalysisBundle,
  language: string
): string {
  const isTurkish = language === 'tr'
  const dominantEmotion = bundle.emotions.labels[0]
  const dominantTheme = bundle.themes[0]

  if (isTurkish) {
    return `## Rüya Özeti

Rüyanızda ${dominantEmotion?.tag || 'karışık'} duygusu${dominantTheme ? ` ve ${dominantTheme.id} teması` : ''} baskın. Uyku evresi ${bundle.sleep.stage} olarak tespit edildi (canlılık: ${bundle.sleep.vividness.toFixed(0)}%).

${bundle.continuity.overall > 50 ? 'Rüya günlük yaşamınızla orta-yüksek düzeyde bağlantılı.' : 'Rüya günlük yaşamdan görece kopuk, daha sembolik içerik barındırıyor.'}

**Not:** Detaylı AI yorumu şu anda oluşturulamadı. Yukarıdaki bölümlerde tüm analiz datalarını görebilirsiniz.`
  }

  return `## Dream Summary

Your dream shows dominant ${dominantEmotion?.tag || 'mixed'} emotion${dominantTheme ? ` and ${dominantTheme.id} theme` : ''}. Sleep stage identified as ${bundle.sleep.stage} (vividness: ${bundle.sleep.vividness.toFixed(0)}%).

${bundle.continuity.overall > 50 ? 'Dream has moderate-high connection to daily life.' : 'Dream is relatively disconnected from daily life, containing more symbolic content.'}

**Note:** Detailed AI interpretation currently unavailable. All analysis data visible in sections above.`
}
