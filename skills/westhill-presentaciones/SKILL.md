---
name: westhill-presentaciones
description: Crea presentaciones de PowerPoint (.pptx) con la identidad institucional de la Universidad Westhill — ola azul/verde con #SOMOSWESTHILL, banderín UW, fondo blanco, portadas con foto del campus en curva y tipografía Raleway — y con un diseño de contenido "vendible" (tarjetas, íconos en círculo, montos destacados, procesos por pasos, animaciones) sin alterar la información que entrega el usuario. Úsala siempre que alguien pida una presentación, diapositivas, deck, propuesta o plan de acción para Westhill / Universidad Westhill / UW, que quiera "pasar en limpio" o "hacer vendible" un PPT institucional, o que mande información o un .pptx viejo para convertirlo en presentación de Westhill, aunque no mencione la palabra "skill" ni el estilo.
---

# Presentaciones institucionales Westhill

Esta skill produce presentaciones que la Universidad Westhill ya aprobó como **institucionales**: el contenido se presenta con mucho diseño (tarjetas, íconos, jerarquía visual, animaciones), pero el marco (encabezado, portadas, colores, tipografía, fondo) es fijo y no se reinventa. La referencia aprobada es `references/ejemplo_embajadores.js` (presentación "Embajadores Westhill").

Todo lo visual institucional ya está resuelto en `scripts/westhill.js`; tu trabajo es organizar la información en diapositivas y elegir los patrones de contenido.

## Reglas de contenido (lo más importante para el usuario)

- **No modifiques la información.** Usa los textos del usuario palabra por palabra. Lo único permitido sin preguntar: corregir ortografía o typos evidentes ("atráves" → "a través", "Rregistrar" → "Registrar"), quitar puntos dobles y dar formato a montos ("$2000" → "$2,000"). Al entregar, **enumera cada corrección** para que el usuario la valide.
- **Si algo es ambiguo o contradictorio, no lo resuelvas en silencio.** Elige la opción más razonable, aplícala y avísalo claramente. Ejemplos reales: una tabla de Excel decía "Referido agenda entrevista $5000" donde la diapositiva decía "3 invitados inscritos $5000"; la fecha del archivo no coincidía con la de la portada; una frase decía "salvo a las políticas" cuando el sentido era "sujeto a".
- **Puedes reorganizar y agregar estructura**: unir dos diapositivas del mismo tema en una comparativa, poner títulos y subtítulos cortos, agregar portadas de sección, convertir listas en tarjetas o pasos. Si un título original es muy largo, déjalo completo como subtítulo y pon un título corto. Cualquier texto que tú escribas (títulos, etiquetas de pasos) menciónalo al final como "textos que agregué".
- **Lee también lo que no es texto plano**: tablas de Excel incrustadas en el .pptx (`ppt/embeddings/*.xlsx`), imágenes con datos, notas. Ahí suele estar información clave (tablas de puntos, montos).
- Si el usuario menciona datos de ejemplo (correos @ejemplo.com, nombres ficticios), agrega una nota discreta "Datos de ejemplo…" para que nadie los tome como reales.

## Reglas institucionales (no cambiar sin que el usuario lo pida)

Ya están implementadas en la biblioteca; respétalas al componer:

- **Fondo totalmente blanco** en diapositivas de contenido. Nada de degradados de fondo, marcas de agua del edificio, puntitos, arcos decorativos, huellas ni logos extra: la Universidad los rechazó por "no institucionales".
- **Encabezado de contenido**: ola azul con franja verde solo en la parte izquierda, con #SOMOS**WESTHILL** (WESTHILL en negrita) en blanco, y el banderín UW colgando arriba a la derecha. **No pongas texto junto al banderín** (ni "Plan de acción" ni el nombre del programa) y no agregues un kicker encima del título.
- **Portada, portadas de sección y cierre** usan el diseño original de la Universidad: foto del campus recortada en curva a la derecha, olas dorada y azul abajo con #SOMOSWESTHILL, banderín UW arriba (subido y centrado sobre el texto) y textos centrados en azul. El título de portada va solo, sin agregar fechas ni subtítulos que el usuario no pidió.
- **Tipografía Raleway** en todo. Paleta: azul `266294`, marino `0E2A47`, dorado `F2C94C`, hielo `EDF3FA`, gris `5B6B7D`. Pie: `@univwesthill` y número de diapositiva.
- Textos siempre editables (cuadros de texto y tablas nativas, nunca texto dentro de imágenes generadas).

## El "toque" de diseño en el contenido

Lo que hizo vendible la presentación de referencia:

- **Tarjetas**: `card(..., "light")` blancas con sombra suave para contenido normal; `"dark"` (degradado marino) para **el elemento que se quiere destacar** (el objetivo, el perfil "Líder", el paso del bono, el nivel "Élite", el paso final). Una o dos oscuras por diapositiva, no más.
- **Íconos en círculo** (`badge`) junto a cada concepto: azul para lo normal, dorado para lo destacado. Ícono grande y tenue (`watermark`) dentro de algunas tarjetas oscuras.
- **Montos y números grandes** (30–40 pt) con la etiqueta pequeña al lado; el mayor en dorado o sobre barra dorada (`card(..., "gold")`).
- **Procesos como pasos numerados** (01, 02, 03…) en tarjetas con flechas doradas (`badge("FaChevronRight", …, "gold")`); recorridos en zigzag con líneas punteadas doradas; niveles como escalera de tarjetas que suben.
- **Condiciones o letras chiquitas** en una nota con borde dorado (`note`).
- **Fotos y capturas** con esquinas redondeadas y marco blanco (`photo`, `framed`).
- **Animaciones**: cada objeto entra con "Float In" en cascada automática según `step(n)`; las transiciones entre diapositivas son de desvanecimiento. Asigna `step` de modo que primero aparezca la tarjeta y su contenido, luego la siguiente.

