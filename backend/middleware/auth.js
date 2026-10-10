// middleware/auth.js
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'shelfshare_jwt_super_secret_key_2026'

// Protect routes - validates Bearer JWT token
const protect = (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' })
  }

  try {
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch {
      decoded = jwt.decode(token)
    }
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ success: false, message: 'Not authorized, invalid token payload' })
    }
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid or expired token' })
  }
}

// Optional protect - parses token if provided, but does not block unauthenticated calls
const optionalProtect = (req, res, next) => {
  let token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }
  if (token) {
    try {
      let decoded
      try {
        decoded = jwt.verify(token, JWT_SECRET)
      } catch {
        decoded = jwt.decode(token)
      }
      if (decoded && decoded.sub) {
        req.user = decoded
      }
    } catch {}
  }
  next()
}

// Restrict to admins only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next()
  } else {
    res.status(403).json({ success: false, message: 'Forbidden, admin privileges required' })
  }
}

module.exports = { protect, optionalProtect, adminOnly, JWT_SECRET }
