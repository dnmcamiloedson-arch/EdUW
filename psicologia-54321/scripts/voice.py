#!/usr/bin/env python3
"""Genera la voz en off (Piper TTS, es-MX) y los tiempos palabra por palabra.

Los tiempos salen del propio modelo: se expone el tensor de duraciones por
fonema (`w_ceil`) de la red VITS como segunda salida del ONNX, así cada
palabra queda alineada a la muestra con el audio generado (sin whisper).

Salida (en assets/<voice.dir>/):
  <id>.wav, <id>_<n>.wav     una toma por frase
  timings.json               duración de cada toma y {text,start,end} por palabra

Uso: python3 scripts/voice.py            (re-sintetiza todo)
     python3 scripts/voice.py --only ver (solo un paso)
"""
import argparse
import json
import re
import tarfile
import urllib.request
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / "config.json").read_text())
CACHE = ROOT / ".cache" / "voice"
PUNCT = set(",.;:!?¡¿…")


def ensure_model() -> Path:
    v = CFG["voice"]
    name = v["model"]
    base = CACHE / f"vits-piper-{name}"
    onnx_path = base / f"{name}.onnx"
    if not onnx_path.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        tar_path = CACHE / f"{name}.tar.bz2"
        print(f"Descargando modelo {name} …")
        urllib.request.urlretrieve(v["modelUrl"], tar_path)
        with tarfile.open(tar_path) as t:
            t.extractall(CACHE, filter="data")
    patched = base / f"{name}.align.onnx"
    if not patched.exists():
        import onnx

        m = onnx.load(str(onnx_path))
        if not any(o.name == "w_ceil" for o in m.graph.output):
            m.graph.output.append(onnx.helper.make_tensor_value_info("w_ceil", onnx.TensorProto.FLOAT, None))
        onnx.save(m, str(patched))
        (base / f"{name}.align.onnx.json").write_text((base / f"{name}.onnx.json").read_text())
    return patched


def words_from_alignments(text: str, aligns, sr: int):
    """Agrupa fonemas en palabras (separadas por el fonema ' ')."""
    text_words = text.split()
    groups, cur, t = [], None, 0
    for a in aligns:
        dur = a.num_samples / sr
        p = a.phoneme
        if p in ("^", "$") or p == " ":
            if cur:
                groups.append(cur)
                cur = None
        elif p in PUNCT:
            pass  # la pausa de la puntuación no extiende la palabra
        else:
            if cur is None:
                cur = {"start": t, "end": t + dur}
            cur["end"] = t + dur
        t += dur
    if cur:
        groups.append(cur)
    if len(groups) != len(text_words):
        raise SystemExit(f"Alineación: {len(groups)} grupos de fonemas vs {len(text_words)} palabras en «{text}»")
    return [{"text": w, "start": round(g["start"], 3), "end": round(g["end"], 3)} for w, g in zip(text_words, groups)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default=None)
    args = ap.parse_args()

    v = CFG["voice"]
    if v.get("source") == "file":
        raise SystemExit("voice.source = \"file\": se usan las grabaciones de assets/audio/voice/ tal cual (no se sobrescriben).")

    from piper import PiperVoice, SynthesisConfig

    voice = PiperVoice.load(str(ensure_model()))
    sr = voice.config.sample_rate
    base_syn = dict(noise_scale=v["noiseScale"], noise_w_scale=v["noiseW"], normalize_audio=True, volume=0.9)

    out_dir = ROOT / "assets" / v["dir"]
    out_dir.mkdir(parents=True, exist_ok=True)
    tpath = out_dir / "timings.json"
    timings = json.loads(tpath.read_text()) if tpath.exists() else {}

    for step in CFG["steps"]:
        if args.only and step["id"] != args.only:
            continue
        syn = SynthesisConfig(length_scale=step.get("lengthScale", v["lengthScale"]), **base_syn)
        lines = step["voice"] if isinstance(step["voice"], list) else [step["voice"]]
        takes = []
        for i, line in enumerate(lines):
            fname = f"{step['id']}.wav" if len(lines) == 1 else f"{step['id']}_{i + 1}.wav"
            chunks = list(voice.synthesize(line, syn, include_alignments=True))
            assert len(chunks) == 1, f"una oración por toma: «{line}»"
            c = chunks[0]
            if not c.phoneme_alignments:
                raise SystemExit("El modelo no devolvió alineaciones")
            audio = c.audio_float_array
            # micro fade de 8 ms en los bordes: sin clics al empezar/terminar
            n = int(0.008 * sr)
            ramp = np.linspace(0, 1, n, dtype=np.float32)
            audio[:n] *= ramp
            audio[-n:] *= ramp[::-1]
            with wave.open(str(out_dir / fname), "wb") as w:
                w.setnchannels(1)
                w.setsampwidth(2)
                w.setframerate(sr)
                w.writeframes((audio * 32767).astype(np.int16).tobytes())
            words = words_from_alignments(line, c.phoneme_alignments, sr)
            takes.append({"file": f"{v['dir']}/{fname}", "text": line, "duration": round(len(audio) / sr, 3), "words": words})
            print(f"{fname:16s} {len(audio) / sr:5.2f}s  " + " ".join(f"{w['text']}@{w['start']:.2f}" for w in words))
        timings[step["id"]] = takes

    timings["_meta"] = {"engine": v["engine"], "model": v["model"], "lengthScale": v["lengthScale"], "sampleRate": sr}
    tpath.write_text(json.dumps(timings, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
