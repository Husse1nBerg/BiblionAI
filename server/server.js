
const path = require('path');
const envPath = path.resolve(__dirname, '..', '..', '.env'); 
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/users');
require('dotenv').config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 3001; // Backend will run on 3001 by default


// Middleware
app.use(cors()); // Allow cross-origin requests (important for dev)
app.use(express.json()); // Parse JSON request bodies

// Import routes
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const reviewRoutes = require('./routes/reviews');
const aiRoutes = require('./routes/ai'); 
const stripeRoutes = require('./routes/stripe');
const sendEmail = require('./utils/emailService'); 
const pool = require('./config/db'); 
const cron = require('node-cron'); 

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/users', userRoutes);

// --- ADD SCHEDULED TASK (CRON JOB) HERE ---
// Schedule a task to run once a day at 2:00 AM (UTC, or server's local time)
// You can test with '* * * * *' to run every minute (for debugging, then change back!)
cron.schedule('0 2 * * *', async () => {
    console.log(`[Cron Job] Running daily due date reminder check at ${new Date().toLocaleString('en-CA', {timeZone: 'America/Montreal'})} ...`); // Adjust timezone for Montreal

    try {
        // Fetch books that are checked out and due in approximately 7 days from now
        const booksDueSoon = await pool.query(`
            SELECT
                c.id AS checkout_id,
                b.title,
                b.author,
                u.email AS user_email,
                c.return_date
            FROM checkouts c
            JOIN books b ON c.book_id = b.id
            JOIN users u ON c.user_id = u.id
            WHERE c.status = 'checked_out'
            AND c.return_date IS NOT NULL
            AND c.return_date <= NOW() + INTERVAL '7 days'
            AND c.return_date > NOW() + INTERVAL '6 days'; -- Due date is within the next 7 days, but not within the next 6 days (to send once)
        `);

        for (const book of booksDueSoon.rows) {
            const dueDateString = new Date(book.return_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const emailSubject = `Reminder: Book Due Soon - ${book.title}`;
            const emailHtml = `
                <p>Hi there,</p>
                <p>This is a friendly reminder that the book <strong>${book.title}</strong> by ${book.author} is due on <strong>${dueDateString}</strong>.</p>
                <p>Please return it on time to avoid any late fees.</p>
                <p>Best regards,<br>The Virtual Library Team</p>
            `;
            sendEmail(book.user_email, emailSubject, emailHtml); // Non-blocking email send
        }
        console.log(`[Cron Job] Sent ${booksDueSoon.rows.length} due date reminder emails.`);
    } catch (error) {
        console.error('[Cron Job] Error running daily due date reminder:', error);
    }
}, {
    timezone: "America/Montreal" // Set timezone for the cron job itself
});
// --- END SCHEDULED TASK ---


// Serve static assets in production (React build)
if (process.env.NODE_ENV === 'production') {
  // Serve any static files
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
  });
}

console.log('OpenAI API Key:', process.env.OPENAI_API_KEY ? 'Loaded' : 'NOT Loaded');
console.log('DB Name:', process.env.DB_NAME ? 'Loaded' : 'NOT Loaded');



// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});