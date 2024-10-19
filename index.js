import { Ollama } from 'ollama';
import { createInterface } from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Manually define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ollama = new Ollama();

// Create a readline interface to handle user input from the console
const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

// Store conversation history to retain context
let conversationHistory = [];
let isProcessing = false;  // Flag to prevent multiple processing of the same transcription
const waitTime = 10000; // 10 seconds delay between each transcription processing

// Function to send user input to Llama and get a response
async function chatWithLlama(userInput) {
    // Add user input to the conversation history
    conversationHistory.push({ role: 'user', content: userInput });

    try {
        const response = await ollama.chat({
            model: 'llama3.1',
            messages: conversationHistory
        });
        const aiResponse = response.message?.content || "No message received from AI.";

        conversationHistory.push({ role: 'assistant', content: aiResponse });

        return aiResponse; // Return the AI's response text
    } catch (error) {
        console.error("Error communicating with Llama:", error);
        return "Sorry, I couldn't process that.";
    }
}

// Function to read transcription from a text file
async function readTranscription() {
    const filePath = path.join(__dirname, 'transcription.txt');

    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.trim()); // Remove any extra whitespace
            }
        });
    });
}

// Main function to handle conversation
async function startChat() {
    console.log("Start chatting with Llama AI! (type 'exit' to quit)");

    // Continuously check for transcription updates every 5 seconds
    setInterval(async () => {
        try {
            const transcription = await readTranscription();

            // Only process new transcriptions if not already being processed
            if (transcription && !isProcessing) {
                isProcessing = true;  // Set flag to prevent reprocessing
                console.log(`"${transcription}"`);
                
                // Send the transcription to Llama once
                const aiResponse = await chatWithLlama(transcription);
                console.log(`AI: ${aiResponse}`);

                // Wait for `waitTime` (e.g., 10 seconds) before resetting `isProcessing`
                setTimeout(() => {
                    isProcessing = false;
                }, waitTime);
            }

        } catch (error) {
            console.error("Error reading transcription:", error);
        }
    }, 5000); // Check for new transcriptions every 5 seconds

    // Loop to continuously ask for user input
    rl.on('line', async (input) => {
        if (input.toLowerCase() === 'exit') {
            console.log("Goodbye!");
            rl.close();
            return;
        }

        // Send the user input to Llama and get a response
        const aiResponse = await chatWithLlama(input);

        // Display the AI's response
        console.log(`AI: ${aiResponse}`);

        // Prompt for the next input
        rl.prompt();
    });

    rl.prompt();
}

// Start the conversation
startChat();
