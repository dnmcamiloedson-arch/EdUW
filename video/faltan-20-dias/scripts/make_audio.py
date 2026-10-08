"""Diseño sonoro sintetizado para "Faltan 20 días" (20.000 s, 48 kHz, estéreo).

Capas: drone grave + viento + latido (60→72 bpm) · cerillo e ignición · roce de papel ·
campanita al encenderse los ojos · copal · percusión al beat del montaje · marimba
(una nota por vela) + swell de cuerdas · respiro (silencio) · golpe grave limpio con
cola de reverb al aparecer el "20". Master a -14 LUFS integrado, true peak ≤ -1 dBTP.

Los tiempos salen del mismo mapa de frames que usa el video (30 fps).
"""
import json
import sys

import numpy as np
import pyloudnorm as pyln
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt

SR = 48000
DUR = 24.5  # 20 s de teaser + 4.5 s de outro con el logo
N = int(SR * DUR)
rng = np.random.default_rng(1028)
t = np.arange(N) / SR

FPS = 30
fr = lambda f: f / FPS  # noqa: E731

# ---- mapa de tiempos (sincronizado con src/Teaser.tsx y escenas) ----
STRIKE = fr(6)
IGNITE = fr(8)
PAPEL = fr(135)
EYES = fr(225 + 54)
CUT_B, CUT_C, CUT_D, CUT_E = fr(225), fr(300), fr(375), fr(450)
MONTAGE = [fr(375), fr(393), fr(411), fr(429)]
CANDLES = [fr(450 + 4 + 5 * i) for i in range(1, 12)]
BREATH = (fr(520), fr(525))
TITLE = fr(525)
FADE = (fr(729), fr(735))
TITLE_OUT = (fr(594), fr(600))  # el título se apaga a negro antes del outro
OUT = fr(600)  # inicio del outro
OUT_BURN = (OUT + fr(8), OUT + fr(48))
OUT_DISS = (OUT + fr(92), OUT + fr(126))
HEART = [1.0, 2.0, 3.0, 3.95, 4.85, 5.75, 6.65, CUT_B, 8.35, 9.2, CUT_C, 10.84, 11.67]


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)


def lp(x, hz, order=2):
    return sosfilt(butter(order, hz, btype='low', fs=SR, output='sos'), x)


def hp(x, hz, order=2):
    return sosfilt(butter(order, hz, btype='high', fs=SR, output='sos'), x)


def env_adsr(n, a, d_tau):
    i = np.arange(n) / SR
    e = np.minimum(1, i / max(a, 1e-4)) * np.exp(-np.maximum(0, i - a) / d_tau)
    return e


def place(bus, sig, at, gain=1.0, pan=0.0):
    """Coloca una señal mono en el bus estéreo con paneo de potencia constante."""
    s = int(at * SR)
    if s >= N:
        return
    sig = sig[: N - max(s, 0)]
    if s < 0:
        sig = sig[-s:]
        s = 0
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    bus[0, s : s + len(sig)] += sig * gain * l
    bus[1, s : s + len(sig)] += sig * gain * r


def smooth_noise(n, rate_hz, seed):
    """Ruido suave (interpolado) para modulaciones orgánicas."""
    r = np.random.default_rng(seed)
    pts = r.normal(0, 1, int(n / SR * rate_hz) + 4)
    xs = np.arange(len(pts)) / rate_hz
    return np.interp(np.arange(n) / SR, xs, pts)


def pink(n, seed):
    r = np.random.default_rng(seed)
    X = np.fft.rfft(r.normal(0, 1, n))
    f = np.fft.rfftfreq(n, 1 / SR)
    X /= np.sqrt(np.maximum(f, 20))
    y = np.fft.irfft(X, n)
    return y / np.max(np.abs(y))


def reverb_ir(seconds=3.2, tau=0.85, seed=7):
    n = int(seconds * SR)
    i = np.arange(n) / SR
    ir = np.zeros((2, n))
    for c in range(2):
        r = np.random.default_rng(seed + c)
        nz = r.normal(0, 1, n) * np.exp(-i / tau)
        nz = lp(nz, 5200) * (1 - np.exp(-i / 0.012))
        ir[c] = nz
        for k in range(8):  # reflexiones tempranas
            d = int((0.011 + 0.017 * k + 0.004 * c) * SR)
            ir[c, d] += 0.5 * (0.7 ** k)
    # normalizado por energía: la cola suena como sala, no como eco gigante
    return ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True)) * 0.55


