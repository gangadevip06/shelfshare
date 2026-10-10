// components/StatCard.jsx
// Reusable statistic tile used on both User Dashboard and Admin Dashboard.
import React from 'react'

export default function StatCard({ icon, label, value, delta, deltaDirection = 'up' }) {
  return (
    <div className="card stat-card">
      <div className="top">
        <div className="ic-badge">{icon}</div>
        {delta && <span className={`delta ${deltaDirection}`}>{delta}</span>}
      </div>
      <div className="val">{value}</div>
      <div className="lbl">{label}</div>
    </div>
  )
}
