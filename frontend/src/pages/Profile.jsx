// pages/Profile.jsx
import React, { useEffect, useState, useRef } from 'react'
import UserLayout from '../components/UserLayout.jsx'
import TrustBadge from '../components/TrustBadge.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { getResources, getRequests, getUsers } from '../services/api.js'
import { computeTrustScore } from '../utils/trustScore.js'
import { Copy, Check, Edit3, Camera, Upload, Trash2, Image as ImageIcon, Sparkles } from 'lucide-react'

const PRESET_AVATARS = [
  { label: 'Portrait 1', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80' },
  { label: 'Portrait 2', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80' },
  { label: 'Portrait 3', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80' },
  { label: 'Portrait 4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80' },
  { label: 'Portrait 5', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80' },
]

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const { t } = useLanguage()
  const fileInputRef = useRef(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    avatarUrl: user?.avatarUrl || user?.avatar || '',
  })
  const [photoError, setPhotoError] = useState('')
  const [showPresets, setShowPresets] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [counts, setCounts] = useState({ shared: 0, transactions: 0, trustScore: 0, avgRating: 0, referrals: 0 })

  useEffect(() => {
    async function load() {
      if (!user?.id) return
      const [resources, requests, users] = await Promise.all([getResources(), getRequests(), getUsers()])
      const myResources = resources.filter((r) => r.ownerId === user.id)
      const completedAsOwner = requests.filter((r) => r.ownerId === user.id && r.status === 'Completed').length
      const allReviews = myResources.flatMap((r) => r.reviews || [])
      const avgRating = allReviews.length ? allReviews.reduce((s, rv) => s + rv.rating, 0) / allReviews.length : 0
      const trustScore = computeTrustScore({ completedCount: completedAsOwner, avgRating, joinedDate: user.joined })
      const referrals = users.filter((u) => u.referredBy === user.referralCode).length
      setCounts({
        shared: myResources.length,
        transactions: requests.filter((r) => r.requesterId === user.id && r.status === 'Completed').length,
        trustScore,
        avgRating,
        referrals,
      })
    }
    load()
  }, [user?.id])

  const handleCopyReferral = () => {
    navigator.clipboard?.writeText(user.referralCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSave = (e) => {
    e.preventDefault()
    updateProfile(form)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file (PNG, JPG, WEBP)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image must be less than 5MB')
      return
    }
    setPhotoError('')
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result
      if (dataUrl) {
        updateProfile({ avatarUrl: dataUrl, avatar: dataUrl })
        setForm((prev) => ({ ...prev, avatarUrl: dataUrl }))
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSelectPreset = (url) => {
    updateProfile({ avatarUrl: url, avatar: url })
    setForm((prev) => ({ ...prev, avatarUrl: url }))
    setShowPresets(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleRemovePhoto = () => {
    updateProfile({ avatarUrl: null, avatar: null })
    setForm((prev) => ({ ...prev, avatarUrl: '' }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const initials = (user?.name || 'U').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  return (
    <UserLayout title={t('profile_title')} subtitle={t('profile_subtitle')}>
      {saved && <div className="alert alert-success">Profile updated successfully.</div>}
      <div className="grid-2" style={{ gridTemplateColumns: '320px 1fr', alignItems: 'flex-start' }}>
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          {/* Profile Picture / Photo Avatar */}
          <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 14px' }}>
            <div
              className="avatar lg"
              style={{
                width: 96,
                height: 96,
                margin: 0,
                fontSize: '2rem',
                overflow: 'hidden',
                border: '3px solid var(--surface, #ffffff)',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.16)',
                cursor: 'pointer',
              }}
              onClick={() => fileInputRef.current?.click()}
              title="Click to change profile picture"
            >
              {user?.avatarUrl || user?.avatar ? (
                <img
                  src={user.avatarUrl || user.avatar}
                  alt={user?.name || 'Profile'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                initials
              )}
            </div>

            {/* Camera Badge Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload profile picture"
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--primary, #2f6b4f)',
                color: '#ffffff',
                border: '2px solid var(--surface, #ffffff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Camera size={16} />
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>

          {/* Quick Photo Actions */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => fileInputRef.current?.click()}
              style={{ fontSize: '0.74rem', padding: '4px 9px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <Upload size={13} /> Upload Photo
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setShowPresets(!showPresets)}
              style={{ fontSize: '0.74rem', padding: '4px 9px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <Sparkles size={13} /> Presets
            </button>
            {(user?.avatarUrl || user?.avatar) && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleRemovePhoto}
                style={{ fontSize: '0.74rem', padding: '4px 8px', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                title="Remove photo"
              >
                <Trash2 size={13} /> Remove
              </button>
            )}
          </div>

          {/* Preset Avatars Selector Drawer */}
          {showPresets && (
            <div
              style={{
                background: 'var(--paper, #f9fafb)',
                border: '1px solid var(--border, #e5e7eb)',
                borderRadius: 12,
                padding: '10px 8px',
                marginBottom: 14,
              }}
            >
              <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--sage, #6b7280)', marginBottom: 8 }}>
                Choose an Avatar Preset:
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                {PRESET_AVATARS.map((p, idx) => (
                  <img
                    key={idx}
                    src={p.url}
                    alt={p.label}
                    onClick={() => handleSelectPreset(p.url)}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      cursor: 'pointer',
                      border: (user?.avatarUrl || user?.avatar) === p.url ? '2px solid var(--primary, #2f6b4f)' : '2px solid transparent',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.12)',
                      transition: 'transform 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    title={p.label}
                  />
                ))}
              </div>
            </div>
          )}

          {photoError && (
            <div style={{ color: '#dc2626', fontSize: '0.78rem', marginBottom: 10 }}>{photoError}</div>
          )}

          <h3>{user?.name}</h3>
          <div style={{ color: 'var(--sage)', fontSize: '0.85rem', marginTop: 4 }}>{user?.email}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--sage)', marginTop: 6, textTransform: 'capitalize' }}>{user?.role} account</div>
          {user?.role !== 'admin' && (
            <div style={{ marginTop: 12 }}>
              <TrustBadge score={counts.trustScore} />
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>{counts.shared}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--sage)' }}>{t('stat_resourcesShared')}</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>{counts.transactions}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--sage)' }}>{t('stat_completedTransactions')}</div>
            </div>
          </div>

          {user?.role !== 'admin' && user?.referralCode && (
            <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16, textAlign: 'left' }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Your Referral Code</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <code style={{ background: 'var(--paper)', padding: '6px 10px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, letterSpacing: 1 }}>{user.referralCode}</code>
                <button className="btn btn-outline btn-sm" onClick={handleCopyReferral} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {copied ? <Check size={13} color="var(--primary)" /> : <Copy size={13} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--sage)', marginTop: 8 }}>
                {counts.referrals} member{counts.referrals !== 1 ? 's' : ''} joined using your code
              </div>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.05rem' }}>Account details</h3>
            {!editing && (
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Edit3 size={13} /> {t('action_editProfile')}
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">{t('field_name')}</label>
                <input className="form-control" value={form.name} onChange={handleChange('name')} />
              </div>
              {user?.role !== 'admin' && (
                <>
                  <div className="form-group">
                    <label className="form-label">{t('field_phone')}</label>
                    <input className="form-control" value={form.phone} onChange={handleChange('phone')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('field_address')}</label>
                    <input className="form-control" value={form.address} onChange={handleChange('address')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Profile Picture (Image URL or Upload)</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        className="form-control"
                        placeholder="https://... or click Browse to upload"
                        value={form.avatarUrl || ''}
                        onChange={handleChange('avatarUrl')}
                      />
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Upload size={14} /> Browse
                      </button>
                    </div>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary">{t('common_save')}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>{t('common_cancel')}</button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <div className="eyebrow">{t('field_email')}</div>
                <div style={{ marginTop: 4 }}>{user?.email}</div>
              </div>
              {user?.role !== 'admin' && (
                <>
                  <div>
                    <div className="eyebrow">{t('field_phone')}</div>
                    <div style={{ marginTop: 4 }}>{user?.phone || 'Not provided'}</div>
                  </div>
                  <div>
                    <div className="eyebrow">{t('field_address')}</div>
                    <div style={{ marginTop: 4 }}>{user?.address || 'Not provided'}</div>
                  </div>
                </>
              )}
              <div>
                <div className="eyebrow">{t('field_joined')}</div>
                <div style={{ marginTop: 4 }}>{user?.joined || '—'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  )
}
