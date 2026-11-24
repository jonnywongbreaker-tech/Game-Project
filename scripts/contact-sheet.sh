#!/usr/bin/env bash
# Side-by-side comparison of the style prototypes: rows = A/B/C, columns = the same moments.
# Usage: bash scripts/contact-sheet.sh   (after npm run benchmark rendered out/bench/Memory-*.mp4)
set -euo pipefail
mkdir -p out/sheet
times=(1.8 4.0 8.0 12.2)
i=0
for s in A-Geometric B-Textured C-Cinematic; do
  for t in "${times[@]}"; do
    ffmpeg -loglevel error -y -ss "$t" -i "out/bench/Memory-$s-Long.mp4" -frames:v 1 -vf scale=640:-1 "out/sheet/$(printf %02d $i).png"
    i=$((i+1))
  done
done
ffmpeg -loglevel error -y -framerate 1 -i out/sheet/%02d.png -vf "tile=4x3:padding=8:color=white" -frames:v 1 out/style-comparison.png
echo "Wrote out/style-comparison.png"
