/**
 * Environment Configuration
 * Loads environment variables for the MegaVibe platform.
 * Provides default values if environment variables are not set.
 */

const dotenv = require("dotenv");

// Load environment variables from .env file if available
dotenv.config();

// Environment configuration
const envConfig = {
  // Server settings
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database settings
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost/megavibe",

  // API Keys and secrets (to be provided by user or set in .env)
  PINATA_API_KEY: process.env.PINATA_API_KEY || "",
  PINATA_API_SECRET: process.env.PINATA_API_SECRET || "",
  PINATA_JWT_TOKEN: process.env.PINATA_JWT_TOKEN || "",
  MANTLE_API_KEY: process.env.MANTLE_API_KEY || "",
  MANTLE_CONTRACT_ADDRESS: process.env.MANTLE_CONTRACT_ADDRESS || "",

  // Security settings
  JWT_SECRET: process.env.JWT_SECRET || "your_jwt_secret_here",
  SESSION_SECRET: process.env.SESSION_SECRET || "your_session_secret_here",

  // Other configurations
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
};

// Validate critical environment variables
if (!envConfig.MONGODB_URI) {
  console.warn(
    "Warning: MONGODB_URI is not set. Using default local database."
  );
}

if (envConfig.NODE_ENV === "production") {
  if (
    !envConfig.JWT_SECRET ||
    envConfig.JWT_SECRET === "your_jwt_secret_here"
  ) {
    console.error("Error: JWT_SECRET must be set in production environment.");
    process.exit(1);
  }
  if (
    !envConfig.SESSION_SECRET ||
    envConfig.SESSION_SECRET === "your_session_secret_here"
  ) {
    console.error(
      "Error: SESSION_SECRET must be set in production environment."
    );
    process.exit(1);
  }
}

module.exports = envConfig;
