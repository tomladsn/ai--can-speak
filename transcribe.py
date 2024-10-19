import whisper

# Load the Whisper model
model = whisper.load_model("base")  # Change to "small", "medium", or "large" as needed

# Function to transcribe audio
def transcribe_audio(file_path):
    # Load and transcribe the audio file
    result = model.transcribe(file_path)
    return result['text']

# Example usage
audio_file_path = 'myrecorg.wav'  # Path to your recorded audio file
transcription = transcribe_audio(audio_file_path)
print('Transcription:', transcription)

# Exporting the transcription to a text file
output_file_path = 'transcription.txt'  # Desired output file name
with open(output_file_path, 'w') as text_file:
    text_file.write(transcription)

print(f'Transcription has been saved to {output_file_path}')
