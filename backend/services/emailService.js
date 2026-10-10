// services/emailService.js
const nodemailer = require('nodemailer')

// Configure transporter: uses environment variables if provided
let transporter = null

function getTransporter() {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT || 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass },
    })
  } else {
    // Fallback: local development logging
    transporter = {
      sendMail: async (options) => {
        console.log('====================================================')
        console.log(`[EMAIL DISPATCH] To: ${options.to}`)
        console.log(`[EMAIL DISPATCH] Subject: ${options.subject}`)
        console.log(`[EMAIL DISPATCH] Text: ${options.text}`)
        console.log('====================================================')
        return { messageId: `mock-${Date.now()}` }
      },
    }
  }

  return transporter
}

async function sendOtpEmail(toEmail, otpCode) {
  try {
    const mailer = getTransporter()
    const info = await mailer.sendMail({
      from: process.env.SMTP_FROM || '"ShelfShare Support" <support@shelfshare.com>',
      to: toEmail,
      subject: `Your ShelfShare Verification Code: ${otpCode}`,
      text: `Hello,\n\nYour ShelfShare password reset verification code is: ${otpCode}\n\nThis code will expire in 5 minutes.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nShelfShare Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; borderRadius: 12px; background: #ffffff;">
          <h2 style="color: #2f6b4f; margin-top: 0;">ShelfShare Verification Code</h2>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.5;">
            You requested a password reset for your ShelfShare account. Please use the following 6-digit code to complete the verification:
          </p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #2f6b4f;">${otpCode}</span>
          </div>
          <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">
            This code will expire in 5 minutes. If you did not request this password reset, please ignore this message.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            ShelfShare – Community Resource Sharing System
          </p>
        </div>
      `,
    })
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email sending error:', error.message)
    return { success: false, error: error.message }
  }
}

async function verifySmtp(user, pass) {
  try {
    const testTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    })
    await testTransporter.verify()
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

function resetTransporter() {
  transporter = null
}

module.exports = {
  sendOtpEmail,
  verifySmtp,
  resetTransporter,
}
