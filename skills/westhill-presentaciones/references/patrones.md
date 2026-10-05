# Catálogo de patrones de diapositiva

Todos vienen de `ejemplo_embajadores.js` (presentación aprobada). Busca el marcador `// ===============` indicado, copia el bloque y cambia los textos. Las coordenadas Y de esos bloques usan la franja virtual 1.7"–6.65" salvo que la diapositiva diga `real: true`.

| Patrón | Cuándo usarlo | Bloque en el ejemplo |
|---|---|---|
| Texto + tarjeta destacada + lista con íconos | Introducir un programa: descripción, objetivo (tarjeta oscura con `watermark`) y beneficios en lista con `badge` | `2. PROGRAMA` |
| 3 tarjetas en columnas | Comparar perfiles, opciones o tipos; la última (o la más importante) en `dark` con píldora "DESTACADO" | `3. PERFILES` |
| Pasos numerados 01–04 con flechas | Mecánicas o "¿cómo funciona?" de 3–5 pasos; el paso clave en `dark` | `4. COMO FUNCIONA` |
| Tabla nativa + tarjeta de montos + nota | Tablas de puntos/precios con una fila resaltada en dorado, montos grandes al lado y condiciones en `note` | `5. PUNTOS + BONO` (`bottom: 6.93`) |
| Recorrido en zigzag | Flujos de 5–8 etapas con ícono por etapa, líneas punteadas doradas y número | `6. RECORRIDO` |
| Escalera de niveles | Niveles, membresías o fases que crecen (alturas 3.35 / 4.15 / 4.95) | `7. NIVELES` |
| Cuadrícula 4×2 | Kits, herramientas, beneficios cortos (8 elementos) | `8. KIT` (`bottom: 6.77`) |
| Dos tarjetas grandes con lista de íconos | Dos reconocimientos, dos modalidades, antes/después | `9. RECONOCIMIENTOS` |
| Filas tipo píldora + foto | Experiencias o actividades con una foto real a la derecha (`d.photo`) | `10. VIVE MI CARRERA` |
| Texto + tarjetas + imagen enmarcada | Propuestas con material existente (flyer "ACTUAL" con píldora) | `11. RECOMENDADOS` |
| Proceso con capturas de pantalla | Flujos digitales: tarjeta por paso con número, título, detalle y capturas ajustadas | `12. PROCESO DE INVITACIÓN` (`real: true`) |
| Tablero / captura grande + notas | Mostrar un dashboard o reporte con 3 notas explicativas | `13. TABLERO DE ADMISIONES` (`real: true`) |
| Hojas de cálculo + nota de datos de ejemplo | Mostrar bases de datos o formatos de control | `14. BASE DE DATOS` (`real: true`) |

## Medidas útiles

- Ancho útil: x 0.6"–12.73" (12.13"). Tres columnas: 3.84" con 0.33" de separación. Cuatro columnas: 2.75" con 0.35".
- Tamaños de texto: título 30 pt (lo pone la plantilla), subtítulo 16 pt, encabezado de tarjeta 19–28 pt, cuerpo 13.5–16 pt, notas 11–12 pt. No bajes de 11 pt.
- Separación entre tarjetas: 0.25"–0.35". Margen interno de tarjeta: 0.3"–0.45".
- `step(n)`: misma n = aparecen juntos. Patrón habitual: tarjeta y su contenido con un número; la flecha o conector siguiente con el número siguiente.
