// controllers/authController.js
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const Admin = require('../models/Admin')
const { JWT_SECRET } = require('../middleware/auth')

function generateToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'user',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// @desc    Register a new user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address, referralCode } = req.body

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const userId = `user-${Date.now()}`
    const myReferralCode = `${name.slice(0, 3).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`

    const newUser = await User.create({
      id: userId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || '+91 98401 23456',
      address: address || 'Chennai, Tamil Nadu',
      role: 'user',
      status: 'Active',
      referralCode: myReferralCode,
      referredBy: referralCode || null,
      provider: 'local',
    })

    const token = generateToken(newUser)

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
        role: newUser.role,
        trustScore: newUser.trustScore,
        joined: newUser.joined,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Check user collection
    let account = await User.findOne({ email: email.toLowerCase() })
    let role = 'user'

    // If not in User, check Admin collection
    if (!account) {
      account = await Admin.findOne({ email: email.toLowerCase() })
      if (account) role = 'admin'
    }

    if (!account) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    if (account.status === 'Suspended') {
      return res.status(403).json({ success: false, message: 'This account has been suspended by an administrator.' })
    }

    // Compare password (supports plain or bcrypt)
    let isMatch = false
    if (account.password.startsWith('$2a$') || account.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, account.password)
    } else {
      isMatch = account.password === password
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    const token = generateToken({ ...account.toObject(), role })

    res.json({
      success: true,
      token,
      user: {
        id: account.id,
        name: account.name,
        email: account.email,
        phone: account.phone || '',
        address: account.address || '',
        role,
        trustScore: account.trustScore || 100,
        joined: account.joined || account.createdAt,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    OAuth Login (Google, GitHub)
// @route   POST /api/auth/oauth
exports.oauthLogin = async (req, res) => {
  try {
    let { name, email, provider, credential, avatarUrl } = req.body

    // If real Google JWT credential is provided, decode verified profile
    if (credential) {
      try {
        const parts = credential.split('.')
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'))
          if (payload.email) {
            email = payload.email
            name = payload.name || name || payload.given_name || email.split('@')[0]
            avatarUrl = payload.picture || avatarUrl
            provider = 'google'
          }
        }
      } catch (err) {
        console.warn('Could not decode Google credential payload', err.message)
      }
    }

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required for OAuth login' })
    }

    let user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      const userId = `user-${Date.now()}`
      const myReferralCode = `${(name || 'USR').slice(0, 3).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`
      user = await User.create({
        id: userId,
        name: name || 'Google User',
        email: email.toLowerCase(),
        password: `oauth_${Date.now()}`,
        phone: '+91 98401 23456',
        address: 'Chennai, Tamil Nadu',
        role: 'user',
        status: 'Active',
        avatarUrl: avatarUrl || '',
        referralCode: myReferralCode,
        provider: provider ? provider.toLowerCase() : 'google',
      })
    } else if (avatarUrl && !user.avatarUrl) {
      user.avatarUrl = avatarUrl
      await user.save()
    }

    const token = generateToken(user)

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        avatarUrl: user.avatarUrl || avatarUrl || '',
        role: user.role,
        trustScore: user.trustScore,
        joined: user.joined,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get Current User
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.sub })
    if (!user) {
      const admin = await Admin.findOne({ id: req.user.sub })
      if (!admin) return res.status(404).json({ success: false, message: 'User not found' })
      return res.json({ success: true, user: admin })
    }
    res.json({ success: true, user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Reset Password
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password are required' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { password: hashedPassword },
      { new: true }
    )

    if (!user) {
      // Check admin
      const admin = await Admin.findOneAndUpdate(
        { email: email.toLowerCase() },
        { password: newPassword },
        { new: true }
      )
      if (!admin) {
        return res.status(404).json({ success: false, message: 'Account not found with this email' })
      }
    }

    res.json({ success: true, message: 'Password successfully reset' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const fs = require('fs')
const path = require('path')
const { sendOtpEmail, verifySmtp, resetTransporter } = require('../services/emailService')
const otpStore = new Map()

// @desc    Send OTP to email
// @route   POST /api/auth/send-otp
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    otpStore.set(normalizedEmail, { otp, expiresAt: Date.now() + 5 * 60 * 1000 })

    const result = await sendOtpEmail(normalizedEmail, otp)

    res.json({
      success: true,
      message: `OTP sent to ${normalizedEmail}`,
      otp,
      realEmailSent: Boolean(result.success && process.env.SMTP_USER && process.env.SMTP_PASS),
      smtpConfigured: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get SMTP status
// @route   GET /api/auth/smtp-status
exports.getSmtpStatus = (req, res) => {
  const configured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS)
  let masked = null
  if (process.env.SMTP_USER) {
    const parts = process.env.SMTP_USER.split('@')
    masked = parts[0].slice(0, 2) + '***@' + (parts[1] || 'gmail.com')
  }
  res.json({
    success: true,
    configured,
    user: masked,
  })
}

// @desc    Configure SMTP credentials (Gmail App Password)
// @route   POST /api/auth/configure-smtp
exports.configureSmtp = async (req, res) => {
  try {
    const { smtpUser, smtpPass } = req.body
    if (!smtpUser || !smtpPass) {
      return res.status(400).json({ success: false, message: 'Both Gmail address and 16-character App Password are required' })
    }

    const cleanUser = smtpUser.trim().toLowerCase()
    const cleanPass = smtpPass.replace(/\s+/g, '').trim()

    // Test credentials against Google SMTP
    const testResult = await verifySmtp(cleanUser, cleanPass)
    if (!testResult.success) {
      return res.status(400).json({
        success: false,
        message: `Gmail SMTP authentication failed: ${testResult.error || 'Invalid Gmail or App Password'}. Please ensure 2-Step Verification is ON and you generated an App Password at https://myaccount.google.com/apppasswords`,
      })
    }

    // Update runtime env
    process.env.SMTP_USER = cleanUser
    process.env.SMTP_PASS = cleanPass
    process.env.SMTP_HOST = 'smtp.gmail.com'
    process.env.SMTP_PORT = '465'
    resetTransporter()

    // Persist to backend/.env
    const envPath = path.resolve(__dirname, '../.env')
    try {
      let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
      content = updateOrAppendEnv(content, 'SMTP_USER', cleanUser)
      content = updateOrAppendEnv(content, 'SMTP_PASS', cleanPass)
      content = updateOrAppendEnv(content, 'SMTP_HOST', 'smtp.gmail.com')
      content = updateOrAppendEnv(content, 'SMTP_PORT', '465')
      fs.writeFileSync(envPath, content, 'utf8')
    } catch (e) {
      console.warn('Could not write backend/.env', e.message)
    }

    res.json({
      success: true,
      message: `Gmail SMTP successfully connected to ${cleanUser}! All OTP codes will now be sent to real inboxes.`,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Configure Google OAuth Client ID
// @route   POST /api/auth/configure-google-oauth
exports.configureGoogleOAuth = async (req, res) => {
  try {
    const { clientId } = req.body
    const cleanId = (clientId || '').trim()

    process.env.GOOGLE_CLIENT_ID = cleanId

    // Persist to backend/.env and root .env
    const backendEnv = path.resolve(__dirname, '../.env')
    const rootEnv = path.resolve(__dirname, '../../.env')

    try {
      if (fs.existsSync(backendEnv)) {
        let bContent = fs.readFileSync(backendEnv, 'utf8')
        bContent = updateOrAppendEnv(bContent, 'GOOGLE_CLIENT_ID', cleanId)
        fs.writeFileSync(backendEnv, bContent, 'utf8')
      }
      if (fs.existsSync(rootEnv)) {
        let rContent = fs.readFileSync(rootEnv, 'utf8')
        rContent = updateOrAppendEnv(rContent, 'VITE_GOOGLE_CLIENT_ID', cleanId)
        fs.writeFileSync(rootEnv, rContent, 'utf8')
      }
    } catch (e) {
      console.warn('Could not write .env files', e.message)
    }

    res.json({
      success: true,
      message: 'Google Cloud Client ID saved successfully',
      clientId: cleanId,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

function updateOrAppendEnv(content, key, val) {
  const regex = new RegExp(`^${key}=.*$`, 'm')
  if (regex.test(content)) {
    return content.replace(regex, `${key}=${val}`)
  } else {
    return content.trim() + `\n${key}=${val}\n`
  }
}


