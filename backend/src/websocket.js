const { Server } = require('socket.io');
const { db } = require('../models');
const { AppError } = require('../utils/appError');

require('dotenv').config();

// Store connected users
const connectedUsers = new Map();
// Store room members
const roomMembers = new Map();

const initializeWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });
  
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                   socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new AppError('Authentication required', 401));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await db.User.findByPk(decoded.id, {
        attributes: { exclude: ['passwordHash'] }
      });
      
      if (!user) {
        return next(new AppError('User not found', 401));
      }
      
      if (!user.isActive) {
        return next(new AppError('User account is deactivated', 401));
      }
      
      if (user.isBanned) {
        return next(new AppError('User account is banned', 401));
      }
      
      // Attach user to socket
      socket.user = user;
      next();
    } catch (err) {
      return next(new AppError('Authentication failed', 401));
    }
  });
  
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    const username = socket.user.username;
    
    // Store user connection
    connectedUsers.set(userId, {
      socketId: socket.id,
      username,
      lastActive: new Date()
    });
    
    // Join global chat room
    socket.join('global_chat');
    
    // Notify others that user is online
    socket.to('global_chat').emit('user_online', {
      userId,
      username
    });
    
    // Send online users list
    const onlineUsers = Array.from(connectedUsers.values()).map(user => ({
      userId: user.socketId.split('#')[0], // Simplified for demo
      username: user.username,
      lastActive: user.lastActive
    }));
    
    socket.emit('online_users', onlineUsers);
    
    // Handle joining a specific room
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      
      // Add to room members
      if (!roomMembers.has(roomId)) {
        roomMembers.set(roomId, new Set());
      }
      roomMembers.get(roomId).add(userId);
      
      // Notify room members
      socket.to(roomId).emit('user_joined_room', {
        userId,
        username,
        roomId
      });
    });
    
    // Handle leaving a room
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      
      // Remove from room members
      if (roomMembers.has(roomId)) {
        roomMembers.get(roomId).delete(userId);
        if (roomMembers.get(roomId).size === 0) {
          roomMembers.delete(roomId);
        }
      }
      
      // Notify room members
      socket.to(roomId).emit('user_left_room', {
        userId,
        username,
        roomId
      });
    });
    
    // Handle sending a message
    socket.on('send_message', async (data) => {
      try {
        const { roomId, message, messageType = 'text', replyToId } = data;
        
        // Save message to database
        const chatMessage = await db.ChatMessage.create({
          conversationId: roomId,
          senderId: userId,
          recipientId: roomId.startsWith('private_') ? roomId.split('_')[1] : null,
          message,
          messageType,
          replyToId: replyToId || null
        });
        
        // Broadcast message to room
        io.to(roomId).emit('new_message', {
          id: chatMessage.id,
          conversationId: chatMessage.conversationId,
          senderId: chatMessage.senderId,
          recipientId: chatMessage.recipientId,
          message: chatMessage.message,
          messageType: chatMessage.messageType,
          createdAt: chatMessage.createdAt
        });
        
        // Send delivery receipt to sender
        socket.emit('message_delivered', {
          messageId: chatMessage.id
        });
      } catch (error) {
        socket.emit('message_error', {
          error: 'Failed to send message'
        });
      }
    });
    
    // Handle marking message as read
    socket.on('mark_as_read', async (messageId) => {
      try {
        const message = await db.ChatMessage.findByPk(messageId);
        
        if (message && message.recipientId === userId) {
          await message.update({
            isRead: true,
            readAt: new Date()
          });
          
          // Notify sender
          socket.to(`user_${message.senderId}`).emit('message_read', {
            messageId
          });
        }
      } catch (error) {
        // Silently ignore read errors
      }
    });
    
    // Handle typing indicator
    socket.on('typing', (data) => {
      const { roomId, isTyping } = data;
      socket.to(roomId).emit('user_typing', {
        userId,
        username,
        roomId,
        isTyping
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      // Remove from connected users
      connectedUsers.delete(userId);
      
      // Remove from all rooms
      roomMembers.forEach((members, roomId) => {
        if (members.has(userId)) {
          members.delete(userId);
          if (members.size === 0) {
            roomMembers.delete(roomId);
          }
          
          // Notify room members
          socket.to(roomId).emit('user_left_room', {
            userId,
            username,
            roomId
          });
        }
      });
      
      // Notify others that user is offline
      socket.to('global_chat').emit('user_offline', {
        userId,
        username
      });
    });
  });
  
  return io;
};

module.exports = { initializeWebSocket };
