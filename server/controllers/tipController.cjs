const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Tip = require('../models/tip.cjs');
const { createIntent } = require('../services/stripe.cjs');
const { validatePayment } = require('../middleware/validationMiddleware.cjs');

// Create a new tip
router.post('/', [validatePayment, createTip]);

// Get all tips
router.get('/', getTips);

// Get a specific tip by ID
router.get('/:tipId', getTipById);

// Update a specific tip by ID
router.put('/:tipId', updateTip);

// Delete a specific tip by ID
router.delete('/:tipId', deleteTip);

async function createTip(req, res, next) {
  try {
    const { songId = '', amount } = req.body;
    const tip = await Tip.create({ songId, amount });
    const paymentIntent = await createIntent(amount * 100, 'gbp');
    tip.stripePaymentIntent = paymentIntent.id;
    await tip.save();
    res.status(201).json({ message: 'Tipping successful', tip });
  } catch (error) {
    next(error);
  }
}

async function getTips(req, res) {
  try {
    const tips = await Tip.find();
    res.status(200).json(tips);
  } catch (error) {
    next(error);
  }
}

async function getTipById(req, res, next) {
  const { tipId } = req.params;
  try {
    const tip = await Tip.findById(tipId);
    if (!tip) {
      res.status(404).json({ message: 'Tip not found' });
    } else {
      res.status(200).json(tip);
    }
  } catch (error) {
    next(error);
  }
}

async function updateTip(req, res, next) {
  const { tipId } = req.params;
  const { songId, amount } = req.body;
  try {
    const tip = await Tip.findByIdAndUpdate(tipId, { songId, amount }, { new: true });
    if (!tip) {
      res.status(404).json({ message: 'Tip not found' });
    } else {
      res.status(200).json({ message: 'Tip updated successfully', tip });
    }
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      res.status(404).json({ message: 'Tip not found' });
    } else {
      next(error);
    }
  }
}

async function deleteTip(req, res, next) {
  const { tipId } = req.params;
  try {
    const tip = await Tip.findByIdAndDelete(tipId);
    if (!tip) {
      res.status(404).json({ message: 'Tip not found' });
    } else {
      res.status(200).json({ message: 'Tip deleted successfully' });
    }
  } catch (error) {
    next(error);
  }
}

module.exports = router;
