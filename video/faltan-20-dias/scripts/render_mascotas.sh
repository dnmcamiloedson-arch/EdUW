#!/usr/bin/env bash
# Video del 27 de octubre (las mascotas) → out/historias/westhill-mascotas-27-10.mp4 (+ _preview.mp4)
# Para usar los audios del cliente: copiarlos como public/audio/mascotas/maullido1.wav, ladrido1.wav, … y volver a correr.
set -euo pipefail
cd "$(dirname "$0")/.."
DIR=out/historias
mkdir -p "$DIR"
python3 scripts/leyendas/mascotas.py "$DIR/_audio_m.wav"
npx remotion render src/leyendas/entries/mascotas.ts EpOutro "$DIR/_video_m.mp4" --props='{"dias": 27, "fecha": "27 · 10"}' \
	--concurrency=${CONC:-2} --muted --image-format=jpeg --jpeg-quality=95 --crf=12 >/dev/null
ffmpeg -y -hide_banner -loglevel error -i "$DIR/_video_m.mp4" -i "$DIR/_audio_m.wav" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 18 \
	-pix_fmt yuv420p -profile:v high -r 30 -c:a aac -b:a 256k -ar 48000 -ac 2 -shortest -movflags +faststart "$DIR/westhill-mascotas-27-10.mp4"
ffmpeg -y -hide_banner -loglevel error -i "$DIR/westhill-mascotas-27-10.mp4" -c:v libx264 -preset slow -b:v 6M -maxrate 8M -bufsize 12M \
	-pix_fmt yuv420p -c:a copy -movflags +faststart "$DIR/westhill-mascotas-27-10_preview.mp4"
rm -f "$DIR/_video_m.mp4" "$DIR/_audio_m.wav"
echo "LISTO → $DIR/westhill-mascotas-27-10.mp4"
