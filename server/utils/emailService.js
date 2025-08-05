// server/utils/emailService.js
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }); // Load .env from root

// Configure your email transporter
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE, // e.g., 'gmail', 'SendGrid'
    auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app password
    },
});

/**
 * Sends an email notification.
 * @param {string} to - Recipient email address.
 * @param {string} subject - Email subject.
 * @param {string} htmlContent - HTML content for the email body.
 * @returns {Promise<boolean>} True if email sent successfully, false otherwise.
 */
const sendEmail = async (to, subject, htmlContent) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.EMAIL_SERVICE) {
        console.error('Email service not fully configured. Please check EMAIL_USER, EMAIL_PASS, and EMAIL_SERVICE in your .env file.');
        return false;
    }
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER, // Sender address
            to, // List of recipients
            subject, // Subject line
            html: htmlContent, // HTML body
        });
        console.log(`Email sent successfully to <span class="math-inline">\{to\} with subject\: "</span>{subject}"`);
        return true;
    } catch (error) {
        console.error(`Failed to send email to <span class="math-inline">\{to\} \(Subject\: "</span>{subject}"):`, error);
        // Log specific error details for debugging email issues
        if (error.code === 'EAUTH') {
            console.error('Authentication error: Check EMAIL_USER and EMAIL_PASS. For Gmail, ensure "Less secure app access" is ON or use an App Password if 2FA is enabled.');
        } else if (error.code === 'EENVELOPE') {
            console.error('Envelope error: Invalid sender or recipient email address.');
        }
        return false;
    }
};

module.exports = sendEmail;