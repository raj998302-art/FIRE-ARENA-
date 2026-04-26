const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat/chatController');
const { protect } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const { z } = require('zod');

// All routes require authentication
router.use(protect);

// Get chat history for a conversation
router.get(
  '/:conversationId/history',
  validate(
    z.object({
      conversationId: z.string(),
      page: z.number().int().positive().optional(),
      limit: z.number().int().positive().max(100).optional()
    })
  ),
  chatController.getChatHistory
);

// Send a message
router.post(
  '/send',
  validate(
    z.object({
      conversationId: z.string(),
      recipientId: z.string().optional(),
      message: z.string().min(1),
      messageType: z.enum(['text', 'image', 'file', 'system']).optional(),
      fileUrl: z.string().optional(),
      fileName: z.string().optional(),
      replyToId: z.string().optional()
    })
  ),
  chatController.sendMessage
);

// Get unread message count
router.get(
  '/unread-count',
  chatController.getUnreadCount
);

// Mark messages as read
router.post(
  '/mark-as-read',
  validate(
    z.object({
      messageIds: z.array(z.string())
    })
  ),
  chatController.markAsRead
);

// Delete message
router.delete(
  '/:messageId',
  validate(
    z.object({
      messageId: z.string()
    })
  ),
  chatController.deleteMessage
);

module.exports = router;
