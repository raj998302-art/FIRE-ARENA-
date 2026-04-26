const jwt = require('jsonwebtoken');
const { db } = require('../models');
const { AppError } = require('../utils/appError');
require('dotenv').config();

const protect = async (req, res, next) => {
  let token;
  
  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      req.user = await db.User.findByPk(decoded.id, {
        attributes: { exclude: ['passwordHash'] }
      });
      
      if (!req.user) {
        return next(new AppError('User not found', 401));
      }
      
      if (!req.user.isActive) {
        return next(new AppError('User account is deactivated', 401));
      }
      
      if (req.user.isBanned) {
        return next(new AppError('User account is banned', 401));
      }
      
      next();
    } catch (err) {
      return next(new AppError('Not authorized, token failed', 401));
    }
  }
  
  // Check for token in cookies (for web)
  if (req.cookies && req.cookies.token) {
    try {
      const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
      req.user = await db.User.findByPk(decoded.id, {
        attributes: { exclude: ['passwordHash'] }
      });
      
      if (!req.user) {
        return next(new AppError('User not found', 401));
      }
      
      if (!req.user.isActive) {
        return next(new AppError('User account is deactivated', 401));
      }
      
      if (req.user.isBanned) {
        return next(new AppError('User account is banned', 401));
      }
      
      next();
    } catch (err) {
      return next(new AppError('Not authorized, token failed', 401));
    }
  }
  
  if (!token) {
    return next(new AppError('Not authorized, no token', 401));
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authorized, no user', 401));
    }
    
    // Check if user has any of the required roles
    const userRoleNames = req.user.roles ? 
      req.user.roles.map(role => role.name) : [];
    
    const hasRequiredRole = roles.some(role => 
      userRoleNames.includes(role)
    );
    
    if (!hasRequiredRole) {
      return next(new AppError('Not authorized to access this route', 403));
    }
    
    next();
  };
};

const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authorized, no user', 401));
    }
    
    try {
      // Get user's roles
      const userRoles = await req.user.getRoles();
      const roleIds = userRoles.map(role => role.id);
      
      if (roleIds.length === 0) {
        return next(new AppError('User has no roles assigned', 403));
      }
      
      // Check if any of the user's roles have the required permission
      const hasPermission = await db.RolePermission.findOne({
        where: {
          roleId: roleIds
        },
        include: [{
          model: db.Permission,
          where: {
            resource: resource,
            action: action,
            isActive: true
          }
        }]
      });
      
      if (!hasPermission) {
        return next(new AppError('Not authorized to perform this action', 403));
      }
      
      next();
    } catch (error) {
      return next(new AppError('Authorization error', 500));
    }
  };
};

const rateLimiter = require('express-rate-limit');

const apiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  protect,
  authorize,
  checkPermission,
  apiLimiter,
  authLimiter
};
