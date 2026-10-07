"""Genera index.html del video de Huerto (Inclusión y Diversidad Educativa).

21 s al ritmo del audio que mandaron (assets/audio/fondo-21s.mp3).
Re-generar: python3 -I build.py
"""
import math
import subprocess

TOTAL = 21.0
INTRO = 2.93
END = 18.54

# Escenas con tarjeta. enter: "wipe" = entra detrás de la hoja de papel, "toss" = la tarjeta anterior sale volando
SCENES = [
    {"id": "s1", "start": 2.93, "end": 6.04, "enter": "wipe", "video": "pegado", "mstart": 0.8, "word": "observar",
     "text": "Observación, creatividad y trabajo manual", "note": "materia de Huerto", "pos": "50% 50%", "origin": "50% 50%"},
    {"id": "s2", "start": 6.04, "end": 9.16, "enter": "toss", "img": "foto-manos", "word": "componer",
     "text": "Prensado y composición botánica", "note": "observar · elegir · componer", "pos": "50% 60%", "origin": "50% 55%",
     "insert": {"img": "foto-mesa", "pos": "62% 40%"}},
    {"id": "s3", "start": 9.16, "end": 12.82, "enter": "wipe", "img": "foto-equipo", "word": "cultivar",
     "text": "Habilidades que se cultivan", "note": None, "pos": "30% 50%", "origin": "40% 60%",
     "tags": [("atención", 70, 340, -6), ("organización", 590, 480, 5), ("coordinación motriz", 60, 820, 4), ("toma de decisiones", 520, 1010, -5)]},
    {"id": "s4", "start": 12.82, "end": 15.41, "enter": "toss", "video": "cuadro", "mstart": 0.3, "word": "explorar",
     "text": "Explorar formas, texturas y elementos naturales", "note": None, "pos": "8% 50%", "origin": "30% 45%"},
    {"id": "s5", "start": 15.41, "end": 18.54, "enter": "wipe", "img": "foto-cuadro", "word": "crear",
     "text": "Una experiencia para crear, participar y aprender desde lo concreto", "note": None, "pos": "72% 40%", "origin": "62% 42%"},
]
TILT = [-2, 2, -1.5, 2.5, -2]
WIPES = [INTRO] + [s["start"] for s in SCENES if s["enter"] == "wipe" and s["start"] != INTRO] + [END]


def dur(n):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"assets/audio/{n}.mp3"]).decode())


# ---------------------------------------------------------------- botánica en SVG
def leaflet(px, py, ang, ln, w):
    tx, ty = px + ln * math.cos(ang), py + ln * math.sin(ang)
    nx, ny = -math.sin(ang) * w, math.cos(ang) * w
    mx, my = (px + tx) / 2, (py + ty) / 2
    return f"M{px:.1f} {py:.1f} Q{mx + nx:.1f} {my + ny:.1f} {tx:.1f} {ty:.1f} Q{mx - nx:.1f} {my - ny:.1f} {px:.1f} {py:.1f}"


def fern(x0, y0, length, ang, bend=0.25, n=11):
    a = math.radians(ang)
    ex, ey = x0 + length * math.cos(a), y0 + length * math.sin(a)
    cx = (x0 + ex) / 2 - math.sin(a) * length * bend
    cy = (y0 + ey) / 2 + math.cos(a) * length * bend
    paths = [f"M{x0:.1f} {y0:.1f} Q{cx:.1f} {cy:.1f} {ex:.1f} {ey:.1f}"]
    for k in range(n):
        t = 0.12 + 0.82 * k / (n - 1)
        px = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * ex
        py = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * ey
        dx = 2 * (1 - t) * (cx - x0) + 2 * t * (ex - cx)
        dy = 2 * (1 - t) * (cy - y0) + 2 * t * (ey - cy)
        base = math.atan2(dy, dx)
        ln = length * 0.3 * (1 - 0.75 * t)
        for side in (-1, 1):
            paths.append(leaflet(px, py, base + side * 0.95, ln, ln * 0.22))
    return paths


