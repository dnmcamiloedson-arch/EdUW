"""Genera index.html del video de agradecimiento a empresas (HyperFrames)."""
import subprocess

# Orden del video. Cambia "name" cuando tengas los nombres oficiales.
BLOCKS = [
    {"clip": "e1", "photo": "foto-1", "name": "Brigada Rotaria"},
    {"clip": "e2", "photo": "foto-5", "name": "Probecarios"},
    {"clip": "e3", "photo": "foto-4", "name": "INPI"},
    {"clip": "e4", "photo": "foto-6", "name": "CONFE"},
    {"clip": "e5", "photo": "foto-3", "name": "Integrando a Pato A.C."},
    {"clip": "e6", "photo": "foto-2", "name": "Seguros Monterrey"},
    {"clip": "e7", "photo": "foto-7", "name": "Empresa 7"},
    {"clip": "e8", "photo": "foto-8", "name": "Empresa 8"},
]
INTRO = 2.0
CLIP = 2.0
PHOTO = 1.5
BLOCK = CLIP + PHOTO
END = INTRO + BLOCK * len(BLOCKS)
TOTAL = END + 5.0


def dur(n):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"assets/audio/{n}.mp3"]).decode())


def name_size(n):
    L = len(n)
    return 112 if L <= 10 else 96 if L <= 14 else 80 if L <= 19 else 68


shots, overlays, script, sfx = [], [], [], []
for i, b in enumerate(BLOCKS):
    k = i + 1
    t = INTRO + i * BLOCK
    tp = t + CLIP
    shots.append(f'        <div class="shot" id="v{k}"><video id="vid{k}" class="clip" src="assets/clips/{b["clip"]}.mp4" playsinline data-has-audio="true" data-volume="0.3" data-start="{t:.2f}" data-duration="{CLIP:.2f}" data-media-start="0" data-track-index="{1 + i % 2}"></video></div>')
    shots.append(f'        <div class="shot pshot" id="p{k}" style="opacity: 0"><img class="pbg" src="assets/img/{b["photo"]}.jpg" alt="" /><div class="pol"><img src="assets/img/{b["photo"]}.jpg" alt="Foto con {b["name"]}" /></div></div>')
    overlays.append(f'      <div class="thanks clip" id="t{k}" data-start="{t + 0.15:.2f}" data-duration="{BLOCK - 0.25:.2f}" data-track-index="13"><span class="small">Gracias</span><span class="name" style="font-size: {name_size(b["name"])}px">{b["name"]}</span><span class="sub">por venir a la Feria de Empleo</span></div>')
    overlays.append(f'      <div class="count clip" id="k{k}" data-start="{t:.2f}" data-duration="{BLOCK:.2f}" data-track-index="14">{k:02d}<i>/{len(BLOCKS):02d}</i></div>')
    # transición de entrada del bloque
    if i == 0:
        script.append(f'      flash({t}, 1); shake({t});')
    elif i % 2:
        script.append(f'      whip("#p{k-1}", "#v{k}", {t}, {-1 if i % 4 == 1 else 1});')
    else:
        script.append(f'      flash({t});')
    script.append(f'      tl.fromTo("#v{k}", {{ scale: 1.18 }}, {{ scale: 1.04, duration: {CLIP}, ease: "power2.out", immediateRender: false }}, {t});')
    script.append(f'      thanks("#t{k}", {t + 0.15:.2f});')
    script.append(f'      tl.fromTo("#k{k}", {{ x: 200, opacity: 0 }}, {{ x: 0, opacity: 1, duration: 0.4, ease }}, {t + 0.1:.2f});')
    # foto: flash de cámara y polaroid que cae
    script.append(f'      flash({tp}, 1);')
    script.append(f'      tl.set("#p{k}", {{ opacity: 1 }}, {tp});')
    script.append(f'      tl.set("#p{k}", {{ opacity: 0 }}, {tp + PHOTO + (0.25 if i % 2 == 0 and i < len(BLOCKS) - 1 else 0):.2f});')
    script.append(f'      tl.fromTo("#p{k} .pol", {{ y: -1400, rotate: {(-14 if i % 2 else 14)}, scale: 1.1 }}, {{ y: 0, rotate: {(-4 if i % 2 else 4)}, scale: 1, duration: 0.5, ease: "back.out(1.3)" }}, {tp});')
    script.append(f'      tl.fromTo("#p{k} .pbg", {{ scale: 1.25 }}, {{ scale: 1.1, duration: {PHOTO}, ease: "none" }}, {tp});')
    sfx += [("whoosh" if i % 2 else "boom", t - (0.25 if i % 2 else 0), 0.8 if i % 2 else (1 if i == 0 else 0.7)),
            ("pop", t + 0.4, 0.55), ("pop-hi", t + 0.75, 0.5), ("shutter", tp - 0.02, 0.85), ("swish", tp + 0.05, 0.5)]

