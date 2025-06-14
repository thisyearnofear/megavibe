// seedData.cjs - Script to seed the MegaVibe database with realistic data

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Venue = require("../models/venueModel.cjs");
const Event = require("../models/eventModel.cjs");
const Song = require("../models/songModel.cjs");
const Artist = require("../models/userModel.cjs"); // Artists are users
const AudioSnippet = require("../models/snippetModel.cjs");

// Load environment variables
dotenv.config({ path: "../.env" });

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB for seeding"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Realistic data for seeding
const venues = [
  {
    name: "Blue Note NYC",
    lat: 40.7282,
    lng: -74.0021,
    city: "New York",
    genre: "Jazz",
  },
  {
    name: "Fillmore SF",
    lat: 37.7849,
    lng: -122.4194,
    city: "San Francisco",
    genre: "Rock",
  },
  {
    name: "The Troubadour",
    lat: 34.0812,
    lng: -118.3893,
    city: "Los Angeles",
    genre: "Indie",
  },
  {
    name: "Ronnie Scott's",
    lat: 51.5134,
    lng: -0.1315,
    city: "London",
    genre: "Jazz",
  },
  {
    name: "House of Blues",
    lat: 41.8881,
    lng: -87.6291,
    city: "Chicago",
    genre: "Blues",
  },
  {
    name: "The Roxy Theatre",
    lat: 34.0908,
    lng: -118.3881,
    city: "Los Angeles",
    genre: "Rock",
  },
  {
    name: "Birdland Jazz Club",
    lat: 40.759,
    lng: -73.9897,
    city: "New York",
    genre: "Jazz",
  },
  {
    name: "The Fillmore East",
    lat: 40.7299,
    lng: -73.9917,
    city: "New York",
    genre: "Rock",
  },
  {
    name: "Café Wha?",
    lat: 40.73,
    lng: -74.0006,
    city: "New York",
    genre: "Folk",
  },
  {
    name: "The Jazz Cafe",
    lat: 51.5387,
    lng: -0.143,
    city: "London",
    genre: "Jazz",
  },
  // Add more venues for major cities
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

    // Seed Venues
    const createdVenues = await Venue.insertMany(venues);
    console.log(`Seeded ${createdVenues.length} venues`);

    // Seed Artists
    const createdArtists = await Artist.insertMany(artists);
    console.log(`Seeded ${createdArtists.length} artists`);

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
        title: "Live Jazz Clip",
        url: "https://example.com/audio/jazz_clip.mp3",
        duration: 30000,
        venue: createdVenues[0]._id,
        event: createdEvents[0]._id,
        artist: createdArtists[0]._id,
        user: new mongoose.Types.ObjectId(),
        likes: 15,
        plays: 50,
        tags: ["jazz", "live", "nyc"],
      },
      {
        title: "Rock Solo",
        url: "https://example.com/audio/rock_solo.mp3",
        duration: 45000,
        venue: createdVenues[1]._id,
        event: createdEvents[1]._id,
        artist: createdArtists[1]._id,
        user: new mongoose.Types.ObjectId(),
        likes: 25,
        plays: 80,
        tags: ["rock", "solo", "sf"],
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
