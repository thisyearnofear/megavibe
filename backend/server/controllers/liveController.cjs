/**
 * Live Controller
 * Handles real-time event updates and notifications for the MegaVibe platform.
 * Integrates with WebSocket service for live data broadcasting.
 */

const Event = require("../models/Event.cjs");
const Venue = require("../models/Venue.cjs");
const asyncHandler = require("express-async-handler");
const { broadcastToVenue } = require("../services/websocket.cjs");

// @desc    Update current song for an event
// @route   PUT /api/events/:id/current-song
// @access  Private (Venue Admin or Artist)
const updateCurrentSong = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (event) {
    // Check if user has permission to update this event
    if (
      event.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      res.status(403);
      throw new Error("Not authorized to update this event");
    }

    const { songId, songTitle, artist } = req.body;
    event.currentSong = {
      songId,
      songTitle,
      artist,
      updatedAt: new Date(),
    };

    const updatedEvent = await event.save();

    // Broadcast update to connected clients in the venue
    broadcastToVenue(event.venue.toString(), {
      type: "CURRENT_SONG_UPDATE",
      eventId: event._id.toString(),
      currentSong: updatedEvent.currentSong,
    });

    res.status(200).json(updatedEvent);
  } else {
    res.status(404);
    throw new Error("Event not found");
  }
});

// @desc    Send live notification for an event
// @route   POST /api/events/:id/notifications
// @access  Private (Venue Admin or Artist)
const sendNotification = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (event) {
    // Check if user has permission to send notifications for this event
    if (
      event.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      res.status(403);
      throw new Error("Not authorized to send notifications for this event");
    }

    const { message, type } = req.body;
    const notification = {
      message,
      type: type || "INFO",
      createdAt: new Date(),
    };

    event.notifications.push(notification);
    await event.save();

    // Broadcast notification to connected clients in the venue
    broadcastToVenue(event.venue.toString(), {
      type: "EVENT_NOTIFICATION",
      eventId: event._id.toString(),
      notification,
    });

    res.status(201).json(notification);
  } else {
    res.status(404);
    throw new Error("Event not found");
  }
});

// @desc    Update venue occupancy in real-time
// @route   PUT /api/venues/:id/occupancy
// @access  Private (Venue Admin)
const updateOccupancy = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.params.id);

  if (venue) {
    // Check if user has permission to update this venue
    if (
      venue.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      res.status(403);
      throw new Error("Not authorized to update this venue");
    }

    const { currentOccupancy, capacity } = req.body;
    venue.currentOccupancy = currentOccupancy;
    if (capacity) venue.capacity = capacity;

    const updatedVenue = await venue.save();

    // Broadcast update to connected clients in the venue
    broadcastToVenue(venue._id.toString(), {
      type: "OCCUPANCY_UPDATE",
      venueId: venue._id.toString(),
      currentOccupancy: updatedVenue.currentOccupancy,
      capacity: updatedVenue.capacity,
    });

    res.status(200).json(updatedVenue);
  } else {
    res.status(404);
    throw new Error("Venue not found");
  }
});

// @desc    Get live status for a venue
// @route   GET /api/venues/:id/live-status
// @access  Public
const getLiveStatus = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.params.id).populate("currentEvent");

  if (venue) {
    const status = {
      venueId: venue._id,
      name: venue.name,
      currentOccupancy: venue.currentOccupancy,
      capacity: venue.capacity,
      isLive: !!venue.currentEvent,
      currentEvent: null,
      currentSong: null,
    };

    if (venue.currentEvent) {
      const event = await Event.findById(venue.currentEvent).populate(
        "artists"
      );
      if (event) {
        status.currentEvent = {
          id: event._id,
          name: event.name,
          artists: event.artists,
          startTime: event.startTime,
        };
        status.currentSong = event.currentSong;
      }
    }

    res.status(200).json(status);
  } else {
    res.status(404);
    throw new Error("Venue not found");
  }
});

// @desc    Broadcast tip notification
// @route   POST /api/events/:id/tip-notification
// @access  Private (Venue Admin or Artist)
const broadcastTipNotification = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (event) {
    // Check if user has permission to broadcast for this event
    if (
      event.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      res.status(403);
      throw new Error("Not authorized to broadcast for this event");
    }

    const { amount, fromUser, message } = req.body;
    const tipNotification = {
      type: "TIP_RECEIVED",
      eventId: event._id.toString(),
      amount,
      fromUser: fromUser || "Anonymous",
      message: message || "",
      timestamp: new Date().toISOString(),
    };

    // Broadcast tip notification to connected clients in the venue
    broadcastToVenue(event.venue.toString(), tipNotification);

    res
      .status(200)
      .json({ message: "Tip notification broadcasted", tipNotification });
  } else {
    res.status(404);
    throw new Error("Event not found");
  }
});

module.exports = {
  updateCurrentSong,
  sendNotification,
  updateOccupancy,
  getLiveStatus,
  broadcastTipNotification,
};
