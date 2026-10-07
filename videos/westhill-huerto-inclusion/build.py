"""Genera index.html del video de Huerto (Inclusión y Diversidad Educativa)."""
import math
import subprocess

SCENE = 5.0
TOTAL = 35.0

# Escenas con tarjeta: media, texto de la etiqueta, nota manuscrita y encuadre
SCENES = [
    {"id": "s2", "start": 5, "video": "pegado", "text": "Observación, creatividad y trabajo manual", "note": "materia de Huerto", "pos": "50% 50%", "origin": "50% 50%"},
    {"id": "s3", "start": 10, "img": "foto-manos", "text": "Prensado y composición botánica", "note": "observar · elegir · componer", "pos": "50% 60%", "origin": "50% 55%",
     "insert": {"img": "foto-mesa", "pos": "62% 40%"}},
    {"id": "s4", "start": 15, "img": "foto-equipo", "text": "Habilidades que se cultivan", "note": None, "pos": "30% 50%", "origin": "40% 60%",
     "tags": [("atención", 70, 330, -6), ("organización", 590, 470, 5), ("coordinación motriz", 60, 820, 4), ("toma de decisiones", 520, 1000, -5)]},
    {"id": "s5", "start": 20, "video": "cuadro", "text": "Explorar formas, texturas y elementos naturales", "note": None, "pos": "8% 50%", "origin": "30% 45%"},
    {"id": "s6", "start": 25, "img": "foto-cuadro", "text": "Una experiencia para crear, participar y aprender desde lo concreto", "note": None, "pos": "72% 40%", "origin": "62% 42%"},
]
TILT = [-2, 2, -1.5, 2.5, -2]


def dur(n):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"assets/audio/{n}.mp3"]).decode())


# ---------------------------------------------------------------- botánica en SVG
def leaflet(px, py, ang, ln, w):
    tx, ty = px + ln * math.cos(ang), py + ln * math.sin(ang)
    nx, ny = -math.sin(ang) * w, math.cos(ang) * w
    mx, my = (px + tx) / 2, (py + ty) / 2
    return f"M{px:.1f} {py:.1f} Q{mx + nx:.1f} {my + ny:.1f} {tx:.1f} {ty:.1f} Q{mx - nx:.1f} {my - ny:.1f} {px:.1f} {py:.1f}"


def fern(x0, y0, length, ang, bend=0.25, n=11):
    """Helecho: tallo curvo + foliolos alternos que se acortan hacia la punta."""
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


def leaf(x, y, ln, ang):
    """Hoja ovalada con nervadura central y nervios laterales."""
    a = math.radians(ang)
    paths = [leaflet(x, y, a, ln, ln * 0.32)]
    tx, ty = x + ln * math.cos(a), y + ln * math.sin(a)
    paths.append(f"M{x:.1f} {y:.1f} L{tx:.1f} {ty:.1f}")
    for k in range(1, 5):
        t = k / 5.5
        px, py = x + ln * t * math.cos(a), y + ln * t * math.sin(a)
        for side in (-1, 1):
            va = a + side * 0.75
            vl = ln * 0.2 * (1 - t * 0.6)
            paths.append(f"M{px:.1f} {py:.1f} L{px + vl * math.cos(va):.1f} {py + vl * math.sin(va):.1f}")
    return paths


def svg(id_, paths, color, width):
    body = "".join(f'<path class="d" d="{p}" pathLength="1" />' for p in paths)
    return f'<svg id="{id_}" class="bot" viewBox="0 0 1080 1920" style="stroke: {color}; stroke-width: {width}px">{body}</svg>'


BOT = [
    svg("b1", fern(-40, 560, 620, -62, 0.18, 12), "#27ae60", 3),
    svg("b2", fern(1120, 1500, 600, -128, -0.2, 11), "#27ae60", 3),
    svg("b3", leaf(880, 330, 230, -140) + leaf(150, 1640, 200, -35), "#276092", 2.5),
]

