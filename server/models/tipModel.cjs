// server/models/tip.cjs
const mongoose = require('mongoose');

const tipSchema = new mongoose.Schema({
  songId: { type: String },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

// Customize the toJSON method to remove null values
tipSchema.set('toJSON', {
  transform: (doc, ret) => {
    Object.keys(ret).forEach(key => ret[key] === null ? delete ret[key] : {});
    return ret;
  }
});

const Tip = mongoose.model('Tip', tipSchema);

module.exports = Tip;