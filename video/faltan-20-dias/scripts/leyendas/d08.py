"""Partitura y diseño sonoro del día 8 · «El listón rojo» · Los Chaneques.

Concepto: la canción de cuna de la abuela, que el monte aprende a cantar de vuelta.
Melodía ORIGINAL de cuna en re menor, 3/4 a 66 bpm (la alternativa del tratamiento, célula de tercera descendente):
    |A4. F4 A4 F4 | G4 F4 E4 D4 | ... | F4. E4 F4 G4 | E4 D4 |
La voz del monte llama con la tercera menor F4→D4 de la misma canción.

Sincronía: los frames de EV son copia de src/leyendas/d08/timeline.ts (30 fps).
Cada cue se renderiza con su propia reverberación por convolución (IR sintética «monte»: larga y oscura;
«cocina»: corta y tibia) y se puede truncar (`until`) para los cortes duros; los silencios del tratamiento
son cero digital (máscaras globales). Todo es determinista (semillas fijas).
"""
import numpy as np
from scipy.signal import fftconvolve

import leyendas_sfx as L
import music as M
import sfx
from sfx import SR, bp, hp, lp, midi, noise, pink, smooth_noise

FPS = 30
LEN = 1335  # frames del episodio (igual que EP08_LEN en src/leyendas/d08_chaneques.tsx)
STANDARD_OUTRO = True  # el día 0 trae su propio outro
TAU = 2 * np.pi

# momentos clave (frames) — copia de d08/timeline.ts
EV = dict(
    torchOn=5, giggle1=42, whip1=44, eyes1=69, bloom=84,
    wrap0=90, wrap1=138, knot=160, pat1=184, pat2=193, lift0=231, smoke0=231, smoke1=264,
    b3=246, owlHoot=275, owlTurn=282, tiltDown=306, snap=330, b4=348,
    cup0=354, cup1=381, refl0=384, reflTilt=400, whipTurn=412, whipBack=429, silence=434, petalPop=465, wrist0=480,
    b5=522, hum=525, call1=558, dart0=567, still0=606, whipL=660, inhale=681, reply=686, echoes=(690, 697, 704),
    zero=712, erupt=720, blinkAll=733,
    b6=738, cut2=765, run2=775, parallel=783, cut3=792, run3=802, cut4=819, stop=843,
    b7=849, drips=(855, 888, 921), zero2=927, jump=930, torchDrop=943, torchDie=944,
    b8=948, swell=955, slam=960, sink=1008,
    b9=1014, b10=1122, petalFall=1146, petalLand=1160,
    fuse0=1188, fuse1=1218, lockup=1228, prints0=1281, prints1=1308, eyes2=1311, giggle2=1317, slap=1321,
)
# ceros digitales [inicio, fin) en frames: arranque, 23.75–24.0, el alto total de la carrera, 30.9–31.0, 31.6–31.85, corte final
ZEROS = [(0, 5), (712, 720), (843, 849), (927, 930), (948, 955), (LEN, None)]
# paneo del frente de la mecha (x de la cabeza de brasa sobre el 8, frames 1188..1218, (x-540)/270)
FUSE_PAN = [0.01, 0.02, 0.05, 0.12, 0.2, 0.29, 0.35, 0.38, 0.38, 0.37, 0.22, -0.02, -0.28, -0.33, -0.3, 0.0, 0.3, 0.33, 0.28, 0.03,
            -0.22, -0.36, -0.38, -0.38, -0.35, -0.28, -0.19, -0.11, -0.05, -0.01, 0.01]

D4, E4, F4, G4, A4, BB4, C5, D5 = 62, 64, 65, 67, 69, 70, 72, 74
# primera frase (ritmo en tiempos de 3/4) y última frase de la canción de cuna
PHRASE1 = [(A4, 1.5), (F4, 0.5), (A4, 0.5), (F4, 0.5), (G4, 1.0), (F4, 0.5), (E4, 0.5), (D4, 1.0)]
PHRASE_LAST = [(F4, 1.5), (E4, 0.5), (F4, 0.5), (G4, 0.5), (E4, 1.0), (D4 - 0.5, 2.0)]  # la última, un cuarto de tono baja


def fr(f):
    return f / FPS


def _t(dur):
    return np.arange(int(dur * SR)) / SR


def norm(x, p=1.0):
    return x / (np.max(np.abs(x)) + 1e-12) * p


def hann_env(n, a, r):
    e = np.ones(n)
    A, R = min(n, int(a * SR)), min(n, int(r * SR))
    if A:
        e[:A] = np.sin(np.linspace(0, np.pi / 2, A)) ** 2
    if R:
        e[-R:] *= np.cos(np.linspace(0, np.pi / 2, R)) ** 2
    return e


def resample(x, ratio):
    """Cambia tono y duración (ratio > 1 = más agudo y corto)."""
    n = int(len(x) / ratio)
    return np.interp(np.arange(n) * ratio, np.arange(len(x)), x)


def panned(x, pan):
    """Mono → estéreo con paneo constante o automatizado (arreglo)."""
    p = np.asarray(pan, dtype=float) * np.ones(len(x))
    return np.stack([x * np.cos((p + 1) * np.pi / 4), x * np.sin((p + 1) * np.pi / 4)])


# ---------- reverberaciones sintéticas ----------
def _ir(seconds, tau, lp_hz, pre, early, seed):
    n = int(seconds * SR)
    i = np.arange(n) / SR
    ir = np.zeros((2, n))
    r = np.random.default_rng(seed)
    for c in range(2):
        tail = lp(noise(n, seed + c) * np.exp(-i / tau), lp_hz) * (1 - np.exp(-np.maximum(0, i - pre) / 0.02)) * (i > pre)
        ir[c] = tail
        for k in range(early):
            ir[c, int((pre * 0.5 + r.uniform(0.003, pre + 0.04)) * SR)] += r.uniform(0.2, 0.6) * (0.85 ** k)
    return ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True)) * 0.6


IRS = {}


def ir(name):
    if name not in IRS:
        IRS[name] = {
            'monte': lambda: _ir(4.2, 1.15, 2600, 0.035, 6, 801),  # barranca: larga, oscura, difusa
            'cocina': lambda: _ir(0.9, 0.16, 6500, 0.006, 14, 802),  # cocina pequeña y tibia
            'lejos': lambda: _ir(5.0, 1.5, 1600, 0.06, 3, 803),  # muy lejos (voz del monte, campana)
        }[name]()
    return IRS[name]


