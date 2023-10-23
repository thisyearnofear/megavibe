const mongoose = require('mongoose');

const bountySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: false, // Consider whether this should be required
  },
  songId: {
    type: String,
    required: true,
  },
  bountyAmount: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Bounty = mongoose.model('Bounty', bountySchema);

module.exports = Bounty;
