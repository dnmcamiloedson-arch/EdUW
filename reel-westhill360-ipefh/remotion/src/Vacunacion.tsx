import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from './components';
import {Sfx} from './shots';
import {F, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Jornada de Vacunación contra la influenza (5 de noviembre de 2026).
//  1. Intro que invita a vacunarse, con el estilo del póster (papel crema, azul, amarillo, papel rasgado).
//  2. El póster se arma pieza por pieza con las capas del cliente (public/photos/vacuna, posiciones
//     medidas contra el diseño original de 1292x2000). Los elementos que no venían en capas
//     (logo, "CONTRA LA INFLUENZA", "Tu salud merece…", redes) se recortan del propio original, y al final
//     se funde con la imagen original para que el resultado sea idéntico al diseño.
// El video tiene las mismas proporciones que el póster (1080x1672), así que nada se recorre ni se recorta.
// ---------------------------------------------------------------------------
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const CREMA = '#F5F2EA';
const NAVY = '#043971';
const AZUL = '#1565B5';
const AMARILLO = '#F7C531';
const capa = (n: string) => staticFile(`photos/vacuna/${n}.png`);

type Caja = {x: number; y: number; w: number; h: number};
const P: Record<string, Caja> = {
  cuidarte: {x: 231, y: 272, w: 831, h: 79},
  jornada: {x: 216, y: 376, w: 877, h: 142},
  cinta: {x: 0, y: 523, w: 1292, h: 278},
  vacunacion: {x: 62, y: 547, w: 1176, h: 213},
  parche: {x: 40, y: 959.6, w: 656, h: 228},
  fecha: {x: 88, y: 1005, w: 553, h: 83},
  anio: {x: 275, y: 1092, w: 162, h: 56},
  hora: {x: 76, y: 1213, w: 498, h: 114},
  linea1: {x: 159, y: 1377, w: 281, h: 15},
  lugar: {x: 83, y: 1406, w: 499, h: 137},
  linea2: {x: 232, y: 1605, w: 284, h: 25},
  lince: {x: 576, y: 812, w: 715, h: 1108},
  esquina_sup: {x: 2, y: 0, w: 414, h: 331},
  semitono: {x: 818, y: 16, w: 471, h: 402},
  esquina_izq: {x: 0, y: 1386, w: 256, h: 461},
  verde: {x: 1180, y: 1648, w: 111, h: 182},
  ondas: {x: 8, y: 1710, w: 1279, h: 290},
  linea_ola: {x: 6, y: 1728, w: 1279, h: 271},
};
export const VAC_W = 1080;
export const VAC_H = 1672; // misma proporción que el póster (1292x2000)
const K = VAC_W / 1292;
const OX = 0;
const OY = 0;
const EXTRA = 0;
/** piezas recortadas del original (caja en coordenadas del póster) */
const RECORTE: Record<string, Caja> = {
  logo: {x: 400, y: 25, w: 495, h: 207},
  contra: {x: 66, y: 812, w: 742, h: 74},
  tusalud: {x: 140, y: 1670, w: 532, h: 106},
  redes: {x: 760, y: 1914, w: 512, h: 76},
};
const Recorte: React.FC<{n: string; style?: React.CSSProperties}> = ({n, style}) => {
  const c = RECORTE[n];
  return (
    <div style={{position: 'absolute', left: c.x, top: c.y, width: c.w, height: c.h, ...style}}>
      <Img src={capa(n)} style={{width: '100%', height: '100%', display: 'block'}} />
    </div>
  );
};

const Pieza: React.FC<{n: string; dy?: number; style?: React.CSSProperties; img?: React.CSSProperties}> = ({n, dy = 0, style, img}) => {
  const c = P[n];
  return (
    <div style={{position: 'absolute', left: c.x, top: c.y + dy, width: c.w, height: c.h, ...style}}>
      <Img src={capa(n)} style={{width: '100%', height: '100%', display: 'block', ...img}} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// 1. Intro
// ---------------------------------------------------------------------------
export const INTRO_F = 300;
const Papel: React.FC = () => (
  <AbsoluteFill style={{background: CREMA}}>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 60%, rgba(150,130,90,0.12) 100%)'}} />
  </AbsoluteFill>
);
/** Texto sobre una tira de papel rasgado (las capas del póster) */
const Tira: React.FC<{texto: string; at: number; tipo: 'cinta' | 'parche'; top: number; size?: number; color?: string}> = ({texto, at, tipo, top, size = 110, color}) => {
  const f = useCurrentFrame();
  const abre = tw(f, [at, at + 12], [0, 100], ease.inOut);
  const t = tw(f, [at + 6, at + 18], [0, 1], ease.back);
  const ancho = tipo === 'cinta' ? 1080 : 900;
  return (
    <div style={{position: 'absolute', top, left: (1080 - ancho) / 2, width: ancho, height: size * 2.1}}>
      <Img src={capa(tipo)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', clipPath: `inset(0 ${(100 - abre) / 2}% 0 ${(100 - abre) / 2}%)`}} />
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', fontFamily: F.sans, fontWeight: 900, fontSize: size, letterSpacing: -2, color: color ?? (tipo === 'cinta' ? '#fff' : NAVY), transform: `scale(${t})`}}>{texto}</div>
    </div>
  );
};
const Linea: React.FC<{texto: string; at: number; top: number; size?: number; peso?: number; color?: string}> = ({texto, at, top, size = 64, peso = 800, color = NAVY}) => {
  const f = useCurrentFrame();
  const p = tw(f, [at, at + 14], [0, 1]);
  return (
    <div style={{position: 'absolute', top, width: '100%', textAlign: 'center', fontFamily: F.sans, fontWeight: peso, fontSize: size, color, opacity: p, transform: `translateY(${(1 - p) * 30}px)`, filter: `blur(${(1 - p) * 6}px)`}}>{texto}</div>
  );
};
const Copo: React.FC<{i: number}> = ({i}) => {
  const f = useCurrentFrame();
  const x = ((i * 137) % 1000) + 40 + Math.sin(f / 18 + i) * 20;
  const y = ((f * (2 + (i % 3)) + i * 211) % 2100) - 100;
  const s = 24 + (i % 4) * 10;
  return (
    <svg width={s} height={s} viewBox="-12 -12 24 24" style={{position: 'absolute', left: x, top: y, opacity: 0.55, transform: `rotate(${f * 2 + i * 30}deg)`}}>
      {[0, 60, 120].map((a) => (
        <line key={a} x1={-10} y1={0} x2={10} y2={0} stroke={AZUL} strokeWidth={2.4} strokeLinecap="round" transform={`rotate(${a})`} />
      ))}
    </svg>
  );
};
const Virus: React.FC<{x: number; y: number; s: number; at: number; i: number}> = ({x, y, s, at, i}) => {
  const f = useCurrentFrame();
  const p = tw(f, [at, at + 14], [0, 1], ease.back);
  const tiembla = Math.sin(f * 0.9 + i) * 4;
  return (
    <svg width={s} height={s} viewBox="-60 -60 120 120" style={{position: 'absolute', left: x + tiembla, top: y + Math.cos(f / 12 + i) * 10, transform: `scale(${p}) rotate(${f * (i % 2 ? 1 : -1)}deg)`}}>
      {Array.from({length: 10}, (_, k) => (
        <g key={k} transform={`rotate(${k * 36})`}>
          <line x1={0} y1={-34} x2={0} y2={-50} stroke="#2E9B6B" strokeWidth={6} strokeLinecap="round" />
          <circle cx={0} cy={-52} r={6} fill="#2E9B6B" />
        </g>
      ))}
      <circle r={36} fill="#3FB27F" stroke="#2E9B6B" strokeWidth={5} />
      <circle cx={-10} cy={-8} r={6} fill="#2E9B6B" />
      <circle cx={12} cy={10} r={8} fill="#2E9B6B" />
    </svg>
  );
};
/** Cronómetro: la aguja da una vuelta rápida */
const Cronometro: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  const p = tw(f, [at, at + 12], [0, 1], ease.back);
  const giro = tw(f, [at + 10, at + 40], [0, 360], ease.inOut);
  return (
    <svg width={260} height={290} viewBox="-130 -160 260 290" style={{position: 'absolute', left: 410, top: 520, transform: `scale(${p})`}}>
      <rect x={-22} y={-150} width={44} height={26} rx={8} fill={NAVY} />
      <circle r={110} fill="#fff" stroke={NAVY} strokeWidth={14} />
      <circle r={86} fill="none" stroke={AMARILLO} strokeWidth={10} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - giro / 360} transform="rotate(-90)" />
      <line x1={0} y1={0} x2={0} y2={-74} stroke={NAVY} strokeWidth={10} strokeLinecap="round" transform={`rotate(${giro})`} />
      <circle r={12} fill={NAVY} />
    </svg>
  );
};
/** Escudo que se dibuja con palomita */
const Escudo: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  const p = tw(f, [at, at + 22], [0, 1], ease.inOut);
  const ok = tw(f, [at + 18, at + 30], [0, 1], ease.inOut);
  const late = 1 + 0.04 * Math.sin(f / 6) * (f > at + 30 ? 1 : 0);
  return (
    <svg width={300} height={340} viewBox="-150 -170 300 340" style={{position: 'absolute', left: 390, top: 500, transform: `scale(${late})`}}>
      <path d="M0 -150 L120 -105 L120 0 C120 80 60 130 0 155 C-60 130 -120 80 -120 0 L-120 -105 Z" fill={AZUL} fillOpacity={p * 0.15} stroke={AZUL} strokeWidth={14} strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
      <path d="M-50 0 L-12 38 L58 -40" fill="none" stroke={AMARILLO} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ok} />
    </svg>
  );
};
const Escena: React.FC<{from: number; dur: number; children: React.ReactNode}> = ({from, dur, children}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [from, from + 8, from + dur - 8, from + dur], [0, 1, 1, 0], clamp);
  const s = interpolate(f, [from, from + dur], [1.04, 1], clamp);
  if (f < from || f > from + dur) return null;
  return <AbsoluteFill style={{opacity: o, transform: `scale(${s})`}}>{children}</AbsoluteFill>;
};
const Intro: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {f < 80 && Array.from({length: 22}, (_, i) => <Copo key={i} i={i} />)}
      <Escena from={0} dur={78}>
        <Linea texto="Ya llegó" at={6} top={640} size={90} />
        <Tira texto="EL FRÍO ❄️" at={20} tipo="cinta" top={760} size={150} />
      </Escena>
      <Escena from={74} dur={74}>
        <Linea texto="y con él…" at={78} top={600} size={80} peso={700} />
        <div style={{position: 'absolute', top: 730, width: '100%', textAlign: 'center', whiteSpace: 'nowrap', fontFamily: F.sans, fontWeight: 900, fontSize: 124, letterSpacing: -4, color: NAVY, transform: `scale(${tw(f, [90, 102], [0, 1], ease.back)}) rotate(${Math.sin(f * 1.2) * 1.2}deg)`}}>LA INFLUENZA</div>
        {[
          [80, 320, 170, 92],
          [800, 280, 140, 96],
          [140, 1080, 150, 100],
          [760, 1040, 200, 98],
          [470, 1240, 120, 104],
        ].map(([x, y, s, at], i) => (
          <Virus key={i} x={x} y={y} s={s} at={at} i={i} />
        ))}
      </Escena>
      <Escena from={144} dur={76}>
        <Cronometro at={148} />
        <Linea texto="Vacunarte toma" at={156} top={880} size={80} peso={700} />
        <Tira texto="unos segundos" at={166} tipo="parche" top={990} size={110} />
      </Escena>
      <Escena from={216} dur={84}>
        <Escudo at={220} />
        <Linea texto="y te protege durante" at={234} top={900} size={70} peso={700} />
        <Tira texto="TODA LA TEMPORADA" at={244} tipo="cinta" top={1000} size={84} />
        <Linea texto="Cuídate tú. Cuida a los tuyos. 💙" at={262} top={1270} size={50} peso={700} color={AZUL} />
      </Escena>
      <Sfx at={20} name="hist_paper" volume={0.6} />
      <Sfx at={90} name="impact" volume={0.5} />
      <Sfx at={92} name="pop" volume={0.4} />
      <Sfx at={158} name="hist_typing" volume={0.5} />
      <Sfx at={166} name="hist_paper" volume={0.6} />
      <Sfx at={238} name="ding" volume={0.45} />
      <Sfx at={244} name="hist_paper" volume={0.6} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 2. El póster se arma
