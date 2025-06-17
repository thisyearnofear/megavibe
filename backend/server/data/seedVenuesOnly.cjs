// seedVenuesOnly.cjs - Minimal script to seed only venues for production

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");

// Import Models
const Venue = require("../models/venueModel.cjs");
const User = require("../models/userModel.cjs");

// MongoDB connection
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("❌ MONGO_URI environment variable is required");
  process.exit(1);
}

// Minimal venue data for crypto conferences
const cryptoVenues = [
  {
    name: "Marina Bay Sands",
    address: "10 Bayfront Ave, Singapore 018956",
    coordinates: { lat: 1.2834, lng: 103.8607 },
    description: "Premium venue hosting TOKEN2049 Singapore",
  },
  {
    name: "National Ballpark",
    address: "2001 Blake St, Denver, CO 80205",
    coordinates: { lat: 39.7392, lng: -104.9903 },
    description: "ETHDenver venue",
  },
  {
    name: "Austin Convention Center",
    address: "500 E Cesar Chavez St, Austin, TX 78701",
    coordinates: { lat: 30.2672, lng: -97.7431 },
    description: "Consensus conference venue",
  },
  {
    name: "ExCeL London",
    address: "1 Western Gateway, London E16 1XL, UK",
    coordinates: { lat: 51.5074, lng: -0.1278 },
    description: "Devcon 7 venue",
  },
  {
    name: "COEX Convention Center",
    address: "513 Yeongdong-daero, Gangnam-gu, Seoul, South Korea",
    coordinates: { lat: 37.5665, lng: 126.978 },
    description: "Korea Blockchain Week venue",
  },
  {
    name: "Miami Beach Convention Center",
    address: "1901 Convention Center Dr, Miami Beach, FL 33139",
    coordinates: { lat: 25.7617, lng: -80.1918 },
    description: "Bitcoin Miami venue",
  },
  {
    name: "Javits Center",
    address: "429 11th Ave, New York, NY 10001",
    coordinates: { lat: 40.7589, lng: -73.9851 },
    description: "NFT.NYC venue",
  },
  {
    name: "Lisbon Congress Centre",
    address: "Praça das Indústrias, 1300-307 Lisboa, Portugal",
    coordinates: { lat: 38.7223, lng: -9.1393 },
    description: "Solana Breakpoint venue",
  },
  {
    name: "Palau de la Música Catalana",
    address: "C/ Palau de la Música, 4-6, 08003 Barcelona, Spain",
    coordinates: { lat: 41.3851, lng: 2.1734 },
    description: "Avalanche Summit venue",
  },
  {
    name: "India Expo Centre",
    address: "Knowledge Park II, Greater Noida, Uttar Pradesh 201306, India",
    coordinates: { lat: 28.6139, lng: 77.209 },
    description: "Polygon Connect venue",
  },
  {
    name: "Times Square",
    address: "Times Square, New York, NY 10036",
    coordinates: { lat: 40.758, lng: -73.9855 },
    description: "Chainlink SmartCon venue",
  },
  {
    name: "Taipei International Convention Center",
    address: "1 Xinyi Rd, Sec 5, Xinyi District, Taipei 110, Taiwan",
    coordinates: { lat: 25.033, lng: 121.5654 },
    description: "Cosmos Hub Conference venue",
  },
  {
    name: "Web Summit Venue",
    address: "Parque das Nações, 1990-231 Lisboa, Portugal",
    coordinates: { lat: 38.7223, lng: -9.1393 },
    description: "Near REDACTED venue",
  },
  {
    name: "Edinburgh International Conference Centre",
    address: "The Exchange, 150 Morrison St, Edinburgh EH3 8EE, UK",
    coordinates: { lat: 55.9533, lng: -3.1883 },
    description: "Cardano Summit venue",
  },
  {
    name: "Buenos Aires Convention Center",
    address: "Av. Figueroa Alcorta 2099, C1425 CABA, Argentina",
    coordinates: { lat: -34.6037, lng: -58.3816 },
    description: "Polkadot Decoded venue",
  },
  {
    name: "Palais des Congrès",
    address: "2 Pl. de la Porte Maillot, 75017 Paris, France",
    coordinates: { lat: 48.8566, lng: 2.3522 },
    description: "Tezos Symposium venue",
  },
  {
    name: "Dubai World Trade Centre",
    address: "Sheikh Zayed Rd, Trade Centre, Dubai, UAE",
    coordinates: { lat: 25.2048, lng: 55.2708 },
    description: "Algorand Decipher venue",
  },
  {
    name: "ETH Zurich",
    address: "Rämistrasse 101, 8092 Zürich, Switzerland",
    coordinates: { lat: 47.3769, lng: 8.5417 },
    description: "Internet Computer Conference venue",
  },
  {
    name: "Hong Kong Convention Centre",
    address: "1 Expo Dr, Wan Chai, Hong Kong",
    coordinates: { lat: 22.3193, lng: 114.1694 },
    description: "Mantle Network Summit venue",
  },
  {
    name: "Los Angeles Convention Center",
    address: "1201 S Figueroa St, Los Angeles, CA 90015",
    coordinates: { lat: 34.0522, lng: -118.2437 },
    description: "Web3 Gaming Summit venue",
  },
];

