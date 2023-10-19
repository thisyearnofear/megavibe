const { validationResult, body } = require('express-validator');

const validatePayment = [
  body('amount').notEmpty().withMessage('Amount is required'),
  body('songId').optional().isString().withMessage('SongId must be a string'),
  // Include other required fields here if needed
];

const validationMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  validatePayment,
  validationMiddleware,
};
