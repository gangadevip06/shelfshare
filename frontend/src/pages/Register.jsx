// pages/Register.jsx
import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { validateRegisterForm } from '../utils/validation.js'
import { useLanguage } from '../context/LanguageContext.jsx'
import OAuthModal from '../components/OAuthModal.jsx'
import { getGoogleClientId, signInWithGoogleDirect } from '../utils/googleOAuth.js'

const EMPTY_FORM = {
  fullName: '', phone: '', address: '',
  email: '', password: '', confirmPassword: '', referralCode: '',
}

export default function Register() {
  const { register, loginWithOAuth } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({ ...EMPTY_FORM, referralCode: searchParams.get('ref') || '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
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
      setServerError(err.message || 'OAuth registration failed')
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
    const validationErrors = validateRegisterForm(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    setServerError('')
    try {
      await register(form)
      setSuccess(true)
      setForm(EMPTY_FORM)
      setTimeout(() => navigate('/login'), 1200)
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
        <h2 style={{ color: '#fff', marginTop: 30, fontSize: '2rem' }}>Join a shelf full of neighbours.</h2>
        <p style={{ color: 'rgba(255,255,255,0.85)', marginTop: 14, maxWidth: 360, lineHeight: 1.6 }}>
          Create an account to list resources, rent or buy from people nearby, and start sharing with your community.
        </p>
      </div>
      <div className="auth-form-side">
        <div className="auth-box">
          <h2>{t('auth_register_title')}</h2>
          <p style={{ color: 'var(--sage)', marginTop: 8, marginBottom: 22, fontSize: '0.92rem' }}>
            {t('auth_register_haveAccount')} <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>{t('auth_register_login')}</Link>
          </p>

          {/* OAuth Fast Sign-up Button */}
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
            <span>or register with email</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {serverError && <div className="alert alert-error">{serverError}</div>}
          {success && <div className="alert alert-success">Account created! Redirecting to login...</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className={`form-control ${errors.fullName ? 'invalid' : ''}`}
                value={form.fullName}
                onChange={handleChange('fullName')}
                placeholder="e.g. Sanjay Kumar"
              />
              {errors.fullName && <div className="form-error">{errors.fullName}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                className={`form-control ${errors.phone ? 'invalid' : ''}`}
                value={form.phone}
                onChange={handleChange('phone')}
                placeholder="10-digit number"
              />
              {errors.phone && <div className="form-error">{errors.phone}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input
                className={`form-control ${errors.address ? 'invalid' : ''}`}
                value={form.address}
                onChange={handleChange('address')}
                placeholder="Area, City (used for Nearby Resources)"
              />
              {errors.address && <div className="form-error">{errors.address}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className={`form-control ${errors.email ? 'invalid' : ''}`}
                value={form.email}
                onChange={handleChange('email')}
                placeholder="you@example.com"
              />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className={`form-control ${errors.password ? 'invalid' : ''}`}
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder="Min 6 characters"
                />
                {errors.password && <div className="form-error">{errors.password}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className={`form-control ${errors.confirmPassword ? 'invalid' : ''}`}
                  value={form.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  placeholder="Re-enter password"
                />
                {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Referral Code (optional)</label>
              <input
                className="form-control"
                value={form.referralCode}
                onChange={handleChange('referralCode')}
                placeholder="e.g. SAN4F92X"
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? t('common_loading') : t('auth_register_button')}
            </button>
          </form>
        </div>
      </div>

      <OAuthModal
        isOpen={oauthState.isOpen}
        provider={oauthState.provider}
        onClose={closeOAuth}
        onSelectAccount={handleOAuthSuccess}
      />
    </div>
  )
}
