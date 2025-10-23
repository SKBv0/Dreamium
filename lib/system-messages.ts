const STORAGE_KEY = "dreammapper-system-messages"
const BROWSER_DEFAULT_LANGUAGE: SystemMessage["language"] = "tr"

const clone = <T,>(value: T): T => {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value))
}

export interface SystemMessage {
  id: string
  name: string
  description: string
  content: string
  isActive: boolean
  language?: "tr" | "en"
}

export interface SystemMessagesConfig {
  quantitativeAnalysis: SystemMessage
  userMainSummary: SystemMessage
  [key: string]: SystemMessage
}

// Multilingual system messages
const systemMessagesByLanguage = {
  tr: {
    quantitativeAnalysis: {
      id: "quantitative-analysis",
      name: "Kantitatif Analiz Promptu",
      description: "Hall-Van de Castle tabanlı içerik analizi için yönlendirici sistem mesajı",
      content: `Sen bir rüya içerik analizcisisin. Rüya metnini analiz et ve SADECE açıkça belirtilenleri say.

Kurallar:
1. Karakterler: Sadece rüyada açıkça bahsedilen kişiler ("annesiyle konuştu"=2 kişi, "müze görevlisi"=1 kişi, "ben ve arkadaşım"=2 kişi)
2. Sosyal etkileşim: Karakterler arasında GERÇEK eylem olmalı
   - friendly: "konuştuk", "gülümsedi", "yardım etti", "birlikte gittik" = friendly
   - aggressive: "bağırdı", "kavga ettik", "kaçtı" = aggressive
   - neutral: "gördüm", "karşılaştım" (ama konuşmadık) = neutral
   - İKİ karakter olmadan sosyal etkileşim OLAMAZ!
3. Ortam: location ZORUNLU - TAM OLARAK şu değerlerden biri: "indoors" (kapalı), "outdoors" (açık), "mixed" (karışık)

Rüya: "{dreamText}"

ÖRNEK DOĞRU SAYIM:
"Annemle parkta yürüdük, sonra bir köpek gördük" →
- characters: insan=2 (ben+anne), hayvan=1 (köpek)
- social: friendly=1 ("yürüdük"=birlikte hareket), total=1
- location: MUTLAKA "outdoors" (park = dışarı)

ÖRNEK YANLIŞ SAYIM:
"Tek başıma evdeydim" →
- characters: insan=1 (sadece ben)
- social: total=0 (tek karakter, etkileşim yok)
- location: MUTLAKA "indoors" (ev = içeri)

JSON FORMAT (TÜM ALANLAR ZORUNLU):
{
  "characterCount": 2,
  "characters": [{"type": "insan", "count": 2}],
  "socialInteractions": {
    "total": 1,
    "types": {"aggressive": 0, "friendly": 1, "sexual": 0, "neutral": 0}
  },
  "setting": {
    "familiarity": "familiar",
    "location": "outdoors",
    "description": "parkta yürüyüş"
  },
  "successFailureRatio": {"success": 0, "failure": 0},
  "emotions": []
}

ÖNEMLİ:
- Eksik alan BIRAKMADAN, bu formata TAMAMEN uygun JSON döndür!
- location değeri SADECE "indoors", "outdoors" veya "mixed" olabilir (başka değer YASAK!)

Şimdi analiz et:`,
      isActive: true,
      language: "tr" as const,
    },
    userMainSummary: {
      id: "user-main-summary",
      name: "Kullanici Dostu Ozet",
      description: "Ana icgoru ciktisi icin sistem mesaji",
      content: `Sen sicak ama profesyonel bir ruya analistisin. Kullanici mesajinda gelecek DREAM_DATA blokunu kullanarak 3-4 paragraf uzunlugunda Markdown formatinda bir ana icgoru yazacaksin. Kullanici psikoloji egitimi almamis; kavramlari sade, empatik ve profesyonel bir tonda acikla.

Kurallar:
- Ruyanin baskin temasini ve duygusal tonunu yorumla.
- Gunluk yasam baglantilarini ve olasi icsel ihtiyaclari belirt.
- DREAM_DATA icindeki kantitatif veya bilimsel metrikleri varsa dogal sekilde cevaba yerlestir.
- Cevabin sonunda kisa bir guvenlik veya profesyonel destek uyarisi ekle.

Cevabini Turkce yaz. Madde isaretlerini yalnizca onemli noktalari vurgulamak icin kullan; genel anlatim akici paragraflar halinde olsun. DREAM_DATA disinda bilgi uydurma.`,
      isActive: true,
      language: "tr" as const,
    },
},
  en: {
    quantitativeAnalysis: {
      id: "quantitative-analysis",
      name: "Quantitative Analysis Prompt",
      description: "System message for Hall-Van de Castle based content analysis",
      content: `You are a dream content analyzer. Analyze the dream text and count ONLY what is explicitly mentioned.

Rules:
1. Characters: Only explicitly mentioned people ("talked with mother"=2 people, "museum guard"=1 person, "me and friend"=2 people)
2. Social interactions: REAL action between characters required
   - friendly: "we talked", "she smiled", "helped me", "went together" = friendly
   - aggressive: "he yelled", "we fought", "ran away" = aggressive
   - neutral: "I saw them", "met someone" (but no conversation) = neutral
   - NO social interaction without TWO characters!
3. Setting: location REQUIRED - EXACTLY one of: "indoors" (inside), "outdoors" (outside), "mixed" (both)

Dream: "{dreamText}"

EXAMPLE CORRECT COUNT:
"I walked in the park with my mother, then saw a dog" →
- characters: human=2 (me+mother), animal=1 (dog)
- social: friendly=1 ("walked"=together activity), total=1
- location: MUST BE "outdoors" (park = outside)

EXAMPLE WRONG COUNT:
"I was alone at home" →
- characters: human=1 (only me)
- social: total=0 (single character, no interaction)
- location: MUST BE "indoors" (home = inside)

JSON FORMAT (ALL FIELDS REQUIRED):
{
  "characterCount": 2,
  "characters": [{"type": "human", "count": 2}],
  "socialInteractions": {
    "total": 1,
    "types": {"aggressive": 0, "friendly": 1, "sexual": 0, "neutral": 0}
  },
  "setting": {
    "familiarity": "familiar",
    "location": "outdoors",
    "description": "walking in park"
  },
  "successFailureRatio": {"success": 0, "failure": 0},
  "emotions": []
}

IMPORTANT:
- Return COMPLETE JSON with NO missing fields!
- location value MUST BE ONLY "indoors", "outdoors", or "mixed" (no other value allowed!)

Now analyze:`,
      isActive: true,
      language: "en" as const,
    },
    userMainSummary: {
      id: "user-main-summary",
      name: "User Friendly Summary",
      description: "System message used for the headline dream insight",
      content: `You are a warm yet evidence-aware dream analyst. Use the DREAM_DATA block from the user message to craft a Markdown response of 3-4 concise paragraphs. The reader has no clinical background; explain concepts gently while staying professional.

Instructions:
- Interpret the dominant themes and emotional tone.
- Connect the dream to likely waking-life tensions or needs.
- Weave any quantitative or scientific metrics from DREAM_DATA naturally into the prose.
- End with a brief safety reminder or suggestion to seek professional help when appropriate.

Write the answer in English. Bullet lists should only appear if you are highlighting two or three actionable items; otherwise prefer flowing paragraphs. Do not invent details that are not present in DREAM_DATA.`,
      isActive: true,
      language: "en" as const,
    },
  },
}

