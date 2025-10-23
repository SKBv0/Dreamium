/**
 * Multilingual Quantitative Analysis Normalizer
 */

// TYPE DEFINITIONS

export type Location = 'indoors' | 'outdoors' | 'mixed';
export type Familiarity = 'familiar' | 'unfamiliar' | 'mixed';
export type CharacterType = 'human' | 'animal' | 'other';
export type InteractionType = 'aggressive' | 'friendly' | 'sexual' | 'neutral';

// TRANSLATION MAPS

/**
 * Location translations (indoors/outdoors/mixed)
 * Add new languages by adding key-value pairs
 */
const LOCATION_MAP: Record<string, Location> = {
  // English
  'indoors': 'indoors',
  'indoor': 'indoors',
  'inside': 'indoors',
  'interior': 'indoors',
  'outdoors': 'outdoors',
  'outdoor': 'outdoors',
  'outside': 'outdoors',
  'exterior': 'outdoors',
  'mixed': 'mixed',
  'both': 'mixed',
  'combination': 'mixed',

  // Turkish
  'iç mekan': 'indoors',
  'içmekan': 'indoors',
  'içeri': 'indoors',
  'içerisi': 'indoors',
  'kapalı': 'indoors',
  'kapalı alan': 'indoors',
  'dış mekan': 'outdoors',
  'dışmekan': 'outdoors',
  'dışarı': 'outdoors',
  'dışarısı': 'outdoors',
  'açık': 'outdoors',
  'açık alan': 'outdoors',
  'karışık': 'mixed',
  'karma': 'mixed',
  'hem içeri hem dışarı': 'mixed',

  // Future: Add Spanish, French, German, etc.
  // 'dentro': 'indoors',
  // 'fuera': 'outdoors',
  // 'mixto': 'mixed',
};

/**
 * Familiarity translations (familiar/unfamiliar/mixed)
 */
const FAMILIARITY_MAP: Record<string, Familiarity> = {
  // English
  'familiar': 'familiar',
  'known': 'familiar',
  'recognized': 'familiar',
  'unfamiliar': 'unfamiliar',
  'unknown': 'unfamiliar',
  'strange': 'unfamiliar',
  'foreign': 'unfamiliar',
  'mixed': 'mixed',
  'both': 'mixed',

  // Turkish
  'tanıdık': 'familiar',
  'bilinen': 'familiar',
  'tanınmış': 'familiar',
  'aşina': 'familiar',
  'bildik': 'familiar',
  'yabancı': 'unfamiliar',
  'bilinmeyen': 'unfamiliar',
  'tanınmayan': 'unfamiliar',
  'tuhaf': 'unfamiliar',
  'garip': 'unfamiliar',
  'karışık': 'mixed',
  'karma': 'mixed',
  'hem tanıdık hem yabancı': 'mixed',
};

/**
 * Character type translations (human/animal/other)
 */
const CHARACTER_TYPE_MAP: Record<string, CharacterType> = {
  // English
  'human': 'human',
  'person': 'human',
  'people': 'human',
  'man': 'human',
  'woman': 'human',
  'child': 'human',
  'adult': 'human',
  'animal': 'animal',
  'creature': 'animal',
  'beast': 'animal',
  'other': 'other',
  'entity': 'other',
  'being': 'other',
  'object': 'other',

  // Turkish
  'insan': 'human',
  'kişi': 'human',
  'adam': 'human',
  'kadın': 'human',
  'çocuk': 'human',
  'yetişkin': 'human',
  'erkek': 'human',
  'bayan': 'human',
  'hayvan': 'animal',
  'canlı': 'animal',
  'yaratık': 'animal',
  'diğer': 'other',
  'diÃ„Å¸er': 'other', // UTF-8 encoding issue fallback
  'varlık': 'other',
  'nesne': 'other',
  'şey': 'other',
};

/**
 * Interaction type translations (aggressive/friendly/sexual/neutral)
 */