dry = np.zeros((2, N))
send = np.zeros((2, N))  # bus de reverb

# ---------------- drone + viento ----------------
drone = np.zeros(N)
for f0, a in [(73.42, 1.0), (110.0, 0.55), (146.83, 0.35), (220.0, 0.12)]:
    for det in (-0.13, 0.11):
        drone += a * np.sin(2 * np.pi * (f0 + det) * t + rng.uniform(0, 6.28))
drone = np.tanh(drone * 0.6)  # armónicos audibles en bocinas de teléfono
drone = lp(drone, 520)
d_env = np.clip(t / 2.5, 0, 1) ** 1.5 * (0.55 + 0.45 * np.clip((t - 2) / 13, 0, 1))
d_env *= 1 + 0.12 * smooth_noise(N, 0.6, 3)
drone *= d_env * 0.17

wind = np.zeros((2, N))
for c in range(2):
    pn = pink(N, 40 + c)
    lfo = 0.5 + 0.5 * np.tanh(smooth_noise(N, 0.35, 50 + c) * 1.3)
    w = bp(pn, 180, 900) * (1 - lfo) + bp(pn, 500, 2200) * lfo * 0.6
    gust = 0.55 + 0.45 * np.tanh(smooth_noise(N, 0.25, 60 + c))
    wind[c] = w * gust
wind *= np.clip(t / 1.2, 0, 1) * 0.55

# respiro antes de la revelación: todo baja casi a silencio y vuelve con el golpe
duck = np.ones(N)
b0, b1 = int(BREATH[0] * SR), int(BREATH[1] * SR)
duck[b0:b1] = np.linspace(1, 0.08, b1 - b0) ** 2
duck[b1:] = 0.08 + 0.5 * (1 - np.exp(-(t[b1:] - BREATH[1]) / 0.8))
o0, o1 = int(TITLE_OUT[0] * SR), int((OUT + 0.4) * SR)
duck[o0:o1] *= np.linspace(1, 0.35, o1 - o0)
duck[o1:] *= 0.35 + 0.25 * np.clip((t[o1:] - OUT - 0.4) / 1.5, 0, 1)
dry[0] += drone * duck + wind[0] * duck
dry[1] += drone * duck + wind[1] * duck

# ---------------- latido ----------------
def thump(f_hi, f_lo, dur, decay):
    n = int(dur * SR)
    i = np.arange(n) / SR
    f = f_lo + (f_hi - f_lo) * np.exp(-i / 0.03)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) + 0.35 * np.sin(2 * ph)  # 2º armónico para bocinas pequeñas
    return s * env_adsr(n, 0.004, decay)


for k, ht in enumerate(HEART):
    g = 0.5 + 0.35 * (k / len(HEART))
    place(dry, thump(95, 52, 0.45, 0.11), ht, 1.25 * g)
    place(dry, thump(105, 60, 0.4, 0.09), ht + 0.27, 0.85 * g)

# ---------------- cerillo + ignición + chisporroteo ----------------
n = int(0.16 * SR)
scr = bp(rng.normal(0, 1, n), 1800, 7000) * env_adsr(n, 0.01, 0.05)
crackle = (rng.random(n) < 0.012) * rng.normal(0, 3, n)
scr = scr + bp(crackle, 1500, 9000)
place(dry, scr, STRIKE - 0.06, 0.5, -0.1)
n = int(0.9 * SR)
i = np.arange(n) / SR
whoosh = lp(rng.normal(0, 1, n), 900) * (np.minimum(1, i / 0.05) * np.exp(-i / 0.22))
whoosh += 0.6 * thump(120, 70, 0.9, 0.12)
place(dry, whoosh, IGNITE - 0.03, 0.8)
place(send, whoosh, IGNITE - 0.03, 0.12)
# chisporroteo esporádico de la mecha
for k in range(26):
    at = IGNITE + 0.4 + rng.uniform(0, 7)
    m = int(0.012 * SR)
    place(dry, hp(rng.normal(0, 1, m), 2500) * np.exp(-np.arange(m) / (0.002 * SR)), at, 0.05 * rng.uniform(0.4, 1), rng.uniform(-0.4, 0.4))

