"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Language, getTranslation } from '@/lib/translations'
import { storage, StorageKeys } from '@/lib/storage'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, values?: Record<string, any>) => string
  isRTL: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    const savedLanguage = storage.getItem<Language>(StorageKeys.LANGUAGE)
    if (savedLanguage && (savedLanguage === 'tr' || savedLanguage === 'en')) {
      setLanguage(savedLanguage)
    } else {
      // Default to English, only use Turkish if explicitly set to Turkish
      setLanguage('en')
    }
  }, [])

  useEffect(() => {
    if (!isClient) return

    storage.setItem(StorageKeys.LANGUAGE, language)
    document.documentElement.lang = language
    document.documentElement.dir = 'ltr'
  }, [language, isClient])

  const t = useCallback((key: string, values?: Record<string, any>): string => {
    const translation = getTranslation(language, key)
    if (!translation) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`Translation not found for key: ${key}`)
      }
      return key
    }
    return values ?
      Object.keys(values).reduce((acc, k) => acc.replace(`{${k}}`, values[k]), translation) :
      translation
  }, [language])

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isRTL: false
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Hook for easy translation access
export function useTranslation() {
  const { t, language } = useLanguage()
  return { t, language }
} 