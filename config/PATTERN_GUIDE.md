# 🌍 Yeni Dil Ekleme Rehberi

## Hızlı Başlangıç

### 1. Template Kopyala
```bash
cp config/patterns.template.json config/patterns.fr.json
```

### 2. İçeriği Düzenle
`config/patterns.fr.json` dosyasını aç ve şunları değiştir:

```json
{
  "bundleVersion": "1.0.0",
  "locale": "fr",  ← CHANGE_ME yerine dil kodu
  "patterns": [
    {
      "id": "fear",
      "category": "emotion",
      "regex": "peur\\w*|effrayé\\w*|terrifié\\w*",  ← FEAR_WORDS_HERE yerine regex
      "threshold": 0.1
    },
    {
      "id": "joy", 
      "category": "emotion",
      "regex": "heureux\\w*|joie\\w*|content\\w*",  ← JOY_WORDS_HERE yerine regex
      "threshold": 0.1
    },
    {
      "id": "anxiety",
      "category": "emotion", 
      "regex": "anxiété\\w*|inquiet\\w*|nerveux\\w*",  ← ANXIETY_WORDS_HERE yerine regex
      "threshold": 0.1
    }
  ]
}
```

### 3. Active Config'e Ekle
`config/active.json` dosyasını aç ve yeni dili ekle:

```json
{
  "availableLocales": ["tr", "en", "fr"],  ← fr ekle
  "defaultLocale": "tr"
}
```

### 4. Test Et
```bash
npm run validate-config
npm run list-languages
```

### 5. Restart
```bash
npm run dev
```

**Not:** `npm run dev` komutunu çalıştırmadan önce lütfen sistem mesajlarını kontrol edin.

## 📋 Örnekler

### İngilizce (patterns.en.json)
```json
{
  "bundleVersion": "1.0.0",
  "locale": "en",
  "patterns": [
    {
      "id": "fear",
      "category": "emotion",
      "regex": "fear\\w*|afraid\\w*|scared\\w*|terrified\\w*",
      "threshold": 0.1
    }
  ]
}
```

### Fransızca (patterns.fr.json)
```json
{
  "bundleVersion": "1.0.0", 
  "locale": "fr",
  "patterns": [
    {
      "id": "fear",
      "category": "emotion",
      "regex": "peur\\w*|effrayé\\w*|terrifié\\w*",
      "threshold": 0.1
    }
  ]
}
```

### Almanca (patterns.de.json)
```json
{
  "bundleVersion": "1.0.0",
  "locale": "de", 
  "patterns": [
    {
      "id": "fear",
      "category": "emotion",
      "regex": "angst\\w*|fürchten\\w*|erschrocken\\w*",
      "threshold": 0.1
    }
  ]
}
```

## ⚠️ Önemli Kurallar

### Regex Formatı
- ✅ `fear\\w*|afraid\\w*` (doğru)
- ❌ `fear|afraid` (kelime sınırları eksik)
- ❌ `fear*` (yanlış syntax)

### Dosya Adı Formatı
- ✅ `patterns.fr.json`
- ✅ `patterns.de.json`
- ❌ `patterns-french.json`
- ❌ `french-patterns.json`

### Locale Kodları
- ✅ `tr`, `en`, `fr`, `de`, `es`
- ❌ `turkish`, `english`, `french`

## 🔧 Komutlar

### Mevcut Dilleri Gör
```bash
npm run list-languages
```

### Validation Çalıştır
```bash
npm run validate-config
```

### Smoke Test
```bash
npm run test:smoke
```

**Not:** `test:smoke` komutu mevcut değilse, bunun yerine `npm run typecheck` kullanabilirsiniz.

## 🚨 Hata Durumları

### "Pattern file not found"
- Dosya adını kontrol et: `patterns.{locale}.json`
- `active.json`'da locale var mı kontrol et

### "Template placeholder found"
- `CHANGE_ME`, `FEAR_WORDS_HERE` gibi placeholder'ları değiştir
- Dosyayı tamamen doldur

### "Unsafe regex"
- ReDoS riski olan regex pattern'leri düzelt
- `safe-regex` kontrolünden geçmeli

### "Locale mismatch"
- Dosya adındaki locale ile içerideki locale aynı olmalı
- `patterns.fr.json` → `"locale": "fr"`

## 💡 İpuçları

### Regex Yazma
```javascript
// Kelime kökü + ekler
"fear\\w*"        // fear, fears, fearful, fearing
"afraid\\w*"      // afraid, afraids

// Alternatifler
"fear\\w*|afraid\\w*|scared\\w*"

// Türkçe için
"kork\\w*"        // kork, korku, korkuyor, korkmuyor
```

### Threshold Ayarlama
- `0.1` = Çok hassas (az eşleşme yeter)
- `0.5` = Orta hassas
- `1.0` = Az hassas (çok eşleşme gerekir)

### Pattern Kategorileri
- `emotion` = Duygular (fear, joy, anger)
- `character` = Karakterler (human, animal)
- `setting` = Mekanlar (indoor, outdoor)

## 🎯 Başarı Kontrolü

Yeni dil başarıyla eklendi mi kontrol et:

1. ✅ `npm run list-languages` → Yeni dil görünüyor
2. ✅ `npm run validate-config` → Hata yok
3. ✅ `npm run typecheck` → TypeScript hataları yok
4. ✅ UI'de dil seçenekleri görünüyor
5. ✅ Rüya analizi yeni dilde çalışıyor

**Hepsi ✅ ise başarılı!** 🎉
