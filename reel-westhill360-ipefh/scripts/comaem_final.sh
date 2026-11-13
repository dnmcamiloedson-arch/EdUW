#!/bin/bash
# Masterización final del video COMAEM: baja 2 dB y limita picos del audio (el video no se recodifica),
# y saca una vista previa ligera en 720p.
# Uso: bash scripts/comaem_final.sh <versión>   (lee media/out/Comaem.mp4)
cd "$(dirname "$0")/../media/out" || exit 1
V=${1:-v1}
ffmpeg -v error -y -i Comaem.mp4 -c:v copy -af "volume=-2dB,alimiter=limit=0.93:attack=2:release=40:level=disabled" -c:a aac -b:a 256k -movflags +faststart "COMAEM_${V}_HD.mp4"
P=$(mktemp -u)
ffmpeg -v error -y -i "COMAEM_${V}_HD.mp4" -vf scale=1280:720 -c:v libx264 -preset slow -b:v 1000k -pass 1 -passlogfile "$P" -an -f mp4 /dev/null
ffmpeg -v error -y -i "COMAEM_${V}_HD.mp4" -vf scale=1280:720 -c:v libx264 -preset slow -b:v 1000k -pass 2 -passlogfile "$P" -c:a aac -b:a 160k -movflags +faststart "COMAEM_${V}_preview.mp4"
ls -la "COMAEM_${V}_HD.mp4" "COMAEM_${V}_preview.mp4"
