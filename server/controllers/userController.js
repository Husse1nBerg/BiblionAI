// server/controllers/userController.js
const pool = require('../config/db'); // Ensure you import your database pool

// Add a book to user's favorites
exports.addFavoriteBook = async (req, res) => {
    const { book_id } = req.body; // book_id is from your local 'books' table (not Google's ID)
    const user_id = req.user.id; // User ID from the authenticated token

    if (!book_id) {
        return res.status(400).json({ message: 'Book ID is required.' });
    }

    try {
        // Check if the favorite already exists to prevent duplicates (PRIMARY KEY constraint also handles this)
        const checkExisting = await pool.query('SELECT 1 FROM favorites WHERE user_id = $1 AND book_id = $2', [user_id, book_id]);
        if (checkExisting.rows.length > 0) {
            return res.status(409).json({ message: 'Book is already in your favorites.' });
        }

        const result = await pool.query(
            'INSERT INTO favorites (user_id, book_id) VALUES ($1, $2) RETURNING *',
            [user_id, book_id]
        );
        res.status(201).json({ message: 'Book added to favorites.', favorite: result.rows[0] });
    } catch (error) {
        console.error('Error adding book to favorites:', error);
        // Catch PostgreSQL unique constraint violation (code '23505') specifically if not checked above
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Book is already in your favorites (DB constraint).' });
        }
        res.status(500).json({ message: 'Server error adding to favorites.' });
    }
};

// Remove a book from user's favorites
exports.removeFavoriteBook = async (req, res) => {
    const { book_id } = req.params; // book_id is from your local 'books' table (passed as URL param)
    const user_id = req.user.id; // User ID from the authenticated token

    try {
        const result = await pool.query(
            'DELETE FROM favorites WHERE user_id = $1 AND book_id = $2 RETURNING *',
            [user_id, book_id]
        );
        if (result.rows.length === 0) { // If no rows were deleted, means favorite wasn't found for this user/book
            return res.status(404).json({ message: 'Book not found in your favorites.' });
        }
        res.status(200).json({ message: 'Book removed from favorites.' });
    } catch (error) {
        console.error('Error removing book from favorites:', error);
        res.status(500).json({ message: 'Server error removing from favorites.' });
    }
};

// Get all favorite books for the current user
exports.getUserFavorites = async (req, res) => {
    const user_id = req.user.id;

    try {
        const favoritesResult = await pool.query(`
            SELECT b.id AS book_id_in_db,
                   b.google_book_id,
                   b.title,
                   b.author,
                   b.cover_image_url,
                   b.description,
                   f.created_at AS favorited_at
            FROM favorites f
            JOIN books b ON f.book_id = b.id
            WHERE f.user_id = $1
            ORDER BY f.created_at DESC;
        `, [user_id]);
        res.json(favoritesResult.rows);
    } catch (err) {
        console.error('Error fetching user\'s favorite books:', err);
        res.status(500).json({ message: 'Server error fetching favorites.' });
    }
};

// Check if a specific book is favorited by the user (useful for displaying heart icon state)
exports.checkFavoriteStatus = async (req, res) => {
    const { book_id } = req.params; // book_id is from your local 'books' table
    const user_id = req.user.id; // User ID from the authenticated token

    try {
        const result = await pool.query(
            'SELECT EXISTS (SELECT 1 FROM favorites WHERE user_id = $1 AND book_id = $2)',
            [user_id, book_id]
        );
        const isFavorited = result.rows[0].exists; // 'exists' is the column returned by EXISTS()
        res.status(200).json({ isFavorited });
    } catch (error) {
        console.error('Error checking favorite status:', error);
        res.status(500).json({ message: 'Server error checking favorite status.' });
    }
};