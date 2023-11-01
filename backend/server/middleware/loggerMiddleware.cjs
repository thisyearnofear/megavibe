const { createLogger, transports, format } = require('winston');

const logger = createLogger({
  level: 'info', // Set your desired log level (e.g., 'info')
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'access.log' }), // Log requests to a file
  ],
});

function loggerMiddleware(req, res, next) {
  // Log the incoming request
  logger.info({
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });
  
  next();
}

module.exports = loggerMiddleware;