# ---------------- papel picado ----------------
n = int(1.5 * SR)
i = np.arange(n) / SR
crink = (rng.random(n) < 0.03) * rng.normal(0, 1, n)
rustle = bp(rng.normal(0, 1, n) * 0.25 + crink, 1800, 8000) * np.sin(np.pi * np.clip(i / 1.5, 0, 1)) ** 0.7
rustle *= 0.6 + 0.4 * smooth_noise(n, 9, 70)
place(dry, rustle, PAPEL, 0.12, 0.25)
place(dry, rustle[::-1], PAPEL + 0.35, 0.08, -0.35)

# ---------------- campanita (ojos) ----------------
def bell(f0, dur=2.6, amp=1.0):
    n = int(dur * SR)
    i = np.arange(n) / SR
    s = np.zeros(n)
    for ratio, a, tau in [(1, 1, 1.1), (2.76, 0.45, 0.5), (5.4, 0.22, 0.25), (8.93, 0.1, 0.12)]:
        s += a * np.sin(2 * np.pi * f0 * ratio * i) * np.exp(-i / tau)
    return s * np.minimum(1, i / 0.004) * amp


place(dry, bell(880), EYES, 0.07, 0.2)
place(send, bell(880), EYES, 0.12)
place(send, bell(1318.5), EYES + 0.12, 0.06)

# ---------------- copal: soplo ascendente ----------------
n = int(2.2 * SR)
i = np.arange(n) / SR
nz = rng.normal(0, 1, n)
lo_band = bp(nz, 300, 900)
hi_band = bp(nz, 900, 2600)
mixk = np.clip(i / 2.2, 0, 1)
copal = (lo_band * (1 - mixk) + hi_band * mixk) * np.sin(np.pi * mixk) ** 1.2
place(dry, copal, CUT_C - 0.1, 0.035, -0.3)
place(send, copal, CUT_C - 0.1, 0.015)

# ---------------- percusión del montaje ----------------
def drum(scale=1.0):
    n = int(0.6 * SR)
    i = np.arange(n) / SR
    body = thump(150, 72, 0.6, 0.16)
    skin = lp(rng.normal(0, 1, n), 900) * np.exp(-i / 0.03)
    return (body + 0.35 * skin) * scale


def wood(f0=1150):
    n = int(0.12 * SR)
    i = np.arange(n) / SR
    s = np.sin(2 * np.pi * f0 * i) * np.exp(-i / 0.025) + 0.5 * np.sin(2 * np.pi * f0 * 2.3 * i) * np.exp(-i / 0.012)
    return s * np.minimum(1, i / 0.0008)


for k, bt in enumerate(MONTAGE):
    place(dry, drum(), bt, 1.1)
    place(dry, wood(1100 + 90 * k), bt + 0.004, 0.11, (-0.3, 0.3, -0.15, 0.15)[k])
    place(send, wood(1100 + 90 * k), bt, 0.06)
    place(dry, drum(0.5), bt + 0.3, 0.45)  # nota fantasma a media figura
place(dry, drum(1.2), CUT_E, 1.2)
place(send, drum(1.0), CUT_E, 0.12)

# ---------------- marimba (una nota por vela) ----------------
def marimba(f0, dur=1.6):
    n = int(dur * SR)
    i = np.arange(n) / SR
    s = (
        np.sin(2 * np.pi * f0 * i) * np.exp(-i / 0.55)
        + 0.32 * np.sin(2 * np.pi * f0 * 3.93 * i) * np.exp(-i / 0.12)
        + 0.1 * np.sin(2 * np.pi * f0 * 9.2 * i) * np.exp(-i / 0.035)
    )
    mallet = lp(rng.normal(0, 1, n), 2500) * np.exp(-i / 0.003) * 0.25
    return (s + mallet) * np.minimum(1, i / 0.0015)


midi = lambda m: 440 * 2 ** ((m - 69) / 12)  # noqa: E731
# Re mayor pentatónico ascendente: cálido, nada "de miedo"
NOTES = [62, 66, 69, 71, 74, 76, 78, 81, 83, 86, 88]
place(dry, marimba(midi(50), 2.2), CUT_E, 0.35)
place(send, marimba(midi(50), 2.2), CUT_E, 0.15)
for k, (ct, m) in enumerate(zip(CANDLES, NOTES)):
    g = 0.2 + 0.1 * (k / len(NOTES))
    pan = -0.5 + k / (len(NOTES) - 1)
    place(dry, marimba(midi(m)), ct, g, pan * 0.6)
    place(send, marimba(midi(m)), ct, g * 0.5, pan)
    # eco suave de la octava baja
    place(dry, marimba(midi(m - 12)) * 0.4, ct + 0.012, g * 0.5, -pan * 0.3)

