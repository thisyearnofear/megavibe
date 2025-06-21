// expressApp.cjs
const express = require("express");
const cors = require("cors");
const Waitlist = require("./models/Waitlist.cjs");

// Import route modules
const audioRoutes = require("./routes/audioRoutes.cjs");
const venueRoutes = require("./routes/venueRoutes.cjs");
const usersRoutes = require("./routes/usersRoutes.cjs");
const tipRoutes = require("./routes/tipRoutes.cjs");
const bountyRoutes = require("./controllers/bountyController.cjs");
const reactionRoutes = require("./routes/reactionRoutes.cjs");
const paymentsRoutes = require("./routes/paymentsRoutes.cjs");
const healthRoutes = require("./routes/health.cjs");
const liveInfluenceRoutes = require("./routes/liveInfluenceRoutes.cjs");
const contentPoolRoutes = require("./routes/contentPoolRoutes.cjs");
const reputationRoutes = require("./routes/reputationRoutes.cjs");
const connectionRoutes = require("./routes/connectionRoutes.cjs");
const eventRoutes = require("./routes/eventRoutes.cjs");
const adminRoutes = require("./routes/adminRoutes.cjs");
const neynarProxyRoutes = require("./routes/neynarProxyRoutes.cjs");

function configureMiddleware(app) {
  // CORS configuration is handled in server.cjs
  // This space is reserved for other middleware configurations
}

function createExpressApp(app) {
  app.use(express.json());
  configureMiddleware(app);

  // API Routes
  app.use("/api/audio", audioRoutes);
  app.use("/api/venues", venueRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/tips", tipRoutes);
  app.use("/api/bounties", bountyRoutes);
  app.use("/api/reactions", reactionRoutes);
  app.use("/api/payments", paymentsRoutes);
  app.use("/api/health", healthRoutes);
  app.use("/api/live-influence", liveInfluenceRoutes);
  app.use("/api/content-pools", contentPoolRoutes);
  app.use("/api/reputation", reputationRoutes);
  app.use("/api/connection", connectionRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/neynar-proxy", neynarProxyRoutes);

  // Define the /waitlist route
  app.post("/waitlist", (req, res) => {
    const { name, email, link } = req.body;

    // Create a new document in the 'waitlist' collection
    const newWaitlistEntry = new Waitlist({ name, email, link });

    newWaitlistEntry
      .save()
      .then(() => res.json("Waitlist entry added!"))
      .catch((err) => res.status(400).json("Error: " + err));
  });

  // Root API endpoint
  app.get("/api", (req, res) => {
    res.json({
      message: "MegaVibe API is running",
      version: "1.0.0",
      status: "🚀 MVP READY - All core features enabled",
      endpoints: {
        audio: "/api/audio",
        venues: "/api/venues",
        users: "/api/users",
        tips: "/api/tips",
        bounties: "/api/bounties",
        reactions: "/api/reactions",
        payments: "/api/payments",
        health: "/api/health",
        liveInfluence: "/api/live-influence",
        contentPools: "/api/content-pools",
        reputation: "/api/reputation",
        connection: "/api/connection",
        events: "/api/events",
        admin: "/api/admin",
        neynarProxy: "/api/neynar-proxy",
      },
    });
  });
}

module.exports = createExpressApp;
