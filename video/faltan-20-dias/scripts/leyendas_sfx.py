"""Bloques de diseño sonoro para la serie de leyendas (terror de leyenda, sin muestras: todo sintetizado).

Cada función regresa un arreglo mono float (o estéreo (2, n) cuando se indica) a SR = 48 kHz.
Se usan desde las partituras de cada día (scripts/leyendas/dXX.py) con Bus.place / place2.
"""
import numpy as np
from scipy.signal import lfilter

import sfx
from sfx import SR, bp, hp, lp, noise, pink, smooth_noise

TAU = 2 * np.pi


def _t(dur):
    return np.arange(int(dur * SR)) / SR


def env_adsr(n, a, d, s, r):
    e = np.ones(n) * s
    A, D, R = int(a * SR), int(d * SR), int(r * SR)
    A = min(A, n)
    e[:A] = np.linspace(0, 1, A)
    D = min(D, n - A)
    e[A : A + D] = np.linspace(1, s, D)
    if R > 0:
        R = min(R, n)
        e[-R:] *= np.linspace(1, 0, R)
    return e


def lp_sweep(x, f0, f1, curve=None):
    """Paso bajo que se abre de f0 a f1 (mezcla de bancos fijos; curve en 0..1 por muestra)."""
    n = len(x)
    u = np.linspace(0, 1, n) if curve is None else np.clip(curve, 0, 1)
    fs = np.geomspace(f0, f1, 5)
    bank = [lp(x, f) for f in fs]
    k = u * (len(fs) - 1)
    i0 = np.clip(np.floor(k).astype(int), 0, len(fs) - 2)
    w = k - i0
    st = np.stack(bank)
    return st[i0, np.arange(n)] * (1 - w) + st[i0 + 1, np.arange(n)] * w


def norm(x, peak=1.0):
    m = np.max(np.abs(x)) + 1e-12
    return x / m * peak


def formants(src, vowel, q=0.12):
    """Filtra una fuente por los formantes de una vocal (o una secuencia de vocales interpolada)."""
    F = {'a': (800, 1150, 2900), 'e': (500, 1700, 2500), 'i': (300, 2200, 3000), 'o': (450, 800, 2830), 'u': (325, 700, 2530), 'h': (600, 1500, 3500)}
    out = np.zeros_like(src)
    for fc, g in zip(F[vowel], (1.0, 0.55, 0.22)):
        out += bp(src, fc * (1 - q), fc * (1 + q)) * g
    return out


def vowel_glide(src, seq, q=0.12):
    """Formantes que se deslizan entre vocales a lo largo de la señal (seq = ['a','a','i'])."""
    n = len(src)
    parts = [formants(src, v, q) for v in seq]
    k = np.linspace(0, len(seq) - 1, n)
    i0 = np.clip(np.floor(k).astype(int), 0, len(seq) - 1)
    i1 = np.clip(i0 + 1, 0, len(seq) - 1)
    u = k - np.floor(k)
    stack = np.stack(parts)
    return stack[i0, np.arange(n)] * (1 - u) + stack[i1, np.arange(n)] * u


def glottal(f0, dur, jitter=0.006, vib=(5.2, 0.012), seed=0):
    """Fuente vocal: sierra suavizada con vibrato y microvariaciones (f0 puede ser arreglo)."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    r = np.random.default_rng(seed)
    f = np.asarray(f0, dtype=float) * np.ones(n)
    f = f * (1 + vib[1] * np.sin(TAU * vib[0] * t + r.uniform(0, 6)) + jitter * smooth_noise(n, 18.0, seed + 1))
    ph = np.cumsum(f) / SR
    saw = 2 * (ph % 1.0) - 1
    return lp(saw, 4500)


# ---------- voces sin palabras ----------
def wail(dur=2.6, f0=520.0, seed=0, seq=('a', 'a', 'a', 'i', 'i'), drop=0.35):
    """Lamento femenino "aaay…" que sube y se quiebra hacia abajo (para La Llorona)."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    u = t / dur
    curve = 1 + 0.12 * np.sin(np.pi * np.clip(u * 1.4, 0, 1)) - drop * np.clip((u - 0.6) / 0.4, 0, 1) ** 1.6
    src = glottal(f0 * curve, dur, jitter=0.012, vib=(5.6, 0.018), seed=seed)
    breath = bp(noise(n, seed + 3), 900, 5000) * 0.35
    v = vowel_glide(src + breath, list(seq), q=0.1)
    e = np.clip(u / 0.12, 0, 1) ** 1.5 * np.clip((1 - u) / 0.35, 0, 1) ** 1.2
    return norm(v * e)


