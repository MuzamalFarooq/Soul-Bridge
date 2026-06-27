const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get all active conversations for the current user
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Find conversations involving this user
    let conversations = await Conversation.find({
      participants: currentUserId
    })
      .populate({
        path: 'participants',
        select: 'fullName profilePicture isOnline lastActive city gender'
      })
      .populate({
        path: 'lastMessage',
        select: 'content sender createdAt image isRead'
      })
      .sort({ updatedAt: -1 });

    // Exclude users on block lists and filter out self from participants list for frontend ease
    const filteredConversations = conversations
      .filter((convo) => {
        // Double check participants
        const otherParticipant = convo.participants.find(
          (p) => p._id.toString() !== currentUserId.toString()
        );

        if (!otherParticipant) return false;

        // Verify no blocks between participants
        const selfBlocked = req.user.blockedUsers.includes(otherParticipant._id);
        const theyBlocked = otherParticipant.blockedUsers?.includes(currentUserId);

        return !selfBlocked && !theyBlocked;
      })
      .map((convo) => {
        const convoObj = convo.toObject();
        // Extract the user whom we are chatting with
        convoObj.chatPartner = convo.participants.find(
          (p) => p._id.toString() !== currentUserId.toString()
        );
        return convoObj;
      });

    res.json({ success: true, count: filteredConversations.length, conversations: filteredConversations });
  } catch (error) {
    console.error('Conversations Fetch Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Get historical message feeds for a conversation
// @route   GET /api/chat/messages/:conversationId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;

    // Verify conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation thread not found' });
    }

    if (!conversation.participants.includes(currentUserId)) {
      return res.status(403).json({ success: false, message: 'Access denied: You are not a participant in this conversation' });
    }

    // Retrieve messages
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean();

    // Mark unread messages received by current user as read
    await Message.updateMany(
      { conversationId, recipient: currentUserId, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, count: messages.length, messages });
  } catch (error) {
    console.error('Messages Fetch Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Soft-delete a message (sets isDeleted to true)
// @route   DELETE /api/chat/message/:messageId
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Only allow sender to delete their own messages
    if (message.sender.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own messages' });
    }

    message.isDeleted = true;
    message.content = 'This message was deleted';
    message.image = '';
    await message.save();

    res.json({ success: true, message: 'Message deleted successfully', deletedMessage: message });
  } catch (error) {
    console.error('Delete Message Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Upload image for instant message delivery
// @route   POST /api/chat/upload-image
// @access  Private
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Chat Image Upload Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

module.exports = {
  getConversations,
  getMessages,
  deleteMessage,
  uploadImage
};
