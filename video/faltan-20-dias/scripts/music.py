"""Instrumentos para la música de los capítulos (todo sintetizado, sin muestras).

flauta de carrizo · cuerda pulsada (Karplus-Strong: arpa, requinto, jarana, guitarrón) ·
coro · cajita musical · huéhuetl · teponaztli · sonaja · pájaros · zumbido de colibrí.
"""
import numpy as np
from scipy.signal import lfilter

import sfx
from sfx import SR, midi, noise

RNG = np.random.default_rng(16)


def _t(dur):
    return np.arange(int(dur * SR)) / SR


def adsr(n, a=0.02, d=0.1, s=0.7, r=0.15):
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na)
    e[na : na + nd] = np.linspace(1, s, len(e[na : na + nd]))
    if nr:
        e[-nr:] *= np.linspace(1, 0, min(nr, n))
    return e


def flute(f0, dur, vel=1.0, vib=0.006, seed=0):
    """Flauta de carrizo: fundamental + armónicos suaves, vibrato tardío y soplo."""
    t = _t(dur)
    vdepth = vib * np.clip(t / 0.35, 0, 1)
    ph = 2 * np.pi * np.cumsum(f0 * (1 + vdepth * np.sin(2 * np.pi * 5.3 * t))) / SR
    s = np.sin(ph) + 0.22 * np.sin(2 * ph) + 0.07 * np.sin(3 * ph)
    breath = sfx.bp(noise(len(t), seed), f0 * 1.5, min(f0 * 4, 12000)) * 0.12
    chiff = sfx.bp(noise(len(t), seed + 1), 1500, 6000) * np.exp(-t / 0.02) * 0.4
    return (s + breath + chiff) * adsr(len(t), 0.06, 0.1, 0.85, min(0.18, dur * 0.4)) * vel


def pluck(f0, dur, bright=0.6, decay=0.996, vel=1.0, seed=0):
    """Cuerda pulsada Karplus-Strong vía filtro peine (rápido con lfilter)."""
    n = int(dur * SR)
    N = max(2, int(SR / f0))
    exc = noise(N, seed) * np.hanning(N)
    exc = sfx.lp(exc, 800 + 9000 * bright)
    x = np.zeros(n)
    x[:N] = exc
    a = np.zeros(N + 2)
    a[0] = 1
    a[N] = -decay * 0.5
    a[N + 1] = -decay * 0.5
    y = lfilter([1.0], a, x)
    y *= adsr(n, 0.001, 0.0, 1.0, min(0.08, dur * 0.3))
    return y / (np.max(np.abs(y)) + 1e-9) * vel


def strum(notes, dur, spread=0.014, bright=0.55, vel=0.8, down=True, seed=0):
    """Rasgueo (jarana / guitarra): las cuerdas suenan con pequeño desfase."""
    order = notes if down else notes[::-1]
    out = np.zeros(int((dur + spread * len(notes)) * SR))
    for k, m in enumerate(order):
        p = pluck(midi(m), dur, bright, 0.995, vel * (0.85 + 0.15 * RNG.random()), seed + k)
        o = int(k * spread * SR)
        out[o : o + len(p)] += p
    return out / len(notes) ** 0.6


def choir(notes, dur, vowel='a', vel=1.0, seed=0, attack=0.6):
    """Coro: sierras desafinadas filtradas por formantes."""
    F = {'a': (800, 1150, 2900), 'o': (450, 800, 2830), 'u': (325, 700, 2530)}[vowel]
    t = _t(dur)
    src = np.zeros(len(t))
    r = np.random.default_rng(seed)
    for m in notes:
        for det in (-0.006, 0.0, 0.007):
            f = midi(m) * (1 + det + 0.003 * np.sin(2 * np.pi * (4.5 + r.random()) * t + r.uniform(0, 6)))
            ph = 2 * np.pi * np.cumsum(f) / SR
            src += sum(np.sin(h * ph) / h for h in range(1, 18))
    out = sum(sfx.bp(src, fc * 0.85, fc * 1.15) * g for fc, g in zip(F, (1.0, 0.6, 0.25)))
    return out / (np.max(np.abs(out)) + 1e-9) * adsr(len(t), attack, 0.2, 0.9, min(0.8, dur * 0.4)) * vel


def musicbox(f0, dur=1.6, vel=1.0):
    t = _t(dur)
    s = sum(a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t / tau) for r, a, tau in [(1, 1, 0.9), (3.0, 0.3, 0.25), (5.2, 0.15, 0.1), (8.1, 0.08, 0.05)])
    return s * np.minimum(1, t / 0.002) * vel


def huehuetl(vel=1.0, pitch=1.0, seed=0):
    """Tambor vertical de parche: golpe grave con piel."""
    t = _t(0.9)
    f = (58 + 50 * np.exp(-t / 0.04)) * pitch
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = (np.sin(ph) + 0.3 * np.sin(2.3 * ph)) * np.exp(-t / 0.25)
    skin = sfx.lp(noise(len(t), seed), 1200) * np.exp(-t / 0.03) * 0.5
    return (body + skin) * vel


