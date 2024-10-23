// Instead of importing Ollama, we'll create a mock function for n
// import { Ollama } from 'ollama';

// Mocking the Ollama chat function
let conversationHistory = [];

export async function chatWithLlama(userInput) {
    conversationHistory.push({ role: 'user', content: userInput });

    try {
        const response = await fetch('http://127.0.0.1:11434/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama3.1',
                messages: conversationHistory,
                stream: false
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.message.content;
        conversationHistory.push({ role: 'assistant', content: aiResponse });

        return aiResponse;
    } catch (error) {
        console.error("Error communicating with Llama:", error);
        return "Sorry, I couldn't process that. Error: " + error.message;
    }
}