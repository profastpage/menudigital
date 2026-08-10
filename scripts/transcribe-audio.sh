#!/usr/bin/env bash
# Split audio into 25s chunks and transcribe each one
set -e

INPUT_WAV="$1"
LABEL="$2"
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$INPUT_WAV")
CHUNK_SEC=25
NUM_CHUNKS=$(python3 -c "import math; print(math.ceil($DURATION / $CHUNK_SEC))")
echo "→ $LABEL: duration=${DURATION}s, splitting into $NUM_CHUNKS chunks of ${CHUNK_SEC}s"

FULL_TEXT=""
for i in $(seq 0 $((NUM_CHUNKS - 1))); do
  START=$((i * CHUNK_SEC))
  CHUNK="/tmp/chunk_${LABEL}_${i}.wav"
  ffmpeg -y -ss ${START} -t ${CHUNK_SEC} -i "$INPUT_WAV" -ar 16000 -ac 1 -acodec pcm_s16le "$CHUNK" 2>/dev/null
  OUT="/tmp/chunk_${LABEL}_${i}.json"
  if z-ai asr -f "$CHUNK" -o "$OUT" 2>/dev/null; then
    TEXT=$(python3 -c "import json; print(json.load(open('$OUT')).get('text', ''))" 2>/dev/null)
    echo "  [chunk $((i+1))/$NUM_CHUNKS @ ${START}s] $TEXT"
    FULL_TEXT="$FULL_TEXT $TEXT"
  else
    echo "  [chunk $((i+1))/$NUM_CHUNKS @ ${START}s] (failed)"
  fi
  rm -f "$CHUNK" "$OUT"
done
echo ""
echo "=== FULL TRANSCRIPT ($LABEL) ==="
echo "$FULL_TEXT" | sed 's/^ *//'
