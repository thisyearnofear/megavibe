const express = require('express');
const router = express.Router();
const liveInfluenceController = require('../controllers/liveInfluenceController.cjs');
const { validateRequest } = require('../middleware/validationMiddleware.cjs');
const { body, query, param } = require('express-validator');

// Validation schemas
const recordTipValidation = [
  body('performanceId').isMongoId().withMessage('Valid performance ID required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('performanceChoice').optional().isString().withMessage('Performance choice must be a string'),
  body('topicRequest').optional().isString().withMessage('Topic request must be a string')
];

const sentimentAnalyticsValidation = [
  query('venueId').optional().isMongoId().withMessage('Valid venue ID required'),
  query('eventId').optional().isMongoId().withMessage('Valid event ID required'),
  query('performanceId').optional().isMongoId().withMessage('Valid performance ID required'),
  query('timeframe').optional().isIn(['live', 'hour', 'day', 'week']).withMessage('Invalid timeframe')
];

const socialShareValidation = [
  body('performanceId').optional().isMongoId().withMessage('Valid performance ID required'),
  body('snippetId').optional().isMongoId().withMessage('Valid snippet ID required'),
  body('platform').optional().isString().withMessage('Platform must be a string')
];

const performanceSteeringValidation = [
  param('performanceId').isMongoId().withMessage('Valid performance ID required')
];

const venueAnalyticsValidation = [
  query('venueId').isMongoId().withMessage('Valid venue ID required'),
  query('timeframe').optional().isIn(['live', 'hour', 'day', 'week', 'month', 'allTime']).withMessage('Invalid timeframe')
];

const organiserToolsValidation = [
  query('venueId').optional().isMongoId().withMessage('Valid venue ID required'),
  query('eventId').optional().isMongoId().withMessage('Valid event ID required')
];

/**
 * @route POST /api/live-influence/tip
 * @desc Record a tip with performance influence
 * @access Private
 */
router.post('/tip',
  recordTipValidation,
  validateRequest,
  liveInfluenceController.recordTip
);

/**
 * @route GET /api/live-influence/sentiment-analytics
 * @desc Get sentiment analytics for venue/event/performance
 * @access Public
 */
router.get('/sentiment-analytics',
  sentimentAnalyticsValidation,
  validateRequest,
  liveInfluenceController.getSentimentAnalytics
);

/**
 * @route POST /api/live-influence/social-share
 * @desc Record a social share for performance or snippet
 * @access Private
 */
router.post('/social-share',
  socialShareValidation,
  validateRequest,
  liveInfluenceController.recordSocialShare
);

/**
 * @route GET /api/live-influence/performance-steering/:performanceId
 * @desc Get performance steering data for real-time feedback
 * @access Public
 */
router.get('/performance-steering/:performanceId',
  performanceSteeringValidation,
  validateRequest,
  liveInfluenceController.getPerformanceSteering
);

/**
 * @route GET /api/live-influence/venue-analytics
 * @desc Get venue analytics for organizers
 * @access Private
 */
router.get('/venue-analytics',
  venueAnalyticsValidation,
  validateRequest,
  liveInfluenceController.getVenueAnalytics
);

/**
 * @route GET /api/live-influence/organiser-tools
 * @desc Get organiser tools data for event optimization
 * @access Private
 */
router.get('/organiser-tools',
  organiserToolsValidation,
  validateRequest,
  liveInfluenceController.getOrganiserToolsData
);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    message: 'Live Influence API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;