def whisper(dur=2.0, seed=0, rate=6.5, bright=1.0):
    """Susurro ininteligible: aire filtrado por formantes cambiantes con sílabas."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    r = np.random.default_rng(seed)
    air = noise(n, seed)
    seq = [r.choice(['a', 'e', 'i', 'o', 'u', 'h']) for _ in range(max(2, int(dur * rate / 2)))]
    v = vowel_glide(air, seq, q=0.18)
    syl = np.clip(np.sin(TAU * rate * 0.5 * t + r.uniform(0, 6)) + 0.35 * smooth_noise(n, rate, seed + 5), 0, None) ** 1.5
    s = bp(air, 4500, 9000) * 0.25 * bright * (syl > 0.6)
    e = np.clip(t / 0.15, 0, 1) * np.clip((dur - t) / 0.25, 0, 1)
    return norm((v * syl + s) * e)


def giggle(seed=0, n_notes=5, f0=620.0):
    """Risita aguda "je-je-je" (chaneques): golpes de voz cortos que bajan de tono."""
    r = np.random.default_rng(seed)
    parts = []
    f = f0 * r.uniform(0.92, 1.1)
    for k in range(n_notes):
        d = r.uniform(0.07, 0.11)
        nn = int(d * SR)
        tt = np.arange(nn) / SR
        src = glottal(f * (1 - 0.15 * tt / d), d, jitter=0.02, vib=(9, 0.01), seed=seed + k)
        v = formants(src + 0.3 * noise(nn, seed + 30 + k), 'e' if k % 2 else 'i', q=0.15)
        e = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 0.7
        parts.append(v * e)
        parts.append(np.zeros(int(r.uniform(0.03, 0.06) * SR)))
        f *= r.uniform(0.9, 0.97)
    return norm(np.concatenate(parts))


def sigh(seed=0, dur=1.4):
    """Suspiro / exhalación cerca del oído."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    v = formants(noise(n, seed), 'h', q=0.25)
    e = np.clip(t / 0.25, 0, 1) * np.exp(-np.clip(t - 0.25, 0, None) / 0.4)
    return norm(v * e)


# ---------- animales ----------
def owl(seed=0, hoots=(0.0, 0.42, 0.62)):
    """Tecolote: "uh… uh-uh"."""
    r = np.random.default_rng(seed)
    total = hoots[-1] + 0.5
    out = np.zeros(int(total * SR))
    for k, t0 in enumerate(hoots):
        d = 0.32 if k == 0 else 0.22
        nn = int(d * SR)
        tt = np.arange(nn) / SR
        f = 390 * r.uniform(0.97, 1.03) * (1 + 0.04 * np.sin(np.pi * tt / d))
        s = np.sin(TAU * np.cumsum(f) / SR) + 0.25 * np.sin(2 * TAU * np.cumsum(f) / SR)
        s += 0.08 * bp(noise(nn, seed + k), 300, 900)
        e = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 1.2
        i0 = int(t0 * SR)
        out[i0 : i0 + nn] += s * e
    return norm(out)


