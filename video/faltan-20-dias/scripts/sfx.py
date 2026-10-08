"""Instrumentos y efectos sintetizados compartidos (48 kHz). Sin muestras externas."""
import numpy as np
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt

SR = 48000


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)


def lp(x, hz, order=2):
    return sosfilt(butter(order, hz, btype='low', fs=SR, output='sos'), x)


def hp(x, hz, order=2):
    return sosfilt(butter(order, hz, btype='high', fs=SR, output='sos'), x)


def env(n, a, tau):
    i = np.arange(n) / SR
    return np.minimum(1, i / max(a, 1e-4)) * np.exp(-np.maximum(0, i - a) / tau)


class Bus:
    def __init__(self, dur):
        self.n = int(dur * SR)
        self.dry = np.zeros((2, self.n))
        self.send = np.zeros((2, self.n))

    def place(self, sig, at, gain=1.0, pan=0.0, wet=0.0):
        s = int(at * SR)
        if s >= self.n or gain == 0:
            return
        if s < 0:
            sig = sig[-s:]
            s = 0
        sig = sig[: self.n - s]
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        for c, k in ((0, l), (1, r)):
            self.dry[c, s : s + len(sig)] += sig * gain * k
            if wet:
                self.send[c, s : s + len(sig)] += sig * gain * wet * k

    def reverb_only(self, sig, at, gain=1.0, pan=0.0):
        s = int(at * SR)
        if s >= self.n:
            return
        sig = sig[: self.n - s]
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        self.send[0, s : s + len(sig)] += sig * gain * l
        self.send[1, s : s + len(sig)] += sig * gain * r

    def place2(self, st, at, gain=1.0, wet=0.0):
        s = int(at * SR)
        st = st[:, : self.n - s]
        self.dry[:, s : s + st.shape[1]] += st * gain
        if wet:
            self.send[:, s : s + st.shape[1]] += st * gain * wet


def smooth_noise(n, rate, seed):
    r = np.random.default_rng(seed)
    pts = r.normal(0, 1, int(n / SR * rate) + 4)
    return np.interp(np.arange(n) / SR, np.arange(len(pts)) / rate, pts)


def pink(n, seed):
    r = np.random.default_rng(seed)
    X = np.fft.rfft(r.normal(0, 1, n))
    X /= np.sqrt(np.maximum(np.fft.rfftfreq(n, 1 / SR), 20))
    y = np.fft.irfft(X, n)
    return y / np.max(np.abs(y))


def noise(n, seed):
    return np.random.default_rng(seed).normal(0, 1, n)


def thump(f_hi, f_lo, dur, decay):
    n = int(dur * SR)
    i = np.arange(n) / SR
    f = f_lo + (f_hi - f_lo) * np.exp(-i / 0.03)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) + 0.35 * np.sin(2 * ph)) * env(n, 0.004, decay)


def heartbeat(seed=0):
    a = thump(95, 52, 0.45, 0.11)
    b = thump(105, 60, 0.4, 0.09)
    out = np.zeros(int(0.75 * SR))
    out[: len(a)] += a
    o = int(0.27 * SR)
    out[o : o + len(b)] += b * 0.68
    return out


def strike(seed):
    n = int(0.16 * SR)
    s = bp(noise(n, seed), 1800, 7000) * env(n, 0.01, 0.05)
    crack = (np.random.default_rng(seed + 1).random(n) < 0.012) * noise(n, seed + 2) * 3
    return s + bp(crack, 1500, 9000)


def ignite(seed):
    n = int(0.9 * SR)
    i = np.arange(n) / SR
    return lp(noise(n, seed), 900) * np.minimum(1, i / 0.05) * np.exp(-i / 0.22) + 0.6 * thump(120, 70, 0.9, 0.12)


def rustle(seed, dur=1.5):
    n = int(dur * SR)
    i = np.arange(n) / SR
    r = np.random.default_rng(seed)
    crink = (r.random(n) < 0.03) * r.normal(0, 1, n)
    s = bp(r.normal(0, 1, n) * 0.25 + crink, 1800, 8000) * np.sin(np.pi * np.clip(i / dur, 0, 1)) ** 0.7
    return s * (0.6 + 0.4 * smooth_noise(n, 9, seed + 1))


def air(seed, dur=2.0, lo=(300, 900), hi=(900, 2600)):
    n = int(dur * SR)
    k = np.clip(np.arange(n) / n, 0, 1)
    nz = noise(n, seed)
    return (bp(nz, *lo) * (1 - k) + bp(nz, *hi) * k) * np.sin(np.pi * k) ** 1.2


def bell(f0, dur=2.6):
    n = int(dur * SR)
    i = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f0 * r * i) * np.exp(-i / tau) for r, a, tau in [(1, 1, 1.1), (2.76, 0.45, 0.5), (5.4, 0.22, 0.25), (8.93, 0.1, 0.12)])
    return s * np.minimum(1, i / 0.004)


def drum(seed, scale=1.0):
    n = int(0.6 * SR)
    i = np.arange(n) / SR
    return (thump(150, 72, 0.6, 0.16) + 0.35 * lp(noise(n, seed), 900) * np.exp(-i / 0.03)) * scale


def wood(f0=1150):
    n = int(0.12 * SR)
    i = np.arange(n) / SR
    s = np.sin(2 * np.pi * f0 * i) * np.exp(-i / 0.025) + 0.5 * np.sin(2 * np.pi * f0 * 2.3 * i) * np.exp(-i / 0.012)
    return s * np.minimum(1, i / 0.0008)


