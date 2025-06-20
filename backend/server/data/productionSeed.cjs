// productionSeed.cjs - Production-ready database seeding script

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Import Models
const Venue = require("../models/venueModel.cjs");
const Event = require("../models/eventModel.cjs");
const Song = require("../models/songModel.cjs");
const User = require("../models/userModel.cjs");

// Check if we should run this seed
const shouldSeed = () => {
  // Only seed when explicitly forced
  return process.env.FORCE_SEED === "true";
};

// Experience venue data with real coordinates
const experienceVenues = [
  {
    name: "Marina Bay Sands",
    address: "10 Bayfront Ave, Singapore 018956",
    coordinates: { lat: 1.2834, lng: 103.8607 },
    description: "Premier venue hosting TOKEN2049 Singapore",
    capacity: 10000,
  },
  {
    name: "Denver Convention Center",
    address: "700 14th St, Denver, CO 80202",
    coordinates: { lat: 39.7392, lng: -104.9903 },
    description: "ETHDenver main venue",
    capacity: 15000,
  },
  {
    name: "Austin Convention Center",
    address: "500 E Cesar Chavez St, Austin, TX 78701",
    coordinates: { lat: 30.2672, lng: -97.7431 },
    description: "Consensus conference venue",
    capacity: 20000,
  },
  {
    name: "ExCeL London",
    address: "1 Western Gateway, London E16 1XL, UK",
    coordinates: { lat: 51.5074, lng: -0.1278 },
    description: "Devcon and major blockchain events",
    capacity: 12000,
  },
  {
    name: "COEX Convention Center",
    address: "513 Yeongdong-daero, Gangnam-gu, Seoul",
    coordinates: { lat: 37.5665, lng: 126.978 },
    description: "Korea Blockchain Week venue",
    capacity: 8000,
  },
  {
    name: "Miami Beach Convention Center",
    address: "1901 Convention Center Dr, Miami Beach, FL 33139",
    coordinates: { lat: 25.7617, lng: -80.1918 },
    description: "Bitcoin Miami conference venue",
    capacity: 25000,
  },
  {
    name: "Javits Center",
    address: "429 11th Ave, New York, NY 10001",
    coordinates: { lat: 40.7589, lng: -73.9851 },
    description: "NFT.NYC and major crypto events",
    capacity: 5000,
  },
  {
    name: "Lisbon Congress Centre",
    address: "Praça das Indústrias, 1300-307 Lisboa, Portugal",
    coordinates: { lat: 38.7223, lng: -9.1393 },
    description: "Solana Breakpoint venue",
    capacity: 13000,
  },
  {
    name: "Palau de la Música Catalana",
    address: "C/ Palau de la Música, 4-6, 08003 Barcelona, Spain",
    coordinates: { lat: 41.3851, lng: 2.1734 },
    description: "Avalanche Summit venue",
    capacity: 4000,
  },
  {
    name: "India Expo Centre",
    address: "Knowledge Park II, Greater Noida, Uttar Pradesh 201306",
    coordinates: { lat: 28.6139, lng: 77.209 },
    description: "Polygon Connect venue",
    capacity: 6000,
  },
  {
    name: "Madison Square Garden",
    address: "4 Pennsylvania Plaza, New York, NY 10001",
    coordinates: { lat: 40.7505, lng: -73.9934 },
    description: "Major crypto events and conferences",
    capacity: 3000,
  },
  {
    name: "Taipei International Convention Center",
    address: "1 Xinyi Rd, Sec 5, Xinyi District, Taipei 110",
    coordinates: { lat: 25.033, lng: 121.5654 },
    description: "Asia crypto conference venue",
    capacity: 2500,
  },
  {
    name: "Edinburgh International Conference Centre",
    address: "The Exchange, 150 Morrison St, Edinburgh EH3 8EE",
    coordinates: { lat: 55.9533, lng: -3.1883 },
    description: "European blockchain conferences",
    capacity: 5000,
  },
  {
    name: "Buenos Aires Convention Center",
    address: "Av. Figueroa Alcorta 2099, C1425 CABA, Argentina",
    coordinates: { lat: -34.6037, lng: -58.3816 },
    description: "South American crypto events",
    capacity: 3500,
  },
  {
    name: "Palais des Congrès",
    address: "2 Pl. de la Porte Maillot, 75017 Paris, France",
    coordinates: { lat: 48.8566, lng: 2.3522 },
    description: "European crypto conferences",
    capacity: 2000,
  },
  {
    name: "Dubai World Trade Centre",
    address: "Sheikh Zayed Rd, Trade Centre, Dubai, UAE",
    coordinates: { lat: 25.2048, lng: 55.2708 },
    description: "Middle East blockchain events",
    capacity: 4000,
  },
  {
    name: "ETH Zurich",
    address: "Rämistrasse 101, 8092 Zürich, Switzerland",
    coordinates: { lat: 47.3769, lng: 8.5417 },
    description: "Academic blockchain conferences",
    capacity: 1800,
  },
  {
    name: "Hong Kong Convention Centre",
    address: "1 Expo Dr, Wan Chai, Hong Kong",
    coordinates: { lat: 22.3193, lng: 114.1694 },
    description: "Asian blockchain summit venue",
    capacity: 3000,
  },
  {
    name: "Los Angeles Convention Center",
    address: "1201 S Figueroa St, Los Angeles, CA 90015",
    coordinates: { lat: 34.0522, lng: -118.2437 },
    description: "Web3 and gaming conferences",
    capacity: 7000,
  },
  {
    name: "Toronto Convention Centre",
    address: "255 Front St W, Toronto, ON M5V 2W6, Canada",
    coordinates: { lat: 43.6426, lng: -79.3871 },
    description: "Canadian blockchain events",
    capacity: 5500,
  },
];