def howl(dur=3.2, seed=0, f0=480.0):
    """Aullido de coyote: sube, ondula y cae (con armónicos y vocal "uuu-oo")."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    u = t / dur
    curve = 0.72 + 0.4 * np.clip(u / 0.25, 0, 1) ** 0.6 - 0.45 * np.clip((u - 0.7) / 0.3, 0, 1) ** 1.4
    curve *= 1 + 0.02 * np.sin(TAU * 4.5 * t)
    src = glottal(f0 * curve, dur, jitter=0.01, vib=(4.8, 0.01), seed=seed)
    v = vowel_glide(src, ['u', 'o', 'o', 'u'], q=0.14)
    e = np.clip(u / 0.08, 0, 1) * np.clip((1 - u) / 0.25, 0, 1)
    return norm(v * e)


def dog_bark(seed=0):
    d = 0.18
    nn = int(d * SR)
    tt = np.arange(nn) / SR
    src = glottal(330 * (1 - 0.3 * tt / d), d, jitter=0.03, seed=seed) + 0.6 * noise(nn, seed + 1)
    v = formants(src, 'a', q=0.2)
    return norm(v * np.exp(-tt / 0.06) * np.clip(tt / 0.004, 0, 1))


def hooves(dur=4.0, bpm=110, seed=0, gallop=True, dist=0.0):
    """Cascos: galope (tres golpes por ciclo) o paso; dist 0 cerca … 1 lejos."""
    n = int(dur * SR)
    out = np.zeros(n)
    r = np.random.default_rng(seed)
    beat = 60.0 / bpm
    pattern = [0.0, 0.16, 0.32] if gallop else [0.0, 0.5]
    tt = 0.0
    k = 0
    while tt < dur:
        for off in pattern:
            at = tt + off * beat + r.uniform(-0.006, 0.006)
            if at >= dur:
                break
            m = int(0.16 * SR)
            x = np.arange(m) / SR
            hit = sfx.thump(160, 70, 0.16, 0.035) * 0.9 + bp(noise(m, seed + k), 900, 5000) * np.exp(-x / 0.01) * 0.7
            i0 = int(at * SR)
            out[i0 : i0 + m] += hit[: n - i0] * r.uniform(0.7, 1.0)
            k += 1
        tt += beat
    if dist > 0:
        out = lp(out, 6000 - 5000 * dist) * (1 - 0.6 * dist)
    return norm(out)


def neigh(seed=0, dur=1.6):
    """Relincho: trino que baja, ronco."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    u = t / dur
    f = (900 - 520 * u) * (1 + 0.08 * np.sign(np.sin(TAU * 14 * t)))
    src = glottal(f, dur, jitter=0.03, vib=(14, 0.04), seed=seed) + 0.5 * noise(n, seed + 1)
    v = vowel_glide(src, ['i', 'e', 'a'], q=0.18)
    e = np.clip(u / 0.05, 0, 1) * np.clip((1 - u) / 0.3, 0, 1)
    return norm(v * e)


# ---------- máquinas y lugares ----------
def engine(dur=8.0, rpm=None, seed=0):
    """Interior de coche: motor (armónicos según rpm) + rodar de llantas."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    rp = np.full(n, 1800.0) if rpm is None else np.asarray(rpm, dtype=float)
    f = rp / 60 * 2
    ph = np.cumsum(f) / SR
    eng = sum(np.sin(TAU * h * ph + h) / h for h in range(1, 9))
    eng = lp(eng, 900) * (1 + 0.15 * smooth_noise(n, 3.0, seed))
    road = lp(pink(n, seed + 1), 500) * 0.8 + bp(pink(n, seed + 2), 800, 2500) * 0.15
    return norm(eng * 0.5 + road)


def screech(dur=1.4, seed=0):
    """Llantas que derrapan al frenar."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 1600 + 500 * smooth_noise(n, 6.0, seed) - 300 * t / dur
    ph = np.cumsum(f) / SR
    tone = np.sin(TAU * ph) * (0.6 + 0.4 * np.abs(smooth_noise(n, 30.0, seed + 1)))
    grit = bp(noise(n, seed + 2), 1200, 4500) * 0.5
    e = np.clip(t / 0.03, 0, 1) * np.clip((dur - t) / 0.25, 0, 1)
    return norm((tone + grit) * e)


def thud(seed=0):
    """Golpe sordo contra la carrocería / ataúd."""
    return norm(sfx.thump(110, 45, 0.6, 0.09) + lp(noise(int(0.6 * SR), seed), 400) * np.exp(-np.arange(int(0.6 * SR)) / SR / 0.04) * 0.6)


