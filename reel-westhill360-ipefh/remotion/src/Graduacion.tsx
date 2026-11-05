import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, Img, interpolate, random, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from './components';
import {Sfx} from './shots';
import {F, ease, tw} from './theme';
import {FOTOS} from './gradFotos';
import {LOGO_PNG, LOGO_PUNTOS} from './gradLogoPuntos';
import {FOCO} from './gradFoco';

// ---------------------------------------------------------------------------
// Video interno de graduación (1920x1080, para proyector) con "Happier" (Marshmello ft. Bastille, 100 BPM).
//  1. Intro tranquila (0–28 s): frases emotivas en negro y el logo con "Generación 2026".
//  2. Desde el coro (28.08 s) las fotos por facultad: portada de la facultad y luego espacios de 4 tiempos
//     (2.4 s) que alternan foto sola, trío, tira de película y collage de 4.
//  3. Un interludio con frase a mitad del video y el cierre con "¡Felicidades, Generación 2026!".
// Preparado para voz en off: la prop `voz` (archivo en public/) entra en VOZ_DESDE y baja la música mientras suena.
// Una facultad sin fotos (Derecho, por ahora) no aparece; al agregar sus fotos a gradFotos.ts entra sola.
// ---------------------------------------------------------------------------
const W = 1920;
const H = 1080;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const BEAT = 0.5986 * 30; // cuadros por tiempo
const CORO = 28.08; // entrada del coro en la canción
const SLOT = 4 * BEAT;
const NAVY = '#0B1B33';
const ORO = '#D9B76A';
const ORO_GRAD = 'linear-gradient(180deg, #F6E3B0 0%, #D9B76A 55%, #A97B35 100%)';
const CREMA = '#F4EEE2';

const FACULTADES: {key: string; nombre: string}[] = [
  {key: 'Arquitectura', nombre: 'Arquitectura y Diseño del Espacio'},
  {key: 'Derecho', nombre: 'Derecho y Estudios Internacionales'},
  {key: 'Negocios', nombre: 'Negocios'},
  {key: 'Odontologia', nombre: 'Odontología'},
  {key: 'Psicologia', nombre: 'Psicología y Ciencias de la Educación'},
];
const foto = (fac: string, n: string) => staticFile(`photos/grad/${fac}/${n}`);

// ---------------------------------------------------------------------------
// Línea de tiempo (se calcula en tiempos de la canción para que todo caiga en el ritmo)
// ---------------------------------------------------------------------------
type Tipo = 'single' | 'trio' | 'strip' | 'quad';
const PATRON: Tipo[] = ['single', 'trio', 'single', 'strip', 'quad'];
const CUANTAS: Record<Tipo, number> = {single: 1, trio: 3, strip: 4, quad: 4};
type Item =
  | {k: 'portada'; fac: string; nombre: string; num: number; beats: number}
  | {k: 'fotos'; fac: string; tipo: Tipo; fotos: [string, number, number][]; beats: number}
  | {k: 'frase'; arriba: string; grande: string; beats: number};
const INTERLUDIO: Item = {k: 'frase', arriba: 'Lo que aprendiste aquí', grande: 'no se queda aquí: va contigo.', beats: 12};
const ITEMS: Item[] = (() => {
  const r: Item[] = [];
  let num = 0;
  FACULTADES.forEach(({key, nombre}) => {
    const fs = FOTOS[key] ?? [];
    if (!fs.length) return;
    num += 1;
    if (key === 'Psicologia') r.push(INTERLUDIO);
    r.push({k: 'portada', fac: key, nombre, num, beats: 4});
    let i = 0;
    let p = 0;
    while (i < fs.length) {
      let tipo = PATRON[p % PATRON.length];
      const quedan = fs.length - i;
      if (CUANTAS[tipo] > quedan) tipo = quedan >= 3 ? 'trio' : 'single';
      r.push({k: 'fotos', fac: key, tipo, fotos: fs.slice(i, i + CUANTAS[tipo]), beats: 4});
      i += CUANTAS[tipo];
      p += 1;
    }
  });
  return r;
})();
const INICIO = Math.round(CORO * 30);
const beatF = (b: number) => Math.round(INICIO + b * BEAT);
const ARRANQUES = ITEMS.reduce<number[]>((a, it, i) => [...a, i === 0 ? 0 : a[i - 1] + ITEMS[i - 1].beats], []);
const BEATS_TOTAL = ARRANQUES[ARRANQUES.length - 1] + ITEMS[ITEMS.length - 1].beats;
const FIN_DESDE = beatF(BEATS_TOTAL);
export const CIERRE_F = Math.round(220.8 * 30) - FIN_DESDE; // el cierre dura lo necesario para terminar con la canción (220.8 s)
export const GRAD_FRAMES = FIN_DESDE + CIERRE_F;
/** voz en off opcional: entra aquí (segundo 1 del video) */
export const VOZ_DESDE = 30;

