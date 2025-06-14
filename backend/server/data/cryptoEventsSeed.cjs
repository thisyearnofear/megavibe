require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
});
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Import models
const Venue = require("../models/venueModel.cjs");
const Event = require("../models/eventModel.cjs");
const Song = require("../models/songModel.cjs");
const User = require("../models/userModel.cjs");
const AudioSnippet = require("../models/snippetModel.cjs");

// Crypto/Blockchain Events for Mantle Hackathon
const cryptoEvents = [
  {
    name: "Coinfest Asia 2025",
    dates: { start: new Date("2025-08-21"), end: new Date("2025-08-22") },
    location: "Bali, Indonesia",
    coordinates: { lat: -8.3405, lng: 115.092 },
    description:
      "Largest Asian crypto festival, networking, panels, hackathons",
    venue: "Bali Convention Center",
    focus: ["DeFi", "Web3", "Hackathons", "Networking"],
    expectedAttendees: 5000,
  },
  {
    name: "ETHWarsaw 2025",
    dates: { start: new Date("2025-09-04"), end: new Date("2025-09-07") },
    location: "Warsaw, Poland",
    coordinates: { lat: 52.2297, lng: 21.0122 },
    description: "Ethereum conference & hackathon, mass adoption focus",
    venue: "Warsaw Expo",
    focus: ["Ethereum", "Mass Adoption", "Hackathons"],
    expectedAttendees: 3000,
  },
  {
    name: "CONF3RENCE 2025",
    dates: { start: new Date("2025-09-03"), end: new Date("2025-09-04") },
    location: "Dortmund, Germany",
    coordinates: { lat: 51.5136, lng: 7.4653 },
    description: "Blockchain, crypto, digital assets, European focus",
    venue: "Signal Iduna Park Convention Center",
    focus: ["Blockchain", "Digital Assets", "European Market"],
    expectedAttendees: 2500,
  },
  {
    name: "Korea Blockchain Week 2025",
    dates: { start: new Date("2025-09-22"), end: new Date("2025-09-27") },
    location: "Seoul, South Korea",
    coordinates: { lat: 37.5665, lng: 126.978 },
    description: "DeFi, NFTs, global blockchain adoption",
    venue: "COEX Convention Center",
    focus: ["DeFi", "NFTs", "Global Adoption"],
    expectedAttendees: 8000,
  },
  {
    name: "CV Summit 2025",
    dates: { start: new Date("2025-09-23"), end: new Date("2025-09-24") },
    location: "Zurich, Switzerland",
    coordinates: { lat: 47.3769, lng: 8.5417 },
    description: "European blockchain innovation, investment",
    venue: "Zurich Convention Center",
    focus: ["Innovation", "Investment", "European Blockchain"],
    expectedAttendees: 1500,
  },
  {
    name: "TOKEN2049 Singapore",
    dates: { start: new Date("2025-10-01"), end: new Date("2025-10-02") },
    location: "Singapore",
    coordinates: { lat: 1.3521, lng: 103.8198 },
    description: "Premier global crypto event, industry leaders",
    venue: "Marina Bay Sands Convention Center",
    focus: ["Global Crypto", "Industry Leaders", "Innovation"],
    expectedAttendees: 10000,
  },
  {
    name: "DappCon 25",
    dates: { start: new Date("2025-10-15"), end: new Date("2025-10-17") },
    location: "Berlin, Germany",
    coordinates: { lat: 52.52, lng: 13.405 },
    description: "Developer-focused, Ethereum, DeFi, DAOs",
    venue: "Berlin Congress Center",
    focus: ["Developers", "Ethereum", "DeFi", "DAOs"],
    expectedAttendees: 2000,
  },
  {
    name: "Zebu Live 2025",
    dates: { start: new Date("2025-10-15"), end: new Date("2025-10-17") },
    location: "London, UK",
    coordinates: { lat: 51.5074, lng: -0.1278 },
    description: "Web3, DeFi, NFTs, UK/Europe ecosystem",
    venue: "ExCeL London",
    focus: ["Web3", "DeFi", "NFTs", "European Ecosystem"],
    expectedAttendees: 4000,
  },
  {
    name: "Blockchain Life 2025",
    dates: { start: new Date("2025-10-28"), end: new Date("2025-10-29") },
    location: "Dubai, UAE",
    coordinates: { lat: 25.2048, lng: 55.2708 },
    description: "Web3, crypto, mining, insider market intelligence",
    venue: "Dubai World Trade Centre",
    focus: ["Web3", "Crypto Mining", "Market Intelligence"],
    expectedAttendees: 6000,
  },
  {
    name: "Devcon 8",
    dates: { start: new Date("2025-11-10"), end: new Date("2025-11-13") },
    location: "Buenos Aires, Argentina",
    coordinates: { lat: -34.6037, lng: -58.3816 },
    description: "Flagship Ethereum developer conference, global dev community",
    venue: "Buenos Aires Convention Center",
    focus: ["Ethereum", "Developers", "Global Community"],
    expectedAttendees: 7000,
  },
  {
    name: "European Blockchain Convention",
    dates: { start: new Date("2025-11-20"), end: new Date("2025-11-22") },
    location: "Barcelona, Spain",
    coordinates: { lat: 41.3851, lng: 2.1734 },
    description: "Largest European blockchain event, 6,000+ attendees",
    venue: "Fira Barcelona",
    focus: ["European Blockchain", "Mass Adoption", "Innovation"],
    expectedAttendees: 6500,
  },
  {
    name: "Non Fungible Conference",
    dates: { start: new Date("2025-11-25"), end: new Date("2025-11-27") },
    location: "Lisbon, Portugal",
    coordinates: { lat: 38.7223, lng: -9.1393 },
    description: "NFT and digital art, experimental festival",
    venue: "Altice Arena",
    focus: ["NFTs", "Digital Art", "Experimental Tech"],
    expectedAttendees: 3000,
  },
  {
    name: "Blockchain Futurist Conference USA",
    dates: { start: new Date("2025-11-05"), end: new Date("2025-11-06") },
    location: "Miami, USA",
    coordinates: { lat: 25.7617, lng: -80.1918 },
    description: "Blockchain, DeFi, NFTs, DAOs, immersive experiences",
    venue: "Miami Beach Convention Center",
    focus: ["Blockchain", "DeFi", "NFTs", "DAOs"],
    expectedAttendees: 5000,
  },
  {
    name: "ETHDenver 2026",
    dates: { start: new Date("2026-02-20"), end: new Date("2026-02-28") },
    location: "Denver, USA",
    coordinates: { lat: 39.7392, lng: -104.9903 },
    description: "World's largest Web3 hackathon and community gathering",
    venue: "National Ballpark",
    focus: ["Web3", "Hackathons", "Community"],
    expectedAttendees: 15000,
  },
  {
    name: "ETHDublin 2025",
    dates: { start: new Date("2025-11-15"), end: new Date("2025-11-17") },
    location: "Dublin, Ireland",
    coordinates: { lat: 53.3498, lng: -6.2603 },
    description: "Ethereum, decentralization, hands-on workshops",
    venue: "RDS Dublin",
    focus: ["Ethereum", "Decentralization", "Workshops"],
    expectedAttendees: 2000,
  },
  {
    name: "ETHPrague 2025",
    dates: { start: new Date("2025-11-08"), end: new Date("2025-11-10") },
    location: "Prague, Czech Republic",
    coordinates: { lat: 50.0755, lng: 14.4378 },
    description: "Ethereum, future concepts, developer focus",
    venue: "Prague Congress Centre",
    focus: ["Ethereum", "Future Tech", "Developers"],
    expectedAttendees: 1800,
  },
  {
    name: "Next Block Expo",
    dates: { start: new Date("2025-03-19"), end: new Date("2025-03-20") },
    location: "Warsaw, Poland",
    coordinates: { lat: 52.2297, lng: 21.0122 },
    description: "Web3 innovations, startup pitch, gaming, Women in Web3",
    venue: "Warsaw Expo",
    focus: ["Web3", "Gaming", "Women in Web3", "Startups"],
    expectedAttendees: 2500,
  },
  {
    name: "Crypto Assets Conference (CAC)",
    dates: { start: new Date("2026-03-26"), end: new Date("2026-03-26") },
    location: "Frankfurt, Germany",
    coordinates: { lat: 50.1109, lng: 8.6821 },
    description: "Blockchain, digital assets, tokenized finance",
    venue: "Frankfurt Messe",
    focus: ["Digital Assets", "Tokenized Finance", "Institutional"],
    expectedAttendees: 1200,
  },
  {
    name: "ETHBratislava 2025",
    dates: { start: new Date("2026-03-15"), end: new Date("2026-03-17") },
    location: "Bratislava, Slovakia",
    coordinates: { lat: 48.1486, lng: 17.1077 },
    description: "Ethereum, developer community, regional focus",
    venue: "Bratislava Congress Center",
    focus: ["Ethereum", "Regional Development", "Developers"],
    expectedAttendees: 800,
  },
  {
    name: "ETHSofia 2025",
    dates: { start: new Date("2026-03-22"), end: new Date("2026-03-24") },
    location: "Sofia, Bulgaria",
    coordinates: { lat: 42.6977, lng: 23.3219 },
    description: "Ethereum, hackathon, Balkan region",
    venue: "National Palace of Culture",
    focus: ["Ethereum", "Hackathons", "Balkan Region"],
    expectedAttendees: 600,
  },
];

