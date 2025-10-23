# Dreamium - Yapay Zeka Destekli Rüya Analiz Laboratuvarı
> **Language / Dil:** [English](./README.md) | [Türkçe](#)





**Yapay zekayı yerleşik psikolojik ve nörobilimsel araştırma çerçeveleriyle birleştiren, kanıta dayalı, çok dilli rüya analiz uygulaması.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

---
<div align="center">
  <img src="logo.png" alt="Dreamium Logo" width="50%" height="50%">
</div>



## İçindekiler
- [Genel Bakış](#genel-bakış)
- [Bilimsel Temel](#bilimsel-temel)
  - [Kantitatif Analiz (Hall-Van de Castle)](#1-kantitatif-analiz-hall-van-de-castle)
  - [REM Uyku Analizi](#2-rem-uyku-analizi)
  - [Süreklilik Hipotezi](#3-süreklilik-hipotezi)
  - [Demografik Normalizasyon](#4-demografik-normalizasyon)
  - [Tuhaflik Tespiti](#5-tuhaflık-tespiti)
  - [Psikolojik Çerçeveler](#6-psikolojik-çerçeveler)
  - [Önyargı Azaltma](#7-önyargı-azaltma)


---

## Genel Bakış

Dreamium, **bilimsel temelli rüya analizi** sunan bir Next.js 14 uygulamasıdır:
- **7 entegre analiz motoru** (kantitatif, REM, süreklilik, duygu, tuhaflik, psikolojik çerçeveler, önyargı azaltma)
- **Çok dilli destek** (Türkçe/İngilizce) ve kültürel adaptasyon
- **Demografik normalizasyon** (yaş, cinsiyet, kültürel geçmiş)
- **Kanıta dayalı müdahaleler** ve bilimsel referanslar
- **Gerçek zamanlı analiz** ve ilerleme takibi

> **⚠️ Öğrenme Projesi Uyarısı**: Bu proje, yalnızca öğrenme ve araştırma amaçlı geliştirilmiştir. İçerdiği kodlar ve analiz sonuçları, herhangi bir klinik veya bilimsel araştırma ortamında kullanılmadan önce mutlaka uzmanlar tarafından gözden geçirilmeli ve doğrulanmalıdır. Bu çalışma, rüya analiz tekniklerinin bir gösterimi niteliğindedir ve üretim düzeyinde bir klinik araç olarak değerlendirilmemelidir.
> 
> **📚 Referans Notu**: Proje, mevcut rüya araştırma metodolojilerini temel almakta olup, atıfta bulunulan tüm bilimsel kaynakların akademik veya klinik kullanımdan önce doğruluğu ve güncelliği bağımsız biçimde teyit edilmelidir.
Her ne kadar hedefim bilime uygun bir proje geliştirmek olsa da, bir bilim insanı değilim; dolayısıyla proje sonuçları uzman denetimi olmadan nihai veya kesin olarak kabul edilmemelidir.

---

## Bilimsel Temel

### 1. Kantitatif Analiz (Hall-Van de Castle)

**Uygulama**: [`lib/quantitative-analysis.ts`](lib/quantitative-analysis.ts)

Rüya içerik analizinde altın standart olan **Hall-Van de Castle (HVdC) kodlama sistemine** (Hall & Van de Castle, 1966) dayanır.

#### **Metodoloji**:
```typescript
interface HallVdCMetrics {
  characters: {
    total: number;
    male: number;
    female: number;
    familiar: number;
    unfamiliar: number;
  };
  socialInteractions: {
    friendly: number;    // Konuşma, sarılma, yardım etme
    aggressive: number;  // Kavga, tartışma, tehdit
    sexual: number;      // Öpüşme, romantik temas
  };
  emotions: {
    positive: number;
    negative: number;
    neutral: number;
  };
  settings: {
    indoor: number;
    outdoor: number;
    familiar: number;
    unfamiliar: number;
  };
}
```

#### **Tespit Mantığı**:
- **Karakter Tespiti**: İnsan referansları, cinsiyet belirteçleri, yaş göstergeleri için desen eşleştirme
- **Sosyal Etkileşimler**:
  - **Dostça**: Konuşma, yardım etme, sarılma, gülümseme, hayvan iletişimi, öğretme eylemleri
  - **Saldırgan**: Kavga, tartışma, tehdit, saldırı
  - **Cinsel**: Öpüşme, kucaklaşma, romantik ilişkiler
- **Ortam Tespiti**: İç mekan (ev, oda, bina) vs. Dış mekan (park, orman, sokak)

---

### 2. REM Uyku Analizi

**Uygulama**: [`lib/rem-sleep-analysis.ts`](lib/rem-sleep-analysis.ts)

Nörobiyolojik uyku araştırmalarına dayanarak uyku evresini (REM/NREM) tahmin eder.

#### **Metodoloji**:
```typescript
interface REMSleepMetrics {
  estimatedSleepStage: 'REM' | 'NREM' | 'unknown';
  dreamVividness: number;        // 0-100 (duyusal zenginlik + tuhaflik)
  emotionalIntensity: number;    // 0-100
  bizarrenessScore: number;      // 0-100 (semantik anomaliler)
  narrativeCoherence: number;    // 0-100
  memoryIncorporation: number;   // 0-100
  temporalDistortion: number;    // 0-100
}
```

#### **REM vs. NREM Sınıflandırması**:

| Özellik | REM Rüyaları | NREM Rüyaları |
|---------|--------------|---------------|
| **Canlılık** | Yüksek (70-100%) | Düşük (20-50%) |
| **Tuhaflik** | Yüksek (50-100%) | Düşük (0-30%) |
| **Duygu** | Yoğun | Hafif |
| **Anlatı** | Karmaşık | Basit |
| **Uzunluk** | Uzun (>100 kelime) | Kısa (<50 kelime) |

**Sınıflandırma Formülü**:
```typescript
const remScore = (canlılık * 0.3) + (tuhaflik * 0.4) + (duygusalYoğunluk * 0.2) + (uzunluk * 0.1)
// remScore > 60 ise REM, remScore < 40 ise NREM, aksi halde bilinmeyen
```

#### **Sirkadiyen Analiz**:
- **Gece erken (21:00-01:00)**: %30 REM olasılığı
- **Gece ortası (01:00-04:00)**: %50 REM olasılığı
- **Gece geç (04:00-07:00)**: %70 REM olasılığı (en uzun REM periyotları)

---

### 3. Süreklilik Hipotezi

**Uygulama**: [`lib/continuity-hypothesis.ts`](lib/continuity-hypothesis.ts)

**Domhoff'un Süreklilik Hipotezini** (1996) test eder: Rüyalar, uyanık yaşamdaki endişeleri, ilişkileri ve deneyimleri yansıtır.

#### **Metodoloji**:
```typescript
interface ContinuityAnalysisResult {
  continuityScore: number; // 0-100 (rüyanın uyanık yaşamı ne kadar yansıttığı)
  wakingLifeConnections: {
    personalConcerns: string[];    // İş, aile, sağlık, para
    recentExperiences: string[];   // Seyahat, olaylar, konuşmalar
    ongoingStressors: string[];    // Son tarihler, çatışmalar, sorunlar
    socialRelationships: string[]; // Arkadaşlar, aile, meslektaşlar
  };
  continuityTypes: {
    thematic: number;    // Tema sürekliliği (iş→iş)
    emotional: number;   // Duygu sürekliliği (stres→kaygı)
    social: number;      // Karakter sürekliliği (gerçek insanlar)
    cognitive: number;   // Problem sürekliliği (uyanık problem→rüya)
  };
}
```

#### **Tespit Kategorileri**:
- **İş endişeleri**: İş, patron, maaş, toplantı, proje, son tarih, işyeri
- **Aile endişeleri**: Anne, baba, eş, çocuk, aile, evlilik, ev
- **Sağlık endişeleri**: Hasta, doktor, hastane, ağrı, ilaç, tedavi
- **Finansal endişeler**: Para, borç, harcama, maaş, ödeme, fatura

#### **Süreklilik Skoru Formülü**:
```typescript
continuityScore = (
  (tematikSüreklilik * 0.4) +
  (duygusalSüreklilik * 0.3) +
  (sosyalSüreklilik * 0.2) +
  (gerçeklikTesti * 0.1)
)
```

---

### 4. Demografik Normalizasyon

**Uygulama**: [`lib/bias-mitigation.ts`](lib/bias-mitigation.ts), [`components/DemographicsForm.tsx`](components/DemographicsForm.tsx)

Algoritmik önyargıyı azaltmak için analiz sonuçlarını demografik faktörlere göre normalize eder.

#### **Toplanan Demografik Bilgiler**:
```typescript
interface Demographics {
  age: number;                     // 20-70
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  culturalBackground: 'turkish' | 'western' | 'eastern' | 'mixed' | 'other';
  educationLevel: 'elementary' | 'secondary' | 'university' | 'graduate';
  sleepQuality: 'poor' | 'fair' | 'good' | 'excellent';
  stressLevel: 'low' | 'moderate' | 'high';
}
```

#### **Normalizasyon Stratejisi**:

**1. Cinsiyet Normalizasyonu**:
- **Erkek**: Duygusal tema tespitini artır (+%15 güven)
- **Kadın**: Teknik tema tespitini artır (+%20 güven)
- **Hedef**: Rüya yorumundaki cinsiyet kalıpyargılarına karşı koymak

**2. Yaş Normalizasyonu**:
- **Genç yetişkinler (<30)**: Geleneksel temaları artır (+%15)
- **Yaşlı yetişkinler (>50)**: Teknoloji temalarını artır (+%10)
- **Hedef**: Yaşçı varsayımlardan kaçınmak

**3. Kültürel Normalizasyon**:
- **Türk/Doğulu**: Aile/kolektif temaları artır (+%20)
- **Batılı**: Bireycilik temalarını normalize et (-%10)
- **Hedef**: Kolektivist vs. bireyci kültürel değerlere saygı göstermek

#### **Gizlilik Notu**: Tüm demografik veriler **yalnızca tarayıcı localStorage'ında yerel olarak** saklanır. Harici sunuculara veri gönderilmez.

---

### 5. Tuhaflık Tespiti

**Uygulama**: [`lib/analysis/nlp/bizarreness-detector.ts`](lib/analysis/nlp/bizarreness-detector.ts)

**5 kategorili semantik analiz** kullanarak rüya anlatılarındaki semantik anomalileri tespit eder.

#### **Tuhaflık Kategorileri**:

```typescript
interface BizarrenessAnalysis {
  totalScore: number; // 0-100
  categories: {
    physical: number;      // 0-100 (uçma, duvardan geçme)
    cognitive: number;     // 0-100 (telepati, her şeyi bilme)
    metamorphosis: number; // 0-100 (insan→hayvan, nesne→insan)
    spaceTime: number;     // 0-100 (zaman döngüleri, ışınlanma)
    identity: number;      // 0-100 (yüz değişimi, yaş değişimi)
  };
  detectedPatterns: Array<{
    category: string;
    description: string;
    severity: number;
  }>;
}
```

#### **Puanlama Sistemi**:
- Her tespit edilen desen **8-18 puan** ekler (ciddiyete göre)
- **Toplam skor** = Tüm desen puanlarının toplamı (maksimum 100)
- **REM göstergesi**: Tuhaflık > %50 güçlü bir şekilde REM uykusunu işaret eder

---

### 6. Psikolojik Çerçeveler

**Uygulama**: [`lib/advanced-dream-analysis.ts`](lib/advanced-dream-analysis.ts)

**4 ana teorik perspektif** kullanarak çok çerçeveli psikolojik yorumlama sağlar.

#### **Çerçeveler**:

**1. Jungcu Analiz**:
```typescript
interface JungianAnalysis {
  dominant_archetypes: string[];     // Gölge, Benlik, Anima/Animus, Yaşlı Bilge, Kahraman
  archetypal_conflicts: string[];
  individuation_stage: string;
}
```

**2. Freudyen Analiz**:
```typescript
interface FreudianAnalysis {
  repressed_content: string[];
  sexual_symbolism: string[];
  defense_mechanisms: string[];
  unconscious_desires: string[];
}
```

**3. Adleryen Analiz**:
```typescript
interface AdlerianAnalysis {
  power_dynamics: string[];
  inferiority_feelings: string[];
  striving_for_superiority: string[];
  social_interest: string[];
}
```

**4. Gestalt Analizi**:
```typescript
interface GestaltAnalysis {
  disowned_parts: string[];
  unfinished_business: string[];
  integration_suggestions: string[];
}
```

---

### 7. Önyargı Azaltma

**Uygulama**: [`lib/bias-mitigation.ts`](lib/bias-mitigation.ts)

Algoritmik önyargı tespit ve düzeltme sistemi.

#### **Azaltma Stratejileri**:
- **Cinsiyet düzeltmeleri**: Kalıpyargılara karşı tema ağırlıklarını ayarla
- **Yaş düzeltmeleri**: Teknoloji/gelenek tema dengesini normalize et
- **Kültürel düzeltmeler**: Aile/birey tema vurgusunu ayarla
- **Güven cezası**: Önyargı tespit edildiğinde güven skorunu %10 azalt (maksimum %75)

---

## Mimari

### Analiz Yöntemleri

Dreamium, optimal performans, doğruluk ve maliyet verimliliği için **hibrit analiz yaklaşımı** kullanır:

#### 🤖 Yapay Zeka Destekli Analizler 

1. **Kantitatif Analiz** ([`lib/quantitative-analysis.ts`](lib/quantitative-analysis.ts))
   - Karmaşık Hall-Van de Castle içerik kodlaması için yapay zeka kullanır
   - **Neden AI?** Karakter tanımlama ve sosyal etkileşim sınıflandırması semantik anlama gerektirir

2. **Kullanıcı Özet Üretimi** ([`lib/user-friendly-summary.ts`](lib/user-friendly-summary.ts))
   - İnsan dostu psikolojik içgörüler üretir
   - **Neden AI?** Doğal dil üretimi ve empatik iletişim

**Yapılandırma**: Her iki analiz de Ayarlar → Sistem Mesajları'nda özelleştirilebilir sistem istemleri kullanır

#### ⚡ Kural Tabanlı Analizler 

1. **Duygu Analizi** ([`lib/emotion-analysis.ts`](lib/emotion-analysis.ts))
   - Duygu anahtar kelimesi tespiti için `affect_lexicon.json` kullanır
   - **Neden kural tabanlı?** Duygu anahtar kelimeleri iyi tanımlanmış; sözlük araması anlık ve doğru

2. **REM Uyku Analizi** ([`lib/rem-sleep-analysis.ts`](lib/rem-sleep-analysis.ts))
   - Uyku araştırmasından nörobiyolojik formüller uygular
   - **Neden kural tabanlı?** Bilimsel formüller deterministik; hesaplama için yapay zeka gerekmez

3. **Süreklilik Hipotezi** ([`lib/continuity-hypothesis.ts`](lib/continuity-hypothesis.ts))
   - Uyanık yaşam temaları için desen eşleştirme (iş, aile, sağlık, vb.)
   - **Neden kural tabanlı?** Anahtar kelimelerle tema tespiti hızlı ve yeterli

---

## Teknoloji Yığını

### Çekirdek
- **Next.js 14** (App Router) - React framework
- **TypeScript 5.0** (strict mode) - Tip güvenliği
- **React 18** - UI kütüphanesi

### UI
- **Tailwind CSS** - Utility-first stil
- **Radix UI** - Erişilebilir bileşen temel öğeleri
- **Framer Motion** - Animasyonlar
- **Recharts** - Veri görselleştirme

### Yapay Zeka Entegrasyonu (Opsiyonel)
- **Ollama** - Kendi sunucunuzda modeller (önerilen, API anahtarı gerektirmez)
- **OpenRouter API** - Çoklu model erişimi (opsiyonel, ayarlardan yapılandırılır)

---

## Başlangıç

### Ön Gereksinimler
- Node.js 18+ ve npm

### Kurulum

1. **Depoyu klonlayın**:
   ```bash
   git clone https://github.com/SKBv0/dreamium.git
   cd dreamium
   ```

2. **Bağımlılıkları yükleyin**:
   ```bash
   npm install
   ```

3. **Ortam dosyası oluşturun**:
   ```bash
   cp .env.example .env.local
   ```



4. **Geliştirme sunucusunu çalıştırın**:
   ```bash
   npm run dev
   ```

   [http://localhost:9059](http://localhost:9059) adresini açın

### Kullanılabilir Komutlar

```bash
npm run dev              # Geliştirme sunucusunu başlat (port 9059)
npm run build            # Üretim derlemesi oluştur
npm run start            # Üretim sunucusunu çalıştır
npm run lint             # ESLint çalıştır
npm run typecheck        # TypeScript kontrolü
npm run clean            # .next ve önbelleği temizle
npm run rebuild          # Temizle + derle
npm run validate-config  # Desen yapılandırmalarını doğrula
```

---

## Proje Yapısı

```
dreamium/
├── app/                          # Next.js App Router
│   ├── api/                      # API uç noktaları
│   │   ├── analyze/              # Ana analiz uç noktası
│   │   ├── ai/generate/          # Yapay zeka özet üretimi
│   │   ├── history/              # Analiz geçmişi CRUD
│   │   └── keys/                 # API anahtar yönetimi
│   ├── page.tsx                  # Ana sayfa
│   └── layout.tsx                # Kök düzen
│
├── components/                   # React bileşenleri
│   ├── ui/                       # Radix UI temel öğeleri
│   ├── page/                     # Sayfaya özel bileşenler
│   └── DemographicsForm.tsx      # 6 adımlı demografik form
│
├── lib/                          # Çekirdek analiz motorları
│   ├── analysis/                 # NLP analiz modülleri
│   ├── quantitative-analysis.ts  # Hall-Van de Castle
│   ├── rem-sleep-analysis.ts     # REM/NREM sınıflandırması
│   ├── continuity-hypothesis.ts  # Domhoff'un sürekliliği
│   ├── emotion-analysis.ts       # Duygu tespiti
│   ├── bias-mitigation.ts        # Demografik normalizasyon
│   └── translations.ts           # i18n dizileri (TR/EN)
│
├── config/                       # Yapılandırma dosyaları
│   ├── patterns.tr.json          # Türkçe desenler
│   ├── patterns.en.json          # İngilizce desenler
│   └── active.json               # Aktif yerel ayar
│
└── .data/                        # Kullanıcı verileri (gitignored)
    ├── analysis_history/         # Tarihsel analizler
    └── analysis_log.json         # En son analiz
```

---

## Sorumluluk Reddi

- Sonuçlar **keşifsel hipotezlerdir**, klinik tanı değildir
- Kullanıcı yorumu ve bağlamsal anlayış gerektirir
- Kültürel ve bireysel farklılıklar dikkate alınmalıdır
- Önyargı azaltma, algoritmik önyargıyı azaltır ancak tamamen ortadan kaldıramaz


---

## Lisans

Dreamium, **MIT Lisansı** altında yayınlanmıştır.

```
MIT License

Copyright (c) 2025 Dreamium Katkıda Bulunanlar

İzin verilir, ücretsiz olarak, bu yazılımın ve ilgili dokümantasyon 
dosyalarının ("Yazılım") bir kopyasını alan herhangi bir kişiye, 
Yazılımı kısıtlama olmaksızın kullanma hakkı verilir...
```

---

## Teşekkürler

**Araştırma Temelleri**:
- Hall & Van de Castle (1966) - Kantitatif rüya içerik analizi
- Domhoff (1996-2018) - Süreklilik hipotezi ve rüya nörobilimi
- Hobson & McCarley (1977) - Aktivasyon-sentez hipotezi
- Nielsen (2000) - REM/NREM zihinsel aktivite farklılıkları
- Revonsuo (2000) - Rüyaların evrimsel işlevi

