// server/routes/ai.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const aiController = require('../controllers/aiController');

// @route   POST api/ai/recommend
// @desc    Get AI book recommendations
// @access  Private
router.post('/recommend', auth, aiController.getRecommendations);

module.exports = router;