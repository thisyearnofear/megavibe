const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connectionController.cjs');
const { validateRequest } = require('../middleware/validationMiddleware.cjs');
const { body, query, param } = require('express-validator');

// Validation schemas
const detectVenueValidation = [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('accuracy').optional().isInt({ min: 1, max: 1000 }).withMessage('Accuracy must be between 1-1000 meters')
];

const checkInValidation = [
  body('userId').isMongoId().withMessage('Valid user ID required'),
  body('venueId').isMongoId().withMessage('Valid venue ID required'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('eventId').optional().isMongoId().withMessage('Valid event ID required'),
  body('discoveryProfile').optional().isObject().withMessage('Discovery profile must be an object'),
  body('privacy').optional().isObject().withMessage('Privacy settings must be an object')
];

const connectValidation = [
  body('userId').isMongoId().withMessage('Valid user ID required'),
  body('targetUserId').isMongoId().withMessage('Valid target user ID required'),
  body('venueId').isMongoId().withMessage('Valid venue ID required'),
  body('connectionType').optional().isIn(['Met', 'Networked', 'Collaborated', 'Mentored']).withMessage('Invalid connection type'),
  body('notes').optional().isString().isLength({ max: 500 }).withMessage('Notes must be under 500 characters')
];

const updateActivityValidation = [
  body('userId').isMongoId().withMessage('Valid user ID required'),
  body('venueId').isMongoId().withMessage('Valid venue ID required'),
  body('activity').isIn(['Listening', 'Networking', 'Speaking', 'Presenting', 'Q&A', 'Break', 'Leaving']).withMessage('Invalid activity type')
];

const checkOutValidation = [
  body('userId').isMongoId().withMessage('Valid user ID required'),
  body('venueId').isMongoId().withMessage('Valid venue ID required')
];

const discoverAttendeesValidation = [
  query('venueId').isMongoId().withMessage('Valid venue ID required'),
  query('userId').optional().isMongoId().withMessage('Valid user ID required'),
  query('filters.activity').optional().isString().withMessage('Activity filter must be a string'),
  query('filters.expertise').optional().isString().withMessage('Expertise filter must be a string'),
  query('filters.status').optional().isString().withMessage('Status filter must be a string'),
  query('filters.minReputation').optional().isInt({ min: 0, max: 100 }).withMessage('Min reputation must be 0-100')
];

const sessionContextValidation = [
  query('venueId').isMongoId().withMessage('Valid venue ID required'),
  query('eventId').optional().isMongoId().withMessage('Valid event ID required')
];

const speakerProfileValidation = [
  param('speakerId').isMongoId().withMessage('Valid speaker ID required'),
  query('includePrivate').optional().isBoolean().withMessage('Include private must be boolean')
];

const findSpeakersValidation = [
  query('expertise').notEmpty().withMessage('Expertise parameter is required'),
  query('venueId').optional().isMongoId().withMessage('Valid venue ID required'),
  query('minReputation').optional().isInt({ min: 0, max: 100 }).withMessage('Min reputation must be 0-100'),
  query('minEvents').optional().isInt({ min: 0 }).withMessage('Min events must be non-negative'),
  query('verified').optional().isBoolean().withMessage('Verified must be boolean'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50')
];

const trendingSpeakersValidation = [
  query('timeframe').optional().isInt({ min: 1, max: 30 }).withMessage('Timeframe must be 1-30 days'),
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be 1-20')
];

// Core Connection Protocol Routes

/**
 * @route POST /api/connection/detect-venue
 * @desc Enhanced GPS venue detection with <3 second response time
 * @access Public
 */
router.post('/detect-venue', 
  detectVenueValidation,
  validateRequest,
  connectionController.detectVenue
);

/**
 * @route POST /api/connection/checkin
 * @desc Check in to a venue and join the live attendee network
 * @access Private
 */
router.post('/checkin',
  checkInValidation,
  validateRequest,
  connectionController.checkInToVenue
);

/**
 * @route GET /api/connection/discover-attendees
 * @desc Discover attendees at current venue with filtering
 * @access Private
 */
router.get('/discover-attendees',
  discoverAttendeesValidation,
  validateRequest,
  connectionController.discoverAttendees
);

/**
 * @route POST /api/connection/connect
 * @desc Connect with another attendee
 * @access Private
 */
router.post('/connect',
  connectValidation,
  validateRequest,
  connectionController.connectWithAttendee
);

/**
 * @route GET /api/connection/session-context
 * @desc Get current session context (speakers, events, etc.)
 * @access Public
 */
router.get('/session-context',
  sessionContextValidation,
  validateRequest,
  connectionController.getSessionContext
);

/**
 * @route PUT /api/connection/activity
 * @desc Update user's current activity
 * @access Private
 */
router.put('/activity',
  updateActivityValidation,
  validateRequest,
  connectionController.updateActivity
);

/**
 * @route POST /api/connection/checkout
 * @desc Check out from venue
 * @access Private
 */
router.post('/checkout',
  checkOutValidation,
  validateRequest,
  connectionController.checkOutFromVenue
);

// Speaker Profile Routes

/**
 * @route GET /api/connection/speakers/:speakerId
 * @desc Get detailed speaker profile
 * @access Public
 */
router.get('/speakers/:speakerId',
  speakerProfileValidation,
  validateRequest,
  connectionController.getSpeakerProfile
);

/**
 * @route GET /api/connection/speakers/search/expertise
 * @desc Find speakers by expertise for networking
 * @access Public
 */
router.get('/speakers/search/expertise',
  findSpeakersValidation,
  validateRequest,
  connectionController.findSpeakersByExpertise
);

/**
 * @route GET /api/connection/speakers/trending
 * @desc Get trending speakers
 * @access Public
 */
router.get('/speakers/trending',
  trendingSpeakersValidation,
  validateRequest,
  connectionController.getTrendingSpeakers
);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    message: 'Connection API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;