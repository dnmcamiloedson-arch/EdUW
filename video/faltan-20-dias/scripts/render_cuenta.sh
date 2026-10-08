#!/usr/bin/env bash
# Renderiza la cuenta regresiva. Uso: ./scripts/render_cuenta.sh [días...]   (por defecto 19 → 1)
# Salida: out/cuenta-regresiva/westhill-faltan-XX-dias.mp4 (+ _preview.mp4 de ≤ 30 MB para compartir)
set -euo pipefail
cd "$(dirname "$0")/.."
DIR=out/cuenta-regresiva
mkdir -p "$DIR"
DIAS=("$@")
[ ${#DIAS[@]} -eq 0 ] && DIAS=(19 18 17 16 15 14 13 12 11 10 9 8 7 6 5 4 3 2 1)
npx remotion bundle src/index.ts --out-dir out/_bundle >/dev/null
for d in "${DIAS[@]}"; do
	n=$(printf "%02d" "$d")
	wav="$DIR/_audio_$n.wav"
	meta=$(python3 scripts/make_countdown_audio.py "$d" "$wav")
	secs=$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['segundos'])" "$meta")
	npx remotion render out/_bundle CuentaRegresiva "$DIR/_video_$n.mp4" \
		--props="{\"dias\": $d, \"fecha\": \"28 · 10\"}" \
		--muted --image-format=jpeg --jpeg-quality=95 --crf=12 >/dev/null
	ffmpeg -y -hide_banner -loglevel error -i "$DIR/_video_$n.mp4" -i "$wav" \
		-map 0:v -map 1:a -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high -level 4.2 \
		-r 30 -g 30 -bf 2 -tune film -c:a aac -b:a 256k -ar 48000 -ac 2 -t "$secs" -movflags +faststart \
		-color_primaries bt709 -color_trc bt709 -colorspace bt709 "$DIR/westhill-faltan-$n-dias.mp4"
	ffmpeg -y -hide_banner -loglevel error -i "$DIR/westhill-faltan-$n-dias.mp4" -c:v libx264 -preset slow \
		-b:v 8M -maxrate 10M -bufsize 16M -pix_fmt yuv420p -c:a copy -movflags +faststart "$DIR/westhill-faltan-$n-dias_preview.mp4"
	rm -f "$DIR/_video_$n.mp4" "$wav"
	echo "LISTO día $d ($secs s) → $DIR/westhill-faltan-$n-dias.mp4"
done
echo "TERMINADO"
