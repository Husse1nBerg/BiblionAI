// virtual-library-app/api/index.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Load route files
const authRoutes = require('../server/routes/auth');
const bookRoutes = require('../server/routes/books');
const reviewRoutes = require('../server/routes/reviews');
const aiRoutes = require('../server/routes/ai');
const stripeRoutes = require('../server/routes/stripe');
const userRoutes = require('../server/routes/users');

// Corrected Vercel-friendly route paths
app.use('/auth', authRoutes); // <-- CHANGED from '/api/auth' to '/auth'
app.use('/books', bookRoutes);
app.use('/reviews', reviewRoutes);
app.use('/ai', aiRoutes);
app.use('/stripe', stripeRoutes);
app.use('/users', userRoutes);

// A simple root path for Vercel's Serverless Function to respond to
app.get('/', (req, res) => {
  res.send('API is running.');
});

module.exports = app;