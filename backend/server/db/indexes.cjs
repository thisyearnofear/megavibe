/**
 * Database Indexes Configuration
 * Defines MongoDB indexes for optimizing query performance in the MegaVibe platform.
 * Run this script to ensure all necessary indexes are created in the database.
 */

const mongoose = require("mongoose");
const config = require("../config/env.cjs");
const Venue = require("../models/Venue.cjs");
const Event = require("../models/Event.cjs");
const Song = require("../models/Song.cjs");
const AudioSnippet = require("../models/AudioSnippet.cjs");

async function createIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB for index creation");

    // Venue Model Indexes
    await Venue.collection.createIndex(
      { location: "2dsphere" },
      { background: true }
    );
    await Venue.collection.createIndex({ createdBy: 1 }, { background: true });
    await Venue.collection.createIndex(
      { currentEvent: 1 },
      { background: true }
    );
    console.log("Venue indexes created");

    // Event Model Indexes
    await Event.collection.createIndex({ venue: 1 }, { background: true });
    await Event.collection.createIndex({ createdBy: 1 }, { background: true });
    await Event.collection.createIndex({ startTime: -1 }, { background: true });
    await Event.collection.createIndex({ artists: 1 }, { background: true });
    console.log("Event indexes created");

    // Song Model Indexes
    await Song.collection.createIndex({ artist: 1 }, { background: true });
    await Song.collection.createIndex({ title: "text" }, { background: true });
    console.log("Song indexes created");

    // AudioSnippet Model Indexes
    await AudioSnippet.collection.createIndex(
      { venue: 1 },
      { background: true }
    );
    await AudioSnippet.collection.createIndex(
      { createdBy: 1 },
      { background: true }
    );
    await AudioSnippet.collection.createIndex(
      { createdAt: -1 },
      { background: true }
    );
    await AudioSnippet.collection.createIndex(
      { tags: 1 },
      { background: true }
    );
    console.log("AudioSnippet indexes created");

    console.log("All database indexes created successfully");
  } catch (error) {
    console.error("Error creating database indexes:", error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run the index creation script
createIndexes();
