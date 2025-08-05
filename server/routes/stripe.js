// server/routes/stripe.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const stripeController = require('../controllers/stripeController');

// @route   POST api/stripe/create-payment-intent
// @desc    Create a new Stripe PaymentIntent
// @access  Private
router.post('/create-payment-intent', auth, stripeController.createPaymentIntent);

module.exports = router;