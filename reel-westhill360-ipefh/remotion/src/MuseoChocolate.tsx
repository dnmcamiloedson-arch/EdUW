import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from './components';
import {Sfx} from './shots';
import {F, SAFE_X, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Historia de IG (9:16, 26 s): Coordinación de Inclusión en el Museo del Chocolate.
//  1. Intro: chocolate que escurre desde arriba y "Hoy fuimos al Museo del Chocolate".
//  2. Montaje de los clips de la visita, cortado al compás de la música (120 BPM, 1 compás = 2 s),
//     con cortinas de chocolate derretido entre bloques.
//  3. Cierre: "Coordinación de Inclusión" y el logo.
// El banderín UW va arriba a la derecha durante toda la historia.
// Los clips se funden uno con otro (sin rebote) y los textos cuentan lo que hicieron en la visita.
// Clips en public/proxies/choco (sin audio); música original en public/music/chocolate.mp3.
// ---------------------------------------------------------------------------
const W = 1080;
const H = 1920;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const CHOCO = '#3B2116';
const LECHE = '#6E4129';
const CARAMELO = '#D9A066';
const CREMA = '#F6E9D7';
const COMPAS = 60;
const vid = (n: number) => staticFile(`proxies/choco/v${n}.mp4`);

/**
 * Capa de chocolate derretido (y = dónde termina el chocolate). Cada gota es una sola forma orgánica:
 * nace del borde con una curva suave, se adelgaza al bajar y termina en una gota más gruesa, como el chocolate
 * real. Lleva brillo especular a un lado, reflejo en la gota, borde brillante y sombra suave. Las gotas crecen
 * despacio y cada una a su ritmo (nada de vaivén).
 */
// [x del centro, largo, medio ancho del cuello, retraso]
const GOTAS: [number, number, number, number][] = [
  [38, 70, 11, 0.3],
  [118, 190, 22, 0],
  [205, 105, 15, 0.5],
  [282, 290, 27, 0.15],
  [365, 60, 9, 0.7],
  [430, 170, 19, 0.35],
  [520, 340, 31, 0.05],
  [612, 120, 14, 0.6],
  [690, 230, 24, 0.2],
  [775, 80, 10, 0.8],
  [845, 300, 28, 0.1],
  [935, 140, 16, 0.45],
  [1025, 220, 21, 0.25],
];
let idChoco = 0;
const Chocolate: React.FC<{y: number; gota?: number; brillo?: boolean}> = ({y, gota = 1, brillo = true}) => {
  const f = useCurrentFrame();
  const id = React.useMemo(() => `choco${idChoco++}`, []);
  const ola = (x: number) => y + Math.sin(x / 140 + 1.3) * 7 + Math.sin(x / 61) * 3;
  // largo de cada gota: crece despacio con su propio retraso
  const gotas = GOTAS.map(([c, largo, w, d]) => {
    const crece = interpolate(f, [d * 40, d * 40 + 90], [0.55, 1], {...clamp, easing: ease.out});
    const L = Math.max(4, largo * gota * crece);
    return {c, L, w, r: w * 1.25, fil: w * 1.7};
  });
  let d = `M-20,-20 L${W + 20},-20 L${W + 20},${ola(W + 20)}`;
  // borde de derecha a izquierda, interrumpido por las gotas
  let x = W + 20;
  for (const g of [...gotas].reverse()) {
    const xd = g.c + g.w + g.fil;
    for (let xx = x - 24; xx > xd; xx -= 24) d += ` L${xx},${ola(xx)}`;
    const yb = ola(g.c);
    const fondo = yb + g.L;
    d += ` L${xd},${ola(xd)}`;
    d += ` Q${g.c + g.w},${yb} ${g.c + g.w},${yb + g.fil}`; // curva de unión con el borde
    d += ` C${g.c + g.w * 0.78},${yb + g.L * 0.4} ${g.c + g.w * 0.6},${fondo - g.r * 1.5} ${g.c + g.w * 0.74},${fondo - g.r * 0.55}`; // se adelgaza
    d += ` C${g.c + g.r * 1.1},${fondo + g.r * 0.05} ${g.c + g.r * 0.64},${fondo + g.r} ${g.c},${fondo + g.r}`; // gota
    d += ` C${g.c - g.r * 0.64},${fondo + g.r} ${g.c - g.r * 1.1},${fondo + g.r * 0.05} ${g.c - g.w * 0.74},${fondo - g.r * 0.55}`;
    d += ` C${g.c - g.w * 0.6},${fondo - g.r * 1.5} ${g.c - g.w * 0.78},${yb + g.L * 0.4} ${g.c - g.w},${yb + g.fil}`;
    d += ` Q${g.c - g.w},${yb} ${g.c - g.w - g.fil},${ola(g.c - g.w - g.fil)}`;
    x = g.c - g.w - g.fil;
  }
  for (let xx = x - 24; xx > -20; xx -= 24) d += ` L${xx},${ola(xx)}`;
  d += ` L-20,${ola(-20)} Z`;
  // borde brillante (sin pasar por las gotas)
  const bordeBrillo = Array.from({length: 46}, (_, i) => {
    const xx = (i / 45) * W;
    return `${i ? 'L' : 'M'}${xx},${ola(xx) - 9}`;
  }).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id={`${id}g`} gradientUnits="userSpaceOnUse" x1="0" y1={y - 500} x2="0" y2={y + 380}>
          <stop offset="0" stopColor="#24120A" />
          <stop offset="0.55" stopColor="#3A1F12" />
          <stop offset="0.8" stopColor="#4D2B19" />
          <stop offset="1" stopColor="#3A1F12" />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgba(255,235,210,0)" />
          <stop offset="0.35" stopColor="rgba(255,235,210,0.10)" />
          <stop offset="0.5" stopColor="rgba(255,235,210,0.20)" />
          <stop offset="0.65" stopColor="rgba(255,235,210,0.10)" />
          <stop offset="1" stopColor="rgba(255,235,210,0)" />
        </linearGradient>
        <filter id={`${id}f`} x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#1A0C05" floodOpacity="0.45" />
        </filter>
        <clipPath id={`${id}c`}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={`url(#${id}g)`} filter={`url(#${id}f)`} />
      {brillo && (
        <g clipPath={`url(#${id}c)`}>
          <path d={bordeBrillo} stroke="rgba(255,228,196,0.28)" strokeWidth={4} fill="none" strokeLinecap="round" />
          {gotas.map((g, i) => {
            const yb = ola(g.c);
            const fondo = yb + g.L;
            return (
              <g key={i}>
                {/* brillo especular a lo largo de la gota */}
                <path d={`M${g.c - g.w * 0.42},${yb + g.fil * 0.6} C${g.c - g.w * 0.4},${yb + g.L * 0.5} ${g.c - g.w * 0.36},${fondo - g.r * 1.2} ${g.c - g.w * 0.38},${fondo - g.r * 0.3}`} stroke="rgba(255,232,205,0.34)" strokeWidth={Math.max(2, g.w * 0.22)} strokeLinecap="round" fill="none" />
                {/* reflejo en la gota */}
                <ellipse cx={g.c - g.r * 0.36} cy={fondo + g.r * 0.15} rx={g.r * 0.2} ry={g.r * 0.32} fill="rgba(255,240,220,0.5)" transform={`rotate(18 ${g.c - g.r * 0.36} ${fondo + g.r * 0.15})`} />
                {/* sombra del lado derecho para dar volumen */}
                <path d={`M${g.c + g.w * 0.55},${yb + g.fil} C${g.c + g.w * 0.5},${yb + g.L * 0.5} ${g.c + g.w * 0.45},${fondo - g.r} ${g.c + g.r * 0.6},${fondo + g.r * 0.4}`} stroke="rgba(20,8,3,0.35)" strokeWidth={Math.max(2, g.w * 0.35)} strokeLinecap="round" fill="none" />
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
};

/** Cortina de chocolate: baja cubriendo la pantalla y luego sigue hacia abajo destapando lo siguiente */
const CORTINA = 26;
const Cortina: React.FC = () => {
  const f = useCurrentFrame();
  const baja = tw(f, [0, CORTINA / 2], [-420, H + 40], ease.inOut);
  const sale = tw(f, [CORTINA / 2, CORTINA], [0, H + 500], ease.in);
  return (
    <AbsoluteFill style={{transform: `translateY(${sale}px)`}}>
      <Chocolate y={baja} gota={1.2} />
    </AbsoluteFill>
  );
};

/** Clip a pantalla completa: entra fundiéndose sobre el anterior y se acerca despacio, tono cálido */
const FUNDE = 8;
const Clip: React.FC<{n: number; desde: number; dur: number; funde: number}> = ({n, desde, dur, funde}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, dur], [1.0, 1.05], clamp);
  const op = funde ? tw(f, [0, funde], [0, 1], ease.inOut) : 1;
  return (
    <AbsoluteFill style={{background: CHOCO, overflow: 'hidden', opacity: op}}>
      <OffthreadVideo src={vid(n)} startFrom={Math.max(0, Math.round(desde * 30) - funde)} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})`, filter: 'sepia(0.12) saturate(1.08)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(59,33,22,0) 55%, rgba(59,33,22,0.55) 100%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(59,33,22,0) 60%, rgba(59,33,22,0.55) 100%)'}} />
    </AbsoluteFill>
  );
};

/** Texto de cada bloque del montaje: tarjeta crema con letras de chocolate; las palabras clave en caramelo */
type Parte = [string, boolean?];
const Texto: React.FC<{lineas: {at: number; partes: Parte[]}[]; dur: number}> = ({lineas, dur}) => {
  const f = useCurrentFrame();
  const sale = tw(f, [dur - 12, dur], [0, 1]);
  return (
    <div style={{position: 'absolute', top: 1330, left: 70, right: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: 1 - sale}}>
      {lineas.map(({at, partes}, i) => {
        const p = tw(f, [at, at + 16], [0, 1]);
        return (
          <div key={i} style={{padding: '16px 34px', borderRadius: 26, background: 'rgba(246,233,215,0.95)', boxShadow: '0 14px 30px rgba(30,15,8,0.35)', fontFamily: F.sans, fontWeight: 800, fontSize: 52, lineHeight: 1.15, color: CHOCO, textAlign: 'center', opacity: p, transform: `translateY(${(1 - p) * 26}px)`, filter: `blur(${(1 - p) * 6}px)`}}>
            {partes.map(([t, clave], k) => (
              <span key={k} style={clave ? {color: '#B06A2C', fontFamily: F.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 60} : undefined}>
                {t}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
};

/** Banderín UW (versión completa, con el azul de arriba) en la esquina superior derecha; entra suave */
const Banderin: React.FC = () => {
  const f = useCurrentFrame();
  const p = tw(f, [0, 20], [0, 1]);
  return (
    <div style={{position: 'absolute', right: SAFE_X, top: 130, width: 150, opacity: p, transform: `translateY(${(1 - p) * -30}px)`, filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.35))'}}>
      <Img src={staticFile('logos/banderin_uw.png')} style={{width: '100%', display: 'block'}} />
    </div>
  );
};

const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const cae = tw(f, [0, 30], [-200, 520], ease.out);
  const a = tw(f, [22, 38], [0, 1]);
  const b = tw(f, [36, 52], [0, 1]);
  const c = tw(f, [50, 64], [0, 1]);
  return (
    <AbsoluteFill style={{background: CREMA}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 70%, #FFF6EA 0%, ${CREMA} 55%, #E9D2B5 100%)`}} />
      <Chocolate y={cae} gota={tw(f, [10, 60], [0.2, 1.05])} />
      <div style={{position: 'absolute', top: 1000, width: '100%', textAlign: 'center'}}>
        <div style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 92, color: LECHE, opacity: a, transform: `translateY(${(1 - a) * 30}px)`}}>Hoy fuimos al</div>
        <div style={{marginTop: 10, fontFamily: F.sans, fontWeight: 900, fontSize: 104, lineHeight: 1, color: CHOCO, letterSpacing: 2, opacity: b, transform: `translateY(${(1 - b) * 40}px)`}}>MUSEO DEL</div>
        <div style={{marginTop: 6, fontFamily: F.sans, fontWeight: 900, fontSize: 150, lineHeight: 1, letterSpacing: 2, backgroundImage: `linear-gradient(180deg, ${LECHE} 0%, ${CHOCO} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', opacity: c, transform: `scale(${0.85 + 0.15 * c})`, filter: `blur(${(1 - c) * 8}px)`}}>CHOCOLATE</div>
      </div>
      <Sfx at={2} name="whoosh" volume={0.35} />
      <Sfx at={50} name="pop" volume={0.45} />
    </AbsoluteFill>
  );
};

const Cierre: React.FC = () => {
  const f = useCurrentFrame();
  const a = tw(f, [8, 26], [0, 1]);
  const b = tw(f, [22, 40], [0, 1]);
  return (
    <AbsoluteFill style={{background: CHOCO}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, ${LECHE} 0%, ${CHOCO} 70%)`}} />
      <Chocolate y={-60} gota={1.4} />
      <div style={{position: 'absolute', top: 700, width: '100%', textAlign: 'center'}}>
        <Img src={staticFile('logos/logo_westhill_blanco_total.png')} style={{width: 520, opacity: a, transform: `translateY(${(1 - a) * 24}px)`}} />
        <div style={{width: 360 * b, height: 4, background: CARAMELO, margin: '40px auto', borderRadius: 2}} />
        <div style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 70, color: CARAMELO, opacity: b, transform: `translateY(${(1 - b) * 24}px)`}}>Coordinación de</div>
        <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 116, color: CREMA, letterSpacing: 3, opacity: b, transform: `translateY(${(1 - b) * 34}px)`}}>INCLUSIÓN</div>
      </div>
      <Sfx at={8} name="ding" volume={0.3} />
    </AbsoluteFill>
  );
};

