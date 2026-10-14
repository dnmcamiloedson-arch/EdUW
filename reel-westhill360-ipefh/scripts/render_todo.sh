#!/bin/bash
# Renderiza todos los entregables a media/out/
cd "$(dirname "$0")/../remotion"
OUT=../media/out
mkdir -p $OUT
for id in "$@"; do
  npx remotion render src/index.ts "$id" "$OUT/$id.mp4" --concurrency=4 --crf=18 --log=error && echo "OK $id"
done