const seedVenuesOnly = async () => {
  try {
    console.log("🚀 Starting venue-only seeding...");
    console.log("📡 Connecting to:", mongoUri.replace(/\/\/.*@/, "//***:***@"));

    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Check if venues already exist
    const existingVenues = await Venue.countDocuments();
    console.log(`📊 Found ${existingVenues} existing venues`);

    if (existingVenues >= 10) {
      console.log("✅ Venues already seeded, skipping");
      return { venues: existingVenues, message: "Already seeded" };
    }

    // Create admin user if it doesn't exist
    let adminUser = await User.findOne({ username: "admin" });
    if (!adminUser) {
      const hashedAdminPassword = await bcrypt.hash("admin123", 12);
      adminUser = new User({
        username: "admin",
        email: "admin@megavibe.app",
        password: hashedAdminPassword,
        displayName: "MegaVibe Admin",
        country: "USA",
        favoriteGenres: ["crypto", "blockchain"],
        isVerified: true,
      });
      await adminUser.save();
      console.log("✅ Created admin user");
    } else {
      console.log("✅ Admin user already exists");
    }

    // Generate venues
    const venueData = cryptoVenues.map((venue, index) => ({
      name: venue.name,
      address: venue.address,
      description: venue.description,
      location: {
        type: "Point",
        coordinates: [venue.coordinates.lng, venue.coordinates.lat],
      },
      capacity: 1000 + index * 500, // Varied capacity
      amenities: ["WiFi", "Sound System", "Streaming", "Recording"],
      isActive: true,
      contactInfo: {
        email: `info@${venue.name.toLowerCase().replace(/\s+/g, "")}.com`,
        phone: `+1-555-010${index.toString().padStart(2, "0")}`,
      },
      ratings: {
        overall: 4.0 + Math.random() * 1.0,
        sound: 4.0 + Math.random() * 1.0,
        atmosphere: 4.0 + Math.random() * 1.0,
        service: 4.0 + Math.random() * 1.0,
        totalReviews: Math.floor(Math.random() * 100) + 10,
      },
      verificationStatus: "verified",
      createdBy: adminUser._id,
      preferredGenres: ["crypto", "blockchain", "tech"],
      commissionRate: 0.1,
    }));

    // Insert venues
    const venues = await Venue.insertMany(venueData);
    console.log(`✅ Created ${venues.length} venues`);

    console.log("🎉 Venue seeding completed successfully!");
    return {
      venues: venues.length,
      message: "Venues seeded successfully",
    };
  } catch (error) {
    console.error("❌ Error seeding venues:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Disconnected from database");
  }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedVenuesOnly()
    .then((results) => {
      console.log("✅ Seeding completed:", results);
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exit(1);
    });
}

module.exports = seedVenuesOnly;
