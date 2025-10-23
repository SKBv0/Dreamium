/**
 * Storage Migration V1 → V2
 * Migrates localStorage dream analysis records to new schema format
 */

import { logger } from '@/lib/logger'
import { StorageKeys } from '@/lib/storage'
import type { DreamAnalysisResult } from '@/lib/types'
import type { AnalysisBundle } from '@/lib/analysis/types'

export interface V1Record {
  dreamText?: string
  text?: string
  timestamp?: number
  ts?: number
  analysis?: any
  results?: any
}

export interface V2Record {
  schema: 2
  id: string
  lang: 'tr' | 'en'
  createdAt: string
  dreamText: string
  analysis: AnalysisBundle | DreamAnalysisResult
  version: string
  migrated?: boolean
}

export interface MigrationResult {
  migrated: number
  failed: number
  skipped: number
  duration: number
}

/**
 * Estimate total localStorage size in bytes
 */
function estimateStorageSize(): number {
  try {
    let total = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const value = localStorage.getItem(key) || ''
        total += key.length + value.length
      }
    }
    return total * 2 // UTF-16 = 2 bytes per char
  } catch {
    return 0
  }
}

/**
 * Get timestamp from V1 record
 */
function getTimestamp(record: V1Record): number {
  return record.timestamp || record.ts || Date.now()
}

/**
 * Get timestamp from localStorage key (fallback)
 */
function getTimestampFromKey(key: string): number {
  try {
    const match = key.match(/analysis_(\d+)/)
    if (match) return parseInt(match[1])
  } catch {}
  return 0
}

/**
 * Detect language from text
 */
function detectLanguage(text: string): 'tr' | 'en' {
  if (!text) return 'tr' // default

  const turkishChars = /[çğıöşüÇĞİÖŞÜ]/
  const turkishWords = ['ve', 'bir', 'bu', 'için', 'ile', 'ben', 'sen', 'rüya', 'gördüm', 'idi']

  // Check for Turkish characters
  if (turkishChars.test(text)) return 'tr'

  // Check for Turkish words
  const words = text.toLowerCase().split(/\s+/).slice(0, 50) // first 50 words
  const turkishWordCount = words.filter(w => turkishWords.includes(w)).length

  return turkishWordCount >= 2 ? 'tr' : 'en'
}

/**
 * Prune old records to free up space
 * Keeps only the most recent N records
 */
async function pruneOldRecords(keepCount: number): Promise<number> {
  try {
    const keys = Object.keys(localStorage)
      .filter(k => k.startsWith(StorageKeys.HISTORY))

    if (keys.length <= keepCount) return 0

    // Sort by timestamp (newest first)
    const sorted = keys.sort((a, b) => {
      try {
        const aRecord = JSON.parse(localStorage.getItem(a) || '{}') as V1Record
        const bRecord = JSON.parse(localStorage.getItem(b) || '{}') as V1Record
        return getTimestamp(bRecord) - getTimestamp(aRecord)
      } catch {
        return getTimestampFromKey(b) - getTimestampFromKey(a)
      }
    })

    // Remove old records
    const toRemove = sorted.slice(keepCount)
    toRemove.forEach(key => {
      try {
        localStorage.removeItem(key)
      } catch (err) {
        logger.warn('Failed to remove old record:', key, err)
      }
    })

    logger.info(`Pruned ${toRemove.length} old records, kept ${keepCount}`)
    return toRemove.length
  } catch (err) {
    logger.error('Failed to prune old records:', err)
    return 0
  }
}

/**
 * Create empty AnalysisBundle
 */
function createEmptyBundle(text: string, lang: 'tr' | 'en'): AnalysisBundle {
  return {
    emotions: {
      pos: 0,
      neg: 0,
      neu: 100,
      labels: [],
      confidence: 0,
      tone: 'neutral'
    },
    entities: {
      people: [],
      animals: [],
      places: [],
      objects: [],
      events: []
    },
    sleep: {
      stage: 'unknown',
      confidence: 0,
      vividness: 50,
      emotionalIntensity: 50,
      bizarrenessScore: 50,
      narrativeCoherence: 50
    },
    plausibility: {
      logical: 50,
      physical: 50,
      social: 50,
      bizarreness: 50,
      overall: 50
    },
    continuity: {
      thematic: 0,
      emotional: 0,
      social: 0,
      cognitive: 0,
      overall: 0,
      hasDayData: false
    },
    themes: [],
    sourceText: text,
    language: lang,
    analysisVersion: '2.0.0',
    timestamp: new Date().toISOString(),
    confidence: 0
  }
}

