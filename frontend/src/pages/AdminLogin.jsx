// pages/AdminLogin.jsx
// Separate login path for the platform's single admin account. Deliberately
// not linked from Register (there is no admin self-registration) and not
// advertised in the main navigation — only reachable via /admin-login,
// with a discreet link in the footer. No credentials are ever shown here;
// they live only in config/adminConfig.js on the server/build.
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { validateLoginForm } from '../utils/validation.js'

export default function AdminLogin() {
  const { adminLogin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
      await adminLogin(form.email, form.password)
      navigate('/admin')
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-visual" style={{ background: 'linear-gradient(160deg, #16241c, #2f6b4f)' }}>
        <span className="logo" style={{ color: '#fff' }}>
          <span className="logo-mark">
            <Sparkles size={16} strokeWidth={2.5} />
          </span>
          ShelfShare
        </span>
        <h2 style={{ color: '#fff', marginTop: 30, fontSize: '2rem' }}>Admin access</h2>
        <p style={{ color: 'rgba(255,255,255,0.85)', marginTop: 14, maxWidth: 360, lineHeight: 1.6 }}>
          Restricted area for platform administrators only. Regular members should use the
          standard login page instead.
        </p>
      </div>
      <div className="auth-form-side">
        <div className="auth-box">
          <h2>Admin Login</h2>
          <p style={{ color: 'var(--sage)', marginTop: 8, marginBottom: 26, fontSize: '0.92rem' }}>
            Not an admin? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Go to member login</Link>
          </p>

          {serverError && <div className="alert alert-error">{serverError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <input
                type="email"
                className={`form-control ${errors.email ? 'invalid' : ''}`}
                value={form.email}
                onChange={handleChange('email')}
                placeholder="admin email"
                autoComplete="off"
              />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className={`form-control ${errors.password ? 'invalid' : ''}`}
                value={form.password}
                onChange={handleChange('password')}
                placeholder="••••••••"
                autoComplete="off"
              />
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Logging in...' : 'Log In as Admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