# ---------------------------------------------------------------- escenas
html_scenes, script, sfx = [], [], []
for i, s in enumerate(SCENES):
    t, sid = s["start"], s["id"]
    if "video" in s:
        media = f'<video id="{sid}-v" class="clip media" src="assets/clips/{s["video"]}.mp4" muted playsinline data-start="{t}" data-duration="{SCENE}" data-media-start="0" data-track-index="{2 + i % 2}" style="object-position: {s["pos"]}; transform-origin: {s["origin"]}"></video>'
    else:
        media = f'<img class="media" src="assets/img/{s["img"]}.jpg" alt="" style="object-position: {s["pos"]}; transform-origin: {s["origin"]}" />'
    extra = ""
    if "insert" in s:
        extra += f'\n        <div class="card insert" id="{sid}-ins"><div class="win"><img class="media" src="assets/img/{s["insert"]["img"]}.jpg" alt="" style="object-position: {s["insert"]["pos"]}" /></div><i class="tape t3"></i></div>'
    for k, (w, x, y, r) in enumerate(s.get("tags", [])):
        extra += f'\n        <div class="skill" id="{sid}-k{k}" style="left: {x}px; top: {y}px; --r: {r}deg"><i></i>{w}</div>'
    note = f'<span class="note">{s["note"]}</span>' if s["note"] else ""
    html_scenes.append(f'''      <div class="scene" id="{sid}" style="opacity: 0">
        <div class="card main" id="{sid}-card" style="--r: {TILT[i]}deg"><div class="win">{media}</div><i class="tape t1"></i><i class="tape t2"></i></div>{extra}
        <div class="tag" id="{sid}-tag"><span class="no">N.º {i + 1:02d} · Huerto</span><span class="tx">{s["text"]}</span>{note}</div>
      </div>''')
    script.append(f'      enter("#{sid}", {t}, {TILT[i]});')
    if i < len(SCENES) - 1:
        script.append(f'      leave("#{sid}", {t + SCENE});')
    if "insert" in s:
        script.append(f'      tl.fromTo("#{sid}-ins", {{ x: -500, rotate: -18, opacity: 0 }}, {{ x: 0, rotate: -6, opacity: 1, duration: 0.8, ease: "power3.out" }}, {t + 2.2});')
        sfx.append(("swish", t + 2.2, 0.3))
    for k, _ in enumerate(s.get("tags", [])):
        at = t + 1.3 + 0.55 * k
        script.append(f'      tl.fromTo("#{sid}-k{k}", {{ scale: 0, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)" }}, {at:.2f});')
        sfx.append(("tick", at, 0.35))
    sfx.append(("swish", t - 0.1, 0.35))

audio = [f'      <audio id="music" src="assets/audio/music-huerto.mp3" data-start="0" data-duration="{TOTAL}" data-track-index="20" data-volume="0.75"></audio>']
sfx += [("ding", 1.6, 0.3), ("swish", 29.9, 0.35), ("ding", 30.6, 0.35)]
for j, (n, t, v) in enumerate(sfx):
    audio.append(f'      <audio id="fx{j:02d}" src="assets/audio/{n}.mp3" data-start="{t:.2f}" data-duration="{min(dur(n) - 0.03, TOTAL - t):.2f}" data-track-index="{21 + j}" data-volume="{v}"></audio>')

