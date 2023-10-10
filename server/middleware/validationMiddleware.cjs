const { validationResult } = require('express-validator');

// Middleware function to handle validation errors
const validationMiddleware = (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);

  // If there are validation errors, respond with a 400 Bad Request status
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // If there are no validation errors, continue to the next middleware or route handler
  next();
};

module.exports = validationMiddleware;