// ---------------------------------------------------------------------------
// Sincronía con la canción: tramos con bajo fuerte ("drops") y golpes donde arranca cada uno.
// En los drops las fotos salen con barrido o atravesando y un brillo de luz las recorre a tiempo con la música;
// en las partes tranquilas se revelan y salen con un destello de luz cálida. Nada de rebotes ni sacudidas.
// ---------------------------------------------------------------------------
const DROPS: [number, number][] = [
  [30.4, 38.0],
  [54.4, 56.8],
  [59.2, 95.1],
  [112.0, 114.4],
  [116.7, 133.5],
  [143.2, 150.4],
  [181.3, 210.0],
];
const GOLPES = [30.5, 59.2, 116.7, 143.2, 181.3];
const enDrop = (t: number) => DROPS.some(([a, b]) => t >= a && t < b);
const esGolpe = (t: number) => GOLPES.some((g) => Math.abs(g - t) < 0.5);
type Entra = 'sube' | 'zoom' | 'baja' | 'enfoca' | 'lado' | 'revela';
type Sale = 'fade' | 'barrido' | 'atraviesa' | 'luz';
type Estilo = {entra: Entra; sale: Sale; drop: boolean; golpe: boolean; brillo: boolean};
/** estilo de cada espacio de fotos según dónde cae en la canción; la entrada combina con la salida anterior */
const ESTILOS: Estilo[] = (() => {
  const r: Estilo[] = [];
  let prev: Sale = 'fade';
  let n = 0;
  let sueltas = 0; // fotos solas en drops: solo una de cada tres lleva el brillo
  ITEMS.forEach((it, i) => {
    const t = beatF(ARRANQUES[i]) / 30;
    const drop = enDrop(t);
    const golpe = esGolpe(t);
    let sale: Sale;
    let entra: Entra;
    if (drop) {
      sale = n % 2 ? 'atraviesa' : 'barrido';
      entra = prev === 'barrido' ? 'lado' : prev === 'atraviesa' ? 'zoom' : golpe ? 'enfoca' : 'baja';
    } else {
      sale = n % 2 ? 'fade' : 'luz';
      entra = n % 2 ? 'sube' : 'revela';
    }
    const brillo = drop && it.k === 'fotos' && it.tipo === 'single' && sueltas++ % 3 === 0;
    r.push({entra, sale, drop, golpe, brillo});
    prev = it.k === 'fotos' ? sale : 'fade';
    n += 1;
  });
  return r;
})();
/** número de tira de película (para alternar su sentido y altura) */
const TIRA_IDX: number[] = (() => {
  let n = 0;
  return ITEMS.map((it) => (it.k === 'fotos' && it.tipo === 'strip' ? n++ : -1));
})();

// ---------------------------------------------------------------------------
// Piezas visuales
// ---------------------------------------------------------------------------
const Fondo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: NAVY, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(39,99,154,0.55) 0%, rgba(11,27,51,0) 65%)'}} />
      {Array.from({length: 26}, (_, i) => {
        const x = ((i * 277) % W) + Math.sin(f / 60 + i) * 30;
        const y = ((i * 131 + f * (0.25 + (i % 4) * 0.1)) % (H + 100)) - 50;
        const s = 6 + (i % 5) * 4;
        return <div key={i} style={{position: 'absolute', left: x, top: H - y, width: s, height: s, borderRadius: '50%', background: ORO, opacity: 0.12 + (i % 3) * 0.06, filter: 'blur(2px)'}} />;
      })}
    </AbsoluteFill>
  );
};

/**
 * Foto con marco blanco y sombra. Adentro la foto se acerca despacio (Ken Burns) y, en los drops,
 * un brillo de luz la cruza como reflejo de papel fotográfico. La entrada cambia según el momento de la canción.
 */
const Marco: React.FC<{src: string; w: number; h: number; x: number; y: number; maxW: number; maxH: number; r?: number; at?: number; dur: number; entra: Entra; lado?: number; brillo?: number}> = ({src, w, h, x, y, maxW, maxH, r = 0, at = 0, dur, entra, lado = 1, brillo}) => {
  const f = useCurrentFrame();
  const s = Math.min(maxW / w, maxH / h);
  const fw = w * s;
  const fh = h * s;
  const suave = entra === 'baja' || entra === 'enfoca';
  const p = tw(f, [at, at + (suave ? 18 : 12)], [0, 1], ease.out);
  const q = 1 - p;
  const avance = interpolate(f, [at, at + dur], [0, 1], clamp);
  const deriva = 1 + 0.025 * avance;
  let t = '';
  let filtro = 'none';
  let op = Math.min(1, p * 1.5);
  if (entra === 'sube') t = `translateY(${q * 60}px) scale(${0.92 + 0.08 * p})`;
  if (entra === 'zoom') {
    t = `scale(${1 + q * 0.45})`;
    filtro = `blur(${q * 14}px)`;
  }
  if (entra === 'baja') t = `translateY(${q * -90}px) scale(${0.97 + 0.03 * p})`;
  if (entra === 'enfoca') {
    t = `scale(${1 + q * 0.12})`;
    filtro = `blur(${q * 10}px) brightness(${1 + q * 1.4})`;
    op = Math.min(1, p * 2.5);
  }
  if (entra === 'lado') {
    t = `translateX(${q * 1500 * lado}px)`;
    filtro = `blur(${q * 18}px)`;
    op = 1;
  }
  if (entra === 'revela') {
    const rev = tw(f, [at, at + 26], [0, 1]);
    t = `scale(${0.96 + 0.04 * p})`;
    filtro = `brightness(${2.4 - 1.4 * rev}) sepia(${0.6 * (1 - rev)}) contrast(${0.7 + 0.3 * rev})`;
  }
  // brillo: una franja de luz que cruza toda la pantalla de izquierda a derecha; cada foto lo recibe al pasar
  const izq = x - fw / 2 - 14;
  let reflejo: React.ReactNode = null;
  if (brillo !== undefined && f >= brillo && f <= brillo + 24) {
    const cx = interpolate(f, [brillo, brillo + 24], [-500, W + 500], {easing: ease.inOut}) - izq;
    reflejo = (
      <div style={{position: 'absolute', top: -200, bottom: -200, left: cx - 180, width: 360, transform: 'skewX(-18deg)', background: 'linear-gradient(90deg, rgba(255,250,235,0) 0%, rgba(255,250,235,0.22) 35%, rgba(255,255,255,0.55) 50%, rgba(255,250,235,0.22) 65%, rgba(255,250,235,0) 100%)', mixBlendMode: 'screen'}} />
    );
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: izq,
        top: y - fh / 2 - 14,
        padding: 14,
        background: '#FDFBF6',
        boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
        transform: `${t} rotate(${r * Math.min(1, p)}deg) scale(${deriva})`,
        filter: filtro,
        opacity: op,
        overflow: 'hidden',
      }}
    >
      <div style={{width: fw, height: fh, overflow: 'hidden'}}>
        <Img src={src} style={{width: fw, height: fh, objectFit: 'cover', display: 'block', transform: `scale(${1.06 + 0.06 * avance}) translateX(${(avance - 0.5) * 10 * lado}px)`}} />
      </div>
      {reflejo}
    </div>
  );
};

/**
 * Posición vertical del recorte (object-position en %) para que las caras queden dentro de un cuadro de fw x fh:
 * el centro de las caras (gradFoco.ts) queda al 42 % de la altura del cuadro. Sin caras detectadas, 35 %.
 */
