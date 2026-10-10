const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })
const http = require('http')
const app = require('./app')
const connectDB = require('./config/db')

const PORT = process.env.PORT || 5000

// Connect to MongoDB
connectDB()

// Start Server
const server = http.createServer(app)

server.listen(PORT, () => {
  console.log(`=================================================`)
  console.log(` ShelfShare Backend REST API Server Running`)
  console.log(` URL: http://localhost:${PORT}`)
  console.log(` Health Check: http://localhost:${PORT}/api/health`)
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`=================================================`)
})

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`)
})
