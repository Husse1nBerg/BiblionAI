
const axios = require('axios');
const pool = require('../config/db');
const sendEmail = require('../utils/emailService');

exports.searchBooks = async (req, res) => {
    const { query, genre, type, age_group, author } = req.query; // Ensure 'genre' is destructured

    // Google Books API URL - 'subject' might help but is often broad, we'll refine server-side
    let apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query || '')}&key=${process.env.GOOGLE_BOOKS_API_KEY}`;
    // Optional: Add &subject for Google's own broad filtering, but our main filter is below
    if (genre) {
        apiUrl += `&subject=${encodeURIComponent(genre)}`;
    }

    try {
        const response = await axios.get(apiUrl);
        const rawBooks = response.data.items || [];

        // Apply server-side filtering based on selected genre (if any)
        const filteredAndMappedBooks = await Promise.all(rawBooks.map(async (item) => {
            const googleBookId = item.id;
            const bookDetails = {
                id: googleBookId,
                title: item.volumeInfo.title,
                authors: item.volumeInfo.authors,
                description: item.volumeInfo.description,
                cover_image_url: item.volumeInfo.imageLinks?.thumbnail,
                published_date: item.volumeInfo.publishedDate,
                categories: item.volumeInfo.categories,
                availability_status: 'available',
                book_id_in_db: null
            };

            const dbBookResult = await pool.query('SELECT id, availability_status FROM books WHERE google_book_id = $1', [googleBookId]);
            if (dbBookResult.rows.length > 0) {
                bookDetails.availability_status = dbBookResult.rows[0].availability_status;
                bookDetails.book_id_in_db = dbBookResult.rows[0].id;
            }
            return bookDetails;
        }));


        // Now apply additional server-side filtering (genre, author, etc.)
        const finalBooks = filteredAndMappedBooks.filter(book => {
            let matches = true;
            if (genre && book.categories) {
                const lowerCaseGenre = genre.toLowerCase();
                // Check if any of the book's categories include the selected genre (case-insensitive)
                if (!book.categories.some(cat => cat.toLowerCase().includes(lowerCaseGenre))) {
                    matches = false;
                }
            }
            // Add other filters like author, type, age_group here if you implement them
            if (author && book.authors && !book.authors.some(auth => auth.toLowerCase().includes(author.toLowerCase()))) {
                matches = false;
            }
            return matches;
        });

        res.json(finalBooks); // Send the final filtered list
    } catch (error) {
        console.error('Error fetching books from Google Books API (backend - searchBooks):', error.message); // More specific logging
        if (error.response) {
            console.error('Google Books API response status (searchBooks):', error.response.status);
            console.error('Google Books API response data (searchBooks):', error.response.data);
        }
        res.status(500).json({ message: 'Error fetching books from external API.' });
    }
}



exports.getBookDetails = async (req, res) => {
    const googleBookId = req.params.id;
    const apiUrl = `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(googleBookId)}?key=${process.env.GOOGLE_BOOKS_API_KEY}`;

    try {
        const response = await axios.get(apiUrl);
        const book = response.data;

        if (!book || !book.volumeInfo) {
            return res.status(404).json({ message: 'Book not found or data incomplete from external API.' });
        }

        const bookDetails = {
            id: book.id,
            title: book.volumeInfo.title,
            authors: book.volumeInfo.authors,
            description: book.volumeInfo.description,
            cover_image_url: book.volumeInfo.imageLinks?.thumbnail,
            published_date: book.volumeInfo.publishedDate,
            categories: book.volumeInfo.categories,
            pageCount: book.volumeInfo.pageCount,
            publisher: book.volumeInfo.publisher,
            availability_status: 'available',
            book_id_in_db: null,
            // NEW: Add the webReaderLink to the API response
            webReaderLink: book.accessInfo?.webReaderLink
        };

        const dbBookResult = await pool.query('SELECT id, availability_status FROM books WHERE google_book_id = $1', [googleBookId]);
        if (dbBookResult.rows.length > 0) {
            bookDetails.availability_status = dbBookResult.rows[0].availability_status;
            bookDetails.book_id_in_db = dbBookResult.rows[0].id;
        }

        res.json(bookDetails);
    } catch (error) {
        console.error('Error fetching book details from Google Books API (backend):', error.message);
        res.status(500).json({ message: 'Error fetching book details from external API. Check backend logs.' });
    }
};


exports.checkoutBook = async (req, res) => {
    const { google_book_id, title, author, cover_image_url } = req.body;
    const user_id = req.user.id; // From authenticated user

    try {
        await pool.query('BEGIN'); // Start transaction

        // 1. Check if the book exists in our 'books' table, if not, add it.
        let bookIdInOurDB;
        const existingBook = await pool.query('SELECT id, availability_status FROM books WHERE google_book_id = $1', [google_book_id]);

        if (existingBook.rows.length === 0) {
            // Book does not exist in our DB, insert it
            const newBookResult = await pool.query(
                'INSERT INTO books (google_book_id, title, author, cover_image_url, availability_status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [google_book_id, title, author, cover_image_url, 'checked_out'] // Set initial status as checked_out
            );
            bookIdInOurDB = newBookResult.rows[0].id;
        } else {
            bookIdInOurDB = existingBook.rows[0].id;
            if (existingBook.rows[0].availability_status === 'checked_out') {
                await pool.query('ROLLBACK');
                return res.status(400).json({ message: 'Book is currently checked out by another user.' });
            }
            // Update the existing book's status
            await pool.query('UPDATE books SET availability_status = $1 WHERE id = $2', ['checked_out', bookIdInOurDB]);
        }

        // 2. Insert into the 'checkouts' table
        await pool.query(
            'INSERT INTO checkouts (user_id, book_id, checkout_date, status) VALUES ($1, $2, NOW(), $3)',
            [user_id, bookIdInOurDB, 'checked_out']
        );

        await pool.query('COMMIT'); // End transaction
        res.status(200).json({ message: 'Book checked out successfully!', book_id_in_db: bookIdInOurDB });
    } catch (err) {
        await pool.query('ROLLBACK'); // Rollback transaction on error
        console.error('Error during checkout:', err);
        res.status(500).json({ message: 'Server error during checkout.' });
    }
};


// server/controllers/bookController.js (locate exports.checkinBook)

exports.checkinBook = async (req, res) => {
    const book_id_from_body = req.body.book_id;
    const user_id = req.user.id;
    const user_email = req.user.email;

    // VALIDATION: Ensure book_id is a valid integer before use
    const book_id = parseInt(book_id_from_body, 10);
    if (isNaN(book_id)) {
        console.error('[Checkin Error] book_id is not a valid integer:', book_id_from_body);
        return res.status(400).json({ message: 'Invalid book ID provided for check-in.' });
    }

    try {
        await pool.query('BEGIN'); // Start transaction

        const checkoutUpdateResult = await pool.query(
            'UPDATE checkouts SET return_date = NOW(), status = $1 WHERE user_id = $2 AND book_id = $3 AND status = $4 RETURNING *',
            ['returned', user_id, book_id, 'checked_out']
        );

        if (checkoutUpdateResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ message: 'Book not found as checked out by this user.' });
        }

        await pool.query('UPDATE books SET availability_status = $1 WHERE id = $2', ['available', book_id]);
        await pool.query('COMMIT'); // Commit transaction

        const bookDetailsResult = await pool.query('SELECT title, author FROM books WHERE id = $1', [book_id]);
        const { title, author } = bookDetailsResult.rows[0] || { title: 'Unknown Title', author: 'Unknown Author' };

        const emailSubject = `Book Checked In: ${title}`;
        const emailHtml = `
            <p>Hi there,</p>
            <p>You have successfully checked in the book: <strong>${title}</strong> by ${author}.</p>
            <p>Thank you for using our library!</p>
            <p>Best regards,<br>The Virtual Library Team</p>
        `;
        sendEmail(user_email, emailSubject, emailHtml);

        res.status(200).json({ message: 'Book checked in successfully! An email confirmation has been sent.' });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('[Checkin Error] Server error during check-in:', err);
        res.status(500).json({ message: 'Server error during check-in.' });
    }
};

exports.getUserCheckedOutBooks = async (req, res) => {
    const user_id = req.user.id;

    try {
        const result = await pool.query(`
            SELECT b.id AS book_id_in_db, b.google_book_id, b.title, b.author, b.cover_image_url,
                   c.checkout_date, c.return_date, c.status AS checkout_status
            FROM checkouts c
            JOIN books b ON c.book_id = b.id
            WHERE c.user_id = $1 AND c.status = 'checked_out'
            ORDER BY c.checkout_date DESC;
        `, [user_id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching user checked out books:', err);
        res.status(500).json({ message: 'Server error fetching checked out books.' });
    }
};

exports.getUserCheckoutHistory = async (req, res) => {
    const user_id = req.user.id; // User ID from authenticated token

    try {
        const result = await pool.query(`
            SELECT b.id AS book_id_in_db, b.google_book_id, b.title, b.author, b.cover_image_url,
                   c.checkout_date, c.return_date, c.status AS checkout_status
            FROM checkouts c
            JOIN books b ON c.book_id = b.id
            WHERE c.user_id = $1
            ORDER BY c.checkout_date DESC;
        `, [user_id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching user checkout history:', err);
        res.status(500).json({ message: 'Server error fetching checkout history.' });
    }
};

// Fetches all reviews left by the authenticated user
exports.getUserReviews = async (req, res) => {
    const user_id = req.user.id; // User ID from authenticated token

    try {
        const result = await pool.query(`
            SELECT r.id AS review_id, r.rating, r.review_text, r.created_at,
                   b.id AS book_id_in_db, b.google_book_id, b.title, b.author, b.cover_image_url
            FROM reviews r
            JOIN books b ON r.book_id = b.id
            WHERE r.user_id = $1
            ORDER BY r.created_at DESC;
        `, [user_id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching user reviews:', err);
        res.status(500).json({ message: 'Server error fetching user reviews.' });
    }
};

exports.checkoutBook = async (req, res) => {
    const { google_book_id, title, author, cover_image_url } = req.body;
    const user_id = req.user.id;
    const user_email = req.user.email; // Get user email from token

    try {
        await pool.query('BEGIN'); // Start database transaction

        let bookIdInOurDB;
        const existingBook = await pool.query('SELECT id, availability_status FROM books WHERE google_book_id = $1', [google_book_id]);

        if (existingBook.rows.length === 0) {
            // Book not found in our DB, insert it
            const newBookResult = await pool.query(
                'INSERT INTO books (google_book_id, title, author, cover_image_url, availability_status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [google_book_id, title, author, cover_image_url, 'checked_out'] // Set initial status as checked_out
            );
            bookIdInOurDB = newBookResult.rows[0].id;
        } else {
            bookIdInOurDB = existingBook.rows[0].id;
            if (existingBook.rows[0].availability_status === 'checked_out') {
                await pool.query('ROLLBACK');
                return res.status(400).json({ message: 'Book is currently checked out by another user.' });
            }
            // Update the existing book's status
            await pool.query('UPDATE books SET availability_status = $1 WHERE id = $2', ['checked_out', bookIdInOurDB]);
        }

        const checkoutDate = new Date();
        const returnDate = new Date();
        returnDate.setMonth(returnDate.getMonth() + 1); // Set due date to 1 month from now

        await pool.query(
            'INSERT INTO checkouts (user_id, book_id, checkout_date, return_date, status) VALUES ($1, $2, $3, $4, $5)', // Store returnDate in DB
            [user_id, bookIdInOurDB, checkoutDate, returnDate, 'checked_out']
        );

        await pool.query('COMMIT'); // Commit transaction

        // Send Email Notification (non-blocking call)
        const dueDateString = returnDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const emailSubject = `Book Checked Out: ${title}`;
        const emailHtml = `
            <p>Hi there,</p>
            <p>You have successfully checked out the book: <strong>${title}</strong> by <strong>${author}</strong>.</p>
            <p>Your return date is <strong>${dueDateString}</strong>.</p>
            <p>Enjoy your reading!</p>
            <p>Best regards,<br>The Virtual Library Team</p>
        `; 

        sendEmail(user_email, emailSubject, emailHtml); // Non-blocking
            res.status(200).json({
            message: 'Book checked out successfully! An email confirmation has been sent and the book is due in 1 month.',
            book_id_in_db: bookIdInOurDB,
            dueDate: returnDate.toISOString() // Send due date back to frontend
        });
    } catch (err) {
        await pool.query('ROLLBACK'); // Rollback transaction on error
        console.error('Error during checkout:', err);
        res.status(500).json({ message: 'Server error during checkout.' });
    }
};

exports.checkinBook = async (req, res) => {
    const { book_id } = req.body;
    const user_id = req.user.id;
    const user_email = req.user.email;

    // --- NEW DEBUG LOGGING ---
    console.log(`[Checkin] Attempting check-in for book_id: ${book_id} by user_id: ${user_id}`);
    // --- END DEBUG LOGGING ---

    try {
        await pool.query('BEGIN'); // Start transaction

        const checkoutUpdateResult = await pool.query(
            'UPDATE checkouts SET return_date = NOW(), status = $1 WHERE user_id = $2 AND book_id = $3 AND status = $4 RETURNING *',
            ['returned', user_id, book_id, 'checked_out']
        );

        if (checkoutUpdateResult.rows.length === 0) {
            await pool.query('ROLLBACK'); // Rollback if no matching record found
            console.warn(`[Checkin] No active checkout found for book_id: ${book_id} and user_id: ${user_id}.`);
            return res.status(400).json({ message: 'Book not found as checked out by this user.' });
        }

        await pool.query('UPDATE books SET availability_status = $1 WHERE id = $2', ['available', book_id]);
        await pool.query('COMMIT'); // Commit transaction

        // Fetch book details for email
        const bookDetailsResult = await pool.query('SELECT title, author FROM books WHERE id = $1', [book_id]);
        const { title, author } = bookDetailsResult.rows[0] || { title: 'Unknown Title', author: 'Unknown Author' };

        const emailSubject = `Book Checked In: ${title}`;
        const emailHtml = `
            <p>Hi there,</p>
            <p>You have successfully checked in the book: <strong>${title}</strong> by ${author}.</p>
            <p>Thank you for using our library!</p>
            <p>Best regards,<br>The Virtual Library Team</p>
        `;
        sendEmail(user_email, emailSubject, emailHtml);

        res.status(200).json({ message: 'Book checked in successfully! An email confirmation has been sent.' });
    } catch (err) {
        await pool.query('ROLLBACK'); // Rollback on any error
        console.error('[Checkin Error] Server error during check-in:', err); // Log the full error object/stack
        res.status(500).json({ message: 'Server error during check-in.' });
    }
};

// NEW: Endpoint to confirm a purchase (called by frontend after Stripe confirms success)
exports.purchaseConfirmation = async (req, res) => {
    const { paymentIntentId, book_id_in_db, title, author } = req.body;
    const user_id = req.user.id;
    const user_email = req.user.email; // Get user email from token

    try {
        await pool.query('BEGIN'); // Start database transaction

        // Optional: Update book status to 'purchased' in the books table
        await pool.query('UPDATE books SET availability_status = $1 WHERE id = $2', ['purchased', book_id_in_db]);

        // Optional: Record the purchase in the checkouts table with a 'purchased' status
        // You might consider a separate 'purchases' table for clarity if purchase is different from checkout
        await pool.query(
            'INSERT INTO checkouts (user_id, book_id, checkout_date, status) VALUES ($1, $2, NOW(), $3)',
            [user_id, book_id_in_db, 'purchased']
        );

        await pool.query('COMMIT'); // Commit transaction

        // Send Email Notification (non-blocking call)
        const emailSubject = `Book Purchased: ${title}`;
        const emailHtml = `
            <p>Hi there,</p>
            <p>Thank you for your purchase! You have successfully bought: <strong>${title}</strong> by ${author}.</p>
            <p>Enjoy your new book!</p>
            <p>Best regards,<br>The Virtual Library Team</p>
        `;
        sendEmail(user_email, emailSubject, emailHtml);

        res.status(200).json({ message: 'Purchase confirmed and email sent!' });
    } catch (err) {
        await pool.query('ROLLBACK'); // Rollback transaction on error
        console.error('Error during purchase confirmation:', err);
        res.status(500).json({ message: 'Server error during purchase confirmation.' });
    }
};

exports.registerBookInDb = async (req, res) => {
    const { google_book_id, title, author, cover_image_url } = req.body;

    if (!google_book_id || !title) {
        return res.status(400).json({ message: 'Google Book ID and Title are required to register book.' });
    }

    try {
        let bookIdInOurDB;
        const existingBook = await pool.query('SELECT id FROM books WHERE google_book_id = $1', [google_book_id]);

        if (existingBook.rows.length === 0) {
            // Book does not exist in our DB, insert it with 'available' status initially
            const newBookResult = await pool.query(
                'INSERT INTO books (google_book_id, title, author, cover_image_url, availability_status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [google_book_id, title, author, cover_image_url, 'available']
            );
            bookIdInOurDB = newBookResult.rows[0].id;
        } else {
            bookIdInOurDB = existingBook.rows[0].id;
        }
        res.status(200).json({ book_id_in_db: bookIdInOurDB, message: 'Book registered in local DB.' });
    } catch (err) {
        console.error('Error registering book in DB:', err);
        res.status(500).json({ message: 'Server error registering book in local DB.' });
    }
};