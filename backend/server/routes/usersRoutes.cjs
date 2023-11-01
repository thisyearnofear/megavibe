const express = require('express');
const router = express.Router();
const { validateUser } = require('../middleware/validationMiddleware.cjs');
const { getUserProfile } = require('../controllers/usersController.cjs');

router.get('/:id', validateUser, getUserProfile);

module.exports = router;