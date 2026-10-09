#!/usr/bin/env python3
"""Diseño sonoro y mezcla, 100 % sintetizado y determinista.

- Voz: tomas de assets/audio/voice/ colocadas según assets/timeline/<variante>.json
- Música: pad ambiental (acordes lentos, sin melodía) que "respira" con el círculo (ciclo de 4 s)
- Chimes: tipo cuenco suave al aparecer cada número (ataque de 30 ms, sin transitorios duros)
- Ducking automático de la música bajo la voz (-12 dB)
- Master: -16 LUFS integrado, true peak <= -1 dBTP

Salida: assets/audio/mix_<variante>.wav  +  out/stems/<variante>/{voz,musica,chimes}.flac
Uso: python3 scripts/audio.py [variante ...]
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt

ROOT = Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / "config.json").read_text())
A = CFG["audio"]
SR = 48000
db = lambda x: 10 ** (x / 20)


def load_voice(rel):
    path = ROOT / "assets" / rel
    sr, x = wavfile.read(path)
    x = x.astype(np.float32) / (32768.0 if x.dtype == np.int16 else 1.0)
    if x.ndim > 1:
        x = x.mean(axis=1)
    if sr != SR:
        from math import gcd

        g = gcd(SR, sr)
        x = resample_poly(x, SR // g, sr // g).astype(np.float32)
    # limpieza suave: pasa-altos 80 Hz y leve compresión 2.5:1 (voz pareja, sin bombeo)
    x = sosfilt(butter(2, 80, "highpass", fs=SR, output="sos"), x)
    env = np.sqrt(np.convolve(x**2, np.ones(480) / 480, mode="same")) + 1e-9
    thr = db(-22)
    gain = np.where(env > thr, (env / thr) ** (1 / 2.5 - 1), 1.0)
    gain = np.convolve(gain, np.ones(240) / 240, mode="same")
    return (x * gain).astype(np.float32)


def reverb_ir(seconds=3.2, seed=7):
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    env = np.exp(-t * 6.9 / seconds)
    ir = rng.normal(0, 1, (2, n)) * env
    ir = sosfilt(butter(1, 3500, "lowpass", fs=SR, output="sos"), ir, axis=1)
    return ir / np.sqrt((ir**2).sum(axis=1, keepdims=True))


def pad(total, breath_period):
    """Acordes lentos (A mayor: Amaj9 · F#m11 · Dmaj9 · Esus) con cruces de 3 s."""
    n = int(total * SR)
    t = np.arange(n) / SR
    root = A["padRoot"]  # A2
    semis = lambda s: root * 2 ** (s / 12)
    chords = [[0, 7, 11, 16, 23], [-3, 4, 7, 12, 17], [-7, 2, 9, 14, 21], [-5, 2, 7, 14, 19]]
    seg = 7.0
    out = np.zeros((2, n))
    rng = np.random.default_rng(3)
    for ci in range(int(np.ceil(total / seg)) + 1):
        chord = chords[ci % len(chords)]
        c0 = ci * seg - 1.5
        w = np.clip((t - c0) / 3.0, 0, 1) * np.clip((c0 + seg + 3.0 - t) / 3.0, 0, 1)
        w = np.sin(w * np.pi / 2) ** 2
        if w.max() == 0:
            continue
        for vi, s in enumerate(chord):
            f = semis(s)
            amp = 0.22 / (1 + vi * 0.35)
            for ch in range(2):
                det = 1 + (rng.random() - 0.5) * 0.004
                ph = rng.random() * 2 * np.pi
                lfo = 1 + 0.25 * np.sin(2 * np.pi * (0.05 + 0.03 * rng.random()) * t + rng.random() * 6)
                tone = np.sin(2 * np.pi * f * det * t + ph) + 0.18 * np.sin(2 * np.pi * 2 * f * det * t + ph)
                out[ch] += amp * w * lfo * tone
    out = sosfilt(butter(2, 1800, "lowpass", fs=SR, output="sos"), out, axis=1)
    # "respira" con el círculo: ±1.5 dB en el mismo ciclo de 4 s
    br = 0.5 - 0.5 * np.cos(2 * np.pi * t / breath_period)
    out *= db(-1.5 + 3.0 * br)
    ir = reverb_ir()
    wet = np.stack([fftconvolve(out[c], ir[c])[:n] for c in range(2)])
    return 0.55 * out + 0.75 * wet


def chime(freq, seconds=3.2):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    partials = [(1.0, 1.0, 2.8), (2.76, 0.42, 1.5), (5.40, 0.16, 0.8), (8.93, 0.06, 0.45)]
    x = np.zeros(n)
    for ratio, amp, dec in partials:
        f = freq * ratio
        x += amp * np.exp(-t / dec * 2.3) * (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.0025 * t))
    att = int(0.03 * SR)  # ataque suave: nada de golpe
    x[:att] *= 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, att))
    x = sosfilt(butter(2, 3000, "lowpass", fs=SR, output="sos"), x)
    return x / np.abs(x).max()


CHIME_NOTES = {5: 659.26, 4: 554.37, 3: 493.88, 2: 440.0, 1: 329.63}  # pentatónica descendente: aterriza


def true_peak_db(x):
    os = resample_poly(x, 4, 1, axis=-1)
    return 20 * np.log10(np.abs(os).max() + 1e-12)