// montaje: [clip, segundo de entrada, duración en cuadros]
const TOMAS: [number, number, number][] = [
  // origen del cacao y cómo llegó al mundo (180)
  [7, 5.0, COMPAS],
  [11, 0.2, COMPAS],
  [9, 1.0, COMPAS / 2],
  [6, 2.0, COMPAS / 2],
  // del grano al chocolate (180)
  [15, 0.4, COMPAS],
  [21, 1.0, COMPAS],
  [26, 0.2, COMPAS],
  // con todos los sentidos (180)
  [12, 2.0, COMPAS / 2],
  [19, 0.5, COMPAS / 2],
  [22, 3.0, COMPAS],
  [23, 2.5, COMPAS / 2],
  [17, 1.0, COMPAS / 2],
  // despedida (108)
  [27, 3.2, 108], // el chico saluda/despide al final de la toma
];
const INTRO = 2 * COMPAS;
const MONTAJE = TOMAS.reduce((a, t) => a + t[2], 0);
const CIERRE = 90;
export const CHOCO_FRAMES = INTRO + MONTAJE + CIERRE;
// textos por bloque: [inicio en el montaje, duración, líneas]
const TEXTOS: [number, number, {at: number; partes: Parte[]}[]][] = [
  [0, 180, [
    {at: 14, partes: [['Descubrimos el origen del '], ['cacao', true]]},
    {at: 120, partes: [['y cómo llegó a todo el mundo']]},
  ]],
  [180, 180, [{at: 16, partes: [['Vimos cómo el grano se transforma en '], ['chocolate', true]]}]],
  [360, 180, [{at: 12, partes: [['Lo exploramos con todos los '], ['sentidos', true]]}]],
  [540, MONTAJE - 540, [{at: 10, partes: [['Aprender también es salir y descubrir '], ['juntos', true]]}]],
];
// cortinas de chocolate: al salir de la intro, entre los primeros bloques y antes del cierre
const CORTES_CORTINA = [INTRO, INTRO + 180, INTRO + MONTAJE];

