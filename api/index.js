import express from 'express';
import { Groq } from 'groq-sdk';
import cors from 'cors';
import dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

const app = express();

// Configure CORS more explicitly
app.use(cors({
    origin: '*', // For development. In production, set to your specific domain
    methods: ['POST', 'OPTIONS'], // Explicitly allow POST and OPTIONS
    allowedHeaders: ['Content-Type', 'Accept', 'Session-ID']
}));

// Important: This needs to come before your routes
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Move conversation history to a Map to handle multiple sessions
const conversationHistory = new Map();

// Add OPTIONS handler for the chat endpoint
app.options('/api/chat', cors());

app.post('/api/chat', async (req, res) => {
    try {
        console.log('Received request:', req.body); // Debug logging
        const userInput = req.body.message;
        const sessionId = req.headers['session-id'] || 'default';
        
        if (!userInput) {
            return res.status(400).json({ error: 'No message provided' });
        }

        // Initialize conversation history for new sessions
        if (!conversationHistory.has(sessionId)) {
            conversationHistory.set(sessionId, [{
                role: "assistant",
                content: "Hello! It's nice to meet you. Is there something I can help you with?"
            }]);
        }
        
        const currentHistory = conversationHistory.get(sessionId);
        currentHistory.push({ role: 'user', content: userInput });

        const chatCompletion = await groq.chat.completions.create({
            messages: currentHistory,
            model: "llama3-8b-8192",
            temperature: 1,
            max_tokens: 1024,
            top_p: 1,
            stream: false,
            stop: null
        });

        const assistantResponse = chatCompletion.choices[0].message.content;
        currentHistory.push({ role: 'assistant', content: assistantResponse });
        
        console.log('Sending response:', assistantResponse); // Debug logging
        res.json({ response: assistantResponse });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

export default app;