// Experience speakers for events across different fields
const experienceSpeakers = [
  {
    name: "Vitalik Buterin",
    expertise: "Blockchain",
    field: "technology",
    genre: "electronic",
  },
  {
    name: "Brian Armstrong",
    expertise: "Fintech",
    field: "technology",
    genre: "pop",
  },
  {
    name: "Sarah Johnson",
    expertise: "Comedy",
    field: "entertainment",
    genre: "other",
  },
  {
    name: "Marcus Williams",
    expertise: "Jazz Performance",
    field: "music",
    genre: "jazz",
  },
  {
    name: "Elena Rodriguez",
    expertise: "Rock Performance",
    field: "music",
    genre: "rock",
  },
  {
    name: "David Chen",
    expertise: "AI/ML",
    field: "technology",
    genre: "electronic",
  },
  {
    name: "Amanda Foster",
    expertise: "Stand-up Comedy",
    field: "entertainment",
    genre: "other",
  },
  {
    name: "Robert Taylor",
    expertise: "Blues Performance",
    field: "music",
    genre: "blues",
  },
  {
    name: "Lisa Kim",
    expertise: "Product Design",
    field: "technology",
    genre: "indie",
  },
  {
    name: "Michael Brown",
    expertise: "Acoustic Performance",
    field: "music",
    genre: "folk",
  },
];