def marimba(f0, dur=1.6, seed=0):
    n = int(dur * SR)
    i = np.arange(n) / SR
    s = (
        np.sin(2 * np.pi * f0 * i) * np.exp(-i / 0.55)
        + 0.32 * np.sin(2 * np.pi * f0 * 3.93 * i) * np.exp(-i / 0.12)
        + 0.1 * np.sin(2 * np.pi * f0 * 9.2 * i) * np.exp(-i / 0.035)
    )
    s += lp(noise(n, seed), 2500) * np.exp(-i / 0.003) * 0.25
    return s * np.minimum(1, i / 0.0015)


def midi(m):
    return 440 * 2 ** ((m - 69) / 12)


def strings(freqs, dur, curve, cut_from, cut_to, release=0.05, seed=0):
    n = int(dur * SR)
    i = np.arange(n) / SR
    out = np.zeros((2, n))
    r = np.random.default_rng(seed)
    for f0 in freqs:
        for c in range(2):
            for det in (-0.004, 0.0, 0.005):
                ff = f0 * (1 + det + 0.0015 * np.sin(2 * np.pi * 5.2 * i + r.uniform(0, 6)))
                ph = 2 * np.pi * np.cumsum(ff) / SR + r.uniform(0, 6)
                out[c] += sum(np.sin(h * ph) / h for h in range(1, 12))
    k = np.linspace(0, 1, n)
    out = lp(out, cut_from) * (1 - k) + lp(out, cut_to) * k
    e = curve(i / dur)
    rel = max(1, int(release * SR))
    e[-rel:] *= np.linspace(1, 0, rel) ** 2
    return out * e / len(freqs)


def boom(seed):
    n = int(2.4 * SR)
    i = np.arange(n) / SR
    f = 46 + 34 * np.exp(-i / 0.05)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = (np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)) * env(n, 0.003, 0.6)
    return s + lp(noise(n, seed), 320) * np.exp(-i / 0.02) * 0.5


def fire(dur, seed):
    n = int(dur * SR)
    body = lp(pink(n, seed), 500) * 0.8 + bp(pink(n, seed + 1), 900, 3000) * 0.25
    body *= 0.6 + 0.4 * np.tanh(smooth_noise(n, 3.0, seed + 2))
    pops = (np.random.default_rng(seed + 3).random(n) < 0.0016) * noise(n, seed + 4) * 4
    return body + hp(pops, 1800) + bp(pops, 300, 1200) * 0.5


def drone_bed(n, seed=3):
    t = np.arange(n) / SR
    r = np.random.default_rng(seed)
    d = np.zeros(n)
    for f0, a in [(73.42, 1.0), (110.0, 0.55), (146.83, 0.35), (220.0, 0.12)]:
        for det in (-0.13, 0.11):
            d += a * np.sin(2 * np.pi * (f0 + det) * t + r.uniform(0, 6.28))
    return lp(np.tanh(d * 0.6), 520) * (1 + 0.12 * smooth_noise(n, 0.6, seed))


def wind_bed(n, seed=40):
    out = np.zeros((2, n))
    for c in range(2):
        pn = pink(n, seed + c)
        lfo = 0.5 + 0.5 * np.tanh(smooth_noise(n, 0.35, seed + 10 + c) * 1.3)
        out[c] = (bp(pn, 180, 900) * (1 - lfo) + bp(pn, 500, 2200) * lfo * 0.6) * (0.55 + 0.45 * np.tanh(smooth_noise(n, 0.25, seed + 20 + c)))
    return out


def reverb_ir(seconds=3.2, tau=0.85, seed=7):
    n = int(seconds * SR)
    i = np.arange(n) / SR
    ir = np.zeros((2, n))
    for c in range(2):
        nz = lp(noise(n, seed + c) * np.exp(-i / tau), 5200) * (1 - np.exp(-i / 0.012))
        ir[c] = nz
        for k in range(8):
            ir[c, int((0.011 + 0.017 * k + 0.004 * c) * SR)] += 0.5 * (0.7 ** k)
    return ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True)) * 0.55


def true_peak_limiter(x, ceiling_db=-1.5, look=0.004, release=0.08):
    from numpy.lib.stride_tricks import sliding_window_view

    ceiling = 10 ** (ceiling_db / 20)
    up = resample_poly(x, 4, 1, axis=1)
    peak = np.max(np.abs(up), axis=0).reshape(-1, 4).max(axis=1)[: x.shape[1]]
    need = np.minimum(1, ceiling / np.maximum(peak, 1e-9))
    w = int(look * SR)
    g = sliding_window_view(np.concatenate([need, np.ones(w)]), w + 1).min(axis=1)[: len(need)]
    a = np.exp(-1 / (release * SR))
    out = np.empty_like(g)
    cur = 1.0
    for k in range(len(g)):
        cur = g[k] if g[k] < cur else a * cur + (1 - a) * g[k]
        out[k] = cur
    return x * out


def master(bus, fade=None, target=-14.0):
    import pyloudnorm as pyln

    wet = np.stack([fftconvolve(bus.send[c], reverb_ir()[c])[: bus.n] for c in range(2)])
    mix = bus.dry + wet
    if fade:
        f0, f1 = int(fade[0] * SR), int(fade[1] * SR)
        e = np.ones(bus.n)
        e[f0:f1] = np.cos(np.linspace(0, np.pi / 2, f1 - f0)) ** 2
        e[f1:] = 0
        mix *= e
    mix = hp(mix, 25)
    meter = pyln.Meter(SR)
    for ceil in (-1.5, -1.5, -1.5):
        mix *= 10 ** ((target - meter.integrated_loudness(mix.T)) / 20)
        mix = true_peak_limiter(mix, ceil)
    mix = true_peak_limiter(mix, -1.3)
    return mix, meter.integrated_loudness(mix.T)
