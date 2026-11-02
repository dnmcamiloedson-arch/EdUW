import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from './components';
import {Sfx} from './shots';
import {F, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Día de Muertos (2 de noviembre). Historia 9:16.
//  1. Intro nocturna: una vela se enciende y caen pétalos de cempasúchil; frases para recordar.
//  2. El póster del cliente (imagen plana) se arma por piezas: scripts/capas_muertos.py lo separa en capas
//     por color (y la calavera con rembg) y reconstruye el fondo; al final se funde con el original.
// ---------------------------------------------------------------------------
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const S = 1080 / 941; // escala del póster (941x1672) al video
const CEMPA = '#F28C1B';
const AZUL = '#1857B0';
const capa = (n: string) => staticFile(`photos/muertos/${n}.png`);

type Caja = {x: number; y: number; w: number; h: number};
const P: Record<string, Caja> = {
  papel_izq: {x: 0, y: 0, w: 294, h: 284},
  papel_der: {x: 556, y: 0, w: 385, h: 334},
  logo: {x: 276, y: 101, w: 393, h: 167},
  fecha: {x: 215, y: 282, w: 513, h: 28},
  rayos_izq: {x: 36, y: 381, w: 153, h: 178},
  rayos_der: {x: 786, y: 381, w: 136, h: 188},
  dia_de: {x: 181, y: 370, w: 615, h: 182},
  cinta: {x: 71, y: 541, w: 828, h: 238},
  frase: {x: 111, y: 813, w: 391, h: 246},
  subraya: {x: 168, y: 1051, w: 316, h: 63},
  corazon1: {x: 762, y: 272, w: 127, h: 123},
  corazon2: {x: 771, y: 786, w: 123, h: 123},
  flor: {x: 131, y: 1147, w: 173, h: 167},
  brillo1: {x: 858, y: 326, w: 71, h: 78},
  brillo2: {x: 661, y: 814, w: 76, h: 80},
  brillo3: {x: 66, y: 1171, w: 80, h: 83},
  ola_izq: {x: 0, y: 557, w: 164, h: 632},
  altar: {x: 0, y: 876, w: 941, h: 796},
  calavera: {x: 315, y: 1082, w: 495, h: 533},
};
const Pieza: React.FC<{n: string; style?: React.CSSProperties}> = ({n, style}) => {
  const c = P[n];
  return (
    <div style={{position: 'absolute', left: c.x, top: c.y, width: c.w, height: c.h, ...style}}>
      <Img src={capa(n)} style={{width: '100%', height: '100%', display: 'block'}} />
    </div>
  );
};

/** Pétalos de cempasúchil que caen girando */
const Petalos: React.FC<{n?: number; opacidad?: number}> = ({n = 26, opacidad = 1}) => {
  const f = useCurrentFrame();
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const vel = 2.2 + (i % 5) * 0.6;
        const y = ((f * vel + i * 173) % 2200) - 140;
        const x = ((i * 241) % 1080) + Math.sin(f / (22 + (i % 7)) + i) * 50;
        const s = 26 + (i % 4) * 9;
        return (
          <svg key={i} width={s} height={s * 1.3} viewBox="-10 -13 20 26" style={{position: 'absolute', left: x, top: y, opacity: opacidad * (0.65 + (i % 3) * 0.12), transform: `rotate(${f * (i % 2 ? 3 : -3) + i * 40}deg) scaleX(${Math.cos(f / 9 + i)})`}}>
            <path d="M0 -12 C8 -6 8 6 0 12 C-8 6 -8 -6 0 -12 Z" fill={i % 3 ? CEMPA : '#FFB347'} />
          </svg>
        );
      })}
    </>
  );
};