def tp_limiter(x, ceiling_db):
    """Limitador con lookahead sobre la señal sobremuestreada x4 (suave, 1.5 ms ataque / 120 ms release)."""
    os = resample_poly(x, 4, 1, axis=-1)
    peak = np.abs(os).max(axis=0)
    need = np.minimum(1.0, db(ceiling_db) / (peak + 1e-12))
    need = need.reshape(-1, 4).min(axis=1)  # vuelve a la tasa original
    look = int(0.0015 * SR)
    need = np.minimum.reduce([np.roll(need, -i) for i in range(look + 1)])
    g = np.empty_like(need)
    rel = np.exp(-1 / (0.12 * SR))
    cur = 1.0
    for i, v in enumerate(need):
        cur = v if v < cur else v + (cur - v) * rel
        g[i] = cur
    return x * g


def build(variant):
    tl = json.loads((ROOT / "assets" / "timeline" / f"{variant}.json").read_text())
    total = tl["duration"]
    n = int(round(total * SR))
    t = np.arange(n) / SR

    voice = np.zeros(n)
    for v in tl["voice"]:
        x = load_voice(v["file"])
        i0 = int(round(v["start"] * SR))
        seg = x[: max(0, min(len(x), n - i0))]
        voice[i0 : i0 + len(seg)] += seg

    chimes = np.zeros((2, n))
    for c in tl["chimes"]:
        x = chime(CHIME_NOTES.get(c["number"], 440.0))
        i0 = int(round(c["t"] * SR))
        seg = x[: max(0, min(len(x), n - i0))]
        pan = {5: -0.25, 4: 0.2, 3: -0.1, 2: 0.15, 1: 0.0}.get(c["number"], 0)
        chimes[0, i0 : i0 + len(seg)] += seg * np.sqrt(0.5 - pan / 2)
        chimes[1, i0 : i0 + len(seg)] += seg * np.sqrt(0.5 + pan / 2)
    chimes *= db(A["chimeLevelDb"])

    music = pad(total, CFG["motion"]["breathPeriod"])
    music /= np.sqrt((music**2).mean()) + 1e-12
    music *= db(A["musicLevelDb"])

    # ducking: detector RMS de la voz → -12 dB, ataque 120 ms / release 450 ms, con 100 ms de anticipación
    env = np.sqrt(np.convolve(voice**2, np.ones(960) / 960, mode="same"))
    active = (env > db(-45)).astype(float)
    active = np.roll(active, -int(0.1 * SR))
    target = np.where(active > 0, A["duckDb"], 0.0)
    gdb = np.empty(n)
    a_att, a_rel = np.exp(-1 / (0.12 * SR)), np.exp(-1 / (0.45 * SR))
    cur = 0.0
    for i in range(n):
        tg = target[i]
        a = a_att if tg < cur else a_rel
        cur = tg + (cur - tg) * a
        gdb[i] = cur
    music *= db(gdb)

    # fades globales: entrada 1.8 s, salida sincronizada con el fade visual
    fin = np.clip(t / 1.8, 0, 1) ** 2
    fout = np.clip((total - t) / (total - tl["fadeOut"]["start"] + 0.5), 0, 1)
    master_env = fin * np.sin(fout * np.pi / 2)
    music *= master_env
    chimes *= np.clip((total - t) / 0.4, 0, 1)

    voice_st = np.stack([voice, voice])
    mix = voice_st + music + chimes

    meter = pyln.Meter(SR)
    gain = db(A["targetLufs"] - meter.integrated_loudness(mix.T))
    mix *= gain
    for _ in range(3):
        if true_peak_db(mix) <= A["truePeak"] - 0.1:
            break
        mix = tp_limiter(mix, A["truePeak"] - 0.3)
        mix *= db(A["targetLufs"] - meter.integrated_loudness(mix.T))

    lufs = meter.integrated_loudness(mix.T)
    tp = true_peak_db(mix)
    (ROOT / "assets" / "audio").mkdir(parents=True, exist_ok=True)
    wavfile.write(ROOT / "assets" / "audio" / f"mix_{variant}.wav", SR, mix.T.astype(np.float32))

    stems = ROOT / "out" / "stems" / variant
    stems.mkdir(parents=True, exist_ok=True)
    for name, s in (("voz", voice_st), ("musica", music), ("chimes", chimes)):
        tmp = stems / f"{name}.tmp.wav"
        wavfile.write(tmp, SR, (s * gain).T.astype(np.float32))
        # FLAC 24-bit: sin pérdida y ~3x más ligero que WAV float
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp), "-c:a", "flac", "-sample_fmt", "s32", "-bits_per_raw_sample", "24", str(stems / f"{name}.flac")], check=True)
        tmp.unlink()

    # inteligibilidad: diferencia voz vs música mientras hay voz
    m = active > 0
    vm = 20 * np.log10(np.sqrt((voice[m] ** 2).mean()) / (np.sqrt((music[:, m] ** 2).mean()) + 1e-12))
    print(f"mix_{variant}.wav  {lufs:.2f} LUFS  TP {tp:.2f} dBTP  voz/música bajo voz: +{vm:.1f} dB")


if __name__ == "__main__":
    for v in sys.argv[1:] or list(CFG["variants"].keys()):
        build(v)
