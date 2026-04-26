const { z } = require('zod');

// Common validation schemas
const idSchema = z.string().uuid();
const emailSchema = z.string().email();
const passwordSchema = z.string().min(8).max(100);
const usernameSchema = z.string().min(3).max(50);
const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]{10,20}$/);

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    try {
      // Validate body
      if (req.body) {
        schema.parse(req.body);
      }
      
      // Validate params
      if (req.params) {
        // Create a schema for params validation
        const paramsSchema = z.object({
          ...Object.keys(req.params).reduce((acc, key) => {
            acc[key] = idSchema;
            return acc;
          }, {})
        });
        paramsSchema.parse(req.params);
      }
      
      // Validate query
      if (req.query) {
        // For now, we'll just check that it's an object
        // More specific query validation can be added per endpoint
        if (typeof req.query !== 'object' || Array.isArray(req.query)) {
          throw new Error('Invalid query parameters');
        }
      }
      
      next();
    } catch (error) {
      // Format Zod error
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      res.status(400).json({
        error: 'Validation failed',
        details: formattedErrors
      });
    }
  };
};

module.exports = {
  validate,
  schemas: {
    id: idSchema,
    email: emailSchema,
    password: passwordSchema,
    username: usernameSchema,
    phone: phoneSchema
  }
};
