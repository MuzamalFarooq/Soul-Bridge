const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Keep track of active connections
// Map of userId -> Set of socketId (allows multiple tabs/devices per user)
const onlineUsers = new Map();

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket Connected: ${socket.id}`);
    let currentUserId = null;

    // Register user when authenticated client connects
    socket.on('register_user', async (userId) => {
      if (!userId) return;
      currentUserId = userId;

      // Add socket ID to online tracker
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);

      // Join user-specific room for multi-device sync
      socket.join(userId);

      try {
        // Update DB status
        const user = await User.findById(userId);
        if (user) {
          user.isOnline = true;
          user.lastActive = new Date();
          await user.save();
          
          // Broadcast online status change to all clients
          io.emit('user_status_change', {
            userId: userId,
            isOnline: true,
            lastActive: user.lastActive
          });
        }
      } catch (error) {
        console.error('Error in socket user registration:', error);
      }

      console.log(`User registered: ${userId} (Sockets active: ${onlineUsers.get(userId).size})`);
    });

    // Handle sending a private message
    socket.on('send_message', async (data) => {
      const { conversationId, senderId, recipientId, content, image } = data;
      
      if (!conversationId || !senderId || !recipientId) {
        return socket.emit('error_message', { message: 'Invalid message payload' });
      }

      try {
        // Create and save message
        const message = await Message.create({
          conversationId,
          sender: senderId,
          recipient: recipientId,
          content: content || '',
          image: image || '',
          isRead: false
        });

        // Update conversation's last message
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id
        });

        const messageData = message.toObject();

        // Relay message to recipient's room (all their active tabs)
        io.to(recipientId).emit('receive_message', messageData);

        // Echo message to sender's room (all their active tabs for synchronization)
        io.to(senderId).emit('receive_message', messageData);

        // If recipient is offline, we could trigger a push notification, but for this webapp,
        // it will be saved in MongoDB, and they will see it in historical chat log on login.
      } catch (error) {
        console.error('Error saving message via socket:', error);
        socket.emit('error_message', { message: 'Failed to deliver message' });
      }
    });

    // Handle typing status indicator
    socket.on('typing', (data) => {
      const { senderId, recipientId, isTyping } = data;
      if (!recipientId || !senderId) return;

      // Relays typing status specifically to recipient
      io.to(recipientId).emit('user_typing', {
        senderId,
        isTyping
      });
    });

    // Handle message seen status
    socket.on('message_seen', async (data) => {
      const { conversationId, readerId, senderId } = data;
      if (!conversationId || !readerId || !senderId) return;

      try {
        // Update database: mark all messages in this conversation received by reader as read
        await Message.updateMany(
          { conversationId, recipient: readerId, sender: senderId, isRead: false },
          { isRead: true }
        );

        // Relay the seen confirmation back to original sender
        io.to(senderId).emit('messages_read', {
          conversationId,
          readerId
        });
      } catch (error) {
        console.error('Error updating read receipts via socket:', error);
      }
    });

    // Handle real-time deletion of a message
    socket.on('delete_message', async (data) => {
      const { messageId, conversationId, senderId, recipientId } = data;
      if (!messageId || !conversationId || !senderId || !recipientId) return;

      try {
        // Relay delete confirmation to both participants
        io.to(recipientId).to(senderId).emit('message_deleted', {
          messageId,
          conversationId
        });
      } catch (error) {
        console.error('Error transmitting message deletion via socket:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`Socket Disconnected: ${socket.id}`);
      
      if (currentUserId && onlineUsers.has(currentUserId)) {
        const userSockets = onlineUsers.get(currentUserId);
        userSockets.delete(socket.id);

        // If no more active sockets for this user, mark them offline
        if (userSockets.size === 0) {
          onlineUsers.delete(currentUserId);

          try {
            const user = await User.findById(currentUserId);
            if (user) {
              user.isOnline = false;
              user.lastActive = new Date();
              await user.save();

              // Broadcast offline status change to all clients
              io.emit('user_status_change', {
                userId: currentUserId,
                isOnline: false,
                lastActive: user.lastActive
              });
            }
          } catch (error) {
            console.error('Error in socket disconnect offline status update:', error);
          }

          console.log(`User offline: ${currentUserId}`);
        } else {
          console.log(`User ${currentUserId} disconnected a socket, ${userSockets.size} remaining.`);
        }
      }
    });
  });
};

module.exports = socketHandler;