# cierre
script.append(f'''      flash({END}, 0.8);
      tl.fromTo("#end-logo", {{ y: -60, opacity: 0, scale: 0.9 }}, {{ y: 0, opacity: 1, scale: 1, duration: 0.7, ease }}, {END + 0.1:.2f});
      tl.fromTo("#end-title .w", {{ yPercent: 110 }}, {{ yPercent: 0, duration: 0.6, ease: "back.out(1.6)", stagger: 0.08 }}, {END + 0.4:.2f});
      tl.fromTo("#end-pill", {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.6, ease }}, {END + 1.0:.2f});
      tl.fromTo("#end-grid .g", {{ scale: 0, rotate: -20 }}, {{ scale: 1, rotate: (i) => [-6, 4, -3, 7, -5, 3, -7, 5][i], duration: 0.45, ease: "back.out(1.8)", stagger: 0.09 }}, {END + 1.4:.2f});''')
sfx += [("whoosh-long", END - 0.4, 0.8), ("ding", END + 0.2, 0.6), ("pop-hi", END + 1.0, 0.5)]
sfx += [("tick", END + 1.4 + 0.09 * j, 0.6) for j in range(8)]

grid = "\n".join(f'          <div class="g"><img src="assets/img/{b["photo"]}.jpg" alt="" /></div>' for b in BLOCKS)
audio = [f'      <audio id="music" src="assets/audio/music.mp3" data-start="0" data-duration="{TOTAL:.2f}" data-track-index="20" data-volume="0.5"></audio>',
         '      <audio id="fxr" src="assets/audio/riser.mp3" data-start="0.1" data-duration="1.87" data-track-index="21" data-volume="0.7"></audio>']
for j, (n, t, v) in enumerate(sfx):
    audio.append(f'      <audio id="fx{j:02d}" src="assets/audio/{n}.mp3" data-start="{t:.2f}" data-duration="{min(dur(n) - 0.03, TOTAL - t):.2f}" data-track-index="{22 + j}" data-volume="{v}"></audio>')

strobe = "\n".join(f'        <div class="shot" id="h{j}"><video id="hv{j}" class="clip" src="assets/clips/{BLOCKS[j]["clip"]}.mp4" muted playsinline data-start="{j * 0.25:.2f}" data-duration="0.25" data-media-start="0.8" data-track-index="1"></video></div>' for j in range(8))

