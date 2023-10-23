const { createLogger, transports, format } = require('winston');

const logger = createLogger({
  level: 'error',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'error.log' }),
  ],
});

function handleError(res, error) {
  let statusCode = error.statusCode || 500; // Default to 500 Internal Server Error
  logger.error('Error:', { statusCode, message: error.message, stack: error.stack });

  res.status(statusCode).json({ error: error.message });

  if (statusCode === 500) {
    // Log unexpected errors to the error.log file
    logger.error('Unexpected Error:', { message: error.message, stack: error.stack });
  }
}

module.exports = {
  handleError,
};