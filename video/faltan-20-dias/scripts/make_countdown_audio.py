"""Audio de cada día de la cuenta regresiva, generado a partir de su receta.

Uso: python3 scripts/make_countdown_audio.py <dias> <salida.wav>

Lee src/countdown/recipes.json (la misma receta que usa el video) y coloca cada sonido
en el frame exacto: cortes en latido o tambor, sonidos propios de cada toma, la
revelación (marimba, swell, respiro y golpe grave) y el outro del logo.
"""
import json
import sys
from pathlib import Path

import numpy as np
from scipy.io import wavfile

import sfx
from sfx import SR, Bus, midi

FPS = 30
OUTRO = 135
# Deben coincidir con HIT en src/countdown/reveals.tsx
HIT = {'petalos': 74, 'velas': 86, 'papel': 62, 'brasas': 80, 'altar': 75}
MONTAGE = {'pan', 'vaso', 'marco', 'cruz'}
PENTA = [62, 64, 66, 69, 71, 74, 76, 78, 81, 83, 86, 88, 90, 93, 95]


def fr(f):
    return f / FPS


def build(dias):
    recipes = json.loads((Path(__file__).parent.parent / 'src/countdown/recipes.json').read_text())
    r = recipes[str(dias)]
    shots = r['shots']
    rev = r['revelacion']
    rev_at = sum(s['dur'] for s in shots)
    out_at = rev_at + rev['dur']
    total = out_at + OUTRO
    dur = total / FPS
    bus = Bus(dur)
    n = bus.n
    t = np.arange(n) / SR
    rng = np.random.default_rng(dias * 101)
    hit = rev_at + HIT[rev['estilo']]

    # ---------- cama: drone + viento con "respiro" antes del golpe ----------
    duck = np.clip(t / 1.5, 0, 1) ** 1.5
    b0, b1 = int(fr(hit - 5) * SR), int(fr(hit) * SR)
    duck[b0:b1] *= np.linspace(1, 0.08, b1 - b0) ** 2
    duck[b1:] *= 0.08 + 0.5 * (1 - np.exp(-(t[b1:] - fr(hit)) / 0.8))
    o0, o1 = int(fr(out_at - 6) * SR), int((fr(out_at) + 0.4) * SR)
    duck[o0:o1] *= np.linspace(1, 0.35, o1 - o0)
    duck[o1:] *= 0.35 + 0.25 * np.clip((t[o1:] - fr(out_at) - 0.4) / 1.5, 0, 1)
    build_up = 0.6 + 0.4 * np.clip(t / max(fr(hit), 1), 0, 1)
    dr = sfx.drone_bed(n, 3 + dias) * 0.17 * duck * build_up
    wi = sfx.wind_bed(n, 40 + dias) * 0.55 * duck
    bus.dry += np.stack([dr, dr]) + wi

    # ---------- tomas ----------
    beats = []
    at = 0
    for k, s in enumerate(shots):
        st = fr(at)
        tipo = s['tipo']
        off = s.get('off', 0)
        if tipo in MONTAGE:
            bus.place(sfx.drum(k + dias), st, 1.1)
            bus.place(sfx.wood(1100 + 70 * (k % 4)), st + 0.004, 0.11, (-0.3, 0.3, -0.15, 0.15)[k % 4], wet=0.5)
        elif k > 0:
            beats.append(st)
        if tipo == 'ignicion' and off == 0:
            bus.place(sfx.strike(k), st + fr(6) - 0.06, 0.5, -0.1)
            bus.place(sfx.ignite(k + 1), st + fr(8) - 0.03, 0.8, wet=0.15)
        elif tipo == 'llama':
            bus.place(sfx.ignite(k + 7), st, 0.45, wet=0.2)
            bus.place(sfx.fire(fr(s['dur']) + 0.3, 70 + k) * np.linspace(0.6, 1, int((fr(s['dur']) + 0.3) * SR)), st, 0.18)
        elif tipo in ('papel', 'contrapicado'):
            bus.place(sfx.rustle(80 + k), st + 0.05, 0.12, 0.25)
            bus.place(sfx.rustle(90 + k)[::-1], st + 0.4, 0.08, -0.35)
        elif tipo == 'calavera':
            eye = fr(54 - off)
            if 0 <= eye < fr(s['dur']):
                bus.place(sfx.bell(880), st + eye, 0.07, 0.2, wet=1.7)
                bus.reverb_only(sfx.bell(1318.5), st + eye + 0.12, 0.06)
        elif tipo in ('camino', 'copal'):
            bus.place(sfx.air(100 + k, 2.2), st - 0.1, 0.05 if tipo == 'camino' else 0.09, -0.3, wet=0.4)
        elif tipo == 'altar':
            for i in range(1, 12):
                ct = 4 + 5 * i
                if ct < s['dur']:
                    bus.place(sfx.marimba(midi(PENTA[i - 1])), st + fr(ct), 0.2 + 0.01 * i, -0.5 + i / 11, wet=0.5)
        at += s['dur']

    # latidos: en cada corte y rellenando huecos, cada vez más seguidos hacia la revelación
    beats.append(fr(rev_at))
    filled = []
    last = 0.6
    for b in sorted(beats):
        while b - last > 1.15:
            last += max(0.78, 1.0 - 0.02 * len(filled))
            filled.append(last)
        filled.append(b)
        last = b
    for k, b in enumerate(filled):
        if b >= fr(rev_at) + 0.01:
            continue
        g = 0.5 + 0.35 * min(1, b / max(fr(rev_at), 1))
        bus.place(sfx.heartbeat(), b, 1.25 * g)

    # ---------- revelación ----------
    rs = fr(rev_at)
    est = rev['estilo']
    bus.place(sfx.drum(dias, 1.2), rs, 1.0, wet=0.1)
    swell = sfx.strings([midi(50), midi(57), midi(62), midi(66)], fr(hit - rev_at - 4) + 0.1, lambda u: u ** 2.2, 380, 2400, release=0.09, seed=dias)
    bus.place2(swell, rs, 0.3, wet=0.5)
    if est == 'petalos':
        bus.place(sfx.air(200 + dias, 1.8, (500, 1400), (1400, 5000)), rs, 0.14, 0.15, wet=0.5)
        for k in range(9):
            bus.place(sfx.bell(midi(PENTA[4 + (k * 3) % 10])), rs + fr(14 + k * 6), 0.03, rng.uniform(-0.5, 0.5), wet=2.5)
    elif est == 'velas':
        for k in range(15):
            bus.place(sfx.marimba(midi(PENTA[k])), rs + fr(10 + 5 * k), 0.17 + 0.006 * k, -0.6 + k / 12, wet=0.5)
    elif est == 'papel':
        bus.place(sfx.rustle(300 + dias, 1.2), rs + 0.05, 0.16, 0.0)
        bus.place(sfx.air(310 + dias, 1.0, (200, 600), (600, 1800)), fr(hit) - 0.6, 0.1, wet=0.4)
    elif est == 'brasas':
        ln = fr(HIT['brasas']) + 0.8
        e = np.minimum(1, np.arange(int(ln * SR)) / (0.6 * SR))
        bus.place(sfx.fire(ln, 400 + dias) * e, rs, 0.32, -0.1, wet=0.15)
        bus.place(sfx.air(410 + dias, 2.4), rs, 0.1, 0.2, wet=0.3)
    elif est == 'altar':
        bus.place(sfx.marimba(midi(50), 2.2), rs, 0.35, wet=0.45)
        for i in range(1, 12):
            bus.place(sfx.marimba(midi(PENTA[i - 1])), rs + fr(4 + 5 * i), 0.2 + 0.01 * i, -0.5 + i / 11, wet=0.5)
    bus.place(sfx.boom(dias), fr(hit), 0.95, wet=0.37)
    bus.reverb_only(sfx.bell(587.33, 3.0), fr(hit) + 0.02, 0.1)
    chord = sfx.strings([midi(50), midi(57), midi(64), midi(66), midi(74)], fr(out_at - hit) + 0.25, lambda u: np.minimum(1, u * 8) * (1 - 0.35 * u), 600, 1500, release=0.45, seed=9)
    bus.place2(chord, fr(hit), 0.11, wet=0.7)

    # ---------- outro del logo (mismos eventos que el teaser del día 20) ----------
    O = fr(out_at)
    burn0, burn1, diss0, diss1 = O + fr(8), O + fr(48), O + fr(92), O + fr(126)
    m = int(0.16 * SR)
    bus.place(sfx.bp(sfx.noise(m, 5), 2000, 7000) * sfx.env(m, 0.008, 0.04), O + fr(5), 0.35)
    m = int(1.4 * SR)
    i = np.arange(m) / SR
    bus.place(sfx.lp(sfx.noise(m, 6), 700) * np.minimum(1, i / 0.12) * np.exp(-i / 0.5), burn0 - 0.05, 0.9, wet=0.22)
    bus.place(sfx.thump(110, 55, 0.8, 0.2), burn0, 0.7)
    ln = diss1 - burn0 + 0.6
    m = int(ln * SR)
    i = np.arange(m) / SR
    g_env = np.clip(i / (burn1 - burn0), 0, 1) ** 0.8 * (1 - np.clip((i - (diss0 - burn0)) / (diss1 - diss0), 0, 1)) ** 1.5
    fz = sfx.fire(ln, 91) * g_env
    bus.place(fz, burn0, 0.42, -0.1)
    bus.place(np.roll(fz, 9000), burn0, 0.3, 0.25)
    pad = sfx.strings([midi(50), midi(57), midi(62), midi(66)], diss1 - burn0, lambda u: np.minimum(1, u * 4) * (1 - np.clip((u - 0.62) / 0.38, 0, 1)) ** 1.5, 500, 1100, release=0.3, seed=21)
    bus.place2(pad, burn0, 0.12, wet=0.8)
    for k, (mm, dt) in enumerate([(74, 0.0), (78, 0.16), (81, 0.32), (86, 0.56)]):
        bus.place(sfx.marimba(midi(mm), 1.8), burn1 + dt - 0.05, 0.2, (-0.3, -0.1, 0.1, 0.3)[k], wet=0.6)
    bus.place(sfx.air(500, 1.8, (500, 1400), (1400, 5000)), diss0 - 0.1, 0.22, 0.15, wet=0.45)
    bus.reverb_only(sfx.bell(1174.66, 2.4), diss0 + 0.25, 0.08)
    bus.reverb_only(sfx.bell(1760.0, 2.0), diss0 + 0.45, 0.05)

    mix, lufs = sfx.master(bus, fade=(fr(total - 6), fr(total)))
    return mix, lufs, total


if __name__ == '__main__':
    dias = int(sys.argv[1])
    out = sys.argv[2]
    mix, lufs, total = build(dias)
    wavfile.write(out, SR, (np.clip(mix, -1, 1).T * 32767).astype(np.int16))
    print(json.dumps({'dias': dias, 'frames': total, 'segundos': round(total / FPS, 3), 'lufs': round(lufs, 2), 'out': out}))
