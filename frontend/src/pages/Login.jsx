// pages/Login.jsx
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { validateLoginForm } from '../utils/validation.js'
import { ADMIN_ACCOUNT } from '../config/adminConfig.js'
import { useLanguage } from '../context/LanguageContext.jsx'
import OAuthModal from '../components/OAuthModal.jsx'
import ForgotPasswordModal from '../components/ForgotPasswordModal.jsx'
import { getGoogleClientId, signInWithGoogleDirect } from '../utils/googleOAuth.js'

export default function Login() {
  const { login, loginWithOAuth, quickLogin, DEMO_USERS } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [oauthState, setOauthState] = useState({ isOpen: false, provider: 'Google' })

  const openOAuth = (provider) => {
    setOauthState({ isOpen: true, provider })
  }

  const closeOAuth = () => {
    setOauthState({ isOpen: false, provider: 'Google' })
  }

  const handleGoogleLogin = () => {
    const cid = getGoogleClientId()
    if (cid) {
      setServerError('')
      signInWithGoogleDirect({
        onSuccess: (profile) => handleOAuthSuccess({ ...profile, provider: 'Google' }),
        onError: (err) => {
          if (err?.code === 'NO_CLIENT_ID') {
            openOAuth('Google')
          } else {
            setServerError(err.message || 'Google sign-in was canceled or failed.')
          }
        },
      })
    } else {
      openOAuth('Google')
    }
  }

  const handleOAuthSuccess = async (profile) => {
    closeOAuth()
    try {
      setSubmitting(true)
      await loginWithOAuth(oauthState.provider, profile)
      navigate('/profile')
    } catch (err) {
      setServerError(err.message || 'OAuth authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuickDemoLogin = async (account) => {
    try {
      setSubmitting(true)
      setServerError('')
      await quickLogin(account)
      if (account.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validateLoginForm(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    setServerError('')
    try {
      const loggedInUser = await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-visual">
        <span className="logo" style={{ color: '#fff' }}>
          <span className="logo-mark">
            <Sparkles size={16} strokeWidth={2.5} />
          </span>
          ShelfShare
        </span>
        <h2 style={{ color: '#fff', marginTop: 30, fontSize: '2rem' }}>Welcome back to the shelf.</h2>
        <p style={{ color: 'rgba(255,255,255,0.85)', marginTop: 14, maxWidth: 360, lineHeight: 1.6 }}>
          Log in to track your requests, chat with owners, and keep sharing with your community.
        </p>
      </div>
      <div className="auth-form-side">
        <div className="auth-box">
          <h2>{t('auth_login_title')}</h2>
          <p style={{ color: 'var(--sage)', marginTop: 8, marginBottom: 26, fontSize: '0.92rem' }}>
            {t('auth_login_newHere')} <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>{t('auth_login_createAccount')}</Link>
          </p>

          {/* OAuth Authentication Button */}
          <div style={{ marginBottom: 20 }}>
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={handleGoogleLogin}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                fontSize: '0.92rem',
                fontWeight: 600,
                padding: '10px 16px',
                border: '1.5px solid var(--border)',
                borderRadius: 10,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Google
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, color: 'var(--sage)', fontSize: '0.82rem' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span>or sign in with email</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {serverError && (
            <div className="alert alert-error">
              {serverError}
              {form.email.trim().toLowerCase() === ADMIN_ACCOUNT.email.toLowerCase() && (
                <div style={{ marginTop: 6 }}>
                  This looks like the admin account. Please use the{' '}
                  <Link to="/admin-login" style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}>Admin Login page</Link>{' '}
                  instead — regular member login won't accept it.
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">{t('auth_login_email')}</label>
              <input
                type="email"
                className={`form-control ${errors.email ? 'invalid' : ''}`}
                value={form.email}
                onChange={handleChange('email')}
                placeholder="you@example.com"
              />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">{t('auth_login_password')}</label>
              <input
                type="password"
                className={`form-control ${errors.password ? 'invalid' : ''}`}
                value={form.password}
                onChange={handleChange('password')}
                placeholder="••••••••"
              />
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button type="button" className="link-btn" onClick={() => setShowForgot(true)}>Forgot password?</button>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? `${t('common_loading')}` : t('auth_login_button')}
            </button>
          </form>

          {/* 1-Click Demo Login Bar */}
          <div style={{ marginTop: 24, padding: 14, background: 'var(--paper)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--primary)' }}>
                ⚡ 1-Click Verified Accounts & JWT
              </span>
              <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>5 Users + Admin</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--sage)', marginBottom: 12, lineHeight: 1.4 }}>
              Click any user to test the platform instantly with verified profiles & real Chennai inventory:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {DEMO_USERS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleQuickDemoLogin(acc)}
                  style={{
                    fontSize: '0.78rem',
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    borderColor: acc.role === 'admin' ? 'var(--accent)' : undefined
                  }}
                  title={acc.email}
                >
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: acc.role === 'admin' ? 'var(--accent)' : 'var(--primary)',
                    color: '#fff', fontSize: '0.68rem', fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {acc.name[0]}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {acc.name.split(' ')[0]} {acc.role === 'admin' && '👑'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p style={{ marginTop: 20, fontSize: '0.85rem', color: 'var(--sage)', textAlign: 'center' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Register</Link>
          </p>
          <p style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--sage)', textAlign: 'center' }}>
            Are you a platform administrator? <Link to="/admin-login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Admin Login</Link>
          </p>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={showForgot}
        initialEmail={form.email}
        onClose={() => setShowForgot(false)}
        onSuccess={(resetEmail, newPw) => {
          setForm({ email: resetEmail, password: newPw })
          setServerError('')
        }}
      />

      <OAuthModal
        isOpen={oauthState.isOpen}
        provider={oauthState.provider}
        onClose={closeOAuth}
        onSelectAccount={handleOAuthSuccess}
      />
    </div>
  )
}
