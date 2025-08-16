const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  register,
  login,
  getProfile,
  updateProfile,
  getNearbyUsers,
  searchUsers,
  followUser,
  unfollowUser
} = require('../controllers/userController');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.get('/nearby', auth, getNearbyUsers);
router.get('/search', auth, searchUsers);
router.post('/:userId/follow', auth, followUser);
router.post('/:userId/unfollow', auth, unfollowUser);

module.exports = router;
