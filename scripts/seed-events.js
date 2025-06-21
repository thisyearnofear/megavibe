// scripts/seed-events.js
// Script to seed the database with real upcoming events for MegaVibe

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });

// Inline Venue schema to avoid model import/registration issues
const venueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    address: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    capacity: Number,
    isActive: { type: Boolean, default: false },
    amenities: [String],
    contactInfo: {
      phone: String,
      email: String,
      website: String,
    },
    socialLinks: {
      instagram: String,
      facebook: String,
      twitter: String,
    },
    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String },
    },
    currentEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },
    upcomingEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    pastEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    ratings: {
      overall: { type: Number, default: 0 },
      sound: { type: Number, default: 0 },
      atmosphere: { type: Number, default: 0 },
      service: { type: Number, default: 0 },
    },
  },
  { collection: "venues" }
);
const Venue = mongoose.models.Venue || mongoose.model("Venue", venueSchema);

// Inline User schema to avoid model import/registration issues
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

// Inline Event schema to avoid model import/registration issues
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

const events = [
  {
    name: "Coinfest Asia 2025",
    dates: "Aug 21–22, 2025",
    location: "Bali, Indonesia",
    highlights: "Largest Asian crypto festival, networking, panels, hackathons",
  },
  {
    name: "ETHWarsaw 2025",
    dates: "Sep 4–7, 2025",
    location: "Warsaw, Poland",
    highlights: "Ethereum conference & hackathon, mass adoption focus",
  },
  {
    name: "CONF3RENCE 2025",
    dates: "Sep 3–4, 2025",
    location: "Dortmund, Germany",
    highlights: "Blockchain, crypto, digital assets, European focus",
  },
  {
    name: "Korea Blockchain Week 2025",
    dates: "Sep 22–27, 2025",
    location: "Seoul, South Korea",
    highlights: "DeFi, NFTs, global blockchain adoption",
  },
  {
    name: "CV Summit",
    dates: "Sep 23–24, 2025",
    location: "Zurich, Switzerland",
    highlights: "European blockchain innovation, investment",
  },
  {
    name: "TOKEN2049 Singapore",
    dates: "Oct 1–2, 2025",
    location: "Singapore",
    highlights: "Premier global crypto event, industry leaders",
  },
  {
    name: "DappCon 25",
    dates: "Oct 2025 (TBA)",
    location: "Berlin, Germany",
    highlights: "Developer-focused, Ethereum, DeFi, DAOs",
  },
  {
    name: "Zebu Live 2025",
    dates: "Oct 15–17, 2025",
    location: "London, UK",
    highlights: "Web3, DeFi, NFTs, UK/Europe ecosystem",
  },
  {
    name: "Blockchain Life 2025",
    dates: "Oct 28–29, 2025",
    location: "Dubai, UAE",
    highlights: "Web3, crypto, mining, insider market intelligence",
  },
  {
    name: "Devcon 8",
    dates: "Nov 2025 (TBA)",
    location: "Buenos Aires, Argentina",
    highlights: "Flagship Ethereum developer conference, global dev community",
  },
  {
    name: "European Blockchain Convention",
    dates: "Nov 2025 (TBA)",
    location: "Barcelona, Spain",
    highlights: "Largest European blockchain event, 6,000+ attendees",
  },
  {
    name: "Non Fungible Conference",
    dates: "Nov 2025 (TBA)",
    location: "Lisbon, Portugal",
    highlights: "NFT and digital art, experimental festival",
  },
  {
    name: "Blockchain Futurist Conference USA",
    dates: "Nov 5–6, 2025",
    location: "Miami, USA",
    highlights: "Blockchain, DeFi, NFTs, DAOs, immersive experiences",
  },
  {
    name: "ETHDenver 2026",
    dates: "Feb/Mar 2026 (TBA)",
    location: "Denver, USA",
    highlights: "World’s largest Web3 hackathon and community gathering",
  },
  {
    name: "ETHDublin 2025",
    dates: "Nov 2025 (TBA)",
    location: "Dublin, Ireland",
    highlights: "Ethereum, decentralization, hands-on workshops",
  },
  {
    name: "ETHPrague 2025",
    dates: "Nov 2025 (TBA)",
    location: "Prague, Czech Republic",
    highlights: "Ethereum, future concepts, developer focus",
  },
  {
    name: "Next Block Expo",
    dates: "Mar 19–20, 2025",
    location: "Warsaw, Poland",
    highlights: "Web3 innovations, startup pitch, gaming, Women in Web3",
  },
  {
    name: "Crypto Assets Conference (CAC)",
    dates: "Mar 26, 2026",
    location: "Frankfurt, Germany",
    highlights: "Blockchain, digital assets, tokenized finance",
  },
  {
    name: "ETHBratislava 2025",
    dates: "Mar 2026 (TBA)",
    location: "Bratislava, Slovakia",
    highlights: "Ethereum, developer community, regional focus",
  },
  {
    name: "ETHSofia 2025",
    dates: "Mar 2026 (TBA)",
    location: "Sofia, Bulgaria",
    highlights: "Ethereum, hackathon, Balkan region",
  },
];

const demoVenues = [
  {
    name: "Demo Venue 1",
    address: "123 Main St, Demo City",
    location: { type: "Point", coordinates: [0, 0] },
    capacity: 500,
    isActive: true,
  },
  {
    name: "Demo Venue 2",
    address: "456 Side St, Demo City",
    location: { type: "Point", coordinates: [1, 1] },
    capacity: 1000,
    isActive: true,
  },
];

const demoUsers = [
  {
    username: "demoartist",
    email: "demoartist@example.com",
    password: "password123",
  },
  {
    username: "demouser",
    email: "demouser@example.com",
    password: "password123",
  },
];

async function seedEvents() {
  try {
    await mongoose.connect(import.meta.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    console.log("Seeding venues...");
    const venues = [];
    for (const v of demoVenues) {
      console.log("Checking venue:", v.name);
      let venue = await Venue.findOne({ name: v.name });
      if (!venue) {
        console.log("Creating venue:", v.name);
        venue = await Venue.create(v);
      }
      venues.push(venue);
    }
    console.log(
      "Venues seeded:",
      venues.map((v) => v.name)
    );

    console.log("Seeding users...");
    const users = [];
    for (const u of demoUsers) {
      console.log("Checking user:", u.email);
      let user = await User.findOne({ email: u.email });
      if (!user) {
        console.log("Creating user:", u.email);
        user = await User.create(u);
      }
      users.push(user);
    }
    console.log(
      "Users seeded:",
      users.map((u) => u.email)
    );

    console.log("Seeding events...");
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      // Add required fields
      event.type = "concert";
      event.venue = venues[i % venues.length]._id;
      event.startTime = new Date(Date.now() + i * 86400000);
      event.endTime = new Date(Date.now() + i * 86400000 + 7200000);
      event.createdBy = users[0]._id;
      event.status = "scheduled";

      console.log("Seeding event:", event.name);
      const exists = await Event.findOne({ name: event.name });
      if (!exists) {
        await Event.create(event);
        console.log(`Seeded: ${event.name}`);
      } else {
        console.log(`Already exists: ${event.name}`);
      }
    }
    await mongoose.disconnect();
    console.log("Seeding complete.");
  } catch (err) {
    console.error("Error seeding events:", err);
    process.exit(1);
  }
}

seedEvents();
