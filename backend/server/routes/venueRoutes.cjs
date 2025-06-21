const express = require("express");
const router = express.Router();
const cors = require("cors");
const {
  getNearbyVenues,
  getVenueById,
  getCurrentEvent,
  createVenue,
  updateVenue,
  searchVenues,
  getVenueAnalytics,
} = require("../controllers/venueController.cjs");
const {
  validateUserSession,
} = require("../middleware/validationMiddleware.cjs");

// CORS for this specific route
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? ["https://megavibe.vercel.app", "https://megavibe.onrender.com"]
    : [
        "http://localhost:5173",
        "http://localhost:3001",
        "https://megavibe.vercel.app",
      ];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  maxAge: 86400,
};

// Public routes with specific CORS settings
router.options("*", cors(corsOptions)); // Enable pre-flight for all routes
router.get("/nearby", cors(corsOptions), getNearbyVenues);
router.get("/search", cors(corsOptions), searchVenues);
router.get("/:id", cors(corsOptions), getVenueById);
router.get("/:id/event", cors(corsOptions), getCurrentEvent);

// Protected routes
router.post("/", validateUserSession, createVenue);
router.put("/:id", validateUserSession, updateVenue);
router.get("/:id/analytics", validateUserSession, getVenueAnalytics);

module.exports = router;
