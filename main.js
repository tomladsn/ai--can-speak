import { chatWithLlama } from './index.js';


const textarea = document.getElementById('text');
const accentSelect = document.getElementById('accent-select');
const speechBtn = document.getElementById('submit-btn');
const mic = document.getElementById('mic');

let isRecording = false;
let recognition;

function textToSpeech(text, accent) {
    console.log(`Speaking: "${text}" with accent: ${accent}`);
    let utterance = new SpeechSynthesisUtterance(text);
    let voices = speechSynthesis.getVoices();
    
    let voice = voices.find(v => v.lang.includes(accent));
    if (voice) {
        utterance.voice = voice;
    }

    speechSynthesis.speak(utterance);
}

speechBtn.addEventListener('click', async e => {
    e.preventDefault();
    if (textarea.value !== '') {
        let selectedAccent = accentSelect.value;
        let accentCode = 'en-GB';  // Default to British English
        switch (selectedAccent) {
            case 'british':
                accentCode = 'en-GB';
                break;
            case 'american':
                accentCode = 'en-US';
                break;
            case 'australian':
                accentCode = 'en-AU';
                break;
            case 'irish':
                accentCode = 'en-IE';
                break;
            case 'scottish':
                accentCode = 'en-SC';
                break;
            default:
                accentCode = 'en-GB';
        }
        console.log(`Submit button clicked. Text: "${textarea.value}"`);
        textToSpeech(textarea.value, accentCode);
    }
});

// Ensure voices are loaded
speechSynthesis.onvoiceschanged = () => {
    speechSynthesis.getVoices();
};

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
    mic.textContent = "Stop Recording";

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
    mic.textContent = "Start Recording";
    if (recognition) {
        recognition.stop();
    }
}

async function handleRecognitionResult(e) {
    const transcript = Array.from(e.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
    
    textarea.value = transcript;
    console.log(`Recognized: "${transcript}"`);

    if (e.results[0].isFinal) {
        console.log("Speech recognition final. Sending to Llama...");
        const llamaResponse = await chatWithLlama(transcript);
        
        console.log(`Llama response: "${llamaResponse}"`);
        textarea.value = llamaResponse;
        
        textToSpeech(llamaResponse, accentSelect.value);
    }
}