const encuadre = (fac: string, n: string, w: number, h: number, fw: number, fh: number) => {
  const fy = FOCO[`${fac}/${n}`];
  const alto = h * Math.max(fw / w, fh / h);
  const sobra = alto - fh;
  if (fy === undefined || sobra <= 1) return 35;
  return Math.round(Math.min(1, Math.max(0, (fy * alto - 0.42 * fh) / sobra)) * 100);
};

/** Rollo de película de 35 mm: base café oscuro, perforaciones a contraluz, números de cuadro y destello de luz */
const PERF = 52;
type TiraProps = {fac: string; fotos: [string, number, number][]; dur: number; dir?: number; y?: number; rot?: number; escala?: number; desde?: number; hasta?: number};
const Pelicula: React.FC<TiraProps> = ({fac, fotos, dur, dir = 1, y = H / 2, rot = -4, escala = 1, desde = -380, hasta = -1764}) => {
  const f = useCurrentFrame();
  const FW = 640;
  const FH = 480;
  const GAP = 32;
  const BANDA = 78;
  const cuadros: (string | null)[] = [null, ...fotos.map((x) => x[0]), null];
  const pos: Record<string, number> = Object.fromEntries(fotos.map(([n, w, h]) => [n, encuadre(fac, n, w, h, FW, FH)]));
  const ancho = cuadros.length * (FW + GAP) + GAP;
  // dir 1: el rollo corre hacia la izquierda; dir -1: hacia la derecha
  const x = interpolate(f, [0, dur], dir > 0 ? [desde, hasta] : [hasta, desde], clamp);
  const vaiven = Math.sin(f / 3.1) * 1.4;
  const fuga = interpolate(f, [0, dur], dir > 0 ? [-600, ancho + 200] : [ancho + 200, -600], clamp);
  const perforaciones = Array.from({length: Math.ceil(ancho / PERF)}, (_, i) => i);
  const hoyo: React.CSSProperties = {position: 'absolute', width: 30, height: 21, borderRadius: 5, background: 'linear-gradient(180deg, #FFF6E6, #E9DCC4)', boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.45), 0 0 6px rgba(255,236,200,0.35)'};
  return (
    <div style={{position: 'absolute', left: x, top: y - (FH + 2 * BANDA) / 2 + vaiven, width: ancho, height: FH + 2 * BANDA, transform: `rotate(${rot}deg) scale(${escala})`, transformOrigin: `${W / 2 - x}px 50%`}}>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #2B1A10 0%, #140C07 18%, #0E0805 50%, #140C07 82%, #2B1A10 100%)', boxShadow: '0 50px 90px rgba(0,0,0,0.65)', borderTop: '2px solid #3A2617', borderBottom: '2px solid #3A2617'}} />
      {perforaciones.map((i) => (
        <React.Fragment key={i}>
          <div style={{...hoyo, left: 11 + i * PERF, top: 16}} />
          <div style={{...hoyo, left: 11 + i * PERF, bottom: 16}} />
        </React.Fragment>
      ))}
      {cuadros.map((n, k) => {
        const left = GAP + k * (FW + GAP);
        const num = 12 + k;
        return (
          <React.Fragment key={k}>
            <div style={{position: 'absolute', left: left + 6, top: BANDA - 22, fontFamily: F.sans, fontWeight: 700, fontSize: 15, letterSpacing: 3, color: '#E59B3C', opacity: 0.85, whiteSpace: 'nowrap'}}>
              ◂ {num} &nbsp; WESTHILL 2026 &nbsp; {num}A ▸
            </div>
            <div style={{position: 'absolute', left: left + FW - 60, bottom: BANDA - 22, fontFamily: F.sans, fontWeight: 700, fontSize: 15, letterSpacing: 2, color: '#E59B3C', opacity: 0.7}}>{num}</div>
            <div style={{position: 'absolute', left, top: BANDA, width: FW, height: FH, borderRadius: 6, overflow: 'hidden', background: '#060403', boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.6)'}}>
              {n && <Img src={foto(fac, n)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: `50% ${pos[n] ?? 35}%`, filter: 'contrast(1.06) saturate(1.05) sepia(0.06)'}} />}
              <div style={{position: 'absolute', inset: 0, boxShadow: 'inset 0 0 40px rgba(0,0,0,0.55)'}} />
            </div>
          </React.Fragment>
        );
      })}
      {/* destello de luz que recorre el rollo */}
      <div style={{position: 'absolute', top: 0, bottom: 0, left: fuga, width: 520, background: 'linear-gradient(90deg, rgba(255,170,80,0) 0%, rgba(255,170,80,0.28) 45%, rgba(255,230,190,0.38) 52%, rgba(255,170,80,0) 100%)', mixBlendMode: 'screen'}} />
    </div>
  );
};

/**
 * Variantes de la tira de película: cada una cambia de sentido y de altura (centro, arriba, abajo) con su inclinación.
 * Arriba y abajo llevan además un rollo pequeño y desenfocado en sentido contrario en el espacio libre (profundidad).
 */
const TIRAS: {y: number; rot: number; dir: number; escala: number; eco?: number}[] = [
  {y: H / 2, rot: -4, dir: 1, escala: 1},
  {y: 360, rot: 3, dir: -1, escala: 0.86, eco: 885},
  {y: 720, rot: -3, dir: 1, escala: 0.86, eco: 195},
  {y: H / 2, rot: 4, dir: -1, escala: 1},
  {y: 360, rot: -3, dir: 1, escala: 0.86, eco: 885},
  {y: 720, rot: 3, dir: -1, escala: 0.86, eco: 195},
];

