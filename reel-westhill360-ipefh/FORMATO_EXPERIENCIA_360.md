# Formato aprobado: Reel "Experiencia Westhill 360"

Este es el formato que el cliente aprobó (visita 2 de IPEFH, `remotion/src/Visita2.tsx`).
**Todo reel nuevo de una Experiencia Westhill 360 se hace igual.** Partir de `Visita2.tsx` como plantilla.

## Formato técnico
- Instagram Reel vertical 1080×1920, 30 fps, 60–75 s.
- Todo texto dentro de la **zona segura de Instagram**: márgenes laterales `SAFE_X = 96`, nada importante
  en los ~150 px de arriba (barra de estado). Textos largos con `safeSize()`.
- Banderín UW arriba a la derecha (componente `Banner`), desde la llegada hasta antes del cierre.
- Entregar comprimido < 28 MB para enviar; el original se guarda en `media/out/`.

## Estructura (en este orden)
1. **Intro 6 s** (`Intro`): logos Westhill × escuela, barrido azul, "Bienvenidos a la *Experiencia* WESTHILL",
   emblema 360° centrado con anillo que gira, subtítulo con el nombre de la escuela
   (**sin nombre de plantel** salvo que el cliente lo pida).
2. **Llegada** (`LlegadaText`): "¡Llegó [ESCUELA]!" con estela + frase manuscrita amarilla neón.
   Toma de grupo llegando. **No** poner texto detrás de las personas aquí.
3. **Charlas/talleres**: `TitleCard` "Conocieron de cerca / *su futura carrera*" + montaje rápido
   (1.0–1.8 s por toma). **No enlistar ni nombrar licenciaturas** (para no dejar fuera a nadie);
   dar más tiempo en pantalla a las que el cliente pida.
4. Secciones con `SectionLabel` (cinta azul + subtítulo manuscrito neón): Medicina, Hospital de
   simulación, Biblioteca, Gimnasio, Break…
5. **Cornhole**: "CORNHOLE" detrás de las cabezas (`BehindShot`, único momento con texto detrás junto al
   GRACIAS final), `ReglasCard` "El reto · Atina 3 seguidos · y gana un termo", tiros, "¡Lo lograron!",
   polaroids de ganadores **con su nombre** (`WinnerPhoto name=`) y ráfaga de cámara. Nunca decir "estreno".
6. **Cierre** (`Cierre`): paneo por la foto grupal con "GRACIAS" detrás del grupo → círculo azul →
   `EndCard` con logos en blanco, "Gracias por visitarnos", "*¡Nos vemos pronto!*", #SOMOSWESTHILL.

## Estilo
- Mezcla de la identidad Westhill (azul `#27639A`, cintas, Montserrat/Anton) con el estilo de la referencia:
  palabra clave en manuscrita amarilla con neón (`ScriptWord`, Yellowtail), estela de movimiento (`BlurIn`),
  trazos dibujados (`Doodle`), entradas de toma tipo tarjeta / barrido / zoom.
- Efectos de sonido del video de referencia (`SFX_MAP` en `theme.ts`): swoosh en barridos, flicker/tap en
  textos, **obturador de cámara en todas las fotos**, ráfaga en ganadores. Sin voz.

## Música
- Si el cliente manda canción: sincronizar sus "drops" con cortes (drop 1 al terminar la intro; un segundo
  tramo en un corte fuerte). Ver `FondoAlegre` en `Visita2.tsx`.
- Si no: pista original sin derechos (`sfx/generar_musica.py <salida> <dur> <fin_groove> <inicio_respiro>`).
- Entregar también versión sin música (Instagram puede silenciar canciones con derechos).

## Flujo de trabajo
1. Esperar a que el cliente diga que ya mandó todo. Convertir clips a proxies 1080×1920
   (`media/<visita>/proxies`, enlazados en `public/proxies/<visita>`), fotos en `public/photos/<visita>`.
2. Recortes de personas: `scripts/recortar_personas.py` (cornhole y foto final).
3. Montar copiando `Visita2.tsx`, registrar en `Root.tsx`, revisar fotogramas antes de renderizar.
4. Render: `scripts/render_todo.sh <Composición>`.