/**
 * Adapt V1 analysis to V2 AnalysisBundle format
 */
function adaptV1Analysis(v1Analysis: any, dreamText: string, lang: 'tr' | 'en'): AnalysisBundle {
  if (!v1Analysis) return createEmptyBundle(dreamText, lang)

  try {
    // If already AnalysisBundle format, return as-is
    if (v1Analysis.emotions && v1Analysis.entities && v1Analysis.sleep) {
      return {
        ...v1Analysis,
        sourceText: dreamText,
        language: lang,
        analysisVersion: '2.0.0',
        timestamp: v1Analysis.timestamp || new Date().toISOString()
      }
    }

    // Convert legacy DreamAnalysisResult to AnalysisBundle
    return {
      emotions: {
        pos: v1Analysis.emotions?.find((e: any) => e.valence === 'pos')?.intensity || 0,
        neg: v1Analysis.emotions?.find((e: any) => e.valence === 'neg')?.intensity || 0,
        neu: v1Analysis.emotions?.find((e: any) => e.valence === 'neu')?.intensity || 0,
        labels: (v1Analysis.emotions || []).map((e: any) => ({
          tag: e.emotion || e.translatedName || 'unknown',
          score: e.intensity || 0,
          intensity: e.intensity || 0,
          valence: e.valence || 'neu',
          arousal: e.arousal || 50
        })),
        confidence: v1Analysis.confidenceScore?.score || 50,
        tone: (v1Analysis.emotions?.[0]?.valence === 'pos' ? 'positive' :
               v1Analysis.emotions?.[0]?.valence === 'neg' ? 'negative' :
               'neutral') as 'positive' | 'negative' | 'neutral'
      },
      entities: {
        people: [],
        animals: [],
        places: [],
        objects: [],
        events: []
      },
      sleep: {
        stage: 'unknown',
        confidence: 50,
        vividness: 50,
        emotionalIntensity: v1Analysis.emotions?.[0]?.intensity || 50,
        bizarrenessScore: 50,
        narrativeCoherence: 50
      },
      plausibility: {
        logical: 50,
        physical: 50,
        social: 50,
        bizarreness: 50,
        overall: 50
      },
      continuity: {
        thematic: 0,
        emotional: 0,
        social: 0,
        cognitive: 0,
        overall: 0,
        hasDayData: false
      },
      themes: (v1Analysis.themes || []).map((theme: any) => ({
        id: theme.theme || theme.name || 'unknown',
        scoreRaw: theme.scorePct || theme.score || 0,
        scoreNorm: theme.scorePct || theme.score || 0,
        evidenceSpans: [],
        strength: (theme.scorePct >= 70 ? 'high' : theme.scorePct >= 40 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
        evidenceLevel: (theme.evidence_level || 'medium') as 'high' | 'medium' | 'low'
      })),
      sourceText: dreamText,
      language: lang,
      analysisVersion: '2.0.0',
      timestamp: new Date().toISOString(),
      confidence: v1Analysis.confidenceScore?.score || 50
    }
  } catch (err) {
    logger.warn('Failed to adapt V1 analysis, using empty bundle:', err)
    return createEmptyBundle(dreamText, lang)
  }
}

/**
 * Check if migration is needed
 */
export function checkMigrationNeeded(): boolean {
  try {
    const keys = Object.keys(localStorage)
      .filter(k => k.startsWith(StorageKeys.HISTORY))

    if (keys.length === 0) return false

    // Check if any record is V1 format
    for (const key of keys.slice(0, 5)) { // Check first 5 records
      try {
        const raw = localStorage.getItem(key)
        if (!raw) continue

        const record = JSON.parse(raw)
        if (record.schema !== 2) {
          return true // Found V1 record
        }
      } catch {}
    }

    return false
  } catch {
    return false
  }
}

/**
 * Main migration function
 * Migrates recent records immediately, schedules old records for background
 */
export async function migrateToV2(): Promise<MigrationResult> {
  const startTime = performance.now()

  logger.info('🔄 Starting storage migration V1→V2')

  // Check quota
  const totalSize = estimateStorageSize()
  const quotaLimit = 4_500_000 // 4.5MB (90% of 5MB limit)

  if (totalSize > quotaLimit) {
    logger.warn('⚠️ Storage quota exceeded, pruning old records')
    await pruneOldRecords(30) // Keep only 30 most recent
  }

  // Get all dream analysis keys
  const allKeys = Object.keys(localStorage)
    .filter(k => k.startsWith(StorageKeys.HISTORY))

  logger.debug(`Found ${allKeys.length} total records`)

  // Sort by timestamp (newest first)
  const sortedKeys = allKeys.sort((a, b) => {
    try {
      const aRecord = JSON.parse(localStorage.getItem(a) || '{}') as V1Record
      const bRecord = JSON.parse(localStorage.getItem(b) || '{}') as V1Record
      return getTimestamp(bRecord) - getTimestamp(aRecord)
    } catch {
      return getTimestampFromKey(b) - getTimestampFromKey(a)
    }
  })

  // Migrate recent records (last 30 days or first 50 records)
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
  const recentKeys = sortedKeys.filter((k, index) => {
    if (index < 50) return true // Always migrate first 50

    try {
      const record = JSON.parse(localStorage.getItem(k) || '{}') as V1Record
      return getTimestamp(record) > thirtyDaysAgo
    } catch {
      return false
    }
  })

  logger.debug(`Migrating ${recentKeys.length} recent records`)

  let migrated = 0
  let failed = 0
  let skipped = 0

  for (const key of recentKeys) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) {
        skipped++
        continue
      }

      const v1 = JSON.parse(raw) as V1Record

      // Already V2?
      if ((v1 as any).schema === 2) {
        skipped++
        continue
      }

      // Extract dream text
      const dreamText = v1.dreamText || v1.text || ''
      if (!dreamText) {
        logger.warn('Skipping record with no dream text:', key)
        localStorage.removeItem(key) // Remove invalid record
        skipped++
        continue
      }

      // Create V2 record
      const v2: V2Record = {
        schema: 2,
        id: crypto.randomUUID(),
        lang: detectLanguage(dreamText),
        createdAt: new Date(getTimestamp(v1)).toISOString(),
        dreamText,
        analysis: adaptV1Analysis(v1.analysis || v1.results, dreamText, detectLanguage(dreamText)),
        version: '2.0.0',
        migrated: true
      }

      // Save V2 record
      localStorage.setItem(key, JSON.stringify(v2))
      migrated++

    } catch (error) {
      logger.warn('Migration failed for key:', key, error)
      // Remove corrupted record
      try {
        localStorage.removeItem(key)
      } catch {}
      failed++
    }
  }

  const duration = performance.now() - startTime

  logger.info('✅ Migration complete:', {
    migrated,
    failed,
    skipped,
    duration: `${Math.round(duration)}ms`
  })

  return { migrated, failed, skipped, duration }
}

