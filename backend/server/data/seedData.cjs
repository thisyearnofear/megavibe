// seedData.cjs - Script to seed the MegaVibe database with realistic data

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Venue = require("../models/venueModel.cjs");
const Event = require("../models/eventModel.cjs");
const Song = require("../models/songModel.cjs");
const Artist = require("../models/userModel.cjs"); // Artists are users
const AudioSnippet = require("../models/snippetModel.cjs");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

// Debug environment variables
console.log("Environment loaded from:", path.join(__dirname, "../../.env"));
console.log("MONGO_URI:", process.env.MONGO_URI ? "Found" : "Not found");
console.log("NODE_ENV:", process.env.NODE_ENV);

// MongoDB connection
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
console.log("Using MongoDB URI:", mongoUri ? "Found" : "Not found");

mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB for seeding"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Realistic data for seeding
const venues = [
  {
    name: "Blue Note NYC",
    address: "131 W 3rd St, New York, NY 10012",
    location: {
      type: "Point",
      coordinates: [-74.0021, 40.7282],
    },
    city: "New York",
    genre: "Jazz",
    createdBy: new mongoose.Types.ObjectId(),
  },
  {
    name: "Fillmore SF",
    address: "1805 Geary Blvd, San Francisco, CA 94115",
    location: {
      type: "Point",
      coordinates: [-122.4194, 37.7849],
    },
    city: "San Francisco",
    genre: "Rock",
    createdBy: new mongoose.Types.ObjectId(),
  },
  {
    name: "The Troubadour",
    address: "9081 Santa Monica Blvd, West Hollywood, CA 90069",
    location: {
      type: "Point",
      coordinates: [-118.3893, 34.0812],
    },
    city: "Los Angeles",
    genre: "Indie",
    createdBy: new mongoose.Types.ObjectId(),
  },
  {
    name: "Ronnie Scott's",
    address: "47 Frith St, Soho, London W1D 4HT",
    location: {
      type: "Point",
      coordinates: [-0.1315, 51.5134],
    },
    city: "London",
    genre: "Jazz",
    createdBy: new mongoose.Types.ObjectId(),
  },
  {
    name: "House of Blues",
    address: "329 N Dearborn St, Chicago, IL 60654",
    location: {
      type: "Point",
      coordinates: [-87.6291, 41.8881],
    },
    city: "Chicago",
    genre: "Blues",
    createdBy: new mongoose.Types.ObjectId(),
  },
  {
    name: "The Roxy Theatre",
    address: "9009 Sunset Blvd, West Hollywood, CA 90069",
    location: {
      type: "Point",
      coordinates: [-118.3881, 34.0908],
    },
    city: "Los Angeles",
    genre: "Rock",
    createdBy: new mongoose.Types.ObjectId(),
  },
  {
    name: "Birdland Jazz Club",
    address: "315 W 44th St, New York, NY 10036",
    location: {
      type: "Point",
      coordinates: [-73.9897, 40.759],
    },
    city: "New York",
    genre: "Jazz",
    createdBy: new mongoose.Types.ObjectId(),
  },
  {
    name: "The Fillmore East",
    address: "105 2nd Ave, New York, NY 10003",
    location: {
      type: "Point",
      coordinates: [-73.9917, 40.7299],
    },
    city: "New York",
    genre: "Rock",
    createdBy: new mongoose.Types.ObjectId(),
  },
  {
    name: "Café Wha?",
    address: "115 MacDougal St, New York, NY 10012",
    location: {
      type: "Point",
      coordinates: [-74.0006, 40.73],
    },
    city: "New York",
    genre: "Folk",
    createdBy: new mongoose.Types.ObjectId(),
  },
  {
    name: "The Jazz Cafe",
    address: "5 Parkway, Camden Town, London NW1 7PG",
    location: {
      type: "Point",
      coordinates: [-0.143, 51.5387],
    },
    city: "London",
    genre: "Jazz",
    createdBy: new mongoose.Types.ObjectId(),
  },
];

