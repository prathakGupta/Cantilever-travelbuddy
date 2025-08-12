const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const User = require('./user.model');
const Activity = require('./activity.model');
const Notification = require('./notification.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper function to create notifications
async function createNotification(recipientId, senderId, activityId, type, title, message) {
  try {
    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      activity: activityId,
      type,
      title,
      message
    });
    await notification.save();
    
    // Emit real-time notification via Socket.io
    io.to(`user-${recipientId}`).emit('new-notification', {
      id: notification._id,
      type,
      title,
      message,
      createdAt: notification.createdAt
    });
  } catch (err) {
    console.error('Error creating notification:', err);
  }
}

// JWT auth middleware
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token.' });
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user's personal room for notifications
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
  });

  socket.on('join-activity', async (data) => {
    const { activityId, userId, userName } = data;
    socket.join(`activity-${activityId}`);
    socket.to(`activity-${activityId}`).emit('user-joined', {
      userId,
      userName,
      message: `${userName} joined the chat`
    });
  });

  socket.on('leave-activity', async (data) => {
    const { activityId, userId, userName } = data;
    socket.leave(`activity-${activityId}`);
    socket.to(`activity-${activityId}`).emit('user-left', {
      userId,
      userName,
      message: `${userName} left the chat`
    });
  });

  socket.on('send-message', async (data) => {
    const { activityId, userId, userName, message, timestamp } = data;
    const messageData = {
      userId,
      userName,
      message,
      timestamp: timestamp || new Date().toISOString(),
      type: 'user-message'
    };
    
    // Broadcast to all users in the activity room
    io.to(`activity-${activityId}`).emit('new-message', messageData);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get current user profile (protected)
app.get('/api/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Update user profile (protected)
app.put('/api/profile', auth, async (req, res) => {
  try {
    const { name, bio, location, interests, profilePicture, isPublic } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (interests !== undefined) updateData.interests = interests;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, select: '-password' }
    );
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Search users
app.get('/api/users/search', auth, async (req, res) => {
  try {
    const { q, location, interests } = req.query;
    let query = { _id: { $ne: req.user.userId } }; // Exclude current user
    
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } }
      ];
    }
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    if (interests) {
      const interestArray = interests.split(',').map(i => i.trim());
      query.interests = { $in: interestArray };
    }
    
    const users = await User.find(query)
      .select('name bio location interests profilePicture followers following isPublic lastActive')
      .limit(20);
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get user profile by ID
app.get('/api/users/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'name profilePicture')
      .populate('following', 'name profilePicture');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    // Check if current user is following this user
    const isFollowing = user.followers.some(follower => follower._id.toString() === req.user.userId);
    
    res.json({ ...user.toObject(), isFollowing });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Follow a user
app.post('/api/users/:id/follow', auth, async (req, res) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: 'Cannot follow yourself.' });
    }
    
    const userToFollow = await User.findById(req.params.id);
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    const currentUser = await User.findById(req.user.userId);
    
    // Check if already following
    if (currentUser.following.includes(req.params.id)) {
      return res.status(400).json({ message: 'Already following this user.' });
    }
    
    // Add to following and followers
    await User.findByIdAndUpdate(req.user.userId, {
      $push: { following: req.params.id }
    });
    
    await User.findByIdAndUpdate(req.params.id, {
      $push: { followers: req.user.userId }
    });
    
    // Create notification
    await createNotification(
      req.params.id,
      req.user.userId,
      null,
      'new_follower',
      'New Follower',
      `${currentUser.name} started following you`
    );
    
    res.json({ message: 'Successfully followed user.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Unfollow a user
app.post('/api/users/:id/unfollow', auth, async (req, res) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: 'Cannot unfollow yourself.' });
    }
    
    const userToUnfollow = await User.findById(req.params.id);
    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    const currentUser = await User.findById(req.user.userId);
    
    // Check if not following
    if (!currentUser.following.includes(req.params.id)) {
      return res.status(400).json({ message: 'Not following this user.' });
    }
    
    // Remove from following and followers
    await User.findByIdAndUpdate(req.user.userId, {
      $pull: { following: req.params.id }
    });
    
    await User.findByIdAndUpdate(req.params.id, {
      $pull: { followers: req.user.userId }
    });
    
    res.json({ message: 'Successfully unfollowed user.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get user's followers
app.get('/api/users/:id/followers', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'name bio location interests profilePicture')
      .select('followers');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    res.json(user.followers);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get user's following
app.get('/api/users/:id/following', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'name bio location interests profilePicture')
      .select('following');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    res.json(user.following);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get user recommendations
app.get('/api/users/recommendations', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    const followingIds = currentUser.following;
    
    // Find users with similar interests who are not already followed
    const recommendations = await User.find({
      _id: { $ne: req.user.userId, $nin: followingIds },
      interests: { $in: currentUser.interests },
      isPublic: true
    })
    .select('name bio location interests profilePicture followers')
    .limit(10);
    
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Update last active
app.put('/api/users/last-active', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.userId, {
      lastActive: new Date()
    });
    res.json({ message: 'Last active updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Create activity
app.post('/api/activities', auth, async (req, res) => {
  try {
    const { title, description, location, time, participantLimit, category, tags } = req.body;
    const activity = new Activity({
      title,
      description,
      location,
      time,
      participantLimit,
      category,
      tags: tags || [],
      creator: req.user.userId,
      participants: [req.user.userId]
    });
    await activity.save();
    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get all categories
app.get('/api/categories', auth, async (req, res) => {
  try {
    const categories = [
      { value: 'dinner', label: 'Dinner', icon: '🍽️' },
      { value: 'hiking', label: 'Hiking', icon: '🏔️' },
      { value: 'co-working', label: 'Co-working', icon: '💼' },
      { value: 'sightseeing', label: 'Sightseeing', icon: '🏛️' },
      { value: 'sports', label: 'Sports', icon: '⚽' },
      { value: 'cultural', label: 'Cultural', icon: '🎭' },
      { value: 'nightlife', label: 'Nightlife', icon: '🌙' },
      { value: 'outdoor', label: 'Outdoor', icon: '🌲' },
      { value: 'indoor', label: 'Indoor', icon: '🏠' },
      { value: 'other', label: 'Other', icon: '📌' }
    ];
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Filter activities by category
app.get('/api/activities/category/:category', auth, async (req, res) => {
  try {
    const { category } = req.params;
    const activities = await Activity.find({ category })
      .populate('creator', 'name email')
      .populate('participants', 'name email');
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Search activities by title/location (query params)
app.get('/api/activities/search', auth, async (req, res) => {
  try {
    const { q, category } = req.query;
    let query = {};
    
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    const activities = await Activity.find(query)
      .populate('creator', 'name email')
      .populate('participants', 'name email');
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// List all activities
app.get('/api/activities', auth, async (req, res) => {
  try {
    const activities = await Activity.find().populate('creator', 'name email').populate('participants', 'name email');
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get activity details by ID
app.get('/api/activities/:id', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('creator', 'name email')
      .populate('participants', 'name email');
    if (!activity) return res.status(404).json({ message: 'Activity not found.' });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Update activity (only creator)
app.put('/api/activities/:id', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found.' });
    if (activity.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only the creator can update this activity.' });
    }
    const { title, description, location, time, participantLimit } = req.body;
    if (title !== undefined) activity.title = title;
    if (description !== undefined) activity.description = description;
    if (location !== undefined) activity.location = location;
    if (time !== undefined) activity.time = time;
    if (participantLimit !== undefined) activity.participantLimit = participantLimit;
    await activity.save();
    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get my activities (created or joined)
app.get('/api/my-activities', auth, async (req, res) => {
  try {
    const created = await Activity.find({ creator: req.user.userId })
      .populate('creator', 'name email')
      .populate('participants', 'name email');
    const joined = await Activity.find({ participants: req.user.userId, creator: { $ne: req.user.userId } })
      .populate('creator', 'name email')
      .populate('participants', 'name email');
    res.json({ created, joined });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Join an activity
app.post('/api/activities/:id/join', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found.' });
    if (activity.participants.includes(req.user.userId)) {
      return res.status(400).json({ message: 'Already joined.' });
    }
    if (activity.participants.length >= activity.participantLimit) {
      return res.status(400).json({ message: 'Activity is full.' });
    }
    activity.participants.push(req.user.userId);
    await activity.save();
    res.json({ message: 'Joined activity.' });
    await createNotification(req.user.userId, activity.creator, activity._id, 'activity-join', 'New Join', `${req.user.name} has joined your activity: ${activity.title}`);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Leave an activity
app.post('/api/activities/:id/leave', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found.' });
    const idx = activity.participants.indexOf(req.user.userId);
    if (idx === -1) return res.status(400).json({ message: 'Not a participant.' });
    // Prevent creator from leaving their own activity
    if (activity.creator.toString() === req.user.userId) {
      return res.status(400).json({ message: 'Creator cannot leave their own activity.' });
    }
    activity.participants.splice(idx, 1);
    await activity.save();
    res.json({ message: 'Left activity.' });
    await createNotification(req.user.userId, activity.creator, activity._id, 'activity-leave', 'Activity Left', `${req.user.name} has left your activity: ${activity.title}`);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Remove participant (only creator)
app.post('/api/activities/:id/remove', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found.' });
    if (activity.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only the creator can remove participants.' });
    }
    if (userId === req.user.userId) {
      return res.status(400).json({ message: 'Creator cannot remove themselves.' });
    }
    const idx = activity.participants.indexOf(userId);
    if (idx === -1) return res.status(400).json({ message: 'User is not a participant.' });
    activity.participants.splice(idx, 1);
    await activity.save();
    res.json({ message: 'Participant removed.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Delete an activity (only creator)
app.delete('/api/activities/:id', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found.' });
    if (activity.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only the creator can delete this activity.' });
    }
    await activity.deleteOne();
    res.json({ message: 'Activity deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get user notifications
app.get('/api/notifications', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.userId })
      .populate('sender', 'name')
      .populate('activity', 'title')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.userId },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.userId, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get unread notification count
app.get('/api/notifications/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.userId,
      isRead: false
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/travelbuddy';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('TravelBuddy backend is running!');
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
