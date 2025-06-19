const express = require("express");
const router = express.Router();
const Event = require("../models/eventModel.cjs");

// DEV ONLY: List all events with _id and name
router.get("/list", async (req, res) => {
  try {
    const events = await Event.find({}, { _id: 1, name: 1 });
    res.json({ events });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch events", details: err.message });
  }
});

module.exports = router;
