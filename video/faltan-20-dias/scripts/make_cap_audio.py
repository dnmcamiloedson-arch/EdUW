"""Música y diseño sonoro de cada capítulo (temporada 2).

Uso: python3 scripts/make_cap_audio.py <dias> <salida.wav>

Cada capítulo tiene su propia partitura (instrumentos, tonalidad y tempo distintos),
sincronizada con los tiempos de sus escenas (en segundos, iguales a src/cap/cXX.tsx).
"""
import json
import sys

import numpy as np
from scipy.io import wavfile

import music as M
import sfx
from sfx import SR, Bus, midi

FPS = 30
OUTRO = 135


def fr(f):
    return f / FPS


def bed(bus, dur, drone=0.1, wind=0.4, seed=1):
    n = bus.n
    t = np.arange(n) / SR
    e = np.clip(t / 1.5, 0, 1)
    d = sfx.drone_bed(n, seed) * drone * e
    bus.dry += np.stack([d, d]) + sfx.wind_bed(n, seed + 40) * wind * e


# ---------------------------------------------------------------- 16 · El sol hecho flor
def cap16(bus):
    S1, S2, S3, REV, HIT = 120, 108, 72, 120, 50
    a, b, c = fr(S1), fr(S1 + S2), fr(S1 + S2 + S3)
    hit = c + fr(HIT)
    bed(bus, 0, drone=0.07, wind=0.35, seed=16)
    # amanecer: pájaros
    for k, (tt, pan) in enumerate([(0.7, -0.5), (1.8, 0.4), (2.6, -0.2), (3.3, 0.6), (5.0, -0.6)]):
        bus.place(M.chirp(160 + k, 2 + k % 3), tt, 0.06, pan, wet=0.6)
    # flauta de carrizo, Re dórico
    phrase = [(0.5, 62, 0.95), (1.45, 65, 0.5), (1.95, 67, 0.5), (2.45, 69, 1.4), (a + 0.15, 72, 0.6), (a + 0.75, 71, 0.4), (a + 1.15, 69, 0.6), (a + 1.75, 67, 0.4), (a + 2.15, 69, 1.3)]
    for k, (tt, m, d) in enumerate(phrase):
        bus.place(M.flute(midi(m), d, 0.9, seed=k), tt, 0.19, -0.1, wet=0.9)
    # latido de huéhuetl
    for tt in [a, a + 0.9, a + 1.8, a + 2.7, b, b + 0.7, b + 1.4, b + 2.0]:
        bus.place(M.huehuetl(0.8, seed=int(tt * 10)), tt, 0.55, wet=0.2)
    # teponaztli y sonaja con el colibrí
    for k in range(8):
        tt = b + 0.35 + k * 0.25
        bus.place(M.teponaztli(330 if k % 2 == 0 else 440, 0.6, seed=k), tt, 0.18, (-0.3, 0.3)[k % 2], wet=0.3)
        bus.place(M.sonaja(0.7, seed=k), tt + 0.125, 0.1, 0.4)
    bus.place(M.buzz(fr(S3) + 0.2, 7), b, 0.16, 0.3)
    bus.place(M.buzz(fr(HIT) + 0.2, 8), c, 0.16, 0.0)
    # vuelo que escribe el número: escala ascendente
    run = [62, 64, 65, 67, 69, 72, 74, 76, 77]
    for k, m in enumerate(run):
        bus.place(M.flute(midi(m), 0.22, 0.8, seed=30 + k), c + 0.05 + k * fr(HIT) / len(run) * 0.95, 0.24, -0.4 + k * 0.1, wet=0.8)
    # llegada
    bus.place(M.huehuetl(1.2, 0.9, seed=99), hit, 0.9, wet=0.3)
    bus.place(sfx.boom(16), hit, 0.85, wet=0.35)
    for k, m in enumerate([62, 69, 74, 77, 81]):
        bus.place(sfx.marimba(midi(m), 2.0), hit + k * 0.045, 0.3, -0.4 + k * 0.2, wet=0.6)
    bus.place2(np.stack([M.choir([50, 57, 62, 65, 69], fr(REV - HIT) + 0.6, 'a', seed=16)] * 2), hit, 0.16, wet=0.8)
    bus.reverb_only(sfx.bell(1174.66, 2.6), hit + 0.05, 0.1)
    return c + fr(REV)


# ---------------------------------------------------------------- 15 · El barco en el muro (San Juan de Ulúa)
def olas(dur, seed=0, period=5.5):
    """Oleaje: rumor grave que crece con cada ola y espuma que rompe."""
    n = int(dur * SR)
    base = sfx.hp(sfx.lp(sfx.pink(n, seed), 700), 90)
    wash = sfx.bp(sfx.pink(n, seed + 1), 900, 5000)
    r = np.random.default_rng(seed + 2)
    eb = np.zeros(n)
    ew = np.zeros(n)
    tt = r.uniform(0, 1.2)
    while tt < dur:
        P = period * r.uniform(0.75, 1.25)
        i0 = int(tt * SR)
        k = np.arange(min(int(P * 1.6 * SR), n - i0)) / SR
        crest = P * 0.55
        eb[i0 : i0 + len(k)] += np.clip(k / crest, 0, 1) ** 2 * np.exp(-np.clip(k - crest, 0, None) / (P * 0.28)) * r.uniform(0.6, 1.0)
        ew[i0 : i0 + len(k)] += (k > crest) * np.exp(-np.clip(k - crest, 0, None) / (P * 0.14)) * r.uniform(0.5, 1.0)
        tt += P
    out = base * (0.35 + 0.65 * eb) + wash * ew * 0.5
    return out / (np.max(np.abs(out)) + 1e-9)


def gota(seed=0):
    n = int(0.18 * SR)
    t = np.arange(n) / SR
    f0 = np.random.default_rng(seed).uniform(900, 1300)
    ph = 2 * np.pi * np.cumsum(f0 * (1 + 1.8 * np.clip(t / 0.03, 0, 1))) / SR
    return np.sin(ph) * np.exp(-t / 0.025) * np.minimum(1, t / 0.001)


def carbon(dur, seed=0):
    """Carbón sobre cal: grano áspero en trazos cortos con levantadas de mano."""
    n = int(dur * SR)
    r = np.random.default_rng(seed)
    grit = sfx.bp(sfx.noise(n, seed), 1800, 7500)
    gran = np.abs(sfx.smooth_noise(n, 45.0, seed + 1))
    low = sfx.bp(sfx.noise(n, seed + 2), 300, 1200) * 0.3
    e = np.zeros(n)
    tt = 0.0
    while tt < dur:
        L = r.uniform(0.12, 0.55)
        i0 = int(tt * SR)
        i1 = min(n, int((tt + L) * SR))
        k = np.arange(i1 - i0) / SR
        e[i0:i1] = np.sin(np.pi * k / L) ** 0.6 * r.uniform(0.6, 1.0)
        tt += L + r.uniform(0.03, 0.12)
    out = (grit * (0.4 + 0.6 * gran / (np.max(gran) + 1e-9)) + low) * e
    return out / (np.max(np.abs(out)) + 1e-9)


def bota(seed=0):
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    heel = sfx.thump(180, 90, 0.25, 0.05) * 0.8
    click = sfx.bp(sfx.noise(n, seed), 1500, 6000) * np.exp(-t / 0.008) * 0.6
    scuff = sfx.bp(sfx.noise(n, seed + 1), 600, 3000) * np.exp(-np.clip(t - 0.04, 0, None) / 0.05) * (t > 0.03) * 0.25
    return heel + click + scuff


def llaves(dur, seed=0):
    n = int(dur * SR)
    out = np.zeros(n)
    r = np.random.default_rng(seed)
    m = int(0.08 * SR)
    k = np.arange(m) / SR
    for _ in range(int(dur * 28)):
        at = int(r.uniform(0, dur - 0.09) * SR)
        f = r.uniform(3200, 7000)
        out[at : at + m] += sum(a * np.sin(2 * np.pi * f * rr * k) * np.exp(-k / tau) for rr, a, tau in [(1, 1, 0.02), (1.47, 0.6, 0.012), (2.09, 0.4, 0.008)]) * r.uniform(0.2, 1.0)
    return out * np.sin(np.pi * np.linspace(0, 1, n)) ** 0.5


def crujido(dur, seed=0):
    """Madera del casco que cruje (stick-slip grave)."""
    n = int(dur * SR)
    out = np.zeros(n)
    rng = np.random.default_rng(seed)
    tt = 0.0
    while tt < dur - 0.02:
        out[int(tt * SR)] += rng.uniform(0.5, 1.0)
        tt += 1 / (30 + 60 * np.sin(np.pi * tt / dur)) * rng.uniform(0.85, 1.15)
    k = np.arange(int(0.05 * SR)) / SR
    ping = np.sin(2 * np.pi * 190 * k) * np.exp(-k / 0.012) + 0.6 * np.sin(2 * np.pi * 430 * k) * np.exp(-k / 0.007) + 0.3 * np.sin(2 * np.pi * 1020 * k) * np.exp(-k / 0.004)
    out = np.convolve(out, ping)[:n]
    return sfx.bp(out, 120, 1600) * np.sin(np.pi * np.linspace(0, 1, n)) ** 0.7


