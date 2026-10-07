#!/usr/bin/env bash
# Convierte a PDF las constancias (.pptx) y separa una página por ponente.
set -e
cd "$(dirname "$0")/.."
conv() { # $1 = pptx, $2 = carpeta destino
  local T; T="$(mktemp -d)"; local PROF; PROF="$(mktemp -d)"
  cp "$1" "$T/in.pptx"
  SAL_USE_VCLPLUGIN=svp soffice -env:UserInstallation=file://$PROF --headless --convert-to pdf --outdir "$T" "$T/in.pptx" >/dev/null 2>&1
  cp "$T/in.pdf" "$2/$(basename "${1%.pptx}").pdf"; rm -rf "$T" "$PROF"
}
P=entregables/04_constancias_ponentes; A=entregables/03_constancias_participantes
conv $P/Constancias_Ponentes_WMLS2026.pptx $P
conv $P/Plantilla_Constancia_Ponente_WMLS2026.pptx $P
conv $A/Plantilla_Constancia_Participante_WMLS2026.pptx $A
[ -f $A/Constancias_Participantes_WMLS2026.pptx ] && conv $A/Constancias_Participantes_WMLS2026.pptx $A
mkdir -p $P/individuales && rm -f $P/individuales/*.pdf
python3 - <<'PY'
import json, subprocess
P = "entregables/04_constancias_ponentes"
for e in json.load(open(f"{P}/orden.json")):
    n = e["pagina"]
    subprocess.run(["pdfseparate", "-f", str(n), "-l", str(n), f"{P}/Constancias_Ponentes_WMLS2026.pdf", f"{P}/individuales/{e['archivo']}"], check=True)
PY
echo "PDF listos"