// ---------------------------------------------------------------------------
export const POSTER_F = 360;
const Poster: React.FC = () => {
  const f = useCurrentFrame();
  const t = (a: number, b: number, e = ease.out) => tw(f, [a, b], [0, 1], e);
  // decoración
  const esq = t(0, 20);
  const semi = t(4, 26);
  const izq = t(10, 30);
  const ond = t(12, 32);
  const ola = t(22, 48, ease.inOut);
  const verde = t(26, 40);
  // textos
  const logo = t(30, 50);
  const cuid = t(44, 64, ease.inOut);
  const jor = t(58, 72, ease.back);
  const cinta = t(72, 86, ease.inOut);
  const vac = t(80, 92, ease.back);
  const contra = t(94, 108);
  const lince = t(104, 132, ease.back);
  const parche = t(120, 132, ease.back);
  const fecha = t(128, 138, ease.back);
  const anio = t(136, 146);
  const hora = t(148, 160, ease.back);
  const l1 = t(160, 172, ease.inOut);
  const lugar = t(166, 182);
  const l2 = t(178, 190, ease.inOut);
  const salud = t(188, 206);
  const redes = (_: number) => t(202, 226, ease.inOut);
  const flash = interpolate(f, [80, 82, 92], [0, 0.5, 0], clamp);
  // West se mece un poco y se detiene antes de fundirse con el original
  const respira = Math.sin(f / 22) * (1 - tw(f, [215, 240], [0, 1]));
  const final = tw(f, [240, 262], [0, 1], ease.inOut);
  return (
    <AbsoluteFill style={{background: CREMA, overflow: 'hidden'}}>
      <AbsoluteFill>
        <div style={{position: 'absolute', left: OX, top: OY, width: 1292, height: 2000, transformOrigin: '0 0', transform: `scale(${K})`}}>
          {/* decoración */}
          <Pieza n="esquina_sup" dy={-EXTRA} style={{transformOrigin: '0 0', transform: `scale(${1 + 0 * esq}) translate(${(1 - esq) * -420}px, ${(1 - esq) * -340}px)`}} />
          <Pieza n="semitono" dy={-EXTRA} style={{opacity: semi, transformOrigin: '100% 0', transform: `scale(${0.6 + 0.4 * semi})`}} />
          <Pieza n="esquina_izq" style={{transform: `translateX(${(1 - izq) * -260}px)`}} />
          {/* logo */}
          <Recorte n="logo" style={{clipPath: `inset(${(1 - logo) * 100}% 0 0 0)`, transform: `translateY(${(1 - logo) * 30}px)`}} />
          {/* títulos */}
          <Pieza n="cuidarte" style={{clipPath: `inset(0 ${(1 - cuid) * 100}% 0 0)`}} />
          <Pieza n="jornada" style={{opacity: Math.min(1, jor * 2), transformOrigin: '50% 100%', transform: `translateY(${(1 - jor) * -160}px) scale(${0.7 + 0.3 * jor})`}} />
          <Pieza n="cinta" style={{clipPath: `inset(0 ${(1 - cinta) * 50}% 0 ${(1 - cinta) * 50}%)`}} />
          <Pieza n="vacunacion" style={{opacity: Math.min(1, vac * 3), transform: `scale(${1.6 - 0.6 * vac})`, filter: `blur(${(1 - Math.min(1, vac)) * 8}px)`}} />
          <Recorte n="contra" style={{clipPath: `inset(0 ${(1 - contra) * 100}% 0 0)`}} />
          {/* West */}
          <Pieza
            n="lince"
            style={{transformOrigin: '60% 100%', transform: `translateY(${(1 - lince) * 700}px) rotate(${respira * 0.8 * Math.min(1, lince)}deg)`, opacity: Math.min(1, lince * 3)}}
          />
          {/* ondas de abajo delante de West, como en el original */}
          <Pieza n="verde" dy={EXTRA} style={{transform: `translateX(${(1 - verde) * 120}px)`}} />
          <Pieza n="ondas" dy={EXTRA} style={{transform: `translateY(${(1 - ond) * 320}px)`}} />
          <Pieza n="linea_ola" dy={EXTRA} style={{clipPath: `inset(0 ${(1 - ola) * 100}% 0 0)`}} />
          {/* datos */}
          <Pieza n="parche" style={{transform: `scale(${parche}) rotate(${(1 - parche) * -8}deg)`}} />
          <Pieza n="fecha" style={{transform: `scale(${1.5 - 0.5 * fecha})`, opacity: Math.min(1, fecha * 2)}} />
          <Pieza n="anio" style={{opacity: anio, transform: `translateY(${(1 - anio) * 20}px)`}} />
          <Pieza n="hora" style={{transform: `scale(${hora})`, transformOrigin: '0% 50%'}} />
          <Pieza n="linea1" style={{clipPath: `inset(0 ${(1 - l1) * 100}% 0 0)`}} />
          <Pieza n="lugar" style={{opacity: lugar, transform: `translateY(${(1 - lugar) * 24}px)`}} />
          <Pieza n="linea2" style={{clipPath: `inset(0 ${(1 - l2) * 100}% 0 0)`}} />
          <Recorte n="tusalud" style={{opacity: salud, transform: `translateY(${(1 - salud) * 20}px)`}} />
          {/* redes: entran de izquierda a derecha */}
          <Recorte n="redes" style={{clipPath: `inset(0 ${(1 - redes(0)) * 100}% 0 0)`}} />
        </div>
      </AbsoluteFill>
      {/* al final se funde con el diseño original: queda idéntico */}
      <AbsoluteFill style={{opacity: final}}>
        <Img src={capa('original')} style={{width: VAC_W, height: VAC_H}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
      <Sfx at={30} name="click" volume={0.4} />
      <Sfx at={44} name="hist_typing" volume={0.4} />
      <Sfx at={58} name="impact" volume={0.5} />
      <Sfx at={72} name="hist_paper" volume={0.7} />
      <Sfx at={80} name="impact" volume={0.7} />
      <Sfx at={94} name="whoosh" volume={0.4} />
      <Sfx at={104} name="whoosh_largo" volume={0.45} />
      <Sfx at={120} name="pop" volume={0.5} />
      <Sfx at={128} name="hist_stamp" volume={0.7} />
      <Sfx at={148} name="pop" volume={0.5} />
      <Sfx at={166} name="whoosh" volume={0.3} />
      <Sfx at={188} name="flicker" volume={0.35} />
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={i} at={202 + i * 5} name="pop" volume={0.35} />
      ))}
    </AbsoluteFill>
  );
};

