# Serie de leyendas (días 8 → 0)

Motor 2D cinematográfico propio para la recta final. Los personajes son 2D: siluetas, vistas parciales, sombras, ojos que brillan y tela con física. El 3D queda solo para detalles. Todo se dibuja por código; no hay imágenes externas.

## Archivos

| Archivo | Qué es |
|---|---|
| `dXX_slug.tsx` | El episodio del día XX. Exporta `EPXX_LEN` (frames, sin el outro) y `EpXX` (componente `{dias, fecha}`). |
| `entries/dXX.ts` | Entrada aislada del episodio, para renderizar fotogramas sin compilar los demás. |
| `devRoot.tsx` | Composiciones de desarrollo: `Ep` (solo el episodio) y `EpOutro` (episodio + outro estándar). |
| `kit/*` | Motor compartido (ver abajo). No se modifica desde un episodio: si algo falta, se agrega en el propio episodio. |
| `../../scripts/leyendas/dXX.py` | Partitura y diseño sonoro del día: `LEN` (igual a `EPXX_LEN`), `STANDARD_OUTRO`, `score(bus)`. |
| `../../scripts/leyendas_sfx.py` | Bloques de sonido: lamento, susurro, risita, tecolote, aullido, cascos, relincho, motor, derrape, viento, grillos, reloj, rasguños, crujidos, golpes de susto, crescendos, etc. |

## Kit

- **`kit/scene.tsx` · `Scene`**: lienzo 2D de 1080×1920 que se repinta cada frame, con postproducción WebGL encima y los textos (DOM) arriba de todo.
  - `paint(g, f, t)` dibuja el cuadro y puede regresar ajustes de post para ese frame, por ejemplo `{flash: 0.8, glitch: 0.3, fade: 1}`.
- **`kit/post.tsx` · `PostOpts`** ajusta la postproducción:
  - imagen: `exposure`, `contrast`, `saturation`, `shadows`/`highlights` (tintes RGB);
  - luz y lente: `bloom`, `bloomThr`, `halation`, `ca` (aberración cromática), `vignette`, `grain`;
  - efectos de cámara: `fade`, `flash`, `glitch`, `scan`, `mono` (visión nocturna);
  - achurado tipo grabado: `hatch`, `hatchScale`, `hatchAngle`, `hatchInk`.
- **`kit/stage.ts`**: cámara 2.5D por planos de profundidad.
  - `onPlane(g, cam, z, fn)` dibuja en coordenadas de mundo del plano z. A z = cam.z + 1000, 1 unidad = 1 px.
  - El orden de pintado de lejos a cerca garantiza capas correctas.
  - También incluye: `project`, `depthScale`, `dof` (desenfoque por profundidad), `fogAmount`, `handheld(t)`, `shake(t, t0, amp)`, `camPath(keys, t, ease)` (Catmull-Rom), `addCam`, `mixCam`.
- **`kit/paint.ts`**:
  - lienzos: `useFrameCanvas`, `makeCanvas`, `cached(key, fn)`;
  - texturas: `noiseTile` (ruido que se repite sin costura), `tinted`, `drawTiled`, `speckle`;
  - luz y atmósfera: `fogBand` (banda de niebla animada), `glow` (brillo aditivo), `beam` (haz de luz), `flashlight` (todo oscuro salvo el cono de una linterna);
  - `blurred` (copia desenfocada cacheada).
- **`kit/shade.ts` · `paintShape(g, path, box, mat, res)`**: material pictórico para formas.
  - Agrega cuerpo con degradado, sombra interior del lado opuesto a la luz, luz de contorno, textura y halo.
  - Con esto una silueta deja de verse plana.
  - Incluye los helpers `vgrad` y `rgrad` (degradados) y `surface` (texturas de piedra, adobe o madera).
- **`kit/rig.ts`**: movimiento natural.
  - Física precalculada y determinista: `simChain` y `chainAt` (cabello, rebozo, crin, cola); `simCloth` y `clothAt` (velo, vestido, sarape).
  - Animación: `ik2` (brazo o pierna de dos huesos), `springFollow` (seguimiento con inercia), `gust` (viento), `smoothPath` (curva suave por puntos).
- **`kit/fx.ts`**: `particles` (polvo, brasas, pétalos, lluvia, luciérnagas, ceniza), `flame2D`, `candle2D`, `marigold` (cempasúchil), `papelPicado`, `smoke` (copal), `reflect` (reflejo en agua) y `vignetteRect`.
- **`kit/text.tsx`**:
  - `Line`: texto con modos `soft`, `flicker`, `type`, `slam`, `whisper` y `burn`; colores por palabra con `accent`; respeta la zona segura sola.
  - `LeyendaLockup`: FALTAN / FALTA / HOY + DÍAS + fecha; el número lo pone cada episodio.

## Reglas

- Nunca escribir «ofrenda», «evento» ni «concurso». Se dice «altar».
- Sin sangre, sin gore y sin imaginería de Halloween (calabazas, murciélagos, telarañas).
- Solo Rye y Alike. Nada de texto en los 250 px de arriba ni en los 340 px de abajo.
- Paleta de marca: #231305, #F26D3D, #F5C242, #E0BB8F, #1F5C48, #A83A25, #D9CDB6.
- Audio a −14 LUFS integrados, pico real ≤ −1 dBTP (el master de `sfx.master` ya lo hace).
- Todo determinista: nada de `Math.random()`. Usar `hash`, `noise2D` o las simulaciones precalculadas.
- Pintar durante el render, no en efectos: la postproducción lee el lienzo en el mismo frame.

## Comandos

```bash
# fotogramas de un episodio aislado (escala 0.5 → 540×960)
ENTRY=src/leyendas/entries/d08.ts COMP=Ep PROPS='{"dias":8,"fecha":"28 · 10"}' node scripts/stills.mjs /tmp/st 0.5 60 300 600
python3 scripts/sheet.py /tmp/st /tmp/st.png      # hoja de contacto
python3 scripts/make_cap_audio.py 8 /tmp/d8.wav   # audio del día (imprime LUFS)
./scripts/render_cap.sh 8                          # render final con audio → out/temporada2/
```
