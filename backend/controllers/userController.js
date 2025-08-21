const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register user
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with GeoJSON Point default coordinates
    user = new User({
      name,
      email,
      password: hashedPassword,
      coordinates: { type: 'Point', coordinates: [0, 0] }
    });

    await user.save();

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Don't allow password update here
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get nearby users
const getNearbyUsers = async (req, res) => {
  try {
    const { lng, lat, radius = 5000 } = req.query;
    
    if (!lng || !lat) {
      return res.status(400).json({ message: 'Longitude and latitude are required.' });
    }

    console.log('Nearby users query:', { lng, lat, radius, userId: req.user.userId });

    // Try geospatial query first - only for users with valid coordinates
    try {
      const users = await User.find({
        _id: { $ne: req.user.userId },
        coordinates: {
          $exists: true,
          $ne: null,
          $type: 'object'
        },
        'coordinates.coordinates': {
          $exists: true,
          $ne: [0, 0] // Exclude default coordinates
        }
      }).select('name bio location interests coordinates');

      // Calculate distances manually
      const usersWithDistance = users
        .map(u => {
          if (!u.coordinates || !u.coordinates.coordinates) return null;
          const [userLng, userLat] = u.coordinates.coordinates;
          const distance = calculateDistance(lat, lng, userLat, userLng);
          return { ...u.toObject(), distance };
        })
        .filter(u => u && u.distance <= radius)
        .sort((a, b) => a.distance - b.distance);

      console.log(`Found ${usersWithDistance.length} users within ${radius}m`);
      res.json(usersWithDistance);
    } catch (geoError) {
      console.log('Geospatial query failed, using manual calculation:', geoError.message);
      
      // Fallback: get all users and calculate distances manually
      const users = await User.find({
        _id: { $ne: req.user.userId }
      }).select('name bio location interests coordinates');

      const usersWithDistance = users
        .map(u => {
          if (!u.coordinates || !u.coordinates.coordinates) return null;
          const [userLng, userLat] = u.coordinates.coordinates;
          const distance = calculateDistance(lat, lng, userLat, userLng);
          return { ...u.toObject(), distance };
        })
        .filter(u => u && u.distance <= radius)
        .sort((a, b) => a.distance - b.distance);

      console.log(`Found ${usersWithDistance.length} users within ${radius}m (manual calculation)`);
      res.json(usersWithDistance);
    }
  } catch (err) {
    console.error('Get nearby users error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Search users
const searchUsers = async (req, res) => {
  try {
    const { q, location, interests } = req.query;
    let query = { _id: { $ne: req.user.userId } };

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
      const interestsArray = interests.split(',').map(i => i.trim());
      query.interests = { $in: interestsArray };
    }

    const users = await User.find(query).select('name bio location interests');
    res.json(users);
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Follow user
const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.user.userId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = await User.findById(req.user.userId);
    
    if (currentUser.following.includes(userId)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    currentUser.following.push(userId);
    userToFollow.followers.push(req.user.userId);

    await Promise.all([currentUser.save(), userToFollow.save()]);

    res.json({ message: 'User followed successfully' });
  } catch (err) {
    console.error('Follow user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Unfollow user
const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const currentUser = await User.findById(req.user.userId);
    const userToUnfollow = await User.findById(userId);
    
    if (!currentUser || !userToUnfollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    currentUser.following = currentUser.following.filter(id => id.toString() !== userId);
    userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== req.user.userId);

    await Promise.all([currentUser.save(), userToUnfollow.save()]);

    res.json({ message: 'User unfollowed successfully' });
  } catch (err) {
    console.error('Unfollow user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getNearbyUsers,
  searchUsers,
  followUser,
  unfollowUser
};