const users = [
  {
    username: "Papa",
    email: "papa@example.com",
    password: "password123",
    genre: "Indie Rock",
    isArtist: true,
  },
  {
    username: "Anatu",
    email: "anatu@example.com",
    password: "password123",
    genre: "Afrobeat/Electronic",
    isArtist: true,
  },
  {
    username: "Andrew",
    email: "andrew@example.com",
    password: "password123",
    genre: "Acoustic/Singer-Songwriter",
    isArtist: true,
  },
  {
    username: "JazzMaster",
    email: "jazz@example.com",
    password: "password123",
    genre: "Jazz",
    isArtist: true,
  },
  {
    username: "RockRevival",
    email: "rock@example.com",
    password: "password123",
    genre: "Rock",
    isArtist: true,
  },
  {
    username: "IndieWaves",
    email: "indie@example.com",
    password: "password123",
    genre: "Indie",
    isArtist: true,
  },
  {
    username: "BluesBrothers",
    email: "blues@example.com",
    password: "password123",
    genre: "Blues",
    isArtist: true,
  },
  {
    username: "JazzEnsemble",
    email: "ella@example.com",
    password: "password123",
    genre: "Jazz",
    isArtist: true,
  },
  {
    username: "AcousticDreamers",
    email: "acoustic@example.com",
    password: "password123",
    genre: "Folk",
    isArtist: true,
  },
  {
    username: "ElectricVibes",
    email: "electric@example.com",
    password: "password123",
    genre: "Rock",
    isArtist: true,
  },
  {
    username: "VenueOwner1",
    email: "owner1@example.com",
    password: "password123",
    isArtist: false,
  },
  {
    username: "VenueOwner2",
    email: "owner2@example.com",
    password: "password123",
    isArtist: false,
  },
];

const artists = [
  { name: "Papa", genre: "Indie Rock" },
  { name: "Anatu", genre: "Afrobeat/Electronic" },
  { name: "Andrew", genre: "Acoustic/Singer-Songwriter" },
  { name: "John Coltrane Tribute Band", genre: "Jazz" },
  { name: "The Rolling Stones Cover", genre: "Rock" },
  { name: "Indie Waves", genre: "Indie" },
  { name: "Blues Brothers Revival", genre: "Blues" },
  { name: "Ella Fitzgerald Ensemble", genre: "Jazz" },
  { name: "Acoustic Dreamers", genre: "Folk" },
  { name: "Electric Vibes", genre: "Rock" },
  { name: "Soulful Harmony", genre: "Soul" },
  { name: "Rhythm Masters", genre: "R&B" },
  { name: "City Beats", genre: "Hip-Hop" },
];

const songs = [
  // Papa's songs
  { title: "Chupacabra", artist: "Papa", duration: 245000 },
  { title: "Digital Dreams", artist: "Papa", duration: 198000 },
  { title: "City Lights", artist: "Papa", duration: 223000 },
  { title: "Midnight Drive", artist: "Papa", duration: 267000 },
  { title: "Electric Soul", artist: "Papa", duration: 234000 },

  // Anatu's songs
  { title: "Lagos Nights", artist: "Anatu", duration: 289000 },
  { title: "Rhythm of the Streets", artist: "Anatu", duration: 256000 },
  { title: "Ancestral Beats", artist: "Anatu", duration: 312000 },
  { title: "Modern Tribe", artist: "Anatu", duration: 278000 },
  { title: "Electronic Sunrise", artist: "Anatu", duration: 234000 },
  { title: "Digital Diaspora", artist: "Anatu", duration: 298000 },

  // Andrew's songs
  { title: "City Stories", artist: "Andrew", duration: 187000 },
  { title: "Coffee Shop Tales", artist: "Andrew", duration: 203000 },
  { title: "Rainy Day Thoughts", artist: "Andrew", duration: 176000 },
  { title: "Hometown Memories", artist: "Andrew", duration: 215000 },
  { title: "Acoustic Dreams", artist: "Andrew", duration: 192000 },
  { title: "Whispered Truths", artist: "Andrew", duration: 168000 },

  // Original songs
  {
    title: "My Favorite Things",
    artist: "John Coltrane Tribute Band",
    duration: 300000,
  },
  {
    title: "Satisfaction",
    artist: "The Rolling Stones Cover",
    duration: 240000,
  },
  { title: "Dreamy Nights", artist: "Indie Waves", duration: 210000 },
  {
    title: "Sweet Home Chicago",
    artist: "Blues Brothers Revival",
    duration: 270000,
  },
  { title: "Summertime", artist: "Ella Fitzgerald Ensemble", duration: 180000 },
  { title: "Wooden Ships", artist: "Acoustic Dreamers", duration: 200000 },
  { title: "Thunderstruck", artist: "Electric Vibes", duration: 250000 },
  { title: "Ain't No Sunshine", artist: "Soulful Harmony", duration: 230000 },
  { title: "Smooth Operator", artist: "Rhythm Masters", duration: 260000 },
  { title: "Urban Flow", artist: "City Beats", duration: 220000 },
];

