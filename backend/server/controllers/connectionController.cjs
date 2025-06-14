const LiveAttendee = require('../models/attendeeModel.cjs');
const Venue = require('../models/venueModel.cjs');
const Event = require('../models/eventModel.cjs');
const UserReputation = require('../models/reputationModel.cjs');
const Speaker = require('../models/speakerModel.cjs');
const websocketService = require('../services/websocket.cjs');

/**
 * Enhanced GPS venue detection with <3 second response time
 */
async function detectVenue(req, res, next) {
  try {
    const { latitude, longitude, accuracy = 50 } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        message: 'Latitude and longitude are required' 
      });
    }

    const startTime = Date.now();

    // Use geospatial query for fast venue detection
    const venues = await Venue.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          distanceField: 'distance',
          maxDistance: accuracy * 2, // Search within 2x GPS accuracy
          spherical: true
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: 'venueId',
          as: 'currentEvents',
          pipeline: [
            {
              $match: {
                startTime: { $lte: new Date() },
                endTime: { $gte: new Date() },
                status: 'active'
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'liveattendees',
          localField: '_id',
          foreignField: 'venueId',
          as: 'liveAttendees',
          pipeline: [
            {
              $match: {
                'sessionInfo.isActive': true
              }
            },
            {
              $count: 'total'
            }
          ]
        }
      },
      {
        $addFields: {
          attendeeCount: { $ifNull: [{ $arrayElemAt: ['$liveAttendees.total', 0] }, 0] },
          hasLiveEvent: { $gt: [{ $size: '$currentEvents' }, 0] }
        }
      },
      {
        $sort: { distance: 1, attendeeCount: -1 }
      },
      {
        $limit: 5
      }
    ]);

    const detectionTime = Date.now() - startTime;

    // If no venues found within accuracy range, expand search
    if (venues.length === 0) {
      const expandedVenues = await Venue.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            distanceField: 'distance',
            maxDistance: 500, // Expand to 500m
            spherical: true
          }
        },
        {
          $limit: 3
        }
      ]);

      return res.status(200).json({
        message: 'Venues detected with expanded search',
        venues: expandedVenues,
        detectionTime,
        accuracy: 'expanded',
        suggestedAction: 'move_closer'
      });
    }

    // Get the closest venue with high confidence
    const primaryVenue = venues[0];
    const confidence = calculateDetectionConfidence(primaryVenue.distance, accuracy);

    res.status(200).json({
      message: 'Venue detected successfully',
      venue: primaryVenue,
      alternativeVenues: venues.slice(1),
      detectionTime,
      confidence,
      accuracy: accuracy,
      canAutoConnect: confidence > 0.8
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Check in to a venue and join the live attendee network
 */
async function checkInToVenue(req, res, next) {
  try {
    const { 
      userId, 
      venueId, 
      eventId,
      latitude, 
      longitude, 
      discoveryProfile = {},
      privacy = {}
    } = req.body;

    if (!userId || !venueId || !latitude || !longitude) {
      return res.status(400).json({ 
        message: 'User ID, venue ID, and coordinates are required' 
      });
    }

    // Verify venue exists and user is actually there
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    // Calculate distance to venue
    const distance = calculateDistance(
      [longitude, latitude],
      venue.location.coordinates
    );

    if (distance > 200) { // 200m max check-in distance
      return res.status(400).json({ 
        message: 'Too far from venue to check in',
        distance,
        maxDistance: 200
      });
    }

    // Get user reputation for context
    const reputation = await UserReputation.findOne({ userId });

    // Check if user is already checked in
    let attendee = await LiveAttendee.findOne({ userId, venueId });

    if (attendee) {
      // Update existing check-in
      await attendee.updateLocation([longitude, latitude]);
      attendee.sessionInfo.isActive = true;
      attendee.sessionInfo.lastSeenAt = new Date();
      
      // Update discovery profile if provided
      if (Object.keys(discoveryProfile).length > 0) {
        attendee.discoveryProfile = { ...attendee.discoveryProfile, ...discoveryProfile };
      }
      
      await attendee.save();
    } else {
      // Create new check-in
      attendee = await LiveAttendee.create({
        userId,
        venueId,
        eventId,
        location: {
          coordinates: [longitude, latitude],
          accuracy: 10,
          lastUpdated: new Date()
        },
        discoveryProfile: {
          displayName: discoveryProfile.displayName || 'Anonymous',
          avatar: discoveryProfile.avatar,
          isVisible: discoveryProfile.isVisible !== false,
          status: discoveryProfile.status || 'Available',
          bio: discoveryProfile.bio || '',
          interests: discoveryProfile.interests || [],
          expertise: discoveryProfile.expertise || [],
          lookingFor: discoveryProfile.lookingFor || []
        },
        reputationContext: reputation ? {
          overallScore: reputation.overallScore,
          level: reputation.reputationLevel,
          badges: reputation.achievements.slice(0, 3).map(a => a.name),
          expertise: reputation.expertise.slice(0, 5)
        } : {},
        privacy: {
          shareLocation: privacy.shareLocation !== false,
          shareActivity: privacy.shareActivity !== false,
          shareReputation: privacy.shareReputation !== false,
          allowConnections: privacy.allowConnections !== false,
          visibilityRadius: privacy.visibilityRadius || 100
        }
      });
    }

    // Broadcast check-in to venue
    websocketService.broadcastToVenue(venueId, {
      type: 'USER_CHECKED_IN',
      userId,
      attendee: {
        displayName: attendee.discoveryProfile.displayName,
        status: attendee.discoveryProfile.status,
        activity: attendee.currentActivity,
        reputation: attendee.reputationContext.level
      },
      message: `${attendee.discoveryProfile.displayName} joined the venue`
    });

    // Get venue context for user
    const venueStats = await LiveAttendee.getVenueStats(venueId);
    const nearbyAttendees = await LiveAttendee.findNearbyAttendees(
      [longitude, latitude], 
      50, 
      venueId
    );

    res.status(201).json({
      message: 'Successfully checked in to venue',
      attendee,
      venueContext: {
        stats: venueStats[0] || { totalAttendees: 1, averageReputation: 0 },
        nearbyAttendees: nearbyAttendees.slice(0, 10)
      }
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Discover attendees at current venue
 */
async function discoverAttendees(req, res, next) {
  try {
    const { venueId, userId, filters = {} } = req.query;

    if (!venueId) {
      return res.status(400).json({ message: 'Venue ID is required' });
    }

    // Get current user's attendee record for context
    const currentUser = userId ? await LiveAttendee.findOne({ userId, venueId }) : null;

    // Build filter options
    const filterOptions = {
      activity: filters.activity,
      expertise: filters.expertise,
      status: filters.status,
      minReputation: filters.minReputation ? parseInt(filters.minReputation) : undefined
    };

    // Get attendees at venue
    const attendees = await LiveAttendee.findAttendeesAtVenue(venueId, filterOptions);

    // Filter out current user and apply privacy settings
    const visibleAttendees = attendees.filter(attendee => {
      if (userId && attendee.userId.toString() === userId.toString()) {
        return false; // Don't show current user
      }
      
      // Check privacy settings
      if (!attendee.discoveryProfile.isVisible) {
        return false;
      }
      
      // Check visibility radius if current user location is available
      if (currentUser && attendee.privacy.visibilityRadius) {
        const distance = calculateDistance(
          currentUser.location.coordinates,
          attendee.location.coordinates
        );
        
        if (distance > attendee.privacy.visibilityRadius) {
          return false;
        }
      }
      
      return true;
    });

    // Group attendees by activity and expertise
    const groupedAttendees = {
      byActivity: {},
      byExpertise: {},
      byStatus: {},
      all: visibleAttendees
    };

    visibleAttendees.forEach(attendee => {
      // Group by activity
      const activity = attendee.currentActivity;
      if (!groupedAttendees.byActivity[activity]) {
        groupedAttendees.byActivity[activity] = [];
      }
      groupedAttendees.byActivity[activity].push(attendee);

      // Group by status
      const status = attendee.discoveryProfile.status;
      if (!groupedAttendees.byStatus[status]) {
        groupedAttendees.byStatus[status] = [];
      }
      groupedAttendees.byStatus[status].push(attendee);

      // Group by expertise
      attendee.discoveryProfile.expertise.forEach(expertise => {
        if (!groupedAttendees.byExpertise[expertise]) {
          groupedAttendees.byExpertise[expertise] = [];
        }
        groupedAttendees.byExpertise[expertise].push(attendee);
      });
    });

    // Get venue stats
    const venueStats = await LiveAttendee.getVenueStats(venueId);

    res.status(200).json({
      message: 'Attendees discovered successfully',
      attendees: groupedAttendees,
      stats: venueStats[0] || { totalAttendees: 0 },
      filters: filterOptions
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Connect with another attendee
 */
async function connectWithAttendee(req, res, next) {
  try {
    const { userId, targetUserId, venueId, connectionType = 'Met', notes = '' } = req.body;

    if (!userId || !targetUserId || !venueId) {
      return res.status(400).json({ 
        message: 'User ID, target user ID, and venue ID are required' 
      });
    }

    // Get both attendee records
    const [userAttendee, targetAttendee] = await Promise.all([
      LiveAttendee.findOne({ userId, venueId, 'sessionInfo.isActive': true }),
      LiveAttendee.findOne({ userId: targetUserId, venueId, 'sessionInfo.isActive': true })
    ]);

    if (!userAttendee || !targetAttendee) {
      return res.status(404).json({ 
        message: 'One or both users are not currently at this venue' 
      });
    }

    // Check if target user allows connections
    if (!targetAttendee.privacy.allowConnections) {
      return res.status(403).json({ 
        message: 'Target user is not accepting connections' 
      });
    }

    // Add connection for both users
    await Promise.all([
      userAttendee.addConnection(targetUserId, connectionType, notes),
      targetAttendee.addConnection(userId, connectionType, `Connected with ${userAttendee.discoveryProfile.displayName}`)
    ]);

    // Broadcast connection to both users
    websocketService.broadcastToUser(targetUserId, {
      type: 'NEW_CONNECTION',
      fromUser: {
        id: userId,
        displayName: userAttendee.discoveryProfile.displayName,
        avatar: userAttendee.discoveryProfile.avatar
      },
      connectionType,
      venueId,
      message: `${userAttendee.discoveryProfile.displayName} connected with you`
    });

    // Update reputation for networking
    const UserReputation = require('../models/reputationModel.cjs');
    await Promise.all([
      UserReputation.findOneAndUpdate(
        { userId },
        { $inc: { 'crossEventMetrics.networkConnections': 1 } }
      ),
      UserReputation.findOneAndUpdate(
        { userId: targetUserId },
        { $inc: { 'crossEventMetrics.networkConnections': 1 } }
      )
    ]);

    res.status(200).json({
      message: 'Successfully connected with attendee',
      connection: {
        targetUser: {
          id: targetUserId,
          displayName: targetAttendee.discoveryProfile.displayName,
          avatar: targetAttendee.discoveryProfile.avatar
        },
        connectionType,
        connectedAt: new Date(),
        notes
      }
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Get current session context (speaker, event, etc.) - Enhanced with speaker profiles
 */
async function getSessionContext(req, res, next) {
  try {
    const { venueId, eventId } = req.query;

    if (!venueId) {
      return res.status(400).json({ message: 'Venue ID is required' });
    }

    // Get venue information
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    // Get current and upcoming events with populated speaker data
    const now = new Date();
    const events = await Event.find({
      venueId,
      $or: [
        { startTime: { $lte: now }, endTime: { $gte: now } }, // Current events
        { startTime: { $gt: now, $lte: new Date(now.getTime() + 2 * 60 * 60 * 1000) } } // Next 2 hours
      ]
    })
    .populate('artists.artistId', 'username profilePictureUrl')
    .sort({ startTime: 1 });

    const currentEvents = events.filter(event => 
      event.startTime <= now && event.endTime >= now
    );
    
    const upcomingEvents = events.filter(event => 
      event.startTime > now
    );

    // Get enhanced speaker profiles for current events
    const currentSpeakers = await getCurrentSpeakersWithProfiles(currentEvents);

    // Get venue stats
    const venueStats = await LiveAttendee.getVenueStats(venueId);

    // Get trending topics (based on recent tips and bounties)
    const trendingTopics = await getTrendingTopics(venueId);

    // Get speakers currently at venue (not necessarily on stage)
    const speakersAtVenue = await Speaker.findAtVenue(venueId);

    res.status(200).json({
      message: 'Session context retrieved successfully',
      context: {
        venue: {
          id: venue._id,
          name: venue.name,
          address: venue.address,
          type: venue.type,
          capacity: venue.capacity
        },
        currentEvents,
        upcomingEvents,
        currentSpeakers,
        speakersAtVenue,
        stats: venueStats[0] || { totalAttendees: 0 },
        trendingTopics,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Update user's current activity
 */
async function updateActivity(req, res, next) {
  try {
    const { userId, venueId, activity } = req.body;

    if (!userId || !venueId || !activity) {
      return res.status(400).json({ 
        message: 'User ID, venue ID, and activity are required' 
      });
    }

    const attendee = await LiveAttendee.findOne({ 
      userId, 
      venueId, 
      'sessionInfo.isActive': true 
    });

    if (!attendee) {
      return res.status(404).json({ 
        message: 'User is not currently checked in to this venue' 
      });
    }

    await attendee.updateActivity(activity);

    // Broadcast activity update
    websocketService.broadcastToVenue(venueId, {
      type: 'ACTIVITY_UPDATE',
      userId,
      activity,
      displayName: attendee.discoveryProfile.displayName,
      message: `${attendee.discoveryProfile.displayName} is now ${activity.toLowerCase()}`
    });

    res.status(200).json({
      message: 'Activity updated successfully',
      activity,
      attendee: {
        currentActivity: attendee.currentActivity,
        lastSeenAt: attendee.sessionInfo.lastSeenAt
      }
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Check out from venue
 */
async function checkOutFromVenue(req, res, next) {
  try {
    const { userId, venueId } = req.body;

    if (!userId || !venueId) {
      return res.status(400).json({ 
        message: 'User ID and venue ID are required' 
      });
    }

    const attendee = await LiveAttendee.findOne({ userId, venueId });

    if (!attendee) {
      return res.status(404).json({ 
        message: 'User is not checked in to this venue' 
      });
    }

    await attendee.checkOut();

    // Broadcast check-out
    websocketService.broadcastToVenue(venueId, {
      type: 'USER_CHECKED_OUT',
      userId,
      displayName: attendee.discoveryProfile.displayName,
      sessionDuration: attendee.currentSessionDuration,
      message: `${attendee.discoveryProfile.displayName} left the venue`
    });

    res.status(200).json({
      message: 'Successfully checked out from venue',
      sessionSummary: {
        duration: attendee.currentSessionDuration,
        connections: attendee.connections.length,
        engagement: attendee.engagement
      }
    });

  } catch (error) {
    next(error);
  }
}

// Helper Functions

function calculateDetectionConfidence(distance, accuracy) {
  // Higher confidence for closer distances and better GPS accuracy
  const distanceScore = Math.max(0, 1 - (distance / 100)); // 100m = 0 confidence
  const accuracyScore = Math.max(0, 1 - (accuracy / 50)); // 50m accuracy = 0 confidence
  
  return Math.min(1, (distanceScore + accuracyScore) / 2);
}

function calculateDistance(coord1, coord2) {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

async function getTrendingTopics(venueId) {
  // This would analyze recent tips, bounties, and content to identify trending topics
  // For now, return placeholder data
  return [
    { topic: 'Web3', mentions: 15, growth: '+25%' },
    { topic: 'DeFi', mentions: 12, growth: '+18%' },
    { topic: 'NFTs', mentions: 8, growth: '+10%' }
  ];
}

async function getCurrentSpeakersWithProfiles(currentEvents) {
  const speakers = [];
  
  for (const event of currentEvents) {
    if (event.artists && event.artists.length > 0) {
      for (const artist of event.artists) {
        try {
          const speakerProfile = await Speaker.findOne({ userId: artist.artistId._id });
          
          if (speakerProfile) {
            speakers.push({
              id: speakerProfile._id,
              userId: artist.artistId._id,
              name: speakerProfile.displayName,
              title: speakerProfile.title,
              company: speakerProfile.company,
              bio: speakerProfile.bio,
              avatar: speakerProfile.avatar || artist.artistId.profilePictureUrl,
              expertise: speakerProfile.expertise,
              socialProof: speakerProfile.socialProof,
              reputation: speakerProfile.reputation,
              currentStatus: speakerProfile.currentStatus,
              isVerified: speakerProfile.isVerified,
              verificationBadges: speakerProfile.verificationBadges,
              level: speakerProfile.level,
              eventRole: artist.status,
              eventInfo: {
                eventId: event._id,
                eventName: event.name,
                startTime: event.startTime,
                endTime: event.endTime,
                performanceOrder: artist.performanceOrder
              }
            });
          } else {
            // Fallback for speakers without detailed profiles
            speakers.push({
              id: artist.artistId._id,
              userId: artist.artistId._id,
              name: artist.artistId.username,
              avatar: artist.artistId.profilePictureUrl,
              expertise: [],
              socialProof: { followers: 0, totalTips: 0, totalBounties: 0, averageRating: 0 },
              reputation: { overallScore: 0 },
              currentStatus: 'on_stage',
              isVerified: false,
              level: 'Beginner',
              eventRole: artist.status,
              eventInfo: {
                eventId: event._id,
                eventName: event.name,
                startTime: event.startTime,
                endTime: event.endTime,
                performanceOrder: artist.performanceOrder
              }
            });
          }
        } catch (error) {
          console.error('Error fetching speaker profile:', error);
        }
      }
    }
  }
  
  return speakers;
}

/**
 * Get detailed speaker profile
 */
async function getSpeakerProfile(req, res, next) {
  try {
    const { speakerId } = req.params;
    const { includePrivate = false } = req.query;

    const speaker = await Speaker.findById(speakerId)
      .populate('userId', 'username profilePictureUrl createdAt');

    if (!speaker) {
      return res.status(404).json({ message: 'Speaker not found' });
    }

    // Filter private information based on privacy settings
    const profile = {
      id: speaker._id,
      userId: speaker.userId._id,
      displayName: speaker.displayName,
      title: speaker.title,
      company: speaker.company,
      bio: speaker.bio,
      avatar: speaker.avatar,
      coverImage: speaker.coverImage,
      expertise: speaker.expertise,
      specialties: speaker.specialties,
      languages: speaker.languages,
      yearsExperience: speaker.yearsExperience,
      totalEvents: speaker.totalEvents,
      reputation: speaker.reputation,
      socialProof: speaker.privacy.showSocialProof ? speaker.socialProof : {
        followers: 0,
        averageRating: speaker.socialProof.averageRating,
        totalRatings: speaker.socialProof.totalRatings
      },
      socialLinks: speaker.socialLinks,
      isVerified: speaker.isVerified,
      verificationBadges: speaker.verificationBadges,
      level: speaker.level,
      currentStatus: speaker.currentStatus,
      currentEvent: speaker.currentEvent,
      preferredTopics: speaker.preferredTopics,
      preferredFormats: speaker.preferredFormats,
      isAvailableForBooking: speaker.isAvailableForBooking,
      profileViews: speaker.profileViews,
      lastActive: speaker.lastActive
    };

    // Include private information if requested and authorized
    if (includePrivate && speaker.privacy.showContactInfo) {
      profile.contactEmail = speaker.contactEmail;
      profile.availability = speaker.availability;
    }

    // Include past events if privacy allows
    if (speaker.privacy.showPastEvents) {
      profile.pastEvents = speaker.pastEvents.slice(-10); // Last 10 events
    }

    // Increment profile views
    await Speaker.findByIdAndUpdate(speakerId, { $inc: { profileViews: 1 } });

    res.status(200).json({
      message: 'Speaker profile retrieved successfully',
      speaker: profile
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Find speakers by expertise for networking
 */
async function findSpeakersByExpertise(req, res, next) {
  try {
    const { 
      expertise, 
      venueId, 
      minReputation = 0, 
      minEvents = 0, 
      verified = false,
      limit = 20 
    } = req.query;

    if (!expertise) {
      return res.status(400).json({ message: 'Expertise parameter is required' });
    }

    const expertiseArray = Array.isArray(expertise) ? expertise : [expertise];
    
    // Build search options
    const options = {
      minReputation: parseInt(minReputation),
      minEvents: parseInt(minEvents),
      verified: verified === 'true',
      limit: parseInt(limit)
    };

    // Find speakers by expertise
    let speakers = await Speaker.findByExpertise(expertiseArray, options)
      .populate('userId', 'username profilePictureUrl');

    // If venueId provided, prioritize speakers currently at venue
    if (venueId) {
      const speakersAtVenue = await Speaker.findAtVenue(venueId)
        .populate('userId', 'username profilePictureUrl');
      
      // Merge and prioritize venue speakers
      const venueIds = speakersAtVenue.map(s => s._id.toString());
      const otherSpeakers = speakers.filter(s => !venueIds.includes(s._id.toString()));
      
      speakers = [...speakersAtVenue, ...otherSpeakers].slice(0, options.limit);
    }

    // Format response
    const formattedSpeakers = speakers.map(speaker => ({
      id: speaker._id,
      displayName: speaker.displayName,
      title: speaker.title,
      company: speaker.company,
      avatar: speaker.avatar,
      expertise: speaker.expertise,
      reputation: speaker.reputation,
      socialProof: {
        followers: speaker.socialProof.followers,
        averageRating: speaker.socialProof.averageRating,
        totalRatings: speaker.socialProof.totalRatings
      },
      level: speaker.level,
      currentStatus: speaker.currentStatus,
      isVerified: speaker.isVerified,
      verificationBadges: speaker.verificationBadges.slice(0, 3),
      isAtVenue: venueId ? speaker.currentEvent?.venueId?.toString() === venueId : false,
      matchScore: calculateExpertiseMatch(speaker.expertise, expertiseArray)
    }));

    res.status(200).json({
      message: 'Speakers found successfully',
      speakers: formattedSpeakers,
      total: formattedSpeakers.length,
      searchCriteria: {
        expertise: expertiseArray,
        minReputation,
        minEvents,
        verified
      }
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Get trending speakers
 */
async function getTrendingSpeakers(req, res, next) {
  try {
    const { timeframe = 7, limit = 10 } = req.query;

    const trendingSpeakers = await Speaker.getTrending(parseInt(timeframe))
      .limit(parseInt(limit));

    const formattedSpeakers = trendingSpeakers.map(speaker => ({
      id: speaker._id,
      displayName: speaker.displayName,
      title: speaker.title,
      avatar: speaker.avatar,
      expertise: speaker.expertise.slice(0, 3),
      reputation: speaker.reputation,
      socialProof: speaker.socialProof,
      level: speaker.level,
      trendingScore: speaker.trendingScore,
      isVerified: speaker.isVerified,
      verificationBadges: speaker.verificationBadges.slice(0, 2)
    }));

    res.status(200).json({
      message: 'Trending speakers retrieved successfully',
      speakers: formattedSpeakers,
      timeframe: `${timeframe} days`
    });

  } catch (error) {
    next(error);
  }
}

// Helper function to calculate expertise match score
function calculateExpertiseMatch(speakerExpertise, searchExpertise) {
  const matches = speakerExpertise.filter(skill => 
    searchExpertise.some(search => 
      skill.toLowerCase().includes(search.toLowerCase()) ||
      search.toLowerCase().includes(skill.toLowerCase())
    )
  );
  
  return Math.round((matches.length / searchExpertise.length) * 100);
}

module.exports = {
  detectVenue,
  checkInToVenue,
  discoverAttendees,
  connectWithAttendee,
  getSessionContext,
  updateActivity,
  checkOutFromVenue,
  getSpeakerProfile,
  findSpeakersByExpertise,
  getTrendingSpeakers
};