#!/usr/bin/env node

/**
 * Seed some real Web3 events to test the scraping system
 */

require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
});

const mongoose = require("mongoose");
const Event = require("../models/eventModel.cjs");
const Venue = require("../models/venueModel.cjs");
const User = require("../models/userModel.cjs");
const bcrypt = require("bcryptjs");

// Real Web3 events for 2025
const realWeb3Events = [
  {
    name: "ETHDenver 2025",
    startDate: new Date("2025-02-20"),
    endDate: new Date("2025-02-28"),
    location: "Denver, Colorado, USA",
    description:
      "The largest Web3 hackathon and conference bringing together builders, creators, and innovators from around the world.",
    website: "https://ethdenver.com",
    tags: ["ethereum", "hackathon", "web3", "defi"],
    expectedAttendees: 15000,
  },
  {
    name: "Consensus 2025",
    startDate: new Date("2025-05-15"),
    endDate: new Date("2025-05-17"),
    location: "Austin, Texas, USA",
    description:
      "CoinDesk's premier blockchain conference featuring industry leaders and cutting-edge technology.",
    website: "https://consensus.coindesk.com",
    tags: ["blockchain", "conference", "crypto", "institutional"],
    expectedAttendees: 8000,
  },
  {
    name: "Token2049 Singapore 2025",
    startDate: new Date("2025-09-18"),
    endDate: new Date("2025-09-19"),
    location: "Singapore",
    description:
      "Premier crypto conference in Asia connecting global Web3 ecosystem.",
    website: "https://token2049.com",
    tags: ["crypto", "asia", "conference", "trading"],
    expectedAttendees: 10000,
  },
  {
    name: "Devcon 8",
    startDate: new Date("2025-11-10"),
    endDate: new Date("2025-11-13"),
    location: "Bangkok, Thailand",
    description:
      "Ethereum Foundation's flagship developer conference focusing on protocol development.",
    website: "https://devcon.org",
    tags: ["ethereum", "developers", "protocol", "technical"],
    expectedAttendees: 7000,
  },
  {
    name: "EthCC 2025",
    startDate: new Date("2025-07-08"),
    endDate: new Date("2025-07-11"),
    location: "Paris, France",
    description:
      "Ethereum Community Conference bringing together the European Web3 community.",
    website: "https://ethcc.io",
    tags: ["ethereum", "europe", "community", "developers"],
    expectedAttendees: 5000,
  },
  {
    name: "Solana Breakpoint 2025",
    startDate: new Date("2025-10-15"),
    endDate: new Date("2025-10-17"),
    location: "Lisbon, Portugal",
    description:
      "Annual Solana conference showcasing the latest in high-performance blockchain technology.",
    website: "https://solana.com/breakpoint",
    tags: ["solana", "performance", "developers", "ecosystem"],
    expectedAttendees: 6000,
  },
  {
    name: "Web3 Summit 2025",
    startDate: new Date("2025-08-20"),
    endDate: new Date("2025-08-22"),
    location: "Berlin, Germany",
    description:
      "Technical conference focused on Web3 infrastructure and decentralized technologies.",
    website: "https://web3summit.com",
    tags: ["web3", "infrastructure", "decentralization", "technical"],
    expectedAttendees: 3000,
  },
  {
    name: "NFT.NYC 2025",
    startDate: new Date("2025-04-03"),
    endDate: new Date("2025-04-05"),
    location: "New York, USA",
    description: "The premier NFT and digital art conference in North America.",
    website: "https://nft.nyc",
    tags: ["nft", "digital-art", "creators", "marketplace"],
    expectedAttendees: 4000,
  },
];

