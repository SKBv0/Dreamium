/**
 * NLP detectors for analysis consistency
 * Detects metamorphosis, validates quotes, and other text-based validations
 */

// Removed QuoteValidation-related imports (unused)

/**
 * Detect metamorphosis/impossible transformations in dream text
 * Patterns: "X Y'ye dönüştü", "X became Y", "turned into"
 */
export function detectMetamorphosis(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // Turkish patterns
  const turkishPatterns = [
    /(\w+)\s+(?:dönüştü|dönüşmek|dönüşüm)/g,
    /(\w+)\s+(?:oldu|olmak|haline\s+gel)/g,
    /(\w+)\s+(?:eridi|erimek|buharlaştı|buharlaşmak)/g,
    /(\w+)\s+(?:kayboldu|kaybolmak|yok\s+oldu)/g,
    /(\w+)\s+(?:değişti|değişmek|başkalaştı)/g
  ];
  
  // English patterns
  const englishPatterns = [
    /(\w+)\s+(?:became|turned\s+into|transformed\s+into)/g,
    /(\w+)\s+(?:melted|evaporated|disappeared)/g,
    /(\w+)\s+(?:changed|morphed|shifted)/g
  ];
  
  // Specific impossible transformations
  const impossibleTransformations = [
    'ibresine dönmek', 'saat ibresine dönüştü', 'lamba ibresine',
    'melted into', 'evaporated into', 'became nothing',
    'dönüştü yok', 'oldu hiç', 'kayboldu aniden'
  ];
  
  // Check for impossible transformations
  for (const transformation of impossibleTransformations) {
    if (lowerText.includes(transformation)) {
      return true;
    }
  }
  
  // Check patterns
  const allPatterns = [...turkishPatterns, ...englishPatterns];
  
  for (const pattern of allPatterns) {
    const matches = lowerText.match(pattern);
    if (matches && matches.length > 0) {
      // Check if any match involves impossible transformation
      for (const match of matches) {
        if (isImpossibleTransformation(match)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Check if a specific transformation is impossible
 */
function isImpossibleTransformation(transformation: string): boolean {
  const impossibleKeywords = [
    'ibresine', 'saat', 'lamba', 'melted', 'evaporated',
    'nothing', 'hiç', 'yok', 'aniden', 'birden'
  ];
  
  return impossibleKeywords.some(keyword => 
    transformation.toLowerCase().includes(keyword)
  );
}

/**
 * Extract and validate quotes from text
 * Check if quote exists verbatim in text
 */
// extractQuotes removed (unused)

/**
 * Calculate similarity between quote and text
 * Simple word-based similarity
 */
// calculateSimilarity removed (only used by extractQuotes)

/**
 * Detect if text contains dialogue/conversation
 * Used for social plausibility validation
 */
export function detectDialogue(text: string): boolean {
  const dialogueIndicators = [
    // Turkish
    /"[^"]*"/g, // quoted speech
    /'[^']*'/g, // single quoted speech
    /dedi|söyledi|konuştu|cevap\s+verdi/gi, // speech verbs
    /diye|dedi\s+ki|söyledi\s+ki/gi, // speech markers
    
    // English
    /said|told|asked|replied|answered/gi, // speech verbs
    /he\s+said|she\s+said|they\s+said/gi, // speech patterns
  ];
  
  return dialogueIndicators.some(pattern => pattern.test(text));
}

/**
 * Extract entities from text using simple patterns
 * Used for entity validation
 */
export function extractEntitiesFromText(text: string): {
  people: string[];
  animals: string[];
  places: string[];
  objects: string[];
  events: string[];
} {
  const lowerText = text.toLowerCase();
  
  // Simple keyword-based extraction
  const people = extractByKeywords(lowerText, [
    'anne', 'baba', 'kardeş', 'arkadaş', 'adam', 'kadın', 'çocuk',
    'mother', 'father', 'brother', 'friend', 'man', 'woman', 'child'
  ]);
  
  const animals = extractByKeywords(lowerText, [
    'at', 'ayı', 'köpek', 'kedi', 'kuş', 'balık', 'hayvan',
    'horse', 'bear', 'dog', 'cat', 'bird', 'fish', 'animal'
  ]);
  
  const places = extractByKeywords(lowerText, [
    'ev', 'okul', 'park', 'sokak', 'oda', 'bahçe', 'şehir',
    'house', 'school', 'park', 'street', 'room', 'garden', 'city'
  ]);
  
  const objects = extractByKeywords(lowerText, [
    'masa', 'kitap', 'telefon', 'araba', 'kapı', 'pencere',
    'table', 'book', 'phone', 'car', 'door', 'window'
  ]);
  
  const events = extractByKeywords(lowerText, [
    'yağmur', 'kar', 'güneş', 'rüzgar', 'fırtına', 'gök gürültüsü',
    'rain', 'snow', 'sun', 'wind', 'storm', 'thunder'
  ]);
  
  return { people, animals, places, objects, events };
}

/**
 * Extract words by keywords
 */
function extractByKeywords(text: string, keywords: string[]): string[] {
  const found: string[] = [];
  
  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      found.push(keyword);
    }
  }
  
  return found;
}

/**
 * Detect if text contains emotional content
 * Used for emotion validation
 */
export function detectEmotionalContent(text: string): boolean {
  const emotionalKeywords = [
    // Turkish
    'korku', 'korktu', 'korkuyor', 'korkunç',
    'üzüntü', 'üzüldü', 'üzgün', 'hüzün',
    'öfke', 'kızgın', 'sinir', 'hiddet',
    'mutlu', 'sevinç', 'neşe', 'heyecan',
    'aşk', 'sevgi', 'sevmek', 'romantik',
    
    // English
    'fear', 'afraid', 'scared', 'terrified',
    'sad', 'sadness', 'depressed', 'grief',
    'anger', 'angry', 'furious', 'rage',
    'happy', 'joy', 'excited', 'delighted',
    'love', 'loved', 'romantic', 'affection'
  ];
  
  const lowerText = text.toLowerCase();
  return emotionalKeywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Detect bizarreness indicators
 * Used for plausibility validation
 */
export function detectBizarreness(text: string): number {
  const lowerText = text.toLowerCase();
  let bizarrenessScore = 0;
  
  const bizarreIndicators = [
    // Impossible physics
    { pattern: /uçmak|uçuyor|uçtu/gi, weight: 20 },
    { pattern: /kaybolmak|kayboldu|yok\s+oldu/gi, weight: 15 },
    { pattern: /dönüşmek|dönüştü|başkalaştı/gi, weight: 25 },
    { pattern: /erimek|eridi|buharlaştı/gi, weight: 15 },
    
    // Time distortion
    { pattern: /zaman\s+atlamak|zaman\s+durdu|geçmişe\s+gitmek/gi, weight: 20 },
    { pattern: /geleceği\s+görmek|kehanet|kehanet/gi, weight: 15 },
    
    // Space distortion
    { pattern: /boyut\s+değiştirmek|paralel\s+evren/gi, weight: 25 },
    { pattern: /ışınlanmak|teleport/gi, weight: 20 },
    
    // Identity confusion
    { pattern: /başka\s+biri\s+olmak|kimlik\s+değiştirmek/gi, weight: 15 },
    { pattern: /ruh\s+değişimi|beden\s+değiştirmek/gi, weight: 20 }
  ];
  
  for (const indicator of bizarreIndicators) {
    const matches = lowerText.match(indicator.pattern);
    if (matches) {
      bizarrenessScore += matches.length * indicator.weight;
    }
  }
  
  // Cap at 100
  return Math.min(bizarrenessScore, 100);
}

