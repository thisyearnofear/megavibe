const mongoose = require('mongoose');

const tipSchema = new mongoose.Schema({
  songId: { type: String, required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Tip = mongoose.model('Tip', tipSchema);

module.exports = Tip;