# Flores prensadas a color: (id, base x, base y, flor x, flor y, radio, pétalos, color, borde)
FLORA = [
    ("f1", -20, 1940, 175, 1575, 78, 8, "#ec8fbd", "#c2648f"),
    ("f2", 1100, 1940, 905, 1640, 62, 6, "#9a7bc2", "#6f5296"),
    ("f3", -30, 980, 95, 790, 52, 7, "#f2c94c", "#c99a22"),
    ("f4", 1110, 1180, 985, 960, 56, 5, "#e8907a", "#b9614c"),
    ("f5", 300, 1960, 400, 1760, 44, 6, "#f4b2cf", "#c2648f"),
]


def flower(fid, bx, by, fx, fy, r, n, col, dark):
    cx, cy = (bx + fx) / 2 + (fy - by) * 0.18, (by + fy) / 2 + (bx - fx) * 0.05
    stem = f'<path d="M{bx} {by} Q{cx:.1f} {cy:.1f} {fx} {fy}" fill="none" stroke="#4f8a5b" stroke-width="6" stroke-linecap="round" />'
    ang = math.atan2(fy - by, fx - bx)
    leaves = "".join(
        f'<path d="{leaflet((bx + fx) / 2 * (1 - t) + bx * t, (by + fy) / 2 * (1 - t) + by * t, ang + side * 0.9, r * 1.1, r * 0.32)}" fill="#7bb187" stroke="#4f8a5b" stroke-width="2" />'
        for t, side in ((0.15, 1), (0.45, -1)))
    petals = "".join(f'<path d="{leaflet(fx, fy, 2 * math.pi * k / n + 0.3, r, r * 0.4)}" fill="{col}" fill-opacity=".9" stroke="{dark}" stroke-width="2" />' for k in range(n))
    center = f'<circle cx="{fx}" cy="{fy}" r="{r * 0.22:.1f}" fill="#e8b93a" stroke="#c99a22" stroke-width="2" />'
    return (f'<div class="fl layer" id="{fid}" style="transform-origin: {bx}px {by}px" data-layout-allow-overflow>'
            f'<svg class="layer" viewBox="0 0 1080 1920">{stem}{leaves}</svg>'
            f'<svg class="layer bloom" id="{fid}-b" viewBox="0 0 1080 1920" style="transform-origin: {fx}px {fy}px">{petals}{center}</svg></div>')


flora = "".join(flower(*f) for f in FLORA)
ferns = "".join(f'<path class="d" d="{p}" pathLength="1" />' for p in fern(-40, 600, 560, -62, 0.18, 11) + fern(1120, 1480, 520, -128, -0.2, 10))

# Pétalos flotando: (x, y, tamaño, color, desplazamiento x, desplazamiento y, giro)
PETALS = [(140, 260, 26, "#ec8fbd", 260, 900, 220), (880, 420, 20, "#f2c94c", -180, 820, -260), (520, 140, 18, "#9a7bc2", 120, 1100, 300),
          (60, 1180, 22, "#7bb187", 300, 520, -200), (980, 760, 24, "#ec8fbd", -260, 760, 240), (700, 1500, 18, "#f2c94c", -140, 380, -320),
          (300, 620, 16, "#e8907a", 220, 980, 280), (820, 1180, 20, "#7bb187", -220, 600, 200), (420, 980, 14, "#f4b2cf", 160, 760, -240),
          (980, 220, 16, "#9a7bc2", -300, 1000, 260)]
petals = "".join(f'<g class="pt" id="pt{k}" transform="translate({x} {y})"><path d="{leaflet(0, 0, 0.4, s, s * 0.42)}" fill="{c}" fill-opacity=".85" /></g>'
                 for k, (x, y, s, c, *_rest) in enumerate(PETALS))

# Hoja de papel para transiciones
wipe_fern = "".join(f'<path d="{p}" />' for p in fern(-60, 2250, 1500, -58, 0.16, 14)[1:] + fern(1150, 1500, 1100, -125, -0.2, 12)[1:])

