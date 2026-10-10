// components/Navbar.jsx
// Public navbar shown on Landing / Login / Register pages.
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import PreferencesSwitcher from './PreferencesSwitcher.jsx'

export default function Navbar() {
  const { isAuthenticated, isAdmin } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="logo">
          <span className="logo-mark">
            <Sparkles size={16} strokeWidth={2.5} />
          </span>
          ShelfShare
        </Link>
        <nav className="nav-links">
          <Link to="/">{t('nav_home')}</Link>
          <Link to="/explore">{t('nav_explore')}</Link>
          <Link to="/api-docs">API Docs</Link>
          <a href="/#how-it-works">How it works</a>
          <a href="/#why-shelfshare">Why ShelfShare</a>
        </nav>
        <div className="nav-actions">
          <PreferencesSwitcher />
          {isAuthenticated ? (
            <button className="btn btn-primary btn-sm" onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}>
              <LayoutDashboard size={15} />
              Go to Dashboard
            </button>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>{t('nav_login')}</button>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>
                Start Sharing
                <ArrowRight size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

