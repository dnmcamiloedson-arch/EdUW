#!/usr/bin/env bash
# Render completo: video (Remotion) + audio sintetizado → MP4 H.264/AAC 1080x1920 30 fps, 20.000 s.
set -euo pipefail
cd "$(dirname "$0")/.."
DIAS="${DIAS:-20}"
OUT="out/westhill-faltan-${DIAS}-dias.mp4"
python3 scripts/make_audio.py public/audio/teaser.wav
npx remotion render src/index.ts FaltanDias out/_video.mp4 \
	--props="{\"dias\": ${DIAS}, \"fecha\": \"28 · 10\", \"mostrarFecha\": true}" \
	--muted --crf=12 --concurrency="${CONCURRENCY:-4}" --gl=swiftshader
ffmpeg -y -hide_banner -loglevel error -i out/_video.mp4 -i public/audio/teaser.wav \
	-map 0:v -map 1:a -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high -level 4.2 \
	-r 30 -g 30 -bf 2 -tune film -x264-params "aq-mode=3" \
	-c:a aac -b:a 256k -ar 48000 -ac 2 -t 20 -movflags +faststart \
	-color_primaries bt709 -color_trc bt709 -colorspace bt709 "$OUT"
rm -f out/_video.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames,duration -of compact "$OUT"
echo "$OUT"