const FotosSlot: React.FC<{it: Extract<Item, {k: 'fotos'}>; est: Estilo; tira: number}> = ({it, est, tira}) => {
  const f = useCurrentFrame();
  const dur = Math.round(it.beats * BEAT);
  const SAL = est.sale === 'luz' ? 14 : 9;
  const s = tw(f, [dur - SAL, dur], [0, 1], ease.in);
  const [p0] = it.fotos;
  const b = (k: number) => Math.round(k * BEAT);
  const e = est.entra;
  // en algunas fotos solas de los drops un brillo las cruza en el tercer tiempo (sin latidos ni sacudidas)
  const brillo = est.brillo ? b(2) + 2 : undefined;
  // destello suave en el arranque de un drop
  const golpe = est.golpe ? interpolate(f, [0, 3, 20], [0, 0.5, 0], clamp) : 0;
  let contenido: React.ReactNode = null;
  if (it.tipo === 'single') {
    contenido = <Marco src={foto(it.fac, p0[0])} w={p0[1]} h={p0[2]} x={W / 2} y={H / 2} maxW={1300} maxH={860} r={-1.5} dur={dur} entra={e} brillo={brillo} />;
  } else if (it.tipo === 'trio') {
    contenido = it.fotos.map(([n, w, h], i) => <Marco key={n} src={foto(it.fac, n)} w={w} h={h} x={360 + i * 600} y={H / 2 + (i === 1 ? -20 : 20)} maxW={540} maxH={760} r={[-4, 2, 5][i]} at={b(i)} dur={dur} entra={e} lado={i % 2 ? -1 : 1} brillo={brillo} />);
  } else if (it.tipo === 'quad') {
    const pos = [
      [600, 290],
      [1320, 300],
      [620, 790],
      [1300, 780],
    ];
    contenido = it.fotos.map(([n, w, h], i) => <Marco key={n} src={foto(it.fac, n)} w={w} h={h} x={pos[i][0]} y={pos[i][1]} maxW={760} maxH={470} r={[-3, 3, 2, -2][i]} at={b(i * 0.75)} dur={dur} entra={e} lado={i % 2 ? -1 : 1} brillo={brillo} />);
  } else {
    const ent = tw(f, [0, 10], [0, 1], ease.out);
    const v = TIRAS[Math.max(0, tira) % TIRAS.length];
    contenido = (
      <AbsoluteFill style={{opacity: ent, transform: `scale(${1.08 - 0.08 * ent})`}}>
        {v.eco !== undefined && (
          <AbsoluteFill style={{opacity: 0.5, filter: 'blur(3px) brightness(0.8)'}}>
            <Pelicula fac={it.fac} fotos={[...it.fotos].reverse().concat(it.fotos)} dur={dur} dir={-v.dir} y={v.eco} rot={-v.rot * 0.6} escala={0.42} desde={-1400} hasta={-3400} />
          </AbsoluteFill>
        )}
        <Pelicula fac={it.fac} fotos={it.fotos} dur={dur} dir={v.dir} y={v.y} rot={v.rot} escala={v.escala} />
      </AbsoluteFill>
    );
  }
  // salidas
  let salida: React.CSSProperties = {opacity: 1 - s};
  if (est.sale === 'barrido') salida = {transform: `translateX(${-s * 1700}px)`, filter: `blur(${s * 22}px)`};
  if (est.sale === 'atraviesa') salida = {transform: `scale(${1 + s * 1.6})`, filter: `blur(${s * 16}px)`, opacity: 1 - s * 0.9};
  return (
    <AbsoluteFill>
      <AbsoluteFill style={salida}>
        <AbsoluteFill style={{opacity: 0.35}}>
          <Img src={foto(it.fac, p0[0])} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(40px) brightness(0.6)', transform: 'scale(1.2)'}} />
        </AbsoluteFill>
        <AbsoluteFill>{contenido}</AbsoluteFill>
      </AbsoluteFill>
      {/* destello de luz cálida al salir en las partes tranquilas */}
      {est.sale === 'luz' && (
        <AbsoluteFill style={{background: `radial-gradient(ellipse at ${20 + s * 70}% 40%, rgba(255,222,165,${Math.sin(s * Math.PI)}) 0%, rgba(255,150,70,${0.6 * Math.sin(s * Math.PI)}) 40%, rgba(255,150,70,0) 70%)`, mixBlendMode: 'screen'}} />
      )}
      <AbsoluteFill style={{background: '#fff', opacity: golpe}} />
      {est.sale === 'barrido' && <Sfx at={dur - SAL} name="whoosh" volume={0.18} />}
    </AbsoluteFill>
  );
};

const Dorado: React.FC<{children: React.ReactNode; size: number; spacing?: number; style?: React.CSSProperties}> = ({children, size, spacing = 8, style}) => (
  <span style={{fontFamily: F.clasica, fontWeight: 700, fontSize: size, letterSpacing: spacing, backgroundImage: ORO_GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', ...style}}>{children}</span>
);

const Portada: React.FC<{it: Extract<Item, {k: 'portada'}>}> = ({it}) => {
  const f = useCurrentFrame();
  const dur = Math.round(it.beats * BEAT);
  const linea = tw(f, [0, 16], [0, 1], ease.inOut);
  const t = tw(f, [6, 22], [0, 1]);
  const sale = tw(f, [dur - 8, dur], [0, 1], ease.in);
  return (
    <AbsoluteFill style={{opacity: 1 - sale, transform: `scale(${1 + sale * 0.06})`}}>
      <div style={{position: 'absolute', top: 360, width: '100%', textAlign: 'center'}}>
        <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 30, letterSpacing: 14, color: CREMA, opacity: t}}>FACULTAD DE</div>
        <div style={{width: 520 * linea, height: 2, background: ORO, margin: '22px auto'}} />
        <div style={{opacity: t, filter: `blur(${(1 - t) * 10}px)`, transform: `translateY(${(1 - t) * 20}px)`, padding: '0 120px'}}>
          <Dorado size={it.nombre.length > 24 ? 84 : 120} spacing={4}>
            {it.nombre.toUpperCase()}
          </Dorado>
        </div>
        <div style={{width: 520 * linea, height: 2, background: ORO, margin: '28px auto 0'}} />
      </div>
    </AbsoluteFill>
  );
};