class Mix:
    """Mezcla propia del episodio: cada cue lleva su reverb y puede cortarse en seco (until, en frames)."""

    def __init__(self, dur):
        self.n = int(dur * SR)
        self.out = np.zeros((2, self.n))

    def put(self, sig, at, gain=1.0, pan=0.0, wet=0.0, room='monte', until=None, cut=0.004):
        if gain == 0 or sig is None or len(np.shape(sig)) == 0:
            return
        st = sig if np.ndim(sig) == 2 else panned(sig, pan)
        st = st * gain
        if wet:
            h = ir(room)
            mono = st.mean(axis=0) if np.ndim(sig) == 2 else st.sum(axis=0) * 0.7071
            w = np.stack([fftconvolve(mono, h[c]) for c in range(2)]) * wet
            if np.ndim(sig) == 1:  # el retorno conserva algo del paneo
                w[0] *= 1 - 0.35 * pan
                w[1] *= 1 + 0.35 * pan
            full = np.zeros((2, max(st.shape[1], w.shape[1])))
            full[:, : st.shape[1]] += st
            full[:, : w.shape[1]] += w
            st = full
        s = int(round(at * SR))
        if s < 0:
            st, s = st[:, -s:], 0
        end = self.n if until is None else min(self.n, int(round(fr(until) * SR)))
        m = min(st.shape[1], end - s)
        if m <= 0:
            return
        st = st[:, :m].copy()
        if until is not None and s + st.shape[1] >= end:
            k = min(m, int(cut * SR))
            if k:
                st[:, -k:] *= np.linspace(1, 0, k)
        self.out[:, s : s + m] += st

    def finish(self):
        o = self.out
        for a, b in ZEROS:
            i0 = int(round(fr(a) * SR))
            i1 = self.n if b is None else int(round(fr(b) * SR))
            k = int(0.004 * SR)
            if i0 > k:
                o[:, i0 - k : i0] *= np.linspace(1, 0, k)
            o[:, i0:i1] = 0
            if b is not None and i1 + k < self.n:
                o[:, i1 : i1 + k] *= np.linspace(0, 1, k)
        return o


# ---------- síntesis propia del episodio ----------
def flash_click(seed=0):
    """Clic de lámpara de plástico: presión + traba, con cuerpo hueco."""
    n = int(0.09 * SR)
    t = _t(0.09)
    out = np.zeros(n)
    for k, (dt, g) in enumerate([(0.0, 0.7), (0.011, 1.0)]):
        i0 = int(dt * SR)
        m = n - i0
        tt = t[:m]
        out[i0:] += g * (bp(noise(m, seed + k), 2200, 7500) * np.exp(-tt / 0.0018) + 0.5 * np.sin(TAU * 1850 * tt) * np.exp(-tt / 0.006))
    return norm(out)


def filament(frames, seed=0):
    """Zumbido del filamento siguiendo una tabla de potencia por frame."""
    dur = len(frames) / FPS
    t = _t(dur)
    pw = np.interp(t * FPS, np.arange(len(frames)), frames)
    ph = (120 * t) % 1.0
    buzz = bp(2 * ph - 1 + 0.4 * noise(len(t), seed), 900, 4200)
    crack = (np.abs(np.diff(pw, prepend=pw[0])) > 1e-4) * noise(len(t), seed + 1)
    return norm(buzz * pw + bp(crack, 1500, 6000) * 2)


def frogs(dur, seed=0, rate=1.6):
    n = int(dur * SR)
    out = np.zeros(n)
    r = np.random.default_rng(seed)
    for _ in range(int(dur * rate)):
        d = r.uniform(0.12, 0.22)
        m = int(d * SR)
        tt = np.arange(m) / SR
        f0 = r.uniform(170, 290)
        src = L.glottal(f0 * (1 + 0.1 * tt / d), d, jitter=0.03, seed=int(r.integers(1e6)))
        am = (np.sin(TAU * r.uniform(18, 30) * tt) > -0.2)
        v = L.formants(src, 'o', q=0.2) * am * np.sin(np.pi * tt / d) ** 0.6
        i0 = int(r.uniform(0, max(1e-3, dur - d - 0.01)) * SR)
        out[i0 : i0 + m] += v * r.uniform(0.3, 1.0)
    return norm(bp(out, 180, 2400))


def crickets3(dur, seed=0):
    """Tres especies de grillo, cada una con su pulso."""
    a = L.crickets(dur, seed, 0.8)
    t = _t(dur)
    b = np.sin(TAU * 6200 * t) * (np.sin(TAU * 52 * t) > 0.3) * (np.sin(TAU * 0.9 * t + 1) > 0.6)
    c = np.sin(TAU * 3300 * t) * (np.sin(TAU * 18 * t) > 0) * (0.5 + 0.5 * np.sin(TAU * 0.23 * t))
    return norm(a + 0.35 * b[: len(a)] + 0.4 * c[: len(a)])


def tick(seed=0, tock=False):
    """Tic de reloj de pared, de madera (tic-tac alternado)."""
    s = sfx.wood(2500 if not tock else 2150) + 0.35 * sfx.wood(760 if not tock else 680)
    return norm(lp(s, 7000))


def ticks(times, seed=0):
    t_end = max(times) + 0.3
    out = np.zeros(int(t_end * SR))
    for k, tt in enumerate(times):
        tk = tick(seed + k, k % 2 == 1)
        i0 = int(tt * SR)
        out[i0 : i0 + len(tk)] += tk[: len(out) - i0]
    return out


def crackle(dur, seed=0, rate=6.0, lo=1500, hi=5500):
    """Chisporroteo de veladora / brasas: pops escasos."""
    n = int(dur * SR)
    r = np.random.default_rng(seed)
    out = np.zeros(n)
    for _ in range(int(dur * rate)):
        i0 = int(r.uniform(0, dur) * SR)
        m = int(r.uniform(0.002, 0.006) * SR)
        out[i0 : i0 + m] += noise(len(out[i0 : i0 + m]), int(r.integers(1e6))) * r.uniform(0.3, 1.0)
    return bp(out, lo, hi)


def cloth(dur, seed=0):
    n = int(dur * SR)
    u = np.linspace(0, 1, n)
    s = bp(noise(n, seed), 450, 3800) * (0.4 + 0.6 * np.abs(smooth_noise(n, 7, seed + 1)))
    return norm(s * np.sin(np.pi * u) ** 0.8)


def squeak(seed=0):
    """Hilo que rechina al apretar el nudo (stick-slip)."""
    t = _t(0.2)
    f = 1700 + 800 * (t / 0.2) ** 0.7
    am = 0.5 + 0.5 * np.sign(np.sin(TAU * 70 * t))
    s = np.sin(TAU * np.cumsum(f) / SR) * am
    return norm(bp(s, 1200, 5000) * np.sin(np.pi * t / 0.2) ** 0.5)


def pat(seed=0):
    n = int(0.15 * SR)
    t = _t(0.15)
    return norm(sfx.thump(160, 90, 0.15, 0.03) * 0.6 + lp(noise(n, seed), 1600) * np.exp(-t / 0.012))


def nylon(m, dur=2.4, vel=1.0, seed=0, bright=0.35):
    """Guitarra de nylon: Karplus-Strong + filtro de cuerpo."""
    x = M.pluck(midi(m), dur, bright, 0.997, 1.0, seed)
    y = x + 0.6 * bp(x, 95, 125) + 0.35 * bp(x, 190, 250) + 0.2 * bp(x, 420, 520)
    return norm(lp(y, 5200)) * vel


def harp(m, dur=3.0, vel=1.0, seed=0):
    x = M.pluck(midi(m), dur, 0.5, 0.9985, 1.0, seed)
    return norm(lp(x + 0.25 * bp(x, 200, 600), 7000)) * vel * hann_env(len(x), 0.002, 0.3)


