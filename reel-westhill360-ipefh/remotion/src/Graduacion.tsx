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
//  1. Intro (0–28 s): frases con tipografía cinética sobre negro con polvo dorado y el logo con rayos de luz.
//  2. Desde el coro (28.08 s) las fotos por facultad: portada animada de la facultad (marco que se dibuja, número
//     fantasma, mosaico de fondo) y luego espacios de 4 tiempos (2.4 s) que alternan foto sola, trío, rollo de
//     película y collage de 4. Entre secciones cruza una cortina de barras doradas.
//  3. Un interludio con frase y el cierre: "¡Felicidades, Generación 2026!", huellas de caracal, pirotecnia en
//     canvas (peonías, crisantemos, sauces, anillos, palmas, fuentes) y un cohete cuyas chispas forman el logo.
// Reglas de estilo acordadas con el cliente: sin latidos, rebotes ni sacudidas; el brillo solo en pocas fotos.
// Preparado para voz en off: la prop `voz` (archivo en public/) entra en VOZ_DESDE y baja la música mientras suena.
// Una facultad sin fotos (Derecho, por ahora) no aparece; al agregar sus fotos a gradFotos.ts entra sola.
// ---------------------------------------------------------------------------
const W = 1920;
const H = 1080;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const BEAT = 0.5986 * 30; // cuadros por tiempo
const CORO = 28.08; // entrada del coro en la canción
const FIN_VIDEO = 221.5; // la canción se apaga entre 218.5 y 221 s
const NAVY = '#0B1B33';
const ORO = '#D9B76A';
const ORO_GRAD = 'linear-gradient(180deg, #F6E3B0 0%, #D9B76A 55%, #A97B35 100%)';
const CREMA = '#F4EEE2';
const LOGO = staticFile('logos/logo_westhill_blanco_total.png');
/** azar determinista y rápido (para miles de partículas por cuadro) */
const hh = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const c01 = (x: number) => Math.max(0, Math.min(1, x));

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
export const CIERRE_F = Math.round(FIN_VIDEO * 30) - FIN_DESDE; // el cierre dura lo necesario para terminar con la canción
export const GRAD_FRAMES = FIN_DESDE + CIERRE_F;
/** voz en off opcional: entra aquí (segundo 1 del video) */
export const VOZ_DESDE = 30;

// ---------------------------------------------------------------------------
// Sincronía con la canción: tramos con bajo fuerte ("drops") y golpes donde arranca cada uno.
// En los drops las fotos cambian con barridos, zoom a través, barrido vertical o giro 3D; en las partes
// tranquilas se revelan, suben o se enfocan y salen con luz cálida, fundido o desenfoque.
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
type Entra = 'sube' | 'zoom' | 'baja' | 'enfoca' | 'lado' | 'revela' | 'abajo' | 'giro';
type Sale = 'fade' | 'barrido' | 'atraviesa' | 'luz' | 'vertical' | 'giro' | 'desenfoca';
type Estilo = {entra: Entra; sale: Sale; drop: boolean; golpe: boolean; brillo: boolean};
const SALE_DROP: Sale[] = ['barrido', 'atraviesa', 'vertical', 'giro'];
const SALE_CALMA: Sale[] = ['luz', 'fade', 'desenfoca'];
const ENTRA_CALMA: Entra[] = ['revela', 'sube', 'enfoca'];
const ENTRA_TRAS: Partial<Record<Sale, Entra>> = {barrido: 'lado', atraviesa: 'zoom', vertical: 'abajo', giro: 'giro'};
/** estilo de cada espacio de fotos según dónde cae en la canción; la entrada combina con la salida anterior */
const ESTILOS: Estilo[] = (() => {
  const r: Estilo[] = [];
  let prev: Sale = 'fade';
  let nd = 0;
  let nc = 0;
  let sueltas = 0; // fotos solas en drops: solo una de cada tres lleva el brillo
  ITEMS.forEach((it, i) => {
    const t = beatF(ARRANQUES[i]) / 30;
    const drop = enDrop(t);
    const golpe = esGolpe(t);
    let sale: Sale;
    let entra: Entra;
    if (drop) {
      sale = SALE_DROP[nd % SALE_DROP.length];
      entra = ENTRA_TRAS[prev] ?? (golpe ? 'enfoca' : 'baja');
      nd += 1;
    } else {
      sale = SALE_CALMA[nc % SALE_CALMA.length];
      entra = ENTRA_CALMA[nc % ENTRA_CALMA.length];
      nc += 1;
    }
    const brillo = drop && it.k === 'fotos' && it.tipo === 'single' && sueltas++ % 3 === 0;
    r.push({entra, sale, drop, golpe, brillo});
    prev = it.k === 'fotos' ? sale : 'fade';
  });
  return r;
})();
/** número de tira de película (para alternar su sentido y altura) */
const TIRA_IDX: number[] = (() => {
  let n = 0;
  return ITEMS.map((it) => (it.k === 'fotos' && it.tipo === 'strip' ? n++ : -1));
})();

// ---------------------------------------------------------------------------
// Piezas de ambiente: rayos de luz, bokeh con profundidad, polvo dorado, destellos
// ---------------------------------------------------------------------------
/** Rayos de luz que salen de un punto y giran despacio */
const Rayos: React.FC<{x: number; y: number; giro: number; op: number; radio?: number}> = ({x, y, giro, op, radio = 1400}) => {
  const mascara = 'radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 32%, rgba(0,0,0,0) 70%)';
  return (
    <div
      style={{
        position: 'absolute',
        left: x - radio,
        top: y - radio,
        width: 2 * radio,
        height: 2 * radio,
        borderRadius: '50%',
        opacity: op,
        mixBlendMode: 'screen',
        background: `repeating-conic-gradient(from ${giro}deg, rgba(255,222,160,0) 0deg, rgba(255,222,160,0.55) 3deg, rgba(255,222,160,0) 8deg, rgba(255,222,160,0) 14deg, rgba(255,240,210,0.35) 16.5deg, rgba(255,222,160,0) 21deg, rgba(255,222,160,0) 30deg)`,
        WebkitMaskImage: mascara,
        maskImage: mascara,
      }}
    />
  );
};

const BOKEH = Array.from({length: 46}, (_, i) => {
  const grande = i % 6 === 0;
  return {x: hh(i * 3.1) * W, y: hh(i * 7.7) * (H + 240), s: grande ? 110 + hh(i) * 150 : 8 + hh(i * 1.9) * 24, v: grande ? 0.12 + hh(i * 5.3) * 0.2 : 0.2 + hh(i * 5.3) * 0.55, o: grande ? 0.05 + hh(i * 2.2) * 0.06 : 0.12 + hh(i * 4.1) * 0.22, col: i % 5 === 0 ? '120,180,255' : '217,183,106'};
});
/** Fondo azul marino con rayos desde arriba y bokeh dorado en tres profundidades */
const Fondo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: NAVY, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 35%, rgba(39,99,154,0.6) 0%, rgba(11,27,51,0) 65%)'}} />
      <Rayos x={W / 2} y={-260} giro={f * 0.06} op={0.2} radio={1700} />
      {BOKEH.map((b, i) => {
        const x = b.x + Math.sin(f / 70 + i) * 26;
        const y = ((((b.y - f * b.v) % (H + 240)) + (H + 240)) % (H + 240)) - 120;
        return <div key={i} style={{position: 'absolute', left: x - b.s / 2, top: y - b.s / 2, width: b.s, height: b.s, borderRadius: '50%', background: `radial-gradient(circle, rgba(${b.col},1) 0%, rgba(${b.col},0.5) 35%, rgba(${b.col},0) 70%)`, opacity: b.o}} />;
      })}
    </AbsoluteFill>
  );
};

/** Polvo dorado fino que sube y titila (para fondos negros) */
const PolvoOro: React.FC<{n?: number; op?: number}> = ({n = 44, op = 1}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {Array.from({length: n}, (_, i) => {
        const x = hh(i * 2.3) * W + Math.sin(f / 50 + i) * 22;
        const alto = H + 60;
        const y = ((((hh(i * 5.1) * alto - f * (0.2 + hh(i) * 0.55)) % alto) + alto) % alto) - 30;
        const s = 2 + hh(i * 7) * 4;
        const titila = 0.3 + 0.7 * Math.abs(Math.sin(f / 22 + i * 1.7));
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: '#F6E3B0', opacity: titila * 0.5 * op, boxShadow: '0 0 6px rgba(246,227,176,0.8)'}} />;
      })}
    </AbsoluteFill>
  );
};