def wind_howl(dur=6.0, seed=0, pitch=520.0):
    """Viento que silba entre rendijas (resonancias que se mueven)."""
    n = int(dur * SR)
    base = pink(n, seed)
    w = lp(base, 900) * (0.6 + 0.4 * np.tanh(smooth_noise(n, 0.4, seed + 1) * 1.5))
    f = pitch * (1 + 0.25 * smooth_noise(n, 0.3, seed + 2))
    out = np.zeros(n)
    hop = 2048
    for i in range(0, n, hop):
        seg = base[i : i + hop * 2]
        fc = float(f[i])
        out[i : i + len(seg)] += bp(seg, fc * 0.97, fc * 1.03)[: len(seg)] * np.hanning(len(seg)) * 4
    return norm(w + out * 0.5 * (0.5 + 0.5 * np.tanh(smooth_noise(n, 0.5, seed + 3))))


def crickets(dur=8.0, seed=0, density=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    r = np.random.default_rng(seed)
    for k in range(int(6 * density)):
        f = r.uniform(3800, 5200)
        rate = r.uniform(2.5, 4.5)
        ph = r.uniform(0, 6)
        chirp = (np.sin(TAU * rate * t + ph) > 0.55) * (np.sin(TAU * 34 * t) > 0)
        out += np.sin(TAU * f * t) * chirp * r.uniform(0.2, 0.6)
    return norm(lp(out, 7000))


def clock_tick(n_ticks=8, interval=1.0, seed=0, f0=2600):
    out = np.zeros(int((n_ticks * interval + 0.3) * SR))
    for k in range(n_ticks):
        i0 = int(k * interval * SR)
        tk = sfx.wood(f0 * (1 if k % 2 == 0 else 0.86))
        out[i0 : i0 + len(tk)] += tk
    return norm(out)


def scratch(dur=1.8, seed=0):
    """Uñas que rascan madera desde dentro."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    r = np.random.default_rng(seed)
    out = np.zeros(n)
    tt = 0.0
    while tt < dur - 0.2:
        d = r.uniform(0.18, 0.45)
        i0 = int(tt * SR)
        m = int(d * SR)
        x = np.arange(m) / SR
        g = bp(noise(m, seed + i0 % 997), 1500, 6000) * (0.5 + 0.5 * np.abs(smooth_noise(m, 60.0, seed + 7)))
        out[i0 : i0 + m] += g * np.sin(np.pi * x / d) ** 0.6
        tt += d + r.uniform(0.05, 0.3)
    return norm(out)


def creak(dur=1.2, seed=0, f=380.0):
    """Madera / bisagra que cruje."""
    n = int(dur * SR)
    out = np.zeros(n)
    r = np.random.default_rng(seed)
    tt = 0.0
    while tt < dur - 0.02:
        out[int(tt * SR)] += r.uniform(0.5, 1.0)
        tt += 1 / (22 + 60 * np.sin(np.pi * tt / dur)) * r.uniform(0.85, 1.15)
    k = np.arange(int(0.04 * SR)) / SR
    ping = np.sin(TAU * f * k) * np.exp(-k / 0.008) + 0.5 * np.sin(TAU * f * 2.6 * k) * np.exp(-k / 0.004)
    return norm(bp(np.convolve(out, ping)[:n], 150, 3000) * np.sin(np.pi * np.linspace(0, 1, n)) ** 0.5)


def fire_whoosh(dur=1.2, seed=0):
    """Bola de fuego que pasa / se enciende."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    u = t / dur
    body = bp(pink(n, seed), 120, 2500)
    e = np.sin(np.pi * u) ** 1.5
    return norm(body * e + sfx.fire(dur, seed + 1) * e * 0.4)


def glass_rattle(dur=0.8, seed=0):
    n = int(dur * SR)
    out = np.zeros(n)
    r = np.random.default_rng(seed)
    m = int(0.05 * SR)
    k = np.arange(m) / SR
    for _ in range(int(dur * 30)):
        i0 = int(r.uniform(0, dur - 0.06) * SR)
        f = r.uniform(2500, 4500)
        out[i0 : i0 + m] += np.sin(TAU * f * k) * np.exp(-k / 0.008) * r.uniform(0.2, 1)
    return norm(out * np.exp(-np.arange(n) / SR / (dur * 0.5)))


# ---------- tensión, golpes y transiciones ----------
def drone_dark(dur, root=36, seed=0, beat=0.3):
    """Racimo grave que late (dos notas casi iguales) con aire."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for m, a in [(root, 1.0), (root + 0.18, 0.8), (root + 7, 0.35), (root + 13, 0.15)]:
        f = sfx.midi(m)
        out += a * np.sin(TAU * f * t + m) + a * 0.3 * np.sin(TAU * 2 * f * t)
    out = lp(np.tanh(out * 0.7), 700) * (1 + beat * smooth_noise(n, 0.5, seed))
    out += bp(pink(n, seed + 1), 200, 1200) * 0.15
    return norm(out)


def riser(dur=3.0, seed=0, root=48):
    """Crescendo de tensión: cuerdas en racimo que suben + ruido que se abre."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    u = t / dur
    out = np.zeros(n)
    for k, m in enumerate([root, root + 1, root + 6, root + 7, root + 12]):
        f = sfx.midi(m) * (1 + 0.5 * u ** 2)
        ph = np.cumsum(f) / SR
        out += sum(np.sin(TAU * h * ph + k) / h for h in range(1, 8))
    out = lp_sweep(out, 600, 6600, u ** 2)
    nz = lp_sweep(hp(noise(n, seed), 800), 2000, 11000, u) * 0.4
    return norm((out * 0.2 + nz) * u ** 2.2)


def stinger(seed=0, dur=2.8):
    """Golpe de susto: subgrave + metal frotado (parciales inarmónicos) + chasquido."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    sub = sfx.boom(seed)[:n] * 1.0
    metal = np.zeros(n)
    for r_, a in [(1.0, 1.0), (2.76, 0.6), (5.4, 0.4), (8.9, 0.25), (13.3, 0.15)]:
        f = 233 * r_ * (1 + 0.01 * np.sin(TAU * 7 * t))
        metal += a * np.sin(TAU * np.cumsum(f) / SR) * np.exp(-t / (0.9 / r_ ** 0.3))
    crack = bp(noise(n, seed + 1), 2000, 9000) * np.exp(-t / 0.02)
    return norm(np.concatenate([sub, np.zeros(max(0, n - len(sub)))])[:n] + metal * 0.35 + crack * 0.6)


def reverse_swell(sig, dur=1.5):
    """Versión invertida con cola (succión antes de un golpe)."""
    m = int(dur * SR)
    x = sig[:m]
    ir = sfx.reverb_ir(1.8, 0.6)[0]
    wet = np.convolve(x, ir[: int(1.8 * SR)])[: m + int(1.0 * SR)]
    return norm(wet[::-1])


def sub_drop(dur=1.6, seed=0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 70 * np.exp(-t / 0.5) + 28
    return norm(np.sin(TAU * np.cumsum(f) / SR) * np.exp(-t / (dur * 0.5)))


def heartbeat_seq(n=6, bpm=72, seed=0):
    out = np.zeros(int((n * 60 / bpm + 1) * SR))
    for k in range(n):
        hb = sfx.heartbeat(seed + k)
        i0 = int(k * 60 / bpm * SR)
        out[i0 : i0 + len(hb)] += hb
    return norm(out)


def music_box_detuned(notes, dur_each=0.5, seed=0, detune=0.012):
    """Cajita musical desafinada (inquietante): notas midi."""
    import music as M

    out = np.zeros(int((len(notes) * dur_each + 2.0) * SR))
    r = np.random.default_rng(seed)
    for k, m in enumerate(notes):
        if m is None:
            continue
        s = M.musicbox(sfx.midi(m) * (1 + r.uniform(-detune, detune)), 1.8, 0.8)
        i0 = int(k * dur_each * SR)
        out[i0 : i0 + len(s)] += s[: len(out) - i0]
    return norm(out)


def muffle(sig, amount=0.5):
    """Como oído a través de una pared / bajo tierra."""
    return lp(sig, 6000 - 5200 * amount) * (1 - 0.3 * amount)


def stereo(sig, pan=0.0, width=0.0, delay_ms=0.0):
    l = sig * np.sqrt((1 - pan) / 2)
    r_ = sig * np.sqrt((1 + pan) / 2)
    if delay_ms:
        d = int(delay_ms * SR / 1000)
        r_ = np.concatenate([np.zeros(d), r_])[: len(sig)]
    return np.stack([l, r_])
