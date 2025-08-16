const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getChatMessages,
  postChatMessage
} = require('../controllers/chatController');

// All routes are protected
router.use(auth);

// Chat endpoints
router.get('/:id/chat', getChatMessages);
router.post('/:id/chat', postChatMessage);

module.exports = router;
