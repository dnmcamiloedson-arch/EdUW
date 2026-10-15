# Abrir el editor del reel en tu computadora

El reel está hecho con **Remotion** (video hecho con código). El editor se abre en tu
navegador y te deja ver la línea de tiempo, adelantar cuadro por cuadro y probar cambios.

## 1. Instala (una sola vez)

- **Node.js LTS** (versión 22): https://nodejs.org → botón "LTS".
- **Git**: https://git-scm.com/downloads (en Mac ya viene; si te pregunta, acepta instalarlo).

## 2. Descarga el proyecto

Abre una terminal (Mac: app *Terminal*; Windows: *PowerShell*) y pega:

```bash
git clone -b claude/youthful-edison-vl613q https://github.com/dnmcamiloedson-arch/EdUW.git
cd EdUW/reel-westhill360-ipefh/remotion
npm install
```

Si `git clone` te pide usuario/contraseña, inicia sesión con tu cuenta de GitHub. Otra opción:
en GitHub abre el repo, cambia a la rama `claude/youthful-edison-vl613q`, botón **Code → Download ZIP**,
descomprímelo y en la terminal entra a la carpeta `reel-westhill360-ipefh/remotion` para correr `npm install`.

## 3. Pon los videos y fotos

Los videos, fotos, recortes y música no viven en GitHub (pesan mucho). Vienen en los
archivos `medios_editor_parte1de5.zip` … `medios_editor_parte5de5.zip`.

Descomprime **los 5** dentro de la carpeta `EdUW/reel-westhill360-ipefh/remotion/`.
Al terminar debe existir `remotion/public/proxies`, `remotion/public/photos`,
`remotion/public/seg` y `remotion/public/music` (junto a `public/fonts`, `public/logos`, `public/sfx`).

## 4. Abre el editor

```bash
npm run editor
```

Se abre solo en el navegador (si no, entra a http://localhost:3000). A la izquierda eliges:

- **Reel**: el reel con la música original (sin derechos).
- **ReelSinMusica**: solo efectos, para ponerle la canción desde Instagram.
- **Intro** y las **Historias**.

La primera vez tarda un poco porque descarga un navegador interno.

## 5. Dónde se cambia cada cosa

| Quiero cambiar… | Archivo |
|---|---|
| Orden, duración y en qué segundo empieza cada clip | `src/Reel.tsx` → lista `SECTIONS` |
| Textos de la intro y el 360° | `src/Intro.tsx` |
| Textos del cornhole, final y tarjetas | `src/Reel.tsx` |
| Colores y tipografías | `src/theme.ts` |
| Historias | `src/Stories.tsx` |

Al guardar un archivo, el editor se actualiza solo.

## 6. Exportar el video

```bash
npm run render              # con música original → out/Reel_Westhill360.mp4
npm run render:sin-musica   # solo efectos
```

Nota: los videos del paquete están comprimidos para que pesen poco; sirven para editar y
revisar. Para la versión final en máxima calidad, pídela de nuevo y se exporta con los originales.
