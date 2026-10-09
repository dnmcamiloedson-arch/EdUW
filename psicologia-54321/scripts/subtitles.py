#!/usr/bin/env python3
"""Exporta subtítulos desde la línea de tiempo (mismos tiempos que los quemados en el video).

  out/<base>.srt            por frase (para subir a la plataforma o reeditar)
  out/<base>_palabras.srt   palabra por palabra
  (variante 40: out/<base>_40s.srt y out/<base>_40s_palabras.srt)
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / "config.json").read_text())


def ts(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def write(path, cues):
    path.write_text("\n".join(f"{i}\n{ts(a)} --> {ts(b)}\n{txt}\n" for i, (a, b, txt) in enumerate(cues, 1)), encoding="utf-8")
    print(path.relative_to(ROOT), len(cues), "cues")


for variant in CFG["variants"]:
    tl = json.loads((ROOT / "assets" / "timeline" / f"{variant}.json").read_text())
    base = CFG["meta"]["outputBase"] + ("" if variant == CFG["activeVariant"] else f"_{variant}s")
    phrases = [(c["words"][0]["start"], c["showTo"], " ".join(w["text"] for w in c["words"])) for c in tl["captions"]]
    words = []
    for c in tl["captions"]:
        for i, w in enumerate(c["words"]):
            nxt = c["words"][i + 1]["start"] if i + 1 < len(c["words"]) else max(w["end"] + 0.25, w["end"])
            words.append((w["start"], max(nxt, w["end"]), w["text"]))
    write(ROOT / "out" / f"{base}.srt", phrases)
    write(ROOT / "out" / f"{base}_palabras.srt", words)
