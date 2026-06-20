const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const http = require('http')
const { Server } = require('socket.io')
const connectDB = require('./config/db')
const createDefaultAdmin = require('./utils/createDefaultAdmin')

dotenv.config()

const app = express()
const server = http.createServer(app)

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

// Store io instance globally
global.io = io

// Socket connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('join', (userId) => {
    socket.join(userId)
    console.log(`User ${userId} joined their room`)
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

// Security middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again after 15 minutes'
  }
})
app.use(limiter)

// Routes
app.use('/api/auth',     require('./routes/auth.routes'))
app.use('/api/plots',    require('./routes/plot.routes'))
app.use('/api/files',    require('./routes/file.routes'))
app.use('/api/workflow', require('./routes/workflow.routes'))
app.use('/api/admin',    require('./routes/admin.routes'))

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'SRMS API is running' })
})

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  })
})

const PORT = process.env.PORT || 5000

connectDB().then((conn) => {
  if (conn) {
    createDefaultAdmin()
  }
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
})