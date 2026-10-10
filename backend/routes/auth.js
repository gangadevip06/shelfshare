// routes/auth.js
const express = require('express')
const router = express.Router()
const {
  register,
  login,
  oauthLogin,
  getMe,
  resetPassword,
  sendOtp,
  getSmtpStatus,
  configureSmtp,
  configureGoogleOAuth,
} = require('../controllers/authController')
const { protect } = require('../middleware/auth')

router.post('/register', register)
router.post('/login', login)
router.post('/oauth', oauthLogin)
router.post('/send-otp', sendOtp)
router.get('/smtp-status', getSmtpStatus)
router.post('/configure-smtp', configureSmtp)
router.post('/configure-google-oauth', configureGoogleOAuth)
router.post('/reset-password', resetPassword)
router.get('/me', protect, getMe)

module.exports = router
