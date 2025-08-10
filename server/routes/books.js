// server/routes/books.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Import the auth middleware
const bookController = require('../controllers/bookController');


router.get('/search', bookController.searchBooks); 
router.get('/:id', bookController.getBookDetails); 
router.post('/checkout', auth, bookController.checkoutBook);
router.post('/checkin', auth, bookController.checkinBook);
router.get('/user/checked-out', auth, bookController.getUserCheckedOutBooks);
router.get('/user/history', auth, bookController.getUserCheckoutHistory);
router.get('/user/reviews', auth, bookController.getUserReviews);
router.post('/purchase-confirm', auth, bookController.purchaseConfirmation);
router.post('/register-in-db', auth, bookController.registerBookInDb);

module.exports = router;

