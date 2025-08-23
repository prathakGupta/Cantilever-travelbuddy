const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createActivity,
  getActivities,
  getActivityById,
  joinActivity,
  leaveActivity,
  deleteActivity,
  getMyActivities,
  getCategories,
  getUserActivities,
  searchActivities,
  updateActivity
} = require('../controllers/activityController');

// All routes are protected
router.use(auth);

// Activity CRUD - Specific routes first
router.post('/', createActivity);
router.get('/', getActivities);
router.get('/search', searchActivities);
router.get('/categories', getCategories);
router.get('/my-activities', getMyActivities);
router.get('/user/:userId', getUserActivities);
router.put('/:id', updateActivity);

// Parameterized routes last
router.get('/:id', getActivityById);
router.post('/:id/join', joinActivity);
router.post('/:id/leave', leaveActivity);
router.delete('/:id', deleteActivity);

module.exports = router;
