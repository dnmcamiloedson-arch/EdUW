#!/usr/bin/env python3
"""QA automático de un render. Mide sobre el MP4 final, no sobre supuestos.

  python3 scripts/qa.py out/psicologia_54321_9x16.mp4 --variant 28 --layout 9x16 [--captions] [--sheet out/contact_sheet.png]

Comprueba: formato (ffprobe) · contact sheet con zonas seguras · sincronía de subtítulos
(aparición medida en píxeles vs. inicio de palabra del TTS, y arranque de voz en el audio) ·
contraste WCAG medido en píxeles (subtítulos, números, nota) · flashes (WCAG 2.3.1) ·
loudness / true peak / clipping / saltos de volumen.
Escribe out/qa/<nombre>.json y devuelve código 1 si algo falla.
"""
import argparse
import json
import re
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import binary_dilation

ROOT = Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / "config.json").read_text())
SHEET_TIMES = [0, 2, 5, 9, 13, 17, 21, 25, 27.9]


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, check=True)


def probe(path):
    out = run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels:format=duration", "-of", "json", str(path)]).stdout
    return json.loads(out)


def frames(path, w, h, scale=1.0):
    """Itera frames RGB (float 0..1) decodificados con ffmpeg."""
    sw, sh = int(w * scale) // 2 * 2, int(h * scale) // 2 * 2
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", str(path), "-vf", f"scale={sw}:{sh}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    n = sw * sh * 3
    while True:
        buf = p.stdout.read(n)
        if len(buf) < n:
            break
        yield np.frombuffer(buf, np.uint8).reshape(sh, sw, 3).astype(np.float32) / 255.0
    p.wait()


def rel_lum(rgb):
    c = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    return 0.2126 * c[..., 0] + 0.7152 * c[..., 1] + 0.0722 * c[..., 2]


def hex_lum(h):
    v = np.array([int(h[i : i + 2], 16) for i in (1, 3, 5)], np.float32) / 255
    return float(rel_lum(v[None, :])[0])


contrast = lambda a, b: (max(a, b) + 0.05) / (min(a, b) + 0.05)


