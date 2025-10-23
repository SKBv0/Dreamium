/**
 * Emotion Label Formatter
 *
 * Fixes spacing issues in emotion labels that come from AI
 * with concatenated words (e.g., "huşukorkusu" → "huşu korkusu")
 */

export function formatEmotionLabel(tag: string): string {
  const fixes: Record<string, string> = {
    // Common concatenations (case-insensitive matching)
    'huşukorkusu': 'huşu korkusu',
    'varoluşsalkaygı': 'varoluşsal kaygı',
    'huşuKorkusu': 'huşu korkusu',
    'varoluşsalKaygı': 'varoluşsal kaygı',
    'HuşuKorkusu': 'huşu korkusu',
    'VaroluşsalKaygı': 'varoluşsal kaygı',
    // Additional common concatenations
    'üzüntükaygı': 'üzüntü kaygı',
    'öfkekorku': 'öfke korku',
    'sevinçheyecan': 'sevinç heyecan',
    'mutluluksevinç': 'mutluluk sevinç',
    'korkuanksiyete': 'korku anksiyete',
  };

  // Return fixed version if exists (case-insensitive), otherwise return original
  const lowerTag = tag.toLowerCase();
  const fixed = Object.keys(fixes).find(key => key.toLowerCase() === lowerTag);
  return fixed ? fixes[fixed] : tag;
}

/**
 * Format cognitive function label with proper spacing
 * (currently not needed as source labels are already correct,
 * but kept for future use if needed)
 */
export function formatCognitiveFunctionLabel(label: string): string {
  // Recharts might concatenate during rendering, so we keep this
  // for potential future use
  return label;
}