export const MuseoChocolate: React.FC<{music?: boolean}> = ({music = true}) => {
  let t = INTRO;
  return (
    <AbsoluteFill style={{background: CHOCO}}>
      <Sequence durationInFrames={INTRO + CORTINA / 2}>
        <Intro />
      </Sequence>
      {TOMAS.map(([n, desde, dur], i) => {
        const from = t;
        t += dur;
        // se funde sobre la toma anterior, salvo justo después de una cortina
        const funde = CORTES_CORTINA.includes(from) ? 0 : FUNDE;
        return (
          <Sequence key={i} from={from - funde} durationInFrames={dur + funde}>
            <Clip n={n} desde={desde} dur={dur + funde} funde={funde} />
          </Sequence>
        );
      })}
      {TEXTOS.map(([at, dur, lineas]) => (
        <Sequence key={at} from={INTRO + at} durationInFrames={dur}>
          <Texto lineas={lineas} dur={dur} />
        </Sequence>
      ))}
      <Sequence from={INTRO + MONTAJE}>
        <Cierre />
      </Sequence>
      {CORTES_CORTINA.map((c) => (
        <Sequence key={c} from={c - CORTINA / 2} durationInFrames={CORTINA}>
          <Cortina />
          <Sfx at={0} name="whoosh" volume={0.3} />
        </Sequence>
      ))}
      <Banderin />
      <Grain opacity={0.04} />
      {music && <Audio src={staticFile('music/chocolate.mp3')} volume={(fr) => interpolate(fr, [0, 6, CHOCO_FRAMES - 30, CHOCO_FRAMES], [0, 0.55, 0.55, 0], clamp)} />}
    </AbsoluteFill>
  );
};
export const CHOCO_W = W;
export const CHOCO_H = H;
