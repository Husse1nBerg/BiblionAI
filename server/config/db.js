// server/config/db.js
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }); // Load .env from root

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    // Optional: SSL configuration for production environments (e.g., Render)
    // For local development, this might not be needed or could cause issues.
    // Uncomment and configure if your production DB requires SSL.
    // ssl: {
    //     rejectUnauthorized: false // Use this if you encounter self-signed certificate issues in dev/test
    // }
});

// Test the database connection
pool.on('connect', () => {
    console.log('Connected to the PostgreSQL database!');
});

pool.on('error', (err) => {
    console.error('Database error:', err.stack);
    process.exit(1); // Exit process with failure
});

module.exports = pool;