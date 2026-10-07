#!/usr/bin/env bash
# Regenera TODOS los materiales a partir de datos/programa.json (y datos/participantes.csv).
# Requisitos: Node 18+, `npm install`, Playwright con Chromium, LibreOffice y poppler-utils (pdfseparate).
set -e
cd "$(dirname "$0")/.."
node scripts/diapositivas.js
node scripts/constancias.js
bash scripts/pdf.sh
node scripts/html.js
python3 scripts/verificar_datos.py
