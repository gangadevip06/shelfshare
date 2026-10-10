// components/SearchBar.jsx
// Controlled search input used in the dashboard topbar.
import React from 'react'
import { Search } from 'lucide-react'

export default function SearchBar({ value, onChange, placeholder = 'Search resources...' }) {
  return (
    <div className="topbar-search">
      <Search size={16} style={{ color: 'var(--sage)', flexShrink: 0 }} />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