async function seedScrapedEvents() {
  console.log("🌱 Seeding real Web3 events...");

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Create or get admin user
    let adminUser = await User.findOne({ username: "admin" });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash("admin123", 12);
      adminUser = new User({
        username: "admin",
        email: "admin@megavibe.com",
        password: hashedPassword,
        profile: {
          firstName: "Admin",
          lastName: "User",
          bio: "System administrator",
        },
      });
      await adminUser.save();
      console.log("✅ Created admin user");
    }

    // Create or get default venue for each location
    const createdEvents = [];

    for (const eventData of realWeb3Events) {
      console.log(`📅 Creating event: ${eventData.name}`);

      // Create or find venue
      let venue = await Venue.findOne({
        $or: [
          { name: new RegExp(eventData.location, "i") },
          { address: new RegExp(eventData.location, "i") },
        ],
      });

      if (!venue) {
        venue = new Venue({
          name: `${eventData.location} Convention Center`,
          address: eventData.location,
          description: `Premier venue in ${eventData.location} for Web3 events`,
          location: {
            type: "Point",
            coordinates: [0, 0], // Default coordinates
          },
          capacity: eventData.expectedAttendees,
          amenities: ["WiFi", "Streaming", "Recording", "Exhibition Space"],
          isActive: true,
          contactInfo: {
            email: "info@venue.com",
            phone: "+1-555-0000",
          },
          ratings: {
            overall: 4.5,
            sound: 4.5,
            atmosphere: 4.5,
            service: 4.5,
            totalReviews: 50,
          },
          verificationStatus: "verified",
          preferredGenres: ["conference", "tech"],
          commissionRate: 0.1,
          source: "scraped",
          createdBy: adminUser._id,
        });

        await venue.save();
        console.log(`  ✅ Created venue: ${venue.name}`);
      }

      // Check if event already exists
      const existingEvent = await Event.findOne({
        name: new RegExp(eventData.name, "i"),
        startTime: {
          $gte: new Date(eventData.startDate.getTime() - 24 * 60 * 60 * 1000),
          $lte: new Date(eventData.startDate.getTime() + 24 * 60 * 60 * 1000),
        },
      });

      if (existingEvent) {
        console.log(`  ⚠️  Event already exists: ${eventData.name}`);
        continue;
      }

      // Create event
      const event = new Event({
        name: eventData.name,
        type: "other",
        venue: venue._id,
        startTime: eventData.startDate,
        endTime: eventData.endDate,
        artists: [], // Will be populated later
        description: eventData.description,
        ticketInfo: {
          price: 0, // Free for now
          currency: "USD",
          availableTickets: eventData.expectedAttendees,
          soldTickets: Math.floor(eventData.expectedAttendees * 0.3), // 30% sold
        },
        attendance: {
          expected: eventData.expectedAttendees,
          checkedIn: 0,
          peak: 0,
        },
        status: eventData.startDate > new Date() ? "scheduled" : "completed",
        tags: eventData.tags,
        metadata: {
          source: "scraped",
          sourceUrl: eventData.website,
          scrapedAt: new Date(),
          isRealEvent: true,
        },
        createdBy: adminUser._id,
      });

      await event.save();
      createdEvents.push(event);
      console.log(`  ✅ Created event: ${event.name}`);
    }

    console.log(
      `\n🎉 Successfully seeded ${createdEvents.length} Web3 events!`
    );

    // Show summary
    console.log("\n📊 Event Summary:");
    const eventsByMonth = {};
    createdEvents.forEach((event) => {
      const month = event.startTime.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
      if (!eventsByMonth[month]) eventsByMonth[month] = [];
      eventsByMonth[month].push(event.name);
    });

    Object.entries(eventsByMonth).forEach(([month, events]) => {
      console.log(`  ${month}: ${events.length} events`);
      events.forEach((name) => console.log(`    - ${name}`));
    });

    return createdEvents;
  } catch (error) {
    console.error("❌ Error seeding events:", error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
  }
}

// Run the seeding
if (require.main === module) {
  seedScrapedEvents()
    .then(() => {
      console.log("✅ Seeding completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
    });
}

module.exports = seedScrapedEvents;
