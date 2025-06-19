// scripts/seed-bounties.js
// Script to seed the database with demo bounties for MegaVibe

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });

async function seedBounties() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Inline Bounty schema to avoid model import/registration issues
    const bountySchema = new mongoose.Schema(
      {
        contractBountyId: { type: Number, required: true, unique: true },
        sponsor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        event: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Event",
          required: true,
        },
        speaker: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        description: { type: String, required: true, maxLength: 500 },
        rewardAmount: { type: Number, required: true, min: 0 },
        deadline: { type: Date, required: true },
        status: {
          type: String,
          enum: ["active", "claimed", "expired", "cancelled"],
          default: "active",
        },
        claimant: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        submissionHash: { type: String, default: null },
        claimedAt: { type: Date, default: null },
        txHash: { type: String, required: true },
        blockNumber: { type: Number, default: null },
        tags: [{ type: String, trim: true }],
        contentType: {
          type: String,
          enum: ["video", "audio", "image", "text", "mixed"],
          default: "video",
        },
        requirements: {
          duration: {
            min: Number,
            max: Number,
          },
          format: [String],
          quality: String,
        },
      },
      { collection: "bounties" }
    );
    const Bounty =
      mongoose.models.Bounty || mongoose.model("Bounty", bountySchema);

    // Inline Event and User schemas for querying
    const eventSchema = new mongoose.Schema(
      {
        name: { type: String, required: true },
        dates: String,
        location: String,
        highlights: String,
        type: { type: String, required: true },
        venue: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Venue",
          required: true,
        },
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: { type: String, default: "scheduled" },
      },
      { collection: "events" }
    );
    const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);

    const userSchema = new mongoose.Schema(
      {
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        dateOfBirth: Date,
        country: String,
        favoriteGenres: [{ type: String }],
        profilePictureUrl: String,
        following: [{ type: String }],
        interactions: [
          {
            songId: { type: String },
            rating: { type: Number },
            timestamp: { type: Date, default: Date.now },
          },
        ],
      },
      { collection: "users" }
    );
    const User = mongoose.models.User || mongoose.model("User", userSchema);

    // Get a list of events and users
    const events = await Event.find({});
    const users = await User.find({});
    if (events.length === 0 || users.length < 2) {
      throw new Error("Not enough events or users to seed bounties.");
    }

    // Use the first two users as sponsor and speaker
    const sponsor = users[0]._id;
    const speaker = users[1]._id;

    let contractBountyId = 1;
    for (const event of events) {
      const bounty = {
        contractBountyId: contractBountyId++,
        sponsor,
        event: event._id,
        speaker,
        description: `Demo bounty for event ${event.name}`,
        rewardAmount: 100,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: "active",
        txHash: "0x" + Math.random().toString(16).slice(2),
        blockNumber: 123456,
        tags: ["demo", "test"],
        contentType: "video",
        requirements: {
          duration: { min: 60, max: 300 },
          format: ["mp4"],
          quality: "HD",
        },
      };
      await Bounty.create(bounty);
      console.log(`Seeded bounty for event: ${event.name}`);
    }
    await mongoose.disconnect();
    console.log("Bounty seeding complete.");
  } catch (err) {
    console.error("Error seeding bounties:", err);
    process.exit(1);
  }
}

seedBounties();
