const mic = document.getElementById('mic');
const micIcon = document.getElementById('mic-icon');
let isRecording = false;
let recognition;
let voicesLoaded = false;
let availableVoices = [];

// Generate a session ID
const sessionId = Math.random().toString(36).substring(7);

// Update voice selection based on accent
const accentSelect = document.getElementById('accent-select');
accentSelect.addEventListener('change', function() {
    loadVoices(); // Refresh voices when accent changes
});

function getPreferredVoice() {
    const accent = accentSelect.value;
    const accentMap = {
        'british': 'GB',
        'american': 'US',
        'australian': 'AU',
        'irish': 'IE',
        'scottish': 'GB-SCT',
        'welsh': 'GB-WLS',
        'canadian': 'CA',
        'newzealand': 'NZ',
        'southafrican': 'ZA'
    };

    return availableVoices.find(voice => 
        voice.lang.includes(`en-${accentMap[accent]}`) ||
        voice.name.toLowerCase().includes(accent)
    ) || availableVoices.find(voice => voice.lang.includes('en-'));
}

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

    let utterance = new SpeechSynthesisUtterance(text);
    const selectedVoice = getPreferredVoice();

    if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`Selected Voice: ${selectedVoice.name}`);
    }

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

    if (e.results[0].isFinal) {
        try {
            const response = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Session-ID': sessionId
                },
                body: JSON.stringify({ message: transcript })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received response:', data);
            if (data.response) {
                textToSpeech(data.response);
            } else {
                textToSpeech("I received an empty response from the server.");
            }
        } catch (error) {
            console.error('Error communicating with API:', error);
            textToSpeech("Sorry, I encountered an error processing your request.");
        }
    }
}

// Preload voices when the page is loaded to avoid delays in TTS
document.addEventListener('DOMContentLoaded', () => {
    if (speechSynthesis.onvoiceschanged !== undefined) {
        loadVoices();
    }
});
