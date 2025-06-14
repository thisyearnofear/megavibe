require("dotenv").config({
  path: "/Users/udingethe/Desktop/gpt-engineer/MANTLE/megavibe/backend/server/.env",
});
console.log("MONGO_URI from .env:", process.env.MONGO_URI);
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

// CORS
app.use(cors());

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