const Frase: React.FC<{arriba: string; grande: string; dur: number}> = ({arriba, grande, dur}) => {
  const f = useCurrentFrame();
  const a = tw(f, [4, 22], [0, 1]);
  const b = tw(f, [26, 46], [0, 1]);
  const sale = tw(f, [dur - 14, dur], [0, 1]);
  return (
    <AbsoluteFill style={{background: '#000', opacity: 1 - sale}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(217,183,106,0.12) 0%, rgba(0,0,0,0) 55%)'}} />
      <div style={{position: 'absolute', top: 380, left: 140, right: 140, textAlign: 'center'}}>
        <div style={{fontFamily: F.sans, fontWeight: 500, fontSize: 50, letterSpacing: 12, color: CREMA, textTransform: 'uppercase', opacity: a, filter: `blur(${(1 - a) * 8}px)`}}>{arriba}</div>
        <div style={{marginTop: 26, fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 120, lineHeight: 1.15, color: ORO, opacity: b, filter: `blur(${(1 - b) * 8}px)`, transform: `translateY(${(1 - b) * 16}px)`}}>{grande}</div>
      </div>
    </AbsoluteFill>
  );
};

/** Intro: frases en negro y el logo; termina justo en la entrada del coro */
const FRASES_INTRO: {at: number; to: number; arriba: string; grande: string}[] = [
  {at: 1.0, to: 7.4, arriba: 'Un día llegaste con una mochila', grande: 'llena de dudas…'},
  {at: 7.8, to: 14.2, arriba: 'y hoy te vas con una', grande: 'llena de historias.'},
  {at: 14.6, to: 21.0, arriba: 'Cada desvelo, cada clase, cada amistad', grande: 'te trajo hasta aquí.'},
];
const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const logoAt = Math.round(21.4 * 30);
  const logo = tw(f, [logoAt, logoAt + 30], [0, 1]);
  const gen = tw(f, [logoAt + 30, logoAt + 54], [0, 1]);
  const sale = tw(f, [INICIO - 10, INICIO], [0, 1], ease.in);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {FRASES_INTRO.map((p) => (
        <Sequence key={p.at} from={Math.round(p.at * 30)} durationInFrames={Math.round((p.to - p.at) * 30)}>
          <Frase arriba={p.arriba} grande={p.grande} dur={Math.round((p.to - p.at) * 30)} />
        </Sequence>
      ))}
      <AbsoluteFill style={{opacity: logo * (1 - sale)}}>
        <Fondo />
        <div style={{position: 'absolute', left: W / 2 - 330, top: 300, width: 660, clipPath: `inset(0 0 ${(1 - logo) * 100}% 0)`}}>
          <Img src={staticFile('logos/logo_westhill_blanco_total.png')} style={{width: '100%'}} />
        </div>
        <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', opacity: gen, transform: `translateY(${(1 - gen) * 16}px)`}}>
          <div style={{width: 460, height: 2, background: ORO, margin: '0 auto 24px'}} />
          <Dorado size={64} spacing={16}>
            GENERACIÓN 2026
          </Dorado>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#fff', opacity: interpolate(f, [INICIO - 3, INICIO, INICIO + 8], [0, 0.7, 0], clamp)}} />
    </AbsoluteFill>
  );
};

/**
 * Fuegos artificiales: un cohete sube y estalla en estelas doradas, blancas o azul claro que caen con la gravedad.
 * Las explosiones caen en los tiempos de la canción mientras sigue el drop; al aparecer el logo, una "palmera" dorada
 * lenta que gotea luz detrás de él.
 */
