const { db } = require('../models');
const { AppError } = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');

require('dotenv').config();

// Get chat history for a conversation
exports.getChatHistory = catchAsync(async (req, res, next) => {
  const { conversationId } = req.params;
  const userId = req.user.id;
  const { page = 1, limit = 50 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  // Verify user has access to this conversation
  // For simplicity, we'll allow access to any conversation
  // In practice, you'd check if user is participant in the conversation

  try {
    const { count, rows } = await db.ChatMessage.findAndCountAll({
      where: {
        conversationId,
        isDeleted: false
      },
      include: [
        {
          model: db.User,
          as: 'sender',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'ASC']], // Oldest first for chat history
      limit: limitNum,
      offset: offset
    });

    res.status(200).json({
      status: 'success',
      data: {
        messages: rows.map(message => ({
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          recipientId: message.recipientId,
          message: message.message,
          messageType: message.messageType,
          fileUrl: message.fileUrl,
          fileName: message.fileName,
          isRead: message.isRead,
          isEdited: message.isEdited,
          editedAt: message.editedAt,
          isDeleted: message.isDeleted,
          replyToId: message.replyToId,
          createdAt: message.createdAt,
          sender: message.sender ? {
            id: message.sender.id,
            username: message.sender.username,
            firstName: message.sender.firstName,
            lastName: message.sender.lastName
          } : null
        })),
        pagination: {
          total: count,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(count / limitNum)
        }
      }
    });
  } catch (error) {
    return next(new AppError('Failed to fetch chat history', 500));
  }
});

// Send a message
exports.sendMessage = catchAsync(async (req, res, next) => {
  const { conversationId, recipientId, message, messageType = 'text', fileUrl, fileName, replyToId } = req.body;
  const senderId = req.user.id;

  // Validate input
  if (!message || message.trim() === '') {
    return next(new AppError('Message cannot be empty', 400));
  }

  // For direct messages, recipientId is required
  if (conversationId.startsWith('private_') && !recipientId) {
    return next(new AppError('Recipient ID is required for private messages', 400));
  }

  try {
    // Create message
    const chatMessage = await db.ChatMessage.create({
      conversationId,
      senderId,
      recipientId: recipientId || null,
      message: message.trim(),
      messageType,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      replyToId: replyToId || null
    });

    res.status(201).json({
      status: 'success',
      message: 'Message sent successfully',
      data: {
        message: {
          id: chatMessage.id,
          conversationId: chatMessage.conversationId,
          senderId: chatMessage.senderId,
          recipientId: chatMessage.recipientId,
          message: chatMessage.message,
          messageType: chatMessage.messageType,
          createdAt: chatMessage.createdAt
        }
      }
    });
  } catch (error) {
    return next(new AppError('Failed to send message', 500));
  }
});

// Get unread message count
exports.getUnreadCount = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  try {
    const count = await db.ChatMessage.count({
      where: {
        recipientId: userId,
        isRead: false,
        isDeleted: false
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        unreadCount: count
      }
    });
  } catch (error) {
    return next(new AppError('Failed to get unread count', 500));
  }
});

// Mark messages as read
exports.markAsRead = catchAsync(async (req, res, next) => {
  const { messageIds } = req.body;
  const userId = req.user.id;

  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    return next(new AppError('Please provide message IDs to mark as read', 400));
  }

  try {
    // Update messages to mark as read
    await db.ChatMessage.update(
      {
        isRead: true,
        readAt: new Date()
      },
      {
        where: {
          id: messageIds,
          recipientId: userId,
          isRead: false
        }
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'Messages marked as read successfully'
    });
  } catch (error) {
    return next(new AppError('Failed to mark messages as read', 500));
  }
});

// Delete message (soft delete)
exports.deleteMessage = catchAsync(async (req, res, next) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  try {
    const message = await db.ChatMessage.findByPk(messageId);

    if (!message) {
      return next(new AppError('Message not found', 404));
    }

    // Only allow sender to delete their own messages
    if (message.senderId !== userId) {
      return next(new AppError('Not authorized to delete this message', 403));
    }

    // Soft delete
    await message.update({
      isDeleted: true,
      deletedAt: new Date()
    });

    res.status(200).json({
      status: 'success',
      message: 'Message deleted successfully'
    });
  } catch (error) {
    return next(new AppError('Failed to delete message', 500));
  }
});

// Get message by ID
exports.getMessageById = catchAsync(async (req, res, next) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  try {
    const message = await db.ChatMessage.findByPk(messageId, {
      include: [
        {
          model: db.User,
          as: 'sender',
          attributes: ['id', 'username', 'firstName', 'lastName']
        },
        {
          model: db.User,
          as: 'recipient',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ]
    });

    if (!message) {
      return next(new AppError('Message not found', 404));
    }

    // Check if user has access to this message
    if (message.senderId !== userId && message.recipientId !== userId) {
      return next(new AppError('Not authorized to view this message', 403));
    }

    res.status(200).json({
      status: 'success',
      data: {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        recipientId: message.recipientId,
        message: message.message,
        messageType: message.messageType,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        isRead: message.isRead,
        isEdited: message.isEdited,
        editedAt: message.editedAt,
        isDeleted: message.isDeleted,
        replyToId: message.replyToId,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        sender: message.sender ? {
          id: message.sender.id,
          username: message.sender.username,
          firstName: message.sender.firstName,
          lastName: message.sender.lastName
        } : null,
        recipient: message.recipient ? {
          id: message.recipient.id,
          username: message.recipient.username,
          firstName: message.recipient.firstName,
          lastName: message.recipient.lastName
        } : null
      }
    });
  } catch (error) {
    return next(new AppError('Failed to get message', 500));
  }
});

module.exports = exports;
