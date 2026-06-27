require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const socketHandler = require('./sockets/socketHandler');

const app = express();
const server = http.createServer(app);

// Configure Socket.IO Server with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Pass Socket.IO server to our custom event socket handlers
socketHandler(io);

// Enable Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  })
);

// Standard Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security Feature: Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api/', apiLimiter);

// Serve Static Uploaded Images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API REST Routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'An internal server error occurred'
  });
});

// Serve root message
app.get('/', (req, res) => {
  res.json({ message: 'True Love Matchmaking and Chat API is running smoothly.' });
});

// Listen on Port
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  const dbConnected = await connectDB();
  if (!dbConnected) {
    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the other backend process or change PORT in backend/.env`);
      process.exit(1);
    }

    console.error('Server failed to start:', error.message);
    process.exit(1);
  });
};

startServer();