def warble(st, cents=8.0, rate=0.4):
    """Bamboleo de memoria (±cents) por retardo variable."""
    n = st.shape[-1]
    t = np.arange(n) / SR
    A = (2 ** (cents / 1200) - 1) / (TAU * rate)
    d = (A * (1 + np.sin(TAU * rate * t))) * SR
    idx = np.arange(n) - d
    return np.stack([np.interp(idx, np.arange(n), c) for c in np.atleast_2d(st)])


def step(seed=0, kind='hojas', vel=1.0):
    """Pisada en hojas secas / grava: granos + talón."""
    r = np.random.default_rng(seed)
    n = int(0.22 * SR)
    t = _t(0.22)
    imp = np.zeros(n)
    k = 70 if kind == 'hojas' else 45
    for _ in range(k):
        i0 = int(abs(r.normal(0.025, 0.03)) * SR) % n
        imp[i0] += r.uniform(-1, 1)
    grains = np.convolve(imp, np.exp(-np.arange(int(0.003 * SR)) / (0.0008 * SR)))[:n]
    g = bp(grains, 1400, 7500) if kind == 'hojas' else bp(grains, 700, 4200)
    heel = lp(noise(n, seed + 1), 220) * np.exp(-t / 0.025) * 2.5
    return norm(g * np.exp(-t / 0.07) + heel) * vel


def mud(seed=0):
    n = int(0.25 * SR)
    t = _t(0.25)
    sq = lp(noise(n, seed), 900) * np.exp(-t / 0.05)
    bub = np.sin(TAU * np.cumsum(300 + 900 * t / 0.25) / SR) * np.exp(-t / 0.04) * 0.3
    return norm(sq + bub)


def snap_stem(seed=0):
    n = int(0.12 * SR)
    t = _t(0.12)
    crack = bp(noise(n, seed), 1200, 8000) * np.exp(-t / 0.006)
    fib = bp(noise(n, seed + 1), 600, 3000) * np.exp(-t / 0.03) * (np.random.default_rng(seed).random(n) < 0.08)
    return norm(crack + fib * 2 + sfx.wood(900)[:n] * 0.15 if len(sfx.wood(900)) >= n else crack + fib * 2)


def water_cup(seed=0):
    """Agua tomada con las manos, sorbo y gotas que caen al agua quieta."""
    dur = 1.6
    n = int(dur * SR)
    t = _t(dur)
    out = bp(pink(n, seed), 300, 2600) * np.exp(-((t - 0.18) / 0.12) ** 2) * 1.2
    out += lp(noise(n, seed + 1), 700) * np.exp(-((t - 0.75) / 0.12) ** 2) * 0.6  # sorbo
    r = np.random.default_rng(seed + 2)
    for _ in range(9):
        out += _drop(r.uniform(0.95, 1.55), r.uniform(600, 1300), n) * r.uniform(0.3, 0.8)
    return norm(out)


def _drop(at, f0, n):
    m = int(0.05 * SR)
    tt = np.arange(m) / SR
    s = np.sin(TAU * np.cumsum(f0 * (1 + 1.8 * tt / 0.05)) / SR) * np.exp(-tt / 0.012)
    out = np.zeros(n)
    i0 = int(at * SR)
    out[i0 : i0 + m] += s[: len(out[i0 : i0 + m])]
    return out


def drip(seed=0, f0=950):
    n = int(0.3 * SR)
    out = _drop(0.0, f0, n) + 0.2 * _drop(0.002, f0 * 1.9, n)
    return norm(out)


def whoosh(dur=0.32, seed=0, lo=300, hi=3200, peak=0.45):
    n = int(dur * SR)
    u = np.linspace(0, 1, n)
    e = np.where(u < peak, (u / peak) ** 2, ((1 - u) / (1 - peak)) ** 1.5)
    x = L.lp_sweep(hp(noise(n, seed), lo), hi * 0.3, hi, np.sin(np.pi * u))
    return norm(x * e)


def scrape(seed=0, dur=0.35):
    n = int(dur * SR)
    t = _t(dur)
    g = bp(noise(n, seed), 700, 4500) * (0.5 + 0.5 * np.abs(smooth_noise(n, 90, seed + 1)))
    return norm(g * np.exp(-t / 0.12) + sfx.wood(1300)[: n] * 0.4 if n >= len(sfx.wood(1300)) else g)


def inhale(seed=0, dur=0.55):
    """Inhalación temblorosa (temblor 7 Hz)."""
    n = int(dur * SR)
    t = _t(dur)
    u = t / dur
    v = L.vowel_glide(noise(n, seed), ['h', 'i', 'h'], q=0.3)
    trem = 0.6 + 0.4 * np.sign(np.sin(TAU * 7.5 * t)) * np.clip(u * 3, 0, 1)
    return norm(hp(v, 500) * trem * np.sin(np.pi * u) ** 0.8)


def breath_out(seed=0, dur=0.28):
    n = int(dur * SR)
    t = _t(dur)
    return norm(L.formants(noise(n, seed), 'h', q=0.3) * np.exp(-t / (dur * 0.4)) * np.minimum(1, t / 0.02))


def hum(notes, beat, seed=0, f_shift=-0.006):
    """Tarareo de anciana («mmm» nasal, ligeramente desafinado)."""
    total = sum(d for _, d in notes) * beat + 0.4
    n = int(total * SR)
    f = np.zeros(n)
    tt = 0.0
    for m, d in notes:
        i0, i1 = int(tt * SR), int((tt + d * beat) * SR)
        f[i0:i1] = midi(m - 12) * (1 + f_shift)
        tt += d * beat
    f[int(tt * SR):] = f[int(tt * SR) - 1]
    k = int(0.05 * SR)  # portamento
    f = np.convolve(np.concatenate([np.full(k, f[0]), f]), np.ones(k) / k, 'valid')[:n]
    src = L.glottal(f, total, jitter=0.02, vib=(4.6, 0.02), seed=seed)
    nasal = bp(src, 200, 330) + 0.5 * bp(src, 900, 1300) + 0.15 * bp(src, 2300, 2800)
    u = np.linspace(0, 1, n)
    return norm(lp(nasal, 2400) * np.clip(u / 0.06, 0, 1) * np.clip((1 - u) / 0.2, 0, 1))


def call(seed=0, glitch=False):
    """Llamado de dos sílabas, vocales a–o, tercera menor descendente F4→D4 (timbre de anciana)."""
    d1, d2 = 0.32, 0.55
    s1 = L.glottal(midi(F4) * (1 + 0.01 * np.linspace(0, 1, int(d1 * SR))), d1, jitter=0.025, vib=(5.5, 0.02), seed=seed)
    s1 = L.formants(s1 + 0.25 * noise(len(s1), seed + 1), 'a', q=0.12) * hann_env(len(s1), 0.03, 0.06)
    n2 = int(d2 * SR)
    t2 = np.arange(n2) / SR
    f2 = midi(D4) * (1 - 0.02 * t2 / d2)
    s2 = L.glottal(f2, d2, jitter=0.025, vib=(5.5, 0.025), seed=seed + 2)
    s2 = L.formants(s2 + 0.25 * noise(n2, seed + 3), 'o', q=0.12) * hann_env(n2, 0.04, 0.2)
    if glitch:  # la segunda sílaba se quiebra una octava arriba y se vuelve risita de niño
        cut = int(0.17 * SR)
        g = L.giggle(seed + 9, 5, 880)
        st = np.zeros(cut + len(g))
        st[:cut] = s2[:cut] * np.linspace(1, 0.6, cut)
        up = resample(s2[cut : cut + int(0.12 * SR)], 2.0)
        held = np.repeat(up[::40], 40)[: len(up)] * 0.8  # tartamudeo digital
        st[cut : cut + len(held)] += held
        o = cut + len(held) // 2
        st[o : o + len(g)] += g[: len(st) - o] * 0.9
        s2 = st
    gap = np.zeros(int(0.07 * SR))
    return norm(np.concatenate([s1, gap, s2]))


