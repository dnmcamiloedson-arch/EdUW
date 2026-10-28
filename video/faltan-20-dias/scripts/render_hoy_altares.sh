#!/usr/bin/env bash
# Historia del 28 de octubre (cuenta regresiva a HOY) → out/historias/westhill-hoy-altares-28-10.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
DIR=out/historias
mkdir -p "$DIR"
python3 scripts/leyendas/hoy_altares.py "$DIR/_audio_h.wav"
npx remotion render src/leyendas/entries/hoyAltares.ts EpOutro "$DIR/_video_h.mp4" --props='{"dias": 28, "fecha": "28 · 10"}' \
	--concurrency=${CONC:-3} --muted --image-format=jpeg --jpeg-quality=95 --crf=12 >/dev/null
ffmpeg -y -hide_banner -loglevel error -i "$DIR/_video_h.mp4" -i "$DIR/_audio_h.wav" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 18 \
	-pix_fmt yuv420p -profile:v high -r 30 -c:a aac -b:a 256k -ar 48000 -ac 2 -shortest -movflags +faststart "$DIR/westhill-hoy-altares-28-10.mp4"
rm -f "$DIR/_video_h.mp4" "$DIR/_audio_h.wav"
echo "LISTO → $DIR/westhill-hoy-altares-28-10.mp4"