/**
 * Schedule background migration for old records
 * Uses requestIdleCallback for non-blocking migration
 */
export function scheduleBackgroundMigration(keys: string[]): void {
  if (keys.length === 0) return

  logger.debug(`Scheduling background migration for ${keys.length} old records`)

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      migrateOldRecords(keys)
    }, { timeout: 5000 })
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => migrateOldRecords(keys), 2000)
  }
}

/**
 * Migrate old records in background
 */
async function migrateOldRecords(keys: string[]): Promise<void> {
  logger.debug('🔄 Background migration started')

  let migrated = 0

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue

      const v1 = JSON.parse(raw) as V1Record
      if ((v1 as any).schema === 2) continue

      const dreamText = v1.dreamText || v1.text || ''
      if (!dreamText) {
        localStorage.removeItem(key)
        continue
      }

      const v2: V2Record = {
        schema: 2,
        id: crypto.randomUUID(),
        lang: detectLanguage(dreamText),
        createdAt: new Date(getTimestamp(v1)).toISOString(),
        dreamText,
        analysis: adaptV1Analysis(v1.analysis || v1.results, dreamText, detectLanguage(dreamText)),
        version: '2.0.0',
        migrated: true
      }

      localStorage.setItem(key, JSON.stringify(v2))
      migrated++

      // Yield to browser every 10 records
      if (migrated % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error) {
      logger.warn('Background migration failed:', key, error)
      try {
        localStorage.removeItem(key)
      } catch {}
    }
  }

  logger.info(`✅ Background migration complete: ${migrated} records`)
}