const INTERACTION_TYPE_MAP: Record<string, InteractionType> = {
  // English
  'aggressive': 'aggressive',
  'hostile': 'aggressive',
  'violent': 'aggressive',
  'attacking': 'aggressive',
  'friendly': 'friendly',
  'kind': 'friendly',
  'helpful': 'friendly',
  'cooperative': 'friendly',
  'sexual': 'sexual',
  'romantic': 'sexual',
  'intimate': 'sexual',
  'neutral': 'neutral',
  'indifferent': 'neutral',
  'passive': 'neutral',

  // Turkish
  'agresif': 'aggressive',
  'saldırgan': 'aggressive',
  'düşmanca': 'aggressive',
  'şiddetli': 'aggressive',
  'arkadaşça': 'friendly',
  'dostça': 'friendly',
  'dostane': 'friendly',
  'samimi': 'friendly',
  'yardımcı': 'friendly',
  'cinsel': 'sexual',
  'seksüel': 'sexual',
  'romantik': 'sexual',
  'yakın': 'sexual',
  'nötr': 'neutral',
  'tarafsız': 'neutral',
  'ilgisiz': 'neutral',
};

// NORMALIZATION FUNCTIONS

/**
 * Normalize location value to English enum
 */
export function normalizeLocation(value: string | undefined | null): Location {
  if (!value) return 'mixed';

  const normalized = value.toLowerCase().trim();
  return LOCATION_MAP[normalized] || fuzzyMatch(normalized, LOCATION_MAP) || 'mixed';
}

/**
 * Normalize familiarity value to English enum
 */
export function normalizeFamiliarity(value: string | undefined | null): Familiarity {
  if (!value) return 'mixed';

  const normalized = value.toLowerCase().trim();
  return FAMILIARITY_MAP[normalized] || fuzzyMatch(normalized, FAMILIARITY_MAP) || 'mixed';
}

/**
 * Normalize character type to English enum
 */
export function normalizeCharacterType(value: string | undefined | null): CharacterType {
  if (!value) return 'other';

  const normalized = value.toLowerCase().trim();
  return CHARACTER_TYPE_MAP[normalized] || fuzzyMatch(normalized, CHARACTER_TYPE_MAP) || 'other';
}

/**
 * Normalize interaction type to English enum
 */
export function normalizeInteractionType(value: string | undefined | null): InteractionType {
  if (!value) return 'neutral';

  const normalized = value.toLowerCase().trim();
  return INTERACTION_TYPE_MAP[normalized] || fuzzyMatch(normalized, INTERACTION_TYPE_MAP) || 'neutral';
}

/**
 * Main normalizer: Converts entire quantitative response to English schema format
 */
export function normalizeQuantitativeResponse(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;

  const normalized = { ...raw };

  // Normalize setting.location
  if (normalized.setting?.location) {
    normalized.setting.location = normalizeLocation(normalized.setting.location);
  }

  // Normalize setting.familiarity
  if (normalized.setting?.familiarity) {
    normalized.setting.familiarity = normalizeFamiliarity(normalized.setting.familiarity);
  }

  // Normalize character types
  if (Array.isArray(normalized.characters)) {
    normalized.characters = normalized.characters.map((char: any) => ({
      ...char,
      type: normalizeCharacterType(char.type)
    }));
  }

  // Normalize emotion types (if they have language-specific names)
  if (Array.isArray(normalized.emotions)) {
    normalized.emotions = normalized.emotions.map((emotion: any) => ({
      ...emotion,
      // Emotion types are already handled by emotion-analysis.ts
      // Just pass through
    }));
  }

  return normalized;
}

// FUZZY MATCHING UTILITIES

/**
 * Fuzzy match for typos and close variations
 * Uses Levenshtein distance with threshold of 2
 */
function fuzzyMatch<T extends string>(
  input: string,
  map: Record<string, T>
): T | null {
  const normalized = input.toLowerCase().trim();

  // Try exact match first (already done in caller, but safe)
  if (map[normalized]) return map[normalized];

  // Try fuzzy match with Levenshtein distance <= 2
  let bestMatch: { key: string; value: T; distance: number } | null = null;

  for (const [key, value] of Object.entries(map)) {
    const distance = levenshteinDistance(normalized, key);

    if (distance <= 2) {
      if (!bestMatch || distance < bestMatch.distance) {
        bestMatch = { key, value: value as T, distance };
      }
    }
  }

  return bestMatch?.value || null;
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching with typos
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix using dynamic programming
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// EXPORTS

export default {
  normalizeLocation,
  normalizeFamiliarity,
  normalizeCharacterType,
  normalizeInteractionType,
  normalizeQuantitativeResponse,
};
