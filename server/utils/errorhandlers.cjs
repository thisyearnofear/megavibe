// utils/errorHandlers.cjs

const { createLogger, transports, format } = require('winston');

const logger = createLogger({
  level: 'error',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'error.log' }),
  ],
});

function handleError(res, error, metadata = {}, log = true) {
  console.log('handleError called with:', { error, metadata }); // Add logging here

  let statusCode = error.statusCode || 500; // Default to 500 Internal Server Error

  if (log) {
    logger.error('Error:', {
      statusCode,
      message: error.message,
      stack: error.stack,
      metadata,
    });
  }

  res.status(statusCode).json({ error: error.message });

  if (statusCode === 500) {
    // Log unexpected errors to the error.log file
    logger.error('Unexpected Error:', {
      message: error.message,
      stack: error.stack,
    });
  }
}

module.exports = {
  handleError,
};