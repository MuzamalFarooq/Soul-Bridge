const express = require('express');
const router = express.Router();
const {
  getConversations,
  getMessages,
  deleteMessage,
  uploadImage
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All chat routes are JWT protected
router.use(protect);

router.get('/conversations', getConversations);
router.get('/messages/:conversationId', getMessages);
router.delete('/message/:messageId', deleteMessage);
router.post('/upload-image', upload.single('image'), uploadImage);

module.exports = router;
