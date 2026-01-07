#!/bin/bash

# Create all the required directories first
mkdir -p public/samples-mp3/DRY/SHORT
mkdir -p public/samples-mp3/DRY/LONG
mkdir -p public/samples-mp3/WET/SHORT
mkdir -p public/samples-mp3/WET/LONG

# Convert function with minimal output
convert_file() {
  local input_file="$1"
  local output_file="$2"
  
  # Use quiet mode for ffmpeg
  ffmpeg -loglevel error -i "$input_file" -codec:a libmp3lame -qscale:a 2 "$output_file" -y
  
  if [ $? -eq 0 ]; then
    echo "✓ $(basename "$input_file")"
    return 0
  else
    echo "✗ $(basename "$input_file")"
    return 1
  fi
}

echo "Converting DRY/SHORT files..."
for wav in public/samples/DRY/SHORT/*.wav; do
  mp3="public/samples-mp3/DRY/SHORT/$(basename "$wav" .wav).mp3"
  convert_file "$wav" "$mp3"
done

echo "Converting DRY/LONG files..."
for wav in public/samples/DRY/LONG/*.wav; do
  mp3="public/samples-mp3/DRY/LONG/$(basename "$wav" .wav).mp3"
  convert_file "$wav" "$mp3"
done

echo "Converting WET/SHORT files..."
for wav in public/samples/WET/SHORT/*.wav; do
  mp3="public/samples-mp3/WET/SHORT/$(basename "$wav" .wav).mp3"
  convert_file "$wav" "$mp3"
done

echo "Converting WET/LONG files..."
for wav in public/samples/WET/LONG/*.wav; do
  mp3="public/samples-mp3/WET/LONG/$(basename "$wav" .wav).mp3"
  convert_file "$wav" "$mp3"
done

# Count results
wav_count=$(find public/samples -name "*.wav" | wc -l)
mp3_count=$(find public/samples-mp3 -name "*.mp3" | wc -l)

echo "===================="
echo "Conversion completed"
echo "Original WAV files: $wav_count"
echo "Converted MP3 files: $mp3_count"

if [ $wav_count -eq $mp3_count ]; then
  echo "All files successfully converted! ✓"
else
  echo "Some files were not converted. ($((wav_count - mp3_count)) missing)"
fi 