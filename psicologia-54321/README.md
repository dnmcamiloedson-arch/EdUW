# Grounding 5-4-3-2-1 · Psicología, Universidad Westhill

Video vertical de 28 s (Reels/TikTok) que guía la técnica de grounding 5-4-3-2-1 con voz en off y motion graphics. No aparecen personas, rostros, siluetas ni manos. Todo el contenido (guion, tiempos, colores, voz, textos, layouts y variantes) vive en **`config.json`**.

## Entregables (`out/`)

| Archivo | Qué es |
|---|---|
| `psicologia_54321_9x16.mp4` | **Final** 1080×1920, 30 fps, H.264 + AAC, 28.00 s, subtítulos quemados |
| `psicologia_54321_9x16_sin_subtitulos.mp4` | Igual, sin subtítulos (para reeditar) |
| `psicologia_54321_1x1.mp4` | 1080×1080 para feed |
| `psicologia_54321_40s_9x16.mp4` | Variante "hazlo conmigo" de 40 s con pausas largas |
| `psicologia_54321.srt` / `_palabras.srt` | Subtítulos por frase / palabra por palabra (mismos tiempos que los quemados) |
| `psicologia_54321_40s.srt` / `_40s_palabras.srt` | Ídem, variante 40 s |
| `preview.mp4` + `preview_contact_sheet.png` | Preview rápido 540×960 |
| `contact_sheet*.png` | Frames 0, 2, 5, 9, 13, 17, 21, 25, 27.9 s con líneas de zona segura |
| `stems/<variante>/*.flac` | Voz, música y chimes por separado (FLAC 24-bit, misma ganancia que el master) |
| `qa/*.json` | Reporte de QA medido sobre cada MP4 |

## Cómo se construye

```bash
npm install                      # Remotion + Nunito (fuentes locales en assets/fonts)
pip install piper-tts onnx numpy scipy pyloudnorm pillow

python3 scripts/voice.py         # voz TTS es-MX + tiempos por palabra  → assets/audio/voice/
python3 scripts/timeline.py      # línea de tiempo de cada variante    → assets/timeline/<v>.json
python3 scripts/audio.py         # música, chimes, ducking, master     → assets/audio/mix_<v>.wav (no versionado: se regenera idéntico)
python3 scripts/subtitles.py     # SRT                                  → out/*.srt
node scripts/render.mjs preview  # out/preview.mp4 (540×960)
node scripts/render.mjs final    # las 4 versiones finales
python3 scripts/qa.py out/psicologia_54321_9x16.mp4 --variant 28 --layout 9x16 --captions --sheet out/contact_sheet.png
npm run studio                   # editor visual de Remotion
```

`scripts/timeline.py` es la única fuente de verdad de tiempos: la leen el video, la mezcla, los SRT y el QA. Además valida que haya al menos 0.25 s de respiro entre frases e imprime cuánto silencio le queda a la persona para hacer cada paso.

## Decisiones

- **Remotion**: cada frame es una función pura del tiempo (`spring`/`interpolate` analíticos, sin `Math.random`), y `config.json` entra como props, así que las 4 versiones salen del mismo código. Remotion pide [licencia de empresa](https://www.remotion.dev/license) a organizaciones de más de 3 personas; si eso pesa, el mismo diseño se puede portar a Hyperframes (Apache 2.0).
- **Voz**: edge-tts y HuggingFace están bloqueados por la red de este entorno y no hay API key de ElevenLabs. Se usa **Piper** (TTS neuronal local, voz `es_MX-claude-high`, licencia Apache-2.0) descargado desde los releases de sherpa-onnx en GitHub. Los tiempos por palabra salen del propio modelo: se expone su tensor de duraciones por fonema (`w_ceil`) como salida del ONNX, así que quedan alineados a la muestra, sin whisper.
- **Movimiento**: el círculo respira en un ciclo de 4 s (0.92↔1.0, coseno). Los springs son críticamente amortiguados, salvo el "pop" de los puntos de luz (ζ = 0.75, ~3 % de rebase). El morph entre secciones dura 15 frames. En "saborear" la luz cítrica se abre desde el centro y se cierra por el mismo camino, para evitar el gris turbio de un cruce azul→amarillo.
- **Determinismo**: cada mundo se funde con opacidad CSS en su propia capa (la opacidad de grupo SVG con clipPaths anidados no rasteriza igual entre renders en Chromium) y el grano es un `<Img>`, que Remotion espera antes de capturar. Dos renders dan el mismo MP4 byte a byte.

## Reemplazar la voz por una grabación humana (sin tocar código)

1. Graba cada frase y guárdala con el mismo nombre en `assets/audio/voice/`: `intro.wav`, `ver.wav`, `tocar.wav`, `oir.wav`, `oler.wav`, `saborear.wav`, `outro_1.wav`, `outro_2.wav`.
2. Pon `"voice": { "source": "file" }` en `config.json` y actualiza en `assets/audio/voice/timings.json` el `duration` de cada toma y el `start`/`end` de cada palabra (relativos al inicio del archivo; los puede marcar cualquier editor de audio o una alineación forzada).
3. Corre `timeline.py → audio.py → subtitles.py → render.mjs final`.

## Variante de 40 s

En `config.json → variants["40"]` se definen la duración de cada paso (`steps: [7, 6.5, 6, 5.5, 5]`), el retraso de la voz y la pausa entre las dos frases del cierre. Para renderizarla como versión principal, cambia `activeVariant` a `"40"`. También se puede crear `"60"` o cualquier otra con solo añadir una entrada.

## Reutilizar la plantilla (respiración 4-7-8, relajación muscular…)

Copia la carpeta y edita `config.json`: `steps` (texto de voz, número, etiqueta, acento de color), `variants` (duraciones) y `disclaimer`. La voz, la línea de tiempo, la mezcla, los SRT y el QA se regeneran solos. Lo único que es código es el "mundo" visual de cada paso (`src/worlds/*.tsx`, ~80 líneas cada uno): para 4-7-8 bastaría un mundo que reutilice la respiración del círculo con `breathPeriod` y fases propias.

## Licencias de assets

Nunito (SIL OFL, `assets/fonts/OFL-Nunito.txt`) · voz Piper `es_MX-claude-high` (Apache-2.0) · música, chimes, iconos, texturas y corazón: originales, generados en este proyecto.