def teponaztli(f0=330, vel=1.0, seed=0):
    """Tambor de hendidura de madera: tono corto con parcial inarmónico."""
    t = _t(0.5)
    s = np.sin(2 * np.pi * f0 * t) * np.exp(-t / 0.09) + 0.35 * np.sin(2 * np.pi * f0 * 2.76 * t) * np.exp(-t / 0.03)
    s += sfx.bp(noise(len(t), seed), 800, 3000) * np.exp(-t / 0.004) * 0.3
    return s * vel


def sonaja(vel=1.0, dur=0.14, seed=0):
    """Sonaja / ayoyote: ráfaga granulada de semillas."""
    n = int(dur * SR)
    g = (np.random.default_rng(seed).random(n) < 0.08) * noise(n, seed + 1)
    return sfx.bp(g, 3000, 9000) * np.exp(-np.arange(n) / (dur * 0.45 * SR)) * vel


def chirp(seed=0, n_notes=3):
    """Canto de pájaro: barridos rápidos de seno con vibrato."""
    r = np.random.default_rng(seed)
    out = np.zeros(int(0.12 * n_notes * SR + SR * 0.1))
    for k in range(n_notes):
        d = 0.05 + 0.05 * r.random()
        t = _t(d)
        f0, f1 = r.uniform(2600, 4200), r.uniform(2600, 5200)
        f = f0 + (f1 - f0) * (t / d) + 300 * np.sin(2 * np.pi * 40 * t)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d)
        o = int(k * 0.11 * SR)
        out[o : o + len(s)] += s
    return out


def buzz(dur, seed=0):
    """Zumbido de alas de colibrí."""
    t = _t(dur)
    am = 0.5 + 0.5 * np.sin(2 * np.pi * 44 * t)
    return sfx.lp(noise(len(t), seed), 380) * am * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.5


def scale(root, mode):
    steps = {
        'mayor': [0, 2, 4, 5, 7, 9, 11],
        'menor': [0, 2, 3, 5, 7, 8, 10],
        'dorico': [0, 2, 3, 5, 7, 9, 10],
        'frigio': [0, 1, 3, 5, 7, 8, 10],
        'mixolidio': [0, 2, 4, 5, 7, 9, 10],
        'armonica': [0, 2, 3, 5, 7, 8, 11],
        'penta': [0, 2, 4, 7, 9],
        'penta_m': [0, 3, 5, 7, 10],
    }[mode]
    return lambda deg: root + 12 * (deg // len(steps)) + steps[deg % len(steps)]


def outro(bus, O):
    """Sonido del outro del logo (idéntico en todos los capítulos)."""
    fr = lambda f: f / 30  # noqa: E731
    burn0, burn1, diss0, diss1 = O + fr(8), O + fr(48), O + fr(92), O + fr(126)
    m = int(0.16 * SR)
    bus.place(sfx.bp(noise(m, 5), 2000, 7000) * sfx.env(m, 0.008, 0.04), O + fr(5), 0.35)
    m = int(1.4 * SR)
    i = np.arange(m) / SR
    bus.place(sfx.lp(noise(m, 6), 700) * np.minimum(1, i / 0.12) * np.exp(-i / 0.5), burn0 - 0.05, 0.9, wet=0.22)
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


def caracol(f0, dur, vel=1.0, seed=0):
    """Caracol / atecocolli: sierra con formante, glissando de ataque y soplo."""
    t = _t(dur)
    f = f0 * (2 ** ((-2 + 2 * np.clip(t / 0.35, 0, 1)) / 12)) * (1 + 0.004 * np.sin(2 * np.pi * 4.8 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    saw = sum(np.sin(h * ph) / h for h in range(1, 14))
    tone = sfx.bp(saw, 250, 1400) + 0.4 * sfx.bp(saw, 1700, 2600)
    breath = sfx.bp(noise(len(t), seed), 400, 3000) * 0.2
    return (tone / (np.max(np.abs(tone)) + 1e-9) + breath) * adsr(len(t), 0.25, 0.2, 0.85, min(0.6, dur * 0.35)) * vel


def river(dur, seed=0):
    """Corriente de río: ruido rosa filtrado con borboteo y gotas."""
    n = int(dur * SR)
    p = sfx.pink(n, seed)
    flow = sfx.bp(p, 200, 1800) * (0.7 + 0.3 * np.tanh(sfx.smooth_noise(n, 2.0, seed + 1)))
    bubbles = np.zeros(n)
    r = np.random.default_rng(seed + 2)
    for _ in range(int(dur * 3)):
        at = int(r.uniform(0, n - SR * 0.1))
        d = int(0.05 * SR)
        tt = np.arange(d) / SR
        f = r.uniform(500, 1400) * (1 + 1.5 * tt / 0.05)
        bubbles[at : at + d] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.012) * r.uniform(0.2, 0.6)
    return flow + bubbles