/** Bokeh grande y suave que pasa por delante de todo (profundidad) */
const PrimerPlano: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none'}}>
      {Array.from({length: 9}, (_, i) => {
        const s = 220 + hh(i * 3.7) * 320;
        const ancho = W + 800;
        const x = ((((hh(i * 9.1) * ancho + f * (0.5 + hh(i * 2.9) * 0.9) * (i % 2 ? 1 : -1)) % ancho) + ancho) % ancho) - 400;
        const y = hh(i * 4.3) * H + Math.sin(f / 90 + i * 2) * 40;
        const col = i % 3 === 0 ? '140,190,255' : '255,214,150';
        return <div key={i} style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: '50%', background: `radial-gradient(circle, rgba(${col},0.16) 0%, rgba(${col},0.07) 45%, rgba(${col},0) 70%)`}} />;
      })}
    </AbsoluteFill>
  );
};

/** Destello de cuatro puntas que aparece y se apaga girando */
const Destello: React.FC<{at: number; x: number; y: number; s?: number; col?: string}> = ({at, x, y, s = 44, col = '#FFF6DC'}) => {
  const f = useCurrentFrame();
  const a = f - at;
  if (a < 0 || a > 20) return null;
  const p = Math.sin((a / 20) * Math.PI);
  return (
    <svg viewBox="-10 -10 20 20" style={{position: 'absolute', left: x - s, top: y - s, width: 2 * s, height: 2 * s, transform: `scale(${p}) rotate(${a * 3}deg)`, opacity: p, filter: 'drop-shadow(0 0 8px rgba(255,220,150,0.95))'}}>
      <path d="M0,-10 C0.8,-2.4 2.4,-0.8 10,0 C2.4,0.8 0.8,2.4 0,10 C-0.8,2.4 -2.4,0.8 -10,0 C-2.4,-0.8 -0.8,-2.4 0,-10 Z" fill={col} />
    </svg>
  );
};

/** Ráfaga de líneas doradas y un anillo que se abren desde el centro (arranque de cada drop) */
const Rafaga: React.FC = () => {
  const f = useCurrentFrame();
  if (f > 30) return null;
  const p = tw(f, [0, 30], [0, 1]);
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen'}}>
      {Array.from({length: 34}, (_, i) => {
        const ang = (i / 34) * 360 + hh(i) * 9;
        const dist = 200 + p * (650 + hh(i * 2) * 520);
        const largo = (110 + hh(i * 3) * 190) * (1 - p * 0.5);
        return <div key={i} style={{position: 'absolute', left: W / 2, top: H / 2, width: largo, height: 3, borderRadius: 2, transformOrigin: '0 50%', transform: `rotate(${ang}deg) translateX(${dist}px)`, background: 'linear-gradient(90deg, rgba(255,230,180,0), rgba(255,242,210,0.95))', opacity: (1 - p) * 0.85}} />;
      })}
      <div style={{position: 'absolute', left: W / 2 - 120 - p * 900, top: H / 2 - 120 - p * 900, width: 240 + p * 1800, height: 240 + p * 1800, borderRadius: '50%', border: `${4 - 3 * p}px solid #F6E3B0`, opacity: (1 - p) * 0.55}} />
    </AbsoluteFill>
  );
};

/** Texto dorado; `luz` (0 a 1) pasa un brillo de izquierda a derecha sobre las letras */
const Dorado: React.FC<{children: React.ReactNode; size: number; spacing?: number; style?: React.CSSProperties; luz?: number}> = ({children, size, spacing = 8, style, luz}) => {
  const conLuz = luz !== undefined && luz > 0 && luz < 1;
  return (
    <span
      style={{
        fontFamily: F.clasica,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: spacing,
        backgroundImage: conLuz ? `linear-gradient(105deg, rgba(255,255,255,0) 43%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 57%), ${ORO_GRAD}` : ORO_GRAD,
        backgroundSize: conLuz ? '300% 100%, 100% 100%' : undefined,
        backgroundPosition: conLuz ? `${(1 - luz) * 100}% 0, 0 0` : undefined,
        backgroundRepeat: 'no-repeat',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        ...style,
      }}
    >
      {children}
    </span>
  );
};

/** Tipografía cinética: cada palabra sube desde su propia máscara, una tras otra */
const Palabras: React.FC<{texto: string; at: number; paso?: number; dur?: number}> = ({texto, at, paso = 3, dur = 16}) => {
  const f = useCurrentFrame();
  return (
    <>
      {texto.split(' ').map((w, i) => {
        const p = tw(f, [at + i * paso, at + i * paso + dur], [0, 1]);
        return (
          <span key={i} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', padding: '0.12em 0.14em 0.24em', margin: '-0.12em -0.02em -0.24em'}}>
            <span style={{display: 'inline-block', transform: `translateY(${(1 - p) * 115}%)`, opacity: Math.min(1, p * 2.5), filter: p < 1 ? `blur(${(1 - p) * 4}px)` : undefined}}>{w}</span>
          </span>
        );
      })}
    </>
  );
};

/** Logo blanco con halo dorado; `barrido` (0 a 1) pasa una franja de luz sobre él */
const LogoBlanco: React.FC<{x: number; y: number; w: number; op: number; escala?: number; desenfoque?: number; halo?: number; barrido?: number}> = ({x, y, w, op, escala = 1, desenfoque = 0, halo = 8, barrido}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, opacity: op, transform: `scale(${escala})`, filter: `${desenfoque > 0.2 ? `blur(${desenfoque}px) ` : ''}drop-shadow(0 0 ${halo}px rgba(255,214,150,0.55))`}}>
    <Img src={LOGO} style={{width: '100%', display: 'block', opacity: 0.94}} />
    {barrido !== undefined && barrido > -0.15 && barrido < 1.15 && (
      <Img src={LOGO} style={{position: 'absolute', left: 0, top: 0, width: '100%', clipPath: `polygon(${(barrido - 0.07) * 100}% 0, ${(barrido + 0.07) * 100}% 0, ${(barrido + 0.01) * 100}% 100%, ${(barrido - 0.13) * 100}% 100%)`, filter: 'brightness(1.8) drop-shadow(0 0 5px rgba(255,255,255,0.9))'}} />
    )}
  </div>
);

