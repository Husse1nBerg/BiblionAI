// server/routes/users.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Ensure your auth middleware is imported
const userController = require('../controllers/userController'); // Ensure your userController is imported

// @route   POST /api/users/favorites
// @desc    Add a book to user's favorites
// @access  Private (requires authentication)
router.post('/favorites', auth, userController.addFavoriteBook);

// @route   DELETE /api/users/favorites/:book_id
// @desc    Remove a book from user's favorites
// @access  Private (requires authentication)
router.delete('/favorites/:book_id', auth, userController.removeFavoriteBook);

// @route   GET /api/users/favorites
// @desc    Get all favorite books for the authenticated user
// @access  Private (requires authentication)
router.get('/favorites', auth, userController.getUserFavorites);

// @route   GET /api/users/favorites/status/:book_id
// @desc    Check if a specific book is favorited by the user
// @access  Private (requires authentication)
router.get('/favorites/status/:book_id', auth, userController.checkFavoriteStatus);

module.exports = router;