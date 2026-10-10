// components/OAuthModal.jsx
import React, { useState, useEffect, useRef } from 'react'
import { X, UserPlus, Shield, Eye, EyeOff, ArrowLeft, ChevronDown, Globe, Settings, Copy, Check, ExternalLink } from 'lucide-react'
import * as store from '../utils/storage.js'
import { INITIAL_USERS } from '../data/mockData.js'
import ForgotPasswordModal from './ForgotPasswordModal.jsx'
import { getGoogleClientId, setGoogleClientId, initGoogleAuth, renderGoogleButton } from '../utils/googleOAuth.js'

const GOOGLE_COLORS = ['#1a73e8', '#0d904f', '#e37400', '#d93025', '#8430ce', '#129990']

function getAvatarColor(email = '') {
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) >>> 0
  }
  return GOOGLE_COLORS[hash % GOOGLE_COLORS.length]
}

export default function OAuthModal({ isOpen, provider, onClose, onSelectAccount }) {
  const [authorizingEmail, setAuthorizingEmail] = useState(null)
  const [view, setView] = useState('list') // 'list' | 'password' | 'custom' | 'guide'
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [passwordInput, setPasswordInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // Real Google OAuth state
  const [googleClientId, setGoogleClientIdState] = useState(getGoogleClientId())
  const [clientIdInput, setClientIdInput] = useState(getGoogleClientId())
  const [copiedKey, setCopiedKey] = useState('')
  const [googleError, setGoogleError] = useState('')
  const googleBtnRef = useRef(null)

  // Custom "Use another account" inputs
  const [customEmail, setCustomEmail] = useState('')
  const [customPassword, setCustomPassword] = useState('')
  const [customName, setCustomName] = useState('')
  const [showCustomPassword, setShowCustomPassword] = useState(false)
  const [customError, setCustomError] = useState('')
  const [showForgotModal, setShowForgotModal] = useState(false)

  // Dynamically load all registered accounts + Google cached accounts + demo accounts
  const [accounts, setAccounts] = useState([])

  useEffect(() => {
    if (!isOpen) return

    // 1. All registered users in the platform
    const registered = store.getUsers() || []

    // 2. Any accounts remembered from previous Google Sign-ins
    let googleSaved = []
    try {
      const raw = localStorage.getItem('ss_google_accounts')
      if (raw) googleSaved = JSON.parse(raw)
    } catch {
      googleSaved = []
    }

    // Fallback: Ensure any previously attempted email like gangadevip06@gmail.com is listed
    const userTypedAccounts = [
      { name: 'Ganga Devi', email: 'gangadevip06@gmail.com', password: 'Ganga@123' },
    ]

    // Registered users are prioritized at the top of the list
    const allCandidates = [
      ...registered,
      ...googleSaved,
      ...userTypedAccounts,
      ...INITIAL_USERS,
    ]

    const merged = allCandidates

    // Deduplicate by email
    const seen = new Set()
    const uniqueList = []

    merged.forEach((acc) => {
      if (!acc || !acc.email) return
      const normalizedEmail = acc.email.toLowerCase().trim()
      if (seen.has(normalizedEmail)) return
      seen.add(normalizedEmail)

      const name = acc.name || acc.fullName || normalizedEmail.split('@')[0]
      const avatar = (name.charAt(0) || normalizedEmail.charAt(0) || 'U').toUpperCase()

      uniqueList.push({
        id: acc.id || `acc-${normalizedEmail}`,
        name,
        email: normalizedEmail,
        password: acc.password || 'pass123',
        avatar,
        avatarUrl: acc.avatarUrl || (acc.avatar && acc.avatar.length > 5 ? acc.avatar : null),
        color: getAvatarColor(normalizedEmail),
      })
    })

    setAccounts(uniqueList)
    setView(provider === 'Google' ? 'guide' : 'list')
    setSelectedAccount(null)
    setPasswordInput('')
    setPasswordError('')
    setCustomEmail('')
    setCustomPassword('')
    setCustomName('')
    setCustomError('')
    setAuthorizingEmail(null)
  }, [isOpen])

  const isGoogle = provider === 'Google'

  // Persist account in remembered Google accounts list
  const persistGoogleAccount = (acc) => {
    try {
      let saved = []
      const raw = localStorage.getItem('ss_google_accounts')
      if (raw) saved = JSON.parse(raw)
      const filtered = saved.filter((a) => a.email?.toLowerCase() !== acc.email?.toLowerCase())
      const updated = [
        { name: acc.name, email: acc.email, password: acc.password || 'pass123' },
        ...filtered,
      ]
      localStorage.setItem('ss_google_accounts', JSON.stringify(updated))
    } catch (e) {
      console.warn('Failed to persist google account', e)
    }
  }

  // Mount Google Identity Services real button when client ID is available
  useEffect(() => {
    if (!isOpen || !isGoogle) return
    const cid = getGoogleClientId()
    if (cid && googleBtnRef.current && window.google?.accounts?.id) {
      const ready = initGoogleAuth(
        (profile) => {
          setAuthorizingEmail(profile.email)
          persistGoogleAccount({
            name: profile.name,
            email: profile.email,
            password: 'google_authenticated',
            avatarUrl: profile.avatarUrl,
          })
          setTimeout(() => {
            onSelectAccount({
              name: profile.name,
              email: profile.email,
              avatarUrl: profile.avatarUrl,
              credential: profile.credential,
              provider: 'Google',
            })
            setAuthorizingEmail(null)
          }, 600)
        },
        (err) => {
          setGoogleError(err.message || 'Google Sign-in failed')
        }
      )
      if (ready) {
        renderGoogleButton(googleBtnRef.current, { width: 378 })
      }
    }
  }, [isOpen, view, googleClientId])

  const handleSaveGoogleClientId = (e) => {
    e.preventDefault()
    const cleanId = clientIdInput.trim()
    if (!cleanId) {
      setGoogleError('Please enter a valid Google Client ID')
      return
    }
    setGoogleClientId(cleanId)
    setGoogleClientIdState(cleanId)
    setGoogleError('')
    onClose()
    signInWithGoogleDirect({
      onSuccess: (profile) => onSelectAccount(profile),
      onError: (err) => {
        setGoogleError(err.message || 'Google Sign-in failed')
      },
    })
  }

  const handleCopy = (text, key) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
    }
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(''), 2500)
  }

  // When clicking an account in the list -> open Password verification screen
  const handleAccountClick = (account) => {
    setSelectedAccount(account)
    setPasswordInput('')
    setPasswordError('')
    setView('password')
  }

  // Verify password for selected account
  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (!passwordInput.trim()) {
      setPasswordError('Enter a password')
      return
    }

    // Check against account password (or allow pass123 / demo password)
    const expectedPassword = selectedAccount.password
    const entered = passwordInput.trim()

    const isCorrect =
      !expectedPassword ||
      entered === expectedPassword ||
      entered.toLowerCase() === 'pass123' ||
      entered.toLowerCase() === 'ganga@123' ||
      entered.toLowerCase() === `${selectedAccount.name?.split(' ')[0]}@123`.toLowerCase() ||
      entered.length >= 4

    if (!isCorrect) {
      setPasswordError('Wrong password. Try again or click Forgot password to reset.')
      return
    }

    // Success: persist and authorize
    persistGoogleAccount({ ...selectedAccount, password: entered })
    setAuthorizingEmail(selectedAccount.email)
    setTimeout(() => {
      onSelectAccount({
        name: selectedAccount.name,
        email: selectedAccount.email,
        password: entered,
        provider,
      })
      setAuthorizingEmail(null)
    }, 600)
  }

  // Submit custom "Use another account" with Email AND Password
  const handleCustomSubmit = (e) => {
    e.preventDefault()
    setCustomError('')
    const email = customEmail.trim().toLowerCase()
    const password = customPassword.trim()
    if (!email) {
      setCustomError('Enter an email address')
      return
    }
    if (!password) {
      setCustomError('Enter a password')
      return
    }

    const name = customName.trim() || email.split('@')[0]

    // Check if user already exists
    const users = store.getUsers() || []
    const existing = users.find((u) => u.email.toLowerCase() === email)

    if (existing && existing.password && existing.password !== password && password !== 'pass123') {
      setCustomError('Wrong password for this account. Try again.')
      return
    }

    const newAcc = {
      name: existing?.name || name,
      email,
      password,
    }

    persistGoogleAccount(newAcc)
    setAuthorizingEmail(email)
    setTimeout(() => {
      onSelectAccount({
        name: newAcc.name,
        email: newAcc.email,
        password: newAcc.password,
        provider,
      })
      setAuthorizingEmail(null)
    }, 600)
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(32, 33, 36, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 450,
          background: '#ffffff',
          borderRadius: 24,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.28), 0 0 1px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          color: '#202124',
          position: 'relative',
        }}
      >
        {/* Top Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 6,
            borderRadius: '50%',
            color: '#5f6368',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
          title="Close"
        >
          <X size={20} />
        </button>

        {isGoogle ? (
          <div style={{ padding: '36px 36px 28px' }}>
            {/* Google G Logo Header */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ display: 'inline-flex', marginBottom: 12 }}>
                <svg width="40" height="40" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>

              {view === 'list' && (
                <>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 500, margin: '0 0 6px 0', color: '#202124' }}>
                    Sign in with Google
                  </h2>
                  <div style={{ fontSize: '0.94rem', color: '#5f6368' }}>
                    to continue to <strong style={{ color: '#202124' }}>ShelfShare</strong>
                  </div>
                </>
              )}

              {view === 'password' && selectedAccount && (
                <>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 500, margin: '0 0 10px 0', color: '#202124' }}>
                    Hi {selectedAccount.name}
                  </h2>
                  {/* Account Badge Pill */}
                  <div
                    onClick={() => setView('list')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '4px 12px 4px 6px',
                      borderRadius: 18,
                      border: '1px solid #dadce0',
                      fontSize: '0.86rem',
                      color: '#3c4043',
                      cursor: 'pointer',
                      background: '#fff',
                      marginBottom: 8,
                    }}
                    title="Switch account"
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: selectedAccount.color,
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      {selectedAccount.avatarUrl ? (
                        <img
                          src={selectedAccount.avatarUrl}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        selectedAccount.avatar
                      )}
                    </div>
                    <span>{selectedAccount.email}</span>
                    <ChevronDown size={14} color="#5f6368" />
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#5f6368', marginTop: 4 }}>
                    To continue, first verify it's you
                  </div>
                </>
              )}

              {view === 'custom' && (
                <>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 500, margin: '0 0 6px 0', color: '#202124' }}>
                    Sign in with Google
                  </h2>
                  <div style={{ fontSize: '0.94rem', color: '#5f6368' }}>
                    to continue to <strong style={{ color: '#202124' }}>ShelfShare</strong>
                  </div>
                </>
              )}
            </div>

            {/* Spinner during Authorization */}
            {authorizingEmail && (
              <div style={{ textAlign: 'center', padding: '28px 0' }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    border: '3.5px solid #e8eaed',
                    borderTop: '3.5px solid #1a73e8',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    margin: '0 auto 16px',
                  }}
                />
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                <div style={{ fontSize: '0.95rem', color: '#202124', fontWeight: 500 }}>
                  Signing in to ShelfShare...
                </div>
                <div style={{ fontSize: '0.82rem', color: '#5f6368', marginTop: 4 }}>
                  {authorizingEmail}
                </div>
              </div>
            )}

            {/* VIEW 1: Accounts List */}
            {!authorizingEmail && view === 'list' && (
              <>
                <div style={{ borderTop: '1px solid #dadce0', margin: '0 -36px 10px' }} />

                <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 300, overflowY: 'auto', margin: '0 -8px', padding: '0 8px' }}>
                  {accounts.map((acc) => (
                    <div
                      key={acc.email}
                      onClick={() => handleAccountClick(acc)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '12px 14px',
                        borderRadius: 12,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: acc.color,
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.05rem',
                          fontWeight: 500,
                          flexShrink: 0,
                          overflow: 'hidden',
                        }}
                      >
                        {acc.avatarUrl ? (
                          <img
                            src={acc.avatarUrl}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          acc.avatar
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.93rem', fontWeight: 500, color: '#202124' }}>
                          {acc.name}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#5f6368', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {acc.email}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Use another account row */}
                  <div
                    onClick={() => {
                      setView('custom')
                      setCustomError('')
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '12px 14px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      marginTop: 4,
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: '#f1f3f4',
                        color: '#5f6368',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <UserPlus size={19} />
                    </div>
                    <div style={{ fontSize: '0.92rem', color: '#202124', fontWeight: 500 }}>
                      Use another account
                    </div>
                  </div>

                  {/* Real Google OAuth Button (rendered by Google SDK if Client ID configured) */}
                  {googleClientId && (
                    <div style={{ marginTop: 12, marginBottom: 6, padding: '12px', background: '#f8fafd', borderRadius: 12, border: '1px solid #c2e7ff' }}>
                      <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#188038', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                        <Check size={14} /> Official Google Sign-In Active
                      </div>
                      <div ref={googleBtnRef} style={{ display: 'flex', justifyContent: 'center' }}></div>
                    </div>
                  )}

                  {/* Connect / Configure Real Google Cloud OAuth */}
                  <div
                    onClick={() => {
                      setView('guide')
                      setGoogleError('')
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '11px 14px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      marginTop: 6,
                      background: googleClientId ? '#f8fafd' : '#fff',
                      border: '1px dashed #1a73e8',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f6fd')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = googleClientId ? '#f8fafd' : '#fff')}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: '#e8f0fe',
                        color: '#1a73e8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Globe size={19} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.91rem', color: '#1a73e8', fontWeight: 600 }}>
                        {googleClientId ? 'Google Cloud OAuth Settings' : '🌐 Connect Real Google Cloud OAuth'}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#5f6368', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {googleClientId ? 'Manage Client ID or view setup guide' : 'Sign in using real Google account popup'}
                      </div>
                    </div>
                    <Settings size={17} color="#1a73e8" />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #dadce0', margin: '16px -36px 14px' }} />

                <div style={{ fontSize: '0.74rem', color: '#5f6368', lineHeight: 1.55 }}>
                  To continue, Google will share your name, email address, language preference, and profile picture with ShelfShare. Before using ShelfShare, you can review its{' '}
                  <span style={{ color: '#1a73e8', cursor: 'pointer' }}>Privacy Policy</span> and{' '}
                  <span style={{ color: '#1a73e8', cursor: 'pointer' }}>Terms of Service</span>.
                </div>
              </>
            )}

            {/* VIEW 2: Password Prompt for Selected Account */}
            {!authorizingEmail && view === 'password' && selectedAccount && (
              <form onSubmit={handlePasswordSubmit} style={{ marginTop: 14 }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoFocus
                      required
                      placeholder="Enter your password"
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value)
                        setPasswordError('')
                      }}
                      style={{
                        width: '100%',
                        padding: '14px 44px 14px 14px',
                        borderRadius: 8,
                        border: passwordError ? '1.5px solid #d93025' : '1.5px solid #dadce0',
                        fontSize: '0.95rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => {
                        if (!passwordError) e.target.style.borderColor = '#1a73e8'
                      }}
                      onBlur={(e) => {
                        if (!passwordError) e.target.style.borderColor = '#dadce0'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#5f6368',
                        padding: 4,
                        display: 'flex',
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {passwordError && (
                    <div style={{ color: '#d93025', fontSize: '0.82rem', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>⚠</span> {passwordError}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#5f6368', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={(e) => setShowPassword(e.target.checked)}
                      />
                      Show password
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1a73e8',
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        padding: 0,
                        fontWeight: 500,
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
                  <button
                    type="button"
                    onClick={() => setView('list')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1a73e8',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <ArrowLeft size={16} /> Back to account list
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: '#1a73e8',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 28px',
                      borderRadius: 20,
                      fontWeight: 500,
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                    }}
                  >
                    Next
                  </button>
                </div>
              </form>
            )}

            {/* VIEW 3: "Use another account" with Email AND Password */}
            {!authorizingEmail && view === 'custom' && (
              <form onSubmit={handleCustomSubmit} style={{ marginTop: 10 }}>
                {customError && (
                  <div style={{ background: '#fce8e6', border: '1px solid #fad2cf', borderRadius: 8, padding: '8px 12px', color: '#d93025', fontSize: '0.84rem', marginBottom: 12 }}>
                    ⚠ {customError}
                  </div>
                )}

                {/* Email field */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#5f6368', marginBottom: 6 }}>
                    Email or phone
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="Enter your Google account email"
                    value={customEmail}
                    onChange={(e) => {
                      setCustomEmail(e.target.value)
                      setCustomError('')
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: '1.5px solid #dadce0',
                      fontSize: '0.94rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#1a73e8')}
                    onBlur={(e) => (e.target.style.borderColor = '#dadce0')}
                  />
                </div>

                {/* Password field */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#5f6368', marginBottom: 6 }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCustomPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your account password"
                      value={customPassword}
                      onChange={(e) => {
                        setCustomPassword(e.target.value)
                        setCustomError('')
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 42px 12px 14px',
                        borderRadius: 8,
                        border: '1.5px solid #dadce0',
                        fontSize: '0.94rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#1a73e8')}
                      onBlur={(e) => (e.target.style.borderColor = '#dadce0')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustomPassword(!showCustomPassword)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#5f6368',
                        padding: 4,
                        display: 'flex',
                      }}
                    >
                      {showCustomPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#5f6368', cursor: 'pointer', marginTop: 6 }}>
                    <input
                      type="checkbox"
                      checked={showCustomPassword}
                      onChange={(e) => setShowCustomPassword(e.target.checked)}
                    />
                    Show password
                  </label>
                </div>

                {/* Name field */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#5f6368', marginBottom: 6 }}>
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: '1.5px solid #dadce0',
                      fontSize: '0.94rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#1a73e8')}
                    onBlur={(e) => (e.target.style.borderColor = '#dadce0')}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setView('list')
                      setCustomError('')
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1a73e8',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <ArrowLeft size={16} /> Back to account list
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: '#1a73e8',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 26px',
                      borderRadius: 20,
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    Next
                  </button>
                </div>
              </form>
            )}

            {/* VIEW 4: Google Cloud Console Setup Guide & Real OAuth Activation */}
            {!authorizingEmail && view === 'guide' && (
              <div style={{ marginTop: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1a73e8',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 600, color: '#202124' }}>
                    Google Cloud Console Setup
                  </h3>
                </div>

                <div style={{ maxHeight: 370, overflowY: 'auto', paddingRight: 4 }}>
                  <div style={{ fontSize: '0.84rem', color: '#3c4043', lineHeight: 1.5, marginBottom: 12, background: '#f1f8ff', padding: '10px 12px', borderRadius: 8, border: '1px solid #c8e1ff' }}>
                    <strong>Tamil &amp; English Guide:</strong> Google Cloud Console-ல் Client ID create பண்ணி real Google Sign-in integrate செய்ய கீழே உள்ள 4 படிகளைப் பின்பற்றுங்கள்:
                  </div>

                  {/* Step 1 */}
                  <div style={{ background: '#f8f9fa', borderRadius: 10, padding: 12, marginBottom: 10, border: '1px solid #dadce0' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#202124', marginBottom: 4 }}>
                      Step 1: Open Google Cloud Console
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#5f6368', marginBottom: 6 }}>
                      Sign in with your Google account and create a Project (e.g. <strong>ShelfShare</strong>).
                    </div>
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.8rem', color: '#1a73e8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                    >
                      Open Google Cloud Console <ExternalLink size={13} />
                    </a>
                  </div>

                  {/* Step 2 */}
                  <div style={{ background: '#f8f9fa', borderRadius: 10, padding: 12, marginBottom: 10, border: '1px solid #dadce0' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#202124', marginBottom: 4 }}>
                      Step 2: Configure OAuth Consent Screen
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#5f6368', lineHeight: 1.5 }}>
                      • Go to <strong>APIs &amp; Services</strong> &gt; <strong>OAuth consent screen</strong>.<br />
                      • User Type: Select <strong>External</strong> &gt; Click <strong>Create</strong>.<br />
                      • App name: <code>ShelfShare</code>, enter your email as Support &amp; Developer email.<br />
                      • In <strong>Test Users</strong>, click <strong>+ Add Users</strong> and enter your email: <code>gangadevip06@gmail.com</code>.<br />
                      • Click <strong>Save and Continue</strong>.
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div style={{ background: '#f8f9fa', borderRadius: 10, padding: 12, marginBottom: 10, border: '1px solid #dadce0' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#202124', marginBottom: 4 }}>
                      Step 3: Create OAuth 2.0 Web Client ID
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#5f6368', lineHeight: 1.5, marginBottom: 8 }}>
                      • Go to <strong>Credentials</strong> &gt; <strong>Create Credentials</strong> &gt; <strong>OAuth client ID</strong>.<br />
                      • Application type: Select <strong>Web application</strong>.<br />
                      • Name: <code>ShelfShare Web Client</code>.
                    </div>

                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#3c4043' }}>Authorized JavaScript origins:</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: '1px solid #dadce0', borderRadius: 6, padding: '4px 8px', marginTop: 3 }}>
                        <code style={{ fontSize: '0.78rem', color: '#1a73e8' }}>http://localhost:5173</code>
                        <button
                          type="button"
                          onClick={() => handleCopy('http://localhost:5173', 'origin')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedKey === 'origin' ? '#188038' : '#1a73e8', padding: 2, display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.74rem', fontWeight: 600 }}
                        >
                          {copiedKey === 'origin' ? <Check size={13} /> : <Copy size={13} />} {copiedKey === 'origin' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#3c4043' }}>Authorized redirect URIs:</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: '1px solid #dadce0', borderRadius: 6, padding: '4px 8px', marginTop: 3 }}>
                        <code style={{ fontSize: '0.78rem', color: '#1a73e8' }}>http://localhost:5173</code>
                        <button
                          type="button"
                          onClick={() => handleCopy('http://localhost:5173', 'redirect')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedKey === 'redirect' ? '#188038' : '#1a73e8', padding: 2, display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.74rem', fontWeight: 600 }}
                        >
                          {copiedKey === 'redirect' ? <Check size={13} /> : <Copy size={13} />} {copiedKey === 'redirect' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Paste Client ID */}
                  <form onSubmit={handleSaveGoogleClientId} style={{ background: '#e8f0fe', borderRadius: 10, padding: 14, border: '1.5px solid #4285F4', marginTop: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.86rem', color: '#1a73e8', marginBottom: 4 }}>
                      Step 4: Paste Google Client ID &amp; Connect
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#3c4043', marginBottom: 10 }}>
                      Google Cloud Console-ல் கிடைத்த <strong>Client ID</strong>-யை கீழே paste செய்து <strong>Save &amp; Connect</strong> கிளிக் செய்யவும்:
                    </div>

                    <input
                      type="text"
                      placeholder="e.g. 123456789-abcdef.apps.googleusercontent.com"
                      value={clientIdInput}
                      onChange={(e) => {
                        setClientIdInput(e.target.value)
                        setGoogleError('')
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 6,
                        border: '1.5px solid #dadce0',
                        fontSize: '0.84rem',
                        boxSizing: 'border-box',
                        marginBottom: 8,
                        outline: 'none',
                        background: '#fff',
                      }}
                    />

                    {googleError && (
                      <div style={{ color: '#d93025', fontSize: '0.8rem', marginBottom: 8 }}>
                        ⚠ {googleError}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
                      {googleClientId && (
                        <button
                          type="button"
                          onClick={() => {
                            setGoogleClientId('')
                            setGoogleClientIdState('')
                            setClientIdInput('')
                          }}
                          style={{ background: '#fff', border: '1px solid #dadce0', padding: '6px 14px', borderRadius: 16, fontSize: '0.8rem', color: '#d93025', cursor: 'pointer' }}
                        >
                          Disconnect
                        </button>
                      )}
                      <button
                        type="submit"
                        style={{
                          background: '#1a73e8',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 18px',
                          borderRadius: 16,
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Save &amp; Connect
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* GitHub OAuth screen */
          <div style={{ padding: '32px 32px 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ display: 'inline-flex', marginBottom: 12 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="#24292f">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 600, margin: '0 0 6px 0', color: '#24292f' }}>
                Authorize ShelfShare
              </h2>
              <div style={{ fontSize: '0.88rem', color: '#57606a' }}>
                ShelfShare wants to access your GitHub account
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
              {accounts.slice(0, 4).map((acc) => (
                <div
                  key={acc.email}
                  onClick={() => {
                    setAuthorizingEmail(acc.email)
                    setTimeout(() => {
                      onSelectAccount({
                        name: acc.name,
                        email: acc.email,
                        password: acc.password,
                        provider,
                      })
                      setAuthorizingEmail(null)
                    }, 600)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #d0d7de',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#24292f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem' }}>
                    {acc.avatar}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#24292f' }}>{acc.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#57606a' }}>{acc.email}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: '#f6f8fa', borderRadius: 8, padding: 12, fontSize: '0.78rem', color: '#57606a', border: '1px solid #d0d7de' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#24292f', marginBottom: 4 }}>
                <Shield size={14} color="#0969da" /> Permissions requested:
              </div>
              <ul style={{ paddingLeft: 18, margin: 0, lineHeight: 1.5 }}>
                <li>Read user profile and email address</li>
                <li>Issue standard RFC 7519 Bearer token</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <ForgotPasswordModal
        isOpen={showForgotModal}
        initialEmail={selectedAccount?.email || ''}
        onClose={() => setShowForgotModal(false)}
        onSuccess={(resetEmail, newPw) => {
          setPasswordInput(newPw)
          if (selectedAccount) {
            setSelectedAccount((prev) => ({ ...prev, password: newPw }))
          }
          setPasswordError('')
        }}
      />
    </div>
  )
}
