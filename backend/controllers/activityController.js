const Activity = require('../models/activity.model');
const User = require('../models/user.model');
const mongoose = require('mongoose'); // Added for debug endpoint

// Create activity
const createActivity = async (req, res) => {
  try {
    const { title, description, location, time, participantLimit, category, tags } = req.body;
    
    const activity = new Activity({
      title,
      description,
      location,
      time,
      participantLimit,
      category,
      tags,
      creator: req.user.userId,
      participants: [req.user.userId]
    });

    await activity.save();
    
    // Populate creator details
    await activity.populate('creator', 'name');
    
    res.status(201).json(activity);
  } catch (err) {
    console.error('Create activity error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all activities
const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate('creator', 'name')
      .populate('participants', 'name')
      .sort({ createdAt: -1 });
    
    res.json(activities);
  } catch (err) {
    console.error('Get activities error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get activity by ID
const getActivityById = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('creator', 'name')
      .populate('participants', 'name');
    
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    res.json(activity);
  } catch (err) {
    console.error('Get activity error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Join activity
const joinActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    if (activity.participants.includes(req.user.userId)) {
      return res.status(400).json({ message: 'Already joined this activity' });
    }
    
    if (activity.participants.length >= activity.participantLimit) {
      return res.status(400).json({ message: 'Activity is full' });
    }
    
    activity.participants.push(req.user.userId);
    await activity.save();
    
    res.json({ message: 'Joined activity successfully' });
  } catch (err) {
    console.error('Join activity error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Leave activity
const leaveActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    if (!activity.participants.includes(req.user.userId)) {
      return res.status(400).json({ message: 'Not joined this activity' });
    }
    
    if (activity.creator.toString() === req.user.userId) {
      return res.status(400).json({ message: 'Creator cannot leave activity' });
    }
    
    activity.participants = activity.participants.filter(
      id => id.toString() !== req.user.userId
    );
    await activity.save();
    
    res.json({ message: 'Left activity successfully' });
  } catch (err) {
    console.error('Leave activity error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete activity
const deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    if (activity.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this activity' });
    }
    
    await Activity.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Activity deleted successfully' });
  } catch (err) {
    console.error('Delete activity error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's activities
const getMyActivities = async (req, res) => {
  try {
    const created = await Activity.find({ creator: req.user.userId })
      .populate('creator', 'name')
      .populate('participants', 'name')
      .sort({ createdAt: -1 });
    
    const joined = await Activity.find({
      participants: req.user.userId,
      creator: { $ne: req.user.userId }
    })
      .populate('creator', 'name')
      .populate('participants', 'name')
      .sort({ createdAt: -1 });
    
    res.json({ created, joined });
  } catch (err) {
    console.error('Get my activities error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get activities for a specific user
const getUserActivities = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const created = await Activity.find({ creator: userId })
      .populate('creator', 'name')
      .populate('participants', 'name')
      .sort({ createdAt: -1 });
    
    const joined = await Activity.find({
      participants: userId,
      creator: { $ne: userId }
    })
      .populate('creator', 'name')
      .populate('participants', 'name')
      .sort({ createdAt: -1 });
    
    res.json({ created, joined });
  } catch (err) {
    console.error('Get user activities error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get categories
const getCategories = async (req, res) => {
  try {
    const categories = [
      { value: 'dinner', label: 'Dinner', icon: '🍽️' },
      { value: 'hiking', label: 'Hiking', icon: '🏔️' },
      { value: 'coworking', label: 'Co-working', icon: '💼' },
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
    console.error('Get categories error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Search activities
const searchActivities = async (req, res) => {
  try {
    const { q, category, location, date } = req.query;
    console.log('Activity search query parameters:', { q, category, location, date });
    
    let query = {};

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.time = {
        $gte: searchDate,
        $lt: nextDay
      };
    }

    console.log('Final activity search query:', JSON.stringify(query, null, 2));

    const activities = await Activity.find(query)
      .populate('creator', 'name')
      .populate('participants', 'name')
      .sort({ time: 1 });

    console.log(`Found ${activities.length} activities matching search criteria`);
    
    res.json(activities);
  } catch (err) {
    console.error('Search activities error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createActivity,
  getActivities,
  getActivityById,
  joinActivity,
  leaveActivity,
  deleteActivity,
  getMyActivities,
  getUserActivities,
  getCategories,
  searchActivities
};
