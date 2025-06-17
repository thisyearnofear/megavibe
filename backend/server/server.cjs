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

// Create Express application instance
const app = express();

// Configure Express application
createExpressApp(app);

// Middleware
const loggerMiddleware = require("./middleware/loggerMiddleware.cjs");

// Static assets
app.use(express.static("public"));

// CORS Configuration
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? ["https://megavibe.vercel.app", "https://megavibe.onrender.com"]
    : [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://megavibe.vercel.app",
      ];

// Enable pre-flight requests for all routes
app.options("*", cors());

// Custom middleware to ensure CORS headers are set
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
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
  }
  next();
});

// Main CORS configuration
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
    ],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Use request logger
app.use(loggerMiddleware);

// Body Parser
app.use(bodyParser.json());

// Security
app.use(helmet());

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
