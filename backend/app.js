// app.js - ShelfShare Express Application
const express = require('express')
const cors = require('cors')

// Route handlers
const authRoutes = require('./routes/auth')
const resourceRoutes = require('./routes/resources')
const requestRoutes = require('./routes/requests')
const categoryRoutes = require('./routes/categories')
const wishlistRoutes = require('./routes/wishlist')
const messageRoutes = require('./routes/messages')
const notificationRoutes = require('./routes/notifications')
const reportRoutes = require('./routes/reports')
const userRoutes = require('./routes/users')

const app = express()

// Global Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'ShelfShare Community Resource Sharing API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// Mount API Routes
app.use('/api/auth', authRoutes)
app.use('/api/resources', resourceRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/users', userRoutes)

// 404 handler for undefined endpoints
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.originalUrl}` })
})

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('API Error:', err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  })
})

module.exports = app