# ---------------- swell de cuerdas ----------------
def strings(freqs, start, end, attack_curve, cutoff_from, cutoff_to, release=0.04, seed=0):
    n = int((end - start) * SR)
    i = np.arange(n) / SR
    out = np.zeros((2, n))
    r = np.random.default_rng(seed)
    for f0 in freqs:
        for c in range(2):
            for det in (-0.004, 0.0, 0.005):
                ff = f0 * (1 + det + 0.0015 * np.sin(2 * np.pi * 5.2 * i + r.uniform(0, 6)))
                ph = 2 * np.pi * np.cumsum(ff) / SR + r.uniform(0, 6)
                saw = sum(np.sin(h * ph) / h for h in range(1, 12))
                out[c] += saw
    # filtro que se abre con la intensidad (simulación de arco)
    k = np.linspace(0, 1, n)
    lo = lp(out, cutoff_from, 2)
    hi = lp(out, cutoff_to, 2)
    out = lo * (1 - k) + hi * k
    e = attack_curve(i / (end - start))
    rel = int(release * SR)
    e[-rel:] *= np.linspace(1, 0, rel) ** 2
    return out * e / len(freqs)


sw = strings([midi(50), midi(57), midi(62), midi(66)], CUT_E, BREATH[0] + 0.1, lambda u: u ** 2.2, 380, 2400, release=0.09, seed=3)
s0 = int(CUT_E * SR)
dry[:, s0 : s0 + sw.shape[1]] += sw * 0.34
send[:, s0 : s0 + sw.shape[1]] += sw * 0.16

# ---------------- revelación: golpe grave + acorde final ----------------
n = int(2.4 * SR)
i = np.arange(n) / SR
f = 46 + 34 * np.exp(-i / 0.05)
ph = 2 * np.pi * np.cumsum(f) / SR
boom = (np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)) * env_adsr(n, 0.003, 0.6)
boom += lp(rng.normal(0, 1, n), 320) * np.exp(-i / 0.02) * 0.5
place(dry, boom, TITLE, 0.95)
place(send, boom, TITLE, 0.35)
place(send, bell(587.33, 3.0), TITLE + 0.02, 0.1)  # brillo de brasa

fin = strings([midi(50), midi(57), midi(64), midi(66), midi(74)], TITLE, OUT + 0.25, lambda u: np.minimum(1, (u * 2.5 / 0.3)) * (1 - 0.35 * u), 600, 1500, release=0.45, seed=9)
_t0 = int(TITLE * SR)
dry[:, _t0 : _t0 + fin.shape[1]] += fin * 0.11
send[:, _t0 : _t0 + fin.shape[1]] += fin * 0.08

# ---------------- outro: el logo se enciende, arde y se esfuma ----------------
# chispa + encendido
n = int(0.16 * SR)
place(dry, bp(rng.normal(0, 1, n), 2000, 7000) * env_adsr(n, 0.008, 0.04), OUT + fr(5), 0.35)
n = int(1.4 * SR)
i = np.arange(n) / SR
ign = lp(rng.normal(0, 1, n), 700) * np.minimum(1, i / 0.12) * np.exp(-i / 0.5)
place(dry, ign, OUT_BURN[0] - 0.05, 0.9)
place(send, ign, OUT_BURN[0] - 0.05, 0.2)
place(dry, thump(110, 55, 0.8, 0.2), OUT_BURN[0], 0.7)
# lecho de fuego: rumor grave + chasquidos, sigue la intensidad del logo
n = int((OUT_DISS[1] - OUT_BURN[0] + 0.6) * SR)
i = np.arange(n) / SR
body = lp(pink(n, 91), 500) * 0.8 + bp(pink(n, 92), 900, 3000) * 0.25
body *= 0.6 + 0.4 * np.tanh(smooth_noise(n, 3.0, 93))
dur_burn = OUT_BURN[1] - OUT_BURN[0]
g_env = np.clip(i / dur_burn, 0, 1) ** 0.8 * (1 - np.clip((i - (OUT_DISS[0] - OUT_BURN[0])) / (OUT_DISS[1] - OUT_DISS[0]), 0, 1)) ** 1.5
pops = (rng.random(n) < 0.0016) * rng.normal(0, 1, n) * 4
crack = hp(pops, 1800) + bp(pops, 300, 1200) * 0.5
fire = (body + crack) * g_env
place(dry, fire, OUT_BURN[0], 0.42, -0.1)
place(dry, np.roll(fire, 9000), OUT_BURN[0], 0.3, 0.25)
# acorde cálido mientras el logo está encendido
pad = strings([midi(50), midi(57), midi(62), midi(66)], OUT_BURN[0], OUT_DISS[1], lambda u: np.minimum(1, u * 4) * (1 - np.clip((u - 0.62) / 0.38, 0, 1)) ** 1.5, 500, 1100, release=0.3, seed=21)
_o0 = int(OUT_BURN[0] * SR)
dry[:, _o0 : _o0 + pad.shape[1]] += pad * 0.12
send[:, _o0 : _o0 + pad.shape[1]] += pad * 0.1
# firma de marimba cuando el logo termina de encenderse
for k, (m, dt) in enumerate([(74, 0.0), (78, 0.16), (81, 0.32), (86, 0.56)]):
    place(dry, marimba(midi(m), 1.8), OUT_BURN[1] / 1 + dt - 0.05, 0.2, (-0.3, -0.1, 0.1, 0.3)[k])
    place(send, marimba(midi(m), 1.8), OUT_BURN[1] + dt - 0.05, 0.12)