/** Vela con llama que titila */
const Vela: React.FC<{enciende: number}> = ({enciende}) => {
  const f = useCurrentFrame();
  const on = tw(f, [enciende, enciende + 14], [0, 1], ease.out);
  const tit = 1 + 0.08 * Math.sin(f * 0.9) + 0.05 * Math.sin(f * 2.3);
  return (
    <div style={{position: 'absolute', left: 540 - 90, top: 1060, width: 180, height: 420}}>
      {/* halo */}
      <div style={{position: 'absolute', left: 90 - 420, top: -40 - 420, width: 840, height: 840, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,190,90,0.55) 0%, rgba(255,150,40,0.18) 35%, rgba(0,0,0,0) 70%)', opacity: on * (0.85 + 0.15 * Math.sin(f * 0.7)), transform: `scale(${tit})`}} />
      {/* llama */}
      <svg width={80} height={120} viewBox="-40 -110 80 120" style={{position: 'absolute', left: 50, top: -100, opacity: on, transformOrigin: '50% 100%', transform: `scale(${on * tit}) rotate(${Math.sin(f * 0.5) * 3}deg)`}}>
        <path d="M0 -105 C22 -70 30 -40 22 -18 C16 -2 -16 -2 -22 -18 C-30 -40 -22 -70 0 -105 Z" fill="#FFB02E" />
        <path d="M0 -75 C12 -52 16 -34 11 -20 C7 -10 -7 -10 -11 -20 C-16 -34 -12 -52 0 -75 Z" fill="#FFF3C4" />
      </svg>
      {/* cuerpo */}
      <div style={{position: 'absolute', left: 30, top: 10, width: 120, height: 300, borderRadius: '14px 14px 8px 8px', background: 'linear-gradient(90deg, #E9E1D2, #FFFDF7 45%, #D9CFBE)', boxShadow: `0 0 ${60 * on}px rgba(255,180,80,${0.5 * on})`}} />
      <div style={{position: 'absolute', left: 88, top: -4, width: 4, height: 18, background: '#3A2A1A', borderRadius: 2}} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// 1. Intro
// ---------------------------------------------------------------------------
export const INTRO_F = 255;
const Frase: React.FC<{texto: string; at: number; hasta: number; top: number; size?: number; script?: boolean; color?: string}> = ({texto, at, hasta, top, size = 64, script, color = '#FFF5E6'}) => {
  const f = useCurrentFrame();
  const p = tw(f, [at, at + 18], [0, 1]);
  const o = tw(f, [hasta - 12, hasta], [1, 0]);
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 70,
        right: 70,
        textAlign: 'center',
        fontFamily: script ? F.script : F.sans,
        fontWeight: script ? 400 : 700,
        fontSize: size,
        lineHeight: 1.2,
        color,
        opacity: p * o,
        filter: `blur(${(1 - p) * 8}px)`,
        transform: `translateY(${(1 - p) * 20}px)`,
        textShadow: script ? `0 0 26px rgba(255,170,60,0.7)` : '0 4px 20px rgba(0,0,0,0.6)',
      }}
    >
      {texto}
    </div>
  );
};
const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const sale = tw(f, [INTRO_F - 22, INTRO_F], [0, 1], ease.in);
  return (
    <AbsoluteFill style={{background: '#0B0D1A', overflow: 'hidden'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 70%, rgba(80,40,120,0.45) 0%, rgba(11,13,26,0) 60%)'}} />
      <Petalos n={22} opacidad={tw(f, [30, 70], [0, 1])} />
      <Vela enciende={20} />
      <Frase texto="Hoy, 2 de noviembre," at={34} hasta={110} top={430} size={60} />
      <Frase texto="encendemos una luz" at={58} hasta={110} top={520} size={110} script color="#FFC46B" />
      <Frase texto="por quienes ya no están…" at={112} hasta={180} top={460} size={60} />
      <Frase texto="pero siguen con nosotros" at={180} hasta={INTRO_F} top={420} size={60} />
      <Frase texto="en cada recuerdo 🧡" at={200} hasta={INTRO_F} top={510} size={104} script color="#FFC46B" />
      {/* destello cálido hacia el póster */}
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 62%, #FFE7BF 0%, #F6EEDF 60%)', opacity: sale}} />
      <Sfx at={18} name="click" volume={0.4} />
      <Sfx at={20} name="flicker" volume={0.35} />
      <Sfx at={180} name="ding" volume={0.3} />
      <Sfx at={INTRO_F - 22} name="whoosh_largo" volume={0.45} />
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
  const fondo = t(0, 14);
  const papel = t(8, 30, ease.back);
  const columpio = Math.sin(f / 14) * 6 * Math.exp(-Math.max(0, f - 30) / 70) * (1 - t(200, 240));
  const ola = t(14, 34);
  const logo = t(22, 40);
  const fecha = t(36, 50, ease.inOut);
  const dia = t(48, 62, ease.back);
  const rayos = t(58, 70, ease.back);
  const cinta = t(66, 82, ease.inOut);
  const frase = t(84, 110, ease.inOut);
  const sub = t(106, 118, ease.inOut);
  const altar = t(114, 140);
  const cal = t(134, 152, ease.back);
  const deco = (at: number) => t(at, at + 12, ease.back);
  const late = (at: number) => (f > at + 12 ? 1 + 0.06 * Math.max(0, Math.sin(((f - at) / 30) * Math.PI * 2)) ** 6 : 1);
  const llama = t(150, 165) * (0.75 + 0.25 * Math.sin(f * 0.8) + 0.1 * Math.sin(f * 2.1));
  const final = t(300, 330, ease.inOut);
  const respira = 1 + 0.012 * tw(f, [150, 300], [0, 1], ease.inOut);
  return (
    <AbsoluteFill style={{background: '#F6EEDF', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: (1920 - 1672 * S) / 2, width: 941, height: 1672, transformOrigin: '0 0', transform: `scale(${S * respira})`}}>
        <AbsoluteFill style={{opacity: fondo}}>
          <Img src={capa('fondo')} style={{width: 941, height: 1672}} />
        </AbsoluteFill>
        {/* decoración */}
        <Pieza n="ola_izq" style={{transform: `translateX(${(1 - ola) * -170}px)`}} />
        <Pieza n="papel_izq" style={{transformOrigin: '0% 0%', transform: `translateY(${(1 - papel) * -300}px) rotate(${columpio}deg)`}} />
        <Pieza n="papel_der" style={{transformOrigin: '100% 0%', transform: `translateY(${(1 - papel) * -340}px) rotate(${-columpio}deg)`}} />
        {/* textos */}
        <Pieza n="logo" style={{clipPath: `inset(${(1 - logo) * 100}% 0 0 0)`, transform: `translateY(${(1 - logo) * 24}px)`}} />
        <Pieza n="fecha" style={{clipPath: `inset(0 ${(1 - fecha) * 50}% 0 ${(1 - fecha) * 50}%)`}} />
        <Pieza n="dia_de" style={{opacity: Math.min(1, dia * 2), transformOrigin: '50% 100%', transform: `translateY(${(1 - dia) * -120}px) scale(${0.7 + 0.3 * dia})`}} />
        <Pieza n="rayos_izq" style={{transformOrigin: '100% 50%', transform: `scale(${rayos})`}} />
        <Pieza n="rayos_der" style={{transformOrigin: '0% 50%', transform: `scale(${rayos})`}} />
        <Pieza n="cinta" style={{clipPath: `inset(0 ${(1 - cinta) * 100}% 0 0)`, transform: `rotate(${(1 - cinta) * -2}deg)`}} />
        <Pieza n="frase" style={{clipPath: `inset(0 0 ${(1 - frase) * 100}% 0)`}} />
        <Pieza n="subraya" style={{clipPath: `inset(0 ${(1 - sub) * 100}% 0 0)`}} />
        {/* altar: flores, vela y la calavera */}
        <Pieza n="altar" style={{transform: `translateY(${(1 - altar) * 800}px)`}} />
        <Pieza n="flor" style={{transform: `scale(${deco(150)}) rotate(${(1 - deco(150)) * -90 + Math.sin(f / 30) * 4}deg)`}} />
        {/* la calavera ya viene en el altar: aquí solo late en su lugar */}
        <Pieza n="calavera" style={{transformOrigin: '50% 85%', transform: `translateY(${(1 - altar) * 800}px) scale(${1 + 0.1 * Math.sin(cal * Math.PI)})`}} />
        {/* brillo de la vela del póster */}
        <div style={{position: 'absolute', left: 810 - 140, top: 990 - 140, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,200,110,0.55) 0%, rgba(255,170,60,0) 65%)', opacity: llama * (1 - final), mixBlendMode: 'screen'}} />
        {/* corazones y destellos */}
        <Pieza n="corazon1" style={{transform: `scale(${deco(160) * late(160)})`}} />
        <Pieza n="corazon2" style={{transform: `scale(${deco(168) * late(168)})`}} />
        <Pieza n="brillo1" style={{transform: `scale(${deco(174) * (1 + 0.15 * Math.sin(f / 6))}) rotate(${f}deg)`}} />
        <Pieza n="brillo2" style={{transform: `scale(${deco(180) * (1 + 0.15 * Math.sin(f / 6 + 2))}) rotate(${-f}deg)`}} />
        <Pieza n="brillo3" style={{transform: `scale(${deco(186) * (1 + 0.15 * Math.sin(f / 6 + 4))}) rotate(${f}deg)`}} />
        {/* al final queda idéntico al diseño */}
        <AbsoluteFill style={{opacity: final}}>
          <Img src={capa('original')} style={{width: 941, height: 1672}} />
        </AbsoluteFill>
      </div>
      <Petalos n={14} opacidad={0.6 * (1 - t(280, 320))} />
      <Sfx at={8} name="hist_paper" volume={0.6} />
      <Sfx at={22} name="click" volume={0.4} />
      <Sfx at={48} name="impact" volume={0.5} />
      <Sfx at={58} name="pop" volume={0.45} />
      <Sfx at={66} name="hist_paper" volume={0.7} />
      <Sfx at={84} name="whoosh" volume={0.35} />
      <Sfx at={114} name="whoosh_largo" volume={0.45} />
      <Sfx at={134} name="hist_stamp" volume={0.7} />
      {[160, 168, 174, 180, 186].map((a) => (
        <Sfx key={a} at={a} name="pop" volume={0.3} />
      ))}
      <Sfx at={196} name="ding" volume={0.35} />
    </AbsoluteFill>
  );
};

export const MUERTOS_FRAMES = INTRO_F + POSTER_F;
export const DiaMuertos: React.FC<{music?: boolean}> = ({music = true}) => (
  <AbsoluteFill style={{background: '#0B0D1A'}}>
    <Sequence durationInFrames={INTRO_F}>
      <Intro />
    </Sequence>
    <Sequence from={INTRO_F}>
      <Poster />
    </Sequence>
    <Grain opacity={0.035} />
    {music && <Audio src={staticFile('music/dia_muertos.mp3')} volume={(fr) => interpolate(fr, [0, 15, MUERTOS_FRAMES - 30, MUERTOS_FRAMES], [0, 0.65, 0.65, 0], clamp)} />}
  </AbsoluteFill>
);