// Sample artists/speakers for crypto events
const cryptoSpeakers = [
  "Vitalik Buterin",
  "Changpeng Zhao",
  "Brian Armstrong",
  "Kathleen Breitman",
  "Gavin Wood",
  "Charles Hoskinson",
  "Silvio Micali",
  "Anatoly Yakovenko",
  "Stani Kulechov",
  "Hayden Adams",
  "Robert Leshner",
  "Kain Warwick",
  "Andre Cronje",
  "Sandeep Nailwal",
  "Mihailo Bjelic",
  "Emin Gun Sirer",
  "Meltem Demirors",
  "Balaji Srinivasan",
  "Naval Ravikant",
  "Tim Draper",
];

// Sample songs/content for crypto events
const cryptoContent = [
  { title: "The Future of DeFi", type: "panel" },
  { title: "Web3 Mass Adoption", type: "keynote" },
  { title: "NFT Innovation Showcase", type: "demo" },
  { title: "Layer 2 Solutions Deep Dive", type: "workshop" },
  { title: "DAO Governance Models", type: "discussion" },
  { title: "Crypto Regulation Update", type: "panel" },
  { title: "Building on Ethereum", type: "tutorial" },
  { title: "Cross-Chain Interoperability", type: "technical" },
  { title: "Tokenomics Design", type: "workshop" },
  { title: "Privacy in Web3", type: "keynote" },
];

