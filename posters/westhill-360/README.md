# Póster — Proyecto "WESTHILL 360"

Visitas de IPEFH (Planteles Toluca, Metepec y Calimaya) · 14 y 16 de octubre.

| Archivo | Uso |
|---|---|
| `Westhill360_poster.pdf` | Impresión (vectorial, proporción 2:3 → 60 × 90 cm o 24 × 36 in) |
| `Westhill360_poster.png` / `.jpg` | Pantallas, redes y envío digital (3600 × 5400 px) |
| `Westhill360_animado.mp4` | Versión animada (6.5 s, 1080 × 1620) para pantallas y redes |
| `poster.src.html` | Fuente editable del diseño |
| `poster.html` | Versión generada con los íconos incrustados |

Concepto (v4 + mascota): encabezado con la fachada del campus fundida en azul marino; la mascota de Westhill
(caracal con chamarra varsity) celebra dentro de una órbita dorada de 360° y se para sobre la tarjeta de datos clave,
con el globo "¡Te esperamos!". Objetivo como cita; programa en línea de tiempo y tarjeta de licenciaturas.

Animación: entrada única (Ken Burns del fondo, texto escalonado, órbita que se dibuja, mascota con resorte y
balanceo suave). Solo corre con `prefers-reduced-motion: no-preference`; el PNG/PDF se exporta en modo reducido,
por lo que la versión impresa es estática.

Paleta institucional: azul `#266294`, marino `#0E2A47`, dorado `#F2C94C`, hielo `#EDF3FA`. Tipografía Raleway.

## Editar y volver a exportar

```bash
# 1. Íconos (Font Awesome Free, solo una vez)
npm i @fortawesome/fontawesome-free@6.5.2
# 2. Incrustar íconos
python3 tools/build.py poster.src.html poster.html node_modules/@fortawesome/fontawesome-free/svgs/solid
# 3. Exportar PNG (escala 2) y PDF (requiere Playwright)
node tools/render.js "$PWD/poster.html" "$PWD/Westhill360_poster.png" "$PWD/Westhill360_poster.pdf" 2
# 4. Video de la animación (webm) y conversión a mp4
node tools/record.js "$PWD/poster.html" /tmp/vid 7
ffmpeg -i /tmp/vid/*.webm -ss 0.25 -t 6.5 -c:v libx264 -pix_fmt yuv420p -crf 20 -movflags +faststart -an Westhill360_animado.mp4
```
