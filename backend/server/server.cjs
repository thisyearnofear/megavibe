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

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
