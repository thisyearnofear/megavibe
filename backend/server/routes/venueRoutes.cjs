const express = require('express');
const router = express.Router();
const {
  getNearbyVenues,
  getVenueById,
  getCurrentEvent,
  createVenue,
  updateVenue,
  searchVenues,
  getVenueAnalytics
} = require('../controllers/venueController.cjs');
const { validateUserSession } = require('../middleware/validationMiddleware.cjs');

// Public routes
router.get('/nearby', getNearbyVenues);
router.get('/search', searchVenues);
router.get('/:id', getVenueById);
router.get('/:id/event', getCurrentEvent);

// Protected routes
router.post('/', validateUserSession, createVenue);
router.put('/:id', validateUserSession, updateVenue);
router.get('/:id/analytics', validateUserSession, getVenueAnalytics);

module.exports = router;
