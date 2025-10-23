/**
 * Type-safe localStorage utility with SSR support and error handling
 */

type StorageKey = 
  | 'dreamMapperDemographics' 
  | 'dreamJournal' 
  | 'dreamMapper-language'
  | 'analysisHistory'
  | 'dreamTimeMemory'

interface StorageItem<T> {
  value: T
  timestamp: number
  version: string
}

const STORAGE_VERSION = '1.0.0'

class StorageManager {
  private isAvailable: boolean = false

  constructor() {
    this.checkAvailability()
  }

  private checkAvailability(): void {
    if (typeof window === 'undefined') {
      this.isAvailable = false
      return
    }

    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      this.isAvailable = true
    } catch {
      this.isAvailable = false
      if (process.env.NODE_ENV !== 'production') {
        console.warn('localStorage is not available')
      }
    }
  }

  setItem<T>(key: StorageKey, value: T): boolean {
    if (!this.isAvailable) return false

    try {
      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        version: STORAGE_VERSION
      }
      localStorage.setItem(key, JSON.stringify(item))
      return true
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`Failed to save to localStorage: ${key}`, error)
      }
      return false
    }
  }

  getItem<T>(key: StorageKey): T | null {
    if (!this.isAvailable) return null

    try {
      const itemStr = localStorage.getItem(key)
      if (!itemStr) return null

      // Try to parse as new format first
      try {
        const item: StorageItem<T> = JSON.parse(itemStr)
        
        // Check if it's the new format (has version property)
        if ('version' in item && 'value' in item && 'timestamp' in item) {
          if (item.version !== STORAGE_VERSION) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn(`Storage version mismatch for ${key}, migrating...`)
            }
            // Migrate old versioned data
            this.setItem(key, item.value)
            return item.value
          }
          return item.value
        }
        
        // It's old format (raw data), migrate it
        if (process.env.NODE_ENV !== 'production') {
          console.info(`Migrating old storage format for ${key}`)
        }
        this.setItem(key, item as T)
        return item as T
      } catch {
        // If JSON.parse fails, the data is corrupted
        this.removeItem(key)
        return null
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`Failed to read from localStorage: ${key}`, error)
      }
      return null
    }
  }

  removeItem(key: StorageKey): boolean {
    if (!this.isAvailable) return false

    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`Failed to remove from localStorage: ${key}`, error)
      }
      return false
    }
  }

  clear(): boolean {
    if (!this.isAvailable) return false

    try {
      localStorage.clear()
      return true
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to clear localStorage', error)
      }
      return false
    }
  }

  getTimestamp(key: StorageKey): number | null {
    if (!this.isAvailable) return null

    try {
      const itemStr = localStorage.getItem(key)
      if (!itemStr) return null

      const item: StorageItem<unknown> = JSON.parse(itemStr)
      return item.timestamp
    } catch {
      return null
    }
  }

  isExpired(key: StorageKey, maxAgeMs: number): boolean {
    const timestamp = this.getTimestamp(key)
    if (!timestamp) return true

    return Date.now() - timestamp > maxAgeMs
  }
}

export const storage = new StorageManager()

export const StorageKeys = {
  DEMOGRAPHICS: 'dreamMapperDemographics' as StorageKey,
  JOURNAL: 'dreamJournal' as StorageKey,
  LANGUAGE: 'dreamMapper-language' as StorageKey,
  HISTORY: 'analysisHistory' as StorageKey,
  DREAM_TIME_MEMORY: 'dreamTimeMemory' as StorageKey,
}
