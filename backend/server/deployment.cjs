/**
 * Production Deployment Configuration
 * Outlines the setup and scripts for deploying the MegaVibe platform to a production environment.
 * This includes server configuration, environment variables, and deployment steps.
 */

const config = require("./config/env.cjs");

// Deployment configuration object
const deploymentConfig = {
  // Server settings for production
  server: {
    host: process.env.SERVER_HOST || "0.0.0.0",
    port: config.PORT,
    nodeEnv: "production",
  },

  // Database settings for production
  database: {
    uri: process.env.MONGODB_URI_PRODUCTION || config.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: false, // Disable auto-indexing in production for performance
      poolSize: process.env.DB_POOL_SIZE || 10,
    },
  },

  // Static file serving (if applicable)
  staticFiles: {
    path: "../frontend/build", // Path to frontend build files
    maxAge: "1y", // Cache static files for 1 year
  },

  // Security settings for production
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:"],
        },
      },
    },
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    },
  },

  // Logging settings for production
  logging: {
    level: process.env.LOG_LEVEL_PRODUCTION || "error",
    format: "json", // Use JSON format for easier log parsing in production
    filePath: process.env.LOG_FILE_PATH || "./logs/production.log",
  },
};

// Deployment steps (to be executed manually or via CI/CD pipeline)
const deploymentSteps = {
  1: {
    description: "Build Frontend",
    command: "cd ../frontend && npm run build",
    note: "Ensure the frontend is built and static files are generated in the build folder.",
  },
  2: {
    description: "Install Production Dependencies",
    command: "npm install --production",
    note: "Install only production dependencies to minimize node_modules size.",
  },
  3: {
    description: "Set Environment Variables",
    command:
      "export NODE_ENV=production && export MONGODB_URI=<production_uri>",
    note: "Set necessary environment variables for production. Use a .env file or CI/CD secrets.",
  },
  4: {
    description: "Run Database Indexes Script",
    command: "node ./db/indexes.cjs",
    note: "Ensure database indexes are created for optimal performance.",
  },
  5: {
    description: "Start Server with PM2 (or similar process manager)",
    command: "pm2 start ./server.cjs --name megavibe",
    note: "Use a process manager like PM2 to keep the server running and handle restarts.",
  },
  6: {
    description: "Set Up Reverse Proxy (e.g., Nginx)",
    command:
      "Configure Nginx or similar to proxy requests to the Node.js server",
    note: "Configure SSL/TLS for HTTPS and set up load balancing if needed.",
  },
  7: {
    description: "Monitor Application",
    command: "Set up monitoring tools (e.g., New Relic, Datadog)",
    note: "Monitor application performance and errors in production.",
  },
};

// Log deployment configuration for reference
console.log("MegaVibe Production Deployment Configuration:");
console.log("Server Settings:", deploymentConfig.server);
console.log("Database Settings:", {
  uri: deploymentConfig.database.uri,
  options: deploymentConfig.database.options,
});
console.log("Static Files Settings:", deploymentConfig.staticFiles);
console.log("Security Settings:", deploymentConfig.security);
console.log("Logging Settings:", deploymentConfig.logging);
console.log("\nDeployment Steps:");
Object.values(deploymentSteps).forEach((step) => {
  console.log(`Step ${step.description}:`);
  console.log(`  Command: ${step.command}`);
  console.log(`  Note: ${step.note}\n`);
});

module.exports = {
  deploymentConfig,
  deploymentSteps,
};
