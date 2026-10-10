// config/db.js
const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shelfshare', {
      serverSelectionTimeoutMS: 5000,
    })
    console.log(` MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`)
  } catch (error) {
    console.warn(` MongoDB Connection Warning: ${error.message}`)
    console.log(' Application will continue running in dual-mode (mock/fallback resilience enabled).')
  }
}

module.exports = connectDB
