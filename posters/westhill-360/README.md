# Póster — Proyecto "WESTHILL 360"

Visitas de IPEFH (Planteles Toluca, Metepec y Calimaya) · 14 y 16 de octubre.

| Archivo | Uso |
|---|---|
| `Westhill360_poster.pdf` | Impresión (vectorial, proporción 2:3 → 60 × 90 cm o 24 × 36 in) |
| `Westhill360_poster.png` / `.jpg` | Pantallas, redes y envío digital (3600 × 5400 px) |
| `poster.src.html` | Fuente editable del diseño |
| `poster.html` | Versión generada con los íconos incrustados |

Concepto: el "0" de 360° es un lente con la foto del campus, rodeado de un dial y un anillo de texto
("Vívela · Explórala · Enamórate"); los datos de la visita van en un pase de acceso tipo boleto y el
programa se muestra como un reloj de 360° (9:00 a 12:00 p.m., cada actividad proporcional a su duración).

Paleta institucional: azul `#266294`, marino `#0E2A47`, dorado `#F2C94C`, hielo `#EDF3FA`. Tipografía Raleway.

## Editar y volver a exportar

```bash
# 1. Íconos (Font Awesome Free, solo una vez)
npm i @fortawesome/fontawesome-free@6.5.2
# 2. Incrustar íconos
python3 tools/build.py poster.src.html poster.html node_modules/@fortawesome/fontawesome-free/svgs/solid
# 3. Exportar PNG (escala 2) y PDF (requiere Playwright)
node tools/render.js "$PWD/poster.html" "$PWD/Westhill360_poster.png" "$PWD/Westhill360_poster.pdf" 2
```
