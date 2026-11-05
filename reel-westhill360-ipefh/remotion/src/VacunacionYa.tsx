import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from './components';
import {Sfx} from './shots';
import {F, ease, tw} from './theme';
import {AMARILLO, AZUL, capa, Escena, Linea, NAVY, Papel, Tira} from './Vacunacion';

// ---------------------------------------------------------------------------
// Historia rápida (9:16, 11 s) para avisar que la Jornada de Vacunación ya está abierta.
// Mismo estilo que el póster (papel crema, azul, amarillo, papel rasgado y West):
//  1. "¡Ya puedes ir a VACUNARTE!" con un sello de HOY.
//  2. El pin cae en el lugar: Foyer del Auditorio de la Universidad.
//  3. Tarjeta final: logo, "¡YA COMENZÓ!", lugar y hora, y West con la jeringa invitando a pasar.
// ---------------------------------------------------------------------------
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const VACUNA_YA_FRAMES = 330;

/** Sello de "HOY" que se estampa */
const Sello: React.FC<{at: number; x: number; y: number; texto: string; size?: number; rot?: number}> = ({at, x, y, texto, size = 70, rot = -8}) => {
  const f = useCurrentFrame();
  const p = tw(f, [at, at + 8], [0, 1], ease.out);
  if (f < at) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${1.7 - 0.7 * p})`, opacity: Math.min(1, p * 2), border: `8px solid ${NAVY}`, borderRadius: 22, padding: '6px 30px', background: AMARILLO, fontFamily: F.sans, fontWeight: 900, fontSize: size, letterSpacing: 4, color: NAVY, whiteSpace: 'nowrap', boxShadow: '0 12px 0 rgba(4,57,113,0.25)'}}>
      {texto}
    </div>
  );
};

/** Pin de ubicación que cae y marca el lugar */
const Pin: React.FC<{at: number; x: number; y: number; s?: number}> = ({at, x, y, s = 1}) => {
  const f = useCurrentFrame();
  const p = tw(f, [at, at + 14], [0, 1], ease.out);
  const onda = tw(f, [at + 10, at + 40], [0, 1]);
  if (f < at) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `scale(${s})`, transformOrigin: '0 0'}}>
      <div style={{position: 'absolute', left: -90 * onda, top: -28 * onda, width: 180 * onda, height: 56 * onda, borderRadius: '50%', border: `5px solid ${AZUL}`, opacity: 1 - onda}} />
      <div style={{position: 'absolute', left: -44, top: -14, width: 88, height: 28, borderRadius: '50%', background: 'rgba(4,57,113,0.25)', transform: `scale(${p})`}} />
      <svg width={140} height={190} viewBox="-70 -180 140 190" style={{position: 'absolute', left: -70, top: -180, transform: `translateY(${(1 - p) * -500}px)`, opacity: Math.min(1, p * 3)}}>
        <path d="M0 0 C-12 -40 -62 -70 -62 -118 A62 62 0 1 1 62 -118 C62 -70 12 -40 0 0 Z" fill={AZUL} stroke={NAVY} strokeWidth={6} />
        <circle cx={0} cy={-118} r={26} fill={AMARILLO} stroke={NAVY} strokeWidth={5} />
      </svg>
    </div>
  );
};

/** Decoración de las esquinas como en el póster */
const Esquinas: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  const p = tw(f, [at, at + 16], [0, 1]);
  return (
    <AbsoluteFill>
      <Img src={capa('esquina_sup')} style={{position: 'absolute', left: 0, top: 0, width: 400, transform: `translate(${(1 - p) * -400}px, ${(1 - p) * -300}px)`}} />
      <Img src={capa('semitono')} style={{position: 'absolute', right: 0, top: 0, width: 420, opacity: 0.8 * p}} />
      <Img src={capa('ondas')} style={{position: 'absolute', left: 0, bottom: 0, width: 1080, transform: `translateY(${(1 - p) * 260}px)`}} />
    </AbsoluteFill>
  );
};

/** Tarjeta final */
const Final: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  const west = tw(f, [at + 4, at + 22], [0, 1], ease.out);
  const logo = tw(f, [at + 6, at + 20], [0, 1]);
  const mano = Math.sin((f - at) / 14) * 1.2; // West respira un poco
  return (
    <AbsoluteFill>
      <Esquinas at={at} />
      <Img src={capa('logo')} style={{position: 'absolute', left: 540 - 200, top: 235, width: 400, opacity: logo, transform: `translateY(${(1 - logo) * -30}px)`}} />
      <Linea texto="La Jornada de Vacunación" at={at + 14} top={455} size={58} />
      <Tira texto="¡YA COMENZÓ!" at={at + 22} tipo="cinta" top={525} size={118} />
      {/* West entra desde la derecha */}
      <Img src={capa('lince')} style={{position: 'absolute', left: 450, top: 905, width: 660, transform: `translateX(${(1 - west) * 700}px) rotate(${mano}deg)`, transformOrigin: '60% 100%'}} />
      <Pin at={at + 40} x={120} y={1030} s={0.6} />
      <div style={{position: 'absolute', left: 180, top: 905, width: 420, fontFamily: F.sans, fontWeight: 800, fontSize: 50, lineHeight: 1.12, color: NAVY, opacity: tw(f, [at + 44, at + 58], [0, 1]), transform: `translateX(${(1 - tw(f, [at + 44, at + 58], [0, 1])) * -40}px)`}}>
        Foyer del Auditorio de la Universidad
      </div>
      <Sello at={at + 62} x={300} y={1155} texto="HOY · 8:30 a. m." size={46} rot={-4} />
      <div style={{position: 'absolute', left: 70, top: 1260, width: 520, fontFamily: F.sans, fontWeight: 700, fontSize: 42, lineHeight: 1.2, color: AZUL, opacity: tw(f, [at + 76, at + 90], [0, 1])}}>
        Solo toma unos minutos.
        <br />
        ¡Te esperamos! 💙
      </div>
      <Sfx at={at + 4} name="whoosh" volume={0.45} />
      <Sfx at={at + 22} name="hist_paper" volume={0.6} />
      <Sfx at={at + 44} name="pop" volume={0.5} />
      <Sfx at={at + 62} name="hist_stamp" volume={0.6} />
      <Sfx at={at + 78} name="ding" volume={0.35} />
    </AbsoluteFill>
  );
};

export const VacunacionYa: React.FC<{music?: boolean}> = ({music = true}) => {
  const f = useCurrentFrame();
  const FIN = 146;
  return (
    <AbsoluteFill style={{background: '#F5F2EA'}}>
      <Papel />
      {/* 1. ¡Ya puedes ir a vacunarte! */}
      <Escena from={0} dur={74}>
        <Linea texto="¡Ya puedes ir a" at={4} top={640} size={96} />
        <Tira texto="VACUNARTE!" at={14} tipo="cinta" top={770} size={138} />
        <Sello at={34} x={540} y={1190} texto="HOY" size={110} />
      </Escena>
      {/* 2. dónde */}
      <Escena from={70} dur={80}>
        <Pin at={74} x={540} y={720} />
        <Linea texto="Te esperamos en el" at={86} top={800} size={70} peso={700} />
        <Tira texto="Foyer del Auditorio" at={94} tipo="parche" top={900} size={88} />
        <Linea texto="de la Universidad" at={104} top={1120} size={70} peso={700} />
      </Escena>
      {/* 3. tarjeta final */}
      {f >= FIN && <Final at={FIN} />}
      <AbsoluteFill style={{background: '#F5F2EA', opacity: interpolate(f, [FIN - 4, FIN, FIN + 6], [0, 1, 0], clamp)}} />
      <Sfx at={4} name="whoosh" volume={0.4} />
      <Sfx at={14} name="hist_paper" volume={0.6} />
      <Sfx at={34} name="hist_stamp" volume={0.7} />
      <Sfx at={74} name="whoosh" volume={0.4} />
      <Sfx at={86} name="pop" volume={0.45} />
      <Sfx at={94} name="hist_paper" volume={0.6} />
      <Grain opacity={0.035} />
      {music && <Audio src={staticFile('music/vacuna_b.mp3')} volume={(fr) => interpolate(fr, [0, 8, VACUNA_YA_FRAMES - 30, VACUNA_YA_FRAMES], [0, 0.55, 0.55, 0], clamp)} />}
    </AbsoluteFill>
  );
};
