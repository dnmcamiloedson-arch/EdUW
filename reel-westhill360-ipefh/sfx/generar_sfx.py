"""Genera efectos de sonido sintéticos (sin voz) para el reel: whoosh, click, shutter, pop, riser, impact, ding."""
import sys, wave
import numpy as np

SR = 48000
rng = np.random.default_rng(7)
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'


def save(name, x, gain_db=-1.0):
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    peak = np.abs(x).max() or 1
    x = x / peak * 10 ** (gain_db / 20)
    with wave.open(f'{OUT}/{name}.wav', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype('<i2').tobytes())


def t(sec):
    return np.arange(int(SR * sec)) / SR


def lowpass_sweep(noise, cut_start, cut_peak, cut_end, peak_pos):
    """One-pole lowpass with time-varying cutoff (cheap whoosh filter)."""
    n = len(noise); out = np.zeros(n); y = 0.0
    k = np.arange(n) / n
    cut = np.where(k < peak_pos,
                   cut_start + (cut_peak - cut_start) * (k / peak_pos) ** 2,
                   cut_peak + (cut_end - cut_peak) * ((k - peak_pos) / (1 - peak_pos)))
    a = 1 - np.exp(-2 * np.pi * cut / SR)
    for i in range(n):
        y += a[i] * (noise[i] - y); out[i] = y
    return out


def env_ad(n, peak_pos, attack_pow=2.0, decay_pow=1.5):
    k = np.arange(n) / n
    return np.where(k < peak_pos, (k / peak_pos) ** attack_pow, ((1 - k) / (1 - peak_pos)) ** decay_pow)


def whoosh(dur=0.6, peak=0.55, bright=7000, pan_sweep=True):
    n = int(SR * dur)
    x = lowpass_sweep(rng.standard_normal(n), 300, bright, 500, peak) * env_ad(n, peak)
    # second slightly detuned layer for body
    x += 0.5 * lowpass_sweep(rng.standard_normal(n), 150, bright * 0.4, 200, peak) * env_ad(n, peak)
    if pan_sweep:
        p = np.linspace(-0.8, 0.8, n)
        return np.stack([x * np.sqrt((1 - p) / 2), x * np.sqrt((1 + p) / 2)], 1)
    return x


def click(dur=0.05, f=3200):
    tt = t(dur)
    x = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 180) + 0.6 * rng.standard_normal(len(tt)) * np.exp(-tt * 400)
    return x


def shutter():
    # mirror slap + curtain: two mechanical clicks with a short noise burst between
    def mech(f, decay):
        tt = t(0.07)
        return (np.sin(2 * np.pi * f * tt) * 0.6 + rng.standard_normal(len(tt))) * np.exp(-tt * decay)
    x = np.zeros(int(SR * 0.32))
    a = mech(2400, 120); x[:len(a)] += a
    burst = lowpass_sweep(rng.standard_normal(int(SR * 0.08)), 2000, 6000, 1500, 0.3) * 0.5
    s = int(SR * 0.03); x[s:s + len(burst)] += burst * env_ad(len(burst), 0.2)
    b = mech(1800, 90); s = int(SR * 0.11); x[s:s + len(b)] += b * 0.9
    return x


def pop():
    tt = t(0.18)
    f = 900 * np.exp(-tt * 18) + 180
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 28)


def impact():
    tt = t(1.2)
    sub = np.sin(2 * np.pi * np.cumsum(70 * np.exp(-tt * 3) + 38) / SR) * np.exp(-tt * 3.5)
    noise = lowpass_sweep(rng.standard_normal(len(tt)), 4000, 4000, 300, 0.01) * np.exp(-tt * 9)
    return sub + 0.5 * noise


def riser(dur=1.6):
    n = int(SR * dur); tt = t(dur)
    noise = lowpass_sweep(rng.standard_normal(n), 300, 9000, 9000, 0.98) * (tt / dur) ** 2.2
    tone = sum(np.sin(2 * np.pi * np.cumsum(200 * 2 ** (3 * tt / dur) * m) / SR) for m in (1, 1.5, 2)) * (tt / dur) ** 3 * 0.15
    return noise + tone


def ding():
    tt = t(1.4)
    return sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, a, d in ((1318.5, 1, 3), (2637, 0.4, 5), (1975.5, 0.3, 4)))


def swipe():
    return whoosh(0.28, 0.4, 9000)


save('whoosh', whoosh(), -2)
save('whoosh_largo', whoosh(1.1, 0.6, 6000), -3)
save('swipe', swipe(), -3)
save('click', click(), -6)
save('click_suave', click(0.04, 2200), -10)
save('shutter', shutter(), -2)
save('pop', pop(), -5)
save('impact', impact(), -1)
save('riser', riser(), -4)
save('ding', ding(), -6)
print('ok')
