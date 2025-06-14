/**
 * Event Controller
 * Handles CRUD operations for events in the MegaVibe platform.
 * Events represent live performances or setlists at venues.
 */

const Event = require("../models/Event.cjs");
const Venue = require("../models/Venue.cjs");
const asyncHandler = require("express-async-handler");

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = asyncHandler(async (req, res) => {
  const events = await Event.find().populate("venue artists");
  res.status(200).json(events);
});

// @desc    Get a single event by ID
// @route   GET /api/events/:id
// @access  Public
const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate("venue artists");

  if (event) {
    res.status(200).json(event);
  } else {
    res.status(404);
    throw new Error("Event not found");
  }
});

// @desc    Get events by venue
// @route   GET /api/venues/:venueId/events
// @access  Public
const getEventsByVenue = asyncHandler(async (req, res) => {
  const events = await Event.find({ venue: req.params.venueId }).populate(
    "venue artists"
  );
  res.status(200).json(events);
});

// @desc    Create a new event
// @route   POST /api/events
// @access  Private (Venue Admin or Artist)
const createEvent = asyncHandler(async (req, res) => {
  const { name, venue, artists, startTime, endTime, setlist, status } =
    req.body;

  if (!name || !venue) {
    res.status(400);
    throw new Error("Name and venue are required");
  }

  // Check if venue exists
  const venueExists = await Venue.findById(venue);
  if (!venueExists) {
    res.status(400);
    throw new Error("Invalid venue");
  }

  const event = await Event.create({
    name,
    venue,
    artists: artists || [],
    startTime,
    endTime,
    setlist: setlist || [],
    status: status || "upcoming",
    createdBy: req.user._id,
  });

  if (event) {
    // Update venue with this event
    await Venue.findByIdAndUpdate(venue, { $push: { events: event._id } });

    res.status(201).json(event);
  } else {
    res.status(400);
    throw new Error("Invalid event data");
  }
});

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private (Venue Admin or Artist)
const updateEvent = asyncHandler(async (req, res) => {
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

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate("venue artists");

    res.status(200).json(updatedEvent);
  } else {
    res.status(404);
    throw new Error("Event not found");
  }
});

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private (Venue Admin or Artist)
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (event) {
    // Check if user has permission to delete this event
    if (
      event.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      res.status(403);
      throw new Error("Not authorized to delete this event");
    }

    // Remove event reference from venue
    await Venue.findByIdAndUpdate(event.venue, {
      $pull: { events: event._id },
    });

    await Event.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Event deleted successfully" });
  } else {
    res.status(404);
    throw new Error("Event not found");
  }
});

// @desc    Update event setlist
// @route   PUT /api/events/:id/setlist
// @access  Private (Venue Admin or Artist)
const updateSetlist = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (event) {
    // Check if user has permission to update this event
    if (
      event.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      res.status(403);
      throw new Error("Not authorized to update this event setlist");
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: { setlist: req.body.setlist } },
      { new: true, runValidators: true }
    ).populate("venue artists");

    res.status(200).json(updatedEvent);
  } else {
    res.status(404);
    throw new Error("Event not found");
  }
});

// @desc    Update event status
// @route   PUT /api/events/:id/status
// @access  Private (Venue Admin or Artist)
const updateEventStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const event = await Event.findById(req.params.id);

  if (event) {
    // Check if user has permission to update this event
    if (
      event.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      res.status(403);
      throw new Error("Not authorized to update this event status");
    }

    if (!["upcoming", "live", "completed", "cancelled"].includes(status)) {
      res.status(400);
      throw new Error("Invalid status value");
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true }
    ).populate("venue artists");

    // If event is live, update venue's current event
    if (status === "live") {
      await Venue.findByIdAndUpdate(event.venue, { currentEvent: event._id });
    } else if (event.status === "live" && status !== "live") {
      // If event was live and status changed, clear venue's current event
      await Venue.findByIdAndUpdate(event.venue, {
        $unset: { currentEvent: 1 },
      });
    }

    res.status(200).json(updatedEvent);
  } else {
    res.status(404);
    throw new Error("Event not found");
  }
});

module.exports = {
  getEvents,
  getEventById,
  getEventsByVenue,
  createEvent,
  updateEvent,
  deleteEvent,
  updateSetlist,
  updateEventStatus,
};
