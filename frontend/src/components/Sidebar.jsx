// components/Sidebar.jsx
// Generic, reusable sidebar shell driven by a `links` prop so it can be
// used for both the User dashboard and the Admin dashboard layouts.
import React from 'react'
import { NavLink } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export default function Sidebar({ links, sectionLabel, footer, mobileOpen }) {
  return (
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <span className="logo">
          <span className="logo-mark">
            <Sparkles size={16} strokeWidth={2.5} />
          </span>
          ShelfShare
        </span>
      </div>
      <nav className="sidebar-nav">
        {sectionLabel && <div className="nav-section-label">{sectionLabel}</div>}
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="ic">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
      {footer && <div className="sidebar-footer">{footer}</div>}
    </aside>
  )
}

