#!/bin/bash

# Create output directory structure for MP3 files
mkdir -p public/samples-mp3

# Count total WAV files to process
total_files=$(find public/samples -name "*.wav" | wc -l)
echo "Found $total_files WAV files to convert"

# Counter for successful conversions
success_count=0
fail_count=0

# Log files
success_log="conversion_success.log"
fail_log="conversion_fail.log"

# Clear previous logs
> "$success_log"
> "$fail_log"

# Find all WAV files and convert them to MP3
find public/samples -name "*.wav" -print0 | while IFS= read -r -d $'\0' file; do
  # Create the output directory structure
  dir=$(dirname "${file}" | sed 's|public/samples|public/samples-mp3|')
  mkdir -p "${dir}"
  
  # Get the filename without extension
  filename=$(basename "${file}" .wav)
  
  # Convert the WAV to MP3 with good quality
  echo "Converting ${file} to ${dir}/${filename}.mp3"
  
  # Run ffmpeg with error handling
  if ffmpeg -i "${file}" -codec:a libmp3lame -qscale:a 2 "${dir}/${filename}.mp3" -y 2>&1 | grep -q "Error"; then
    echo "Failed to convert: ${file}" | tee -a "$fail_log"
    fail_count=$((fail_count + 1))
  else
    echo "Successfully converted: ${file}" | tee -a "$success_log"
    success_count=$((success_count + 1))
  fi
  
  # Show progress
  echo "Progress: $((success_count + fail_count))/$total_files"
done

echo "Conversion complete!"
echo "Successfully converted: $success_count files"
echo "Failed to convert: $fail_count files"
echo "See $success_log for successful conversions"
echo "See $fail_log for failed conversions"

# Check and report missing MP3 files
echo ""
echo "Checking for any missing MP3 files..."
find public/samples -name "*.wav" -print0 | while IFS= read -r -d $'\0' wav_file; do
  mp3_file=$(echo "${wav_file}" | sed 's|public/samples|public/samples-mp3|' | sed 's/\.wav$/.mp3/')
  if [ ! -f "${mp3_file}" ]; then
    echo "Missing MP3 file: ${mp3_file} (from ${wav_file})"
  fi
done 