const productionSeed = async () => {
  try {
    if (!shouldSeed()) {
      console.log("🚫 Production seeding not enabled");
      return { success: false, message: "Seeding disabled" };
    }

    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI environment variable is required");
    }

    console.log("🚀 Starting production database seeding...");
    console.log("📡 Connecting to MongoDB...");

    // Connect to MongoDB (don't connect if already connected)
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("✅ Connected to production MongoDB");
    } else {
      console.log("✅ Using existing MongoDB connection");
    }

    // Check existing data
    const existingVenues = await Venue.countDocuments();
    const existingUsers = await User.countDocuments();

    console.log(`📊 Found ${existingVenues} venues, ${existingUsers} users`);

    // Only seed if database is empty or force seed is true
    if (existingVenues > 0 && process.env.FORCE_SEED !== "true") {
      console.log(
        `✅ Database already contains ${existingVenues} venues. Skipping seed.`
      );
      return {
        success: true,
        message: "Database already seeded",
        venues: existingVenues,
        users: existingUsers,
      };
    }

    console.log("🌱 Proceeding with database seeding...");

    // Clear data if force seeding
    if (process.env.FORCE_SEED === "true") {
      console.log("🧹 Clearing existing data...");
      await Promise.all([
        Venue.deleteMany({}),
        Event.deleteMany({}),
        Song.deleteMany({}),
        User.deleteMany({ username: { $ne: "admin" } }), // Keep admin
      ]);
      console.log("✅ Cleared existing data");
    }

    // Create admin user
    let adminUser = await User.findOne({ username: "admin" });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash("admin123", 12);
      adminUser = new User({
        username: "admin",
        email: "admin@megavibe.app",
        password: hashedPassword,
        displayName: "MegaVibe Admin",
        country: "Global",
        favoriteGenres: ["technology", "music", "entertainment"],
        isVerified: true,
      });
      await adminUser.save();
      console.log("✅ Created admin user");
    }

    // Create venues
    const venueData = experienceVenues.map((venue, index) => ({
      name: venue.name,
      address: venue.address,
      description: venue.description,
      location: {
        type: "Point",
        coordinates: [venue.coordinates.lng, venue.coordinates.lat],
      },
      capacity: venue.capacity,
      amenities: [
        "WiFi",
        "Sound System",
        "Video Streaming",
        "Recording Equipment",
        "Exhibition Space",
      ],
      isActive: Math.random() > 0.3, // 70% of venues are active
      contactInfo: {
        email: `info@${venue.name.toLowerCase().replace(/\s+/g, "")}.com`,
        phone: `+1-555-${String(100 + index).padStart(3, "0")}-0000`,
        website: `https://${venue.name.toLowerCase().replace(/\s+/g, "")}.com`,
      },
      ratings: {
        overall: 4.0 + Math.random() * 1.0,
        sound: 4.0 + Math.random() * 1.0,
        atmosphere: 4.0 + Math.random() * 1.0,
        service: 4.0 + Math.random() * 1.0,
        totalReviews: Math.floor(Math.random() * 200) + 50,
      },
      verificationStatus: "verified",
      createdBy: adminUser._id,
      preferredGenres: ["technology", "music", "entertainment", "conference"],
      commissionRate: 0.05 + Math.random() * 0.1, // 5-15%
    }));

    const venues = await Venue.insertMany(venueData);
    console.log(`✅ Created ${venues.length} venues`);

    // Create some sample users (speakers)
    const userData = [];
    for (let i = 0; i < experienceSpeakers.length; i++) {
      const speaker = experienceSpeakers[i];
      const hashedPassword = await bcrypt.hash("password123", 12);

      userData.push({
        username: speaker.name.toLowerCase().replace(/\s+/g, ""),
        email: `${speaker.name
          .toLowerCase()
          .replace(/\s+/g, "")}@cryptospeaker.com`,
        password: hashedPassword,
        displayName: speaker.name,
        bio: `Leading expert in ${speaker.expertise} with extensive experience in ${speaker.field}`,
        country: ["USA", "UK", "Singapore", "Germany", "Canada"][i % 5],
        favoriteGenres: [speaker.genre, speaker.field, "conference"],
        isArtist: true,
        isVerified: true,
        reputation: {
          score: 800 + Math.floor(Math.random() * 200),
          level: "Expert",
          badges: ["Verified Speaker", "Industry Leader"],
        },
      });
    }

    const users = await User.insertMany(userData);
    console.log(`✅ Created ${users.length} speaker users`);

    // Create some sample events and sessions
    const eventData = [];
    const eventTypes = ["concert", "open_mic", "other"];
    const sessionData = [];

    for (let i = 0; i < Math.min(10, venues.length); i++) {
      const venue = venues[i];
      const speaker = users[i % users.length];

      const startTime = new Date();
      startTime.setDate(startTime.getDate() + Math.floor(Math.random() * 30));
      startTime.setHours(9 + Math.floor(Math.random() * 10));

      const endTime = new Date(startTime);
      endTime.setHours(
        startTime.getHours() + 2 + Math.floor(Math.random() * 6)
      );

      // Some events are live
      const isLive = Math.random() < 0.2; // 20% chance
      if (isLive) {
        startTime.setTime(Date.now() - Math.random() * 3600000); // Started up to 1 hour ago
        endTime.setTime(Date.now() + Math.random() * 7200000); // Ends up to 2 hours from now
      }

      eventData.push({
        name: `${
          experienceSpeakers[i % experienceSpeakers.length].expertise
        } Experience 2024`,
        type: eventTypes[i % eventTypes.length],
        description: `Premier experience featuring ${
          experienceSpeakers[i % experienceSpeakers.length].expertise
        } in ${experienceSpeakers[i % experienceSpeakers.length].field}`,
        venue: venue._id,
        startTime,
        endTime,
        status: isLive ? "live" : "scheduled",
        ticketInfo: {
          price: 50 + Math.floor(Math.random() * 500),
          availableTickets: Math.floor(venue.capacity * 0.8),
        },
        artists: [
          {
            artistId: speaker._id,
            performanceOrder: 1,
            setDuration: 60,
            status: "confirmed",
          },
        ],
        attendance: {
          expected: Math.floor(venue.capacity * 0.6),
          checkedIn: Math.floor(venue.capacity * 0.4),
          peak: Math.floor(venue.capacity * 0.5),
        },
        createdBy: adminUser._id,
      });
    }

    const events = await Event.insertMany(eventData);
    console.log(`✅ Created ${events.length} events`);

    // Create sample sessions/songs for events
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const speaker = users[i % users.length];
      const speakerData = experienceSpeakers[i % experienceSpeakers.length];

      // Create 2-3 sessions per event
      const numSessions = 2 + Math.floor(Math.random() * 2);
      for (let j = 0; j < numSessions; j++) {
        sessionData.push({
          title: `${speakerData.expertise} Session ${j + 1}`,
          artist: speaker._id,
          duration: 1800 + Math.floor(Math.random() * 1800), // 30-60 minutes
          genre: speakerData.genre,
          event: event._id,
          description: `${speakerData.expertise} session featuring live performance and audience interaction`,
          tags: [speakerData.field, speakerData.expertise.toLowerCase()],
          createdBy: speaker._id,
        });
      }
    }

    const sessions = await Song.insertMany(sessionData);
    console.log(`✅ Created ${sessions.length} sessions`);

    console.log("🎉 Production database seeding completed successfully!");

    const result = {
      success: true,
      venues: venues.length,
      users: users.length + 1, // +1 for admin
      events: events.length,
      sessions: sessionData.length,
      timestamp: new Date().toISOString(),
    };

    console.log("📊 Seeding Summary:", result);
    return result;
  } catch (error) {
    console.error("❌ Production seeding failed:", error);
    throw error;
  }
};

// Auto-run if this file is executed directly or if environment variables are set
const runSeed = async () => {
  try {
    const result = await productionSeed();
    if (result.success) {
      console.log("✅ Production seeding completed successfully");
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Production seeding failed:", error.message);
    process.exit(1);
  }
};

// Export for use in other files
module.exports = {
  productionSeed,
  shouldSeed,
  runSeed,
};

// Auto-run if this is the main module
if (require.main === module) {
  // Force enable seeding when run directly
  process.env.FORCE_SEED = "true";
  runSeed();
}