def whisper_reply(seed=0):
    """«¿a…?» susurrado, con entonación que sube."""
    d = 0.42
    n = int(d * SR)
    w = L.vowel_glide(noise(n, seed), ['h', 'a', 'a', 'h'], q=0.16)
    t = _t(d)
    w = bp(w, 400, 6000) * np.sin(np.pi * t / d) ** 0.7 * (1 + 0.4 * t / d)
    return norm(w)


def giggle_x(seed=0, f0=700, drive=0.0, wet_far=False):
    g = L.giggle(seed, 5 + seed % 3, f0)
    if drive:
        g = np.tanh(g * drive)
        g = np.repeat(g[::3], 3)[: len(g)]  # crush
        g = bp(g, 500, 7500)
    if wet_far:
        g = lp(g, 3200)
    return norm(g)


def blink_tick(seed=0):
    """Parpadeo colectivo húmedo: decenas de clics mínimos."""
    n = int(0.08 * SR)
    r = np.random.default_rng(seed)
    out = np.zeros(n)
    for _ in range(26):
        i0 = int(r.uniform(0, 0.035) * SR)
        m = int(0.004 * SR)
        out[i0 : i0 + m] += noise(m, int(r.integers(1e6))) * np.exp(-np.arange(m) / 40) * r.uniform(0.3, 1)
    return norm(bp(out, 1800, 5200))


def teponaztli(f0, vel=1.0, seed=0):
    """Dos resonadores modales de madera."""
    t = _t(0.45)
    s = np.sin(TAU * f0 * t) * np.exp(-t / 0.11) + 0.4 * np.sin(TAU * f0 * 2.31 * t) * np.exp(-t / 0.04)
    s += 0.15 * np.sin(TAU * f0 * 3.9 * t) * np.exp(-t / 0.015)
    s += bp(noise(len(t), seed), 900, 3500) * np.exp(-t / 0.003) * 0.4
    return s * vel


def huehuetl_sweep(vel=1.0, seed=0):
    """Huéhuetl: membrana que barre 80→45 Hz."""
    t = _t(0.7)
    f = 45 + 35 * np.exp(-t / 0.07)
    ph = TAU * np.cumsum(f) / SR
    s = (np.sin(ph) + 0.25 * np.sin(2.1 * ph)) * np.exp(-t / 0.22)
    s += lp(noise(len(t), seed), 1400) * np.exp(-t / 0.02) * 0.4
    return s * vel


def jarana_scrape(seed=0, dur=0.07):
    """Rasgueo apagado de jarana: ruido por filtro peine afinado (re)."""
    n = int(dur * SR)
    x = bp(noise(n, seed), 300, 5000) * np.exp(-np.arange(n) / (0.015 * SR))
    for f in (146.83, 220.0, 293.66):
        D = int(SR / f)
        y = x.copy()
        for k in range(1, 6):
            y[k * D :] += x[: n - k * D] * (0.6 ** k) if n > k * D else 0
        x = 0.5 * x + 0.5 * y
    return norm(x)


def knock(seed=0):
    """Golpe hondo de teponaztli para cada corte a la piedra."""
    return norm(teponaztli(98, 1.0, seed) + 0.6 * sfx.thump(120, 50, 0.45, 0.12))