// Generate venues from events
const generateVenues = (adminUserId) => {
  return cryptoEvents.map((event, index) => ({
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

// Generate events
const generateEvents = (venues, adminUserId, users) => {
  return cryptoEvents.map((eventData, index) => {
    const venue = venues[index];
    const startDate = eventData.dates.start;
    const endDate = eventData.dates.end;

    // Generate artists array with proper structure
    const eventArtists = [];
    const speakerCount = 3 + Math.floor(Math.random() * 5); // 3-8 speakers
    for (let i = 0; i < speakerCount; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      eventArtists.push({
        artistId: randomUser._id,
        performanceOrder: i + 1,
        setDuration: 45 + Math.floor(Math.random() * 45), // 45-90 minutes
        fee: Math.floor(Math.random() * 2000) + 500, // $500-2500
        status: "confirmed",
      });
    }

    return {
      name: eventData.name,
      type: "other", // Using "other" since "conference" isn't in the enum
      venue: venue._id,
      startTime: startDate,
      endTime: endDate,
      artists: eventArtists,
      description: eventData.description,
      ticketInfo: {
        price: Math.floor(Math.random() * 500) + 200, // $200-700
        currency: "USD",
        availableTickets: eventData.expectedAttendees,
        soldTickets: Math.floor(eventData.expectedAttendees * 0.7),
      },
      attendance: {
        expected: eventData.expectedAttendees,
        checkedIn: Math.floor(eventData.expectedAttendees * 0.7),
        peak: Math.floor(eventData.expectedAttendees * 0.8),
      },
      status:
        startDate <= new Date() && endDate >= new Date() ? "live" : "scheduled",
      createdBy: adminUserId,
    };
  });
};

// Generate songs/sessions for events
const generateSongs = (events, users) => {
  const songs = [];

  events.forEach((event) => {
    // Generate 3-6 sessions per event
    const sessionCount = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < sessionCount; i++) {
      const content =
        cryptoContent[Math.floor(Math.random() * cryptoContent.length)];
      const randomUser = users[Math.floor(Math.random() * users.length)];

      songs.push({
        title: content.title,
        artist: randomUser._id, // Reference to User model
        duration: 45 + Math.floor(Math.random() * 45), // 45-90 minutes in seconds * 60
        genre: "electronic", // Using a more standard genre
        tempo: 120 + Math.floor(Math.random() * 60), // 120-180 BPM
        key: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][
          Math.floor(Math.random() * 12)
        ],
        tags: ["crypto", "blockchain", "defi"].slice(0, 2),
        lyrics: `Insights about ${content.title} from the crypto conference`,
        difficulty: ["beginner", "intermediate", "advanced"][
          Math.floor(Math.random() * 3)
        ],
        mood: ["energetic", "upbeat", "chill"][Math.floor(Math.random() * 3)],
        year: event.startTime.getFullYear(),
        stats: {
          totalPlays: Math.floor(Math.random() * 2000),
          totalTips: Math.floor(Math.random() * 500),
          totalBounties: Math.floor(Math.random() * 100),
          avgRating: 3 + Math.random() * 2, // 3-5 rating
          popularity: Math.floor(Math.random() * 100),
        },
      });
    }
  });

  return songs;
};

// Generate sample users (crypto enthusiasts)
const generateUsers = async () => {
  const users = [];
  const cryptoUsernames = [
    "CryptoWizard",
    "BlockchainBob",
    "DeFiDave",
    "NFTNinja",
    "Web3Warrior",
    "EthereumElite",
    "BitcoinBelle",
    "SmartContractSam",
    "TokenTina",
    "CryptoCarl",
  ];

  for (let i = 0; i < 20; i++) {
    const hashedPassword = await bcrypt.hash("demo123", 12);
    users.push({
      username:
        cryptoUsernames[i % cryptoUsernames.length] +
        Math.floor(Math.random() * 100),
      email: `user${i}@cryptodemo.com`,
      password: hashedPassword,
      profile: {
        firstName: ["Alex", "Jordan", "Casey", "Morgan", "Taylor"][i % 5],
        lastName: ["Smith", "Johnson", "Brown", "Davis", "Wilson"][i % 5],
        bio: "Crypto enthusiast and blockchain developer",
        interests: ["DeFi", "NFTs", "Web3", "Ethereum", "Bitcoin"].slice(0, 3),
        location: cryptoEvents[i % cryptoEvents.length].location,
      },
      walletAddress: "0x" + Math.random().toString(16).substr(2, 40),
      preferences: {
        genres: ["crypto-talk", "blockchain", "defi"],
        notifications: true,
        autoRecord: true,
      },
      stats: {
        totalTips: Math.floor(Math.random() * 1000),
        totalEarnings: Math.floor(Math.random() * 5000),
        snippetsUploaded: Math.floor(Math.random() * 50),
        eventsAttended: Math.floor(Math.random() * 10),
      },
    });
  }

  return users;
};

// Generate sample audio snippets
const generateAudioSnippets = (users, songs, events) => {
  const snippets = [];

  for (let i = 0; i < 50; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const song = songs[Math.floor(Math.random() * songs.length)];
    const event = events[Math.floor(Math.random() * events.length)];

    snippets.push({
      title: `${song.title} - Key Insights`,
      creator: user._id,
      venue: event.venue,
      event: event._id,
      artist: song.artist,
      song: song._id,
      audioFile: {
        url: `https://megavibe.vercel.app/api/audio/snippets/${i}.mp3`,
        duration: 30 + Math.floor(Math.random() * 90), // 30-120 seconds
        format: "mp3",
        size: Math.floor(Math.random() * 1000000) + 500000, // 0.5-1.5MB
        waveform: Array.from({ length: 100 }, () => Math.random()),
      },
      type: "performance",
      mood: ["energetic", "chill", "inspiring"][Math.floor(Math.random() * 3)],
      tags: ["crypto", "blockchain", "conference"],
      privacy: "public",
    });
  }

  return snippets;
};

// Main seeding function
const seedCryptoEvents = async () => {
  try {
    console.log("🚀 Starting crypto events seeding...");

    // Clear existing data
    await Promise.all([
      Venue.deleteMany({}),
      Event.deleteMany({}),
      Song.deleteMany({}),
      User.deleteMany({}),
      AudioSnippet.deleteMany({}),
    ]);
    console.log("✅ Cleared existing data");

    // Create admin user first
    const hashedAdminPassword = await bcrypt.hash("admin123", 12);
    const adminUser = new User({
      username: "admin",
      email: "admin@megavibe.vercel.app",
      password: hashedAdminPassword,
      country: "USA",
      favoriteGenres: ["crypto-talk", "blockchain", "defi"],
    });
    await adminUser.save();
    console.log("✅ Created admin user");

    // Generate and insert venues
    const venueData = generateVenues(adminUser._id);
    const venues = await Venue.insertMany(venueData);
    console.log(`✅ Created ${venues.length} venues`);

    // Generate and insert users first (needed for events)
    const userData = await generateUsers();
    const users = await User.insertMany(userData);
    console.log(`✅ Created ${users.length} users`);

    // Generate and insert events
    const eventData = generateEvents(venues, adminUser._id, users);
    const events = await Event.insertMany(eventData);
    console.log(`✅ Created ${events.length} events`);

    // Generate and insert songs/sessions
    const songData = generateSongs(events, users);
    const songs = await Song.insertMany(songData);
    console.log(`✅ Created ${songs.length} sessions`);

    // Skip audio snippets for now due to geo indexing issues
    console.log("⏭️  Skipping audio snippets for now");

    console.log("🎉 Crypto events seeding completed successfully!");
    console.log(`
📊 Summary:
- ${venues.length} crypto event venues
- ${events.length} blockchain conferences
- ${songs.length} speaking sessions
- ${users.length + 1} crypto enthusiast users
- 0 audio snippets (skipped)
    `);

    return {
      venues: venues.length,
      events: events.length,
      songs: songs.length,
      users: users.length + 1, // +1 for admin user
      snippets: 0,
    };
  } catch (error) {
    console.error("❌ Error seeding crypto events:", error);
    throw error;
  }
};

// Export for use in other files
module.exports = {
  seedCryptoEvents,
  cryptoEvents,
  cryptoSpeakers,
  cryptoContent,
};

// Run seeding if called directly
if (require.main === module) {
  // Connect directly to MongoDB without using the db service
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("Connected to MongoDB for seeding");
      return seedCryptoEvents();
    })
    .then(() => {
      console.log("Seeding completed, exiting...");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}
