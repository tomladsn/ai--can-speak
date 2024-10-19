const { exec } = require('child_process');

// Define the microphone name and other parameters
const microphoneName = 'Microphone Array (Realtek Audio)';
const outputFileName = 'myrecorg.wav';
const duration = 10; // duration in seconds

// Construct the ffmpeg command
const command = `ffmpeg -f dshow -i audio="${microphoneName}" -t ${duration} ${outputFileName}`;

// Execute the command
exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error executing command: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`FFmpeg stderr: ${stderr}`);
        return;
    }
    console.log(`FFmpeg stdout: ${stdout}`);
    console.log(`Recording completed! File saved as: ${outputFileName}`);
});
