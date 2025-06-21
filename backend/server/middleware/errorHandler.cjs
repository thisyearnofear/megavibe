/**
 * Enhanced Error Handling Middleware
 * Provides comprehensive error handling with proper HTTP status codes,
 * logging, and user-friendly error messages.
 */

const winston = require("winston");

// Configure logger
const logger = winston.createLogger({
  level: "error",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log" }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Custom error class for API errors
class APIError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation error handler
const handleValidationError = (error) => {
  const errors = Object.values(error.errors).map((err) => err.message);
  const message = `Invalid input data: ${errors.join(". ")}`;
  return new APIError(message, 400);
};

// MongoDB duplicate key error handler
const handleDuplicateKeyError = (error) => {
  const field = Object.keys(error.keyValue)[0];
  const message = `${field} already exists. Please use a different value.`;
  return new APIError(message, 409);
};

// MongoDB cast error handler
const handleCastError = (error) => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new APIError(message, 400);
};

// JWT error handler
const handleJWTError = () => {
  return new APIError("Invalid token. Please log in again.", 401);
};

// JWT expired error handler
const handleJWTExpiredError = () => {
  return new APIError("Your token has expired. Please log in again.", 401);
};

// Rate limit error handler
const handleRateLimitError = () => {
  return new APIError("Too many requests. Please try again later.", 429);
};

// Send error response in development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: "error",
    error: err,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  });
};

// Send error response in production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error("ERROR:", err);

    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
      timestamp: new Date().toISOString(),
    });
  }
};

// Main error handling middleware
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Log error details
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  });

  let error = { ...err };
  error.message = err.message;

  // Handle specific error types
  if (error.name === "ValidationError") error = handleValidationError(error);
  if (error.code === 11000) error = handleDuplicateKeyError(error);
  if (error.name === "CastError") error = handleCastError(error);
  if (error.name === "JsonWebTokenError") error = handleJWTError();
  if (error.name === "TokenExpiredError") error = handleJWTExpiredError();
  if (error.type === "entity.too.large") {
    error = new APIError("Request entity too large", 413);
  }

  // Send appropriate error response
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

// Async error wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// 404 handler for undefined routes
const handleNotFound = (req, res, next) => {
  const err = new APIError(
    `Can't find ${req.originalUrl} on this server!`,
    404
  );
  next(err);
};

// Validation helper
const validateRequired = (fields, body) => {
  const missing = fields.filter((field) => !body[field]);
  if (missing.length > 0) {
    throw new APIError(`Missing required fields: ${missing.join(", ")}`, 400);
  }
};

// Response helper
const sendResponse = (res, statusCode, data, message = "Success") => {
  res.status(statusCode).json({
    status: "success",
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  APIError,
  globalErrorHandler,
  catchAsync,
  handleNotFound,
  validateRequired,
  sendResponse,
  logger,
};