# ---------------------------------------------------------------- escenas
W = lambda txt, cls="": " ".join(f'<span class="m"><span class="w {cls}">{w}</span></span>' for w in txt.split())
html_scenes, script, sfx = [], [], []
for i, s in enumerate(SCENES):
    t, e, sid = s["start"], s["end"], s["id"]
    d = e - t
    if "video" in s:
        media = f'<video id="{sid}-v" class="clip media" src="assets/clips/{s["video"]}.mp4" muted playsinline data-start="{t}" data-duration="{d}" data-media-start="{s["mstart"]}" data-track-index="{2 + i % 2}" style="object-position: {s["pos"]}; transform-origin: {s["origin"]}"></video>'
    else:
        media = f'<img class="media" src="assets/img/{s["img"]}.jpg" alt="" style="object-position: {s["pos"]}; transform-origin: {s["origin"]}" />'
    extra = ""
    if "insert" in s:
        extra += f'\n        <div class="card insert" id="{sid}-ins"><div class="win"><img class="media" src="assets/img/{s["insert"]["img"]}.jpg" alt="" style="object-position: {s["insert"]["pos"]}" /></div><i class="tape t3"></i></div>'
    for k, (w, x, y, r) in enumerate(s.get("tags", [])):
        extra += f'\n        <div class="skill" id="{sid}-k{k}" style="left: {x}px; top: {y}px; --r: {r}deg"><i></i>{w}</div>'
    note = f'<span class="note">{s["note"]}</span>' if s["note"] else ""
    html_scenes.append(f'''      <div class="scene" id="{sid}" style="opacity: 0">
        <div class="bgw" id="{sid}-bgw">{s["word"]}</div>
        <div class="card main" id="{sid}-card" style="--r: {TILT[i]}deg"><div class="win">{media}</div><i class="tape t1"></i><i class="tape t2"></i></div>{extra}
        <div class="tag" id="{sid}-tag"><span class="no">N.º {i + 1:02d} · Huerto</span><span class="tx">{W(s["text"])}</span>{note}</div>
      </div>''')
    script.append(f'      scene("#{sid}", {t}, {e}, {TILT[i]}, "{s["enter"]}", {str(i + 1 < len(SCENES) and SCENES[i + 1]["enter"] == "toss").lower()});')
    if s["enter"] == "toss":
        sfx.append(("swish", t - 0.25, 0.4))
    if "insert" in s:
        script.append(f'      tl.fromTo("#{sid}-ins", {{ x: -520, rotate: -20, opacity: 0 }}, {{ x: 0, rotate: -6, opacity: 1, duration: 0.7, ease: "back.out(1.3)" }}, {t + 1.1});')
        sfx.append(("swish", t + 1.1, 0.3))
    for k, _ in enumerate(s.get("tags", [])):
        at = t + 0.8 + 0.45 * k
        script.append(f'      tl.fromTo("#{sid}-k{k}", {{ scale: 0, opacity: 0, rotate: -12 }}, {{ scale: 1, opacity: 1, rotate: 0, duration: 0.45, ease: "back.out(2.2)" }}, {at:.2f});')
        sfx.append(("tick", at, 0.3))
for w in WIPES:
    script.append(f"      wipe({w});")
    sfx.append(("whoosh-long", w - 0.45, 0.35))

audio = [f'      <audio id="music" src="assets/audio/fondo-21s.mp3" data-start="0" data-duration="{TOTAL}" data-track-index="20" data-volume="1"></audio>']
for j, (n, t, v) in enumerate(sfx):
    audio.append(f'      <audio id="fx{j:02d}" src="assets/audio/{n}.mp3" data-start="{t:.2f}" data-duration="{min(dur(n) - 0.03, TOTAL - t):.2f}" data-track-index="{21 + j}" data-volume="{v}"></audio>')

