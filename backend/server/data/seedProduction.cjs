// seedProduction.cjs - Script to seed the production MegaVibe database

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");

// Import Models
const Venue = require("../models/venueModel.cjs");
const Event = require("../models/eventModel.cjs");
const Song = require("../models/songModel.cjs");
const User = require("../models/userModel.cjs");

// Production MongoDB URI - you'll need to set this
const PRODUCTION_MONGO_URI =
  process.env.PRODUCTION_MONGO_URI || process.env.MONGO_URI;

if (!PRODUCTION_MONGO_URI) {
  console.error("❌ PRODUCTION_MONGO_URI environment variable is required");
  process.exit(1);
}

// Experience events data
const experienceEvents = [
  {
    name: "TOKEN2049 Singapore",
    venue: "Marina Bay Sands",
    location: "Singapore",
    coordinates: { lat: 1.2834, lng: 103.8607 },
    expectedAttendees: 10000,
    description: "Premier crypto event in Asia featuring top industry leaders",
    focus: ["DeFi", "Web3", "Blockchain", "Tokenomics"],
  },
  {
    name: "ETHDenver 2024",
    venue: "National Ballpark",
    location: "Denver, CO",
    coordinates: { lat: 39.7392, lng: -104.9903 },
    expectedAttendees: 15000,
    description: "The largest Ethereum hackathon and conference",
    focus: ["Ethereum", "DeFi", "NFTs", "DAOs"],
  },
  {
    name: "Consensus 2024",
    venue: "Austin Convention Center",
    location: "Austin, TX",
    coordinates: { lat: 30.2672, lng: -97.7431 },
    expectedAttendees: 20000,
    description: "CoinDesk's flagship blockchain conference",
    focus: ["Blockchain", "Enterprise", "Regulation", "Innovation"],
  },
  {
    name: "Devcon 7",
    venue: "ExCeL London",
    location: "London, UK",
    coordinates: { lat: 51.5074, lng: -0.1278 },
    expectedAttendees: 12000,
    description: "Ethereum Foundation's developer conference",
    focus: ["Ethereum", "Development", "Scaling", "Research"],
  },
  {
    name: "Korea Blockchain Week",
    venue: "COEX Convention Center",
    location: "Seoul, South Korea",
    coordinates: { lat: 37.5665, lng: 126.978 },
    expectedAttendees: 8000,
    description: "Asia's premier blockchain conference",
    focus: ["Blockchain", "Gaming", "Metaverse", "DeFi"],
  },
  {
    name: "Bitcoin Miami",
    venue: "Miami Beach Convention Center",
    location: "Miami, FL",
    coordinates: { lat: 25.7617, lng: -80.1918 },
    expectedAttendees: 25000,
    description: "The biggest Bitcoin event in the world",
    focus: ["Bitcoin", "Lightning", "Mining", "Adoption"],
  },
  {
    name: "NFT.NYC",
    venue: "Javits Center",
    location: "New York, NY",
    coordinates: { lat: 40.7589, lng: -73.9851 },
    expectedAttendees: 5000,
    description: "The premier NFT conference and festival",
    focus: ["NFTs", "Art", "Gaming", "Collectibles"],
  },
  {
    name: "Solana Breakpoint",
    venue: "Lisbon Congress Centre",
    location: "Lisbon, Portugal",
    coordinates: { lat: 38.7223, lng: -9.1393 },
    expectedAttendees: 13000,
    description: "Solana's annual conference for builders",
    focus: ["Solana", "DeFi", "Gaming", "Mobile"],
  },
  {
    name: "Avalanche Summit",
    venue: "Palau de la Música Catalana",
    location: "Barcelona, Spain",
    coordinates: { lat: 41.3851, lng: 2.1734 },
    expectedAttendees: 4000,
    description: "Avalanche ecosystem conference",
    focus: ["Avalanche", "Subnets", "DeFi", "Enterprise"],
  },
  {
    name: "Polygon Connect",
    venue: "India Expo Centre",
    location: "New Delhi, India",
    coordinates: { lat: 28.6139, lng: 77.209 },
    expectedAttendees: 6000,
    description: "Polygon's flagship developer conference",
    focus: ["Polygon", "Scaling", "zkEVM", "Web3"],
  },
  {
    name: "Chainlink SmartCon",
    venue: "Times Square",
    location: "New York, NY",
    coordinates: { lat: 40.758, lng: -73.9855 },
    expectedAttendees: 3000,
    description: "Chainlink's annual smart contract conference",
    focus: ["Oracles", "DeFi", "Insurance", "Gaming"],
  },
  {
    name: "Cosmos Hub Conference",
    venue: "Taipei International Convention Center",
    location: "Taipei, Taiwan",
    coordinates: { lat: 25.033, lng: 121.5654 },
    expectedAttendees: 2500,
    description: "Conference for the Cosmos ecosystem",
    focus: ["Cosmos", "IBC", "Interoperability", "Validators"],
  },
  {
    name: "Near REDACTED",
    venue: "Lisbon Web Summit",
    location: "Lisbon, Portugal",
    coordinates: { lat: 38.7223, lng: -9.1393 },
    expectedAttendees: 1500,
    description: "NEAR Protocol's developer conference",
    focus: ["NEAR", "Sharding", "DApps", "JavaScript"],
  },
  {
    name: "Cardano Summit",
    venue: "Edinburgh International Conference Centre",
    location: "Edinburgh, Scotland",
    coordinates: { lat: 55.9533, lng: -3.1883 },
    expectedAttendees: 5000,
    description: "Annual Cardano ecosystem conference",
    focus: ["Cardano", "Sustainability", "Academia", "Governance"],
  },
  {
    name: "Polkadot Decoded",
    venue: "Buenos Aires Convention Center",
    location: "Buenos Aires, Argentina",
    coordinates: { lat: -34.6037, lng: -58.3816 },
    expectedAttendees: 3500,
    description: "Polkadot's premier conference for builders",
    focus: ["Polkadot", "Parachains", "Governance", "Cross-chain"],
  },
  {
    name: "Tezos Symposium",
    venue: "Palais des Congrès",
    location: "Paris, France",
    coordinates: { lat: 48.8566, lng: 2.3522 },
    expectedAttendees: 2000,
    description: "Academic and developer conference for Tezos",
    focus: ["Tezos", "Formal Verification", "Governance", "Art"],
  },
  {
    name: "Algorand Decipher",
    venue: "Dubai World Trade Centre",
    location: "Dubai, UAE",
    coordinates: { lat: 25.2048, lng: 55.2708 },
    expectedAttendees: 4000,
    description: "Algorand's annual conference",
    focus: ["Algorand", "Pure Proof of Stake", "CBDCs", "Sustainability"],
  },
  {
    name: "Internet Computer Conference",
    venue: "ETH Zurich",
    location: "Zurich, Switzerland",
    coordinates: { lat: 47.3769, lng: 8.5417 },
    expectedAttendees: 1800,
    description: "DFINITY's Internet Computer conference",
    focus: ["Internet Computer", "Canisters", "Web3", "Decentralization"],
  },
  {
    name: "Mantle Network Summit",
    venue: "Hong Kong Convention Centre",
    location: "Hong Kong",
    coordinates: { lat: 22.3193, lng: 114.1694 },
    expectedAttendees: 3000,
    description: "Mantle's ecosystem conference focusing on L2 scaling",
    focus: ["Mantle", "Layer 2", "Scaling", "Modular Blockchain"],
  },
  {
    name: "Web3 Gaming Summit",
    venue: "Los Angeles Convention Center",
    location: "Los Angeles, CA",
    coordinates: { lat: 34.0522, lng: -118.2437 },
    expectedAttendees: 7000,
    description: "The intersection of gaming and blockchain",
    focus: ["Gaming", "NFTs", "Metaverse", "Play-to-Earn"],
  },
];

