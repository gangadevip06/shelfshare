// components/JwtInspectorModal.jsx
import React, { useState } from 'react'
import { X, ShieldCheck, Copy, Check, Key, Clock, UserCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { decodeJWT, verifyJWT } from '../utils/jwt.js'

export default function JwtInspectorModal({ isOpen, onClose }) {
  const { token, user } = useAuth()
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const decoded = token ? decodeJWT(token) : null
  const isValid = token ? verifyJWT(token) : false

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const parts = token ? token.split('.') : []
  const headerPart = parts[0] ? atob(parts[0]) : '{}'
  let parsedHeader = {}
  try {
    parsedHeader = JSON.parse(headerPart)
  } catch {}

  const expDate = decoded?.exp ? new Date(decoded.exp * 1000).toLocaleString() : 'N/A'
  const iatDate = decoded?.iat ? new Date(decoded.iat * 1000).toLocaleString() : 'N/A'

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Key size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.15rem' }}>JWT Token Inspector</h3>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span className={`badge ${isValid ? 'badge-green' : 'badge-red'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
            <ShieldCheck size={14} /> {isValid ? 'RFC 7519 Signature Verified' : 'Token Invalid'}
          </span>
          <span className="badge badge-accent" style={{ fontSize: '0.78rem' }}>
            Alg: {parsedHeader.alg || 'HS256'}
          </span>
          {decoded?.role && (
            <span className="badge badge-gray" style={{ fontSize: '0.78rem' }}>
              Role: {decoded.role}
            </span>
          )}
        </div>

        {/* Token Structure Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div className="card" style={{ padding: 12, background: 'var(--paper)', fontSize: '0.82rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserCheck size={14} /> Subject / User Claim
            </div>
            <div><strong>ID:</strong> {decoded?.sub || 'None'}</div>
            <div><strong>Name:</strong> {decoded?.name || 'Anonymous'}</div>
            <div><strong>Email:</strong> {decoded?.email || 'None'}</div>
          </div>
          <div className="card" style={{ padding: 12, background: 'var(--paper)', fontSize: '0.82rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} /> Lifetime Claims
            </div>
            <div><strong>Issued At:</strong> {iatDate}</div>
            <div><strong>Expires:</strong> {expDate}</div>
            <div><strong>Active:</strong> {isValid ? 'Yes (Valid session)' : 'Expired'}</div>
          </div>
        </div>

        {/* Decoded Claims JSON */}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label" style={{ fontSize: '0.82rem' }}>Decoded Payload (Claims)</label>
          <pre style={{
            background: 'var(--bg)',
            padding: 12,
            borderRadius: 8,
            border: '1px solid var(--border)',
            fontSize: '0.78rem',
            overflowX: 'auto',
            margin: 0
          }}>
            {JSON.stringify(decoded, null, 2)}
          </pre>
        </div>

        {/* Raw Encoded JWT */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <label className="form-label" style={{ fontSize: '0.82rem', margin: 0 }}>Raw JWT Bearer Token</label>
            <button
              onClick={copyToken}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.75rem', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy Token</>}
            </button>
          </div>
          <textarea
            readOnly
            value={token || 'No active JWT token found. Please log in.'}
            rows={3}
            className="form-control"
            style={{
              fontSize: '0.74rem',
              fontFamily: 'monospace',
              background: 'var(--paper)',
              wordBreak: 'break-all',
              resize: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}
