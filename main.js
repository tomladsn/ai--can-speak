import { chatWithLlama } from './index.js';
const mic = document.getElementById('mic');
const micIcon = document.getElementById('mic-icon');
let isRecording = false;
let recognition;
let voicesLoaded = false;
let availableVoices = [];

// Preload the voices to ensure there's no delay when TTS is invoked
function loadVoices() {
    availableVoices = speechSynthesis.getVoices();
    console.log("Available Voices:", availableVoices);
}

// Preload voices when the page is loaded to avoid delays in TTS
window.speechSynthesis.onvoiceschanged = loadVoices;

function textToSpeech(text) {
    if (availableVoices.length === 0) {
        console.error("No voices loaded. Please try again later.");
        return;
    }

    console.log(`Speaking: "${text}"`);

    let utterance = new SpeechSynthesisUtterance(text);

    // Find a specific female voice (e.g., "Google UK English Female" or "Samantha")
    let selectedVoice = availableVoices.find(voice =>
        voice.name.includes('Google UK English Female') || // Replace with your desired voice name
        voice.name.includes('Samantha') || // Example female voice on some systems
        (voice.lang.includes('en') && voice.gender === 'female') // Use gender and language check
    );

    if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`Selected Voice: ${selectedVoice.name}`);
    } else {
        console.warn("Female voice not found. Using the default voice.");
    }

    // Speak the response
    speechSynthesis.speak(utterance);
}

mic.addEventListener('click', function() {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
});

function startRecording() {
    console.log("Starting recording...");
    isRecording = true;
    micIcon.src = "anim.gif";

    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
        console.error("Speech recognition is not supported in this browser.");
        return;
    }

    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.interimResults = true;

    recognition.addEventListener('result', handleRecognitionResult);
    recognition.addEventListener('end', () => {
        if (isRecording) {
            recognition.start();
        }
    });

    recognition.addEventListener('error', (event) => {
        console.error('Speech recognition error', event.error);
    });

    try {
        recognition.start();
    } catch (error) {
        console.error('Error starting speech recognition:', error);
    }
}

function stopRecording() {
    console.log("Stopping recording...");
    isRecording = false;
    micIcon.src = "icon.png";
    if (recognition) {
        recognition.stop();
    }
}

async function handleRecognitionResult(e) {
    const transcript = Array.from(e.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');

    console.log(`Recognized: "${transcript}"`);

    if (e.results[0].isFinal) {
        console.log("Speech recognition final. Sending to Llama...");

        // Send recognized transcript directly to Llama
        const llamaResponse = await chatWithLlama(transcript);

        console.log(`Llama response: "${llamaResponse}"`);

        // Immediately send Llama's response to TTS
        textToSpeech(llamaResponse);
    }
}

// Preload voices when the page is loaded to avoid delays in TTS
document.addEventListener('DOMContentLoaded', () => {
    if (speechSynthesis.onvoiceschanged !== undefined) {
        loadVoices();
    }
});