// Famous crypto speakers
const speakers = [
  {
    name: "Vitalik Buterin",
    expertise: "Ethereum",
    twitter: "@VitalikButerin",
  },
  { name: "Changpeng Zhao", expertise: "Exchange", twitter: "@cz_binance" },
  {
    name: "Brian Armstrong",
    expertise: "Coinbase",
    twitter: "@brian_armstrong",
  },
  { name: "Gavin Wood", expertise: "Polkadot", twitter: "@gavofyork" },
  { name: "Anatoly Yakovenko", expertise: "Solana", twitter: "@aeyakovenko" },
  { name: "Do Kwon", expertise: "Terra", twitter: "@stablekwon" },
  { name: "Andre Cronje", expertise: "DeFi", twitter: "@AndreCronjeTech" },
  { name: "Stani Kulechov", expertise: "Aave", twitter: "@StaniKulechov" },
  { name: "Hayden Adams", expertise: "Uniswap", twitter: "@haydenzadams" },
  { name: "Sergey Nazarov", expertise: "Chainlink", twitter: "@SergeyNazarov" },
  { name: "Charles Hoskinson", expertise: "Cardano", twitter: "@IOHK_Charles" },
  { name: "Illia Polosukhin", expertise: "NEAR", twitter: "@ilblackdragon" },
  { name: "Emin Gun Sirer", expertise: "Avalanche", twitter: "@el33th4xor" },
  { name: "Silvio Micali", expertise: "Algorand", twitter: "@silviomicali" },
  { name: "Arthur Breitman", expertise: "Tezos", twitter: "@ArthurB" },
  { name: "Ryan Selkis", expertise: "Messari", twitter: "@twobitidiot" },
  { name: "Laura Shin", expertise: "Journalism", twitter: "@laurashin" },
  {
    name: "Anthony Pompliano",
    expertise: "Investment",
    twitter: "@APompliano",
  },
  { name: "Raoul Pal", expertise: "Macro", twitter: "@RaoulGMI" },
  { name: "Cameron Winklevoss", expertise: "Gemini", twitter: "@cameron" },
];

