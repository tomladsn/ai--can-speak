// 1. First, declare all constants and configurations
const API_URL = 'http://localhost:3001';
const ELEVENLABS_API_KEY = "sk_b93f8fe4ddadcad7439ed5756510eb9b08c60dd1cb561346"; // Replace with your actual API key

// Add these variables at the top with your other declarations
let silenceTimer = null;
const SILENCE_DURATION = 2000; // 2 seconds of silence before stopping

// 2. DOM elements and basic variables
const mic = document.getElementById('mic');
const micIcon = document.getElementById('mic-icon');
const accentSelect = document.getElementById('accent-select');
const sessionId = Math.random().toString(36).substring(7);

let isRecording = false;
let recognition;
let voicesLoaded = false;
let availableVoices = [];

// 3. Voice and speech functions
async function textToSpeechElevenLabs(text) {
    try {
        console.log('Generating speech with ElevenLabs:', text);
        
        const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/CYw3kZ02Hs0563khs1Fj', {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_monolingual_v1",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate speech');
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        await audio.play();
        
        console.log('Audio generated and playing');
    } catch (error) {
        console.error("Error with ElevenLabs TTS:", error);
        // Fallback to browser TTS
        textToSpeech(text);
    }
}

// 4. Speech Recognition functions
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
    recognition.continuous = true;  // Enable continuous recognition

    recognition.addEventListener('result', handleRecognitionResult);
    recognition.addEventListener('end', () => {
        if (isRecording) {
            recognition.start();
        }
    });

    recognition.addEventListener('speechstart', () => {
        console.log('Speech detected');
        clearTimeout(silenceTimer);
    });

    recognition.addEventListener('speechend', () => {
        console.log('Speech ended');
        // Start the silence timer
        silenceTimer = setTimeout(() => {
            if (isRecording) {
                console.log('Silence detected, processing speech...');
                processSpeechResult();
            }
        }, SILENCE_DURATION);
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

let currentTranscript = '';

async function handleRecognitionResult(e) {
    const transcript = Array.from(e.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');

    currentTranscript = transcript;
    console.log(`Current transcript: "${currentTranscript}"`);
}

async function processSpeechResult() {
    if (!currentTranscript) return;

    console.log(`Processing: "${currentTranscript}"`);
    
    try {
        const response = await fetch(`${API_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Session-ID': sessionId
            },
            body: JSON.stringify({ message: currentTranscript })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received response:', data);
        
        if (data.response) {
            await textToSpeechElevenLabs(data.response);
        } else {
            await textToSpeechElevenLabs("I received an empty response from the server.");
        }
    } catch (error) {
        console.error('Error communicating with API:', error);
        await textToSpeechElevenLabs("Sorry, I encountered an error processing your request.");
    }

    // Clear the transcript after processing
    currentTranscript = '';
}

function stopRecording() {
    console.log("Stopping recording...");
    isRecording = false;
    micIcon.src = "icon.png";
    clearTimeout(silenceTimer);
    if (recognition) {
        recognition.stop();
    }
    // Process any remaining speech
    if (currentTranscript) {
        processSpeechResult();
    }
}

// 5. Event Listeners
mic.addEventListener('click', function() {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
});

// 6. Initialize browser voices
function loadVoices() {
    availableVoices = speechSynthesis.getVoices();
    console.log("Available Voices:", availableVoices);
}

function textToSpeech(text) {
    if (availableVoices.length === 0) {
        console.error("No voices loaded. Please try again later.");
        return;
    }

    let utterance = new SpeechSynthesisUtterance(text);
    const selectedVoice = getPreferredVoice();

    if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`Selected Voice: ${selectedVoice.name}`);
    }

    speechSynthesis.speak(utterance);
}

window.speechSynthesis.onvoiceschanged = loadVoices;

document.addEventListener('DOMContentLoaded', () => {
    if (speechSynthesis.onvoiceschanged !== undefined) {
        loadVoices();
    }
});