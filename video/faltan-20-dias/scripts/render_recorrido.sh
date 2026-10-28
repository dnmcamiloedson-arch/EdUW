#!/usr/bin/env bash
# Anuncio del recorrido de altares (28 de octubre, 12:00 PM) → out/historias/westhill-recorrido-altares-12pm.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
DIR=out/historias
mkdir -p "$DIR"
python3 scripts/leyendas/recorrido.py "$DIR/_audio_r.wav"
npx remotion render src/leyendas/entries/recorrido.ts EpOutro "$DIR/_video_r.mp4" --props='{"dias": 28, "fecha": "28 · 10"}' \
	--concurrency=${CONC:-3} --muted --image-format=jpeg --jpeg-quality=95 --crf=12 >/dev/null
ffmpeg -y -hide_banner -loglevel error -i "$DIR/_video_r.mp4" -i "$DIR/_audio_r.wav" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 18 \
	-pix_fmt yuv420p -profile:v high -r 30 -c:a aac -b:a 256k -ar 48000 -ac 2 -shortest -movflags +faststart "$DIR/westhill-recorrido-altares-12pm.mp4"
rm -f "$DIR/_video_r.mp4" "$DIR/_audio_r.wav"
echo "LISTO → $DIR/westhill-recorrido-altares-12pm.mp4"
ffmpeg -y -hide_banner -loglevel error -i "$DIR/westhill-recorrido-altares-12pm.mp4" -c:v libx264 -preset slow -b:v 9M -maxrate 11M -bufsize 16M -pix_fmt yuv420p -c:a copy -movflags +faststart "$DIR/westhill-recorrido-altares-12pm_preview.mp4"