const Barrido: React.FC = () => {
  const f = useCurrentFrame();
  const y = interpolate(f, [0, 12, 30], [VAC_H, -460, -2800], {...clamp, easing: ease.inOut});
  return (
    <>
      <Img src={capa('cinta')} style={{position: 'absolute', left: -60, width: 1200, height: 2600, top: y}} />
      <Sfx at={0} name="whoosh_largo" volume={0.5} />
    </>
  );
};

export const VACUNA_FRAMES = INTRO_F + POSTER_F;
export const Vacunacion: React.FC<{music?: boolean}> = ({music = true}) => (
  <AbsoluteFill style={{background: CREMA}}>
    <Sequence durationInFrames={INTRO_F + 2}>
      <AbsoluteFill style={{background: CREMA}}>
        <Papel />
        <div style={{position: 'absolute', left: (VAC_W - 1080 * (VAC_H / 1920)) / 2, top: 0, width: 1080, height: 1920, transformOrigin: '0 0', transform: `scale(${VAC_H / 1920})`}}>
          <Intro />
        </div>
      </AbsoluteFill>
    </Sequence>
    <Sequence from={INTRO_F}>
      <Poster />
    </Sequence>
    {/* barrido entre la intro y el póster: tira azul rasgada que sube y cruza toda la pantalla */}
    <Sequence from={INTRO_F - 12} durationInFrames={30}>
      <Barrido />
    </Sequence>
    <Grain opacity={0.035} />
    {music && <Audio src={staticFile('music/vacuna.mp3')} volume={(fr) => interpolate(fr, [0, 10, VACUNA_FRAMES - 30, VACUNA_FRAMES], [0, 0.6, 0.6, 0], clamp)} />}
  </AbsoluteFill>
);
