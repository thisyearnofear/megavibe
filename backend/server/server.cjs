require("dotenv").config({ path: "../.env" });

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./services/db.cjs");
const app = require("./expressApp.cjs");
const port = process.env.PORT || 3000;
const { handleError } = require("./utils/errorHandler.cjs");

// Modularize configuration
const { securityConfig } = require("./config/securityconfig.cjs");

// Middleware
const { requestLogger } = require("./middleware/loggerMiddleware.cjs");

// Static assets
app.use(express.static("public"));

// CORS
app.use(cors());

// Body Parser
app.use(bodyParser.json());

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(requestLogger);
}

// Security
if (process.env.NODE_ENV === "production") {
  app.use(securityConfig);
}

// Connect to MongoDB
connectDB();

// Error handling middleware
app.use((err, req, res, next) => {
  handleError(res, err, { statusCode: 500 });
});

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
