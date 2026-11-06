import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from './components';
import {Banner, Sfx} from './shots';
import {F, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Historia de IG (9:16, 26 s): Coordinación de Inclusión en el Museo del Chocolate.
//  1. Intro: chocolate que escurre desde arriba y "Hoy fuimos al Museo del Chocolate".
//  2. Montaje de los clips de la visita, cortado al compás de la música (120 BPM, 1 compás = 2 s),
//     con cortinas de chocolate derretido entre bloques.
//  3. Cierre: "Coordinación de Inclusión" y el logo.
// El banderín UW va arriba a la derecha durante toda la historia.
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

/** Capa de chocolate derretido: un borde ondulado con gotas que cuelgan (y = dónde termina el chocolate) */
const GOTAS = [
  [60, 120, 46],
  [190, 260, 60],
  [330, 90, 40],
  [450, 330, 70],
  [600, 150, 50],
  [720, 240, 58],
  [850, 110, 44],
  [990, 290, 64],
];
const Chocolate: React.FC<{y: number; gota?: number; brillo?: boolean}> = ({y, gota = 1, brillo = true}) => {
  const f = useCurrentFrame();
  const borde = Array.from({length: 13}, (_, i) => {
    const x = (i / 12) * W;
    return `${x},${y + Math.sin(i * 1.7 + f / 9) * 14}`;
  }).join(' L');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="choco" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2E190F" />
          <stop offset="0.5" stopColor={LECHE} />
          <stop offset="1" stopColor="#2E190F" />
        </linearGradient>
      </defs>
      <path d={`M0,-10 L${W},-10 L${W},${y} L${borde.split(' L').reverse().join(' L')} Z`} fill="url(#choco)" />
      {GOTAS.map(([x, largo, ancho], i) => {
        const l = largo * gota * (0.8 + 0.2 * Math.sin(f / 13 + i));
        return (
          <g key={i}>
            <rect x={x - ancho / 2} y={y - 20} width={ancho} height={l + 20} fill="url(#choco)" />
            <circle cx={x} cy={y + l} r={ancho / 2} fill="url(#choco)" />
            {brillo && <rect x={x - ancho / 2 + ancho * 0.2} y={y} width={ancho * 0.14} height={Math.max(0, l - 10)} rx={ancho * 0.07} fill="rgba(255,226,190,0.22)" />}
          </g>
        );
      })}
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

/** Clip a pantalla completa con un ligero acercamiento al entrar y tono cálido */
const Clip: React.FC<{n: number; desde: number; dur: number}> = ({n, desde, dur}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, 8, dur], [1.08, 1.03, 1.0], {...clamp, easing: ease.out});
  return (
    <AbsoluteFill style={{background: CHOCO, overflow: 'hidden'}}>
      <OffthreadVideo src={vid(n)} startFrom={Math.round(desde * 30)} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})`, filter: 'sepia(0.12) saturate(1.08)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(59,33,22,0) 55%, rgba(59,33,22,0.55) 100%)'}} />
    </AbsoluteFill>
  );
};

/** Etiqueta fija durante el montaje */
const Etiqueta: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const p = tw(f, [10, 26], [0, 1]) * (1 - tw(f, [dur - 12, dur], [0, 1]));
  return (
    <div style={{position: 'absolute', top: 1560, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: p, transform: `translateY(${(1 - p) * 20}px)`}}>
      <div style={{padding: '14px 34px', borderRadius: 60, background: 'rgba(59,33,22,0.82)', border: `3px solid ${CARAMELO}`, fontFamily: F.sans, fontWeight: 800, fontSize: 44, color: CREMA, letterSpacing: 1}}>Museo del Chocolate</div>
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
      <div style={{position: 'absolute', top: 760, width: '100%', textAlign: 'center'}}>
        <div style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 70, color: CARAMELO, opacity: a, transform: `translateY(${(1 - a) * 24}px)`}}>Coordinación de</div>
        <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 116, color: CREMA, letterSpacing: 3, opacity: a, transform: `translateY(${(1 - a) * 34}px)`}}>INCLUSIÓN</div>
        <div style={{width: 360 * b, height: 4, background: CARAMELO, margin: '40px auto', borderRadius: 2}} />
        <Img src={staticFile('logos/logo_westhill_blanco_total.png')} style={{width: 520, opacity: b}} />
      </div>
      <Sfx at={8} name="ding" volume={0.3} />
    </AbsoluteFill>
  );
};

// montaje: [clip, segundo de entrada, duración en cuadros]
const TOMAS: [number, number, number][] = [
  [7, 5.0, COMPAS],
  [11, 0.2, COMPAS],
  [9, 1.0, COMPAS / 2],
  [6, 2.0, COMPAS / 2],
  [15, 0.4, COMPAS],
  [21, 1.0, COMPAS],
  [26, 0.2, COMPAS],
  [12, 2.0, COMPAS / 2],
  [19, 0.5, COMPAS / 2],
  [22, 3.0, COMPAS],
  [23, 2.5, COMPAS / 2],
  [17, 1.0, COMPAS / 2],
  [27, 3.2, 108], // el chico saluda/despide al final de la toma
];
const INTRO = 2 * COMPAS;
const MONTAJE = TOMAS.reduce((a, t) => a + t[2], 0);
const CIERRE = 90;
export const CHOCO_FRAMES = INTRO + MONTAJE + CIERRE;
// cortinas de chocolate: al salir de la intro, a mitad del montaje y antes del cierre
const CORTES_CORTINA = [INTRO, INTRO + 4 * COMPAS, INTRO + MONTAJE];

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
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <Clip n={n} desde={desde} dur={dur} />
          </Sequence>
        );
      })}
      <Sequence from={INTRO} durationInFrames={MONTAJE}>
        <Etiqueta dur={MONTAJE} />
      </Sequence>
      <Sequence from={INTRO + MONTAJE}>
        <Cierre />
      </Sequence>
      {CORTES_CORTINA.map((c) => (
        <Sequence key={c} from={c - CORTINA / 2} durationInFrames={CORTINA}>
          <Cortina />
          <Sfx at={0} name="whoosh" volume={0.3} />
        </Sequence>
      ))}
      <Banner />
      <Grain opacity={0.04} />
      {music && <Audio src={staticFile('music/chocolate.mp3')} volume={(fr) => interpolate(fr, [0, 6, CHOCO_FRAMES - 30, CHOCO_FRAMES], [0, 0.55, 0.55, 0], clamp)} />}
    </AbsoluteFill>
  );
};
export const CHOCO_W = W;
export const CHOCO_H = H;
