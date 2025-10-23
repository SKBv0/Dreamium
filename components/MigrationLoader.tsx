"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle2 } from 'lucide-react'
import { migrateToV2, checkMigrationNeeded, type MigrationResult } from '@/lib/storage/migrate-v2'
import { logger } from '@/lib/logger'
import { useTranslation } from '@/contexts/LanguageContext'

type MigrationStatus = 'idle' | 'checking' | 'migrating' | 'done' | 'error'

export function MigrationLoader() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<MigrationStatus>('idle')
  const [progress, setProgress] = useState({ migrated: 0, total: 0 })
  const [result, setResult] = useState<MigrationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return

    const runMigration = async () => {
      try {
        setStatus('checking')

        const needsMigration = checkMigrationNeeded()

        if (!needsMigration) {
          logger.debug('No migration needed')
          setStatus('done')
          return
        }

        logger.info('Migration needed, starting...')
        setStatus('migrating')

        // Run migration
        const migrationResult = await migrateToV2()

        setResult(migrationResult)
        setProgress({
          migrated: migrationResult.migrated,
          total: migrationResult.migrated + migrationResult.failed
        })

        // Wait a bit to show success
        await new Promise(resolve => setTimeout(resolve, 1000))

        setStatus('done')

      } catch (err) {
        logger.error('Migration failed:', err)
        setError(err instanceof Error ? err.message : 'Migration failed')
        setStatus('error')

        // Auto-dismiss error after 5 seconds
        setTimeout(() => setStatus('done'), 5000)
      }
    }

    // Run migration after a small delay
    const timer = setTimeout(runMigration, 500)

    return () => clearTimeout(timer)
  }, [])

  // Don't show anything if idle or done
  if (status === 'idle' || status === 'done') return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-[500px] shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {status === 'checking' && (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span>{t('migration.checking')}</span>
              </>
            )}
            {status === 'migrating' && (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                <span>{t('migration.updating')}</span>
              </>
            )}
            {status === 'error' && (
              <>
                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">
                  !
                </div>
                <span>{t('migration.error')}</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'checking' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="text-sm text-gray-600 text-center">
                {t('migration.checkingDescription')}
              </div>
            </div>
          )}

          {status === 'migrating' && result && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('migration.progress')}</span>
                  <span className="font-medium">
                    {progress.migrated} / {progress.total} {t('migration.dreams')}
                  </span>
                </div>
                <Progress
                  value={progress.total > 0 ? (progress.migrated / progress.total) * 100 : 0}
                  className="h-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="text-2xl font-bold text-green-700">
                    {result.migrated}
                  </div>
                  <div className="text-xs text-green-600">{t('migration.updated')}</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-700">
                    {result.skipped}
                  </div>
                  <div className="text-xs text-yellow-600">{t('migration.skipped')}</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                  <div className="text-2xl font-bold text-red-700">
                    {result.failed}
                  </div>
                  <div className="text-xs text-red-600">{t('migration.failed')}</div>
                </div>
              </div>

              <div className="text-xs text-gray-500 text-center">
                {t('migration.duration')}: {Math.round(result.duration)}ms
              </div>
            </>
          )}

          {status === 'error' && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
              <p className="text-xs text-red-600 mt-2">
                {t('migration.errorDescription')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Migration Success Indicator
 * Shows brief success message after migration
 */
export function MigrationSuccess({ result }: { result: MigrationResult }) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
      <Card className="w-80 shadow-lg border-green-200 bg-green-50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-semibold text-green-900">
                {t('migration.successTitle')}
              </div>
              <div className="text-sm text-green-700">
                {result.migrated} {t('migration.successDescription')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