Antes de componer, revisa `references/patrones.md`: tiene el catálogo de diapositivas de la presentación de referencia y dónde copiar cada una.

## Flujo de trabajo

1. **Preparar el entorno** (una vez por sesión):
   `bash <skill>/scripts/setup.sh <carpeta_de_trabajo>` (instala dependencias de Node, la fuente Raleway y LibreOffice Impress para revisar).
2. **Extraer la información** del material del usuario. Para un .pptx: `markitdown archivo.pptx` (o `python-pptx`) más las tablas incrustadas con `openpyxl`; renderízalo (`scripts/render_check.sh`) para ver qué hay en imágenes.
3. **Planear**: una idea por diapositiva. Estructura típica: portada → (sección 01) → diapositivas → (sección 02) → … → cierre. Usa portadas de sección cuando haya 3 o más bloques temáticos.
4. **Escribir el script** en la carpeta de trabajo, partiendo de este esqueleto:

   ```js
   const { createDeck } = require("<skill>/scripts/westhill.js");
   const d = createDeck({ title: "Nombre de la presentación" });
   const { COL, W, M, step, text, bullets, pill, card, badge, watermark, note } = d;
   const { NAVY, INK, WHITE, BLUE, GOLD, MIST, MUTED } = COL;
   (async () => {
     await d.cover("EMBAJADORES WESTHILL");                       // foto: edificio | rotonda | letras | ruta
     await d.section("01", "El programa", { photo: "rotonda" });
     let s = d.contentSlide("Título", { section: "Programa", subtitle: "opcional" });
     step(1); await card(s, M, 1.75, 6.6, 3, "dark");
     // ...
     await d.closing({ line1: "Embajadores Westhill", line2: "Enero 2027" });
     await d.save("Salida.pptx");                                 // escribe, aplica tema y animaciones
   })();
   ```

   Ejecuta con `NODE_PATH=<carpeta_de_trabajo>/node_modules node script.js`.

   **Coordenadas en diapositivas de contenido**: escribe la Y como si el contenido ocupara la franja **1.7"–6.65"** (ancho útil x 0.6"–12.73"); la biblioteca la acomoda debajo del encabezado institucional (2.15"–7.0"). Si una diapositiva necesita llegar más abajo, usa `contentSlide(t, { bottom: 6.93 })`. Para posicionar en coordenadas reales usa `{ real: true }` en la diapositiva (contenido de 2.15" a 7.0"; con subtítulo, desde ~2.5"). `framed`, `photo`, `subtitle` y todo lo que lleve `abs: true` ya usan coordenadas reales.
5. **Fotos nuevas para portadas**: `python3 <skill>/scripts/make_intro_bg.py foto.jpg fondo.jpg [--focus x0,y0,x1,y1]` genera el fondo con el diseño original y esa foto; pásalo como `photo: "ruta/fondo.jpg"`. La curva solo muestra una franja horizontal (~1.15:1) de la foto: usa `--focus` (fracciones 0–1 de la foto) para encuadrar a las personas o la fachada, y revisa el resultado; si alguien sale cortado, ajusta el encuadre. Sirve con fotos verticales u horizontales. Fotos del campus en `assets/fotos/`. Si el usuario puede producir fotos, propón ideas concretas por portada (llegada al campus, actividad en equipo, asesoría, etc.) y conserva la del edificio en la portada principal.
6. **Revisar visualmente (obligatorio)**: `bash <skill>/scripts/render_check.sh Salida.pptx` y mira cada imagen. Busca texto cortado o encimado, tarjetas que se tocan, títulos que se parten raro y elementos que tapan el encabezado. Corrige y vuelve a revisar solo lo que cambió. La revisión con LibreOffice no reproduce las animaciones; eso se ve en PowerPoint (F5).
7. **Entregar** el .pptx con un resumen corto en español: qué diapositivas hay, qué textos agregaste, qué correcciones hiciste y qué dudas quedaron. Recuerda al usuario que necesita **Raleway instalada** en su computadora.

## Errores conocidos

- Si LibreOffice responde "source file could not be loaded", falta Impress: `apt-get install libreoffice-impress` (lo hace `setup.sh`).
- Si la exportación a PDF falla con un error de E/S, hay un archivo `.~lock` de una conversión interrumpida; `render_check.sh` usa una carpeta nueva cada vez para evitarlo.
- Colores siempre en hex de 6 dígitos sin `#` o como `COL.*`; en opciones de pptxgenjs que solo aceptan hex (sombras), usa `d.HEX`.
- Los nombres de íconos son de `react-icons/fa6` (`FaStar`, `FaTrophy`, `FaQrcode`…); un nombre inválido lanza error.
