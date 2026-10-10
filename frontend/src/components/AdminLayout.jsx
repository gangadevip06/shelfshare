// components/AdminLayout.jsx
// The reusable shell shared by every Admin page: admin sidebar, admin
// header, admin profile chip. Only the main content area changes.
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Package, RefreshCw, Flag, FolderKanban, Menu, Bell, LogOut, Code2, Key } from 'lucide-react'
import Sidebar from './Sidebar.jsx'
import PreferencesSwitcher from './PreferencesSwitcher.jsx'
import JwtInspectorModal from './JwtInspectorModal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function AdminLayout({ children, title, subtitle }) {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showJwtModal, setShowJwtModal] = useState(false)

  const iconProps = { size: 18, strokeWidth: 2 }
  const ADMIN_LINKS = [
    { to: '/admin', label: t('nav_adminDashboard'), icon: <LayoutDashboard {...iconProps} />, end: true },
    { to: '/admin/users', label: t('nav_manageUsers'), icon: <Users {...iconProps} /> },
    { to: '/admin/resources', label: t('nav_manageResources'), icon: <Package {...iconProps} /> },
    { to: '/admin/requests', label: t('nav_manageRequests'), icon: <RefreshCw {...iconProps} /> },
    { to: '/admin/reports', label: t('nav_manageReports'), icon: <Flag {...iconProps} /> },
    { to: '/admin/categories', label: t('nav_manageCategories'), icon: <FolderKanban {...iconProps} /> },
    { to: '/api-docs', label: 'API Explorer', icon: <Code2 {...iconProps} /> },
  ]

  return (
    <div className="app-shell">
      <div className={`mobile-menu-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />
      <Sidebar
        links={ADMIN_LINKS}
        sectionLabel="Administration"
        mobileOpen={mobileOpen}
        footer={<button className="btn btn-ghost btn-block btn-sm" onClick={logout}><LogOut size={15} style={{ marginRight: 6, verticalAlign: -2 }} />{t('nav_logout')}</button>}
      />
      <div className="main-area">
        <header className="topbar">
          <button className="icon-btn mobile-only-toggle" onClick={() => setMobileOpen((v) => !v)}><Menu size={20} /></button>
          <div className="eyebrow">Admin Console</div>
          <div className="topbar-right">
            <PreferencesSwitcher />
            <button
              className="icon-btn"
              onClick={() => setShowJwtModal(true)}
              title="Inspect Admin JWT Bearer Token"
              style={{ color: 'var(--accent)' }}
            >
              <Key size={17} />
            </button>
            <button className="icon-btn" title="Notifications"><Bell size={18} /></button>
            <div className="profile-chip" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
              <div className="avatar sm">AD</div>
              <div className="hide-on-mobile">
                <div className="name">{user?.name || 'Admin'}</div>
                <div className="role">Administrator</div>
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
