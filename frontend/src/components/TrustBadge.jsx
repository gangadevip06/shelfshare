// components/TrustBadge.jsx
import React from 'react'
import { trustTier } from '../utils/trustScore.js'
import { ShieldCheck } from 'lucide-react'

export default function TrustBadge({ score, size = 'md' }) {
  const { tier, className } = trustTier(score)
  const iconSize = size === 'sm' ? 12 : 14

  return (
    <span className={`trust-badge ${className} ${size === 'sm' ? 'sm' : ''}`} title={`Trust Score: ${score}/100`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <ShieldCheck size={iconSize} />
      <span>{tier}</span>
    </span>
  )
}
