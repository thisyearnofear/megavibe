// middleware/validationMiddleware.cjs
const { validationResult, body } = require('express-validator');

// Custom validation middleware for the payment request body
const validatePayment = [
  body('amount').notEmpty().withMessage('Amount is required'),
  body('type').notEmpty().withMessage('Type is required'),
  // Include other required fields here if needed
];

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

module.exports = {
  validatePayment,
  validationMiddleware,
};
