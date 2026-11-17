# Página de perdón

Todo el contenido se edita en **`config.js`** (nombres, letra, fotos, confesiones, promesas, carta, WhatsApp).

## 1. Fotos de ustedes
Copia las fotos en `fotos/` y escribe sus nombres en `recuerdos` dentro de `config.js`.
En cada una puedes poner una `frase` de la canción, el `momento` y una `fecha` (sale como el sello naranja de una cámara de rollo).
Las tres primeras fotos también salen en la portada.

## 2. La canción
- **Opción A:** guarda la canción como `musica/si-es-posible.mp3`.
- **Opción B:** pega el enlace de YouTube en `cancion.youtube`. Se usa automáticamente si no hay mp3.

> Si publicas desde un repositorio público, el mp3 también queda público. En ese caso la opción B es la más segura.

## 3. La letra
Pega las estrofas en `letra` (cada `[ ... ]` es una estrofa, cada texto una línea).

## 4. Probar en tu computador
```bash
cd perdon && python3 -m http.server 8000
```
Abre http://localhost:8000

## 5. Tarjeta QR para el dulce
Una vez publicada la página, abre `qr.html` en esa misma dirección: el QR ya apunta a tu página.
Descarga la imagen o imprime una hoja con 9 tarjetas de 6 × 9 cm.
