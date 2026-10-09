#!/usr/bin/env python3
"""Construye la línea de tiempo de cada variante a partir de config.json + timings.json.

Es la única fuente de verdad de tiempos: la leen Remotion (src/), la mezcla de
audio (audio.py), los subtítulos SRT y el QA. Escribe assets/timeline/<variante>.json.

Uso: python3 scripts/timeline.py [variante ...]   (sin argumentos: todas)
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / "config.json").read_text())
PUNCT_BREAK = (",", ".", ";", ":", "?", "!")
MAX_WORDS_PER_CAPTION = 8


def load_timings():
    return json.loads((ROOT / "assets" / CFG["voice"]["dir"] / "timings.json").read_text())


def caption_groups(words):
    """Parte una toma en grupos legibles: corta en puntuación o a las N palabras."""
    groups, cur = [], []
    for w in words:
        cur.append(w)
        if w["text"].endswith(PUNCT_BREAK) or len(cur) >= MAX_WORDS_PER_CAPTION:
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)
    return groups


def build(variant: str):
    var = CFG["variants"][variant]
    fps = CFG["format"]["fps"]
    timings = load_timings()
    d = var["durations"]
    seg_durs = [d["intro"], *d["steps"], d["outro"]]
    steps = CFG["steps"]
    assert len(seg_durs) == len(steps), "durations no coincide con steps"

    total = round(sum(seg_durs), 3)
    sections, voice, words, chimes = [], [], [], []
    t = 0.0
    for step, dur in zip(steps, seg_durs):
        sec = {k: step[k] for k in ("id", "kind", "accent") if k in step}
        for k in ("number", "label", "items", "onScreen", "heart"):
            if k in step:
                sec[k] = step[k]
        sec["start"], sec["end"] = round(t, 3), round(t + dur, 3)
        sections.append(sec)
        if step["kind"] == "step":
            chimes.append({"t": round(t + 0.12, 3), "number": step["number"]})

        offset = var.get("voiceOffsets", {}).get(step["id"], var["voiceOffset"])
        vt = t + offset
        for i, take in enumerate(timings[step["id"]]):
            if i > 0:
                vt += var.get("outroSentenceGap", 0.3)
            voice.append({"step": step["id"], "file": take["file"], "start": round(vt, 3), "duration": take["duration"], "text": take["text"]})
            for w in take["words"]:
                words.append({"text": w["text"], "start": round(vt + w["start"], 3), "end": round(vt + w["end"], 3), "step": step["id"], "take": len(voice) - 1})
            vt += take["duration"]
        t += dur

    # grupos de subtítulos (por toma, partidos en puntuación)
    captions = []
    for ti, _ in enumerate(voice):
        tw = [w for w in words if w["take"] == ti]
        for g in caption_groups(tw):
            captions.append({"start": g[0]["start"], "end": g[-1]["end"], "words": [{"text": w["text"], "start": w["start"], "end": w["end"]} for w in g]})
    # visibilidad: se queda hasta 0.25 s antes del siguiente grupo (máx +1.4 s); entre grupos queda un hueco limpio
    for i, c in enumerate(captions):
        nxt = captions[i + 1]["start"] - 0.25 if i + 1 < len(captions) else total
        c["showFrom"] = round(c["start"] - 0.08, 3)
        c["showTo"] = round(min(c["end"] + 1.4, nxt, total - 0.1), 3)

    dis = var["disclaimerLastSeconds"]
    outro = sections[-1]
    last_voice_end = voice[-1]["start"] + voice[-1]["duration"]
    tl = {
        "variant": variant,
        "fps": fps,
        "duration": total,
        "durationInFrames": round(total * fps),
        "sections": sections,
        "voice": voice,
        "words": words,
        "captions": captions,
        "chimes": chimes,
        "disclaimer": {"start": round(total - dis, 3), "end": total, "text": CFG["disclaimer"]},
        "onScreen": {"start": round(outro["start"] + 0.9, 3), "text": outro.get("onScreen", "")},
        "fadeOut": {"start": round(total - 0.7, 3), "end": total},
        "lastVoiceEnd": round(last_voice_end, 3),
    }
    # validaciones de ritmo / solapes
    for i, (a, b) in enumerate(zip(voice, voice[1:])):
        a_end = max(w["end"] for w in words if w["take"] == i)
        b_start = min(w["start"] for w in words if w["take"] == i + 1)
        if b_start - a_end < 0.25:
            raise SystemExit(f"[{variant}] sin respiro entre «{a['text']}» y «{b['text']}» ({b_start - a_end:.2f}s)")
    if last_voice_end > total - 0.2:
        raise SystemExit(f"[{variant}] la voz termina en {last_voice_end:.2f}s, muy pegada al final ({total}s)")
    return tl


def pacing_report(tl):
    """Tiempo libre (sin voz) que le queda a la persona para hacer cada paso."""
    rows = []
    for s in tl["sections"]:
        if s["kind"] != "step":
            continue
        vs = [v for v in tl["voice"] if v["step"] == s["id"]]
        speech_end = max(w["end"] for w in tl["words"] if w["step"] == s["id"])
        rows.append((s["number"], s["id"], round(s["end"] - speech_end, 2), round(s["end"] - s["start"], 2), vs[0]["start"]))
    return rows


def write(variant):
    tl = build(variant)
    out = ROOT / "assets" / "timeline"
    out.mkdir(parents=True, exist_ok=True)
    (out / f"{variant}.json").write_text(json.dumps(tl, ensure_ascii=False, indent=1))
    return tl


if __name__ == "__main__":
    for v in sys.argv[1:] or list(CFG["variants"].keys()):
        tl = write(v)
        print(f"variante {v}: {tl['duration']}s / {tl['durationInFrames']} frames, voz termina {tl['lastVoiceEnd']}s")
        for n, sid, free, dur, vstart in pacing_report(tl):
            print(f"  {n} {sid:9s} sección {dur:4.1f}s · voz entra {vstart:5.2f}s · silencio para actuar {free:4.2f}s")
