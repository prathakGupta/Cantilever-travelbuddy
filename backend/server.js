require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const passport = require('./config/passport');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Import routes
const userRoutes = require('./routes/userRoutes');
const activityRoutes = require('./routes/activityRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Import models
const User = require('./models/user.model');
const Notification = require('./models/notification.model');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/api/activities', activityRoutes);
app.use('/api', userRoutes);
app.use('/api/activities', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// Google OAuth routes
app.get('/auth/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign(
        { userId: req.user._id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      // Prepare user data
      const userData = {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email
      };

      // Redirect to frontend with token and user data
      const redirectUrl = `http://localhost:5173/auth-success?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect('http://localhost:5173/login?error=google_auth_failed');
    }
  }
);

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join activity chat room
  socket.on('join-activity', (data) => {
    socket.join(data.activityId);
    socket.to(data.activityId).emit('user-joined', {
      message: `${data.userName} joined the chat`
    });
  });

  // Leave activity chat room
  socket.on('leave-activity', (data) => {
    socket.to(data.activityId).emit('user-left', {
      message: `${data.userName} left the chat`
    });
    socket.leave(data.activityId);
  });

  // Handle chat messages
  socket.on('send-message', (messageData) => {
    socket.to(messageData.activityId).emit('new-message', messageData);
  });

  // Join user room for notifications
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
