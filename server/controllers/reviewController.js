// server/controllers/reviewController.js
const pool = require('../config/db');

exports.addReview = async (req, res) => {
    const { book_id, rating, review_text } = req.body; // book_id here should be from your local 'books' table
    const user_id = req.user.id; // From authenticated user

    // Basic validation
    if (!book_id || !rating || !review_text) {
        return res.status(400).json({ message: 'Book ID, rating, and review text are required.' });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO reviews (user_id, book_id, rating, review_text) VALUES ($1, $2, $3, $4) RETURNING *',
            [user_id, book_id, rating, review_text]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error adding review:', err);
        res.status(500).json({ message: 'Server error adding review.' });
    }
};

exports.getReviewsForBook = async (req, res) => {
    const { bookId } = req.params; // This bookId is from your local 'books' table
    try {
        const result = await pool.query(`
            SELECT r.*, u.email FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.book_id = $1
            ORDER BY r.created_at DESC;
        `, [bookId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching reviews for book:', err);
        res.status(500).json({ message: 'Server error fetching reviews.' });
    }
};