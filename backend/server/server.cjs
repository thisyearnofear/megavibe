// Load environment variables
const path = require("path");
require("dotenv").config({
  path:
    process.env.NODE_ENV === "production"
      ? path.join(__dirname, ".env.production")
      : path.join(__dirname, ".env"),
});

console.log("Environment:", process.env.NODE_ENV);
console.log("MONGO_URI configured:", !!process.env.MONGO_URI);
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./services/db.cjs");
const createExpressApp = require("./expressApp.cjs");
const port = process.env.PORT || 3000;
const helmet = require("helmet");
const { handleError } = require("./utils/errorHandler.cjs");
const fs = require("fs");
const { initWebSocketServer } = require("./services/websocket.cjs");

// Create Express application instance
const app = express();

// --- CORS CONFIGURATION: Place at the very top, before any routes or static assets ---
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? ["https://megavibe.vercel.app", "https://megavibe.onrender.com"]
    : [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://megavibe.vercel.app",
      ];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Request-ID"
    );
  }
  next();
});

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS: Request origin is not allowed"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
      "X-Request-ID",
    ],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);
// --- END CORS CONFIGURATION ---

// Configure Express application
createExpressApp(app);

// Middleware
const loggerMiddleware = require("./middleware/loggerMiddleware.cjs");

// Static assets
app.use(express.static("public"));

// Use request logger
app.use(loggerMiddleware);

// Body Parser
app.use(bodyParser.json());

// Security
app.use(helmet());

// Connect to MongoDB
connectDB();

// Auto-seed production database if needed
console.log("🔍 Checking seeding conditions...");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("SEED_ON_START:", process.env.SEED_ON_START);
console.log("FORCE_SEED:", process.env.FORCE_SEED);
console.log("RENDER_SERVICE_NAME:", process.env.RENDER_SERVICE_NAME);

if (
  (process.env.NODE_ENV === "production" || process.env.RENDER_SERVICE_NAME) &&
  (process.env.SEED_ON_START === "true" || process.env.FORCE_SEED === "true")
) {
  console.log("✅ Seeding conditions met, will start seeding in 5 seconds...");
  setTimeout(async () => {
    console.log("🌱 Starting production database seeding...");
    try {
      const { productionSeed } = require("./data/productionSeed.cjs");
      const result = await productionSeed();
      console.log("✅ Production database seeded successfully:", result);
    } catch (error) {
      console.error("❌ Production seeding failed:", error.message);
      console.error("Full error:", error);
    }
  }, 5000); // Wait 5 seconds for MongoDB connection to stabilize
} else {
  console.log("⏭️ Seeding conditions not met, skipping auto-seed");
}

// Enhanced error handling middleware
const {
  globalErrorHandler,
  handleNotFound,
} = require("./middleware/errorHandler.cjs");

// 404 handler for undefined routes
app.use(handleNotFound);

// Global error handling middleware
app.use(globalErrorHandler);

// Create HTTP(S) server and attach WebSocket server
let server;
if (process.env.NODE_ENV === "production") {
  // Use HTTPS in production
  const https = require("https");
  const cert = fs.readFileSync(path.join(__dirname, "server-crt.pem"));
  const key = fs.readFileSync(path.join(__dirname, "server-key.pem"));
  server = https.createServer({ key, cert }, app);
  server.listen(port, () => {
    console.log(`HTTPS server listening on port ${port}`);
  });
} else {
  // Use HTTP in development
  const http = require("http");
  server = http.createServer(app);
  server.listen(port, () => {
    console.log(`HTTP server listening on port ${port}`);
  });
}

// Attach WebSocket server to the HTTP(S) server
initWebSocketServer(server);
