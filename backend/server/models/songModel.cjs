const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: true
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  originalArtist: String, // For covers
  isOriginal: {
    type: Boolean,
    default: true
  },
  duration: Number, // in seconds
  genre: {
    type: String,
    enum: ['rock', 'pop', 'jazz', 'blues', 'country', 'hip-hop', 'r&b', 'electronic', 'folk', 'indie', 'classical', 'other'],
    required: true
  },
  subGenres: [String],
  mood: {
    type: String,
    enum: ['upbeat', 'mellow', 'energetic', 'romantic', 'melancholic', 'aggressive', 'chill', 'happy', 'sad']
  },
  tempo: Number, // BPM
  key: String, // Musical key
  album: String,
  year: Number,
  coverArt: String,
  lyrics: String,
  chords: String,
  audioFile: {
    url: String,
    duration: Number,
    format: String,
    size: Number
  },
  streamingLinks: {
    spotify: String,
    apple: String,
    youtube: String,
    soundcloud: String
  },
  stats: {
    totalPlays: { type: Number, default: 0 },
    totalTips: { type: Number, default: 0 },
    totalBounties: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    popularity: { type: Number, default: 0 } // Calculated score 0-100
  },
  venueStats: [{
    venueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
    plays: { type: Number, default: 0 },
    tips: { type: Number, default: 0 },
    lastPlayed: Date
  }],
  tags: [String],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert']
  },
  instruments: [String], // Required instruments
  performanceNotes: String, // Artist's notes about performing this song
  licensing: {
    type: String,
    enum: ['original', 'cover_licensed', 'public_domain', 'pending'],
    default: 'original'
  },
  availability: {
    isActive: { type: Boolean, default: true },
    excludedVenues: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Venue' }],
    availableFrom: Date,
    availableUntil: Date
  },
  bountySettings: {
    minimumAmount: { type: Number, default: 5 },
    autoAccept: { type: Boolean, default: false },
    autoAcceptThreshold: { type: Number, default: 20 }
  },
  reactions: {
    love: { type: Number, default: 0 },
    fire: { type: Number, default: 0 },
    clap: { type: Number, default: 0 },
    wow: { type: Number, default: 0 }
  },
  collaborators: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: String // 'composer', 'lyricist', 'producer', etc.
  }],
  versions: [{
    versionName: String,
    duration: Number,
    audioFile: {
      url: String,
      format: String
    },
    recordedAt: Date,
    venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' }
  }]
}, {
  timestamps: true
});

// Compound indexes
songSchema.index({ title: 'text', originalArtist: 'text' });
songSchema.index({ artist: 1, isOriginal: 1 });
songSchema.index({ genre: 1, mood: 1 });
songSchema.index({ 'stats.popularity': -1 });

// Virtual for formatted duration
songSchema.virtual('formattedDuration').get(function() {
  if (!this.duration) return '0:00';
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Method to calculate popularity score
songSchema.methods.calculatePopularity = function() {
  const playWeight = 0.3;
  const tipWeight = 0.4;
  const reactionWeight = 0.2;
  const bountyWeight = 0.1;
  
  const totalReactions = this.reactions.love + 
    this.reactions.fire + 
    this.reactions.clap + 
    this.reactions.wow;
  
  // Normalize each metric (assuming max values)
  const normalizedPlays = Math.min(this.stats.totalPlays / 1000, 1);
  const normalizedTips = Math.min(this.stats.totalTips / 500, 1);
  const normalizedReactions = Math.min(totalReactions / 500, 1);
  const normalizedBounties = Math.min(this.stats.totalBounties / 50, 1);
  
  const score = (
    normalizedPlays * playWeight +
    normalizedTips * tipWeight +
    normalizedReactions * reactionWeight +
    normalizedBounties * bountyWeight
  ) * 100;
  
  this.stats.popularity = Math.round(score);
  return this.stats.popularity;
};

// Method to check if available at venue
songSchema.methods.isAvailableAtVenue = function(venueId) {
  if (!this.availability.isActive) return false;
  
  const now = new Date();
  if (this.availability.availableFrom && now < this.availability.availableFrom) return false;
  if (this.availability.availableUntil && now > this.availability.availableUntil) return false;
  
  return !this.availability.excludedVenues.some(
    id => id.toString() === venueId.toString()
  );
};

// Static method to search songs
songSchema.statics.searchSongs = async function(query, options = {}) {
  const {
    artistId,
    venueId,
    genre,
    mood,
    limit = 20,
    offset = 0
  } = options;
  
  const searchQuery = {};
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  if (artistId) {
    searchQuery.artist = artistId;
  }
  
  if (genre) {
    searchQuery.genre = genre;
  }
  
  if (mood) {
    searchQuery.mood = mood;
  }
  
  let queryBuilder = this.find(searchQuery);
  
  if (query) {
    queryBuilder = queryBuilder.select({ score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } });
  } else {
    queryBuilder = queryBuilder.sort({ 'stats.popularity': -1 });
  }
  
  const songs = await queryBuilder
    .skip(offset)
    .limit(limit)
    .populate('artist', 'username profilePictureUrl');
  
  // Filter by venue availability if specified
  if (venueId) {
    return songs.filter(song => song.isAvailableAtVenue(venueId));
  }
  
  return songs;
};

const Song = mongoose.model('Song', songSchema);

module.exports = Song;
