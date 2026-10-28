#!/usr/bin/env bash
# Recap de los altares → out/historias/westhill-recap-altares.mp4
# Clips en public/recap/ (verticales 1080×1920), música en public/recap/musica.(mp3|wav|m4a) y el orden en public/recap/recap.json.
# El video sin audio se guarda en out/historias/_recap_video.mp4: con «./scripts/render_recap.sh audio» solo se vuelve a montar el audio.
set -euo pipefail
cd "$(dirname "$0")/.."
DIR=out/historias
mkdir -p "$DIR"
if [ "${1:-}" != "audio" ]; then
	npx remotion render src/recap/index.tsx RecapOutro "$DIR/_recap_video.mp4" --props=public/recap/recap.json \
		--concurrency=${CONC:-3} --muted --image-format=jpeg --jpeg-quality=95 --crf=14 >/dev/null
fi
TOTAL=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$DIR/_recap_video.mp4")
REC=$(python3 -c "print($TOTAL - 4.5)")
python3 scripts/leyendas/recap_audio.py "$REC" "$TOTAL" "$DIR/_recap_audio.wav"
ffmpeg -y -hide_banner -loglevel error -i "$DIR/_recap_video.mp4" -i "$DIR/_recap_audio.wav" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 18 \
	-pix_fmt yuv420p -profile:v high -r 30 -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$DIR/westhill-recap-altares.mp4"
ffmpeg -y -hide_banner -loglevel error -i "$DIR/westhill-recap-altares.mp4" -c:v libx264 -preset slow -b:v 8M -maxrate 10M -bufsize 16M \
	-pix_fmt yuv420p -c:a copy -movflags +faststart "$DIR/westhill-recap-altares_preview.mp4"
rm -f "$DIR/_recap_audio.wav"
echo "LISTO → $DIR/westhill-recap-altares.mp4"
