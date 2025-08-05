// virtual-library-app/api/index.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Load route files from the new 'server' subdirectory
const authRoutes = require('../server/routes/auth');
const bookRoutes = require('../server/routes/books');
const reviewRoutes = require('../server/routes/reviews');
const aiRoutes = require('../server/routes/ai');
const stripeRoutes = require('../server/routes/stripe');
const userRoutes = require('../server/routes/users');

// Correct Express paths (must match the first part of the Vercel URL path after /api/)
app.use('/auth', authRoutes);
app.use('/books', bookRoutes);
app.use('/reviews', reviewRoutes);
app.use('/ai', aiRoutes);
app.use('/stripe', stripeRoutes);
app.use('/users', userRoutes);

app.get('/', (req, res) => {
  res.send('API is running.');
});

module.exports = app;