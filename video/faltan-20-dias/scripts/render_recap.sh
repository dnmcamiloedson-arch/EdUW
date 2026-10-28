#!/usr/bin/env bash
# Recap de los altares → out/historias/westhill-recap-altares.mp4
# Clips y música en public/recap/; el orden, los cortes y los rótulos en public/recap/recap.json:
#   {"musica": "recap/musica.mp3", "clips": [{"file": "recap/clip1.mp4", "start": 0, "dur": 4,
#     "carrera": "Psicología", "leyenda": "Las Brujas de Fuego", "png": "recap/nombres/psicologia-y-ciencias-de-la-educacion.png"}, …]}
set -euo pipefail
cd "$(dirname "$0")/.."
DIR=out/historias
mkdir -p "$DIR"
npx remotion render src/recap/index.tsx RecapOutro "$DIR/_recap.mp4" --props=public/recap/recap.json \
	--concurrency=${CONC:-3} --image-format=jpeg --jpeg-quality=95 --crf=12 >/dev/null
# volumen: −14 LUFS y pico real ≤ −1 dBTP, sin saturar
ffmpeg -y -hide_banner -loglevel error -i "$DIR/_recap.mp4" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high -r 30 \
	-af "loudnorm=I=-14:TP=-1.5:LRA=11" -c:a aac -b:a 256k -ar 48000 -movflags +faststart "$DIR/westhill-recap-altares.mp4"
ffmpeg -y -hide_banner -loglevel error -i "$DIR/westhill-recap-altares.mp4" -c:v libx264 -preset slow -b:v 8M -maxrate 10M -bufsize 16M \
	-pix_fmt yuv420p -c:a copy -movflags +faststart "$DIR/westhill-recap-altares_preview.mp4"
rm -f "$DIR/_recap.mp4"
echo "LISTO → $DIR/westhill-recap-altares.mp4"
