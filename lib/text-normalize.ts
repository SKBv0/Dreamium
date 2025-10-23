// Best-effort fixer for common UTF-8 → Latin-1 mojibake seen in Turkish text.
// It maps frequent mis-encodings (e.g., "Ã§" → "ç", "Ä±" → "ı") and removes stray "Â".
export function fixTurkishMojibake(input?: string | null): string {
  if (input == null) return ''
  let s = String(input)

  // Quick return if it already contains proper Turkish letters and no obvious mojibake.
  const hasTR = /[ğĞşŞıİöÖçÇüÜ]/.test(s)
  const hasMoji = /(Ã|Ä|Å|Â|â|�|Ǭ)/.test(s)
  if (hasTR && !hasMoji) return s

  // Known 2-byte/3-byte mojibake maps
  const replacements: Array<[RegExp, string | ((m: string) => string)]> = [
    [/Ã§/g, 'ç'], [/Ã‡/g, 'Ç'],
    [/Ã¶/g, 'ö'], [/Ã–/g, 'Ö'],
    [/Ã¼/g, 'ü'], [/Ãœ/g, 'Ü'],
    [/ÄŸ/gi, () => 'ğ'],
    [/Äž/g, 'Ğ'],
    [/Ä±/g, 'ı'], [/Ä°/g, 'İ'],
    [/ÅŸ/gi, () => 'ş'],
    [/Åž/g, 'Ş'],
    // Fancy punctuation
    [/â/g, '’'], [/â/g, '‘'],
    [/â/g, '“'], [/â/g, '”'],
    [/â/g, '–'], [/â/g, '—'],
    [/â¦/g, '…'],
    // Stray control from copy/paste
    [/Â/g, ''],
    // Rare stray char seen in repo
    [/Ǭ/g, 'ü'],
    [/�/g, ''],
  ]

  for (const [pattern, repl] of replacements) {
    // @ts-expect-error - allow function or string replacement
    s = s.replace(pattern, repl)
  }

  // As a last resort, try decodeURIComponent escape trick; accept only if it looks better.
  try {
    // escape is deprecated but needed for legacy encoding recovery
    const trial = decodeURIComponent(escape(s))
    if (trial && looksMoreTurkish(trial, s)) s = trial
  } catch {}

  return s
}

function looksMoreTurkish(candidate: string, original: string): boolean {
  const score = (t: string) => (t.match(/[ğĞşŞıİöÖçÇüÜ]/g) || []).length - (t.match(/[ÃÄÅÂ�]/g) || []).length
  return score(candidate) > score(original)
}

