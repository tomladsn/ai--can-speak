import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set the output path for the audio file
const outputPath = join(__dirname, 'output.wav');

// Function to convert text to speech
function textToSpeech(text) {
    const command = `tts --text "${text}" --model_name tts_models/en/ljspeech/tacotron2-DDC --out_path "${outputPath}"`;

    console.log(`Executing command: ${command}`); // Log the command being executed

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing TTS command: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`TTS command stderr: ${stderr}`);
            return;
        }
        console.log(`Audio generated: ${outputPath}`);
    });
}

// Example usage
const text = "Hello, this is a test.";
textToSpeech(text);