# se esfuma: soplo que sube + brillo
n = int(1.8 * SR)
i = np.arange(n) / SR
mixk = np.clip(i / 1.8, 0, 1)
air = (bp(rng.normal(0, 1, n), 500, 1400) * (1 - mixk) + bp(rng.normal(0, 1, n), 1400, 5000) * mixk) * np.sin(np.pi * mixk) ** 1.3
place(dry, air, OUT_DISS[0] - 0.1, 0.22, 0.15)
place(send, air, OUT_DISS[0] - 0.1, 0.1)
place(send, bell(1174.66, 2.4), OUT_DISS[0] + 0.25, 0.08)
place(send, bell(1760.0, 2.0), OUT_DISS[0] + 0.45, 0.05)

# ---------------- reverb ----------------
ir = reverb_ir()
wet = np.stack([fftconvolve(send[c], ir[c])[:N] for c in range(2)])
mix = dry + wet

# fade final (últimos 6 frames) y DC
fade = np.ones(N)
f0i, f1i = int(FADE[0] * SR), int(FADE[1] * SR)
fade[f0i:f1i] = np.cos(np.linspace(0, np.pi / 2, f1i - f0i)) ** 2
fade[f1i:] = 0
mix *= fade
mix = hp(mix, 25)

# ---------------- master: -14 LUFS, true peak ≤ -1 dBTP ----------------
meter = pyln.Meter(SR)
lufs = meter.integrated_loudness(mix.T)
mix *= 10 ** ((-14.0 - lufs) / 20)


def true_peak_limiter(x, ceiling_db=-1.5, look=0.004, release=0.08):
    ceiling = 10 ** (ceiling_db / 20)
    up = resample_poly(x, 4, 1, axis=1)
    peak = np.max(np.abs(up), axis=0).reshape(-1, 4).max(axis=1)[: x.shape[1]]
    need = np.minimum(1, ceiling / np.maximum(peak, 1e-9))
    # lookahead: mínimo en ventana + suavizado de liberación
    w = int(look * SR)
    from numpy.lib.stride_tricks import sliding_window_view

    padded = np.concatenate([need, np.ones(w)])
    g = sliding_window_view(padded, w + 1).min(axis=1)[: len(need)]
    a = np.exp(-1 / (release * SR))
    out = np.empty_like(g)
    cur = 1.0
    for k in range(len(g)):
        cur = g[k] if g[k] < cur else a * cur + (1 - a) * g[k]
        out[k] = cur
    return x * out


for _ in range(3):  # limitar y re-ajustar loudness
    mix = true_peak_limiter(mix)
    lufs = meter.integrated_loudness(mix.T)
    mix *= 10 ** ((-14.0 - lufs) / 20)
mix = true_peak_limiter(mix, -1.3)

out = sys.argv[1] if len(sys.argv) > 1 else 'public/audio/teaser.wav'
wavfile.write(out, SR, (np.clip(mix, -1, 1).T * 32767).astype(np.int16))
m2 = pyln.Meter(SR, block_size=0.4)
prof = []
for k in range(int(DUR)):
    seg = mix[:, k * SR : (k + 1) * SR].T
    prof.append(round(m2.integrated_loudness(seg), 1))
print('perfil LUFS/s', prof)
print(json.dumps({'lufs': round(meter.integrated_loudness(mix.T), 2), 'samples': N, 'out': out}))