W = lambda txt, cls="": " ".join(f'<span class="m"><span class="w {cls}">{w}</span></span>' for w in txt.split())

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
      #root {{ position: relative; width: 100%; height: 100%; overflow: hidden; font-family: "Geist", sans-serif; color: var(--ink); background: radial-gradient(110% 70% at 50% 40%, #fbf8f0 0%, var(--paper) 60%, #ebe3d0 100%); }}
      .bot {{ position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; fill: none; stroke-linecap: round; stroke-linejoin: round; opacity: .55; }}
      .bot .d {{ stroke-dasharray: 1; stroke-dashoffset: 1; }}

      .head {{ position: absolute; left: 80px; right: 80px; top: 96px; display: flex; align-items: baseline; justify-content: space-between; }}
      .head b {{ font: 500 26px/1 "Geist Mono", monospace; letter-spacing: .12em; text-transform: uppercase; color: var(--blue); }}
      .head span {{ font: 700 58px/1 "Caveat", cursive; color: var(--green-ink); }}
      .stem {{ position: absolute; left: 80px; right: 80px; top: 162px; height: 3px; border-radius: 3px; background: var(--green); transform-origin: 0 50%; }}

      .intro {{ position: absolute; inset: 0; }}
      .kick {{ position: absolute; left: 0; right: 0; top: 600px; text-align: center; font: 500 28px/1 "Geist Mono", monospace; letter-spacing: .16em; text-transform: uppercase; color: var(--blue); }}
      .title {{ position: absolute; left: 60px; right: 60px; top: 670px; text-align: center; font: 700 120px/1.02 "Cormorant", serif; letter-spacing: -.01em; color: var(--ink); }}
      .title .ln {{ display: block; }}
      .m {{ display: inline-block; overflow: hidden; vertical-align: top; padding-bottom: 10px; }}
      .w {{ display: inline-block; }}
      .w.g {{ color: var(--green-ink); }}
      .hand {{ position: absolute; left: 0; right: 0; top: 1130px; text-align: center; font: 700 68px/1 "Caveat", cursive; color: var(--green-ink); }}
      .uline {{ position: absolute; left: 330px; top: 1200px; width: 420px; height: 40px; fill: none; stroke: var(--gold); stroke-width: 6px; stroke-linecap: round; }}
      .uline path {{ stroke-dasharray: 1; stroke-dashoffset: 1; }}

      .scene {{ position: absolute; inset: 0; }}
      .card {{ position: absolute; background: #fffdf8; padding: 22px; box-shadow: 0 2px 0 rgba(23,61,97,.06), 0 40px 70px -40px rgba(23,61,97,.55); }}
      .card.main {{ left: 120px; top: 230px; width: 840px; height: 1200px; transform: rotate(var(--r)); }}
      .card.insert {{ left: 50px; top: 250px; width: 420px; height: 560px; padding: 16px; }}
      .win {{ position: relative; width: 100%; height: 100%; overflow: hidden; background: #e9e2d1; }}
      .media {{ position: absolute; left: 0; top: 0; width: 100%; height: 100%; object-fit: cover; }}
      .tape {{ position: absolute; width: 190px; height: 54px; }}
      .tape.t1 {{ left: -40px; top: 26px; transform: rotate(-38deg); background: rgba(242,201,76,.78); }}
      .tape.t2 {{ right: -40px; top: 26px; transform: rotate(38deg); background: rgba(39,174,96,.55); }}
      .tape.t3 {{ left: 120px; top: -22px; width: 170px; transform: rotate(-4deg); background: rgba(242,201,76,.78); }}
      .tag {{ position: absolute; left: 150px; width: 780px; top: 1370px; padding: 28px 40px 34px; background: #fffdf8; border: 2px solid rgba(39,96,146,.28); border-radius: 10px; box-shadow: 0 30px 50px -36px rgba(23,61,97,.6); text-align: left; }}
      .tag .no {{ display: block; font: 500 24px/1 "Geist Mono", monospace; letter-spacing: .12em; text-transform: uppercase; color: var(--green-ink); }}
      .tag .tx {{ display: block; margin-top: 14px; font: 700 62px/1.04 "Cormorant", serif; color: var(--ink); }}
      .tag .note {{ display: block; margin-top: 10px; font: 700 46px/1 "Caveat", cursive; color: var(--blue); }}
      .skill {{ position: absolute; display: flex; align-items: center; gap: 16px; padding: 14px 30px 18px 22px; border-radius: 16px; background: #fffdf8; box-shadow: 0 18px 30px -18px rgba(23,61,97,.7); font: 700 54px/1 "Caveat", cursive; color: var(--green-ink); rotate: var(--r); }}
      .skill i {{ width: 18px; height: 18px; border-radius: 50%; border: 3px solid var(--gold); }}

      .end {{ position: absolute; inset: 0; }}
      .end-logo {{ position: absolute; left: 230px; top: 620px; width: 620px; }}
      .end-logo img {{ display: block; width: 100%; }}
      .end-div {{ position: absolute; left: 390px; top: 920px; width: 300px; height: 60px; fill: none; stroke: var(--green); stroke-width: 3px; stroke-linecap: round; }}
      .end-div path {{ stroke-dasharray: 1; stroke-dashoffset: 1; }}
      .end-t {{ position: absolute; left: 60px; right: 60px; top: 1010px; text-align: center; font: 700 76px/1.05 "Cormorant", serif; color: var(--ink); }}
      .end-h {{ position: absolute; left: 0; right: 0; top: 1200px; text-align: center; font: 700 60px/1 "Caveat", cursive; color: var(--green-ink); }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
      <div id="botanica" data-layout-allow-overflow>
        {chr(10).join("        " + b for b in BOT).strip()}
      </div>

      <div class="intro clip" id="intro" data-start="0" data-duration="{SCENE}" data-track-index="1">
        <p class="kick" id="kick">Inclusión y Diversidad Educativa</p>
        <h1 class="title" id="title"><span class="ln">{W("Naturaleza")}</span><span class="ln">{W("que se transforma")}</span><span class="ln">{W("en")} {W("aprendizaje", "g")}</span></h1>
        <p class="hand" id="hand">materia de Huerto</p>
        <svg class="uline" viewBox="0 0 420 40"><path id="uline" d="M6 26 C 110 8, 220 34, 414 14" pathLength="1" /></svg>
      </div>

      <div class="head clip" id="head" data-start="{SCENE}" data-duration="{TOTAL - 2 * SCENE}" data-track-index="4"><b>Inclusión y Diversidad Educativa</b><span>Huerto</span></div>
      <div class="stem clip" id="stem" data-start="{SCENE}" data-duration="{TOTAL - 2 * SCENE}" data-track-index="5"></div>

{chr(10).join(html_scenes)}

      <div class="end clip" id="end" data-start="{TOTAL - SCENE}" data-duration="{SCENE}" data-track-index="12">
        <div class="end-logo" id="end-logo"><img src="assets/img/logo-westhill-transp.png" alt="Universidad Westhill" /></div>
        <svg class="end-div" viewBox="0 0 300 60"><path class="ed" d="M10 30 L290 30" pathLength="1" /><path class="ed" d="{leaflet(150, 30, -2.2, 46, 12)}" pathLength="1" /><path class="ed" d="{leaflet(150, 30, -0.94, 46, 12)}" pathLength="1" /></svg>
        <h2 class="end-t" id="end-t">Inclusión y Diversidad Educativa</h2>
        <p class="end-h" id="end-h">aprender desde lo concreto</p>
      </div>

{chr(10).join(audio)}
    </div>

    <script>
      const tl = gsap.timeline({{ paused: true }});
      const ease = "power3.out";

      function enter(id, at, r) {{
        tl.set(id, {{ opacity: 1, y: 0 }}, at);
        tl.set(id, {{ opacity: 0 }}, at + {SCENE});
        tl.fromTo(id + "-card", {{ y: 260, rotate: r + 6, opacity: 0 }}, {{ y: 0, rotate: r, opacity: 1, duration: 0.9, ease }}, at);
        tl.fromTo(id + " .win .media", {{ scale: 1.12 }}, {{ scale: 1.0, duration: {SCENE}, ease: "none" }}, at);
        tl.fromTo(id + "-tag", {{ y: 80, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.7, ease }}, at + 0.4);
        tl.fromTo(id + "-tag .tx", {{ y: 24, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.6, ease }}, at + 0.6);
        tl.fromTo(id + "-tag .note", {{ opacity: 0, x: -20 }}, {{ opacity: 1, x: 0, duration: 0.5, ease }}, at + 1.0);
      }}
      function leave(id, at) {{
        tl.fromTo(id, {{ y: 0, opacity: 1 }}, {{ y: -160, opacity: 0, duration: 0.55, ease: "power2.in", immediateRender: false }}, at - 0.55);
      }}

      // Botánica: se dibuja al inicio y se mece suave durante todo el video
      tl.fromTo("#b1 .d", {{ strokeDashoffset: 1 }}, {{ strokeDashoffset: 0, duration: 1.4, ease: "power2.out", stagger: 0.03 }}, 0.1);
      tl.fromTo("#b2 .d", {{ strokeDashoffset: 1 }}, {{ strokeDashoffset: 0, duration: 1.4, ease: "power2.out", stagger: 0.03 }}, 0.5);
      tl.fromTo("#b3 .d", {{ strokeDashoffset: 1 }}, {{ strokeDashoffset: 0, duration: 1.2, ease: "power2.out", stagger: 0.04 }}, 0.9);
      tl.fromTo("#b1", {{ rotate: 0 }}, {{ rotate: 3, duration: {TOTAL}, ease: "sine.inOut", transformOrigin: "0% 30%" }}, 0);
      tl.fromTo("#b2", {{ rotate: 0 }}, {{ rotate: -3, duration: {TOTAL}, ease: "sine.inOut", transformOrigin: "100% 78%" }}, 0);

      // Intro
      tl.fromTo("#kick", {{ y: 20, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.8, ease }}, 0.3);
      tl.fromTo("#title .w", {{ yPercent: 105 }}, {{ yPercent: 0, duration: 0.9, ease, stagger: 0.12 }}, 0.55);
      tl.fromTo("#hand", {{ y: 20, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.7, ease }}, 1.6);
      tl.fromTo("#uline", {{ strokeDashoffset: 1 }}, {{ strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut" }}, 1.9);
      tl.fromTo("#intro", {{ y: 0, opacity: 1 }}, {{ y: -160, opacity: 0, duration: 0.55, ease: "power2.in", immediateRender: false }}, {SCENE - 0.55});
      tl.fromTo("#head", {{ y: -30, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.7, ease }}, {SCENE});
      tl.fromTo("#stem", {{ scaleX: 0 }}, {{ scaleX: 1, duration: {TOTAL - 2 * SCENE}, ease: "none" }}, {SCENE});
      tl.fromTo(["#head", "#stem"], {{ opacity: 1 }}, {{ opacity: 0, duration: 0.4, ease: "none", immediateRender: false }}, {TOTAL - SCENE - 0.45});

{chr(10).join(script)}

      // Cierre
      const E = {TOTAL - SCENE};
      tl.fromTo("#end-logo", {{ y: 40, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 1.0, ease }}, E + 0.2);
      tl.fromTo("#end .ed", {{ strokeDashoffset: 1 }}, {{ strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut", stagger: 0.15 }}, E + 0.8);
      tl.fromTo("#end-t", {{ y: 30, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.8, ease }}, E + 1.1);
      tl.fromTo("#end-h", {{ y: 20, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.8, ease }}, E + 1.5);

      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
'''
open("index.html", "w").write(html)
print("ok", TOTAL)
