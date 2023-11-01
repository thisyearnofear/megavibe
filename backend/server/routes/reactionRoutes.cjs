const express = require('express');
const router = express.Router();
const { addReaction, updateReaction, deleteReaction, getReactions } = require('../controllers/reactionController.cjs');

router.post('/add', addReaction); // Add a new reaction
router.put('/update/:reactionId', updateReaction); // Update an existing reaction
router.delete('/delete/:reactionId', deleteReaction); // Delete a reaction
router.get('/:songId', getReactions); // Get reactions for a specific song

module.exports = router;
