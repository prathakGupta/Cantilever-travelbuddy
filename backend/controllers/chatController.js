const ChatMessage = require('../models/chat.model');
const User = require('../models/user.model');

// Get chat messages for an activity
const getChatMessages = async (req, res) => {
  try {
    const messages = await ChatMessage.find({ activityId: req.params.id })
      .sort({ timestamp: 1 })
      .limit(100);
    res.json(messages);
  } catch (err) {
    console.error('Get chat messages error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Post a new chat message
const postChatMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required.' });
    }
    
    // Get user details to include name
    const user = await User.findById(req.user.userId).select('name');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    const chatMsg = new ChatMessage({
      activityId: req.params.id,
      userId: req.user.userId,
      userName: user.name,
      message,
      timestamp: new Date(),
      type: 'user-message'
    });
    await chatMsg.save();
    res.status(201).json(chatMsg);
  } catch (err) {
    console.error('Post chat message error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  getChatMessages,
  postChatMessage
};
