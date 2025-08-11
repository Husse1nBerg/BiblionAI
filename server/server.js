// server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Load .env from root

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const reviewRoutes = require('./routes/reviews');
const aiRoutes = require('./routes/ai');
const stripeRoutes = require('./routes/stripe');
const userRoutes = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/users', userRoutes);


if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    // Serve static files from the React app
    app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

    // The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
    });
}

// Start the server by listening on the specified port
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});