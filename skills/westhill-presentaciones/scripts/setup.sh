#!/usr/bin/env bash
# Prepara el entorno: dependencias de Node en el directorio de trabajo, fuente Raleway y LibreOffice Impress.
# Uso: bash setup.sh <directorio_de_trabajo>
set -e
WORK="${1:-$PWD}"
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$WORK" && cd "$WORK"
[ -f package.json ] || npm init -y >/dev/null
node -e "require('pptxgenjs');require('react-icons/fa6');require('sharp');require('react-dom/server');require('jszip')" 2>/dev/null \
  || npm install --silent pptxgenjs react react-dom react-icons sharp jszip
mkdir -p ~/.fonts && cp "$SKILL"/assets/fonts/Raleway-*.ttf ~/.fonts/ && fc-cache -f >/dev/null 2>&1 || true
python3 -c "import PIL, lxml" 2>/dev/null || pip install -q pillow lxml
if ! ls /usr/lib/libreoffice/program 2>/dev/null | grep -q libsdlo; then
  (apt-get install -y -q --no-install-recommends libreoffice-impress >/dev/null 2>&1 || (apt-get update -q >/dev/null 2>&1 && apt-get install -y -q --no-install-recommends libreoffice-impress >/dev/null 2>&1)) \
    || echo "AVISO: no se pudo instalar LibreOffice Impress; la revisión visual no estará disponible."
fi
echo "Listo. Ejecuta tus scripts con: NODE_PATH=$WORK/node_modules node <script>.js"
