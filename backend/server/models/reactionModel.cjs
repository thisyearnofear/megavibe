const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  userId: String,
  songId: String,
  rating: Number,
});

const Reaction = mongoose.model('Reaction', reactionSchema);

module.exports = Reaction;
