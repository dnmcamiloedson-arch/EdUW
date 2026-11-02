#!/usr/bin/env bash
# Historia del 2 de noviembre (veladoras) → out/historias/westhill-dia-de-muertos-2-11.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
DIR=out/historias
mkdir -p "$DIR"
python3 scripts/leyendas/dos_nov.py "$DIR/_audio_dn.wav"
npx remotion render src/leyendas/entries/dosNov.ts EpOutro "$DIR/_video_dn.mp4" --props='{"dias": 0, "fecha": "2 · 11"}' \
	--concurrency=${CONC:-3} --muted --image-format=jpeg --jpeg-quality=95 --crf=12 >/dev/null
ffmpeg -y -hide_banner -loglevel error -i "$DIR/_video_dn.mp4" -i "$DIR/_audio_dn.wav" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 18 \
	-pix_fmt yuv420p -profile:v high -r 30 -c:a aac -b:a 256k -ar 48000 -ac 2 -shortest -movflags +faststart "$DIR/westhill-dia-de-muertos-2-11.mp4"
rm -f "$DIR/_video_dn.mp4" "$DIR/_audio_dn.wav"
echo "LISTO → $DIR/westhill-dia-de-muertos-2-11.mp4"