const events = [
  {
    title: "Jazz Night Extravaganza",
    venue: "Blue Note NYC",
    startTime: new Date(),
    endTime: new Date(Date.now() + 10800000),
    artist: "John Coltrane Tribute Band",
    isLive: true,
  },
  {
    title: "Rock Legends Live",
    venue: "Fillmore SF",
    startTime: new Date(Date.now() + 86400000),
    endTime: new Date(Date.now() + 97200000),
    artist: "The Rolling Stones Cover",
    isLive: false,
  },
  {
    title: "Indie Showcase",
    venue: "The Troubadour",
    startTime: new Date(Date.now() + 172800000),
    endTime: new Date(Date.now() + 183600000),
    artist: "Indie Waves",
    isLive: false,
  },
  {
    title: "Blues Night",
    venue: "House of Blues",
    startTime: new Date(Date.now() - 3600000),
    endTime: new Date(Date.now() + 7200000),
    artist: "Blues Brothers Revival",
    isLive: true,
  },
  {
    title: "Jazz Classics",
    venue: "Ronnie Scott's",
    startTime: new Date(Date.now() + 259200000),
    endTime: new Date(Date.now() + 270000000),
    artist: "Ella Fitzgerald Ensemble",
    isLive: false,
  },
];

// Seed function
async function seedDatabase() {
  try {
    // Clear existing data
    await Venue.deleteMany({});
    await Artist.deleteMany({});
    await Song.deleteMany({});
    await Event.deleteMany({});
    await AudioSnippet.deleteMany({});

    console.log("Cleared existing data");

    // Seed Users first
    const createdUsers = await Artist.insertMany(users);
    console.log(`Seeded ${createdUsers.length} users`);

    // Update venues with user IDs
    const venuesWithUsers = venues.map((venue, index) => ({
      ...venue,
      createdBy: createdUsers[index % createdUsers.length]._id,
    }));

    // Seed Venues
    const createdVenues = await Venue.insertMany(venuesWithUsers);
    console.log(`Seeded ${createdVenues.length} venues`);

    // Seed Artists (using user data)
    const createdArtists = createdUsers.filter((user) => user.isArtist);
    console.log(`Created ${createdArtists.length} artists from users`);

    // Seed Songs
    const createdSongs = await Song.insertMany(songs);
    console.log(`Seeded ${createdSongs.length} songs`);

    // Seed Events with references to Venues and Artists
    const eventsWithRefs = events.map((event) => {
      const venue = createdVenues.find((v) => v.name === event.venue);
      const artist = createdArtists.find((a) => a.name === event.artist);
      return {
        ...event,
        venue: venue ? venue._id : null,
        artist: artist ? artist._id : null,
        setlist: createdSongs
          .filter((s) => s.artist === event.artist)
          .map((s) => s._id),
      };
    });

    const createdEvents = await Event.insertMany(eventsWithRefs);
    console.log(`Seeded ${createdEvents.length} events`);

    // Seed Audio Snippets (demo data)
    const audioSnippets = [
      {
        title: "Live Jazz Performance",
        creator: createdArtists[0]._id,
        venue: createdVenues[0]._id,
        event: createdEvents[0]._id,
        artist: createdArtists[0]._id,
        audioFile: {
          url: "https://example.com/audio/jazz_clip.mp3",
          duration: 180,
          format: "audio/mp3",
          size: 2048000,
        },
        stats: {
          likes: 15,
          plays: 50,
          shares: 3,
        },
        tags: ["jazz", "live", "nyc"],
        type: "performance",
        privacy: "public",
      },
      {
        title: "Acoustic Guitar Solo",
        creator: createdArtists[2]._id,
        venue: createdVenues[2]._id,
        artist: createdArtists[2]._id,
        audioFile: {
          url: "https://example.com/audio/acoustic_solo.mp3",
          duration: 240,
          format: "audio/mp3",
          size: 3072000,
        },
        stats: {
          likes: 25,
          plays: 80,
          shares: 5,
        },
        tags: ["acoustic", "indie", "solo"],
        type: "performance",
        privacy: "public",
      },
      {
        title: "Electronic Beat Drop",
        creator: createdArtists[1]._id,
        venue: createdVenues[1]._id,
        artist: createdArtists[1]._id,
        audioFile: {
          url: "https://example.com/audio/electronic_beat.mp3",
          duration: 195,
          format: "audio/mp3",
          size: 2560000,
        },
        stats: {
          likes: 42,
          plays: 120,
          shares: 8,
        },
        tags: ["electronic", "afrobeat", "live"],
        type: "performance",
        privacy: "public",
      },
    ];

    const createdSnippets = await AudioSnippet.insertMany(audioSnippets);
    console.log(`Seeded ${createdSnippets.length} audio snippets`);
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run the seed function
seedDatabase();
