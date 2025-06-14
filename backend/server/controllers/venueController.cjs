const Venue = require('../models/venueModel.cjs');
const Event = require('../models/eventModel.cjs');

// Get nearby venues based on coordinates
async function getNearbyVenues(req, res, next) {
  try {
    const { lat, lon, radius = 5000 } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ 
        message: 'Latitude and longitude are required' 
      });
    }
    
    const coordinates = [parseFloat(lon), parseFloat(lat)];
    const maxDistance = parseInt(radius);
    
    // Find venues near the coordinates
    const venues = await Venue.findNearby(coordinates, maxDistance);
    
    // Transform the results
    const venuesWithDistance = venues.map(venue => ({
      id: venue._id,
      name: venue.name,
      address: venue.address,
      distance: Math.round(venue.distance), // in meters
      isActive: !!venue.currentEvent,
      currentEvent: venue.currentEventDetails ? {
        id: venue.currentEventDetails._id,
        name: venue.currentEventDetails.name,
        startTime: venue.currentEventDetails.startTime,
        endTime: venue.currentEventDetails.endTime,
        artists: venue.currentEventDetails.artists.map(a => a.artistId.username || 'Unknown')
      } : null,
      location: venue.location,
      operatingHours: venue.operatingHours,
      images: venue.images
    }));
    
    res.json(venuesWithDistance);
  } catch (error) {
    next(error);
  }
}

// Get venue details by ID
async function getVenueById(req, res, next) {
  try {
    const { id } = req.params;
    
    const venue = await Venue.findById(id)
      .populate('currentEvent')
      .populate('upcomingEvents')
      .populate({
        path: 'partnerships.artistId',
        select: 'username profilePictureUrl'
      });
    
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    // Check if venue is currently open
    const isOpen = venue.isOpen();
    
    res.json({
      ...venue.toObject(),
      isOpen,
      distance: undefined // Remove distance field if present
    });
  } catch (error) {
    next(error);
  }
}

// Get current event at venue
async function getCurrentEvent(req, res, next) {
  try {
    const { id } = req.params;
    
    const venue = await Venue.findById(id).populate({
      path: 'currentEvent',
      populate: [
        {
          path: 'artists.artistId',
          select: 'username profilePictureUrl bio'
        },
        {
          path: 'setlist.songId',
          select: 'title duration genre'
        },
        {
          path: 'currentSong',
          select: 'title artist duration'
        }
      ]
    });
    
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    if (!venue.currentEvent) {
      // Check if there's a scheduled event that should be live
      const now = new Date();
      const liveEvent = await Event.findOne({
        venue: id,
        status: 'scheduled',
        startTime: { $lte: now },
        endTime: { $gte: now }
      }).populate([
        {
          path: 'artists.artistId',
          select: 'username profilePictureUrl bio'
        },
        {
          path: 'setlist.songId',
          select: 'title duration genre'
        }
      ]);
      
      if (liveEvent) {
        // Update event status to live
        liveEvent.status = 'live';
        await liveEvent.save();
        
        // Update venue's current event
        venue.currentEvent = liveEvent;
        await venue.save();
        
        return res.json(liveEvent);
      }
      
      return res.json(null);
    }
    
    // Get live stats
    const liveStats = venue.currentEvent.getLiveStats();
    
    res.json({
      ...venue.currentEvent.toObject(),
      liveStats
    });
  } catch (error) {
    next(error);
  }
}

// Create a new venue
async function createVenue(req, res, next) {
  try {
    const venueData = {
      ...req.body,
      createdBy: req.user.userId,
      location: {
        type: 'Point',
        coordinates: [req.body.longitude, req.body.latitude]
      }
    };
    
    const venue = await Venue.create(venueData);
    
    res.status(201).json({
      message: 'Venue created successfully',
      venue
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'A venue with this name already exists' 
      });
    }
    next(error);
  }
}

// Update venue information
async function updateVenue(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Don't allow updating certain fields
    delete updates._id;
    delete updates.createdBy;
    delete updates.analytics;
    
    const venue = await Venue.findById(id);
    
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    // Check if user has permission to update
    if (venue.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'You do not have permission to update this venue' 
      });
    }
    
    // Update location if coordinates provided
    if (updates.latitude && updates.longitude) {
      updates.location = {
        type: 'Point',
        coordinates: [updates.longitude, updates.latitude]
      };
      delete updates.latitude;
      delete updates.longitude;
    }
    
    const updatedVenue = await Venue.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    
    res.json({
      message: 'Venue updated successfully',
      venue: updatedVenue
    });
  } catch (error) {
    next(error);
  }
}

// Search venues
async function searchVenues(req, res, next) {
  try {
    const { q, genre, city, limit = 20, offset = 0 } = req.query;
    
    const query = {};
    
    if (q) {
      query.$text = { $search: q };
    }
    
    if (genre) {
      query.preferredGenres = genre;
    }
    
    if (city) {
      query.address = new RegExp(city, 'i');
    }
    
    let queryBuilder = Venue.find(query);
    
    if (q) {
      queryBuilder = queryBuilder
        .select({ score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });
    } else {
      queryBuilder = queryBuilder.sort({ 'ratings.overall': -1 });
    }
    
    const venues = await queryBuilder
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .populate('currentEvent', 'name startTime endTime');
    
    res.json(venues);
  } catch (error) {
    next(error);
  }
}

// Get venue analytics
async function getVenueAnalytics(req, res, next) {
  try {
    const { id } = req.params;
    const { period = '30d' } = req.query;
    
    const venue = await Venue.findById(id);
    
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    // Check permissions
    if (venue.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'You do not have permission to view analytics for this venue' 
      });
    }
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }
    
    // Get events in date range
    const events = await Event.find({
      venue: id,
      startTime: { $gte: startDate, $lte: endDate }
    });
    
    // Calculate analytics
    const analytics = {
      period,
      totalEvents: events.length,
      totalRevenue: events.reduce((sum, event) => 
        sum + event.analytics.totalTips + event.analytics.totalBounties, 0
      ),
      avgAttendance: events.reduce((sum, event) => 
        sum + event.attendance.peak, 0
      ) / (events.length || 1),
      topPerformers: [], // Would need to aggregate from events
      peakDays: [], // Would need to analyze event dates
      genreBreakdown: {} // Would need to analyze event/song genres
    };
    
    res.json({
      venue: {
        id: venue._id,
        name: venue.name
      },
      analytics
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNearbyVenues,
  getVenueById,
  getCurrentEvent,
  createVenue,
  updateVenue,
  searchVenues,
  getVenueAnalytics
};
