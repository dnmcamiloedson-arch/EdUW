# Hoja de stickers — Universidad Westhill

| Archivo | Para qué |
|---|---|
| `hoja-stickers-imprimir.pdf` | Imprimir en hoja carta (papel adhesivo). Trae una línea gris finita para cortar. |
| `hoja-stickers-imprimir.png` | Lo mismo en imagen (300 dpi). |
| `hoja-stickers-vista.png` | Vista previa sobre azul claro, para ver los contornos blancos. |
| `individuales/*.png` | Cada sticker solo, fondo transparente, 300 dpi. Para imprenta, Cricut o Canva. |

Stickers: banderín UW (contorno blanco), UW en azul con contorno blanco,
logo Universidad Westhill (contorno blanco chico), edificio, huella azul y
dorada, mascota caracal y #SOMOSWESTHILL.

Fuente del material: carpeta `fuente/` (logo, banderín, huella y mascota tomados
de las skills Westhill y de otras ramas de este repo).

Para regenerar o cambiar tamaños: `python3 stickers/generar_stickers.py`
(tamaños en la función `catalogo()`, acomodo en `FILAS`).