const generateVenues = (adminUserId) => {
  return experienceEvents.map((event, index) => ({
    name: event.venue,
    address: `${event.venue}, ${event.location}`,
    description: `Premium venue hosting ${event.name} - ${event.description}`,
    location: {
      type: "Point",
      coordinates: [event.coordinates.lng, event.coordinates.lat],
    },
    capacity: event.expectedAttendees,
    amenities: [
      "WiFi",
      "Streaming",
      "Recording",
      "Sound System",
      "Exhibition Space",
    ],
    isActive: true,
    contactInfo: {
      email: `info@${event.venue.toLowerCase().replace(/\s+/g, "")}.com`,
      phone: "+1-555-0100" + index.toString().padStart(2, "0"),
      website: `https://${event.venue.toLowerCase().replace(/\s+/g, "")}.com`,
    },
    ratings: {
      overall: 4.5 + Math.random() * 0.5,
      sound: 4.0 + Math.random() * 1.0,
      atmosphere: 4.0 + Math.random() * 1.0,
      service: 4.0 + Math.random() * 1.0,
      totalReviews: Math.floor(Math.random() * 100) + 10,
    },
    verificationStatus: "verified",
    createdBy: adminUserId,
    preferredGenres: event.focus.slice(0, 3),
    commissionRate: 0.1,
  }));
};

const generateEvents = (venues, adminUserId, users) => {
  return experienceEvents.map((eventData, index) => {
    const venue = venues[index];
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 30)); // Next 30 days

    const startTime = new Date(eventDate);
    startTime.setHours(9 + Math.floor(Math.random() * 10)); // 9 AM to 7 PM start

    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 8); // 8-hour events

    // Some events are currently live
    const isLive = Math.random() < 0.3; // 30% chance of being live
    if (isLive) {
      startTime.setTime(Date.now() - Math.random() * 3600000); // Started up to 1 hour ago
      endTime.setTime(Date.now() + Math.random() * 7200000); // Ends up to 2 hours from now
    }

    return {
      name: eventData.name,
      type: "concert", // Required field
      description: eventData.description,
      venue: venue._id,
      startTime,
      endTime,
      status: isLive ? "live" : "scheduled",
      ticketInfo: {
        price: Math.floor(Math.random() * 500) + 100, // $100-$600
        availableTickets: eventData.expectedAttendees,
      },
      artists: users.slice(0, 3).map((user) => ({
        artistId: user._id,
        performanceOrder: 1,
        setDuration: 45,
        status: "confirmed",
      })),
      analytics: {
        totalTips: Math.floor(Math.random() * 10000),
        totalBounties: Math.floor(Math.random() * 5000),
        peakViewers: Math.floor(Math.random() * 1000) + 100,
      },
      attendance: {
        expected: eventData.expectedAttendees,
        checkedIn: Math.floor(eventData.expectedAttendees * 0.6),
        peak: Math.floor(eventData.expectedAttendees * 0.7),
      },
      createdBy: adminUserId, // Required field
    };
  });
};

const generateSessions = (events, users) => {
  const sessions = [];
  const topics = [
    "DeFi Revolution",
    "NFT Market Trends",
    "Blockchain Scalability",
    "Web3 UX Design",
    "DAO Governance",
    "Layer 2 Solutions",
    "Cross-chain Bridges",
    "Tokenomics 101",
    "Smart Contract Security",
    "Regulatory Landscape",
    "Institutional Adoption",
    "Gaming & Metaverse",
  ];

  events.forEach((event, eventIndex) => {
    // Generate 3-5 sessions per event
    const numSessions = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < numSessions; i++) {
      const speaker = speakers[Math.floor(Math.random() * speakers.length)];
      const topic = topics[Math.floor(Math.random() * topics.length)];

      const sessionStart = new Date(event.startTime);
      sessionStart.setMinutes(sessionStart.getMinutes() + i * 90); // 90 min apart

      const sessionEnd = new Date(sessionStart);
      sessionEnd.setMinutes(sessionEnd.getMinutes() + 45); // 45 min sessions

      sessions.push({
        title: `${topic} with ${speaker.name}`,
        artist: speaker.name,
        duration: 2700000, // 45 minutes in milliseconds
        genre: speaker.expertise,
        event: event._id,
        startTime: sessionStart,
        endTime: sessionEnd,
        description: `Deep dive into ${topic.toLowerCase()} presented by industry expert ${
          speaker.name
        }`,
        tags: [
          speaker.expertise.toLowerCase(),
          topic.toLowerCase().replace(/\s+/g, "-"),
        ],
        createdBy: users[eventIndex % users.length]._id,
      });
    }
  });

  return sessions;
};

