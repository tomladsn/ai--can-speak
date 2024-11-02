import express, { json } from 'express';
import { Groq } from 'groq-sdk';
import cors from 'cors';

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());
app.use(json());

const groq = new Groq({ apiKey: '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' });
let conversationHistory = [
    {
        role: "assistant",
        content: "Hello! It's nice to meet you. Is there something I can help you with, or would you like to chat?"
    }
];

app.post('/api/chat', async (req, res) => {
    try {
        const userInput = req.body.message;
        console.log('Received message:', userInput); // Debug log
        
        conversationHistory.push({ role: 'user', content: userInput });

        const chatCompletion = await groq.chat.completions.create({
            messages: conversationHistory,
            model: "llama3-8b-8192",
            temperature: 1,
            max_tokens: 1024,
            top_p: 1,
            stream: false,
            stop: null
        });

        const assistantResponse = chatCompletion.choices[0].message.content;
        console.log('Sending response:', assistantResponse); // Debug log
        
        conversationHistory.push({ role: 'assistant', content: assistantResponse });
        
        res.json({ response: assistantResponse });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add a test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
