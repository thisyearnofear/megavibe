// eventSimulator.cjs - Service to simulate live events for MegaVibe

const Event = require("../models/Event.cjs");
const Song = require("../models/Song.cjs");
const Tip = require("../models/Tip.cjs");
const Reaction = require("../models/Reaction.cjs");
const io = require("socket.io-client");

// Connect to WebSocket server for real-time updates
const socket = io(process.env.WS_URL || "http://localhost:3000", {
  autoConnect: false,
});

// Simulated audience reactions
const audienceReactions = [
  { type: "clap", intensity: "low", count: 5 },
  { type: "clap", intensity: "medium", count: 15 },
  { type: "clap", intensity: "high", count: 30 },
  { type: "cheer", intensity: "low", count: 3 },
  { type: "cheer", intensity: "medium", count: 10 },
  { type: "cheer", intensity: "high", count: 20 },
  { type: "boo", intensity: "low", count: 2 },
  { type: "laugh", intensity: "medium", count: 8 },
];

// Function to get a random element from an array
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Function to simulate live event progression
async function simulateLiveEvent(eventId) {
  try {
    const event = await Event.findById(eventId).populate(
      "venue artist setlist"
    );
    if (!event || event.isLive === false) {
      console.log(
        `Event ${eventId} not found or not live. Stopping simulation.`
      );
      return;
    }

    console.log(
      `Starting simulation for event: ${event.title} at ${event.venue.name}`
    );

    // Connect to WebSocket if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    // Join the venue room for real-time updates
    socket.emit("join_venue", event.venue._id.toString());

    // Simulate event progression
    let currentSongIndex = 0;
    const setlist = event.setlist || [];

    // Function to change song
    const changeSong = async () => {
      if (currentSongIndex < setlist.length) {
        const currentSong = setlist[currentSongIndex];
        console.log(
          `Now playing: ${currentSong.title} by ${currentSong.artist}`
        );

        // Emit song change event to connected clients
        socket.emit("song_changed", {
          songId: currentSong._id.toString(),
          title: currentSong.title,
          artist: currentSong.artist,
          timestamp: new Date().toISOString(),
          eventId: event._id.toString(),
          venueId: event.venue._id.toString(),
        });

        // Simulate tips during the song
        simulateTips(event, currentSong);

        // Simulate audience reactions during the song
        simulateAudienceReactions(event, currentSong);

        currentSongIndex++;

        // Schedule next song change (3-4 minutes)
        const nextSongDelay = Math.random() * 60000 + 180000; // Random between 3-4 minutes
        setTimeout(changeSong, nextSongDelay);
      } else {
        // End of setlist, consider looping or ending event
        console.log(`Setlist completed for event: ${event.title}`);
        currentSongIndex = 0; // Loop back to start for continuous simulation
        changeSong(); // Continue with the first song again
      }
    };

    // Start the song progression
    changeSong();
  } catch (error) {
    console.error(`Error simulating event ${eventId}:`, error);
  }
}

// Function to simulate tips during a song
async function simulateTips(event, song) {
  try {
    // Random number of tips (1-5) during a song
    const tipCount = Math.floor(Math.random() * 5) + 1;

    for (let i = 0; i < tipCount; i++) {
      // Random delay within the song duration (spread tips across the song)
      const delay = Math.random() * 120000; // Spread over 2 minutes
      setTimeout(async () => {
        // Random tip amount between 1-20
        const amount = Math.floor(Math.random() * 20) + 1;
        const tip = new Tip({
          amount,
          fromUser: null, // Simulated tip, no real user
          event: event._id,
          song: song._id,
          venue: event.venue._id,
          artist: event.artist._id,
          isSimulated: true,
        });
        await tip.save();

        console.log(`Simulated tip of ${amount} for song ${song.title}`);

        // Emit tip received event to connected clients
        socket.emit("tip_received", {
          amount,
          fromUser: "Simulated User",
          songId: song._id.toString(),
          eventId: event._id.toString(),
          venueId: event.venue._id.toString(),
          timestamp: new Date().toISOString(),
        });
      }, delay);
    }
  } catch (error) {
    console.error("Error simulating tips:", error);
  }
}

// Function to simulate audience reactions during a song
async function simulateAudienceReactions(event, song) {
  try {
    // Random number of reaction bursts (2-6) during a song
    const reactionBurstCount = Math.floor(Math.random() * 5) + 2;

    for (let i = 0; i < reactionBurstCount; i++) {
      // Random delay within the song duration
      const delay = Math.random() * 90000 + 30000; // Spread over 1.5-2.5 minutes
      setTimeout(async () => {
        const reactionTemplate = getRandomElement(audienceReactions);
        const reaction = new Reaction({
          type: reactionTemplate.type,
          intensity: reactionTemplate.intensity,
          count: reactionTemplate.count + Math.floor(Math.random() * 5) - 2, // Slight variation
          event: event._id,
          song: song._id,
          venue: event.venue._id,
          isSimulated: true,
        });
        await reaction.save();

        console.log(
          `Simulated reaction: ${reactionTemplate.type} with intensity ${reactionTemplate.intensity}`
        );

        // Emit reaction event to connected clients
        socket.emit("audience_reaction", {
          type: reactionTemplate.type,
          intensity: reactionTemplate.intensity,
          count: reaction.count,
          eventId: event._id.toString(),
          venueId: event.venue._id.toString(),
          timestamp: new Date().toISOString(),
        });
      }, delay);
    }
  } catch (error) {
    console.error("Error simulating audience reactions:", error);
  }
}

// Function to start simulation for all live events
async function startSimulationForLiveEvents() {
  try {
    const liveEvents = await Event.find({ isLive: true });
    console.log(`Found ${liveEvents.length} live events to simulate.`);

    liveEvents.forEach((event) => {
      simulateLiveEvent(event._id);
    });
  } catch (error) {
    console.error("Error starting simulation for live events:", error);
  }
}

// Start simulation when module is loaded (could be triggered by server start)
startSimulationForLiveEvents();

// Export functions for external use if needed
module.exports = {
  simulateLiveEvent,
  startSimulationForLiveEvents,
};
