const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Check database connection
async function checkDatabaseConnection() {
  try {
    // Check if mongoose is connected
    if (mongoose.connection.readyState === 1) {
      // Perform a simple ping to verify connection
      await mongoose.connection.db.admin().ping();
      return true;
    } else {
      throw new Error("Database not connected");
    }
  } catch (err) {
    throw new Error(`Database health check failed: ${err.message}`);
  }
}

// Main health check endpoint
router.get("/", async (req, res) => {
  const healthCheck = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
    services: {
      database: "unknown",
      server: "healthy",
    },
  };

  try {
    // Check database connection
    await checkDatabaseConnection();
    healthCheck.services.database = "healthy";
  } catch (err) {
    healthCheck.status = "unhealthy";
    healthCheck.services.database = "unhealthy";
    healthCheck.error = err.message;
  }

  // Return appropriate status code
  const statusCode = healthCheck.status === "healthy" ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

// Simple ping endpoint
router.get("/ping", (req, res) => {
  res.json({
    message: "pong",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
