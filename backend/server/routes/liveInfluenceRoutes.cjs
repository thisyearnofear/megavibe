const express = require('express');
const router = express.Router();
const {
  recordTip,
  getSentimentAnalytics,
  recordSocialShare,
  getPerformanceSteering,
  getVenueAnalytics,
  getOrganiserToolsData,
} = require('../controllers/liveInfluenceController.cjs');

// Tip recording
router.post('/tip', recordTip);

// Sentiment analytics
router.get('/sentiment-analytics', getSentimentAnalytics);

// Social sharing
router.post('/social-share', recordSocialShare);

// Performance steering
router.get('/performance-steering/:performanceId', getPerformanceSteering);

// Venue analytics
router.get('/venue-analytics', getVenueAnalytics);

// Organiser tools
router.get('/organiser-tools', getOrganiserToolsData);

module.exports = router;