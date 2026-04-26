const express = require('express');
const router = express.Router();
const userController = require('../controllers/users/userController');
const { protect } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const { z } = require('zod');

// All routes require authentication
router.use(protect);

// Get current user profile
router.get(
  '/profile',
  userController.getProfile
);

// Update user profile
router.put(
  '/profile',
  validate(
    z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phoneNumber: z.string().optional(),
      dateOfBirth: z.string().date().optional()
    })
  ),
  userController.updateProfile
);

// Get user by ID
router.get(
  '/:userId',
  validate(
    z.object({
      userId: z.string()
    })
  ),
  userController.getUserById
);

// Search users
router.get(
  '/search',
  validate(
    z.object({
      query: z.string().min(2),
      limit: z.number().int().positive().max(50).optional()
    })
  ),
  userController.searchUsers
);

module.exports = router;