def contact_sheet(path, L, out, times):
    tiles = []
    for t in times:
        f = out.parent / f"_sheet_{t}.png"
        run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", str(path), "-frames:v", "1", "-vf", "scale=360:-2", str(f)])
        tiles.append((t, Image.open(f).convert("RGB")))
        f.unlink()
    w, h = tiles[0][1].size
    cols = min(len(tiles), 5 if L["height"] > L["width"] else 3)
    rows = (len(tiles) + cols - 1) // cols
    pad, lab = 10, 34
    sheet = Image.new("RGB", (cols * w + (cols + 1) * pad, rows * (h + lab) + pad), (24, 24, 28))
    d = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", 20)
    except OSError:
        font = ImageFont.load_default()
    s = w / L["width"]
    for i, (t, im) in enumerate(tiles):
        dd = ImageDraw.Draw(im)
        top, bot = L["safe"]["top"] * s, h - L["safe"]["bottom"] * s
        dd.line([(0, top), (w, top)], fill=(255, 90, 90), width=1)
        dd.line([(0, bot), (w, bot)], fill=(255, 90, 90), width=1)
        x, y = pad + (i % cols) * (w + pad), pad + (i // cols) * (h + lab)
        sheet.paste(im, (x, y))
        d.text((x + 4, y + h + 6), f"{t:.1f} s", fill=(235, 235, 235), font=font)
    sheet.save(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--variant", default=CFG["activeVariant"])
    ap.add_argument("--layout", default="9x16")
    ap.add_argument("--captions", action="store_true")
    ap.add_argument("--sheet", default=None)
    a = ap.parse_args()

    video = Path(a.video).resolve()
    tl = json.loads((ROOT / "assets" / "timeline" / f"{a.variant}.json").read_text())
    L = CFG["layouts"][a.layout]
    P = CFG["palette"]
    fps = tl["fps"]
    rep, fails = {"video": str(video.relative_to(ROOT))}, []

    # 1 · formato
    pr = probe(video)
    v = next(s for s in pr["streams"] if s["codec_type"] == "video")
    au = next((s for s in pr["streams"] if s["codec_type"] == "audio"), None)
    dur = float(pr["format"]["duration"])
    W, H = v["width"], v["height"]
    rep["format"] = {"duration": dur, "size": f"{W}x{H}", "fps": v["r_frame_rate"], "frames": int(v["nb_frames"]), "video": v["codec_name"], "audio": au and f"{au['codec_name']} {au['sample_rate']} Hz {au['channels']}ch"}
    if abs(dur - tl["duration"]) > 0.001 or int(v["nb_frames"]) != tl["durationInFrames"] or v["r_frame_rate"] != f"{fps}/1":
        fails.append("duración/fps")
    if v["codec_name"] != "h264" or not au or au["codec_name"] != "aac":
        fails.append("codecs")
    sc = W / L["width"]  # 0.5 en el preview

    # 2 · contact sheet
    if a.sheet:
        times = [t for t in SHEET_TIMES if t < tl["duration"]] if a.variant == "28" else [0, 2, 6, 12, 18, 24, 30, 35, 39.9]
        contact_sheet(video, {**L, "width": W, "height": H, "safe": {k: v_ * sc for k, v_ in L["safe"].items()}}, ROOT / a.sheet, times)
        rep["contactSheet"] = a.sheet

    # 3-5 · análisis por frame (a resolución de análisis 540 px de ancho)
    k = 540 / W
    cy0, cy1 = int((L["captions"]["y"] - 10) * sc * k), int((L["captions"]["y"] + L["captions"]["size"] * 2.6) * sc * k)
    gx, gy = 4, 6  # rejilla para flashes: cada celda ≈ 4 % de la pantalla (más estricto que el campo de 10° de WCAG)
    cap_count, tile_lum, mean_lum = [], [], []
    cap_bg, num_samples = [], []
    cx, cyc, R = L["circle"]["cx"] * sc * k, L["circle"]["cy"] * sc * k, L["circle"]["r"] * sc * k
    steps = {s["id"]: s for s in tl["sections"] if s["kind"] == "step"}
    for i, fr in enumerate(frames(video, W, H, k)):
        t = i / fps
        lum = rel_lum(fr)
        h_, w_ = lum.shape
        mean_lum.append(float(lum.mean()))
        tile_lum.append([float(lum[r * h_ // gy : (r + 1) * h_ // gy, c * w_ // gx : (c + 1) * w_ // gx].mean()) for r in range(gy) for c in range(gx)])
        band = lum[cy0:cy1]
        txt = band > 0.55
        cap_count.append(int(txt.sum()))
        if a.captions and txt.sum() > 200:
            # fondo real = píxeles a más de 6 px de cualquier trazo (excluye antialias y sombra del propio texto)
            near_txt = binary_dilation(band > 0.12, iterations=6)
            bg = band[~near_txt]
            cap_bg.append(float(np.percentile(bg, 99.5)) if bg.size else 0.0)
        # números: fondo del disco alrededor del glifo (anillo 0.62R–0.8R)
        for s in steps.values():
            if s["start"] + 1.0 < t < s["end"] - 0.6:
                yy, xx = np.mgrid[0:h_, 0:w_]
                rr = np.hypot(xx - cx, yy - cyc)
                ring = lum[(rr > 0.62 * R) & (rr < 0.8 * R)]
                num_samples.append((s["id"], float(np.percentile(ring, 99)), float(np.percentile(ring, 1))))
    mean_lum, tile_lum = np.array(mean_lum), np.array(tile_lum)

    # 3 · sincronía de subtítulos: frame en que aparece cada grupo vs. inicio de su 1.ª palabra
    if a.captions:
        cc = np.array(cap_count)
        thr = max(60, 0.04 * cc.max())
        sync = []
        for c in tl["captions"]:
            exp = c["words"][0]["start"]
            lo, hi = int((exp - 0.4) * fps), int((exp + 0.4) * fps)
            on = next((f for f in range(max(lo, 1), hi) if cc[f] >= thr and cc[f - 1] < thr), None)
            err = None if on is None else round(on - exp * fps, 1)
            sync.append({"text": " ".join(w["text"] for w in c["words"]), "expectedFrame": round(exp * fps, 1), "onsetFrame": on, "errFrames": err})
            if err is None or abs(err) > 3:
                fails.append(f"sync «{sync[-1]['text']}» ({err})")
        rep["captionSync"] = {"toleranceFrames": 3, "maxAbsErr": max(abs(s["errFrames"]) for s in sync if s["errFrames"] is not None), "groups": sync}

    # 3b · voz en el audio vs. timeline (arranque de cada toma)
    stem = ROOT / "out" / "stems" / a.variant / "voz.flac"
    if stem.exists():
        sr = 48000
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(stem), "-f", "f32le", "-ac", "2", "-ar", str(sr), "-"], capture_output=True, check=True).stdout
        x = np.frombuffer(raw, np.float32).reshape(-1, 2)
        x = x.mean(axis=1) if x.ndim > 1 else x
        hop = sr // 100
        env = np.sqrt(np.convolve(x**2, np.ones(hop) / hop, mode="same"))[::hop]
        ref = np.percentile(env[env > 0], 99)
        vs = []
        for w in [c["words"][0] for c in tl["captions"]]:
            s0 = max(0.0, w["start"] - 0.3)
            seg = env[int(s0 * 100) : int((w["start"] + 0.3) * 100)]
            onset = s0 + np.argmax(seg > ref * 0.06) / 100
            vs.append(round((onset - w["start"]) * fps, 1))
        rep["voiceOnsetVsWordStart"] = {"maxAbsErrFrames": float(np.max(np.abs(vs))), "errsFrames": vs}
        if np.max(np.abs(vs)) > 3:
            fails.append("voz desfasada")

    # 4 · contraste (medido)
    text_l = hex_lum(P["white"])
    con = {}
    if cap_bg:
        con["captions_min"] = round(contrast(text_l, max(cap_bg)), 2)
    for sid in steps:
        smp = [s for s in num_samples if s[0] == sid]
        if not smp:
            continue
        if sid == "saborear":
            num_l, bg_l = hex_lum(P["deep"]), min(s[2] for s in smp)
        else:
            num_l, bg_l = hex_lum(P["cream"]), max(s[1] for s in smp)
        con[f"number_{sid}"] = round(contrast(num_l, bg_l), 2)
    con["disclaimer"] = round(contrast(hex_lum(P["cream"]), hex_lum(P["deep"])), 2)
    rep["contrast"] = con
    for kname, val in con.items():
        need = 4.5 if kname in ("captions_min", "disclaimer") else 3.0  # números = texto grande (AA 3:1)
        if val < need:
            fails.append(f"contraste {kname} {val}")

    # 5 · flashes: par de cambios opuestos ≥10 % de luminancia relativa con la más oscura < 0.8 (WCAG 2.3.1)
    def count_flashes(series):
        ext, last, direction = [], series[0], 0
        for i_, val in enumerate(series[1:], 1):
            dlt = val - last
            if abs(dlt) >= 0.1 and min(val, last) < 0.8:
                d = 1 if dlt > 0 else -1
                if d != direction:
                    ext.append(i_)
                    direction = d
                last = val
            elif (direction > 0 and val > last) or (direction < 0 and val < last):
                last = val
        worst = 0
        for j in range(len(ext)):
            win = [e for e in ext if ext[j] <= e < ext[j] + fps]
            worst = max(worst, len(win) // 2)
        return worst

    fl = max([count_flashes(mean_lum)] + [count_flashes(tile_lum[:, c]) for c in range(tile_lum.shape[1])])
    max_step = float(np.abs(np.diff(tile_lum, axis=0)).max())
    rep["flashes"] = {"maxFlashesPerSecond": fl, "maxFrameToFrameLumChange_tile": round(max_step, 4), "maxFrameToFrameLumChange_full": round(float(np.abs(np.diff(mean_lum)).max()), 4)}
    if fl > 3 or fl > 0:
        fails.append(f"flashes {fl}/s")

    # 6 · audio
    if au:
        r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(video), "-map", "0:a", "-af", "ebur128=peak=true:framelog=info", "-f", "null", "-"], capture_output=True, text=True).stderr
        I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1])
        TP = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r)[-1])
        LRA = float(re.findall(r"LRA:\s+(-?[\d.]+) LU", r)[-1])
        M = [float(m) for m in re.findall(r"M:\s*(-?[\d.]+)", r)]
        M = np.array([m for m in M if m > -70])
        jumps = np.diff(M[::4]) if len(M) > 8 else np.array([0])  # cada 0.4 s
        st = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(video), "-map", "0:a", "-af", "astats=metadata=0", "-f", "null", "-"], capture_output=True, text=True).stderr
        peak = max(float(p) for p in re.findall(r"Peak level dB:\s*(-?[\d.]+)", st))
        rep["audio"] = {"integratedLUFS": I, "truePeak_dBTP": TP, "LRA": LRA, "samplePeak_dBFS": peak, "maxMomentaryJump_dB_per_400ms": round(float(jumps.max()), 1)}
        if abs(I - CFG["audio"]["targetLufs"]) > 0.6:
            fails.append(f"LUFS {I}")
        if TP > CFG["audio"]["truePeak"]:
            fails.append(f"true peak {TP}")
        if peak >= 0:
            fails.append("clipping")

    rep["fails"] = fails
    rep["pass"] = not fails
    out = ROOT / "out" / "qa"
    out.mkdir(parents=True, exist_ok=True)
    (out / f"{video.stem}.json").write_text(json.dumps(rep, ensure_ascii=False, indent=1))
    print(json.dumps({k_: rep[k_] for k_ in rep if k_ not in ("captionSync",)}, ensure_ascii=False, indent=1))
    if "captionSync" in rep:
        print("sync subtítulos: error máx", rep["captionSync"]["maxAbsErr"], "frames")
    raise SystemExit(0 if not fails else 1)


if __name__ == "__main__":
    main()
