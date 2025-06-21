// utils/errorHandler.cjs

const { createLogger, transports, format } = require("winston");

const logger = createLogger({
  level: "error",
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "error.log" }),
  ],
});

function handleError(res, error, metadata = {}, log = true) {
  console.log("handleError called with:", { error, metadata }); // Add logging here

  const { statusCode } = metadata;

  if (log) {
    logger.error("Error:", {
      statusCode,
      message: error.message,
      stack: error.stack,
      metadata,
    });
  }

  // Send a more detailed error response in development mode or testing mode
  if (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test"
  ) {
    res.status(statusCode).json({
      error: {
        message: error.message,
        stack: error.stack,
        metadata,
      },
    });
  } else {
    // Send a generic error message in production mode
    res.status(statusCode).json({ error: "An error occurred" });
  }

  if (statusCode === 500) {
    // Log unexpected errors to the error.log file
    logger.error("Unexpected Error:", {
      message: error.message,
      stack: error.stack,
    });
  }
}

module.exports = {
  handleError,
};
