const { createLogger, transports, format } = require('winston'); // You might need to install the 'winston' package

// Initialize a logger
const logger = createLogger({
  level: 'error', // Set the log level to 'error' for uncaught exceptions
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'error.log' }) // Log errors to a file
  ]
});

/**
 * Log and handle errors.
 * @param {Object} res - The Express response object.
 * @param {Object} error - The error object with statusCode and message properties.
 */
function handleError(res, error) {
  // Log the error with additional context
  logger.error('Error:', error, { statusCode: error.statusCode, message: error.message });

  // Respond with the error
  res.status(error.statusCode).json({ error: error.message });
}

// Export the error handling functions
module.exports = {
  handleError,
};

// Usage examples:

// Handling validation errors:
// const validationError = { statusCode: 400, message: 'Validation failed' };
// handleError(res, validationError);

// Handling custom application errors:
// const customError = { statusCode: 500, message: 'Custom error message' };
// handleError(res, customError);

// Handling a missing user ID:
// const missingUserIdError = { statusCode: 400, message: 'User ID is missing' };
// handleError(res, missingUserIdError);
