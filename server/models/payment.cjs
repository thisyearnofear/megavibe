const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  song: { type: String },
  type: { type: String, enum: ['tip', 'bounty'], required: true }, // Make type required
  status: { type: String, enum: ['pending', 'paid', 'failed'], required: true }, // Make status required
  stripePaymentIntent: { type: String },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Payment', paymentSchema);
