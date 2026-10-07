#!/usr/bin/env bash
# Convierte el .pptx a imágenes para revisión visual.
# Uso: bash render_check.sh deck.pptx [dpi]  -> imprime las rutas de las imágenes
set -e
DECK="$(realpath "$1")"; DPI="${2:-80}"
OUT="$(mktemp -d /tmp/westhill_render_XXXX)"   # carpeta nueva cada vez: evita archivos .~lock que bloquean la exportación
cp "$DECK" "$OUT/deck.pptx"
PROFILE="$(mktemp -d /tmp/lo_profile_XXXX)"
SAL_USE_VCLPLUGIN=svp soffice -env:UserInstallation=file://$PROFILE --headless --convert-to pdf --outdir "$OUT" "$OUT/deck.pptx" >/dev/null 2>&1 || true
[ -f "$OUT/deck.pdf" ] || { echo "ERROR: LibreOffice no pudo exportar el PDF"; exit 1; }
pdftoppm -jpeg -r "$DPI" "$OUT/deck.pdf" "$OUT/s"
ls -1 "$OUT"/s-*.jpg