/** Cortina de barras diagonales (azul, oro, crema, azul) que cruza la pantalla entre secciones */
const BARRAS_F = 26;
const BARRAS_CORTE = 10; // cuadro, dentro de la cortina, en que la pantalla queda tapada
const Barras: React.FC<{dir?: number}> = ({dir = 1}) => {
  const f = useCurrentFrame();
  const col = ['#060F1E', 'linear-gradient(180deg, #F6E3B0 0%, #D9B76A 55%, #A97B35 100%)', CREMA, NAVY];
  return (
    <AbsoluteFill style={{overflow: 'hidden', transform: dir < 0 ? 'scaleX(-1)' : undefined}}>
      {col.map((c, k) => {
        const p = tw(f, [k * 2, 15 + k * 2], [0, 1], ease.inOut);
        return <div key={k} style={{position: 'absolute', top: -120, height: H + 240, left: -5800 + p * (5800 + W + 700), width: 5200, transform: 'skewX(-18deg)', background: c}} />;
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Fotos
// ---------------------------------------------------------------------------
/**
 * Foto con marco blanco y sombra. Adentro la foto se acerca despacio (Ken Burns), flota apenas y, en pocas
 * fotos de los drops, un brillo de luz la cruza. La entrada cambia según el momento de la canción.
 */
const Marco: React.FC<{src: string; w: number; h: number; x: number; y: number; maxW: number; maxH: number; r?: number; at?: number; dur: number; entra: Entra; lado?: number; brillo?: number; fase?: number}> = ({src, w, h, x, y, maxW, maxH, r = 0, at = 0, dur, entra, lado = 1, brillo, fase = 0}) => {
  const f = useCurrentFrame();
  const s = Math.min(maxW / w, maxH / h);
  const fw = w * s;
  const fh = h * s;
  const suave = entra === 'baja' || entra === 'enfoca' || entra === 'giro';
  const p = tw(f, [at, at + (suave ? 18 : 12)], [0, 1], ease.out);
  const q = 1 - p;
  const avance = interpolate(f, [at, at + dur], [0, 1], clamp);
  const deriva = 1 + 0.025 * avance;
  let t = '';
  let filtro = 'none';
  let op = Math.min(1, p * 1.5);
  if (entra === 'sube') t = `translateY(${q * 60}px) rotateX(${q * -10}deg) scale(${0.92 + 0.08 * p})`;
  if (entra === 'zoom') {
    t = `scale(${1 + q * 0.45})`;
    filtro = `blur(${q * 14}px)`;
  }
  if (entra === 'baja') t = `translateY(${q * -90}px) rotateX(${q * 10}deg) scale(${0.97 + 0.03 * p})`;
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
  if (entra === 'abajo') {
    t = `translateY(${q * 950}px)`;
    filtro = `blur(${q * 16}px)`;
    op = 1;
  }
  if (entra === 'giro') {
    t = `translateX(${q * 220 * lado}px) rotateY(${q * 72 * lado}deg)`;
    op = Math.min(1, p * 2.2);
  }
  if (entra === 'revela') {
    const rev = tw(f, [at, at + 26], [0, 1]);
    t = `scale(${0.96 + 0.04 * p})`;
    filtro = `brightness(${2.4 - 1.4 * rev}) sepia(${0.6 * (1 - rev)}) contrast(${0.7 + 0.3 * rev})`;
  }
  // flota muy despacio (cada foto con su fase)
  const fx = Math.sin((f + fase * 40) / 46) * 5 * p;
  const fy = Math.cos((f + fase * 31) / 39) * 4 * p;
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
        boxShadow: '0 34px 70px rgba(0,0,0,0.55), 0 8px 18px rgba(0,0,0,0.35)',
        transform: `perspective(1800px) translate(${fx}px, ${fy}px) ${t} rotate(${r * Math.min(1, p)}deg) scale(${deriva})`,
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

/**
 * Rollo de película de 35 mm en perspectiva. Entra rápido y frena (rampa de velocidad); cada cuadro pasa de
 * sepia apagado a color pleno al cruzar el centro (foco), con borde dorado; las puntas del rollo llevan quemado
 * de luz, hay rayones y polvo de película, y un destello recorre el rollo.
 */
const PERF = 52;
type TiraProps = {fac: string; fotos: [string, number, number][]; dur: number; dir?: number; y?: number; rot?: number; escala?: number; desde?: number; hasta?: number; foco?: boolean};
const Pelicula: React.FC<TiraProps> = ({fac, fotos, dur, dir = 1, y = H / 2, rot = -4, escala = 1, desde = -380, hasta = -1764, foco = true}) => {
  const f = useCurrentFrame();
  const FW = 640;
  const FH = 480;
  const GAP = 32;
  const BANDA = 78;
  const cuadros: (string | null)[] = [null, ...fotos.map((x) => x[0]), null];
  const pos: Record<string, number> = Object.fromEntries(fotos.map(([n, w, h]) => [n, encuadre(fac, n, w, h, FW, FH)]));
  const ancho = cuadros.length * (FW + GAP) + GAP;
  // rampa de velocidad: arranca 5 veces más rápido, frena a velocidad de crucero y acelera un poco al salir
  const V0 = 5;
  const V1 = 3.4;
  const rec = (t: number) => t + (V0 - 1) * 4 * (1 - Math.exp(-t / 4)) + (V1 - 1) * 3.5 * (Math.exp(-(dur - t) / 3.5) - Math.exp(-dur / 3.5));
  const prog = c01(rec(Math.min(dur, f)) / rec(dur));
  const vel = 1 + (V0 - 1) * Math.exp(-f / 4) + (V1 - 1) * Math.exp(-(dur - f) / 3.5);
  const borroso = Math.min(7, (vel - 1) * 1.7);
  // dir 1: el rollo corre hacia la izquierda; dir -1: hacia la derecha
  const x = dir > 0 ? desde + (hasta - desde) * prog : hasta + (desde - hasta) * prog;
  const vaiven = Math.sin(f / 3.1) * 1.4;
  const fuga = interpolate(f, [0, dur], dir > 0 ? [-600, ancho + 200] : [ancho + 200, -600], clamp);
  const perforaciones = Array.from({length: Math.ceil(ancho / PERF)}, (_, i) => i);
  const hoyo: React.CSSProperties = {position: 'absolute', width: 30, height: 21, borderRadius: 5, background: 'linear-gradient(180deg, #FFF6E6, #E9DCC4)', boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.45), 0 0 6px rgba(255,236,200,0.35)'};
  const parpadeo = 0.985 + 0.03 * hh(f * 2.1);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y - (FH + 2 * BANDA) / 2 + vaiven,
        width: ancho,
        height: FH + 2 * BANDA,
        transform: `perspective(2400px) rotateY(${dir * -6}deg) rotate(${rot}deg) scale(${escala})`,
        transformOrigin: `${W / 2 - x}px 50%`,
        filter: `${borroso > 0.4 ? `blur(${borroso}px) ` : ''}brightness(${parpadeo})`,
      }}
    >
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
        // qué tan cerca del centro de la pantalla está este cuadro (1 = en el centro)
        const sx = W / 2 + (x + left + FW / 2 - W / 2) * escala;
        const d = c01(Math.abs(sx - W / 2) / 780);
        const enf = foco ? 1 - d * d * (3 - 2 * d) : 0.5;
        return (
          <React.Fragment key={k}>
            <div style={{position: 'absolute', left: left + 6, top: BANDA - 22, fontFamily: F.sans, fontWeight: 700, fontSize: 15, letterSpacing: 3, color: '#E59B3C', opacity: 0.85, whiteSpace: 'nowrap'}}>
              ◂ {num} &nbsp; WESTHILL 2026 &nbsp; {num}A ▸
            </div>
            <div style={{position: 'absolute', left: left + FW - 60, bottom: BANDA - 22, fontFamily: F.sans, fontWeight: 700, fontSize: 15, letterSpacing: 2, color: '#E59B3C', opacity: 0.7}}>{num}</div>
            <div style={{position: 'absolute', left, top: BANDA, width: FW, height: FH, borderRadius: 6, overflow: 'hidden', background: '#060403', transform: `scale(${1 + 0.035 * enf})`, boxShadow: n ? `0 0 0 ${2 * enf}px rgba(246,227,176,${0.9 * enf}), 0 0 ${34 * enf}px rgba(255,214,140,${0.5 * enf})` : 'none'}}>
              {n ? (
                <Img src={foto(fac, n)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: `50% ${pos[n] ?? 35}%`, filter: `grayscale(${(1 - enf) * 0.65}) sepia(${0.06 + (1 - enf) * 0.4}) brightness(${0.6 + 0.45 * enf}) contrast(1.06) saturate(${0.9 + 0.18 * enf})`}} />
              ) : (
                // punta del rollo: quemado de luz
                <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at ${k === 0 ? 78 : 22}% 50%, #FFF1C4 0%, #FFB14A 22%, #C4501A 48%, #3A1206 75%, #0E0604 100%)`}} />
              )}
              <div style={{position: 'absolute', inset: 0, boxShadow: `inset 0 0 ${46 - 20 * enf}px rgba(0,0,0,${0.6 - 0.3 * enf})`}} />
            </div>
          </React.Fragment>
        );
      })}
      {/* rayones y polvo de película (cambian cada cuadro) */}
      {foco &&
        [0, 1, 2].map((j) =>
          hh(f * 1.3 + j * 9.7) > 0.5 ? <div key={j} style={{position: 'absolute', top: BANDA, height: FH, left: -x + hh(f * 0.7 + j * 5.3) * W, width: 2, background: 'rgba(255,240,210,0.16)'}} /> : null,
        )}
      {foco && [0, 1, 2, 3].map((j) => <div key={j} style={{position: 'absolute', left: -x + hh(f * 3.1 + j * 2.7) * W, top: BANDA + hh(f * 1.9 + j * 6.1) * FH, width: 4 + hh(j + f) * 5, height: 3, borderRadius: 3, background: 'rgba(20,10,5,0.5)'}} />)}
      {/* destello de luz que recorre el rollo */}
      <div style={{position: 'absolute', top: 0, bottom: 0, left: fuga, width: 520, background: 'linear-gradient(90deg, rgba(255,170,80,0) 0%, rgba(255,170,80,0.3) 45%, rgba(255,230,190,0.42) 52%, rgba(255,170,80,0) 100%)', mixBlendMode: 'screen'}} />
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

const FotosSlot: React.FC<{it: Extract<Item, {k: 'fotos'}>; est: Estilo; tira: number; idx: number}> = ({it, est, tira, idx}) => {
  const f = useCurrentFrame();
  const dur = Math.round(it.beats * BEAT);
  const SAL = est.sale === 'luz' ? 14 : est.sale === 'giro' || est.sale === 'desenfoca' ? 11 : 9;
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
    contenido = <Marco src={foto(it.fac, p0[0])} w={p0[1]} h={p0[2]} x={W / 2} y={H / 2} maxW={1300} maxH={860} r={-1.5} dur={dur} entra={e} brillo={brillo} fase={idx} />;
  } else if (it.tipo === 'trio') {
    contenido = it.fotos.map(([n, w, h], i) => <Marco key={n} src={foto(it.fac, n)} w={w} h={h} x={360 + i * 600} y={H / 2 + (i === 1 ? -20 : 20)} maxW={540} maxH={760} r={[-4, 2, 5][i]} at={b(i)} dur={dur} entra={e} lado={i % 2 ? -1 : 1} brillo={brillo} fase={idx + i * 3} />);
  } else if (it.tipo === 'quad') {
    const pos = [
      [600, 290],
      [1320, 300],
      [620, 790],
      [1300, 780],
    ];
    contenido = it.fotos.map(([n, w, h], i) => <Marco key={n} src={foto(it.fac, n)} w={w} h={h} x={pos[i][0]} y={pos[i][1]} maxW={760} maxH={470} r={[-3, 3, 2, -2][i]} at={b(i * 0.75)} dur={dur} entra={e} lado={i % 2 ? -1 : 1} brillo={brillo} fase={idx + i * 3} />);
  } else {
    const ent = tw(f, [0, 10], [0, 1], ease.out);
    const v = TIRAS[Math.max(0, tira) % TIRAS.length];
    contenido = (
      <AbsoluteFill style={{opacity: ent, transform: `scale(${1.08 - 0.08 * ent})`}}>
        {v.eco !== undefined && (
          <AbsoluteFill style={{opacity: 0.5, filter: 'blur(3px) brightness(0.8)'}}>
            <Pelicula fac={it.fac} fotos={[...it.fotos].reverse().concat(it.fotos)} dur={dur} dir={-v.dir} y={v.eco} rot={-v.rot * 0.6} escala={0.42} desde={-1400} hasta={-3400} foco={false} />
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
  if (est.sale === 'vertical') salida = {transform: `translateY(${-s * 1300}px)`, filter: `blur(${s * 20}px)`};
  if (est.sale === 'giro') salida = {transform: `perspective(1800px) rotateY(${-s * 78}deg) scale(${1 - s * 0.12})`, opacity: 1 - s * s};
  if (est.sale === 'desenfoca') salida = {transform: `scale(${1 + s * 0.08})`, filter: `blur(${s * 26}px)`, opacity: 1 - s};
  // destellos en los tiempos de la canción (solo en los drops), cerca de las fotos
  const chispas = est.drop
    ? [1, 2, 3].map((k) => {
        const lado = hh(idx * 3.3 + k) > 0.5 ? 1 : -1;
        const arriba = hh(idx * 5.7 + k * 2) > 0.5 ? 1 : -1;
        return {at: b(k) + 3, x: W / 2 + lado * (380 + hh(idx + k * 7) * 420), y: H / 2 + arriba * (250 + hh(idx * 2 + k) * 200), s: 30 + hh(idx + k) * 26};
      })
    : [];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={salida}>
        <AbsoluteFill style={{opacity: 0.38}}>
          <Img src={foto(it.fac, p0[0])} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(40px) brightness(0.6)', transform: `scale(${1.2 + 0.08 * (f / dur)}) translateX(${(f / dur - 0.5) * 30}px)`}} />
        </AbsoluteFill>
        {/* fugas de luz que se deslizan detrás de las fotos */}
        <AbsoluteFill style={{mixBlendMode: 'screen'}}>
          <div style={{position: 'absolute', left: -500 + f * 5 + hh(idx) * 500, top: -420, width: 1100, height: 1100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,170,90,0.2) 0%, rgba(255,170,90,0) 65%)'}} />
          <div style={{position: 'absolute', right: -500 + f * 4 + hh(idx * 2) * 400, bottom: -480, width: 1100, height: 1100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(90,150,255,0.16) 0%, rgba(90,150,255,0) 65%)'}} />
        </AbsoluteFill>
        <AbsoluteFill>{contenido}</AbsoluteFill>
        {chispas.map((c, i) => (
          <Destello key={i} {...c} />
        ))}
      </AbsoluteFill>
      {/* destello de luz cálida al salir en las partes tranquilas */}
      {est.sale === 'luz' && (
        <AbsoluteFill style={{background: `radial-gradient(ellipse at ${20 + s * 70}% 40%, rgba(255,222,165,${Math.sin(s * Math.PI)}) 0%, rgba(255,150,70,${0.6 * Math.sin(s * Math.PI)}) 40%, rgba(255,150,70,0) 70%)`, mixBlendMode: 'screen'}} />
      )}
      {est.golpe && <Rafaga />}
      <AbsoluteFill style={{background: '#fff', opacity: golpe}} />
      {(est.sale === 'barrido' || est.sale === 'vertical') && <Sfx at={dur - SAL} name="whoosh" volume={0.18} />}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Portadas, frases e intro
// ---------------------------------------------------------------------------
/** Portada de facultad: mosaico de sus fotos al fondo, marco dorado que se dibuja, número fantasma y el nombre */
const Portada: React.FC<{it: Extract<Item, {k: 'portada'}>}> = ({it}) => {
  const f = useCurrentFrame();
  const dur = Math.round(it.beats * BEAT);
  const fs = (FOTOS[it.fac] ?? []).slice(0, 12);
  const ent = tw(f, [0, 12], [0, 1]);
  const marco = tw(f, [2, 36], [0, 1], ease.inOut);
  const rot = tw(f, [4, 20], [0, 1]);
  const sube = tw(f, [10, 30], [0, 1]);
  const linea = tw(f, [8, 30], [0, 1], ease.inOut);
  const luz = interpolate(f, [30, 60], [0, 1], clamp);
  const sale = tw(f, [dur - 9, dur], [0, 1], ease.in);
  const larga = it.nombre.length > 24;
  return (
    <AbsoluteFill style={{opacity: 1 - sale, transform: `scale(${1 + sale * 0.06})`, filter: sale > 0 ? `blur(${sale * 8}px)` : undefined}}>
      {/* mosaico de fotos de la facultad, muy tenue */}
      <AbsoluteFill style={{opacity: 0.2 * ent, filter: 'blur(4px) grayscale(0.4)'}}>
        {[0, 1].map((r) => (
          <div key={r} style={{position: 'absolute', top: 20 + r * 530, left: r ? -700 + f * 1.6 : -f * 1.6, display: 'flex', gap: 14}}>
            {Array.from({length: 8}, (_, k) => fs[(r * 5 + k) % fs.length]).map(([n], k) => (
              <Img key={k} src={foto(it.fac, n)} style={{width: 500, height: 510, objectFit: 'cover'}} />
            ))}
          </div>
        ))}
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(11,27,51,0.9) 0%, rgba(11,27,51,0.72) 50%, rgba(11,27,51,0.5) 100%)'}} />
      <Rayos x={W / 2} y={H / 2} giro={f * 0.25 + it.num * 40} op={0.16 * ent} radio={1300} />
      {/* número fantasma */}
      <div style={{position: 'absolute', right: 110 + f * 0.7, top: 170, fontFamily: F.clasica, fontWeight: 700, fontSize: 600, lineHeight: 1, color: 'transparent', WebkitTextStroke: '2px rgba(217,183,106,0.3)', opacity: ent}}>{String(it.num).padStart(2, '0')}</div>
      {/* marco que se dibuja */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <rect x={64} y={64} width={W - 128} height={H - 128} fill="none" stroke={ORO} strokeWidth={2.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - marco} />
        <rect x={80} y={80} width={W - 160} height={H - 160} fill="none" stroke={ORO} strokeWidth={1} opacity={0.45} pathLength={1} strokeDasharray="1 1" strokeDashoffset={-(1 - marco)} />
        {[
          [64, 64],
          [W - 64, 64],
          [64, H - 64],
          [W - 64, H - 64],
        ].map(([cx, cy], i) => (
          <rect key={i} x={cx - 9} y={cy - 9} width={18} height={18} fill={ORO} transform={`rotate(45 ${cx} ${cy}) scale(1)`} opacity={tw(f, [26 + i * 2, 36 + i * 2], [0, 1])} />
        ))}
      </svg>
      <div style={{position: 'absolute', top: larga ? 360 : 340, width: '100%', textAlign: 'center'}}>
        <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 30, letterSpacing: 14 + (1 - rot) * 30, color: CREMA, opacity: rot}}>FACULTAD DE</div>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, margin: '22px auto'}}>
          <div style={{width: 300 * linea, height: 2, background: `linear-gradient(90deg, rgba(217,183,106,0), ${ORO})`}} />
          <div style={{width: 12, height: 12, background: ORO, transform: `rotate(45deg) scale(${linea})`}} />
          <div style={{width: 300 * linea, height: 2, background: `linear-gradient(90deg, ${ORO}, rgba(217,183,106,0))`}} />
        </div>
        <div style={{overflow: 'hidden', padding: '10px 120px 18px'}}>
          <div style={{transform: `translateY(${(1 - sube) * 110}%)`, opacity: Math.min(1, sube * 2.5), filter: sube < 1 ? `blur(${(1 - sube) * 6}px)` : undefined}}>
            <Dorado size={larga ? 84 : 124} spacing={4} luz={luz}>
              {it.nombre.toUpperCase()}
            </Dorado>
          </div>
        </div>
        <div style={{width: 640 * linea, height: 2, background: `linear-gradient(90deg, rgba(217,183,106,0), ${ORO}, rgba(217,183,106,0))`, margin: '14px auto 0'}} />
        <div style={{marginTop: 22, fontFamily: F.sans, fontWeight: 500, fontSize: 24, letterSpacing: 10, color: CREMA, opacity: tw(f, [22, 40], [0, 0.8])}}>GENERACIÓN 2026</div>
      </div>
      <Destello at={34} x={W / 2 - 330} y={larga ? 470 : 460} s={34} />
      <Destello at={42} x={W / 2 + 350} y={larga ? 600 : 590} s={28} />
    </AbsoluteFill>
  );
};

/** Frase sobre negro: línea de arriba y línea grande en dorado, palabra por palabra, con una luz que cruza */
const FraseCine: React.FC<{arriba: string; grande: string; dur: number}> = ({arriba, grande, dur}) => {
  const f = useCurrentFrame();
  const sale = tw(f, [dur - 16, dur], [0, 1], ease.in);
  const linea = tw(f, [14, 44], [0, 1], ease.inOut);
  const luzX = interpolate(f, [30, Math.min(dur - 20, 160)], [-20, 120], clamp);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <PolvoOro op={1 - sale} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 46% 42% at ${luzX}% 54%, rgba(217,183,106,0.2) 0%, rgba(0,0,0,0) 100%)`}} />
      <AbsoluteFill style={{opacity: 1 - sale, transform: `scale(${1 + 0.05 * (f / dur) + sale * 0.05})`, filter: sale > 0 ? `blur(${sale * 10}px)` : undefined}}>
        <div style={{position: 'absolute', top: 368, left: 140, right: 140, textAlign: 'center'}}>
          <div style={{fontFamily: F.sans, fontWeight: 500, fontSize: 48, letterSpacing: 12, color: CREMA, textTransform: 'uppercase'}}>
            <Palabras texto={arriba} at={4} paso={3} />
          </div>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, margin: '26px auto 14px'}}>
            <div style={{width: 210 * linea, height: 2, background: `linear-gradient(90deg, rgba(217,183,106,0), ${ORO})`}} />
            <div style={{width: 10, height: 10, background: ORO, transform: `rotate(45deg) scale(${linea})`}} />
            <div style={{width: 210 * linea, height: 2, background: `linear-gradient(90deg, ${ORO}, rgba(217,183,106,0))`}} />
          </div>
          <div style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 120, lineHeight: 1.15, color: ORO, textShadow: '0 0 44px rgba(217,183,106,0.38)'}}>
            <Palabras texto={grande} at={30} paso={5} dur={20} />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Intro: tres frases y el logo con rayos de luz y "GENERACIÓN 2026"; termina justo en la entrada del coro */
const FRASES_INTRO: {at: number; to: number; arriba: string; grande: string}[] = [
  {at: 1.0, to: 7.4, arriba: 'Un día llegaste con una mochila', grande: 'llena de dudas…'},
  {at: 7.8, to: 14.2, arriba: 'y hoy te vas con una', grande: 'llena de historias.'},
  {at: 14.6, to: 21.0, arriba: 'Cada desvelo, cada clase, cada amistad', grande: 'te trajo hasta aquí.'},
];
const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const logoAt = Math.round(21.4 * 30);
  const la = f - logoAt;
  const fondo = tw(la, [0, 34], [0, 1]);
  const lineas = tw(la, [10, 50], [0, 1], ease.inOut);
  const logo = tw(la, [14, 54], [0, 1]);
  const gen = tw(la, [52, 92], [0, 1]);
  const sale = tw(f, [INICIO - 12, INICIO], [0, 1], ease.in);
  const raya = (w: number) => (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16}}>
      <div style={{width: w * lineas, height: 2, background: `linear-gradient(90deg, rgba(217,183,106,0), ${ORO})`}} />
      <div style={{width: 11, height: 11, background: ORO, transform: `rotate(45deg) scale(${lineas})`}} />
      <div style={{width: w * lineas, height: 2, background: `linear-gradient(90deg, ${ORO}, rgba(217,183,106,0))`}} />
    </div>
  );
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {FRASES_INTRO.map((p) => (
        <Sequence key={p.at} from={Math.round(p.at * 30)} durationInFrames={Math.round((p.to - p.at) * 30)}>
          <FraseCine arriba={p.arriba} grande={p.grande} dur={Math.round((p.to - p.at) * 30)} />
        </Sequence>
      ))}
      {la >= 0 && (
        <AbsoluteFill style={{opacity: fondo * (1 - sale), transform: `scale(${1 + 0.04 * c01(la / 200) + sale * 0.14})`, filter: sale > 0 ? `blur(${sale * 6}px)` : undefined}}>
          <Fondo />
          <Rayos x={W / 2} y={430} giro={la * 0.18} op={0.3 * logo} radio={1250} />
          <div style={{position: 'absolute', top: 236, width: '100%'}}>{raya(330)}</div>
          <LogoBlanco x={W / 2 - 330} y={282} w={660} op={logo} escala={1.07 - 0.07 * logo} desenfoque={(1 - logo) * 14} halo={10 + 16 * (1 - logo)} barrido={interpolate(la, [70, 108], [-0.2, 1.2])} />
          <div style={{position: 'absolute', top: 592, width: '100%'}}>{raya(330)}</div>
          <div style={{position: 'absolute', top: 630, width: '100%', textAlign: 'center', opacity: gen, transform: `translateY(${(1 - gen) * 14}px)`, filter: gen < 1 ? `blur(${(1 - gen) * 6}px)` : undefined}}>
            <Dorado size={66} spacing={16 + (1 - gen) * 34} luz={interpolate(la, [112, 150], [0, 1], clamp)}>
              GENERACIÓN 2026
            </Dorado>
          </div>
          <Destello at={logoAt + 96} x={W / 2 - 420} y={672} s={30} />
          <Destello at={logoAt + 104} x={W / 2 + 430} y={660} s={36} />
          <Destello at={logoAt + 74} x={W / 2 + 300} y={300} s={30} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{background: '#fff', opacity: interpolate(f, [INICIO - 3, INICIO, INICIO + 8], [0, 0.7, 0], clamp)}} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Cierre: pirotecnia y logo
// ---------------------------------------------------------------------------
const cb = (k: number) => Math.round(k * BEAT); // tiempos de la canción dentro del cierre
// el cohete del logo estalla en un tiempo de la canción cerca del segundo 210.6 (al terminar el último drop)
const EXPLOTA_F = beatF(Math.round((210.6 - CORO) / 0.5986)) - FIN_DESDE;
const COHETE_F = EXPLOTA_F - 40;
const FORMA_F = EXPLOTA_F + 118; // las chispas ya dibujan el logo; de aquí se funde con el logo real

/**
 * Pirotecnia en canvas. Cada carcasa sube como cometa y estalla según su tipo:
 * peonía (esfera), crisantemo (esfera con estelas largas que chisporrotean), sauce (dorado que cae largo),
 * anillo (aro inclinado), palma (brazos gruesos) y doble (esfera con corazón de otro color).
 * Además hay fuentes de chispas en el piso. Todo con mezcla aditiva para que brille.
 */
type TipoF = 'peonia' | 'crisantemo' | 'sauce' | 'anillo' | 'palma' | 'doble';
type Carcasa = {at: number; x: number; y: number; r: number; tipo: TipoF; col: string; col2: string; seed: number; son: number};
const CFG: Record<TipoF, {n: number; vida: number; g: number; lag: number; w: number}> = {
  peonia: {n: 150, vida: 58, g: 70, lag: 4, w: 2.4},
  crisantemo: {n: 170, vida: 72, g: 95, lag: 9, w: 1.8},
  sauce: {n: 140, vida: 124, g: 340, lag: 16, w: 1.7},
  anillo: {n: 96, vida: 56, g: 50, lag: 4, w: 2.6},
  palma: {n: 150, vida: 86, g: 210, lag: 10, w: 2.6},
  doble: {n: 220, vida: 62, g: 70, lag: 4, w: 2.3},
};
const C_ORO = '255,214,140';
const C_BLA = '255,250,240';
const C_CHA = '246,227,176';
const C_AZU = '170,214,255';
const C_ROS = '255,196,170';
const C_PLA = '214,228,255';
const SUBE = 26;
const CARCASAS: Carcasa[] = (() => {
  const r: Carcasa[] = [];
  let s = 1;
  const add = (at: number, x: number, y: number, rad: number, tipo: TipoF, col: string, son = 0, col2 = C_BLA) => r.push({at, x, y, r: rad, tipo, col, col2, seed: s++, son});
  // 1. mientras entran el texto y las huellas: una cada dos tiempos, arriba y a los lados
  const P1 = [
    [330, 220],
    [1590, 200],
    [690, 130],
    [1250, 140],
    [170, 600],
    [1750, 580],
    [960, 120],
    [1470, 240],
    [450, 170],
  ];
  const T1: TipoF[] = ['peonia', 'crisantemo', 'anillo', 'doble', 'palma', 'peonia', 'sauce', 'crisantemo', 'doble'];
  const K1 = [C_ORO, C_BLA, C_AZU, C_CHA, C_ORO, C_ROS, C_ORO, C_PLA, C_CHA];
  let j = 0;
  for (let k = 2; k < 20; k += 2) {
    const [x, y] = P1[j % P1.length];
    add(cb(k), x, y, 300 + (j % 3) * 50, T1[j % T1.length], K1[j % K1.length], 0.16);
    if (k % 4 === 0) add(cb(k) + 4, W - x, y + 50, 260, T1[(j + 3) % T1.length], K1[(j + 4) % K1.length]);
    j += 1;
  }
  // 2. crescendo: una por tiempo y luego dos por tiempo, por todo el cielo
  const T2: TipoF[] = ['crisantemo', 'peonia', 'doble', 'sauce', 'palma', 'anillo'];
  const K2 = [C_ORO, C_BLA, C_AZU, C_ROS, C_CHA, C_PLA];
  const finSalva = COHETE_F - 30;
  let m = 0;
  for (let k = 20; cb(k) < finSalva - 8; k += k < 25 ? 1 : 0.5) {
    add(cb(k), 180 + hh(k * 3.3) * 1560, 110 + hh(k * 7.1) * 380, 320 + hh(k) * 130, T2[m % T2.length], K2[m % K2.length], m % 2 ? 0 : 0.2);
    m += 1;
  }
  // 3. salva final: cinco a la vez
  [220, 590, 960, 1330, 1700].forEach((x, i) => add(finSalva + i * 2, x, [270, 180, 130, 180, 270][i], 340, 'crisantemo', i % 2 ? C_BLA : C_ORO, i === 2 ? 0.34 : 0));
  // 4. ya con el logo: fuegos alrededor, sin taparlo
  const F0 = FORMA_F;
  add(F0 + 10, 300, 300, 300, 'sauce', C_ORO, 0.2);
  add(F0 + 10, 1620, 300, 300, 'sauce', C_ORO);
  add(F0 + 40, 520, 160, 240, 'peonia', C_BLA, 0.16);
  add(F0 + 40, 1400, 160, 240, 'peonia', C_BLA);
  add(F0 + 66, 210, 560, 230, 'anillo', C_AZU, 0.14);
  add(F0 + 66, 1710, 560, 230, 'anillo', C_AZU);
  [
    [260, 250],
    [590, 140],
    [960, 100],
    [1330, 140],
    [1660, 250],
  ].forEach(([x, y], i) => add(F0 + 94 + i * 3, x, y, i === 2 ? 170 : 230, 'doble', C_ORO, i === 2 ? 0.3 : 0));
  add(F0 + 124, 330, 330, 280, 'sauce', C_CHA, 0.16);
  add(F0 + 124, 1590, 330, 280, 'sauce', C_CHA);
  add(F0 + 146, 600, 150, 220, 'peonia', C_ROS, 0.14);
  add(F0 + 146, 1320, 150, 220, 'peonia', C_ROS);
  return r;
})();
type Fuente = {x: number; a: number; b: number; alto: number};
const FUENTES: Fuente[] = [
  ...[260, 700, 1220, 1660].map((x) => ({x, a: cb(24), b: COHETE_F - 22, alto: 340})),
  ...[150, 470, 1450, 1770].map((x) => ({x, a: FORMA_F + 20, b: CIERRE_F - 70, alto: 300})),
];
/** dirección y velocidad relativa de la chispa i de una carcasa */
const dirChispa = (c: Carcasa, i: number): [number, number, number, boolean] => {
  const n = CFG[c.tipo].n;
  if (c.tipo === 'anillo') {
    const th = (i / n) * Math.PI * 2;
    const incl = hh(c.seed * 3.1) * Math.PI;
    const ex = Math.cos(th);
    const ey = Math.sin(th) * 0.42;
    return [ex * Math.cos(incl) - ey * Math.sin(incl), ex * Math.sin(incl) + ey * Math.cos(incl), 1, false];
  }
  if (c.tipo === 'palma') {
    const brazo = i % 9;
    const th = (brazo / 9) * Math.PI * 2 + hh(c.seed) * 6 + (hh(i * 1.3 + c.seed) - 0.5) * 0.09;
    return [Math.cos(th), Math.sin(th), 0.3 + 0.7 * hh(i * 2.7 + c.seed), false];
  }
  const u = hh(c.seed * 13.1 + i * 1.17) * 2 - 1;
  const th = hh(c.seed * 7.3 + i * 2.31) * Math.PI * 2;
  const rr = Math.sqrt(1 - u * u);
  const dentro = c.tipo === 'doble' && i % 5 < 2;
  return [rr * Math.cos(th), rr * Math.sin(th), (dentro ? 0.46 : 1) * (0.9 + 0.1 * hh(i * 5.3 + c.seed)), dentro];
};
const FRENO = 1 - Math.exp(-4);
const Pirotecnia: React.FC = () => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const c of CARCASAS) {
      const cfg = CFG[c.tipo];
      const t = f - c.at;
      if (t < -SUBE || t > cfg.vida) continue;
      if (t < 0) {
        // cometa subiendo, con chispas que se le caen
        const lado = c.seed % 2 ? 1 : -1;
        const x0 = c.x + lado * (50 + 60 * hh(c.seed));
        const pos = (k: number): [number, number] => {
          const e = 1 - Math.pow(1 - c01(k), 2);
          return [x0 + (c.x - x0) * e, H + 30 + (c.y - H - 30) * e];
        };
        const k = (t + SUBE) / SUBE;
        const [hx, hy] = pos(k);
        const [tx, ty] = pos(k - 0.14);
        const g = ctx.createLinearGradient(tx, ty, hx, hy);
        g.addColorStop(0, 'rgba(255,200,120,0)');
        g.addColorStop(1, 'rgba(255,246,222,0.95)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(hx, hy);
        ctx.stroke();
        for (let q = 0; q < 8; q++) {
          const [sx, sy] = pos(k - q * 0.022);
          ctx.fillStyle = `rgba(255,214,150,${0.55 * (1 - q / 8)})`;
          ctx.beginPath();
          ctx.arc(sx + (hh(q * 3.3 + f * 1.7 + c.seed) - 0.5) * 12, sy + q * 3, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        continue;
      }
      // destello del estallido y resplandor en el cielo
      if (t < 14) {
        const fl = 1 - t / 14;
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r * 2.2);
        g.addColorStop(0, `rgba(255,244,214,${0.55 * fl})`);
        g.addColorStop(0.18, `rgba(${c.col},${0.26 * fl})`);
        g.addColorStop(1, `rgba(${c.col},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(c.x - c.r * 2.2, c.y - c.r * 2.2, c.r * 4.4, c.r * 4.4);
      }
      const u = t / cfg.vida;
      const chispea = c.tipo === 'crisantemo' || c.tipo === 'sauce';
      const pos = (dx: number, dy: number, v: number, tt: number): [number, number] => {
        const uu = c01(tt / cfg.vida);
        const e = (1 - Math.exp(-4 * uu)) / FRENO;
        return [c.x + dx * c.r * v * e, c.y + dy * c.r * v * e + cfg.g * uu * uu];
      };
      ctx.lineWidth = cfg.w;
      for (let i = 0; i < cfg.n; i++) {
        const [dx, dy, v, dentro] = dirChispa(c, i);
        let a = u < 0.6 ? 1 : 1 - (u - 0.6) / 0.4;
        if (chispea && u > 0.42) a *= hh(i * 3.7 + f * 0.61 + c.seed) > 0.42 ? 1 : 0.2;
        if (a < 0.02) continue;
        const col = dentro ? c.col2 : u < 0.14 ? C_BLA : c.col;
        const [hx, hy] = pos(dx, dy, v, t);
        const [mx, my] = pos(dx, dy, v, t - cfg.lag * 0.5);
        const [tx, ty] = pos(dx, dy, v, t - cfg.lag);
        ctx.strokeStyle = `rgba(${col},${a * 0.3})`;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(mx, my);
        ctx.stroke();
        ctx.strokeStyle = `rgba(${col},${a * 0.85})`;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(hx + 0.01, hy);
        ctx.stroke();
        if (i % 3 === 0) {
          ctx.fillStyle = `rgba(${col},${a * 0.16})`;
          ctx.beginPath();
          ctx.arc(hx, hy, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    // fuentes de chispas en el piso
    const VIDA = 30;
    const RITMO = 5;
    ctx.lineWidth = 2;
    for (const fu of FUENTES) {
      if (f < fu.a || f > fu.b + VIDA) continue;
      const j0 = Math.max(0, Math.floor((f - VIDA - fu.a) * RITMO));
      const j1 = Math.floor((Math.min(f, fu.b) - fu.a) * RITMO);
      const pos = (j: number, edad: number): [number, number] => {
        const uu = edad / VIDA;
        const v = fu.alto * (0.7 + 0.3 * hh(j * 3.1 + fu.x));
        return [fu.x + (hh(j * 1.7 + fu.x) - 0.5) * 0.5 * fu.alto * uu, H + 6 - (2.4 * v * uu - 1.6 * fu.alto * uu * uu)];
      };
      for (let j = j0; j <= j1; j++) {
        const edad = f - (fu.a + j / RITMO);
        if (edad < 0 || edad > VIDA) continue;
        const a = (1 - edad / VIDA) * (hh(j * 2.3 + f * 0.9) > 0.3 ? 1 : 0.35);
        const [hx, hy] = pos(j, edad);
        const [tx, ty] = pos(j, Math.max(0, edad - 2));
        ctx.strokeStyle = `rgba(${j % 4 === 0 ? C_BLA : C_ORO},${a})`;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(hx + 0.01, hy);
        ctx.stroke();
      }
    }
  }, [f]);
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, filter: 'drop-shadow(0 0 7px rgba(255,214,150,0.85))'}} />;
};

