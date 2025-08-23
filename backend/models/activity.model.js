const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  location: { type: String, required: true },
  time: { type: Date, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['dinner', 'hiking', 'coworking', 'sightseeing', 'sports', 'cultural', 'nightlife', 'outdoor', 'indoor', 'other']
  },
  tags: [{ type: String }],
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  participantLimit: { type: Number, default: 10 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Activity', activitySchema);