FAN = [("foto-manos", 70, 380, -9), ("foto-equipo", 300, 330, -3), ("foto-mesa", 530, 340, 4), ("foto-cuadro", 760, 390, 10)]
fan = "\n".join(f'          <div class="mini" style="left: {x}px; top: {y}px; --r: {r}deg"><img src="assets/img/{p}.jpg" alt="" /></div>' for p, x, y, r in FAN)

html = f'''<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>Huerto Inclusión Westhill</title>
    <script src="assets/gsap.min.js"></script>
    <style>
      @font-face {{ font-family: "Cormorant"; src: url("assets/fonts/cormorant-garamond-latin-400-normal.woff2") format("woff2"); font-weight: 400; font-display: block; }}
      @font-face {{ font-family: "Cormorant"; src: url("assets/fonts/cormorant-garamond-latin-700-normal.woff2") format("woff2"); font-weight: 700; font-display: block; }}
      @font-face {{ font-family: "Caveat"; src: url("assets/fonts/caveat-latin-700-normal.woff2") format("woff2"); font-weight: 700; font-display: block; }}
      @font-face {{ font-family: "Geist"; src: url("assets/fonts/geist-latin-wght-normal.woff2") format("woff2"); font-weight: 100 900; font-display: block; }}
      @font-face {{ font-family: "Geist Mono"; src: url("assets/fonts/geist-mono-latin-500-normal.woff2") format("woff2"); font-weight: 500; font-display: block; }}
      :root {{ --blue: #276092; --ink: #173d61; --green: #27ae60; --green-ink: #1d7f47; --gold: #f2c94c; --paper: #f5f0e4; }}
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: 1080px; height: 1920px; overflow: hidden; background: var(--paper); }}
      #root {{ position: relative; width: 100%; height: 100%; overflow: hidden; font-family: "Geist", sans-serif; color: var(--ink); background: radial-gradient(110% 70% at 50% 40%, #fbf8f0 0%, var(--paper) 60%, #e9e0cb 100%); }}
      .layer {{ position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; overflow: visible; }}
      #ferns {{ fill: none; stroke: #27ae60; stroke-width: 3px; stroke-linecap: round; opacity: .45; }}
      #ferns .d {{ stroke-dasharray: 1; stroke-dashoffset: 1; }}

      .head {{ position: absolute; left: 80px; top: 92px; }}
      .head b {{ display: block; font: 500 25px/1 "Geist Mono", monospace; letter-spacing: .12em; text-transform: uppercase; color: var(--blue); }}
      .head span {{ display: block; margin-top: 6px; font: 700 52px/1 "Caveat", cursive; color: var(--green-ink); }}
      .stem {{ position: absolute; left: 80px; width: 640px; top: 196px; height: 3px; border-radius: 3px; background: linear-gradient(90deg, var(--green), var(--gold)); transform-origin: 0 50%; }}
      .pennant {{ position: absolute; right: 70px; top: 0; width: 170px; filter: drop-shadow(0 10px 14px rgba(23,61,97,.25)); transform-origin: 50% 0; }}
      .pennant img {{ display: block; width: 100%; }}

      .intro {{ position: absolute; inset: 0; }}
      .kick {{ position: absolute; left: 0; right: 0; top: 590px; text-align: center; font: 500 28px/1 "Geist Mono", monospace; letter-spacing: .16em; text-transform: uppercase; color: var(--blue); }}
      .title {{ position: absolute; left: 60px; right: 60px; top: 660px; text-align: center; font: 700 124px/1.0 "Cormorant", serif; letter-spacing: -.01em; color: var(--ink); }}
      .title .ln {{ display: block; }}
      .m {{ display: inline-block; overflow: hidden; vertical-align: top; padding-bottom: 10px; }}
      .w {{ display: inline-block; }}
      .w.g {{ color: var(--green-ink); }}
      .hand {{ position: absolute; left: 0; right: 0; top: 1120px; text-align: center; font: 700 70px/1 "Caveat", cursive; color: var(--green-ink); }}
      .uline {{ position: absolute; left: 330px; top: 1192px; width: 420px; height: 40px; fill: none; stroke: var(--gold); stroke-width: 6px; stroke-linecap: round; }}
      .uline path {{ stroke-dasharray: 1; stroke-dashoffset: 1; }}

      .scene {{ position: absolute; inset: 0; }}
      .bgw {{ position: absolute; left: 0; top: 1600px; white-space: nowrap; font: 700 300px/1 "Cormorant", serif; letter-spacing: -.02em; color: rgba(39,96,146,.08); }}
      .card {{ position: absolute; background: #fffdf8; padding: 22px; box-shadow: 0 2px 0 rgba(23,61,97,.06), 0 40px 70px -40px rgba(23,61,97,.55); }}
      .card.main {{ left: 120px; top: 260px; width: 840px; height: 1130px; transform: rotate(var(--r)); }}
      .card.insert {{ left: 50px; top: 280px; width: 400px; height: 530px; padding: 16px; }}
      .win {{ position: relative; width: 100%; height: 100%; overflow: hidden; background: #e9e2d1; }}
      .media {{ position: absolute; left: 0; top: 0; width: 100%; height: 100%; object-fit: cover; }}
      .tape {{ position: absolute; width: 190px; height: 54px; }}
      .tape.t1 {{ left: -40px; top: 26px; transform: rotate(-38deg); background: rgba(242,201,76,.78); }}
      .tape.t2 {{ right: -40px; top: 26px; transform: rotate(38deg); background: rgba(39,174,96,.55); }}
      .tape.t3 {{ left: 115px; top: -22px; width: 170px; transform: rotate(-4deg); background: rgba(242,201,76,.78); }}
      .tag {{ position: absolute; left: 150px; width: 780px; top: 1320px; padding: 26px 40px 32px; background: #fffdf8; border: 2px solid rgba(39,96,146,.28); border-radius: 10px; box-shadow: 0 30px 50px -36px rgba(23,61,97,.6); }}
      .tag .no {{ display: block; font: 500 24px/1 "Geist Mono", monospace; letter-spacing: .12em; text-transform: uppercase; color: var(--green-ink); }}
      .tag .tx {{ display: block; margin-top: 12px; font: 700 60px/1.04 "Cormorant", serif; color: var(--ink); }}
      .tag .tx .m {{ padding-bottom: 6px; }}
      .tag .note {{ display: block; margin-top: 8px; font: 700 46px/1 "Caveat", cursive; color: var(--blue); }}
      .skill {{ position: absolute; display: flex; align-items: center; gap: 16px; padding: 14px 30px 18px 22px; border-radius: 16px; background: #fffdf8; box-shadow: 0 18px 30px -18px rgba(23,61,97,.7); font: 700 54px/1 "Caveat", cursive; color: var(--green-ink); rotate: var(--r); }}
      .skill i {{ width: 18px; height: 18px; border-radius: 50%; border: 3px solid var(--gold); }}

      #wipe {{ position: absolute; left: 0; top: 0; width: 1080px; height: 2300px; transform: translateY(2000px); }}
      #wipe .bands {{ position: absolute; left: 0; right: 0; top: 0; height: 70px; background: linear-gradient(180deg, var(--green) 0 44px, var(--gold) 44px 70px); }}
      #wipe .sheet {{ position: absolute; left: 0; right: 0; top: 70px; bottom: 0; background: #efe6d2; }}
      #wipe svg {{ position: absolute; left: 0; top: 0; width: 1080px; height: 2300px; fill: rgba(39,174,96,.22); }}

      .end {{ position: absolute; inset: 0; }}
      .mini {{ position: absolute; width: 250px; height: 320px; padding: 12px 12px 40px; background: #fffdf8; box-shadow: 0 24px 40px -24px rgba(23,61,97,.7); rotate: var(--r); }}
      .mini img {{ display: block; width: 100%; height: 100%; object-fit: cover; }}
      .end-logo {{ position: absolute; left: 240px; top: 800px; width: 600px; }}
      .end-logo img {{ display: block; width: 100%; }}
      .end-t {{ position: absolute; left: 60px; right: 60px; top: 1080px; text-align: center; font: 700 78px/1.04 "Cormorant", serif; color: var(--ink); }}
      .end-h {{ position: absolute; left: 0; right: 0; top: 1280px; text-align: center; font: 700 62px/1 "Caveat", cursive; color: var(--green-ink); }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
      <svg id="ferns" class="layer" viewBox="0 0 1080 1920" data-layout-allow-overflow>{ferns}</svg>
      <div id="flora" class="layer" data-layout-allow-overflow>{flora}</div>
      <svg id="petals" class="layer" viewBox="0 0 1080 1920" data-layout-allow-overflow>{petals}</svg>

      <div class="intro clip" id="intro" data-start="0" data-duration="{INTRO}" data-track-index="1">
        <p class="kick" id="kick">Inclusión y Diversidad Educativa</p>
        <h1 class="title" id="title"><span class="ln">{W("Naturaleza")}</span><span class="ln">{W("que se transforma")}</span><span class="ln">{W("en")} {W("aprendizaje", "g")}</span></h1>
        <p class="hand" id="hand">materia de Huerto</p>
        <svg class="uline" viewBox="0 0 420 40"><path id="uline" d="M6 26 C 110 8, 220 34, 414 14" pathLength="1" /></svg>
      </div>

      <div class="head clip" id="head" data-start="{INTRO}" data-duration="{END - INTRO}" data-track-index="4"><b>Inclusión y Diversidad Educativa</b><span>Huerto</span></div>
      <div class="stem clip" id="stem" data-start="{INTRO}" data-duration="{END - INTRO}" data-track-index="5"></div>

{chr(10).join(html_scenes)}

      <div class="end clip" id="end" data-start="{END}" data-duration="{TOTAL - END}" data-track-index="12">
{fan}
        <div class="end-logo" id="end-logo"><img src="assets/img/logo-westhill-transp.png" alt="Universidad Westhill" /></div>
        <h2 class="end-t" id="end-t">Inclusión y Diversidad Educativa</h2>
        <p class="end-h" id="end-h">aprender desde lo concreto</p>
      </div>

      <div id="wipe" data-layout-allow-overflow><div class="bands"></div><div class="sheet"></div><svg viewBox="0 0 1080 2300">{wipe_fern}</svg></div>
      <div class="pennant" id="pennant"><img src="assets/img/banderin-rosa.png" alt="UW Westhill, mes de la lucha contra el cáncer de mama" /></div>

{chr(10).join(audio)}
    </div>

    <script>
      const tl = gsap.timeline({{ paused: true }});
      const ease = "power3.out";

      // Hoja de papel que barre la pantalla; el corte ocurre cuando cubre todo
      function wipe(at) {{
        tl.fromTo("#wipe", {{ y: 2000 }}, {{ y: -2400, duration: 0.9, ease: "none", immediateRender: false }}, at - 0.45);
      }}
      function scene(id, t, e, r, how, tossNext) {{
        tl.set(id, {{ opacity: 1, x: 0 }}, how === "toss" ? t - 0.1 : t);
        tl.set(id, {{ opacity: 0 }}, e);
        if (how === "toss") tl.fromTo(id + "-card", {{ x: 1150, rotate: r + 16 }}, {{ x: 0, rotate: r, duration: 0.6, ease }}, t - 0.1);
        else tl.fromTo(id + "-card", {{ y: 140, scale: 0.94, rotate: r + 4 }}, {{ y: 0, scale: 1, rotate: r, duration: 0.8, ease }}, t);
        tl.fromTo(id + " .win .media", {{ scale: 1.14 }}, {{ scale: 1.0, duration: e - t, ease: "none" }}, t);
        tl.fromTo(id + "-tag", {{ y: 90, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.6, ease }}, t + 0.25);
        tl.fromTo(id + "-tag .tx .w", {{ yPercent: 110 }}, {{ yPercent: 0, duration: 0.55, ease, stagger: 0.04 }}, t + 0.35);
        if (document.querySelector(id + "-tag .note")) tl.fromTo(id + "-tag .note", {{ opacity: 0, x: -20 }}, {{ opacity: 1, x: 0, duration: 0.45, ease }}, t + 0.8);
        tl.fromTo(id + "-bgw", {{ x: 160 }}, {{ x: -260, duration: e - t, ease: "none" }}, t);
        if (tossNext) tl.fromTo(id, {{ x: 0, rotate: 0 }}, {{ x: -1150, rotate: -10, duration: 0.45, ease: "power2.in", immediateRender: false }}, e - 0.45);
      }}

      // Flora: crece al inicio, se mece todo el video; pétalos flotan
      tl.fromTo("#ferns .d", {{ strokeDashoffset: 1 }}, {{ strokeDashoffset: 0, duration: 1.3, ease: "power2.out", stagger: 0.02 }}, 0.1);
{chr(10).join(f'      tl.fromTo("#{f[0]}", {{ scale: 0 }}, {{ scale: 1, duration: 0.9, ease: "back.out(1.4)" }}, {0.15 + 0.12 * k:.2f});' + chr(10) + f'      tl.fromTo("#{f[0]}-b", {{ scale: 0.2, rotate: -60 }}, {{ scale: 1, rotate: 0, duration: 0.8, ease: "back.out(1.8)" }}, {0.45 + 0.12 * k:.2f});' + chr(10) + f'      tl.fromTo("#{f[0]}", {{ rotate: 0 }}, {{ rotate: {(-1) ** k * 4}, duration: {TOTAL - 1.2}, ease: "sine.inOut", immediateRender: false }}, 1.7);' for k, f in enumerate(FLORA))}
{chr(10).join(f'      tl.fromTo("#pt{k}", {{ x: {x}, y: {y}, rotate: 0, opacity: 0 }}, {{ x: {x + dx}, y: {y + dy}, rotate: {rot}, opacity: 1, duration: {TOTAL}, ease: "none", svgOrigin: "0 0" }}, 0);' for k, (x, y, s, c, dx, dy, rot) in enumerate(PETALS))}
      tl.fromTo("#pennant", {{ y: -200 }}, {{ y: 0, duration: 0.8, ease: "back.out(1.4)" }}, 0.2);
      tl.fromTo("#pennant", {{ rotate: 0 }}, {{ rotate: 2, duration: {TOTAL - 1}, ease: "sine.inOut", immediateRender: false }}, 1.0);

      // Intro
      tl.fromTo("#kick", {{ y: 20, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.6, ease }}, 0.2);
      tl.fromTo("#title .w", {{ yPercent: 110 }}, {{ yPercent: 0, duration: 0.7, ease, stagger: 0.09 }}, 0.35);
      tl.fromTo("#title", {{ scale: 1 }}, {{ scale: 1.05, duration: {INTRO}, ease: "none" }}, 0);
      tl.fromTo("#hand", {{ y: 20, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.6, ease }}, 1.2);
      tl.fromTo("#uline", {{ strokeDashoffset: 1 }}, {{ strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut" }}, 1.45);
      tl.fromTo("#head", {{ y: -30, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.6, ease }}, {INTRO});
      tl.fromTo("#stem", {{ scaleX: 0 }}, {{ scaleX: 1, duration: {END - INTRO}, ease: "none" }}, {INTRO});

{chr(10).join(script)}

      // Cierre
      tl.fromTo("#end .mini", {{ y: -700, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.3)", stagger: 0.08 }}, {END + 0.1});
      tl.fromTo("#end-logo", {{ y: 40, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.8, ease }}, {END + 0.45});
      tl.fromTo("#end-t", {{ y: 30, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.7, ease }}, {END + 0.75});
      tl.fromTo("#end-h", {{ y: 20, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.7, ease }}, {END + 1.05});

      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
'''
open("index.html", "w").write(html)
print("ok", TOTAL)
