// server/controllers/stripeController.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../config/db');

exports.createPaymentIntent = async (req, res) => {
    const { items, amount, currency } = req.body;
    const user_id = req.user.id;

    // Fetch actual book details to ensure accurate metadata
    const bookDetailsForMetadata = [];
    for (const item of items) {
        const bookResult = await pool.query('SELECT title, author, google_book_id FROM books WHERE id = $1', [item.book_id]);
        if (bookResult.rows.length > 0) {
            bookDetailsForMetadata.push({
                id: item.book_id, // This is your local DB ID
                google_book_id: bookResult.rows[0].google_book_id,
                title: bookResult.rows[0].title,
                author: bookResult.rows[0].author,
                quantity: item.quantity
            });
        }
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            payment_method_types: ['card'],
            metadata: {
                user_id: user_id,
                // Stringify the array of book details for metadata
                items: JSON.stringify(bookDetailsForMetadata),
            },
        });
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: error.message });
    }
};