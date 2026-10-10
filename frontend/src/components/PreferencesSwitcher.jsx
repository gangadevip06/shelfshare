import React from 'react'
import { Palette } from 'lucide-react'
import { useTheme, THEMES } from '../context/ThemeContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { LANGUAGES } from '../i18n/translations.js'

export default function PreferencesSwitcher() {
  const { theme, setTheme, toggleTheme } = useTheme()
  const { language, setLanguage } = useLanguage()

  const currentTheme = THEMES.find((t) => t.id === theme) || THEMES[0]

  return (
    <div className="prefs-switcher" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {/* Theme Selector Dropdown */}
      <select
        className="lang-select"
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        title="Color Theme"
        style={{ fontSize: '0.82rem', padding: '4px 8px', borderRadius: 8 }}
      >
        {THEMES.map((th) => (
          <option key={th.id} value={th.id}>
            {th.icon} {th.label}
          </option>
        ))}
      </select>

      {/* Language Selector */}
      <select
        className="lang-select"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        title="Language"
        style={{ fontSize: '0.82rem', padding: '4px 8px', borderRadius: 8 }}
      >
        {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>

      {/* Quick Theme Cycle Button */}
      <button
        className="icon-btn"
        onClick={toggleTheme}
        title={`Current: ${currentTheme.label} — Click to switch theme`}
        style={{ color: currentTheme.primary }}
      >
        <Palette size={16} />
      </button>
    </div>
  )
}
