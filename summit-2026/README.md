# Westhill Medical Leadership Summit 2026: materiales gráficos

Materiales que pidió el Comité Organizador de la Facultad de Medicina para el Summit (21, 22 y 23 de octubre de 2026).
Todos siguen la identidad institucional: Raleway, azul `#266294`, marino `#0E2A47`, dorado `#F2C94C`, ola institucional y #SOMOSWESTHILL.

> ⚠️ **Antes de imprimir o publicar, revisa [`REVISAR.md`](REVISAR.md).** Los archivos de la Facultad no coinciden entre sí en algunos
> puntos (un horario duplicado, un ponente con dos nombres distintos). Ahí está lo que se aplicó y lo que falta confirmar.

## Entregables (`entregables/`)

| Carpeta | Contenido | Formato |
|---|---|---|
| `01_diapositivas/` | **Plantilla oficial para ponencias**: 13 diapositivas (portada del Summit, portada de ponencia, presentación del ponente, sección, contenido, columnas, imagen, cifras, tabla, algoritmo, conclusiones, referencias, cierre), con animaciones. También **programa para pantallas**: una diapositiva por día para el auditorio | `.pptx` editable |
| `02_programa/` | **Tríptico del programa**: A4 horizontal a doble cara. Exterior: ponentes, contraportada y portada. Interior: los tres días | `.pdf` para imprenta |
| `03_constancias_participantes/` | Plantilla de constancia de asistencia. Si se llena `datos/participantes.csv`, se genera una por persona | `.pptx` editable + `.pdf` |
| `04_constancias_ponentes/` | **20 constancias ya llenas**, una por ponente, con su conferencia y su fecha. También se entregan en PDF individual (`individuales/`) y como plantilla en blanco | `.pptx` editable + `.pdf` |
| `05_flyers/general/` | Flyer general del Summit: post 1080×1350 e historia 1080×1920 | `.png` |
| `05_flyers/programa_por_dia/` | Programa de cada día para redes (3 flyers) | `.png` 1080×1350 |
| `05_flyers/ponentes/` | **20 flyers individuales**, uno por ponencia, con título, ponente, día y horario | `.png` 1080×1350 |

**Fuente tipográfica:** para abrir los `.pptx` sin que cambie el diseño, instala Raleway (`marca/fuentes/`) en la computadora.

## Cómo hacer cambios

Toda la información sale de **un solo archivo**: `datos/programa.json`. Si el Comité cambia un horario, un título o un nombre:

1. Edita `datos/programa.json`.
2. Ejecuta `bash scripts/generar_todo.sh`.

Así se regeneran juntos la plantilla, las pantallas, el tríptico, las constancias y los flyers, y ningún material queda desactualizado.
Al final, `scripts/verificar_datos.py` compara cada dato contra los archivos originales de `fuentes_originales/`.

- **Constancias de participantes:** escribe un nombre por renglón en `datos/participantes.csv` (debajo del encabezado `nombre`) y vuelve a generar.
- **Fotos de ponentes:** guarda la foto en `datos/fotos_ponentes/` con el mismo nombre que su flyer, por ejemplo
  `datos/fotos_ponentes/01_Dr_Juan_Manuel_Ruiz_Molina.jpg`, y vuelve a generar. El flyer cambia el ícono por la foto.

Requisitos para regenerar: Node 18+ (`npm install`), Playwright con Chromium, LibreOffice (Impress) y poppler-utils.

## Estructura

```
summit-2026/
├── datos/programa.json         ← única fuente de información
├── datos/participantes.csv     ← nombres para constancias de asistencia
├── fuentes_originales/         ← archivos tal como los envió la Facultad
├── marca/                      ← logos, fotos del campus y fuente Raleway
├── scripts/                    ← generadores (diapositivas, constancias, tríptico/flyers, verificación)
└── entregables/                ← materiales finales
```
