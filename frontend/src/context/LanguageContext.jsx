// context/LanguageContext.jsx
// -----------------------------------------------------------------------
// Simple i18n context: current language + a t(key) lookup function backed
// by i18n/translations.js. Persisted to localStorage so the choice
// survives a refresh.
// -----------------------------------------------------------------------
import React, { createContext, useContext, useMemo, useState } from 'react'
import { translations } from '../i18n/translations.js'

const LanguageContext = createContext(null)
const STORAGE_KEY = 'ss_language'

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'en'
    } catch {
      return 'en'
    }
  })

  const changeLanguage = (lang) => {
    setLanguage(lang)
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // ignore
    }
  }

  const t = useMemo(() => {
    const dict = translations[language] || translations.en
    return (key) => dict[key] || translations.en[key] || key
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}