/**
 * Fuego artificial que forma el logo: un cometa grueso sube al centro y estalla con una onda expansiva; sus
 * chispas salen volando, giran en remolino y caen cada una a un punto del logo (gradLogoPuntos.ts) dejando estela,
 * mientras una nube de polvo dorado llena la pantalla y cae titilando. Al terminar de formarse, una ola de luz
 * lo recorre y se funde con el logo real.
 */
const LOGO_W = 660;
const LOGO_X = W / 2 - LOGO_W / 2;
const LOGO_Y = 300;
const LOGO_K = LOGO_W / LOGO_PNG.w;
const LOGO_ALTO = LOGO_PNG.h * LOGO_K;
const CENTRO_LOGO = {x: W / 2, y: LOGO_Y + LOGO_ALTO / 2};
const CHISPA_COL = ['255,236,190', '255,255,255', '246,214,140', '255,246,222'];
const CHISPAS = Array.from({length: LOGO_PUNTOS.length / 2}, (_, i) => ({
  tx: LOGO_X + LOGO_PUNTOS[2 * i] * LOGO_K,
  ty: LOGO_Y + LOGO_PUNTOS[2 * i + 1] * LOGO_K,
  ang: random(`la${i}`) * Math.PI * 2,
  vel: 240 + 520 * Math.sqrt(random(`lv${i}`)),
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
  const ey = CENTRO_LOGO.y + Math.sin(c.ang) * c.vel * e * 0.82 + 70 * libre * libre;
  const k = c01((t - c.espera) / c.viaje);
  const s = k * k * (3 - 2 * k);
  const px = ex + (c.tx - ex) * s - CENTRO_LOGO.x;
  const py = ey + (c.ty - ey) * s - CENTRO_LOGO.y;
  // remolino: giran alrededor del centro mientras viajan (0 al salir y al llegar)
  const phi = 0.6 * Math.sin(Math.PI * s);
  return [CENTRO_LOGO.x + px * Math.cos(phi) - py * Math.sin(phi), CENTRO_LOGO.y + px * Math.sin(phi) + py * Math.cos(phi), k];
};
const N_POLVO = 1500;
const LogoFuego: React.FC = () => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const t = f - EXPLOTA_F;
  const funde = tw(f, [FORMA_F, FORMA_F + 50], [0, 1], ease.inOut);
  const resto = 1 - tw(f, [FORMA_F + 30, FORMA_F + 130], [0, 1]);
  useLayoutEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    if (t < 0) {
      // cometa grueso subiendo con cola de chispas
      const k = (t + 40) / 40;
      const pos = (kk: number): [number, number] => {
        const c = 1 - Math.pow(1 - c01(kk), 2.2);
        return [CENTRO_LOGO.x + 70 * Math.pow(1 - c, 1.5), H + 40 + (CENTRO_LOGO.y - H - 40) * c];
      };
      const [hx, hy] = pos(k);
      const [cx, cy] = pos(k - 0.2);
      const g = ctx.createLinearGradient(cx, cy, hx, hy);
      g.addColorStop(0, 'rgba(255,200,120,0)');
      g.addColorStop(1, 'rgba(255,248,228,1)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(hx, hy);
      ctx.stroke();
      const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, 70);
      halo.addColorStop(0, 'rgba(255,244,214,0.75)');
      halo.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(hx - 70, hy - 70, 140, 140);
      for (let j = 0; j < 46; j++) {
        const kk = k - j * 0.012;
        if (kk < 0) break;
        const [sx, sy] = pos(kk);
        ctx.fillStyle = `rgba(255,214,150,${0.7 * (1 - j / 46)})`;
        ctx.beginPath();
        ctx.arc(sx + (hh(j * 2.1 + f * 1.3) - 0.5) * (8 + j * 0.8), sy + j * 1.6 * hh(j + f), 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    // ondas expansivas
    [0, 9].forEach((ret) => {
      const tt = t - ret;
      if (tt < 0 || tt > 46) return;
      const p = 1 - Math.pow(1 - tt / 46, 2.4);
      ctx.strokeStyle = `rgba(255,236,196,${0.55 * (1 - tt / 46)})`;
      ctx.lineWidth = 7 * (1 - tt / 46) + 1;
      ctx.beginPath();
      ctx.arc(CENTRO_LOGO.x, CENTRO_LOGO.y, 50 + p * 1100, 0, Math.PI * 2);
      ctx.stroke();
    });
    // nube de polvo dorado que llena la pantalla y cae titilando
    for (let i = 0; i < N_POLVO; i++) {
      const vida = 105 + hh(i * 1.9) * 50;
      if (t > vida) continue;
      const ang = hh(i * 3.3) * Math.PI * 2;
      const vel = 260 + 980 * Math.sqrt(hh(i * 7.7));
      const pos = (tt: number): [number, number] => {
        const e = (1 - Math.exp(-4.4 * c01(tt / 60))) / (1 - Math.exp(-4.4));
        const uu = tt / 120;
        return [CENTRO_LOGO.x + Math.cos(ang) * vel * e, CENTRO_LOGO.y + Math.sin(ang) * vel * e * 0.8 + 300 * uu * uu];
      };
      const u = t / vida;
      const a = (u < 0.5 ? 1 : 1 - (u - 0.5) / 0.5) * (t > 22 && hh(i * 2.7 + f * 0.53) < 0.4 ? 0.15 : 1) * 0.8;
      if (a < 0.03) continue;
      const [hx, hy] = pos(t);
      const [tx, ty] = pos(Math.max(0, t - (t < 30 ? 5 : 2)));
      ctx.strokeStyle = `rgba(${i % 5 === 0 ? C_BLA : i % 5 === 1 ? C_CHA : C_ORO},${a})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(hx + 0.01, hy);
      ctx.stroke();
    }
    // chispas que forman el logo; al final una ola de luz lo recorre de izquierda a derecha
    const ola = interpolate(f, [FORMA_F - 30, FORMA_F + 8], [LOGO_X - 120, LOGO_X + LOGO_W + 120]);
    for (const c of CHISPAS) {
      const [hx, hy, k] = posChispa(c, t);
      const [cx, cy] = posChispa(c, t - (k < 1 ? 5 : 1));
      const titila = k >= 1 ? 0.7 + 0.3 * Math.sin(f * 0.35 + c.fase) : 1;
      const vivo = c.queda ? Math.max(1 - funde, resto * 0.8) : 1 - funde;
      const luz = k >= 1 ? Math.exp(-Math.pow((c.tx - ola) / 70, 2)) : 0;
      const a = Math.min(1, t / 3) * Math.min(1, titila + luz) * vivo;
      if (a <= 0.01) continue;
      ctx.strokeStyle = `rgba(${c.col},${a * (k < 1 ? 0.55 : 0.5)})`;
      ctx.lineWidth = k < 1 ? 1.5 : 1.6;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(hx + 0.01, hy);
      ctx.stroke();
      ctx.fillStyle = `rgba(${c.col},${a})`;
      ctx.beginPath();
      ctx.arc(hx, hy, (k < 1 ? 1.9 : 1.5) + 2.2 * luz, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [f, t, funde, resto]);
  if (t < -40 || f > FORMA_F + 140) return null;
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

/** Cierre: tiras de fotos al fondo, "¡Felicidades, Generación 2026!", huellas, pirotecnia y el logo hecho de chispas */
const TODAS = FACULTADES.flatMap(({key}) => (FOTOS[key] ?? []).map(([n, w, h]) => ({fac: key, n, w, h})));
const HUELLAS_DESDE = 124;
const Cierre: React.FC = () => {
  const f = useCurrentFrame();
  const t1 = tw(f, [10, 36], [0, 1]);
  const t2 = tw(f, [40, 70], [0, 1]);
  const t3 = tw(f, [90, 116], [0, 1]);
  const logo = tw(f, [FORMA_F, FORMA_F + 50], [0, 1], ease.inOut);
  const gen = tw(f, [FORMA_F + 46, FORMA_F + 80], [0, 1]);
  const ocultaTexto = tw(f, [COHETE_F - 14, COHETE_F + 10], [0, 1]);
  const negro = tw(f, [CIERRE_F - 44, CIERRE_F - 6], [0, 1]);
  const te = f - EXPLOTA_F;
  const destello = interpolate(te, [0, 2, 22], [0, 0.85, 0], clamp);
  const rayos = interpolate(f, [EXPLOTA_F, EXPLOTA_F + 12, FORMA_F, FORMA_F + 40, CIERRE_F - 40], [0, 0.5, 0.22, 0.34, 0.24], clamp);
  const lente = interpolate(f, [FORMA_F - 6, FORMA_F + 8, FORMA_F + 46], [0, 1, 0], clamp);
  // el fondo de fotos se apaga un poco cuando sube el cohete del logo, para que el cielo quede oscuro
  const fotosOp = 0.32 - 0.14 * tw(f, [COHETE_F - 20, COHETE_F + 20], [0, 1]);
  // la palabra "huella" se enciende cuando cae la huella grande
  const enciende = interpolate(f - (HUELLAS_DESDE + Math.round(HUELLA_GRANDE * BEAT)), [0, 4, 50], [0, 1, 0.35], clamp);
  const filas = [0, 1, 2];
  return (
    <AbsoluteFill style={{background: NAVY, overflow: 'hidden'}}>
      {/* tres tiras de fotos que corren en sentidos opuestos */}
      <AbsoluteFill style={{opacity: fotosOp, filter: 'grayscale(0.3)'}}>
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
      {rayos > 0 && <Rayos x={CENTRO_LOGO.x} y={CENTRO_LOGO.y} giro={f * 0.2} op={rayos} radio={1500} />}
      <Pirotecnia />
      <Huellas desde={HUELLAS_DESDE} atenua={1 - 0.4 * logo} />
      <div style={{position: 'absolute', top: 330, width: '100%', textAlign: 'center', opacity: 1 - ocultaTexto, transform: `scale(${1 + ocultaTexto * 0.05})`, filter: ocultaTexto > 0 ? `blur(${ocultaTexto * 8}px)` : undefined}}>
        <div style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 90, color: CREMA, opacity: t1, filter: `blur(${(1 - t1) * 10}px)`, textShadow: '0 4px 30px rgba(0,0,0,0.6)'}}>¡Felicidades,</div>
        <div style={{marginTop: 6, transform: `scale(${0.9 + 0.1 * t2})`, opacity: t2, filter: `blur(${(1 - t2) * 10}px) drop-shadow(0 6px 26px rgba(0,0,0,0.55))`}}>
          <Dorado size={130} spacing={10} luz={interpolate(f % 150, [72, 112], [0, 1], clamp)}>
            GENERACIÓN 2026!
          </Dorado>
        </div>
        <div style={{marginTop: 40, fontFamily: F.sans, fontWeight: 600, fontSize: 40, letterSpacing: 4, color: CREMA, opacity: t3, textShadow: '0 2px 18px rgba(0,0,0,0.7)'}}>
          Gracias por dejar <span style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 50, letterSpacing: 1, color: ORO, textShadow: `0 0 ${24 * enciende}px rgba(255,214,140,${enciende})`}}>huella</span> en Westhill.
        </div>
      </div>
      <Destello at={64} x={W / 2 - 610} y={470} s={40} />
      <Destello at={72} x={W / 2 + 640} y={560} s={48} />
      <LogoFuego />
      {/* destello de lente cuando el logo termina de formarse */}
      {lente > 0 && (
        <AbsoluteFill style={{mixBlendMode: 'screen', opacity: lente}}>
          <div style={{position: 'absolute', left: CENTRO_LOGO.x - 950 * (0.4 + 0.6 * lente), top: CENTRO_LOGO.y - 5, width: 1900 * (0.4 + 0.6 * lente), height: 10, borderRadius: 5, filter: 'blur(3px)', background: 'linear-gradient(90deg, rgba(255,230,180,0) 0%, rgba(255,240,210,0.95) 50%, rgba(255,230,180,0) 100%)'}} />
          <div style={{position: 'absolute', left: CENTRO_LOGO.x - 520, top: CENTRO_LOGO.y - 300, width: 1040, height: 600, background: 'radial-gradient(ellipse, rgba(255,236,196,0.45) 0%, rgba(255,214,150,0.14) 40%, rgba(255,214,150,0) 70%)'}} />
        </AbsoluteFill>
      )}
      <LogoBlanco x={LOGO_X} y={LOGO_Y} w={LOGO_W} op={logo} escala={1.05 - 0.05 * logo} halo={8 + 22 * (1 - logo)} barrido={interpolate(f, [FORMA_F + 58, FORMA_F + 96], [-0.2, 1.2])} />
      <div style={{position: 'absolute', top: LOGO_Y + LOGO_ALTO + 26, width: '100%', textAlign: 'center', opacity: gen}}>
        <div style={{width: 520 * gen, height: 2, margin: '0 auto 20px', background: `linear-gradient(90deg, rgba(217,183,106,0), ${ORO}, rgba(217,183,106,0))`}} />
        <div style={{transform: `translateY(${(1 - gen) * 12}px)`, filter: gen < 1 ? `blur(${(1 - gen) * 6}px)` : undefined}}>
          <Dorado size={54} spacing={16 + (1 - gen) * 30} luz={interpolate(f, [FORMA_F + 92, FORMA_F + 128], [0, 1], clamp)}>
            GENERACIÓN 2026
          </Dorado>
        </div>
      </div>
      {/* destello del estallido que forma el logo */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(255,250,236,1) 0%, rgba(255,226,170,0.9) 35%, rgba(255,200,120,0.5) 100%)', opacity: destello}} />
      {CARCASAS.filter((c) => c.son > 0).map((c) => (
        <Sfx key={c.seed} at={c.at} name="fw_boom" volume={c.son} />
      ))}
      <Sfx at={cb(24)} name="fw_crackle" volume={0.12} />
      <Sfx at={cb(27)} name="fw_crackle" volume={0.14} />
      <Sfx at={COHETE_F} name="fw_silbido" volume={0.3} />
      <Sfx at={EXPLOTA_F} name="fw_boom_grande" volume={0.6} />
      <Sfx at={EXPLOTA_F + 14} name="fw_crackle" volume={0.26} />
      <Sfx at={EXPLOTA_F + 70} name="fw_crackle" volume={0.16} />
      <Sfx at={FORMA_F + 30} name="fw_crackle" volume={0.12} />
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
  // cortinas de barras: al entrar y salir de cada portada y al entrar al interludio (la primera portada entra con el destello de la intro)
  const cortinas: number[] = [];
  ITEMS.forEach((it, i) => {
    const from = beatF(ARRANQUES[i]);
    if ((it.k === 'portada' || it.k === 'frase') && i > 0 && ITEMS[i - 1].k !== 'frase') cortinas.push(from);
    if (it.k === 'portada') cortinas.push(beatF(ARRANQUES[i] + it.beats));
  });
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
            {it.k === 'portada' ? <Portada it={it} /> : it.k === 'frase' ? <FraseCine arriba={it.arriba} grande={it.grande} dur={dur} /> : <FotosSlot it={it} est={ESTILOS[i]} tira={TIRA_IDX[i]} idx={i} />}
          </Sequence>
        );
      })}
      <Sequence from={INICIO} durationInFrames={FIN_DESDE - INICIO}>
        <PrimerPlano />
      </Sequence>
      {cortinas.map((c, i) => (
        <Sequence key={c} from={c - BARRAS_CORTE} durationInFrames={BARRAS_F}>
          <Barras dir={i % 2 ? -1 : 1} />
          <Sfx at={2} name="whoosh" volume={0.2} />
        </Sequence>
      ))}
      <Sequence from={FIN_DESDE} durationInFrames={CIERRE_F}>
        <Cierre />
      </Sequence>
      {/* viñeta suave */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.38) 100%)', pointerEvents: 'none'}} />
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
