# Teaser "Faltan 20 días" · Universidad Westhill

Video vertical de 20 s (1080×1920, 30 fps, H.264 + AAC) para Reels, TikTok y Stories.
Cuenta regresiva al 28 de octubre. Nunca dice "ofrenda", "evento" ni "concurso": es un guiño.

**Entregable:** `out/westhill-faltan-20-dias.mp4`

## Por qué Remotion

El movimiento depende de springs, `interpolate` con curvas bezier, ruido orgánico (`@remotion/noise`) y desenfoque de movimiento por submuestreo (`@remotion/motion-blur`).
Las partículas (pétalos, chispas, humo de copal y brasas) se dibujan en canvas sin guardar estado: cada frame se recalcula a partir de `t`. Así el render es determinista aunque Chromium lo haga en paralelo.

## Storyboard

| Frames | Tiempo | Plano | Técnica |
|---|---|---|---|
| 0–60 | 0.0–2.0 s | Negro con grano → veladora se enciende | Chispas balísticas con arrastre, destello, llama con fBm (sin senos), dolly-in bezier |
| 60–135 | 2.0–4.5 s | La luz alcanza pétalos de cempasúchil | 3 capas de parallax/profundidad de campo, giro 3D simulado, desenfoque por acumulación de sub-frames, bokeh |
| 135–225 | 4.5–7.5 s | Baja papel picado (corazón, flor, calavera, rombos) | Spring críticamente amortiguado, ondulación por frente de viento, sombra proyectada en la pared con los calados |
| 225–300 | 7.5–10 s | Calavera de azúcar de perfil | Luz de borde desde la llama, flama desenfocada en primer plano, ojos se encienden en f285 |
| 300–375 | 10–12.5 s | Camino de pétalos: cenital → cámara baja | Plano 3D (rotateX 0→62°), pétalos que se alinean en ola hacia la luz, humo de copal con curl noise, tilt-shift |
| 375–450 | 12.5–15 s | Montaje: pan de muerto · vaso de agua · marco vacío · cruz de pétalos | Cortes al beat, la llama siempre en el mismo punto (match-cut de luz), micro-zoom, sacudida amortiguada, motion blur |
| 450–520 | 15–17.3 s | Pull-back: altar de tres niveles | Silueta a contraluz; 11 velas se encienden de abajo arriba (una por nota de marimba); los elementos se acomodan con springs |
| 520–525 | 17.3–17.5 s | Respiro | Silencio antes de revelar |
| 525–600 | 17.5–20 s | FALTAN · **20** · DÍAS · 28 · 10 | "20" con spring suave (ζ≈0.88) y brillo de brasa que pulsa con la llama; fundido a negro en f594 |

Todo el texto queda entre y=372 y y=1000, dentro de la zona segura (fuera de los 250 px superiores y los 340 px inferiores).

## Diseño sonoro (`scripts/make_audio.py`)

Todo el audio es sintético: drone en Re, viento y latido que pasa de 60 a ~72 bpm. Lleva cerillo e ignición en f6–f8, roce de papel, una campanita cuando se encienden los ojos y un soplo de copal.
En el montaje suenan tambor y madera en cada corte. En el altar, una marimba pentatónica en Re mayor da una nota por vela, con un swell de cuerdas. Luego vienen 0.17 s de silencio y un golpe grave con cola de reverb al aparecer el "20".
Master: **-14 LUFS integrado, true peak ≤ -1 dBTP** (limitador con sobremuestreo 4×).

Para usar audio propio, reemplaza `public/audio/teaser.wav` (20 s, 48 kHz) y omite el paso de `make_audio.py` en `scripts/render.sh`.

## Render

```bash
npm install
./scripts/render.sh                 # → out/westhill-faltan-20-dias.mp4
DIAS=19 ./scripts/render.sh         # otro día de la cuenta regresiva ("FALTA 1 DÍA" en singular)
npx remotion studio                 # previsualizar y ajustar
```

Props de la composición `FaltanDias`: `dias` (número), `fecha` (texto, por defecto `28 · 10`) y `mostrarFecha` (oculta la línea de fecha si es `false`).

## Renderizar en tu computadora

Requisitos: [Node.js 18+](https://nodejs.org), Python 3 y [ffmpeg](https://ffmpeg.org/download.html).
En Windows, ejecuta los comandos en **WSL** o **Git Bash**, porque `render.sh` es un script de bash.

```bash
git clone https://github.com/dnmcamiloedson-arch/EdUW.git
cd EdUW && git checkout claude/intelligent-euler-vrltaa
cd video/faltan-20-dias
npm install
pip install numpy scipy pyloudnorm
./scripts/render.sh
```

- La primera vez, Remotion descarga su propio Chromium (~100 MB). Después todo funciona sin internet.
- **Núcleos:** usa todos los de la CPU por defecto; con `CONCURRENCY=6` fijas otro número.
- **Motor gráfico:** por defecto usa la GPU (`angle`). Si ves fallas gráficas o va lento, prueba `REMOTION_GL=swiftshader ./scripts/render.sh`.
- **Referencia de velocidad:** en el contenedor de 4 núcleos sin GPU el render completo tarda unos 10–15 min. Con 8–16 núcleos debería bajar en proporción.

Las fuentes (Rye, Alike y Domine, de Google Fonts y con licencia OFL) se sirven desde `public/fonts` y no se cargan de ningún CDN durante el render.
Todas las ilustraciones son originales y están hechas con código (SVG y canvas).
