// utils/errorHandlers.js
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

// Function to handle validation errors
function handleValidationErrors(err, res) {
  res.status(400).json({ error: 'Validation failed', details: err.message });
}

// Function to handle custom application errors
function handleApplicationErrors(err, res) {
  // You can customize this function to handle specific application errors
  res.status(500).json({ error: 'Internal server error' });
}

// Function to handle uncaught exceptions
function handleUncaughtExceptions(err, res) {
  logger.error('Uncaught Exception:', err); // Log uncaught exceptions
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = {
  handleValidationErrors,
  handleApplicationErrors,
  handleUncaughtExceptions,
};