const generateUsers = async () => {
  const hashedPassword = await bcrypt.hash("password123", 12);

  return speakers.slice(0, 20).map((speaker, index) => ({
    username: speaker.name.toLowerCase().replace(/\s+/g, ""),
    email: `${speaker.name.toLowerCase().replace(/\s+/g, "")}@crypto.com`,
    password: hashedPassword,
    displayName: speaker.name,
    bio: `${speaker.expertise} expert and blockchain thought leader`,
    country: ["USA", "UK", "Singapore", "Germany", "Canada"][index % 5],
    favoriteGenres: [speaker.expertise.toLowerCase(), "blockchain", "crypto"],
    isArtist: true,
    isVerified: true,
    socialLinks: {
      twitter: speaker.twitter,
    },
    reputation: {
      score: 800 + Math.floor(Math.random() * 200), // 800-1000
      level: "Expert",
      badges: ["Verified Speaker", "Industry Leader"],
    },
  }));
};

const seedProductionDatabase = async () => {
  try {
    console.log("🚀 Starting production database seeding...");
    console.log(
      "📡 Connecting to:",
      PRODUCTION_MONGO_URI.replace(/\/\/.*@/, "//***:***@")
    );

    // Connect to production MongoDB
    await mongoose.connect(PRODUCTION_MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to production MongoDB");

    // Check if data already exists
    const existingVenues = await Venue.countDocuments();
    const existingEvents = await Event.countDocuments();

    if (existingVenues > 0 || existingEvents > 0) {
      console.log(
        `⚠️  Database already has data (${existingVenues} venues, ${existingEvents} events)`
      );
      console.log(
        "Do you want to clear and reseed? (This will delete all existing data)"
      );

      // For production safety, require explicit confirmation
      if (process.env.FORCE_RESEED !== "true") {
        console.log("❌ Seeding cancelled. Set FORCE_RESEED=true to override");
        process.exit(0);
      }
    }

    // Clear existing data if forced
    if (process.env.FORCE_RESEED === "true") {
      await Promise.all([
        Venue.deleteMany({}),
        Event.deleteMany({}),
        Song.deleteMany({}),
        User.deleteMany({}),
      ]);
      console.log("✅ Cleared existing data");
    }

    // Create admin user first
    const hashedAdminPassword = await bcrypt.hash("admin123", 12);
    const adminUser = new User({
      username: "admin",
      email: "admin@megavibe.app",
      password: hashedAdminPassword,
      displayName: "MegaVibe Admin",
      country: "USA",
      favoriteGenres: ["crypto", "blockchain", "defi"],
      isVerified: true,
    });
    await adminUser.save();
    console.log("✅ Created admin user");

    // Generate and insert venues
    const venueData = generateVenues(adminUser._id);
    const venues = await Venue.insertMany(venueData);
    console.log(`✅ Created ${venues.length} venues`);

    // Generate and insert users
    const userData = await generateUsers();
    const users = await User.insertMany(userData);
    console.log(`✅ Created ${users.length} users`);

    // Generate and insert events
    const eventData = generateEvents(venues, adminUser._id, users);
    const events = await Event.insertMany(eventData);
    console.log(`✅ Created ${events.length} events`);

    // Generate and insert sessions/songs
    const sessionData = generateSessions(events, users);
    const sessions = await Song.insertMany(sessionData);
    console.log(`✅ Created ${sessions.length} sessions`);

    console.log("🎉 Production database seeding completed successfully!");
    console.log(`
📊 Summary:
- ${venues.length} crypto experience venues
- ${events.length} blockchain conferences
- ${sessions.length} speaking sessions
- ${users.length + 1} crypto community users
    `);

    return {
      venues: venues.length,
      events: events.length,
      sessions: sessions.length,
      users: users.length + 1,
    };
  } catch (error) {
    console.error("❌ Error seeding production database:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Disconnected from database");
  }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedProductionDatabase()
    .then((results) => {
      console.log("✅ Seeding completed successfully:", results);
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exit(1);
    });
}

module.exports = seedProductionDatabase;