def death_whistle(dur=1.1, seed=0):
    """Silbato de la muerte sintetizado: ruido por pasa-bandas de Q alto que barren 3.5→1.5 kHz."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    u = t / dur
    base = noise(n, seed) * (1 + 0.8 * np.abs(smooth_noise(n, 40, seed + 1)))
    fc = 3500 * (1500 / 3500) ** (u ** 0.8)
    out = np.zeros(n)
    hop = 512
    for i in range(0, n, hop):
        seg = base[i : i + hop * 2]
        c = float(fc[i])
        w = np.hanning(len(seg))
        y = bp(seg, c * 0.97, c * 1.03) + 0.6 * bp(seg, c * 1.47, c * 1.53) + 0.3 * bp(seg, c * 0.49, c * 0.51)
        out[i : i + len(seg)] += y * w
    e = np.clip(u / 0.03, 0, 1) * np.clip((1 - u) / 0.5, 0, 1) ** 1.2
    return norm(np.tanh(norm(out) * 2.5) * e)


def sub_boom(seed=0, dur=1.6):
    t = _t(dur)
    f = 38 + 70 * np.exp(-t / 0.035)
    ph = TAU * np.cumsum(f) / SR
    s = (np.sin(ph) + 0.3 * np.sin(2 * ph)) * np.exp(-t / 0.55) * np.minimum(1, t / 0.002)
    return norm(np.tanh(s * 1.6))


def noise_burst(seed=0, dur=0.35):
    n = int(dur * SR)
    t = _t(dur)
    return norm(bp(noise(n, seed), 180, 9000) * np.exp(-t / 0.07) * np.minimum(1, t / 0.001))


def cluster(notes, dur, attack=0.004, tau=0.8, seed=0):
    st = sfx.strings([midi(m) * (1 + 0.006 * (k % 3 - 1)) for k, m in enumerate(notes)], dur,
                     lambda u: np.minimum(1, u * dur / attack) * np.exp(-u * dur / tau), 5000, 1400, release=0.1, seed=seed)
    return st / (np.max(np.abs(st)) + 1e-9)


def clatter(seed=0):
    """Lámpara que cae y rebota en piedras (plástico duro)."""
    dur = 0.6
    n = int(dur * SR)
    out = np.zeros(n)
    for k, (dt, g) in enumerate([(0.0, 1.0), (0.085, 0.7), (0.15, 0.5), (0.2, 0.35), (0.235, 0.25), (0.26, 0.15)]):
        m = int(0.05 * SR)
        tt = np.arange(m) / SR
        hit = bp(noise(m, seed + k), 1000, 7000) * np.exp(-tt / 0.004)
        hit += (np.sin(TAU * 2250 * tt) + 0.6 * np.sin(TAU * 3120 * tt) + 0.4 * np.sin(TAU * 780 * tt)) * np.exp(-tt / 0.012) * 0.5
        i0 = int(dt * SR)
        out[i0 : i0 + m] += hit * g
    return norm(out)


def fizz(seed=0, dur=0.25):
    n = int(dur * SR)
    t = _t(dur)
    g = (np.random.default_rng(seed).random(n) < 0.05) * noise(n, seed + 1)
    return norm(bp(g + 0.3 * np.sign(np.sin(TAU * 120 * t)) * noise(n, seed + 2) * 0.2, 1500, 8000) * (1 - t / dur))


def saw_swell(dur=1.5, seed=0):
    """BRAAAM corto y saturado en re1/re2."""
    t = _t(dur)
    out = np.zeros(len(t))
    for m, a in ((26, 1.0), (38, 0.7), (45, 0.25)):
        for det in (-0.003, 0.004):
            ph = (midi(m) * (1 + det) * t) % 1.0
            out += a * (2 * ph - 1)
    u = t / dur
    e = np.minimum(1, t / 0.035) * np.exp(-np.maximum(0, t - 0.25) / 0.45)
    x = np.tanh(out * 1.8) * e
    return norm(L.lp_sweep(x, 180, 2000, np.exp(-u * 4)))


def mud_burst(seed=0):
    dur = 0.9
    n = int(dur * SR)
    out = sfx.rustle(seed, dur) * 0.8
    r = np.random.default_rng(seed)
    for _ in range(7):
        m = mud(int(r.integers(1e6)))
        i0 = int(r.uniform(0, 0.4) * SR)
        out[i0 : i0 + len(m)] += m[: n - i0] * r.uniform(0.2, 0.6)
    return norm(out)


def papery(seed=0, dur=0.35):
    """Pétalos secos que se desmoronan."""
    n = int(dur * SR)
    r = np.random.default_rng(seed)
    imp = (r.random(n) < 0.004) * r.normal(0, 1, n)
    k = np.exp(-np.arange(int(0.004 * SR)) / 60)
    g = np.convolve(imp, k)[:n]
    return norm(bp(g, 2000, 9000) + 0.4 * bp(g, 700, 2500))


def fuse_crackle(dur, pan_fr, seed=0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    r = np.random.default_rng(seed)
    pops = (r.random(n) < 0.012) * r.normal(0, 1, n) * (0.5 + r.random(n))
    hiss = bp(noise(n, seed + 1), 3000, 9000) * 0.25 * (0.7 + 0.3 * smooth_noise(n, 30, seed + 2))
    x = bp(pops, 1500, 9000) + hiss + 0.4 * bp(pops, 400, 1500)
    x *= hann_env(n, 0.05, 0.06)
    pan = np.interp(t * FPS, np.arange(len(pan_fr)), pan_fr) * 1.6
    return panned(norm(x), np.clip(pan, -0.8, 0.8))


def patter(seed=0):
    n = int(0.09 * SR)
    t = _t(0.09)
    return norm(sfx.thump(220, 120, 0.09, 0.015) * 0.5 + bp(noise(n, seed), 500, 3000) * np.exp(-t / 0.008))


def slap(seed=0):
    """Palmada mojada de mano pequeña en el lente + golpe sordo."""
    n = int(0.5 * SR)
    t = _t(0.5)
    s = bp(noise(n, seed), 300, 6000) * np.exp(-t / 0.018) * np.minimum(1, t / 0.0005)
    sq = lp(noise(n, seed + 1), 1300) * np.exp(-((t - 0.06) / 0.04) ** 2) * 0.35
    th = sfx.thump(110, 48, 0.5, 0.1) * 0.8
    return norm(s + sq + th)


def tempo_beats(t0, t1, bpm0, bpm1, power=1.5):
    out, t = [], t0
    while t < t1:
        out.append(t)
        u = (t - t0) / (t1 - t0)
        t += 60 / (bpm0 + (bpm1 - bpm0) * u ** power)
    return out


def phrase_times(notes, t0, beat):
    out, t = [], t0
    for m, d in notes:
        out.append((t, m, d * beat))
        t += d * beat
    return out


# ---------- partitura ----------
def score(bus):
    """Coloca música y efectos en el bus. Regresa el segundo donde empieza el outro estándar."""
    X = Mix(bus.n / SR)
    f = fr
    end = f(LEN)

    # ===== B1 (0–90) · la piedra: sin música. Río, viento en niebla, grillos escasos =====
    X.put(flash_click(1), f(EV['torchOn']), 0.55, 0.25)
    torch_tab = [0.8, 0.8, 0, 0, 0, 0.85, 1.0, 0.95, 0.9, 1, 1, 1, 0.9, 0.6, 0.35, 0.2, 0.12, 0.08] + [0.05] * 60
    X.put(filament(torch_tab, 2), f(EV['torchOn']), 0.035, 0.2)
    X.put(flash_click(3) * 0.5, f(EV['torchOn'] + 5), 0.2, 0.25)  # vuelve a prender tras el parpadeo
    rv = M.river(4.0, 11)
    X.put(rv * hann_env(len(rv), 0.12, 0.05), f(5), 0.055, 0.0, wet=0.15, until=90)
    wb = sfx.wind_bed(int(3.2 * SR), 41)
    X.put(wb * hann_env(wb.shape[1], 0.3, 0.05), f(5), 0.05, until=90)
    cr = crickets3(3.0, 12)
    X.put(cr * hann_env(len(cr), 0.15, 0.05), f(5), 0.012, 0.1, until=90)
    X.put(giggle_x(21, 700, wet_far=True), f(EV['giggle1']), 0.16, 0.95, wet=0.55)  # risita mojada, extremo derecho
    X.put(sfx.rustle(22, 0.9), f(EV['whip1']), 0.12, 0.6, wet=0.12)
    X.put(whoosh(0.28, 23, 400, 2600), f(EV['whip1'] - 2), 0.05, 0.4)
    X.put(sfx.air(24, f(14), (400, 1200), (1200, 6000)), f(76), 0.09, 0.0, wet=0.3, until=91)

    # ===== B2 (90–246) · memoria: cocina, reloj 1 Hz (EL MOTIVO), cuna en guitarra de nylon + arpa =====
    k0, k1 = f(90), f(264)
    room = lp(pink(int((k1 - k0) * SR), 31), 450) + 0.06 * hp(noise(int((k1 - k0) * SR), 32), 6000)  # tono de cuarto + siseo de cinta
    room *= hann_env(len(room), 0.08, f(18))
    X.put(room, k0, 0.05)
    vel = crackle(k1 - k0, 33, 5.0) + 0.25 * lp(pink(int((k1 - k0) * SR), 34), 300)
    X.put(vel * hann_env(len(vel), 0.1, f(18)), k0, 0.06, -0.3, wet=0.25, room='cocina')
    X.put(ticks([3.2 + k for k in range(6)], 35), 0, 0.15, 0.35, wet=0.3, room='cocina', until=264)
    X.put(cloth(1.45, 36), f(94), 0.06, -0.15, wet=0.2, room='cocina')
    X.put(cloth(0.75, 37), f(140), 0.07, 0.0, wet=0.2, room='cocina')
    X.put(squeak(38), f(EV['knot']), 0.05, 0.05, wet=0.2, room='cocina')
    X.put(pat(39), f(EV['pat1']), 0.14, 0.0, wet=0.2, room='cocina')
    X.put(pat(40), f(EV['pat2']), 0.11, 0.0, wet=0.2, room='cocina')
    X.put(cloth(0.6, 41), f(EV['lift0']), 0.05, 0.1, wet=0.2, room='cocina')
    # canción de cuna (66 bpm): melodía en nylon, contracanto de arpa
    beat = 60 / 66
    t0 = 3.12
    mus = np.zeros((2, int(8.0 * SR)))

    def mput(sig, at, g, pan):
        st = panned(sig, pan) * g
        i0 = int((at - t0) * SR)
        m = min(st.shape[1], mus.shape[1] - i0)
        mus[:, i0 : i0 + m] += st[:, :m]

    for k, (tt, m, d) in enumerate(phrase_times(PHRASE1, t0, beat)):
        mput(nylon(m, max(1.6, d + 1.0), 1.0, 50 + k, 0.4), tt, 0.5, -0.05)
    for k, (bt, m) in enumerate([(0, 50), (1, 57), (2, 65), (3, 43), (3.5, 50), (4, 45), (4.5, 61), (5, 52), (6, 50), (6.02, 57), (6.04, 53)]):
        mput(harp(m, 2.6, 1.0, 70 + k), t0 + bt * beat, 0.28 if bt < 6 else 0.22, 0.2)
    mput(nylon(38, 3.5, 1.0, 69, 0.25), t0, 0.32, 0.0)
    mus = warble(mus, 8.0, 0.4) * np.atleast_2d(hann_env(mus.shape[1], 0.01, 1.0))
    X.put(mus, t0, 0.5, wet=0.35, room='cocina')
    X.put(sfx.air(42, 1.1, (200, 700), (700, 2200)), f(232), 0.04, 0.0, wet=0.3)  # humo

    # ===== B3 (246–348) · bajé al río: pasos 1.8 Hz, río, grillos y ranas, tecolote, flauta de barro + chelo =====
    b3, b4 = f(246), f(348)
    rv = M.river(16.0, 51)
    rv_env = np.interp(_t(16.0), [0, f(18), b4 - b3, b4 - b3 + 0.05, f(434) - b3, f(434) - b3 + 0.003, 16], [0, 0.6, 0.75, 1.0, 1.0, 0.035, 0.035])
    X.put(rv * rv_env, b3, 0.07, -0.15, wet=0.12, until=EV['still0'])  # el río (cae −29 dB en 434, muere al silencio 606)
    cr = crickets3(f(434) - b3, 52)
    X.put(cr * hann_env(len(cr), f(18), 0.0), b3, 0.016, 0.15, until=EV['silence'], cut=0.003)
    fg = frogs(f(434) - b3, 53, 1.4)
    X.put(fg * hann_env(len(fg), f(18), 0.0), b3, 0.03, -0.35, until=EV['silence'], cut=0.003)
    wb = sfx.wind_bed(int((f(EV['still0']) - b3) * SR), 54)
    X.put(wb * hann_env(wb.shape[1], f(18), 0.2), b3, 0.03, until=EV['still0'])
    walk = np.arange(b3 + 0.18, f(318), 1 / 1.8)
    for k, tt in enumerate(walk):
        X.put(step(60 + k, 'hojas' if k % 3 else 'grava', 1.0), tt, 0.16 * (0.75 + 0.25 * np.sin(k)), -0.2 if k % 2 else 0.2, wet=0.08)
    X.put(L.owl(61, hoots=(0.0, 0.36)), f(EV['owlHoot']), 0.06, -0.75, wet=0.5)
    for k in range(3):
        X.put(snap_stem(62 + k), f(EV['snap']) + k * 0.045, 0.22 - 0.04 * k, -0.15 + 0.08 * k, wet=0.1)
    X.put(sfx.rustle(65, 0.6), f(EV['snap']) + 0.05, 0.08, -0.1)
    X.put(sfx.rustle(66, 0.5), f(306), 0.05, -0.2)
    # flauta de barro sobre bordón de chelo en re
    fl_beat = 0.55
    for k, (tt, m, d) in enumerate(phrase_times(PHRASE1, 8.45, fl_beat)):
        dd = d if k < 7 else 0.5
        s = M.flute(midi(m), dd + 0.05, 1.0, 0.008, seed=80 + k)
        s = s + 0.12 * bp(noise(len(s), 90 + k), 600, 3000) * hann_env(len(s), 0.04, 0.1)  # soplo
        X.put(s, tt, 0.13, 0.1, wet=0.45, until=EV['b4'] + 3)
    X.put(sfx.strings([midi(38), midi(50)], 3.6, lambda u: np.minimum(1, u / 0.25) * np.clip((1 - u) / 0.12, 0, 1), 700, 900, release=0.1, seed=91),
          8.3, 0.11, wet=0.3, until=EV['b4'] + 2)
    X.put(M.pluck(midi(62) * 1.008, 2.0, 0.75, 0.996, 1.0, seed=92), 11.32, 0.18, 0.35, wet=0.4)  # requinto contesta, desafinado

    # ===== B4 (348–522) · el río: agua, dron bajo el reflejo (sin golpe), latigazos, los grillos se callan =====
    X.put(water_cup(100), f(EV['cup0']), 0.18, 0.0, wet=0.1)
    dr = L.drone_dark(1.6, root=38, seed=101)
    X.put(dr * hann_env(len(dr), 0.8, 0.5), f(EV['refl0']), 0.07, wet=0.3)
    X.put(sfx.rustle(102, 0.35), f(EV['reflTilt']), 0.05, 0.35)
    X.put(whoosh(0.3, 103, 300, 3600), f(EV['whipTurn']) - 0.05, 0.2, -0.4)
    X.put(cloth(0.35, 104), f(EV['whipTurn']), 0.08, -0.1)
    X.put(whoosh(0.26, 105, 300, 3000), f(EV['whipBack']) - 0.06, 0.13, 0.4)
    X.put(scrape(106, 0.3), f(EV['whipBack']), 0.16, 0.45, wet=0.1)
    jit = [0.03, -0.04, 0.02, 0.04, -0.03, 0.01]
    X.put(ticks([0.15 + k + jit[k % 6] for k in range(6)], 107), f(EV['silence']), 0.045, 0.3, wet=0.4, until=EV['still0'])
    X.put(inhale(108, 0.6), f(EV['wrist0']), 0.12, 0.0)

    # ===== B5 (522–738) · la voz =====
    X.put(hum(PHRASE1[:6], 0.33, 110), f(EV['hum']), 0.09, 0.45, wet=0.85, room='lejos', until=EV['still0'])  # frase incompleta, sin resolver
    X.put(lp(call(111), 2600), f(EV['call1']), 0.10, 0.35, wet=0.9, room='lejos', until=EV['still0'])
    X.put(sfx.rustle(112, 0.4), f(EV['dart0']), 0.05, np.linspace(-0.7, 0.7, int(0.4 * SR)), wet=0.15, until=EV['still0'])
    # silencio 606–660: tono de cuarto a −60 dB y tinnitus de 8 kHz (de 606 hasta el cero de 712)
    rt = lp(pink(int(f(712 - 606) * SR), 113), 400)
    X.put(rt, f(606), 0.0045)
    tn = np.sin(TAU * 8000 * _t(f(712 - 606)))
    X.put(tn * hann_env(len(tn), 0.4, 0.05), f(606), 0.0016)
    X.put(whoosh(0.22, 114, 400, 2400), f(EV['whipL']) - 0.04, 0.05, -0.5)
    X.put(call(115, glitch=True), f(EV['whipL']), 0.30, -0.6)  # cerca, a la izquierda y SECO
    X.put(inhale(116, 0.32), f(EV['inhale']), 0.10, 0.0)
    rep = whisper_reply(117)
    X.put(rep, f(EV['reply']), 0.12, 0.05)
    for k, (fe, pn, ratio) in enumerate(zip(EV['echoes'], (-0.85, 0.85, 0.0), (1.05, 1.11, 1.18))):
        e = resample(rep, ratio)
        if pn == 0.0:  # detrás: apagado
            e = lp(e, 1500)
        X.put(e, f(fe), 0.075, pn, wet=0.35, until=EV['zero'])
    dr = L.drone_dark(f(712 - 670), root=37, seed=118)
    X.put(dr * np.linspace(0, 1, len(dr)) ** 2, f(670), 0.06, until=EV['zero'])
    # erupción 720: golpe grave, ~8 risitas alrededor, acorde-racimo de cajita con las notas de la cuna
    X.put(sfx.boom(119), f(EV['erupt']), 0.45, wet=0.25)
    for k, pn in enumerate((-1.0, -0.7, -0.4, -0.12, 0.15, 0.45, 0.72, 1.0)):
        X.put(giggle_x(120 + k, 560 + 70 * k), f(EV['erupt']) + 0.012 * ((k * 5) % 7), 0.11, pn, wet=0.3)
    mb = sum(M.musicbox(midi(m + 12) * (1 + 0.007 * ((k * 3) % 5 - 2)), 2.2, 1.0) for k, m in enumerate((D4, F4, A4, E4, G4)))
    X.put(norm(mb), f(EV['erupt']), 0.16, 0.1, wet=0.45)
    X.put(blink_tick(130), f(EV['blinkAll']), 0.03, 0.0, wet=0.2)

    # ===== B6 (738–849) · corrí: pasos 3 Hz, jadeo, latido 110 → tambores que aceleran, reloj 1→4 Hz, alto total 843 =====
    r6, stop = f(EV['b6']), f(EV['stop'])
    stones = [(765, 775), (792, 802), (819, 849)]
    for k, ff in enumerate(range(740, 819, 10)):
        if any(a <= ff < b for a, b in stones):
            continue
        X.put(step(140 + k, 'hojas', 1.0), f(ff), 0.2, -0.15 if k % 2 else 0.15, wet=0.05, until=EV['stop'])
        if k % 2 == 0:
            X.put(mud(160 + k), f(ff) + 0.01, 0.06, 0.0, until=EV['stop'])
    for k, tt in enumerate(np.arange(r6 + 0.05, stop, 0.36)):
        X.put(breath_out(170 + k, 0.24) if k % 2 == 0 else hp(inhale(190 + k, 0.2), 900), tt, 0.07, 0.0, until=EV['stop'])
    hb = [r6 + k * 60 / 110 for k in range(3)]
    for k, tt in enumerate(hb):
        X.put(sfx.heartbeat(200 + k), tt, 0.4, until=EV['stop'])
    beats = tempo_beats(hb[-1], stop, 110, 185)
    for k, tt in enumerate(beats):
        X.put(huehuetl_sweep(1.0, 210 + k), tt, 0.32, 0.0, wet=0.1, until=EV['stop'])
        X.put(teponaztli(330 if k % 2 else 247, 1.0, 230 + k), tt + 30 / 185 / 1.0 * 0.5 * (60 / 110 * 185 / 60) * 0.5, 0.12, -0.3 if k % 2 else 0.3, wet=0.15, until=EV['stop'])
    for k, tt in enumerate(np.arange(r6 + 0.1, stop, 60 / 160 / 2)):
        X.put(jarana_scrape(250 + k), tt, 0.035, 0.25 if k % 2 else -0.25, until=EV['stop'])
    clk, tt = [], r6
    while tt < stop:
        clk.append(tt)
        u = (tt - r6) / (stop - r6)
        tt += 1 / (1 + 3 * u ** 1.3)
    X.put(ticks([c - r6 for c in clk], 300), r6, 0.09, 0.3, until=EV['stop'])
    X.put(L.riser(stop - r6 + 0.2, 301, 50), r6, 0.16, until=EV['stop'])
    X.put(cluster([50, 51, 56, 62], stop - r6 + 0.3, attack=2.0, tau=10, seed=302), r6, 0.07, until=EV['stop'])
    for c in (EV['cut2'], EV['cut3'], EV['cut4']):
        kn = knock(310 + c)
        sw = L.reverse_swell(kn, 0.4)
        X.put(sw[-int(0.4 * SR):], f(c) - 0.4, 0.14, until=EV['stop'])
        X.put(kn, f(c), 0.55, wet=0.3, until=EV['stop'])
    for k, (at, p0, p1) in enumerate([(25.15, -0.85, 0.85), (25.95, 0.85, -0.85), (26.75, -0.6, 0.75), (27.55, 0.7, -0.7)]):
        g = giggle_x(330 + k, 760 + 40 * k)
        X.put(g, at, 0.07, np.linspace(p0, p1, len(g)), wet=0.3, until=EV['stop'])
    for k, sf in enumerate((744, 756, 779, 806, 813)):
        X.put(whoosh(0.22, 340 + k, 500, 4500), f(sf) - 0.08, 0.1, (-0.5, 0.5, -0.3, 0.4, -0.6)[k], until=EV['stop'])
        X.put(sfx.rustle(345 + k, 0.25), f(sf), 0.08, (-0.5, 0.5, -0.3, 0.4, -0.6)[k], until=EV['stop'])

    # ===== B7 (849–948) · casi silencio: gotas cada 1.1 s, tinnitus; cero 927–930; GOLPE 930 =====
    rt = lp(pink(int(f(927 - 849) * SR), 400), 300)
    X.put(rt * hann_env(len(rt), 0.3, 0.0), f(849), 0.004, until=EV['zero2'])
    for k, d in enumerate(EV['drips']):
        X.put(drip(401 + k, 900 + 60 * k), f(d), 0.12, -0.2 + 0.2 * k, wet=0.6, until=EV['zero2'])
    tn = np.sin(TAU * 8000 * _t(f(927 - 860)))
    X.put(tn * np.linspace(0, 1, len(tn)) ** 1.5, f(860), 0.0028, until=EV['zero2'])
    X.put(_hand_tremor(410), f(912), 0.03, 0.0, until=EV['zero2'])
    J = f(EV['jump'])
    X.put(sub_boom(420), J, 0.95, until=EV['b8'], cut=0.002)
    X.put(noise_burst(421), J, 0.5, 0.0, wet=0.2, until=EV['b8'], cut=0.002)
    X.put(cluster([50, 51, 56, 62, 63, 68], 1.6, 0.004, 0.7, 422), J, 0.55, wet=0.35, until=EV['b8'], cut=0.002)
    X.put(death_whistle(1.0, 423), J + 0.01, 0.38, 0.1, wet=0.3, until=EV['b8'], cut=0.002)
    X.put(giggle_x(424, 1150, drive=6.0), J + 0.05, 0.2, -0.15, wet=0.2, until=EV['b8'], cut=0.002)
    X.put(clatter(425), f(EV['torchDrop']), 0.32, 0.2, wet=0.15, until=EV['b8'], cut=0.002)
    die = [0.6, 0.6, 0, 0.5, 0.1, 0.1, 0]
    X.put(fizz(426, 0.2) * np.interp(_t(0.2) * FPS, np.arange(7), die), f(EV['torchDie']), 0.18, 0.2, until=EV['b8'], cut=0.002)

    # ===== B8 (948–1014) · negro + título: cero, reverse swell 0.15 s, huéhuetl + coro «oo» + BRAAAM =====
    S = f(EV['slam'])
    hit = M.huehuetl(1.2, 0.9, seed=430)
    ch = M.choir([38, 45, 50, 53], 2.4, 'u', 1.0, seed=431, attack=0.08)
    sw = saw_swell(1.6, 432)
    rs = L.reverse_swell(norm(sw[: int(0.5 * SR)] + 0.5 * hit[: int(0.5 * SR)]), 0.5)
    X.put(rs[-int(0.15 * SR):] * np.linspace(0.2, 1, int(0.15 * SR)) ** 2, S - 0.15, 0.3)
    X.put(hit, S, 0.75, 0.0, wet=0.3)
    X.put(sfx.boom(433), S, 0.4, wet=0.2)
    X.put(ch, S, 0.22, 0.0, wet=0.6)
    X.put(sw, S, 0.34, 0.0, wet=0.25)
    X.put(mud_burst(434), S, 0.16, 0.0, wet=0.1)
    X.put(sfx.air(435, 0.4, (300, 900), (900, 3000)), f(EV['sink']) - 0.1, 0.05, wet=0.4)

    # ===== B9 (1014–1122) · amanecer: pájaros, campana lejana ×2, perro, viento en hojas secas, arpa con la cuna =====
    b9, b10 = f(EV['b9']), f(EV['b10'])
    wb = sfx.wind_bed(int((f(1188) - b9) * SR), 440)
    X.put(wb * hann_env(wb.shape[1], 1.0, 0.4), b9, 0.05)
    lv = sfx.rustle(441, f(1188) - b9) * 0.6
    X.put(lv * hann_env(len(lv), 1.0, 0.4), b9, 0.025, 0.2)
    for k, at in enumerate((33.55, 34.2, 34.9, 35.25, 35.9, 36.5, 36.8, 37.15)):
        X.put(M.chirp(450 + k, 2 + k % 3), at, 0.045 * (0.7 + 0.3 * (k % 2)), (-0.6, 0.5, -0.2, 0.7, -0.4, 0.3, -0.7, 0.55)[k], wet=0.4, until=EV['b10'], cut=0.003)
    for k, at in enumerate((34.3, 36.15)):
        X.put(lp(sfx.bell(220.0, 4.5), 2200), at, 0.07, -0.35, wet=0.8, room='lejos')
    X.put(lp(L.dog_bark(460), 1600), 35.55, 0.05, 0.6, wet=0.7, room='lejos')
    X.put(lp(L.dog_bark(461), 1600), 35.78, 0.035, 0.6, wet=0.7, room='lejos')
    for k, at in enumerate((34.1, 35.0, 36.0, 36.9)):
        X.put(papery(470 + k, 0.3), at, 0.05, 0.25)
    for k, (tt, m, d) in enumerate(phrase_times(PHRASE1, 33.9, 0.7)):
        X.put(harp(m, 3.2 if k < 7 else 4.5, 1.0, 480 + k), tt, 0.2, 0.05, wet=0.45)
    for k, (at, m) in enumerate(((33.9, 50), (34.95, 57), (36.0, 46), (36.7, 45))):
        X.put(harp(m, 2.6, 1.0, 490 + k), at, 0.12, -0.15, wet=0.45)

    # ===== B10 (1122–1188) · sólo viento, un re grave de nylon, pétalo =====
    X.put(nylon(38, 4.0, 1.0, 500, 0.3), b10, 0.3, 0.0, wet=0.35)
    X.put(nylon(50, 3.0, 1.0, 501, 0.3), b10 + 0.01, 0.12, 0.0, wet=0.35)
    dr = L.drone_dark(f(1188 - 1122) + 0.5, root=38, seed=502)
    X.put(dr * hann_env(len(dr), 1.2, 0.5), b10, 0.05)
    X.put(papery(503, 0.12), f(EV['petalLand']), 0.04, 0.3)

    # ===== B11 (1188–1227) · mecha que viaja (paneo con la brasa), whoosh, BOOM + campana de marimba =====
    F0, F1 = f(EV['fuse0']), f(EV['fuse1'])
    X.put(fuse_crackle(F1 - F0 + 0.03, FUSE_PAN, 510), F0, 0.16)
    X.put(whoosh(F1 - F0, 511, 200, 5000, 0.97), F0, 0.12, 0.0, wet=0.2)
    X.put(sfx.boom(512), F1, 0.7, 0.0, wet=0.45)
    X.put(L.sub_drop(2.0, 513), F1, 0.3)
    X.put(sfx.marimba(midi(74), 2.6, 514), F1, 0.22, 0.0, wet=0.55)
    X.put(sfx.bell(midi(86), 2.4), F1 + 0.01, 0.05, 0.1, wet=0.6)

    # ===== B12 (1227–1335) · cajita con la última frase (último re un cuarto de tono bajo), pasitos, risita SECA, palmada =====
    l0 = f(1227)
    pad = sfx.strings([midi(50), midi(57)], end - l0 + 0.5, lambda u: np.minimum(1, u / 0.2) * 1.0, 500, 600, release=0.05, seed=520)
    X.put(pad, l0, 0.05, until=LEN)
    em = crackle(end - l0, 521, 4.0, 1200, 5000) + 0.2 * lp(pink(int((end - l0) * SR), 522), 400)
    X.put(em * hann_env(len(em), 0.5, 0.0), l0, 0.05, 0.0, until=LEN)
    for k, (tt, m, d) in enumerate(phrase_times(PHRASE_LAST, 41.1, 0.65)):
        X.put(M.musicbox(midi(m + 12) * (1 + 0.004 * ((k * 3) % 3 - 1)), 2.0 if k < 5 else 2.6, 1.0), tt, 0.2, 0.1, wet=0.5, until=LEN)
    for k, pf in enumerate(np.arange(EV['prints0'], EV['prints1'] + 0.1, 3.6)):
        u = (pf - EV['prints0']) / (EV['prints1'] - EV['prints0'])
        X.put(patter(530 + k), f(pf), 0.05 + 0.07 * u, 0.15 + 0.4 * u, wet=0.1 * (1 - u), until=LEN)
    X.put(giggle_x(540, 760), f(EV['giggle2']), 0.2, 0.0)  # cerca, al centro, TOTALMENTE seca
    X.put(slap(541), f(EV['slap']), 0.6, -0.2)

    bus.place2(X.finish(), 0.0)
    return end


def _hand_tremor(seed=0):
    """Respiración contenida mientras la mano se acerca (912–927)."""
    d = f_ = 0.5
    n = int(d * SR)
    t = _t(d)
    v = L.formants(noise(n, seed), 'h', q=0.3) * (0.6 + 0.4 * np.sign(np.sin(TAU * 8 * t))) * np.sin(np.pi * t / d)
    return norm(hp(v, 600)) * (1 if f_ else 1)
