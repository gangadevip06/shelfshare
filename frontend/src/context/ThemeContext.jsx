// context/ThemeContext.jsx
// -----------------------------------------------------------------------
// Light/dark theme toggle. The actual color values live in index.css as
// CSS custom properties; this context just flips a `data-theme` attribute
// on <html> and persists the choice, so no component needs to know the
// specific colors — they already read var(--ink), var(--paper), etc.
// -----------------------------------------------------------------------
import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'ss_theme'

export const THEMES = [
  { id: 'light', label: 'Emerald Mint', icon: '🌿', primary: '#059669', badge: 'Eco Sharing' },
  { id: 'amber', label: 'Sunset Amber', icon: '🌅', primary: '#d97706', badge: 'Artisan Warmth' },
  { id: 'ocean', label: 'Ocean Slate', icon: '🌊', primary: '#2563eb', badge: 'Coastal Tech' },
  { id: 'dark', label: 'Dark Obsidian', icon: '🌑', primary: '#10b981', badge: 'Night Mode' },
]

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (['light', 'amber', 'ocean', 'dark'].includes(saved)) return saved
      return 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // ignore
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((current) => {
      const currentIndex = THEMES.findIndex((t) => t.id === current)
      const nextIndex = (currentIndex + 1) % THEMES.length
      return THEMES[nextIndex].id
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
