const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth/authController');
const { validate } = require('../utils/validation');
const { schemas } = require('../utils/validation');
const { authLimiter } = require('../middleware/auth');

// Public routes (no authentication required)
router.post(
  '/register',
  authLimiter,
  validate(
    z.object({
      username: schemas.username,
      email: schemas.email,
      password: schemas.password,
      firstName: schemas.username.optional(),
      lastName: schemas.username.optional(),
      phoneNumber: schemas.phone.optional()
    })
  ),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validate(
    z.object({
      email: schemas.email,
      password: schemas.password
    })
  ),
  authController.login
);

router.post(
  '/logout',
  authController.logout
);

router.post(
  '/refresh-token',
  authController.refreshToken
);

router.post(
  '/forgot-password',
  authLimiter,
  validate(
    z.object({
      email: schemas.email
    })
  ),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  validate(
    z.object({
      token: z.string(),
      password: schemas.password
    })
  ),
  authController.resetPassword
);

module.exports = router;