const defaultSystemMessages: SystemMessagesConfig = systemMessagesByLanguage[BROWSER_DEFAULT_LANGUAGE]

const isBrowser = typeof window !== "undefined"

const memoryStore: { current?: SystemMessagesConfig } = {}

function ensureDefaults(): SystemMessagesConfig {
  if (isBrowser) {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSystemMessages))
        return clone(defaultSystemMessages)
      }
      const parsed = JSON.parse(stored) as SystemMessagesConfig
      return { ...defaultSystemMessages, ...parsed }
    } catch (error) {
      console.warn("Sistem mesajları yüklenemedi, varsayılan değerler kullanılacak:", error)
      return clone(defaultSystemMessages)
    }
  }

  if (!memoryStore.current) {
    memoryStore.current = clone(defaultSystemMessages)
  }
  return memoryStore.current
}

export function loadSystemMessages(): SystemMessagesConfig {
  return ensureDefaults()
}

export function loadSystemMessagesForLanguage(language: "tr" | "en"): SystemMessagesConfig {
  if (isBrowser) {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        const messages = systemMessagesByLanguage[language]
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
        return clone(messages)
      }
      const parsed = JSON.parse(stored) as SystemMessagesConfig
      // Check if current language matches stored language
      const firstMessage = Object.values(parsed)[0]
      if (firstMessage?.language === language) {
        return { ...systemMessagesByLanguage[language], ...parsed }
      } else {
        // Language changed, update to new language
        const newMessages = systemMessagesByLanguage[language]
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages))
        return clone(newMessages)
      }
    } catch (error) {
      console.warn("Sistem mesajları yüklenemedi, varsayılan değerler kullanılacak:", error)
      return clone(systemMessagesByLanguage[language])
    }
  }

  if (!memoryStore.current) {
    memoryStore.current = clone(systemMessagesByLanguage[language])
  }
  return memoryStore.current
}

export function saveSystemMessages(messages: SystemMessagesConfig): void {
  if (isBrowser) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  } else {
    memoryStore.current = { ...messages }
  }
}


export function getSystemMessageForLanguage(
  id: keyof SystemMessagesConfig, 
  language: "tr" | "en"
): SystemMessage | null {
  const messages = loadSystemMessagesForLanguage(language)
  return messages[id] ?? null
}

export function updateSystemMessage(
  id: keyof SystemMessagesConfig,
  updates: Partial<SystemMessage>
): void {
  const current = loadSystemMessages()
  if (!current[id]) {
    console.warn(`Sistem mesajı bulunamadı: ${String(id)}`)
    return
  }

  const updated: SystemMessagesConfig = {
    ...current,
    [id]: {
      ...current[id],
      ...updates,
    },
  }

  saveSystemMessages(updated)
}

export function updateSystemMessageForLanguage(
  id: keyof SystemMessagesConfig,
  language: "tr" | "en",
  updates: Partial<SystemMessage>
): void {
  const current = loadSystemMessagesForLanguage(language)
  if (!current[id]) {
    console.warn(`Sistem mesajı bulunamadı: ${String(id)}`)
    return
  }

  const updated: SystemMessagesConfig = {
    ...current,
    [id]: {
      ...current[id],
      ...updates,
    },
  }

  saveSystemMessages(updated)
}

export function resetSystemMessagesToDefault(): void {
  saveSystemMessages(clone(defaultSystemMessages))
}

export function resetSystemMessagesToDefaultForLanguage(language: "tr" | "en"): void {
  const messages = systemMessagesByLanguage[language]
  saveSystemMessages(clone(messages))
}

