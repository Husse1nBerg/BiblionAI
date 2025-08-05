// server/routes/reviews.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

// @route   POST api/reviews
// @desc    Add a new review for a book
// @access  Private
router.post('/', auth, reviewController.addReview);

// @route   GET api/reviews/:bookId
// @desc    Get all reviews for a specific book
// @access  Public (or Private, depending on if you want reviews visible without login)
router.get('/:bookId', reviewController.getReviewsForBook);

module.exports = router;