// components/UserLayout.jsx
// -----------------------------------------------------------------------
// The reusable "shell" that stays identical across every authenticated
// user page: sidebar, logo, header, search, notification icon, profile,
// and Add Resource button. Only `children` (the page's main content)
// changes between Dashboard / Explore / MyResources / etc.
// -----------------------------------------------------------------------
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  LayoutDashboard, Compass, Package, RefreshCw, Inbox, Star, Heart,
  MessageSquare, Bell, User, Menu, Search, Plus, LogOut, Trophy, Bookmark, BarChart3,
  Code2, Key
} from 'lucide-react'
import Sidebar from './Sidebar.jsx'
import PreferencesSwitcher from './PreferencesSwitcher.jsx'
import JwtInspectorModal from './JwtInspectorModal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { fetchNotificationsThunk } from '../store/resourceSlice.js'

export default function UserLayout({ children, title, subtitle, searchValue, onSearchChange }) {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showJwtModal, setShowJwtModal] = useState(false)
  const notifications = useSelector((state) => state.resources.notifications)
  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (user?.id) dispatch(fetchNotificationsThunk(user.id))
  }, [user?.id, dispatch])

  const initials = (user?.name || 'U').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  const iconProps = { size: 18, strokeWidth: 2 }
  const LINKS = [
    { to: '/dashboard', label: t('nav_dashboard'), icon: <LayoutDashboard {...iconProps} />, end: true },
    { to: '/explore', label: t('nav_explore'), icon: <Compass {...iconProps} /> },
    { to: '/my-resources', label: t('nav_myResources'), icon: <Package {...iconProps} /> },
    { to: '/my-requests', label: t('nav_myRequests'), icon: <RefreshCw {...iconProps} /> },
    { to: '/incoming-requests', label: t('nav_incomingRequests'), icon: <Inbox {...iconProps} /> },
    { to: '/my-reviews', label: t('nav_myReviews'), icon: <Star {...iconProps} /> },
    { to: '/analytics', label: 'Analytics', icon: <BarChart3 {...iconProps} /> },
    { to: '/leaderboard', label: 'Leaderboard', icon: <Trophy {...iconProps} /> },
    { to: '/saved-searches', label: 'Saved Searches', icon: <Bookmark {...iconProps} /> },
    { to: '/wishlist', label: t('nav_wishlist'), icon: <Heart {...iconProps} /> },
    { to: '/messages', label: t('nav_messages'), icon: <MessageSquare {...iconProps} /> },
    { to: '/notifications', label: t('nav_notifications'), icon: <Bell {...iconProps} /> },
    { to: '/profile', label: t('nav_profile'), icon: <User {...iconProps} /> },
    { to: '/api-docs', label: 'API Explorer', icon: <Code2 {...iconProps} /> },
  ]

  return (
    <div className="app-shell">
      <div className={`mobile-menu-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />
      <Sidebar
        links={LINKS}
        sectionLabel="Menu"
        mobileOpen={mobileOpen}
        footer={
          <button className="btn btn-ghost btn-block btn-sm" onClick={logout}><LogOut size={15} style={{ marginRight: 6, verticalAlign: -2 }} />{t('nav_logout')}</button>
        }
      />
      <div className="main-area">
        <header className="topbar">
          <button className="icon-btn mobile-only-toggle" onClick={() => setMobileOpen((v) => !v)}><Menu size={20} /></button>
          {onSearchChange ? (
            <div className="topbar-search">
              <span className="ic"><Search size={16} /></span>
              <input
                type="text"
                value={searchValue}
                placeholder={t('common_search')}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          ) : <div />}
          <div className="topbar-right">
            <PreferencesSwitcher />
            <button
              className="icon-btn"
              onClick={() => setShowJwtModal(true)}
              title="Inspect Active JWT Bearer Token"
              style={{ color: 'var(--primary)' }}
            >
              <Key size={17} />
            </button>
            <button className="btn btn-accent btn-sm" onClick={() => navigate('/add-resource')}>
              <Plus size={15} style={{ marginRight: 4, verticalAlign: -2 }} />{t('nav_addResource').replace('+ ', '')}
            </button>
            <button className="icon-btn" onClick={() => navigate('/notifications')} title="Notifications">
              <Bell size={18} />{unreadCount > 0 && <span className="dot" />}
            </button>
            <div className="profile-chip" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
              <div className="avatar sm" style={{ overflow: 'hidden', padding: 0 }}>
                {user?.avatarUrl || user?.avatar ? (
                  <img
                    src={user.avatarUrl || user.avatar}
                    alt={user?.name || ''}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="hide-on-mobile">
                <div className="name">{user?.name}</div>
                <div className="role">Member</div>
              </div>
            </div>
          </div>
        </header>
        <div className="page-content">
          {(title || subtitle) && (
            <div className="page-head">
              <div>
                {title && <h1>{title}</h1>}
                {subtitle && <div className="sub">{subtitle}</div>}
              </div>
            </div>
          )}
          {children}
        </div>
      </div>

      <JwtInspectorModal isOpen={showJwtModal} onClose={() => setShowJwtModal(false)} />
    </div>
  )
}