type Estallido = {at: number; x: number; y: number; r: number; n: number; vida: number; col: string[]; palmera?: boolean};
const COLOR_FUEGO = {
  oro: ['#FFE3A3', '#E9C27A'],
  blanco: ['#FFFFFF', '#FFF1D2'],
  champan: ['#F6E3B0', '#FFFFFF'],
  azul: ['#B7DCFF', '#FFFFFF'],
};
const SUBE = 22;
const Fuego: React.FC<{e: Estallido; id: number}> = ({e, id}) => {
  const f = useCurrentFrame();
  const t = f - e.at;
  if (t < -SUBE || t > e.vida) return null;
  if (t < 0) {
    // cohete subiendo
    const k = (t + SUBE) / SUBE;
    const c = 1 - Math.pow(1 - k, 2);
    const x0 = e.x + (id % 2 ? 70 : -70);
    const x = x0 + (e.x - x0) * c;
    const y = H + 40 + (e.y - H - 40) * c;
    const ang = (Math.atan2(e.y - H - 40, e.x - x0) * 180) / Math.PI;
    return (
      <div style={{position: 'absolute', left: x, top: y, width: 110 * (1 - k * 0.6), height: 4, borderRadius: 2, transformOrigin: '0 50%', transform: `rotate(${ang + 180}deg)`, background: 'linear-gradient(90deg, rgba(255,244,214,1) 0%, rgba(255,196,110,0.5) 40%, rgba(255,196,110,0) 100%)'}} />
    );
  }
  const g = e.palmera ? 300 : 110;
  const expande = e.vida * (e.palmera ? 0.4 : 0.5);
  const pos = (i: number, tt: number): [number, number] => {
    const ang = (i / e.n) * Math.PI * 2 + (random(`a${id}-${i}`) - 0.5) * 0.3;
    const vel = e.r * (0.62 + 0.38 * random(`v${id}-${i}`));
    const d = vel * (1 - Math.pow(1 - Math.min(1, tt / expande), 3));
    const u = tt / e.vida;
    return [e.x + Math.cos(ang) * d, e.y + Math.sin(ang) * d + g * u * u];
  };
  const u = t / e.vida;
  const flash = interpolate(t, [0, 2, 12], [0, 0.55, 0], clamp);
  return (
    <>
      <div style={{position: 'absolute', left: e.x - e.r * 0.6, top: e.y - e.r * 0.6, width: e.r * 1.2, height: e.r * 1.2, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,240,205,0.9) 0%, rgba(255,200,120,0.35) 30%, rgba(255,200,120,0) 70%)', opacity: flash}} />
      {Array.from({length: e.n}, (_, i) => {
        const [hx, hy] = pos(i, t);
        const [cx, cy] = pos(i, Math.max(0, t - (e.palmera ? 12 : 8)));
        const largo = Math.hypot(hx - cx, hy - cy);
        const ang = (Math.atan2(hy - cy, hx - cx) * 180) / Math.PI;
        const titila = u > 0.5 ? 0.55 + 0.45 * Math.abs(Math.sin(t * 0.9 + i * 1.7)) : 1;
        const op = interpolate(u, [0, 0.55, 1], [1, 1, 0], clamp) * titila;
        const col = e.col[i % e.col.length];
        return (
          <div key={i} style={{position: 'absolute', left: cx, top: cy - 1.5, width: largo + 4, height: e.palmera ? 3 : 3.5, borderRadius: 2, transformOrigin: '0 50%', transform: `rotate(${ang}deg)`, opacity: op, background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, ${col} 85%, #FFFFFF 100%)`}} />
        );
      })}
    </>
  );
};
// final: un cohete sube, estalla y sus chispas forman el logo; luego el logo real aparece encima, suave
const COHETE_F = CIERRE_F - 330;
const EXPLOTA_F = COHETE_F + 30;
const FORMA_F = EXPLOTA_F + 118; // las chispas ya dibujan el logo; de aquí se funde con el logo real
const ESTALLIDOS: Estallido[] = (() => {
  const r: Estallido[] = [];
  const puntos: [number, number][] = [
    [340, 210],
    [1580, 190],
    [700, 120],
    [1240, 130],
    [170, 640],
    [1750, 620],
    [960, 110],
    [1480, 230],
    [450, 160],
  ];
  const pal = [COLOR_FUEGO.oro, COLOR_FUEGO.blanco, COLOR_FUEGO.champan, COLOR_FUEGO.azul];
  let j = 0;
  for (let k = 2; Math.round(k * BEAT) < COHETE_F - 40; k += 2) {
    const [x, y] = puntos[j % puntos.length];
    r.push({at: Math.round(k * BEAT), x, y, r: 300 + (j % 3) * 55, n: 76, vida: 58, col: pal[j % pal.length]});
    // cada 4 compases, doble
    if (k % 8 === 0) r.push({at: Math.round(k * BEAT) + 3, x: W - x, y: y + 40, r: 260, n: 64, vida: 54, col: pal[(j + 2) % pal.length]});
    j += 1;
  }
  // ya con el logo: fuegos alrededor, sin tocarlo
  const alrededor: [number, number][] = [
    [330, 280],
    [1590, 250],
    [240, 600],
    [1690, 580],
    [600, 150],
    [1330, 140],
    [360, 330],
    [1560, 330],
  ];
  const pal2 = [COLOR_FUEGO.oro, COLOR_FUEGO.champan, COLOR_FUEGO.blanco, COLOR_FUEGO.oro];
  alrededor.forEach(([x, y], i) => r.push({at: FORMA_F + 6 + i * 22, x, y, r: 250 + (i % 2) * 40, n: 64, vida: 96, col: pal2[i % pal2.length], palmera: true}));
  return r;
})();
const Fuegos: React.FC = () => (
  <AbsoluteFill style={{mixBlendMode: 'screen', filter: 'drop-shadow(0 0 6px rgba(255,214,150,0.9))'}}>
    {ESTALLIDOS.map((e, i) => (
      <Fuego key={i} e={e} id={i} />
    ))}
  </AbsoluteFill>
);

/**
 * Fuego artificial que forma el logo: el cohete sube al centro, estalla y cada chispa, después de salir volando,
 * cae hacia un punto del logo dejando su estela (puntos en gradLogoPuntos.ts). Ya formado, titila y se funde con
 * el logo real; unas cuantas chispas se quedan brillando un poco más.
 */
const LOGO_W = 660;
const LOGO_X = W / 2 - LOGO_W / 2;
const LOGO_Y = 330;
const LOGO_K = LOGO_W / LOGO_PNG.w;
const CENTRO_LOGO = {x: W / 2, y: LOGO_Y + (LOGO_PNG.h * LOGO_K) / 2};
const CHISPA_COL = ['255,236,190', '255,255,255', '246,214,140', '255,246,222'];
const CHISPAS = Array.from({length: LOGO_PUNTOS.length / 2}, (_, i) => ({
  tx: LOGO_X + LOGO_PUNTOS[2 * i] * LOGO_K,
  ty: LOGO_Y + LOGO_PUNTOS[2 * i + 1] * LOGO_K,
  ang: random(`la${i}`) * Math.PI * 2,
  vel: 220 + 480 * Math.sqrt(random(`lv${i}`)),
  espera: 26 + 20 * random(`le${i}`),
  viaje: 46 + 24 * random(`lj${i}`),
  fase: random(`lf${i}`) * Math.PI * 2,
  col: CHISPA_COL[i % CHISPA_COL.length],
  queda: i % 7 === 0,
}));
const posChispa = (c: (typeof CHISPAS)[number], t: number): [number, number, number] => {
  const e = 1 - Math.pow(1 - Math.min(1, Math.max(0, t) / 24), 3);
  const libre = Math.max(0, t) / 40;
  const ex = CENTRO_LOGO.x + Math.cos(c.ang) * c.vel * e;
  const ey = CENTRO_LOGO.y + Math.sin(c.ang) * c.vel * e + 70 * libre * libre;
  const k = Math.min(1, Math.max(0, (t - c.espera) / c.viaje));
  const s = k * k * (3 - 2 * k);
  return [ex + (c.tx - ex) * s, ey + (c.ty - ey) * s, k];
};
const LogoFuego: React.FC = () => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const t = f - EXPLOTA_F;
  const funde = tw(f, [FORMA_F, FORMA_F + 50], [0, 1], ease.inOut);
  const resto = 1 - tw(f, [FORMA_F + 30, FORMA_F + 130], [0, 1]);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    if (t < 0) {
      // cohete subiendo con chispas que se le desprenden
      const k = (t + 30) / 30;
      const pos = (kk: number): [number, number] => {
        const c = 1 - Math.pow(1 - Math.max(0, kk), 2);
        return [CENTRO_LOGO.x + 40 * (1 - c), H + 40 + (CENTRO_LOGO.y - H - 40) * c];
      };
      const [hx, hy] = pos(k);
      const [cx, cy] = pos(k - 0.22);
      const g = ctx.createLinearGradient(cx, cy, hx, hy);
      g.addColorStop(0, 'rgba(255,200,120,0)');
      g.addColorStop(1, 'rgba(255,246,222,1)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(hx, hy);
      ctx.stroke();
      for (let j = 0; j < 10; j++) {
        const kk = k - j * 0.025;
        const [sx, sy] = pos(kk);
        ctx.fillStyle = `rgba(255,214,150,${0.6 * (1 - j / 10)})`;
        ctx.beginPath();
        ctx.arc(sx + (random(`rs${j}${f}`) - 0.5) * 10, sy + j * 2, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    // destello del estallido
    const fl = interpolate(t, [0, 2, 14], [0, 0.8, 0], clamp);
    if (fl > 0) {
      const g = ctx.createRadialGradient(CENTRO_LOGO.x, CENTRO_LOGO.y, 0, CENTRO_LOGO.x, CENTRO_LOGO.y, 320);
      g.addColorStop(0, `rgba(255,240,205,${fl})`);
      g.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = g;
      ctx.fillRect(CENTRO_LOGO.x - 320, CENTRO_LOGO.y - 320, 640, 640);
    }
    for (const c of CHISPAS) {
      const [hx, hy, k] = posChispa(c, t);
      const [cx, cy] = posChispa(c, t - (k < 1 ? 5 : 1));
      const titila = k >= 1 ? 0.7 + 0.3 * Math.sin(f * 0.35 + c.fase) : 1;
      const vivo = c.queda ? Math.max(1 - funde, resto * 0.8) : 1 - funde;
      const a = Math.min(1, t / 3) * titila * vivo;
      if (a <= 0.01) continue;
      ctx.strokeStyle = `rgba(${c.col},${a * (k < 1 ? 0.55 : 0.5)})`;
      ctx.lineWidth = k < 1 ? 1.5 : 1.6;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(hx + 0.01, hy);
      ctx.stroke();
      ctx.fillStyle = `rgba(${c.col},${a})`;
      ctx.beginPath();
      ctx.arc(hx, hy, k < 1 ? 1.9 : 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [f, t, funde, resto]);
  if (t < -30 || f > FORMA_F + 140) return null;
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, filter: 'drop-shadow(0 0 5px rgba(255,214,150,0.85))'}} />;
};

/**
 * Huellas de caracal (West): dos caminos entran desde las esquinas de abajo, un paso por tiempo de la canción,
 * alternando pata izquierda y derecha, y se encuentran en el centro: ahí se estampa una huella grande, justo cuando
 * la palabra "huella" se enciende. Cada paso se marca con un brillo dorado, una onda y chispas, y queda encendido.
 */
const HUELLA_ORO = staticFile('logos/huella_caracal_oro.png');
const HUELLA_LUZ = staticFile('logos/huella_caracal.png');
const PASOS = 8;
const HUELLA_GRANDE = PASOS + 1; // tiempo (desde el primer paso) en que cae la huella grande
type Pisada = {x: number; y: number; rot: number; at: number; S: number; k: number};
const pisadas = (desde: number): Pisada[] => {
  const r: Pisada[] = [];
  [-1, 1].forEach((lado) => {
    // curva de la esquina inferior hacia el centro (bezier cuadrática)
    const p0 = [W / 2 + lado * 1010, 1050];
    const c = [W / 2 + lado * 560, 1010];
    const p1 = [W / 2 + lado * 150, 885];
    for (let k = 0; k < PASOS; k++) {
      const u = (k + 0.5) / PASOS;
      const bx = (1 - u) * (1 - u) * p0[0] + 2 * u * (1 - u) * c[0] + u * u * p1[0];
      const by = (1 - u) * (1 - u) * p0[1] + 2 * u * (1 - u) * c[1] + u * u * p1[1];
      const dx = 2 * (1 - u) * (c[0] - p0[0]) + 2 * u * (p1[0] - c[0]);
      const dy = 2 * (1 - u) * (c[1] - p0[1]) + 2 * u * (p1[1] - c[1]);
      const ang = Math.atan2(dy, dx);
      const pie = k % 2 ? 1 : -1;
      r.push({x: bx - Math.sin(ang) * 24 * pie, y: by + Math.cos(ang) * 24 * pie, rot: (ang * 180) / Math.PI + 90 + pie * 6, at: desde + Math.round(k * BEAT), S: 70, k: k + (lado > 0 ? 50 : 0)});
    }
  });
  r.push({x: W / 2, y: 868, rot: 0, at: desde + Math.round(HUELLA_GRANDE * BEAT), S: 150, k: 99});
  return r;
};
const Huellas: React.FC<{desde: number; atenua: number}> = ({desde, atenua}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {pisadas(desde).map(({x, y, rot, at, S, k}) => {
        const a = f - at;
        if (a < 0) return null;
        const grande = S > 100;
        const e = tw(a, [0, grande ? 18 : 12], [0, 1]);
        const luz = interpolate(a, [0, 3, grande ? 60 : 36], [0, 1, grande ? 0.35 : 0], clamp);
        const onda = tw(a, [0, grande ? 40 : 28], [0, 1]);
        const ondaR = grande ? 240 : 90;
        const brilla = 0.88 + 0.12 * Math.sin(f / 11 + k);
        const chispas = grande ? 16 : 6;
        return (
          <React.Fragment key={k}>
            <div style={{position: 'absolute', left: x - S / 3 - ondaR * onda, top: y - S / 3 - ondaR * onda, width: (2 * S) / 3 + 2 * ondaR * onda, height: (2 * S) / 3 + 2 * ondaR * onda, borderRadius: '50%', border: `${grande ? 3 : 2}px solid #F6E3B0`, opacity: 0.75 * (1 - onda) * atenua}} />
            {Array.from({length: chispas}, (_, c) => {
              const ca = random(`ch${k}-${c}`) * Math.PI * 2;
              const cd = (grande ? 90 : 30) + (grande ? 120 : 40) * random(`cd${k}-${c}`);
              const cv = tw(a, [0, grande ? 34 : 22], [0, 1]);
              return <div key={c} style={{position: 'absolute', left: x + Math.cos(ca) * cd * cv - 2.5, top: y + Math.sin(ca) * cd * cv - 2.5 - 14 * cv, width: 5, height: 5, borderRadius: '50%', background: '#FFF3D0', boxShadow: '0 0 8px #F6E3B0', opacity: (1 - cv) * atenua}} />;
            })}
            <div style={{position: 'absolute', left: x - S / 2, top: y - S / 2, width: S, height: S, opacity: Math.min(1, a / 4) * atenua * brilla, transform: `rotate(${rot}deg) scale(${(grande ? 1.5 : 1.3) - (grande ? 0.5 : 0.3) * e})`, filter: `drop-shadow(0 0 ${6 + (grande ? 26 : 16) * luz}px rgba(255,206,125,${0.5 + 0.45 * luz}))`}}>
              <Img src={HUELLA_ORO} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
              <Img src={HUELLA_LUZ} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.85 * luz}} />
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

/** Cierre: tira de todas las fotos de fondo, "¡Felicidades, Generación 2026!" y el logo */
const TODAS = FACULTADES.flatMap(({key}) => (FOTOS[key] ?? []).map(([n, w, h]) => ({fac: key, n, w, h})));
const HUELLAS_DESDE = 124;
const Cierre: React.FC = () => {
  const f = useCurrentFrame();
  const t1 = tw(f, [10, 36], [0, 1]);
  const t2 = tw(f, [40, 70], [0, 1]);
  const t3 = tw(f, [90, 116], [0, 1]);
  const logo = tw(f, [FORMA_F, FORMA_F + 50], [0, 1], ease.inOut);
  const ocultaTexto = tw(f, [COHETE_F - 6, COHETE_F + 22], [0, 1]);
  const negro = tw(f, [CIERRE_F - 40, CIERRE_F], [0, 1]);
  // la palabra "huella" se enciende cuando cae la huella grande
  const enciende = interpolate(f - (HUELLAS_DESDE + Math.round(HUELLA_GRANDE * BEAT)), [0, 4, 50], [0, 1, 0.35], clamp);
  const filas = [0, 1, 2];
  return (
    <AbsoluteFill style={{background: NAVY, overflow: 'hidden'}}>
      {/* tres tiras de fotos que corren en sentidos opuestos */}
      <AbsoluteFill style={{opacity: 0.32, filter: 'grayscale(0.3)'}}>
        {filas.map((r) => {
          const dir = r % 2 ? 1 : -1;
          const x = (dir * f * 2.2) % 2600;
          return (
            <div key={r} style={{position: 'absolute', top: 40 + r * 350, left: dir > 0 ? x - 2600 : x, display: 'flex', gap: 16}}>
              {Array.from({length: 18}, (_, k) => TODAS[(r * 17 + k * 5) % TODAS.length]).map((p, k) => (
                <Img key={k} src={foto(p.fac, p.n)} style={{width: 300, height: 320, objectFit: 'cover'}} />
              ))}
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(11,27,51,0.92) 0%, rgba(11,27,51,0.7) 45%, rgba(11,27,51,0.35) 100%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(11,27,51,0) 58%, rgba(11,27,51,0.8) 100%)'}} />
      <Fuegos />
      <Huellas desde={HUELLAS_DESDE} atenua={1 - 0.4 * logo} />
      <div style={{position: 'absolute', top: 330, width: '100%', textAlign: 'center', opacity: 1 - ocultaTexto}}>
        <div style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 90, color: CREMA, opacity: t1, filter: `blur(${(1 - t1) * 10}px)`}}>¡Felicidades,</div>
        <div style={{marginTop: 6, transform: `scale(${0.9 + 0.1 * t2})`, opacity: t2, filter: `blur(${(1 - t2) * 10}px)`}}>
          <Dorado size={130} spacing={10}>
            GENERACIÓN 2026!
          </Dorado>
        </div>
        <div style={{marginTop: 40, fontFamily: F.sans, fontWeight: 600, fontSize: 40, letterSpacing: 4, color: CREMA, opacity: t3}}>
          Gracias por dejar <span style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 50, letterSpacing: 1, color: ORO, textShadow: `0 0 ${24 * enciende}px rgba(255,214,140,${enciende})`}}>huella</span> en Westhill.
        </div>
      </div>
      <LogoFuego />
      <div style={{position: 'absolute', left: LOGO_X, top: LOGO_Y, width: LOGO_W, opacity: logo, filter: `drop-shadow(0 0 ${6 + 18 * (1 - logo)}px rgba(255,214,150,${0.35 + 0.4 * (1 - logo)}))`}}>
        <Img src={staticFile('logos/logo_westhill_blanco_total.png')} style={{width: '100%', display: 'block'}} />
      </div>
      <Sfx at={COHETE_F} name="whoosh_largo" volume={0.25} />
      <Sfx at={EXPLOTA_F} name="impact" volume={0.3} />
      <AbsoluteFill style={{background: '#000', opacity: negro}} />
    </AbsoluteFill>
  );
};

export const Graduacion: React.FC<{music?: boolean; voz?: string; vozDur?: number}> = ({music = true, voz, vozDur = 25}) => {
  const vozA = VOZ_DESDE;
  const vozB = VOZ_DESDE + Math.round(vozDur * 30);
  const musica = (fr: number) => {
    const base = interpolate(fr, [0, 20, GRAD_FRAMES - 60, GRAD_FRAMES], [0, 0.85, 0.85, 0], clamp);
    const baja = voz ? interpolate(fr, [vozA - 15, vozA, vozB, vozB + 20], [1, 0.3, 0.3, 1], clamp) : 1;
    return base * baja;
  };
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence durationInFrames={INICIO + 2}>
        <Intro />
      </Sequence>
      <Sequence from={INICIO} durationInFrames={FIN_DESDE - INICIO}>
        <Fondo />
      </Sequence>
      {ITEMS.map((it, i) => {
        const from = beatF(ARRANQUES[i]);
        const dur = beatF(ARRANQUES[i] + it.beats) - from;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            {it.k === 'portada' ? <Portada it={it} /> : it.k === 'frase' ? <Frase arriba={it.arriba} grande={it.grande} dur={dur} /> : <FotosSlot it={it} est={ESTILOS[i]} tira={TIRA_IDX[i]} />}
          </Sequence>
        );
      })}
      <Sequence from={FIN_DESDE} durationInFrames={CIERRE_F}>
        <Cierre />
      </Sequence>
      <Grain opacity={0.035} />
      {music && <Audio src={staticFile('music/happier.mp3')} volume={musica} />}
      {voz && (
        <Sequence from={vozA}>
          <Audio src={staticFile(voz)} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
export const GRAD_W = W;
export const GRAD_H = H;
