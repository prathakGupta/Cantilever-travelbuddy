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
  getCategories
} = require('../controllers/activityController');

// All routes are protected
router.use(auth);

// Activity CRUD
router.post('/', createActivity);
router.get('/', getActivities);
router.get('/categories', getCategories);
router.get('/my-activities', getMyActivities);
router.get('/:id', getActivityById);
router.post('/:id/join', joinActivity);
router.post('/:id/leave', leaveActivity);
router.delete('/:id', deleteActivity);

module.exports = router;