html = f'''<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>Gracias Empresas Feria de Empleo</title>
    <script src="assets/gsap.min.js"></script>
    <style>
      @font-face {{ font-family: "Bricolage Grotesque"; src: url("assets/fonts/bricolage-grotesque-latin-wght-normal.woff2") format("woff2"); font-weight: 200 800; font-display: block; }}
      @font-face {{ font-family: "Geist"; src: url("assets/fonts/geist-latin-wght-normal.woff2") format("woff2"); font-weight: 100 900; font-display: block; }}
      @font-face {{ font-family: "Geist Mono"; src: url("assets/fonts/geist-mono-latin-500-normal.woff2") format("woff2"); font-weight: 500; font-display: block; }}
      :root {{ --blue: #276092; --blue-deep: #173d61; --blue-ink: #0f2a45; --green: #27ae60; --gold: #f2c94c; --ink: #0d2238; }}
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: 1080px; height: 1920px; overflow: hidden; background: #0a1624; }}
      #root {{ position: relative; width: 100%; height: 100%; overflow: hidden; font-family: "Geist", system-ui, sans-serif; color: #fff; background: #0a1624; }}
      #stage {{ position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; }}
      .shot {{ position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; overflow: hidden; }}
      .shot video {{ position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; object-fit: cover; }}
      .pshot {{ background: var(--blue-deep); }}
      .pbg {{ position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; object-fit: cover; filter: blur(30px) brightness(.6); }}
      .pol {{ position: absolute; left: 150px; top: 250px; width: 780px; height: 1180px; padding: 26px 26px 100px; background: #fff; box-shadow: 0 50px 100px -30px rgba(0,0,0,.7); }}
      .pol img {{ display: block; width: 728px; height: 1054px; object-fit: cover; }}
      .vignette {{ position: absolute; inset: 0; pointer-events: none; background: radial-gradient(120% 80% at 50% 45%, transparent 55%, rgba(5,12,22,.55) 100%); }}
      .shade {{ position: absolute; left: 0; right: 0; top: 1150px; height: 770px; pointer-events: none; background: linear-gradient(180deg, transparent, rgba(5,12,22,.6) 55%, rgba(5,12,22,.8)); }}
      .topshade {{ position: absolute; left: 0; right: 0; top: 0; height: 380px; pointer-events: none; background: linear-gradient(180deg, rgba(5,12,22,.55), transparent); }}

      .hook-dim {{ position: absolute; inset: 0; background: rgba(10,22,36,.5); }}
      .echo {{ position: absolute; left: 0; right: 0; top: 500px; text-align: center; }}
      .echo span {{ display: block; font: 800 170px/0.86 "Bricolage Grotesque", sans-serif; letter-spacing: -0.06em; color: rgba(255,255,255,.06); -webkit-text-stroke: 3px rgba(255,255,255,.75); }}
      .echo span.solid {{ color: #fff; -webkit-text-stroke: 0; }}
      .hook-pill {{ position: absolute; left: 90px; top: 1320px; width: 900px; height: 120px; border-radius: 999px; display: flex; align-items: center; justify-content: center; background: var(--gold); color: var(--blue-ink); font: 800 54px/1 "Bricolage Grotesque", sans-serif; letter-spacing: -.03em; }}

      .thanks {{ position: absolute; left: 60px; right: 60px; top: 1450px; text-align: center; }}
      .thanks span {{ display: block; }}
      .thanks .small {{ display: inline-block; padding: 8px 26px 12px; border-radius: 999px; background: var(--gold); color: var(--blue-ink); font: 800 50px/1 "Bricolage Grotesque", sans-serif; letter-spacing: -.03em; }}
      .thanks .name {{ margin-top: 14px; font-weight: 800; font-family: "Bricolage Grotesque", sans-serif; line-height: .98; letter-spacing: -.045em; color: #fff; text-shadow: 0 0 3px rgba(5,12,22,.9), 0 6px 24px rgba(5,12,22,.85); }}
      .thanks .sub {{ margin-top: 16px; font: 600 36px/1.2 "Geist", sans-serif; color: rgba(255,255,255,.95); text-shadow: 0 2px 12px rgba(5,12,22,.9); }}
      .count {{ position: absolute; right: 60px; top: 130px; padding: 14px 24px; border-radius: 22px; background: rgba(15,42,69,.9); border-right: 8px solid var(--gold); font: 800 52px/1 "Bricolage Grotesque", sans-serif; letter-spacing: -.03em; }}
      .count i {{ font-style: normal; font-size: 30px; color: var(--gold); }}

      .endfield {{ position: absolute; inset: 0; background: radial-gradient(120% 70% at 80% 0%, #3577b0 0%, var(--blue) 45%, var(--blue-deep) 100%); }}
      .end-logo {{ position: absolute; left: 240px; top: 230px; width: 600px; }}
      .end-logo img {{ width: 100%; display: block; }}
      .end-title {{ position: absolute; left: 40px; right: 40px; top: 600px; text-align: center; font: 800 112px/0.98 "Bricolage Grotesque", sans-serif; letter-spacing: -.05em; }}
      .end-title .ln {{ display: block; overflow: hidden; padding-bottom: 8px; }}
      .end-title .w {{ display: inline-block; }}
      .end-title .gold {{ color: var(--gold); }}
      .end-pill {{ position: absolute; left: 90px; top: 960px; width: 900px; padding: 26px 30px; border-radius: 40px; background: #fff; color: var(--blue-ink); text-align: center; font: 700 40px/1.25 "Geist", sans-serif; }}
      #end-grid {{ position: absolute; left: 60px; top: 1210px; width: 960px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px; }}
      .g {{ padding: 10px 10px 30px; background: #fff; box-shadow: 0 20px 40px -18px rgba(0,0,0,.6); }}
      .g img {{ display: block; width: 100%; height: 270px; object-fit: cover; }}

      .flash {{ position: absolute; inset: 0; background: #fff; opacity: 0; pointer-events: none; }}
      .progress {{ position: absolute; left: 60px; right: 60px; top: 70px; height: 8px; border-radius: 999px; background: rgba(255,255,255,.25); overflow: hidden; }}
      .progress span {{ position: absolute; left: 0; top: 0; bottom: 0; width: 100%; display: block; background: linear-gradient(90deg, var(--gold), var(--green)); transform-origin: 0 50%; }}
      svg.defs {{ position: absolute; width: 0; height: 0; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL:.2f}" data-width="1080" data-height="1920">
      <svg class="defs" aria-hidden="true"><filter id="hblur" x="-20%" y="0" width="140%" height="100%"><feGaussianBlur id="hblur-g" stdDeviation="0 0" /></filter></svg>
      <div id="stage" data-layout-allow-overflow>
{strobe}
{chr(10).join(shots)}
      </div>
      <div class="vignette"></div>
      <div class="topshade"></div>
      <div class="shade"></div>

      <div class="hook-dim clip" id="hook-dim" data-start="0" data-duration="{INTRO}" data-track-index="10"></div>
      <div class="echo clip" id="echo" data-start="0" data-duration="{INTRO}" data-track-index="11"><span>GRACIAS</span><span>GRACIAS</span><span class="solid">GRACIAS</span><span>GRACIAS</span><span>GRACIAS</span></div>
      <div class="hook-pill clip" id="hook-pill" data-start="0" data-duration="{INTRO}" data-track-index="12">a las empresas que nos visitaron</div>

{chr(10).join(overlays)}

      <div class="clip" id="end" data-start="{END:.2f}" data-duration="{TOTAL - END:.2f}" data-track-index="15" style="position: absolute; inset: 0">
        <div class="endfield"></div>
        <div class="end-logo" id="end-logo"><img src="assets/img/logo-westhill-blanco.png" alt="Universidad Westhill" /></div>
        <h2 class="end-title" id="end-title"><span class="ln"><span class="w">Gracias</span> <span class="w">por</span> <span class="w">abrir</span></span><span class="ln"><span class="w gold">oportunidades</span></span></h2>
        <p class="end-pill" id="end-pill">a nuestros alumnos en la Feria de Empleo Westhill</p>
        <div id="end-grid">
{grid}
        </div>
      </div>

      <div class="flash" id="flash"></div>
      <div class="progress"><span id="bar"></span></div>

{chr(10).join(audio)}
    </div>

    <script>
      const tl = gsap.timeline({{ paused: true }});
      const ease = "expo.out";
      tl.fromTo("#bar", {{ scaleX: 0 }}, {{ scaleX: 1, duration: {TOTAL:.2f}, ease: "none" }}, 0);

      function flash(at, peak = 0.9) {{
        tl.fromTo("#flash", {{ opacity: 0 }}, {{ opacity: peak, duration: 0.06, ease: "none", immediateRender: false }}, at - 0.06);
        tl.fromTo("#flash", {{ opacity: peak }}, {{ opacity: 0, duration: 0.3, ease: "power2.out", immediateRender: false }}, at);
      }}
      tl.set("#hblur-g", {{ attr: {{ stdDeviation: "0 0" }} }}, 0);
      function whip(a, b, at, dir = -1) {{
        const d = 0.4;
        tl.set([a, b], {{ filter: "url(#hblur)" }}, at - d / 2);
        tl.fromTo(a, {{ x: 0 }}, {{ x: dir * 1080, duration: d, ease: "power3.inOut", immediateRender: false }}, at - d / 2);
        tl.fromTo(b, {{ x: -dir * 1080 }}, {{ x: 0, duration: d, ease: "power3.inOut", immediateRender: false }}, at - d / 2);
        tl.fromTo("#hblur-g", {{ attr: {{ stdDeviation: "0 0" }} }}, {{ attr: {{ stdDeviation: "40 0" }}, duration: d / 2, ease: "power3.in", immediateRender: false }}, at - d / 2);
        tl.fromTo("#hblur-g", {{ attr: {{ stdDeviation: "40 0" }} }}, {{ attr: {{ stdDeviation: "0 0" }}, duration: d / 2, ease: "power3.out", immediateRender: false }}, at);
        tl.set([a, b], {{ filter: "none" }}, at + d / 2);
      }}
      function shake(at) {{
        [18, -14, 10, -6, 3, 0].forEach((x, i) => tl.to("#stage", {{ x, y: -x * 0.6, duration: 0.04, ease: "none" }}, at + i * 0.04));
      }}
      function thanks(id, at) {{
        tl.fromTo(id + " .small", {{ scale: 0, rotate: -8 }}, {{ scale: 1, rotate: -3, duration: 0.45, ease: "back.out(2.4)" }}, at);
        tl.fromTo(id + " .name", {{ y: 60, opacity: 0, scale: 0.85 }}, {{ y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.8)" }}, at + 0.2);
        tl.fromTo(id + " .sub", {{ y: 20, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.4, ease }}, at + 0.5);
      }}

      // Gancho
      tl.fromTo("#echo span", {{ yPercent: 60, opacity: 0, scale: 1.4 }}, {{ yPercent: 0, opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.8)", stagger: {{ each: 0.08, from: "center" }} }}, 0.1);
      tl.fromTo("#echo", {{ scale: 1 }}, {{ scale: 1.1, duration: 1.9, ease: "power1.in" }}, 0.1);
      tl.fromTo("#hook-pill", {{ scale: 0, rotate: -8 }}, {{ scale: 1, rotate: -3, duration: 0.5, ease: "back.out(2.4)" }}, 0.9);
      for (let j = 0; j < 8; j++) tl.fromTo("#h" + j, {{ scale: 1.18 }}, {{ scale: 1.02, duration: 0.25, ease: "power2.out" }}, j * 0.25);

{chr(10).join(script)}

      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
'''
open("index.html", "w").write(html)
print("ok", TOTAL)