def flap(dur, seed=0):
    """Velas que se hinchan y flamean."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    nz = sfx.bp(sfx.pink(n, seed), 150, 2200)
    ph = 2 * np.pi * np.cumsum(5.5 + 2 * np.sin(2 * np.pi * 0.7 * t)) / SR
    return nz * (0.25 + np.clip(np.sin(ph), 0, None) ** 3) * np.sin(np.pi * np.linspace(0, 1, n)) ** 0.5


def gaviota(seed=0, calls=2):
    r = np.random.default_rng(seed)
    parts = []
    for _ in range(calls):
        d = r.uniform(0.28, 0.4)
        k = np.arange(int(d * SR)) / SR
        u = k / d
        f = (1500 - 650 * u + 250 * np.sin(np.pi * u)) * r.uniform(0.92, 1.08)
        ph = 2 * np.pi * np.cumsum(f) / SR
        sig = sum(np.sin(h * ph) / h**1.2 for h in range(1, 7))
        parts.append(sfx.bp(sig, 900, 5000) * np.sin(np.pi * u) ** 0.6 * (1 + 0.3 * np.sin(2 * np.pi * 28 * k)))
        parts.append(np.zeros(int(r.uniform(0.08, 0.16) * SR)))
    return np.concatenate(parts)


# habanera en Re menor, 74 bpm, compás de 2/4: bajo "dum — da dum dum"
HAB_BEAT = 60 / 74
HAB_BAR = 2 * HAB_BEAT
HAB_BASS = {'Dm': (38, 45, 41, 50), 'A7': (45, 40, 49, 45), 'Gm': (43, 50, 46, 43), 'Bb': (46, 53, 50, 46)}
HAB_CHORD = {'Dm': [50, 57, 62, 65], 'A7': [45, 52, 55, 61], 'Gm': [43, 50, 55, 58], 'Bb': [46, 53, 58, 62]}
# tema (compás, tiempo, nota, duración en tiempos) sobre Dm | A7 | A7 | Dm
HAB_TEMA = [
    (0, 0, 69, 0.75), (0, 0.75, 70, 0.25), (0, 1, 69, 0.5), (0, 1.5, 67, 0.5),
    (1, 0, 65, 0.75), (1, 0.75, 67, 0.25), (1, 1, 64, 1.0),
    (2, 0, 73, 0.75), (2, 0.75, 74, 0.25), (2, 1, 76, 0.5), (2, 1.5, 73, 0.5),
    (3, 0, 74, 1.5), (3, 1.5, 69, 0.5),
]


def habanera(bus, t0, chords, gain=0.3, strum_gain=0.0, seed=0):
    for b, ch in enumerate(chords):
        tb = t0 + b * HAB_BAR
        for k, (bt, d) in enumerate([(0, 0.75), (0.75, 0.25), (1, 0.5), (1.5, 0.5)]):
            m = HAB_BASS[ch][k]
            bus.place(M.pluck(midi(m), d * HAB_BEAT + 0.35, bright=0.35, decay=0.997, vel=(1.0, 0.7, 0.85, 0.75)[k], seed=seed + b * 4 + k), tb + bt * HAB_BEAT, gain, -0.12, wet=0.45)
        if strum_gain:
            bus.place(M.strum(HAB_CHORD[ch], HAB_BEAT * 0.9, bright=0.45, vel=0.7, seed=seed + 50 + b), tb + HAB_BEAT, strum_gain, 0.18, wet=0.5)


def tema(bus, t0, bars, gain=0.18, inst='flute', pan=0.05, wet=0.9, seed=0, fade_from=None):
    for k, (b, bt, m, d) in enumerate(HAB_TEMA):
        if b not in bars:
            continue
        tt = t0 + (b - bars[0]) * HAB_BAR + bt * HAB_BEAT
        g = gain * (1.0 if fade_from is None or tt < fade_from else max(0.0, 1 - (tt - fade_from) / 1.2))
        if g <= 0:
            continue
        if inst == 'flute':
            sig = M.flute(midi(m), d * HAB_BEAT * 0.98, 0.9, seed=seed + k)
        elif inst == 'harp':
            sig = M.pluck(midi(m + 12), d * HAB_BEAT + 1.2, bright=0.8, decay=0.998, vel=0.9, seed=seed + k)
        else:
            sig = M.musicbox(midi(m + 12), d * HAB_BEAT + 1.0, 0.8)
        bus.place(sig, tt, g, pan, wet=wet)


def cap15(bus):
    S1, S2, S3, S4, S5, REV, HIT = 120, 96, 225, 165, 135, 150, 74
    T3, T4, T5 = S2, S2 + S3, S2 + S3 + S4
    cl = lambda f: fr(S1 + f)  # noqa: E731  (frames locales de la celda)
    rev = cl(T5 + S5)
    hit = rev + fr(HIT)
    ext = cl(T4 + 104)  # el muro se abre al mar
    bed(bus, 0, drone=0.08, wind=0.3, seed=15)
    # --- S1 · el mar frente a Ulúa, la campana del fuerte y una guitarra lejana ---
    sea = olas(rev + fr(REV) + 0.5, 151)
    sea2 = olas(rev + fr(REV) + 0.5, 152, period=6.4)
    n = len(sea)
    t = np.arange(n) / SR
    open_ = np.clip((t - ext) / 1.2, 0, 1)
    inside = (t >= fr(S1) - 0.3) & (t < ext + 1.2)
    lvl = np.where(t < fr(S1), np.clip(t / 1.0, 0, 1), np.where(inside, 0.35 + 0.65 * open_, 1.0))
    muff = sfx.lp(sea, 450)
    mix_sea = np.where(t < fr(S1) - 0.3, sea, muff * (1 - open_) + sea * open_)
    mix_sea2 = np.where(t < fr(S1) - 0.3, sea2, sfx.lp(sea2, 450) * (1 - open_) + sea2 * open_)
    fade_rev = (1 - np.clip((t - (rev - 0.6)) / 0.6, 0, 1) * 0.7) * (1 - np.clip((t - (rev + fr(REV) - 1.0)) / 1.2, 0, 1))
    bus.place(mix_sea * lvl * fade_rev, 0, 0.3, -0.35)
    bus.place(mix_sea2 * lvl * fade_rev, 0, 0.26, 0.35)
    for tt in (0.55, 2.85):
        bus.place(sfx.bell(196.0, 4.0), tt, 0.07, 0.3, wet=1.0)
        bus.reverb_only(sfx.bell(196.0, 4.0), tt, 0.1, 0.3)
    for k, (tt, m) in enumerate([(1.0, 50), (1.28, 57), (1.56, 62), (1.84, 64), (2.12, 65), (2.62, 69), (3.2, 62)]):
        bus.place(M.pluck(midi(m), 3.0, bright=0.5, decay=0.998, vel=0.85, seed=150 + k), tt, 0.15, -0.15 + 0.05 * k, wet=0.7)
    bus.place2(np.stack([M.choir([50, 57, 62, 65], fr(S1) + 0.6, 'u', seed=15, attack=1.4)] * 2), 0.3, 0.05, wet=0.9)
    # --- S2 · la celda: gotas, la vela y la habanera que entra con el bajo ---
    bus.place(sfx.fire(ext - fr(S1) + 1.0, 153) * np.linspace(1, 0.4, int((ext - fr(S1) + 1.0) * SR)), fr(S1), 0.045, -0.2)
    for k, tt in enumerate([cl(14), cl(66), cl(160), cl(250)]):
        bus.place(gota(k), tt, 0.09, (-0.4, 0.3, -0.2, 0.4)[k], wet=1.4)
    t0 = cl(13)
    habanera(bus, t0, ['Dm', 'A7', 'Dm', 'A7', 'A7'], gain=0.26, seed=200)
    # el carbón: lo toma del piso y sube al muro
    bus.place(sfx.wood(1700), cl(40), 0.12, 0.1, wet=0.6)
    bus.place(sfx.air(155, fr(52) + 0.2, (500, 1400), (1400, 5200)), cl(40), 0.05, 0.0, wet=0.8)
    # --- S3 · dibuja el barco (el carbón rasga mientras suena el tema) ---
    d0, d1 = cl(T3 + 6), cl(T3 + 150)
    bus.place(carbon(d1 - d0, 157), d0, 0.2, -0.05, wet=0.35)
    tema(bus, t0 + 2 * HAB_BAR, [0, 1, 2], gain=0.17, seed=210, fade_from=cl(T3 + 120))
    # el guardia: pasos, llaves y una cuerda grave que tensa
    for k, tt in enumerate([cl(T3 + 102), cl(T3 + 114), cl(T3 + 126), cl(T3 + 137)]):
        bus.place(bota(160 + k), tt, 0.16 + 0.05 * k, 0.55, wet=0.5)
    bus.place(llaves(0.7, 161), cl(T3 + 134), 0.05, 0.6, wet=0.6)
    tens = sfx.strings([midi(38), midi(45)], cl(T3 + 190) - cl(T3 + 136), lambda u: np.minimum(1, u * 2.5) * (0.7 + 0.3 * u), 300, 700, release=0.25, seed=162)
    bus.place2(tens, cl(T3 + 136), 0.09, wet=0.7)
    # "—Que navegue.": glissando de arpa y coro que se abre
    qn = cl(T3 + 190)
    for k, m in enumerate([62, 64, 65, 67, 69, 70, 73, 74, 76, 77, 79, 81, 82, 85, 86]):
        bus.place(M.pluck(midi(m), 2.4, bright=0.8, decay=0.998, vel=0.8, seed=170 + k), qn + k * 0.036, 0.1, -0.5 + k * 0.07, wet=1.0)
    bus.place2(np.stack([M.choir([50, 57, 62, 65, 69], 2.8, 'a', seed=171, attack=0.5)] * 2), qn + 0.05, 0.11, wet=1.0)
    bus.reverb_only(sfx.bell(1174.66, 2.4), qn + 0.5, 0.05)
    # el guardia se va; ella suelta el carbón
    for k, tt in enumerate([cl(T4 + 8), cl(T4 + 20), cl(T4 + 32), cl(T4 + 44)]):
        bus.place(bota(180 + k), tt, 0.2 - 0.04 * k, 0.6 + 0.1 * k, wet=0.6)
    bus.place(sfx.wood(1900), cl(T4 + 54), 0.1, -0.3, wet=0.5)
    bus.place(sfx.wood(2300), cl(T4 + 58), 0.04, -0.3, wet=0.5)
    t1 = cl(T4 + 26)
    habanera(bus, t1, ['Dm', 'Bb', 'A7'], gain=0.2, seed=230)
    # --- S4 · el dibujo cobra vida: destellos, madera que cruje, velas, cuerdas ---
    alive = cl(T4 + 70)
    sc = M.scale(62, 'penta_m')
    for k in range(12):
        bus.place(M.musicbox(midi(sc(k % 8 + 3)), 1.4, 0.7), alive + k * 0.1, 0.06, -0.5 + 0.09 * k, wet=1.2)
    bus.place(olas(2.4, 158, period=1.6) * 0.6, alive + 0.1, 0.1, 0.0)
    bus.place(crujido(0.9, 163), alive + 0.3, 0.1, -0.2, wet=0.5)
    bus.place(crujido(0.7, 164), alive + 1.25, 0.08, 0.25, wet=0.5)
    bus.place(flap(1.5, 165), alive + 0.55, 0.07, 0.15, wet=0.4)
    swell = sfx.strings([midi(50), midi(53), midi(57), midi(62)], ext + 2.4 - cl(T4 + 95), lambda u: np.minimum(1, u * 1.6) ** 1.5 * (1 - np.clip((u - 0.8) / 0.2, 0, 1)), 500, 1600, release=0.3, seed=166)
    bus.place2(swell, cl(T4 + 95), 0.1, wet=0.8)
    # el muro arde y se abre: brasas, chispas y soplo
    burn0, burn1 = cl(T4 + 112), cl(T4 + 165)
    ln = burn1 - burn0 + 0.8
    kk = np.arange(int(ln * SR)) / SR
    bus.place(sfx.fire(ln, 167) * np.clip(kk / 0.4, 0, 1) * np.clip((ln - kk) / 0.9, 0, 1), burn0, 0.24, -0.1, wet=0.3)
    bus.place(whoosh(burn1 - burn0, 250, 5000, seed=168), burn0, 0.14, 0.1, wet=0.6)
    bus.place(sfx.thump(120, 60, 0.9, 0.18), burn0, 0.25, wet=0.4)
    for k in range(9):
        bus.place(sfx.strike(170 + k), burn0 + 0.15 + k * 0.17, 0.05, -0.4 + 0.1 * k, wet=0.5)
    # --- S5 · zarpa: la habanera completa con arpa, flauta y coro ---
    t2 = t1 + 3 * HAB_BAR  # sigue en el mismo pulso que la habanera de S4
    habanera(bus, t2, ['Dm', 'A7', 'A7', 'Dm'], gain=0.28, strum_gain=0.09, seed=240)
    tema(bus, t2, [0, 1, 2], gain=0.17, seed=250, fade_from=rev - 1.2)
    tema(bus, t2, [0, 1, 2], gain=0.07, inst='harp', pan=-0.25, wet=1.1, seed=260, fade_from=rev - 1.2)
    bus.place2(np.stack([M.choir([50, 57, 62, 65], rev - t2 + 0.4, 'a', seed=172, attack=0.8)] * 2), t2, 0.07, wet=1.0)
    bus.place(crujido(1.0, 173), t2 + 0.6, 0.07, 0.3, wet=0.5)
    bus.place(flap(2.0, 174), t2 + 1.8, 0.05, -0.2, wet=0.4)
    # --- REV · amanecer: gaviotas, cajita con el tema y el número que se enciende ---
    bus.place(gaviota(181, 2), rev + 0.4, 0.06, -0.4, wet=1.0)
    bus.place(gaviota(182, 3), rev + 1.25, 0.045, 0.5, wet=1.1)
    bus.place(gaviota(183, 1), hit + 0.7, 0.04, -0.2, wet=1.2)
    tema(bus, rev + 0.45, [0], gain=0.1, inst='box', pan=0.0, wet=1.3, seed=270)
    ig = hit - fr(26)
    ln = hit - ig + 0.9
    kk = np.arange(int(ln * SR)) / SR
    bus.place(sfx.fire(ln, 184) * np.clip(kk / (hit - ig), 0, 1) ** 1.5 * np.exp(-np.clip(kk - (hit - ig), 0, None) / 0.3), ig, 0.2, 0.0, wet=0.4)
    bus.place(sfx.ignite(185), ig + 0.05, 0.25, wet=0.4)
    bus.place(sfx.boom(15), hit, 0.8, wet=0.35)
    bus.place(M.strum([50, 57, 62, 66, 69, 74], 2.6, bright=0.6, vel=0.9, seed=186), hit, 0.28, 0.1, wet=0.6)
    for k, m in enumerate([62, 66, 69, 74, 78]):
        bus.place(M.pluck(midi(m + 12), 2.2, bright=0.8, decay=0.998, vel=0.8, seed=190 + k), hit + 0.08 + k * 0.07, 0.11, -0.4 + 0.2 * k, wet=1.0)
    bus.place2(np.stack([M.choir([50, 57, 62, 66, 69], fr(REV - HIT) + 0.6, 'a', seed=187, attack=0.2)] * 2), hit, 0.16, wet=0.9)
    bus.reverb_only(sfx.bell(1174.66, 2.6), hit + 0.05, 0.1)
    return rev + fr(REV)


# ---------------------------------------------------------------- 14 · Xólotl
def cap14(bus):
    S1, S2, S3, REV, HIT = 126, 96, 72, 126, 64
    a, b, c = fr(S1), fr(S1 + S2), fr(S1 + S2 + S3)
    hit = c + fr(HIT)
    bed(bus, 0, drone=0.06, wind=0.25, seed=14)
    rv = M.river(c + 0.5, 14)
    bus.place(rv, 0, 0.2, -0.2)
    bus.place(np.roll(rv, 20000), 0, 0.16, 0.3)
    # pasos del perro: teponaztli a ritmo de caminata
    for k in range(int(a / 0.33)):
        bus.place(M.teponaztli(260 if k % 2 == 0 else 196, 0.55, seed=k), 0.2 + k * 0.33, 0.12, -0.6 + 1.2 * (k * 0.33) / a, wet=0.3)
    # melodía de marimba grave, Mi menor pentatónica
    sc = M.scale(52, 'penta_m')
    mel = [(0.4, 0), (1.0, 2), (1.3, 3), (1.9, 4), (2.8, 3), (3.4, 2), (a + 0.1, 4), (a + 0.6, 5), (a + 1.0, 4), (a + 1.6, 2), (a + 2.2, 3)]
    for k, (tt, d) in enumerate(mel):
        bus.place(sfx.marimba(midi(sc(d)), 1.6, seed=k), tt, 0.24, -0.2 + 0.1 * (k % 4), wet=0.7)
    bus.place2(np.stack([M.choir([40, 47, 52, 55], c + 0.6, 'u', seed=14, attack=1.2)] * 2), 0.3, 0.1, wet=0.9)
    # la mirada: flauta grave y una nota sostenida
    bus.place(M.flute(midi(59), 1.6, 0.9, seed=3), b + 0.6, 0.18, 0.2, wet=1.0)
    bus.place(M.flute(midi(62), 1.0, 0.8, seed=4), b + 1.5, 0.15, 0.2, wet=1.0)
    # las almas se acomodan: gotas brillantes ascendentes
    sc2 = M.scale(64, 'penta_m')
    for k in range(16):
        bus.place(M.musicbox(midi(sc2(k % 9)), 1.0, 0.7), c + 0.35 + k * fr(HIT) / 18, 0.09, -0.6 + 0.08 * k, wet=1.2)
    bus.place(sfx.air(141, fr(HIT) + 0.3, (300, 900), (900, 3200)), c, 0.07, wet=0.5)
    # llegada
    bus.place(M.huehuetl(1.2, 0.9, seed=41), hit, 0.9, wet=0.3)
    bus.place(sfx.boom(14), hit, 0.85, wet=0.35)
    for k, m in enumerate([52, 59, 64, 66, 71]):
        bus.place(sfx.marimba(midi(m), 2.2), hit + k * 0.05, 0.28, -0.4 + k * 0.2, wet=0.6)
    bus.place2(np.stack([M.choir([40, 52, 55, 59, 66], fr(REV - HIT) + 0.6, 'a', seed=41, attack=0.2)] * 2), hit, 0.17, wet=0.9)
    return c + fr(REV)


# ---------------------------------------------------------------- 13 · Las monarcas
def harp(m, dur=2.2, vel=0.9, seed=0):
    return M.pluck(midi(m), dur, bright=0.75, decay=0.9975, vel=vel, seed=seed)


def cap13(bus):
    S1, S2, S3, REV, HIT = 126, 96, 78, 126, 66
    a, b, c = fr(S1), fr(S1 + S2), fr(S1 + S2 + S3)
    hit = c + fr(HIT)
    bed(bus, 0, drone=0.04, wind=0.35, seed=13)
    beat = 60 / 96
    # arpegios de arpa: G – Em – C – D
    prog = [[55, 59, 62, 67], [52, 55, 59, 64], [48, 55, 60, 64], [50, 54, 57, 62]]
    k = 0
    tt = 0.15
    while tt < c:
        ch = prog[int(tt / (beat * 4)) % 4]
        for j, m in enumerate(ch + [ch[1] + 12]):
            bus.place(harp(m, 2.0, 0.75, seed=k), tt + j * beat / 2.5, 0.16, -0.5 + j * 0.25, wet=0.6)
            k += 1
        tt += beat * 2
    # flauta, melodía sencilla
    mel = [(1.0, 74, 0.6), (1.6, 76, 0.4), (2.0, 79, 1.0), (3.2, 78, 0.5), (3.7, 74, 0.9), (a + 0.3, 71, 0.6), (a + 0.9, 74, 0.5), (a + 1.4, 76, 1.2), (b + 0.2, 79, 0.4), (b + 0.6, 81, 0.4), (b + 1.0, 83, 0.9)]
    for k, (tt, m, d) in enumerate(mel):
        bus.place(M.flute(midi(m), d, 0.85, seed=k), tt, 0.13, 0.15, wet=0.9)
    # aleteo: sonaja muy suave en el remolino
    for k in range(int(fr(S3) / (beat / 2))):
        bus.place(M.sonaja(0.5, 0.1, seed=k), b + k * beat / 2, 0.07, (-0.4, 0.4)[k % 2])
    bus.place(sfx.air(131, fr(S3) + 0.4, (600, 1800), (1800, 6000)), b, 0.08, wet=0.5)
    # glissando de arpa mientras se forma el número
    sc = M.scale(55, 'mayor')
    for k in range(22):
        bus.place(harp(sc(k), 1.6, 0.8, seed=200 + k), c + 0.2 + k * (fr(HIT) - 0.3) / 22, 0.14, -0.7 + k * 0.065, wet=0.7)
    bus.place(M.huehuetl(1.1, 1.0, seed=31), hit, 0.75, wet=0.3)
    bus.place(sfx.boom(13), hit, 0.8, wet=0.35)
    bus.place2(np.stack([M.choir([43, 55, 59, 62, 67], fr(REV - HIT) + 0.6, 'a', seed=13, attack=0.15)] * 2), hit, 0.17, wet=0.9)
    for k, m in enumerate([67, 71, 74, 79, 83]):
        bus.place(harp(m, 2.4, 0.9, seed=300 + k), hit + k * 0.035, 0.2, -0.4 + k * 0.2, wet=0.7)
    return c + fr(REV)


# ---------------------------------------------------------------- 12 · El Callejón del Beso (bolero de trío)
def cap12(bus):
    S1, S2, S3, REV, HIT = 126, 108, 66, 126, 66
    a, b, c = fr(S1), fr(S1 + S2), fr(S1 + S2 + S3)
    hit = c + fr(HIT)
    bed(bus, 0, drone=0.03, wind=0.2, seed=12)
    beat = 60 / 76
    prog = [[47, 54, 59, 62, 66], [40, 52, 55, 59, 64], [42, 54, 58, 61, 64], [47, 54, 59, 62, 66], [38, 50, 54, 57, 62], [43, 50, 55, 59, 62], [42, 54, 58, 61, 64], [47, 54, 59, 62, 66]]
    tt = 0.2
    bar = 0
    while tt < c - 0.1:
        ch = prog[bar % len(prog)]
        # guitarrón en 1 y 3
        bus.place(M.pluck(midi(ch[0] - 12 if ch[0] > 44 else ch[0]), 1.4, 0.35, 0.997, 0.9, seed=bar), tt, 0.3, -0.1, wet=0.3)
        bus.place(M.pluck(midi(ch[0] - 5), 1.2, 0.35, 0.997, 0.7, seed=bar + 50), tt + 2 * beat, 0.24, -0.1, wet=0.3)
        # guitara: rasgueo de bolero (1, 2y, 3, 4)
        for k, (off, down) in enumerate([(0, True), (1.5, False), (2, True), (3, True)]):
            bus.place(M.strum(ch[1:], 0.9, 0.012, 0.5, 0.7, down, seed=bar * 10 + k), tt + off * beat, 0.16, 0.25, wet=0.4)
        # maracas
        for k in range(8):
            bus.place(M.sonaja(0.6 if k % 2 == 0 else 0.35, 0.08, seed=bar * 20 + k), tt + k * beat / 2, 0.08, 0.5)
        tt += 4 * beat
        bar += 1
    # requinto: melodía
    mel = [(0.9, 71, 0.5), (1.4, 74, 0.5), (1.9, 78, 1.0), (3.0, 76, 0.4), (3.4, 74, 0.4), (3.8, 73, 1.0), (a + 0.2, 71, 0.6), (a + 0.8, 73, 0.4), (a + 1.2, 74, 0.8), (a + 2.4, 78, 0.5), (a + 2.9, 81, 1.2)]
    for k, (t0, m, d) in enumerate(mel):
        bus.place(M.pluck(midi(m), d + 0.8, 0.85, 0.998, 0.9, seed=400 + k), t0, 0.2, -0.25, wet=0.7)
    # el beso: la chispa
    ign = a + fr(56)
    bus.place(sfx.ignite(12), ign - 0.03, 0.4, 0.3, wet=0.3)
    bus.reverb_only(sfx.bell(1479.98, 2.0), ign, 0.08)
    # ventanas que se encienden: notas de requinto ascendentes
    sc = M.scale(62, 'mayor')
    for k in range(14):
        bus.place(M.pluck(midi(sc(k)), 1.0, 0.9, 0.997, 0.7, seed=500 + k), c + 0.3 + k * (fr(HIT) - 0.3) / 14, 0.13, -0.6 + k * 0.09, wet=0.6)
    bus.place(M.huehuetl(1.0, 1.1, seed=12), hit, 0.7, wet=0.3)
    bus.place(sfx.boom(12), hit, 0.75, wet=0.35)
    bus.place(M.strum([50, 57, 62, 66, 69, 76], 2.6, 0.03, 0.6, 1.0, True, seed=700), hit, 0.4, 0.1, wet=0.8)
    bus.place(M.pluck(midi(38), 2.4, 0.3, 0.998, 1.0, seed=701), hit, 0.35, wet=0.3)
    bus.place2(np.stack([M.choir([50, 57, 62, 66], fr(REV - HIT) + 0.5, 'o', seed=12, attack=0.3)] * 2), hit, 0.1, wet=0.9)
    return c + fr(REV)


# ---------------------------------------------------------------- 11 · La Llorona (cajita musical)
def cap11(bus):
    S1, S2, S3, REV, HIT = 126, 96, 72, 126, 60
    a, b, c = fr(S1), fr(S1 + S2), fr(S1 + S2 + S3)
    hit = c + fr(HIT)
    bed(bus, 0, drone=0.05, wind=0.5, seed=11)
    rv = M.river(c + 0.4, 11)
    bus.place(rv, 0, 0.12, -0.3)
    # cuerdas graves: Am – Am/G – F – E
    pad = sfx.strings([midi(45), midi(52), midi(57), midi(60)], a + 0.4, lambda u: np.minimum(1, u * 3), 300, 900, release=0.4, seed=111)
    bus.place2(pad, 0.1, 0.16, wet=0.8)
    pad2 = sfx.strings([midi(41), midi(48), midi(53), midi(57)], fr(S2) + 0.4, lambda u: np.ones_like(u), 300, 1000, release=0.4, seed=112)
    bus.place2(pad2, a, 0.15, wet=0.8)
    pad3 = sfx.strings([midi(40), midi(47), midi(52), midi(56)], fr(S3) + 0.4, lambda u: 1 - 0.5 * u, 400, 1400, release=0.3, seed=113)
    bus.place2(pad3, b, 0.15, wet=0.8)
    # cajita musical: vals lento en 3/4
    mel = [(0.6, 76), (1.1, 72), (1.6, 69), (2.4, 71), (2.9, 72), (3.4, 74), (a + 0.2, 72), (a + 0.7, 69), (a + 1.2, 65), (a + 2.0, 64), (a + 2.5, 65), (a + 3.0, 68), (b + 0.4, 69), (b + 0.9, 71), (b + 1.4, 72)]
    for k, (tt, m) in enumerate(mel):
        bus.place(M.musicbox(midi(m), 1.8, 0.9), tt, 0.2, -0.2 + 0.1 * (k % 4), wet=1.2)
        bus.place(M.musicbox(midi(m - 24), 1.2, 0.5), tt, 0.08, 0.2, wet=1.0)
    # coro lejano, como un lamento
    bus.place2(np.stack([M.choir([69, 72], 3.4, 'u', seed=114, attack=1.4)] * 2), 0.8, 0.07, wet=1.4)
    bus.place2(np.stack([M.choir([65, 69], 2.8, 'u', seed=115, attack=1.2)] * 2), a + 0.4, 0.07, wet=1.4)
    # viento que se lleva el rebozo
    bus.place(sfx.air(116, fr(S3) + 0.6, (300, 1000), (1000, 5000)), b - 0.1, 0.18, 0.2, wet=0.4)
    # la gota
    drop = c + fr(10)
    n = int(0.25 * SR)
    tt_ = np.arange(n) / SR
    plink = np.sin(2 * np.pi * np.cumsum(900 + 1400 * tt_ / 0.25) / SR) * np.exp(-tt_ / 0.05)
    bus.place(plink, drop, 0.35, wet=1.5)
    for k in range(10):
        bus.place(M.musicbox(midi([69, 72, 76, 79, 81, 84, 88, 81, 84, 88][k]), 1.6, 0.7), drop + 0.15 + k * 0.13, 0.1, -0.5 + k * 0.1, wet=1.3)
    bus.place(sfx.boom(11), hit, 0.7, wet=0.4)
    bus.place(M.huehuetl(0.9, 1.0, seed=111), hit, 0.55, wet=0.3)
    bus.place2(np.stack([M.choir([45, 57, 61, 64, 69], fr(REV - HIT) + 0.6, 'a', seed=116, attack=0.3)] * 2), hit, 0.15, wet=1.0)
    for k, m in enumerate([69, 73, 76, 81]):
        bus.place(M.musicbox(midi(m), 2.4, 0.9), hit + 0.04 * k, 0.16, -0.3 + 0.2 * k, wet=1.2)
    return c + fr(REV)


# ---------------------------------------------------------------- 10 · El Mictlán (reel)
def whoosh(dur, lo=300, hi=4000, seed=0, up=True):
    n = int(dur * SR)
    k = np.linspace(0, 1, n) if up else np.linspace(1, 0, n)
    nz = sfx.noise(n, seed)
    return (sfx.bp(nz, lo, lo * 3) * (1 - k) + sfx.bp(nz, hi / 3, hi) * k) * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5


def cap10(bus):
    INTRO, LEVEL, REV, HIT = 84, 40, 156, 72
    d0 = fr(INTRO)
    lv = fr(LEVEL)
    rev = d0 + 9 * lv
    hit = rev + fr(HIT)
    bed(bus, 0, drone=0.1, wind=0.3, seed=10)
    bus.place(M.caracol(midi(38), 2.4, seed=10), 0.15, 0.3, wet=1.0)
    bus.place(whoosh(1.5, 200, 3000, 1, up=False), d0 - 1.4, 0.3, wet=0.4)
    # pulso que se acelera nivel a nivel
    tt = d0
    k = 0
    while tt < rev - 0.05:
        lvl = int((tt - d0) / lv)
        bpm = 100 + lvl * 4
        step = 60 / bpm / 2
        if k % 4 == 0:
            bus.place(M.huehuetl(0.8 + 0.03 * lvl, 0.9, seed=k), tt, 0.5, wet=0.2)
        if k % 2 == 1:
            bus.place(M.sonaja(0.6, 0.1, seed=k), tt, 0.09, (-0.4, 0.4)[(k // 2) % 2])
        if k % 4 == 2:
            bus.place(M.teponaztli(220 if lvl < 8 else 294, 0.6, seed=k), tt, 0.12, 0.2, wet=0.3)
        tt += step
        k += 1
    # coro grave que sube con el descenso (Re menor) y resuelve en IX
    for i, notes in enumerate([[38, 45, 50], [38, 45, 50], [37, 45, 52], [38, 46, 50], [38, 45, 53], [40, 46, 52], [41, 48, 53], [40, 45, 52]]):
        bus.place2(np.stack([M.choir(notes, lv + 0.3, 'o', seed=100 + i, attack=0.2)] * 2), d0 + i * lv, 0.11, wet=0.9)
    # un sonido por nivel
    for i in range(9):
        t0 = d0 + i * lv
        bus.place(M.huehuetl(1.0, 0.8, seed=200 + i), t0 + lv * 0.5, 0.35, wet=0.3)
        if i == 0:
            bus.place(M.river(lv + 0.2, 101), t0, 0.14)
        elif i == 1:
            for c_ in [0.52, 0.52 + 2.09]:
                if c_ < lv:
                    bus.place(sfx.thump(90, 40, 0.8, 0.3), t0 + c_, 0.6, wet=0.3)
        elif i == 2:
            for j in range(5):
                bus.reverb_only(sfx.bell(1800 + 400 * j, 1.2), t0 + 0.1 + j * 0.2, 0.05)
        elif i == 3:
            bus.place(whoosh(lv, 500, 6000, 3), t0, 0.22, 0.3, wet=0.3)
        elif i == 4:
            bus.place(sfx.rustle(104, lv), t0, 0.14, -0.2)
        elif i == 5:
            for j in range(6):
                bus.place(whoosh(0.22, 1500, 7000, 50 + j), t0 + 0.1 + j * 0.2, 0.14, (-0.6, 0.6)[j % 2])
        elif i == 6:
            bus.place(sfx.thump(70, 35, 1.2, 0.4), t0 + 0.4, 0.45, wet=0.2)
            bus.reverb_only(sfx.bell(1318.5, 1.6), t0 + 0.7, 0.06)
        elif i == 7:
            bus.place(M.river(lv + 0.2, 107), t0, 0.12, 0.2)
        else:
            bus.place2(np.stack([M.choir([50, 57, 62, 66, 69], lv + 0.6, 'a', seed=109, attack=0.25)] * 2), t0, 0.16, wet=1.0)
            for j, m in enumerate([62, 66, 69, 74, 78]):
                bus.place(sfx.marimba(midi(m), 1.6), t0 + 0.1 + j * 0.08, 0.18, -0.4 + j * 0.2, wet=0.6)
    # la luz baja a la piedra
    sw = sfx.strings([midi(50), midi(57), midi(62), midi(66)], fr(HIT) - 0.1, lambda u: u ** 2, 300, 2200, release=0.08, seed=110)
    bus.place2(sw, rev, 0.3, wet=0.6)
    bus.place(whoosh(fr(HIT), 200, 5000, 111), rev, 0.12, wet=0.5)
    bus.place(M.huehuetl(1.4, 0.8, seed=99), hit, 1.0, wet=0.3)
    bus.place(sfx.boom(10), hit, 0.95, wet=0.4)
    bus.place(M.caracol(midi(50), 1.8, seed=11), hit + 0.05, 0.16, wet=1.0)
    bus.place2(np.stack([M.choir([38, 50, 57, 62, 66], fr(REV - HIT) + 0.6, 'a', seed=112, attack=0.15)] * 2), hit, 0.18, wet=0.9)
    for j, m in enumerate([62, 66, 69, 74]):
        bus.place(sfx.marimba(midi(m), 2.0), hit + 0.04 * j, 0.24, -0.3 + 0.2 * j, wet=0.6)
    return rev + fr(REV)


# ---------------------------------------------------------------- 9 · Papel picado (son jarocho)
def golpe_cincel(seed=0):
    n = int(0.4 * SR)
    t = np.arange(n) / SR
    wood = sfx.bp(sfx.noise(n, seed), 200, 1400) * np.exp(-t / 0.02) + np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.06)
    tink = np.sin(2 * np.pi * 2900 * t) * np.exp(-t / 0.08) * 0.35 + np.sin(2 * np.pi * 4700 * t) * np.exp(-t / 0.04) * 0.2
    return wood + tink


def cap9(bus):
    S1, S2, S3, REV, HIT = 108, 108, 78, 132, 74
    a, b, c = fr(S1), fr(S1 + S2), fr(S1 + S2 + S3)
    hit = c + fr(HIT)
    bed(bus, 0, drone=0.02, wind=0.12, seed=9)
    eighth = 60 / 132 / 2 * 1.0
    prog = [[55, 59, 62, 67], [55, 59, 62, 67], [48, 55, 60, 64], [50, 54, 57, 60]]
    # sesquiáltera: dos compases de 6/8 y uno de 3/4 (acentos 1-3-5 / 1-4)
    tt = 0.1
    k = 0
    while tt < c - 0.05:
        bar = int(k / 6)
        pos = k % 6
        ch = prog[bar % 4]
        accents = (0, 2, 4) if bar % 2 == 0 else (0, 3)
        if pos in accents:
            bus.place(M.strum(ch, 0.6, 0.008, 0.65, 0.9, pos % 2 == 0, seed=k), tt, 0.2, 0.15, wet=0.35)
            bus.place(M.tarima(0.8, seed=k), tt, 0.16, -0.2)
        else:
            bus.place(M.strum(ch[1:], 0.4, 0.006, 0.6, 0.55, False, seed=k + 500), tt, 0.12, 0.15, wet=0.3)
        if pos == 0 and bar % 2 == 1:
            bus.place(M.quijada(0.8, seed=k), tt, 0.12, -0.4, wet=0.2)
        tt += eighth
        k += 1
    # guitarra leona: bajo
    for j in range(int(c / (eighth * 6))):
        ch = prog[j % 4]
        bus.place(M.pluck(midi(ch[0] - 12), 0.9, 0.4, 0.996, 0.9, seed=900 + j), 0.1 + j * eighth * 6, 0.22, -0.1, wet=0.25)
    # golpes del cincel
    for st in [14, 34, 54, 74, 94]:
        bus.place(golpe_cincel(st), a + fr(st), 0.5, 0.05, wet=0.2)
    bus.place(sfx.rustle(91, 1.4), b + 0.1, 0.18, 0.1)
    for st in [6, 16, 26, 36, 46, 56, 66]:
        bus.place(golpe_cincel(100 + st), c + fr(st), 0.45, 0.05, wet=0.2)
    # luz detrás del papel
    sw = sfx.strings([midi(55), midi(62), midi(67), midi(71)], fr(HIT) - 0.1, lambda u: u ** 2.5, 300, 2400, release=0.08, seed=99)
    bus.place2(sw, c, 0.22, wet=0.6)
    bus.place(M.huehuetl(1.1, 1.0, seed=9), hit, 0.75, wet=0.3)
    bus.place(sfx.boom(9), hit, 0.8, wet=0.35)
    bus.place(M.strum([43, 55, 59, 62, 67, 71], 2.6, 0.02, 0.7, 1.0, True, seed=990), hit, 0.38, 0.0, wet=0.7)
    bus.place(M.quijada(1.0, seed=991), hit + 0.02, 0.14, -0.3, wet=0.3)
    bus.place2(np.stack([M.choir([43, 55, 59, 62, 67], fr(REV - HIT) + 0.5, 'a', seed=9, attack=0.2)] * 2), hit, 0.1, wet=0.8)
    return c + fr(REV)


# ---------------------------------------------------------------- 8 · Pan de muerto (vals)
def cap8(bus):
    S1, S2, S3, REV, HIT = 108, 108, 78, 126, 70
    a, b, c = fr(S1), fr(S1 + S2), fr(S1 + S2 + S3)
    hit = c + fr(HIT)
    bed(bus, 0, drone=0.02, wind=0.08, seed=8)
    bus.place(sfx.fire(a + 0.5, 81) * 0.7, 0, 0.3, -0.1)
    beat = 60 / 108
    prog = [[41, 57, 60, 65], [36, 55, 58, 64], [36, 55, 58, 64], [41, 57, 60, 65], [46, 58, 62, 65], [41, 57, 60, 65], [36, 55, 60, 64], [41, 57, 60, 65]]
    tt = 0.3
    bar = 0
    while tt < c - 0.1:
        ch = prog[bar % len(prog)]
        bus.place(M.pluck(midi(ch[0]), 1.2, 0.35, 0.997, 0.9, seed=bar), tt, 0.28, -0.1, wet=0.3)
        for k in (1, 2):
            bus.place(M.strum(ch[1:], 0.5, 0.01, 0.55, 0.6, True, seed=bar * 3 + k), tt + k * beat, 0.14, 0.2, wet=0.4)
        tt += 3 * beat
        bar += 1
    sc = M.scale(65, 'mayor')
    mel = [(0, 4, 2), (3, 3, 1), (4, 2, 1), (5, 1, 3), (8, 2, 1), (9, 3, 1), (10, 4, 1), (11, 5, 3), (14, 4, 1), (15, 2, 1), (16, 0, 2), (18, 1, 1), (19, 2, 3), (22, 4, 1), (23, 6, 2), (25, 7, 3)]
    for k, (bt, d, ln) in enumerate(mel):
        t0 = 0.3 + bt * beat
        if t0 > c:
            break
        bus.place(sfx.marimba(midi(sc(d)), 1.4, seed=k), t0, 0.2, -0.2, wet=0.6)
        bus.place(M.flute(midi(sc(d)), ln * beat * 0.95, 0.7, seed=k), t0, 0.08, 0.2, wet=0.9)
    # masa y huesos
    bus.place(sfx.thump(90, 50, 0.6, 0.15), a + 0.1, 0.25)
    for k in range(4):
        bus.place(sfx.thump(140, 80, 0.4, 0.08), a + fr(40 + k * 10), 0.3, -0.2 + k * 0.15)
    bus.place(sfx.thump(160, 90, 0.4, 0.08), a + fr(82), 0.32)
    # azúcar: brillos
    for k in range(12):
        bus.reverb_only(sfx.bell(2000 + 300 * (k % 5), 1.0), b + 0.2 + k * 0.2, 0.035, pan=(-0.5, 0.5)[k % 2])
    # el número de azúcar
    n = int((fr(HIT) + 0.4) * SR)
    grains = (np.random.default_rng(8).random(n) < 0.02) * sfx.noise(n, 801)
    bus.place(sfx.bp(grains, 4000, 11000) * np.linspace(0.3, 1, n), c, 0.3, wet=0.3)
    for k in range(8):
        bus.reverb_only(sfx.bell(1760 * 2 ** (k / 12 * 2), 1.4), hit - 0.3 + k * 0.09, 0.05, pan=-0.6 + k * 0.17)
    bus.place(M.huehuetl(1.0, 1.1, seed=8), hit, 0.6, wet=0.3)
    bus.place(sfx.boom(8), hit, 0.75, wet=0.35)
    bus.place(M.strum([41, 53, 57, 60, 65, 69], 2.4, 0.03, 0.6, 1.0, True, seed=880), hit, 0.36, 0.1, wet=0.7)
    for k, m in enumerate([65, 69, 72, 77]):
        bus.place(sfx.marimba(midi(m), 2.0), hit + 0.04 * k, 0.22, -0.3 + 0.2 * k, wet=0.6)
    return c + fr(REV)


# ---------------------------------------------------------------- 7 · La Catrina (vals mexicano, reel)
def cap7(bus):
    S1, S2, S3, S4, REV, HIT = 108, 126, 150, 66, 156, 58
    a, b, c, d = fr(S1), fr(S1 + S2), fr(S1 + S2 + S3), fr(S1 + S2 + S3 + S4)
    hit = d + fr(HIT)
    bed(bus, 0, drone=0.02, wind=0.1, seed=7)
    beat = 60 / 132
    sc = M.scale(60, 'mayor')
    # tocador: cajita musical
    intro = [(0.5, 4), (0.95, 2), (1.4, 0), (1.85, 4), (2.3, 5), (2.75, 4), (3.2, 2)]
    for k, (tt, dg) in enumerate(intro):
        bus.place(M.musicbox(midi(sc(dg + 7)), 1.6, 0.8), tt, 0.18, -0.2 + 0.07 * k, wet=1.2)
    # vals desde el retrato
    prog = [[48, 64, 67, 72], [43, 62, 65, 71], [43, 62, 65, 71], [48, 64, 67, 72], [41, 60, 65, 69], [48, 64, 67, 72], [43, 62, 65, 71], [48, 64, 67, 72]]
    mel = [4, 4, 5, 7, 7, 6, 5, 4, 3, 2, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2, 4, 3, 1]
    tt = a
    bar = 0
    while tt < d - 0.05:
        ch = prog[bar % len(prog)]
        full = tt >= b
        bus.place(M.pluck(midi(ch[0]), 1.0, 0.35, 0.997, 0.9, seed=bar), tt, 0.3 if full else 0.2, -0.1, wet=0.3)
        for k in (1, 2):
            if full:
                bus.place(M.strum(ch[1:], 0.4, 0.008, 0.55, 0.6, True, seed=bar * 3 + k), tt + k * beat, 0.14, 0.25, wet=0.4)
            else:
                bus.place(sfx.marimba(midi(ch[1]), 0.8), tt + k * beat, 0.08, 0.25, wet=0.5)
        for j in range(3):
            dg = mel[(bar * 3 + j) % len(mel)]
            if j == 0 or full:
                bus.place(sfx.marimba(midi(sc(dg + 7)), 1.2, seed=bar * 3 + j), tt + j * beat, 0.24 if full else 0.18, -0.25, wet=0.6)
                if full:
                    bus.place(sfx.marimba(midi(sc(dg + 5)), 1.2, seed=900 + bar * 3 + j), tt + j * beat + 0.012, 0.12, 0.25, wet=0.6)
        tt += 3 * beat
        bar += 1
    pad = sfx.strings([midi(48), midi(55), midi(64), midi(67)], b - a + 0.4, lambda u: np.minimum(1, u * 3), 400, 1600, release=0.3, seed=71)
    bus.place2(pad, a, 0.14, wet=0.9)
    # pétalos al pasar al vals
    bus.place(sfx.air(72, 1.0, (600, 1800), (1800, 6000)), b - 0.4, 0.12, wet=0.4)
    # abanico que se abre
    for k in range(12):
        bus.place(sfx.marimba(midi(sc(k + 7)), 0.9), c + 0.27 + k * 0.08, 0.12, -0.6 + k * 0.1, wet=0.6)
    bus.place(sfx.air(73, 1.0, (800, 2000), (2000, 7000)), c + 0.2, 0.14, wet=0.3)
    sw = sfx.strings([midi(48), midi(55), midi(64), midi(67)], fr(HIT) - 0.1, lambda u: u ** 2, 400, 2400, release=0.08, seed=74)
    bus.place2(sw, d, 0.26, wet=0.6)
    for k in range(10):
        bus.place(sfx.marimba(midi(sc(k + 4)), 0.9), d + 0.2 + k * (fr(HIT) - 0.3) / 10, 0.12, -0.6 + k * 0.12, wet=0.6)
    bus.place(M.huehuetl(1.1, 1.0, seed=7), hit, 0.7, wet=0.3)
    bus.place(sfx.boom(7), hit, 0.85, wet=0.35)
    bus.place(M.strum([36, 48, 55, 64, 67, 72], 2.6, 0.03, 0.65, 1.0, True, seed=770), hit, 0.36, 0.1, wet=0.7)
    for k, m in enumerate([72, 76, 79, 84]):
        bus.place(sfx.marimba(midi(m), 2.0), hit + 0.04 * k, 0.24, -0.3 + 0.2 * k, wet=0.6)
    bus.place2(np.stack([M.choir([48, 60, 64, 67, 72], fr(REV - HIT) + 0.5, 'a', seed=7, attack=0.2)] * 2), hit, 0.12, wet=0.9)
    return d + fr(REV)


# ---------------------------------------------------------------- 6 · Calaverita literaria (son juguetón)
def pluma(dur, seed=0):
    n = int(dur * SR)
    r = np.random.default_rng(seed)
    g = (r.random(n) < 0.05) * r.normal(0, 1, n)
    strokes = 0.5 + 0.5 * np.sin(2 * np.pi * 7 * np.arange(n) / SR + r.uniform(0, 6))
    return sfx.bp(g, 2500, 9000) * strokes


def cap6(bus):
    S1, S2, REV, HIT = 84, 216, 132, 62
    a, b = fr(S1), fr(S1 + S2)
    hit = b + fr(HIT)
    bed(bus, 0, drone=0.0, wind=0.05, seed=6)
    beat = 60 / 116
    sc = M.scale(69, 'mayor')
    prog = [[45, 57, 61, 64], [52, 56, 59, 64], [52, 56, 59, 62], [45, 57, 61, 64]]
    tt = 0.2
    k = 0
    while tt < b - 0.05:
        ch = prog[(k // 4) % 4]
        if k % 2 == 0:
            bus.place(M.pluck(midi(ch[0] - 12), 0.6, 0.4, 0.995, 0.9, seed=k), tt, 0.28, -0.1, wet=0.2)
        else:
            bus.place(sfx.marimba(midi(ch[1]), 0.5), tt, 0.1, 0.25, wet=0.4)
            bus.place(sfx.marimba(midi(ch[2]), 0.5), tt + 0.005, 0.1, 0.25, wet=0.4)
        bus.place(sfx.wood(1700 if k % 2 else 1300), tt, 0.06, 0.4, wet=0.3)
        tt += beat
        k += 1
    # melodía de marimba "con picardía": una frase por cada línea del verso
    phrases = [[4, 5, 4, 2, 0], [1, 2, 4, 2, 1], [4, 5, 7, 5, 4], [2, 1, 0, -1, 0]]
    for li, at in enumerate([6, 54, 102, 150]):
        t0 = a + fr(at)
        for j, dg in enumerate(phrases[li]):
            bus.place(sfx.marimba(midi(sc(dg)), 1.0, seed=li * 10 + j), t0 + j * beat * 0.5, 0.24, -0.2, wet=0.5)
        bus.place(pluma(fr(42), 600 + li), t0, 0.1, 0.3)
    bus.place(pluma(1.6, 699), 0.35, 0.1, 0.3)
    # la gota de tinta
    drop = b + fr(14)
    n = int(0.3 * SR)
    tt_ = np.arange(n) / SR
    bloop = np.sin(2 * np.pi * np.cumsum(300 + 500 * np.exp(-tt_ / 0.04)) / SR) * np.exp(-tt_ / 0.08)
    bus.place(bloop, drop, 0.4, wet=0.5)
    sw = sfx.strings([midi(57), midi(64), midi(69), midi(73)], fr(HIT) - 0.1, lambda u: u ** 2, 400, 2200, release=0.08, seed=61)
    bus.place2(sw, b + 0.3, 0.2, wet=0.6)
    bus.place(M.huehuetl(1.0, 1.1, seed=6), hit, 0.6, wet=0.3)
    bus.place(sfx.boom(6), hit, 0.75, wet=0.35)
    for j, m in enumerate([69, 73, 76, 81, 85]):
        bus.place(sfx.marimba(midi(m), 1.8), hit + 0.04 * j, 0.24, -0.4 + 0.2 * j, wet=0.6)
    bus.place(M.pluck(midi(33), 2.0, 0.4, 0.998, 1.0, seed=666), hit, 0.3, wet=0.3)
    return b + fr(REV)


def cap5(bus):
    S1, S2, S3, REV, HIT = 108, 120, 72, 126, 64
    a, b, c = fr(S1), fr(S1 + S2), fr(S1 + S2 + S3)
    hit = c + fr(HIT)
    bed(bus, a, drone=0.12, wind=0.25, seed=5)
    sc = M.scale(64, 'mixolidio')
    beat = 60 / 126
    # humo: destellos de caja musical que suben mientras las piezas llegan volando
    for k in range(12):
        bus.place(M.musicbox(midi(sc(k % 9 + 1)), 1.4, 0.6 + 0.03 * k), 0.4 + k * 0.24, 0.08, -0.6 + (k % 6) * 0.24, wet=1.2)
    for k in range(6):
        at = fr(30) + (k * 0.08) * fr(70)
        bus.place(whoosh(0.7, 400, 5000, seed=500 + k), at, 0.16, -0.7 + 0.28 * k, wet=0.5)
    bus.place(M.choir([midi(52), midi(59), midi(64), midi(68)], a + 0.4, 'o', 0.5, seed=5), 0.2, 0.08, wet=0.9)
    # retrato + vuelo: el alebrije cobra vida con un groove alegre
    prog = [[40, 52, 56, 59], [38, 50, 54, 57], [45, 52, 57, 61], [40, 52, 56, 62]]
    tt, k = a, 0
    while tt < c - 0.05:
        ch = prog[(k // 4) % 4]
        if k % 4 == 0:
            bus.place(M.huehuetl(0.6, 1.3, seed=k), tt, 0.3, wet=0.25)
        if k % 2 == 0:
            bus.place(M.pluck(midi(ch[0]), 0.5, 0.45, 0.994, 0.9, seed=k), tt, 0.26, -0.15, wet=0.2)
        else:
            for j, m in enumerate(ch[1:]):
                bus.place(sfx.marimba(midi(m), 0.4, seed=k * 3 + j), tt + 0.004 * j, 0.08, 0.3, wet=0.35)
        bus.place(M.teponaztli(880 if k % 2 else 660, 0.5, seed=k), tt + beat * 0.5, 0.08, 0.45, wet=0.3)
        bus.place(M.sonaja(0.6, seed=k), tt + beat * 0.75, 0.07, -0.45)
        tt += beat
        k += 1
    mel = [(4, 1), (5, 0.5), (4, 0.5), (2, 1), (0, 1), (2, 0.5), (4, 0.5), (6, 1.5), (7, 0.5)]
    tt = a + beat * 2
    for j, (dg, d) in enumerate(mel):
        bus.place(M.flute(midi(sc(dg) + 12), d * beat * 0.95, 0.85, seed=50 + j), tt, 0.17, 0.1, wet=0.8)
        tt += d * beat
    # vuelo: aleteos y escala de flauta que se eleva
    flap = 1 / (1.4 * 1.8)
    t2 = b
    while t2 < c - 0.1:
        bus.place(whoosh(flap * 0.8, 200, 1800, seed=int(t2 * 100)), t2, 0.12, 0.0, wet=0.3)
        t2 += flap
    for j in range(10):
        bus.place(M.flute(midi(sc(j + 4) + 12), 0.2, 0.8, seed=80 + j), b + 0.1 + j * 0.2, 0.15, -0.5 + j * 0.1, wet=0.9)
    bus.place(whoosh(1.0, 300, 6000, seed=599), c - 0.7, 0.2, 0.4, wet=0.5)
    # número: cada pincelada es un barrido y una nota que sube
    for i in range(7):
        at = c + fr(6 + i * 7)
        bus.place(whoosh(0.35, 800, 7000, seed=610 + i), at, 0.12, -0.5 + i * 0.16, wet=0.4)
        bus.place(sfx.marimba(midi(sc(i + 2) + 12), 1.0, seed=620 + i), at + 0.03, 0.18, -0.5 + i * 0.16, wet=0.6)
    sw = sfx.strings([midi(52), midi(59), midi(64), midi(68)], fr(HIT) - 0.1, lambda u: u ** 2, 400, 2600, release=0.08, seed=51)
    bus.place2(sw, c + 0.2, 0.2, wet=0.6)
    bus.place(M.huehuetl(1.0, 1.0, seed=55), hit, 0.6, wet=0.3)
    bus.place(sfx.boom(5), hit, 0.75, wet=0.35)
    bus.place(M.strum([midi(m) for m in (40, 47, 52, 56, 59, 64)], 2.4, 0.02, 0.6, 0.9, seed=56), hit, 0.3, wet=0.4)
    for j, m in enumerate([64, 68, 71, 74, 76]):
        bus.place(sfx.marimba(midi(m + 12), 1.6, seed=630 + j), hit + 0.05 * j, 0.2, -0.4 + 0.2 * j, wet=0.6)
    bus.place(M.chirp(57, 3), hit + 0.4, 0.06, 0.5, wet=0.6)
    return c + fr(REV)


def cap4(bus):
    # pirekua purépecha: guitarra en 6/8, dueto en terceras, campanas del panteón
    S1, S2, S3, REV, HIT = 120, 108, 72, 132, 70
    a, b, c = fr(S1), fr(S1 + S2), fr(S1 + S2 + S3)
    hit = c + fr(HIT)
    bed(bus, 0, drone=0.08, wind=0.2, seed=4)
    bus.place(M.river(b, seed=4) * 0.5, 0.0, 0.1, wet=0.3)
    for k, at in enumerate([0.9, 2.3, 3.6]):
        bus.place(sfx.rustle(400 + k, 0.5), at, 0.06, -0.3 + 0.3 * k, wet=0.4)
    sc = M.scale(62, 'menor')
    e8 = 60 / 92 / 2
    prog = [[38, 50, 53, 57], [45, 52, 57, 61], [43, 50, 55, 58], [45, 52, 57, 61]]
    tt, k = 0.3, 0
    while tt < c - 0.05:
        ch = prog[(k // 6) % 4]
        pos = k % 6
        if pos == 0:
            bus.place(M.pluck(midi(ch[0]), 1.2, 0.45, 0.996, 0.9, seed=k), tt, 0.24, -0.2, wet=0.35)
        elif pos in (2, 4):
            bus.place(M.strum([midi(m) for m in ch[1:]], 0.5, 0.012, 0.5, 0.6, down=pos == 2, seed=k), tt, 0.14, 0.15, wet=0.4)
        elif pos == 3:
            bus.place(M.pluck(midi(ch[0] + 7), 0.8, 0.4, 0.995, 0.7, seed=k), tt, 0.16, -0.2, wet=0.35)
        tt += e8
        k += 1
    # dueto: flauta y voz en terceras
    mel = [(4, 2), (3, 1), (2, 2), (1, 1), (2, 3), (4, 2), (5, 1), (4, 2), (2, 1), (1, 3), (0, 3)]
    tt = a - e8 * 6
    for j, (dg, d) in enumerate(mel):
        dur = d * e8
        if tt > b - 0.1:
            break
        bus.place(M.flute(midi(sc(dg) + 12), dur * 0.95, 0.8, seed=40 + j), tt, 0.15, -0.25, wet=0.9)
        bus.place(M.choir([midi(sc(dg - 2) + 12)], dur * 1.1, 'u', 0.5, seed=60 + j, attack=0.08), tt, 0.1, 0.25, wet=0.9)
        tt += dur
    # campanas del panteón
    for k, at in enumerate([a + 0.15, a + 1.75]):
        bus.place(sfx.bell(midi(50), 4.0), at, 0.22, 0.3, wet=1.0)
        bus.place(sfx.bell(midi(57), 3.0), at + 0.02, 0.08, 0.3, wet=1.0)
    bus.place(M.choir([midi(50), midi(57), midi(62), midi(65)], fr(S2) + 0.6, 'o', 0.55, seed=4), a, 0.1, wet=1.0)
    # una vela enciende a otra: silencio, chispa
    bus.place(sfx.ignite(41), b + fr(30), 0.32, 0.25, wet=0.5)
    bus.place(M.musicbox(midi(74), 2.0, 0.6), b + fr(32), 0.1, 0.3, wet=1.2)
    # desde el cielo: cada vela que prende es un destello que se contagia
    for j in range(26):
        at = c + fr(18) + j * (fr(HIT - 22) / 26)
        bus.place(M.musicbox(midi(sc(j % 8 + 4) + 12), 1.2, 0.5 + 0.02 * j), at, 0.06, -0.6 + (j % 7) * 0.2, wet=1.2)
    sw = sfx.strings([midi(50), midi(57), midi(62), midi(65)], fr(HIT) - 0.1, lambda u: u ** 2, 300, 2200, release=0.1, seed=44)
    bus.place2(sw, c + 0.1, 0.22, wet=0.7)
    bus.place(M.choir([midi(50), midi(57), midi(62), midi(66), midi(69)], 3.2, 'a', 0.8, seed=45, attack=0.05), hit, 0.16, wet=1.0)
    bus.place(sfx.bell(midi(62), 4.0), hit, 0.22, -0.2, wet=1.0)
    bus.place(M.huehuetl(1.0, 0.9, seed=46), hit, 0.55, wet=0.3)
    bus.place(sfx.boom(4), hit, 0.7, wet=0.4)
    bus.place(M.strum([midi(m) for m in (38, 45, 50, 54, 57, 62)], 2.6, 0.03, 0.55, 0.9, seed=47), hit + 0.05, 0.26, wet=0.5)
    return c + fr(REV)


def cap3(bus):
    # REEL: cada elemento que llega al altar suma un instrumento; al final suena todo junto
    INTRO, SEG, N, PULL, REV, HIT = 72, 54, 8, 66, 150, 66
    e0 = fr(INTRO)
    p0 = fr(INTRO + SEG * N)
    r0 = fr(INTRO + SEG * N + PULL)
    hit = r0 + fr(HIT)
    beat = SEG / FPS / 3
    bed(bus, 0, drone=0.08, wind=0.12, seed=3)
    sc = M.scale(58, 'mayor')
    prog = [[46, 58, 62, 65], [43, 55, 58, 62], [51, 55, 58, 63], [53, 57, 60, 65]]
    # intro: los manteles caen
    for k, at in enumerate([14, 23, 32]):
        bus.place(whoosh(0.45, 200, 2500, seed=300 + k, up=False), fr(at) - 0.15, 0.16, -0.3 + 0.3 * k, wet=0.4)
        bus.place(sfx.thump(160, 60, 0.4, 0.08), fr(at) + 0.25, 0.25, wet=0.3)
    bus.place(M.choir([midi(46), midi(53), midi(58)], e0 + 0.3, 'o', 0.45, seed=3), 0.2, 0.08, wet=1.0)
    end = r0 + fr(10)
    tt, k = e0, 0
    while tt < end:
        seg = int((tt - e0) / (SEG / FPS))
        ch = prog[seg % 4]
        layers = min(N, seg + 1)
        pos = k % 3
        # 1 papel picado: caja musical
        bus.place(M.musicbox(midi(ch[1 + pos] + 12), 0.9, 0.6), tt, 0.07, 0.4, wet=1.0)
        if layers >= 2:  # agua: bajo de marimba
            if pos == 0:
                bus.place(sfx.marimba(midi(ch[0]), 1.0, seed=k), tt, 0.2, -0.1, wet=0.3)
        if layers >= 3:  # sal: sonaja
            bus.place(M.sonaja(0.55, seed=k), tt + beat * 0.5, 0.07, -0.45)
        if layers >= 4:  # velas: arpegio pulsado
            for j in range(2):
                bus.place(M.pluck(midi(ch[1 + (pos + j) % 3]), 0.5, 0.55, 0.994, 0.7, seed=k * 2 + j), tt + j * beat * 0.5, 0.1, 0.25, wet=0.4)
        if layers >= 5 and pos == 0:  # copal: coro
            bus.place(M.choir([midi(m) for m in ch[1:]], SEG / FPS + 0.2, 'a', 0.45, seed=seg), tt, 0.07, wet=1.0)
        if layers >= 7:  # pan: huehuetl
            if pos == 0:
                bus.place(M.huehuetl(0.7, 1.2, seed=k), tt, 0.3, wet=0.25)
        if layers >= 8:  # calaveritas: teponaztli y quijada
            bus.place(M.teponaztli(990 if pos else 740, 0.5, seed=k), tt + beat * 0.5, 0.07, 0.45, wet=0.3)
            if pos == 2:
                bus.place(M.quijada(0.5, seed=k), tt, 0.06, -0.5, wet=0.3)
        tt += beat
        k += 1
    # 6 cempasúchil: la flauta canta la melodía desde aquí
    mel = [(4, 1), (5, 1), (7, 1), (9, 2), (7, 1), (8, 1), (7, 1), (5, 1), (4, 3), (2, 1), (4, 1), (5, 1), (4, 3), (6, 1), (5, 1), (4, 1)]
    tt = e0 + 5 * SEG / FPS
    for j, (dg, d) in enumerate(mel):
        if tt > r0:
            break
        bus.place(M.flute(midi(sc(dg) + 12), d * beat * 0.95, 0.85, seed=90 + j), tt, 0.15, -0.15, wet=0.8)
        tt += d * beat
    # llegada de cada elemento: golpe suave + campanita que sube
    for i in range(N):
        at = e0 + fr(i * SEG + 8)
        bus.place(sfx.thump(220, 80, 0.3, 0.06), at + 0.12, 0.2, wet=0.3)
        bus.place(sfx.bell(midi(sc(i + 7)), 1.6), at + 0.1, 0.07, -0.4 + 0.1 * i, wet=0.9)
        bus.place(whoosh(0.3, 600, 6000, seed=320 + i, up=False), at - 0.2, 0.06, wet=0.3)
    # velas encendiéndose
    for i in range(8):
        bus.place(sfx.ignite(330 + i), e0 + fr(3 * SEG + 14 + i * 3), 0.06, -0.5 + 0.13 * i, wet=0.4)
    # entrar al retrato
    bus.place(whoosh(1.6, 150, 6000, seed=341), r0 + fr(6), 0.25, wet=0.6)
    sw = sfx.strings([midi(46), midi(53), midi(58), midi(62)], fr(HIT) - 0.1, lambda u: u ** 2.2, 300, 2600, release=0.1, seed=33)
    bus.place2(sw, r0 + 0.1, 0.22, wet=0.7)
    for j in range(10):
        bus.place(M.musicbox(midi(sc(j + 7) + 12), 1.4, 0.7), r0 + fr(40) + j * 0.05, 0.07, -0.5 + j * 0.1, wet=1.2)
    # golpe final con todo el ensamble
    bus.place(M.huehuetl(1.0, 1.0, seed=35), hit, 0.6, wet=0.3)
    bus.place(sfx.boom(3), hit, 0.75, wet=0.35)
    bus.place(M.strum([midi(m) for m in (46, 53, 58, 62, 65, 70)], 2.6, 0.02, 0.6, 0.9, seed=36), hit, 0.28, wet=0.4)
    bus.place(M.choir([midi(46), midi(58), midi(62), midi(65), midi(70)], 3.0, 'a', 0.7, seed=37, attack=0.05), hit, 0.14, wet=1.0)
    for j, m in enumerate([70, 74, 77, 82]):
        bus.place(sfx.marimba(midi(m), 1.6, seed=340 + j), hit + 0.05 * j, 0.18, -0.3 + 0.2 * j, wet=0.6)
    bus.place(M.flute(midi(82), 1.6, 0.8, seed=99), hit + 0.2, 0.12, 0.2, wet=1.0)
    return r0 + fr(REV)


def rechinido(dur, seed=0):
    # bisagra: tren de micro-impactos (stick-slip) con resonancia de madera
    n = int(dur * SR)
    out = np.zeros(n)
    rng = np.random.default_rng(seed)
    tt = 0.0
    while tt < dur - 0.02:
        u = tt / dur
        rate = 18 + 50 * np.sin(np.pi * u)
        i0 = int(tt * SR)
        out[i0] += rng.uniform(0.5, 1.0)
        tt += 1 / rate * rng.uniform(0.8, 1.2)
    k = np.arange(int(0.03 * SR)) / SR
    ping = np.sin(2 * np.pi * 620 * k) * np.exp(-k / 0.006) + 0.5 * np.sin(2 * np.pi * 1480 * k) * np.exp(-k / 0.003)
    out = np.convolve(out, ping)[:n]
    return sfx.bp(out, 300, 3000) * np.sin(np.pi * np.linspace(0, 1, n)) ** 0.5


def cap2(bus):
    # arpa y latido: la casa espera
    S1, S2, S3, REV, HIT = 114, 108, 72, 132, 74
    a, b, c = fr(S1), fr(S1 + S2), fr(S1 + S2 + S3)
    hit = c + fr(HIT)
    bed(bus, 0, drone=0.07, wind=0.25, seed=2)
    sc = M.scale(56, 'mayor')
    # la puerta se abre
    bus.place(rechinido(1.6, 21), fr(30), 0.22, 0.1, wet=0.5)
    bus.place(sfx.air(22, 2.4), fr(40), 0.12, wet=0.6)
    # grillos afuera
    for k in range(14):
        bus.place(M.chirp(220 + k, 3), fr(60) + k * 0.55 + hash_(k) * 0.2, 0.035, -0.7 if k % 2 else 0.7, wet=0.7)
    # arpa: arpegios que empiezan cuando la puerta se abre
    prog = [[44, 56, 60, 63, 68], [49, 56, 61, 65, 68], [51, 58, 63, 67, 70], [44, 56, 60, 63, 72]]
    step = 60 / 72 / 2
    tt, k = fr(48), 0
    while tt < c + fr(HIT - 6):
        ch = prog[(k // 8) % 4]
        pat = [0, 2, 3, 4, 3, 2, 1, 2]
        m = ch[pat[k % 8]]
        bus.place(harp(m, 1.8, 0.7 + 0.15 * (k % 8 == 0), seed=k), tt, 0.16, -0.3 + 0.08 * (k % 8), wet=0.7)
        tt += step
        k += 1
    # melodía de flauta muy suave en el camino
    mel = [(4, 2), (5, 1), (4, 1), (2, 2), (4, 2), (7, 3), (6, 1), (4, 4)]
    tt = a + step * 2
    for j, (dg, d) in enumerate(mel):
        if tt > b + 1.5:
            break
        bus.place(M.flute(midi(sc(dg) + 12), d * step * 0.95, 0.75, seed=20 + j), tt, 0.13, 0.15, wet=0.9)
        tt += d * step
    # pétalos que caen formando el camino
    for k in range(10):
        bus.place(sfx.rustle(230 + k, 0.6), a + 0.1 + k * 0.32, 0.05, -0.5 + 0.1 * k, wet=0.5)
    # faroles que se encienden (de lejos a cerca) y mariposas
    for i in range(7):
        bus.place(sfx.ignite(240 + i), b + i * (fr(50) / 9) + 0.05, 0.05 + 0.012 * i, 0.4 if i % 2 else -0.4, wet=0.5)
    # el latido: empieza lento y se acelera mientras el camino escribe el número
    tt = b + 0.4
    period = 1.05
    while tt < hit - 0.3:
        bus.place(sfx.heartbeat(int(tt * 10)), tt, 0.42, wet=0.2)
        period = max(0.52, period * 0.94)
        tt += period
    sw = sfx.strings([midi(44), midi(51), midi(56), midi(60)], fr(HIT) - 0.1, lambda u: u ** 2, 300, 2400, release=0.1, seed=25)
    bus.place2(sw, c + 0.2, 0.2, wet=0.7)
    # glissando de arpa y llegada
    for j in range(14):
        bus.place(harp(sc(j + 7), 2.4, 0.75, seed=200 + j), hit - 0.36 + j * 0.026, 0.13, -0.6 + j * 0.09, wet=0.8)
    bus.place(sfx.boom(2), hit, 0.7, wet=0.4)
    bus.place(M.huehuetl(0.9, 0.95, seed=26), hit, 0.5, wet=0.3)
    bus.place(M.choir([midi(44), midi(56), midi(60), midi(63), midi(68)], 3.0, 'a', 0.7, seed=27, attack=0.06), hit, 0.14, wet=1.0)
    bus.place(sfx.bell(midi(68), 3.0), hit + 0.05, 0.12, 0.2, wet=1.0)
    return c + fr(REV)


def hash_(k):
    return (np.sin(k * 12.9898) * 43758.5453) % 1.0


def cap1(bus):
    # final de temporada: el tema de la flauta del capítulo 16 (re dórico) vuelve y se resuelve en re mayor
    S1, S2, S3, REV, HIT = 96, 210, 96, 186, 92
    a, b, c = fr(S1), fr(S1 + S2), fr(S1 + S2 + S3)
    hit = c + fr(HIT)
    bed(bus, 0, drone=0.1, wind=0.2, seed=1)
    dor = M.scale(62, 'dorico')
    may = M.scale(62, 'mayor')
    beat = 60 / 100
    # 1 · flauta sola, como al principio de la temporada
    mel = [(0, 1), (2, 0.5), (3, 0.5), (4, 1.5), (3, 0.5), (2, 1)]
    tt = 0.3
    for j, (dg, d) in enumerate(mel):
        bus.place(M.flute(midi(dor(dg) + 12), d * beat * 0.95, 0.85, seed=10 + j), tt, 0.18, -0.1, wet=1.0)
        tt += d * beat
    for k in range(10):
        bus.place(sfx.rustle(110 + k, 0.4), 0.4 + k * 0.28, 0.03, -0.6 + 0.12 * k, wet=0.6)
    # 2 · el viaje: el ensamble entra por capas (guía / vuelan / luces)
    prog = [[50, 62, 66, 69], [47, 59, 62, 66], [43, 55, 59, 62], [45, 57, 61, 64]]
    tt, k = a, 0
    while tt < b:
        ch = prog[(k // 4) % 4]
        el = tt - a
        if k % 2 == 0:
            bus.place(M.huehuetl(0.6, 1.2, seed=k), tt, 0.26, wet=0.25)
        bus.place(harp(ch[1 + k % 3], 1.6, 0.7, seed=k), tt, 0.12, -0.3, wet=0.6)
        bus.place(harp(ch[1 + (k + 1) % 3] + 12, 1.2, 0.6, seed=k + 500), tt + beat / 2, 0.08, 0.3, wet=0.6)
        if el > 70 / FPS:  # los que vuelan: marimba
            bus.place(sfx.marimba(midi(ch[0] + 12), 0.8, seed=k), tt + beat * 0.25, 0.08, 0.4, wet=0.4)
            bus.place(M.sonaja(0.5, seed=k), tt + beat * 0.75, 0.06, -0.4)
        if el > 140 / FPS and k % 4 == 0:  # las luces: coro
            bus.place(M.choir([midi(m) for m in ch[1:]], beat * 4.2, 'a', 0.5, seed=k), tt, 0.08, wet=1.0)
        tt += beat
        k += 1
    mel2 = [(4, 1), (5, 0.5), (4, 0.5), (2, 1), (4, 1), (7, 2), (6, 0.5), (5, 0.5), (4, 1), (2, 1), (4, 2)]
    tt = a + beat * 2
    for j, (dg, d) in enumerate(mel2):
        if tt > b - 0.3:
            break
        bus.place(M.flute(midi(may(dg) + 12), d * beat * 0.95, 0.85, seed=30 + j), tt, 0.15, 0.1, wet=0.8)
        tt += d * beat
    bus.place(whoosh(1.4, 200, 4000, seed=111), a + fr(70) - 0.2, 0.12, wet=0.5)
    bus.place(M.chirp(112, 3), a + fr(100), 0.05, -0.5, wet=0.5)
    # 3 · la mesa está puesta: campanas y "Ya vienen" con el coro completo
    bus.place(sfx.bell(midi(62), 3.5), b + 0.1, 0.18, -0.2, wet=1.0)
    bus.place(sfx.bell(midi(69), 3.0), b + 0.12, 0.08, 0.3, wet=1.0)
    for j, m in enumerate([62, 66, 69, 74]):
        bus.place(M.musicbox(midi(m + 12), 1.6, 0.7), b + 0.3 + j * 0.16, 0.08, -0.3 + 0.2 * j, wet=1.2)
    yv = b + fr(60)
    bus.place(M.choir([midi(50), midi(62), midi(66), midi(69), midi(74)], fr(S3 - 60) + 0.8, 'a', 0.8, seed=113, attack=0.15), yv, 0.16, wet=1.0)
    bus.place(M.huehuetl(0.9, 1.0, seed=114), yv, 0.45, wet=0.3)
    bus.place(M.strum([midi(m) for m in (38, 45, 50, 54, 57, 62)], 2.0, 0.025, 0.55, 0.8, seed=115), yv, 0.22, wet=0.4)
    # 4 · remolino: todo gira y se acelera hacia el número
    sw = sfx.strings([midi(50), midi(57), midi(62), midi(66)], fr(HIT) - 0.1, lambda u: u ** 2.4, 300, 3000, release=0.08, seed=116)
    bus.place2(sw, c + 0.1, 0.26, wet=0.7)
    bus.place(whoosh(fr(HIT) - 0.2, 150, 7000, seed=117), c + 0.1, 0.22, wet=0.6)
    tt, per = c + 0.3, 0.42
    while tt < hit - 0.1:
        bus.place(M.teponaztli(880, 0.5 + 0.4 * (tt - c) / fr(HIT), seed=int(tt * 50)), tt, 0.1, 0.3 if int(tt * 10) % 2 else -0.3, wet=0.3)
        per = max(0.09, per * 0.9)
        tt += per
    # golpe final
    bus.place(sfx.boom(1), hit, 0.8, wet=0.4)
    bus.place(M.huehuetl(1.0, 0.9, seed=118), hit, 0.6, wet=0.3)
    bus.place(M.strum([midi(m) for m in (38, 45, 50, 54, 57, 62, 66)], 3.0, 0.02, 0.6, 1.0, seed=119), hit, 0.3, wet=0.5)
    bus.place(M.choir([midi(38), midi(50), midi(57), midi(62), midi(66), midi(69), midi(74)], 3.6, 'a', 0.85, seed=120, attack=0.04), hit, 0.18, wet=1.0)
    for j, m in enumerate([62, 69, 74]):
        bus.place(sfx.bell(midi(m), 4.0), hit + 0.03 * j, 0.12, -0.3 + 0.3 * j, wet=1.0)
    for j in range(16):
        bus.place(M.musicbox(midi(may(j % 8 + 7) + 12), 1.4, 0.6), hit + 0.4 + j * 0.15, 0.06, -0.7 + (j % 8) * 0.2, wet=1.2)
    mel3 = [(7, 1), (9, 0.5), (11, 0.5), (14, 2)]
    tt = hit + 1.0
    for j, (dg, d) in enumerate(mel3):
        bus.place(M.flute(midi(may(dg)), d * beat * 0.95, 0.85, seed=130 + j), tt, 0.16, 0.0, wet=1.0)
        tt += d * beat
    return c + fr(REV)


SCORES = {16: cap16, 15: cap15, 14: cap14, 13: cap13, 12: cap12, 11: cap11, 10: cap10, 9: cap9, 8: cap8, 7: cap7, 6: cap6, 5: cap5, 4: cap4, 3: cap3, 2: cap2, 1: cap1}


def build(dias):
    # duración: capítulo + outro
    lens = {16: 120 + 108 + 72 + 120, 15: 120 + 96 + 225 + 165 + 135 + 150, 14: 126 + 96 + 72 + 126, 13: 126 + 96 + 78 + 126, 12: 126 + 108 + 66 + 126, 11: 126 + 96 + 72 + 126, 10: 84 + 40 * 9 + 156, 9: 108 + 108 + 78 + 132, 8: 108 + 108 + 78 + 126, 7: 108 + 126 + 150 + 66 + 156, 6: 84 + 216 + 132, 5: 108 + 120 + 72 + 126, 4: 120 + 108 + 72 + 132, 3: 72 + 54 * 8 + 66 + 150, 2: 114 + 108 + 72 + 132, 1: 96 + 210 + 96 + 186}
    total = lens[dias] + OUTRO
    bus = Bus(total / FPS)
    out_at = SCORES[dias](bus)
    M.outro(bus, out_at)
    mix, lufs = sfx.master(bus, fade=(fr(total - 6), fr(total)))
    return mix, lufs, total


if __name__ == '__main__':
    dias = int(sys.argv[1])
    out = sys.argv[2]
    mix, lufs, total = build(dias)
    wavfile.write(out, SR, (np.clip(mix, -1, 1).T * 32767).astype(np.int16))
    print(json.dumps({'dias': dias, 'frames': total, 'segundos': round(total / FPS, 3), 'lufs': round(lufs, 2), 'out': out}))
