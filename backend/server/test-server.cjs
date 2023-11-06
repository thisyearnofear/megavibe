// server/test-server.cjs

const express = require("express");
const session = require("express-session");
const app = express();

// Modularize configuration
const { sessionConfig } = require("./config/sessionconfig.cjs");
const { securityConfig } = require("./config/securityconfig.cjs");

// Routes
const usersRoute = require("./routes/usersRoutes.cjs");
const paymentsRoute = require("./routes/paymentsRoutes.cjs");
const reactionRoute = require("./routes/reactionRoutes.cjs");
const sessionRoute = require("./routes/sessionRoutes.cjs");
const healthRoute = require("./routes/health.cjs");
const Waitlist = require("./models/Waitlist");

// Controllers
const { getUserProfile } = require("./controllers/usersController.cjs");

// Middleware
const { loggerMiddleware } = require("./middleware/loggerMiddleware.cjs");
const { validateUser } = require("./middleware/validationMiddleware.cjs");

// Static assets
app.use(express.static("public"));

// Session middleware
app.use(session(sessionConfig));

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(loggerMiddleware); // Use the logger middleware
}

// Security
if (process.env.NODE_ENV === "production") {
  app.use(securityConfig);
}

// Validation
app.use(validateUser); // Use the validation middleware

// Error handling middleware
app.use((err, req, res, next) => {
  // Handle errors here
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
  next();
});

// Define routes
app.get("/users/:id", validateUser, getUserProfile);
app.use("/users", usersRoute);
app.use("/payments", paymentsRoute);
app.use("/reactions", reactionRoute);
app.use("/api", sessionRoute); //
app.get("/", healthRoute);

module.exports = app;
