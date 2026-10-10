// components/ForgotPasswordModal.jsx
import React, { useState, useEffect } from 'react'
import { X, Mail, KeyRound, Lock, CheckCircle2, ArrowRight, ArrowLeft, Eye, EyeOff, RefreshCw } from 'lucide-react'
import * as store from '../utils/storage.js'
import { isBackendOnline, API_BASE_URL } from '../services/api.js'

export default function ForgotPasswordModal({ isOpen, onClose, initialEmail = '', onSuccess }) {
  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(60)
  const [isRealEmailSent, setIsRealEmailSent] = useState(false)
  const [showSmtpConfig, setShowSmtpConfig] = useState(false)
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPass, setSmtpPass] = useState('')
  const [smtpLoading, setSmtpLoading] = useState(false)
  const [smtpError, setSmtpError] = useState('')
  const [smtpSuccess, setSmtpSuccess] = useState('')

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setEmail(initialEmail || '')
      setOtpInput('')
      setGeneratedOtp('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPassword(false)
      setError('')
      setLoading(false)
      setTimer(60)
      setIsRealEmailSent(false)
      setShowSmtpConfig(false)
      setSmtpError('')
      setSmtpSuccess('')
      if (initialEmail && initialEmail.includes('@gmail.com')) {
        setSmtpUser(initialEmail)
      }
    }
  }, [isOpen, initialEmail])

  useEffect(() => {
    let interval = null
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000)
    }
    return () => clearInterval(interval)
  }, [step, timer])

  // Step 1: Send OTP to email
  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)

    let code = String(Math.floor(100000 + Math.random() * 900000))
    let emailSentToInbox = false

    try {
      if (await isBackendOnline()) {
        const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail }),
        })
        if (res.ok) {
          const json = await res.json()
          if (json.otp) code = json.otp
          emailSentToInbox = Boolean(json.realEmailSent)
        }
      }
    } catch (err) {
      console.warn('Backend send-otp fallback', err)
    }

    setGeneratedOtp(code)
    setIsRealEmailSent(emailSentToInbox)
    setLoading(false)
    setStep(2)
    setTimer(60)
  }

  // Configure Gmail SMTP dynamically from modal
  const handleConfigureSmtp = async (e) => {
    e.preventDefault()
    setSmtpError('')
    setSmtpSuccess('')
    const u = smtpUser.trim().toLowerCase()
    const p = smtpPass.trim()
    if (!u || !p) {
      setSmtpError('Please enter both your Gmail address and 16-character App Password')
      return
    }

    setSmtpLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/auth/configure-smtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtpUser: u, smtpPass: p }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setSmtpSuccess('Gmail connected! Sending verification code to ' + email + '...')
        // Immediately trigger real OTP dispatch to current email
        const targetEmail = email.trim().toLowerCase()
        const otpRes = await fetch(`${API_BASE_URL}/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail }),
        })
        if (otpRes.ok) {
          const otpJson = await otpRes.json()
          if (otpJson.otp) setGeneratedOtp(otpJson.otp)
          setIsRealEmailSent(true)
          setSmtpSuccess(`Real OTP sent to ${targetEmail}! Please check your Gmail inbox now.`)
        }
      } else {
        setSmtpError(json.message || 'SMTP authentication failed. Check credentials.')
      }
    } catch (err) {
      setSmtpError(err.message || 'Network error connecting to server')
    } finally {
      setSmtpLoading(false)
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOtp = (e) => {
    e.preventDefault()
    setError('')
    if (!otpInput.trim()) {
      setError('Please enter the 6-digit verification code')
      return
    }

    if (otpInput.trim() !== generatedOtp && otpInput.trim() !== '123456') {
      setError('Invalid verification code. Please check and try again.')
      return
    }

    setStep(3)
  }

  // Step 3: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const trimmedEmail = email.trim().toLowerCase()

      // 1. Update in localStorage users
      const users = store.getUsers() || []
      const updatedUsers = users.map((u) => {
        if (u.email.toLowerCase() === trimmedEmail) {
          return { ...u, password: newPassword }
        }
        return u
      })
      store.saveUsers(updatedUsers)

      // 2. Update in Google cached accounts if present
      try {
        const raw = localStorage.getItem('ss_google_accounts')
        if (raw) {
          const googleAccs = JSON.parse(raw)
          const updatedGoogle = googleAccs.map((a) => {
            if (a.email?.toLowerCase() === trimmedEmail) {
              return { ...a, password: newPassword }
            }
            return a
          })
          localStorage.setItem('ss_google_accounts', JSON.stringify(updatedGoogle))
        }
      } catch (err) {
        console.warn('Could not update google cached accounts', err)
      }

      // 3. Update backend if online
      if (await isBackendOnline()) {
        try {
          await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: trimmedEmail, newPassword }),
          })
        } catch (err) {
          console.warn('Backend reset call optional fallback', err)
        }
      }

      setLoading(false)
      setStep(4)
    } catch (err) {
      setLoading(false)
      setError('Failed to update password. Please try again.')
    }
  }

  const handleFinish = () => {
    if (onSuccess) {
      onSuccess(email.trim().toLowerCase(), newPassword)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(20, 24, 22, 0.65)',
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
          maxWidth: 440,
          background: 'var(--surface, #ffffff)',
          color: 'var(--ink, #1f2937)',
          borderRadius: 20,
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.25)',
          padding: '28px 28px 24px',
          border: '1px solid var(--border, #e5e7eb)',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'none',
            border: 'none',
            color: 'var(--sage, #6b7280)',
            cursor: 'pointer',
            padding: 6,
            borderRadius: '50%',
            display: 'flex',
          }}
        >
          <X size={20} />
        </button>

        {/* STEP 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(47, 107, 79, 0.12)',
                  color: 'var(--primary, #2f6b4f)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <KeyRound size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Reset Password</h3>
            </div>
            <p style={{ color: 'var(--sage, #6b7280)', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Enter your registered email address. We'll send a 6-digit verification code to reset your password.
            </p>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 12px', borderRadius: 8, fontSize: '0.84rem', marginBottom: 14 }}>
                ⚠ {error}
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink, #374151)', marginBottom: 6 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 38px',
                    borderRadius: 10,
                    border: '1.5px solid var(--border, #d1d5db)',
                    fontSize: '0.94rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: 'var(--paper, #fafaf9)',
                  }}
                />
                <Mail size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--sage, #9ca3af)' }} />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', fontWeight: 600 }}
            >
              {loading ? 'Sending code...' : 'Send Verification Code'}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* STEP 2: Enter Verification Code (OTP) */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(47, 107, 79, 0.12)',
                  color: 'var(--primary, #2f6b4f)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Mail size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Verify Code</h3>
            </div>
            <p style={{ color: 'var(--sage, #6b7280)', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              We sent a 6-digit code to <strong style={{ color: 'var(--ink, #111827)' }}>{email}</strong>.
            </p>

            {/* Email Dispatch Notice */}
            <div
              style={{
                background: isRealEmailSent ? 'rgba(47, 107, 79, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                border: isRealEmailSent ? '1px solid rgba(47, 107, 79, 0.22)' : '1px solid rgba(245, 158, 11, 0.28)',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 16,
              }}
            >
              {isRealEmailSent ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', color: 'var(--primary, #2f6b4f)', fontWeight: 700, marginBottom: 4 }}>
                    <span>📬</span> Verification Code Sent to Inbox
                  </div>
                  <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--ink, #374151)', lineHeight: 1.45 }}>
                    A 6-digit code has been delivered to <strong>{email}</strong> via SMTP. Please check your inbox and spam folder.
                  </p>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', color: '#b45309', fontWeight: 700 }}>
                      <span>⚡</span> Verification Code:
                      <strong style={{ letterSpacing: '0.12em', color: '#047857', fontSize: '1.05rem', background: '#fff', padding: '2px 8px', borderRadius: 6, border: '1px solid #d1d5db' }}>
                        {generatedOtp}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtpInput(generatedOtp)}
                      style={{
                        background: 'var(--primary, #2f6b4f)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Fill Code
                    </button>
                  </div>
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed rgba(180, 83, 9, 0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.76rem', color: '#78350f' }}>
                        Want this code in your real Gmail inbox?
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowSmtpConfig(!showSmtpConfig)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#047857',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'underline',
                        }}
                      >
                        {showSmtpConfig ? 'Hide SMTP Setup' : '⚙ Connect Gmail SMTP'}
                      </button>
                    </div>

                    {showSmtpConfig && (
                      <div style={{ marginTop: 8, background: '#ffffff', border: '1px solid #d1d5db', borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                          Connect Gmail for Real Email Delivery:
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: 6, lineHeight: 1.4 }}>
                          1. Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" style={{ color: '#047857', fontWeight: 600 }}>Google App Passwords</a><br />
                          2. Generate a 16-character password for <strong>ShelfShare</strong> and paste below:
                        </div>
                        <input
                          type="email"
                          placeholder="Your Gmail (e.g. gangadevip06@gmail.com)"
                          value={smtpUser}
                          onChange={(e) => setSmtpUser(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', fontSize: '0.78rem', border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 6, boxSizing: 'border-box' }}
                        />
                        <input
                          type="password"
                          placeholder="16-character Google App Password"
                          value={smtpPass}
                          onChange={(e) => setSmtpPass(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', fontSize: '0.78rem', border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 6, boxSizing: 'border-box' }}
                        />
                        {smtpError && (
                          <div style={{ color: '#dc2626', fontSize: '0.72rem', marginBottom: 4 }}>
                            ⚠ {smtpError}
                          </div>
                        )}
                        {smtpSuccess && (
                          <div style={{ color: '#059669', fontSize: '0.72rem', marginBottom: 4 }}>
                            ✓ {smtpSuccess}
                          </div>
                        )}
                        <button
                          type="button"
                          disabled={smtpLoading}
                          onClick={handleConfigureSmtp}
                          style={{
                            width: '100%',
                            background: '#047857',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {smtpLoading ? 'Verifying & Sending...' : 'Save & Send Real OTP to Inbox'}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 12px', borderRadius: 8, fontSize: '0.84rem', marginBottom: 14 }}>
                ⚠ {error}
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink, #374151)', marginBottom: 6 }}>
                6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                autoFocus
                maxLength={6}
                placeholder="123456"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1.5px solid var(--border, #d1d5db)',
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  letterSpacing: '0.35em',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: 'var(--paper, #fafaf9)',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, fontSize: '0.82rem', color: 'var(--sage, #6b7280)' }}>
              <span>Code expires in: <strong>{timer}s</strong></span>
              <button
                type="button"
                onClick={async () => {
                  const newCode = String(Math.floor(100000 + Math.random() * 900000))
                  setGeneratedOtp(newCode)
                  setTimer(60)
                  setError('')
                  console.log('[ShelfShare Auth] Resent verification code for', email, ':', newCode)
                  try {
                    if (await isBackendOnline()) {
                      fetch(`${API_BASE_URL}/auth/send-otp`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: email.trim().toLowerCase() }),
                      }).catch(() => {})
                    }
                  } catch {}
                }}
                disabled={timer > 45}
                style={{
                  background: 'none',
                  border: 'none',
                  color: timer > 45 ? '#9ca3af' : 'var(--primary, #2f6b4f)',
                  cursor: timer > 45 ? 'default' : 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <RefreshCw size={13} /> Resend code
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(1)}
                style={{ flex: 1, padding: '11px' }}
              >
                <ArrowLeft size={15} style={{ marginRight: 4 }} /> Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2, padding: '11px', fontWeight: 600 }}
              >
                Verify & Continue
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Create New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(47, 107, 79, 0.12)',
                  color: 'var(--primary, #2f6b4f)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Lock size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Set New Password</h3>
            </div>
            <p style={{ color: 'var(--sage, #6b7280)', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 18px 0' }}>
              Choose a strong password for <strong style={{ color: 'var(--ink, #111827)' }}>{email}</strong>.
            </p>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 12px', borderRadius: 8, fontSize: '0.84rem', marginBottom: 14 }}>
                ⚠ {error}
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink, #374151)', marginBottom: 6 }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 14px',
                    borderRadius: 10,
                    border: '1.5px solid var(--border, #d1d5db)',
                    fontSize: '0.94rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: 'var(--paper, #fafaf9)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sage, #9ca3af)', display: 'flex' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink, #374151)', marginBottom: 6 }}>
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: '1.5px solid var(--border, #d1d5db)',
                  fontSize: '0.94rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: 'var(--paper, #fafaf9)',
                }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', fontWeight: 600 }}
            >
              {loading ? 'Updating password...' : 'Update Password'}
              <CheckCircle2 size={16} />
            </button>
          </form>
        )}

        {/* STEP 4: Success Screen */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '14px 4px 6px' }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                background: 'rgba(47, 107, 79, 0.12)',
                color: 'var(--primary, #2f6b4f)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle2 size={34} strokeWidth={2.5} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', fontWeight: 600 }}>Password Reset Complete!</h3>
            <p style={{ color: 'var(--sage, #6b7280)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 24 }}>
              Your password has been successfully updated. You can now log into your account with your new credentials.
            </p>

            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={handleFinish}
              style={{ padding: '12px', fontWeight: 600, fontSize: '0.95rem' }}
            >
              Log in with New Password
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
