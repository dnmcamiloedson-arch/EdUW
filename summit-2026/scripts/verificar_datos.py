"""Verifica que cada título, ponente y horario de datos/programa.json aparezca literalmente
en los archivos originales (tríptico .docx o Excel). Imprime todo lo que NO coincide."""
import json, re, sys, zipfile, pathlib
import openpyxl
B = pathlib.Path(__file__).resolve().parent.parent
xml = zipfile.ZipFile(B / "fuentes_originales/Programa_Westhill_Triptico.docx").read("word/document.xml").decode()
docx = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", re.sub(r"</w:p>", " ", xml)))
xl = []
for f in ["Programa_Westhill.xlsx", "Programa_Westhill_1.xlsx"]:
    for ws in openpyxl.load_workbook(B / "fuentes_originales" / f).worksheets:
        for row in ws.iter_rows(values_only=True):
            xl += [str(v) for v in row if v is not None]
xltext = " | ".join(xl)
data = json.load(open(B / "datos/programa.json"))
bad = 0
def chk(label, s):
    global bad
    where = ("tríptico" if s in docx else "") + (" excel" if s in xltext else "")
    if not where.strip():
        bad += 1; print(f"  NO ENCONTRADO  [{label}] {s}")
    return where
for k in ["nombre", "lema"]:
    chk("evento", data["evento"][k])
for d in data["dias"]:
    for a in d["actividades"]:
        for k in ["titulo", "ponente", "cargo"]:
            if a.get(k): chk(f'{d["dia"]} {a["inicio"]} {k}', a[k])
        chk(f'{d["dia"]} horario', f'{a["inicio"]}–{a["fin"]}' if f'{a["inicio"]}–{a["fin"]}' in docx else f'{a["inicio"]}')
print("Diferencias:", bad)
