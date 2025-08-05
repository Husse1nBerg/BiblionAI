// server/controllers/aiController.js
const OpenAI = require('openai');
const pool = require('../config/db'); // Ensure pool is imported for database access

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

exports.getRecommendations = async (req, res) => {
    const { userPreferences } = req.body; // userPreferences is optional input from frontend
    const user_id = req.user.id; // Get authenticated user's ID

    let prompt = `I am a virtual library user looking for book recommendations.`;
    let userHistoryTitles = [];

    // Fetch user's full checkout/purchase history directly from the database
    try {
        const historyResult = await pool.query(`
            SELECT b.title, b.author, b.categories
            FROM checkouts c
            JOIN books b ON c.book_id = b.id
            WHERE c.user_id = $1
            AND c.status IN ('checked_out', 'returned', 'purchased') -- Include all relevant history statuses
            ORDER BY c.checkout_date DESC
            LIMIT 20; -- Limit to a reasonable number of recent history entries for the AI prompt
        `, [user_id]);
        
        // Format history entries for the AI prompt
        userHistoryTitles = historyResult.rows.map(b => {
            let entry = `${b.title} by ${b.author}`;
            if (b.categories && b.categories.length > 0) {
                entry += ` (Category: ${b.categories.join(', ')})`;
            }
            return entry;
        });
    } catch (dbError) {
        console.error('Error fetching user history from DB for AI recommendations:', dbError);
        // Continue without user history if a database error occurs
    }

    // Construct the AI prompt based on user input and history
    if (userPreferences) {
        prompt += ` My explicit interests include: ${userPreferences}.`;
    }
    if (userHistoryTitles.length > 0) {
        prompt += ` My reading history includes the following books: ${userHistoryTitles.join('; ')}.`;
        prompt += ` Based on this history, please identify any **trends** in my reading habits (e.g., preferred genres, authors, themes, styles). Then, suggest 5 to 7 new books that fit these trends, or expand on them.`;
    } else {
        prompt += ` I have no extensive reading history yet. Please suggest 5 to 7 popular books across different genres or based on my stated interests if any.`;
    }

    prompt += ` For each recommendation, provide the title, author, and a brief reason for the suggestion, clearly linking it to an identified trend or general appeal. Format your response as a numbered list, starting with "Identified Trends:" if history is provided, and use HTML tags for bolding or lists if appropriate.`;

    try {
        // Call the OpenAI GPT-3.5 Turbo API
        const chatCompletion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 500, // Increased max_tokens to allow for a more detailed response
            temperature: 0.7, // Adjust creativity (0.0 for deterministic, 1.0 for highly creative)
        });
        const recommendations = chatCompletion.choices[0].message.content;
        res.json({ recommendations }); // Send recommendations back to frontend
    } catch (error) {
        console.error('Error getting AI recommendations from OpenAI:', error);
        if (error.response) {
            console.error('OpenAI API response status:', error.response.status);
            console.error('OpenAI API response data:', error.response.data);
        }
        res.status(500).json({ message: 'Error generating recommendations.' });
    }
};