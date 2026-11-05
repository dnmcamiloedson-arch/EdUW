import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from './components';
import {Sfx} from './shots';
import {F, ease, tw} from './theme';
import {AMARILLO, capa, Linea, NAVY, Papel, Tira} from './Vacunacion';
import {Esquinas, Pin, Sello} from './VacunacionYa';

// ---------------------------------------------------------------------------
// Historia corta (9:16, ~16 s): "Solo quedan 8 vacunas por repartir" para que se apuren los que faltan.
// Con los clips y fotos de la jornada (public/proxies/vacuna8, public/photos/vacuna8) y el estilo del póster.
//  A. Clip 1 con un contador que baja de 30 hasta el 8.
//  B. Clip 2: "¿Aún no te vacunas? ¡No te quedes sin la tuya!"
//  C. Clip 3: "Corre al Foyer del Auditorio de la Universidad".
//  D. Las 3 fotos caen como tarjetas: "Muchos ya se vacunaron… ¿y tú?"
//  E. Tarjeta final: "¡Solo quedan 8 vacunas!" con 8 jeringas, el lugar y "¡Corre, se acaban!".
// ---------------------------------------------------------------------------
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const QUEDAN = 8;
const clip = (n: number) => staticFile(`proxies/vacuna8/clip${n}.mp4`);
const foto = (n: number) => staticFile(`photos/vacuna8/foto${n}.jpg`);

/** Número grande amarillo con contorno azul */
const Numero: React.FC<{valor: number; top: number; size: number; escala?: number}> = ({valor, top, size, escala = 1}) => (
  <div style={{position: 'absolute', top, width: '100%', textAlign: 'center', fontFamily: F.sans, fontWeight: 900, fontSize: size, lineHeight: 0.9, color: AMARILLO, WebkitTextStroke: `${size / 40}px ${NAVY}`, textShadow: `0 ${size / 30}px 0 ${NAVY}`, transform: `scale(${escala})`}}>{valor}</div>
);

/** Corte entre escenas: entra con un pequeño acercamiento y se funde */
const Corte: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  const p = tw(f, [0, 8], [0, 1]);
  return <AbsoluteFill style={{opacity: p, transform: `scale(${1.06 - 0.06 * p})`}}>{children}</AbsoluteFill>;
};

/** Clip a pantalla completa con un leve acercamiento y una capa azul para que se lean los textos */
const Clip: React.FC<{n: number; capa?: string}> = ({n, capa: fondo}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <OffthreadVideo src={clip(n)} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.1 - f * 0.0008})`}} />
      <AbsoluteFill style={{background: fondo ?? 'linear-gradient(180deg, rgba(4,57,113,0.8) 0%, rgba(4,57,113,0.55) 36%, rgba(4,57,113,0.15) 50%, rgba(4,57,113,0.15) 62%, rgba(4,57,113,0.8) 100%)'}} />
    </AbsoluteFill>
  );
};

// A. contador
const CONT_A = 16;
const CONT_B = 50;
const DESDE = 30;
const valorCont = (f: number) => Math.round(DESDE - (DESDE - QUEDAN) * (1 - Math.pow(1 - interpolate(f, [CONT_A, CONT_B], [0, 1], clamp), 3)));
const CLICKS = (() => {
  const r: number[] = [];
  for (let f = CONT_A + 1; f < CONT_B; f++) if (valorCont(f) !== valorCont(f - 1) && (r.length === 0 || f - r[r.length - 1] >= 2)) r.push(f);
  return r;
})();
const EscenaA: React.FC = () => {
  const f = useCurrentFrame();
  const llega = f >= CONT_B ? tw(f, [CONT_B, CONT_B + 10], [1.3, 1]) : 1;
  return (
    <AbsoluteFill>
      <Clip n={1} capa="rgba(4,57,113,0.58)" />
      <Sello at={4} x={540} y={430} texto="🗣️ ¡ÚLTIMO AVISO!" size={64} rot={-4} />
      <Linea texto="Solo quedan" at={12} top={560} size={96} color="#fff" />
      {f >= CONT_A - 2 && <Numero valor={valorCont(f)} top={680} size={480} escala={llega} />}
      <Tira texto="VACUNAS" at={54} tipo="cinta" top={1150} size={150} />
      <Linea texto="por repartir" at={64} top={1470} size={74} color="#fff" />
      <Sfx at={4} name="hist_stamp" volume={0.6} />
      {CLICKS.map((c) => (
        <Sfx key={c} at={c} name="click" volume={0.3} />
      ))}
      <Sfx at={CONT_B} name="impact" volume={0.6} />
      <Sfx at={54} name="hist_paper" volume={0.6} />
    </AbsoluteFill>
  );
};

/** Emoji grande como sticker (borde blanco y sombra), entra girando suave y flota */
const Sticker: React.FC<{emoji: string; at: number; x: number; y: number; size: number}> = ({emoji, at, x, y, size}) => {
  const f = useCurrentFrame();
  const p = tw(f, [at, at + 12], [0, 1]);
  if (f < at) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, fontSize: size, lineHeight: 1, transform: `translate(-50%, -50%) translateY(${Math.sin((f - at) / 9) * 8}px) scale(${0.4 + 0.6 * p}) rotate(${(1 - p) * -25}deg)`, opacity: Math.min(1, p * 2), filter: 'drop-shadow(0 0 4px #fff) drop-shadow(0 0 4px #fff) drop-shadow(0 14px 0 rgba(4,57,113,0.35))'}}>
      {emoji}
    </div>
  );
};

// B. ¿aún no te vacunas?
const EscenaB: React.FC = () => (
  <Corte>
    <Clip n={2} />
    <Tira texto="¿Aún no te vacunas?" at={6} tipo="parche" top={330} size={74} />
    <Sticker emoji="🫵🏼" at={20} x={830} y={610} size={250} />
    <Linea texto="¡No te quedes" at={34} top={1250} size={92} color="#fff" />
    <Tira texto="SIN LA TUYA!" at={42} tipo="cinta" top={1370} size={124} />
    <Sfx at={0} name="whoosh" volume={0.4} />
    <Sfx at={6} name="hist_paper" volume={0.55} />
    <Sfx at={20} name="pop" volume={0.5} />
    <Sfx at={42} name="hist_paper" volume={0.55} />
  </Corte>
);

// C. dónde
const EscenaC: React.FC = () => (
  <Corte>
    <Clip n={3} />
    <Linea texto="Corre al" at={10} top={330} size={84} color="#fff" />
    <Tira texto="Foyer del Auditorio" at={18} tipo="parche" top={440} size={86} />
    <Linea texto="de la Universidad" at={28} top={660} size={70} color="#fff" />
    <Pin at={40} x={540} y={1460} s={0.9} />
    <Sfx at={0} name="whoosh" volume={0.4} />
    <Sfx at={18} name="hist_paper" volume={0.55} />
    <Sfx at={40} name="pop" volume={0.5} />
  </Corte>
);

// D. fotos como tarjetas
const TARJETAS: {n: number; x: number; y: number; w: number; rot: number; at: number}[] = [
  {n: 1, x: 300, y: 900, w: 500, rot: -7, at: 8},
  {n: 2, x: 790, y: 860, w: 430, rot: 6, at: 20},
  {n: 3, x: 560, y: 1010, w: 440, rot: -1.5, at: 32},
];
const EscenaD: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Corte>
      <Papel />
      <Linea texto="Muchos ya se vacunaron…" at={2} top={300} size={66} />
      {TARJETAS.map((t) => {
        const p = tw(f, [t.at, t.at + 12], [0, 1]);
        if (f < t.at) return null;
        return (
          <div key={t.n} style={{position: 'absolute', left: t.x - t.w / 2, top: t.y - (t.w * 1.25) / 2, width: t.w, padding: 16, paddingBottom: 56, background: '#fff', boxShadow: '0 24px 50px rgba(4,57,113,0.35)', transform: `rotate(${t.rot}deg) scale(${1.25 - 0.25 * p})`, opacity: Math.min(1, p * 2)}}>
            <Img src={foto(t.n)} style={{width: '100%', height: t.w * 1.25 - 72, objectFit: 'cover', display: 'block'}} />
          </div>
        );
      })}
      <Tira texto="¿y tú? 🫵🏼" at={50} tipo="cinta" top={1440} size={150} />
      {TARJETAS.map((t) => (
        <Sfx key={t.n} at={t.at} name="shutter" volume={0.45} />
      ))}
      <Sfx at={50} name="impact" volume={0.5} />
    </Corte>
  );
};

/** Jeringa sencilla (icono) */
const Jeringa: React.FC<{at: number; x: number; y: number; rot: number}> = ({at, x, y, rot}) => {
  const f = useCurrentFrame();
  const p = tw(f, [at, at + 8], [0, 1]);
  if (f < at) return null;
  return (
    <svg width={70} height={170} viewBox="-35 -85 70 170" style={{position: 'absolute', left: x - 35, top: y - 85, transform: `rotate(${rot}deg) scale(${1.4 - 0.4 * p})`, opacity: Math.min(1, p * 2)}}>
      <rect x={-24} y={-82} width={48} height={10} rx={4} fill={NAVY} />
      <rect x={-5} y={-74} width={10} height={26} fill={NAVY} />
      <rect x={-18} y={-50} width={36} height={88} rx={7} fill="#fff" stroke={NAVY} strokeWidth={6} />
      <rect x={-12} y={-18} width={24} height={52} rx={3} fill={AMARILLO} />
      {[-36, -24, -12, 0, 12].map((m) => (
        <line key={m} x1={-18} y1={m} x2={-6} y2={m} stroke={NAVY} strokeWidth={3} />
      ))}
      <rect x={-9} y={38} width={18} height={12} rx={2} fill={NAVY} />
      <line x1={0} y1={50} x2={0} y2={82} stroke={NAVY} strokeWidth={4} strokeLinecap="round" />
    </svg>
  );
};

// E. tarjeta final
const EscenaE: React.FC = () => {
  const f = useCurrentFrame();
  const logo = tw(f, [4, 18], [0, 1]);
  const ocho = tw(f, [18, 30], [0, 1]);
  const lugar = tw(f, [64, 78], [0, 1]);
  return (
    <Corte>
      <Papel />
      <Esquinas at={0} />
      <Img src={capa('logo')} style={{position: 'absolute', left: 540 - 180, top: 235, width: 360, opacity: logo}} />
      <Tira texto="¡SOLO QUEDAN" at={10} tipo="parche" top={420} size={84} />
      {f >= 18 && <Numero valor={QUEDAN} top={600} size={400} escala={1.4 - 0.4 * ocho} />}
      <Tira texto="VACUNAS!" at={30} tipo="cinta" top={950} size={140} />
      {Array.from({length: QUEDAN}, (_, i) => (
        <Jeringa key={i} at={40 + i * 3} x={155 + i * 110} y={1330} rot={i % 2 ? 8 : -8} />
      ))}
      <div style={{position: 'absolute', top: 1440, width: '100%', textAlign: 'center', fontFamily: F.sans, fontWeight: 800, fontSize: 48, lineHeight: 1.15, color: NAVY, opacity: lugar, transform: `translateY(${(1 - lugar) * 24}px)`}}>
        📍 Foyer del Auditorio
        <br />
        de la Universidad
      </div>
      <Sello at={84} x={540} y={1610} texto="🗣️ ¡CORRE, SE ACABAN!" size={54} rot={-3} />
      <Sfx at={0} name="whoosh" volume={0.4} />
      <Sfx at={10} name="hist_paper" volume={0.55} />
      <Sfx at={18} name="impact" volume={0.6} />
      <Sfx at={30} name="hist_paper" volume={0.55} />
      {Array.from({length: QUEDAN}, (_, i) => (
        <Sfx key={i} at={40 + i * 3} name="pop" volume={0.25} />
      ))}
      <Sfx at={84} name="hist_stamp" volume={0.65} />
      <Sfx at={88} name="ding" volume={0.35} />
    </Corte>
  );
};

const A = 86;
const B = 102;
const C = 100;
const D = 84;
const E = 126;
export const VACUNA_8_FRAMES = A + B + C + D + E;
export const VacunacionUltimas: React.FC<{music?: boolean}> = ({music = true}) => {
  let t = 0;
  const tramo = (d: number) => {
    const r = t;
    t += d;
    return r;
  };
  const escenas: [number, number, React.ReactNode][] = [
    [tramo(A), A, <EscenaA key="a" />],
    [tramo(B), B, <EscenaB key="b" />],
    [tramo(C), C, <EscenaC key="c" />],
    [tramo(D), D, <EscenaD key="d" />],
    [tramo(E), E, <EscenaE key="e" />],
  ];
  return (
    <AbsoluteFill style={{background: '#F5F2EA'}}>
      {escenas.map(([from, dur, el], i) => (
        <Sequence key={i} from={from} durationInFrames={dur + (i < escenas.length - 1 ? 8 : 0)}>
          {el}
        </Sequence>
      ))}
      <Grain opacity={0.035} />
      {music && <Audio src={staticFile('music/vacuna.mp3')} volume={(fr) => interpolate(fr, [0, 6, VACUNA_8_FRAMES - 30, VACUNA_8_FRAMES], [0, 0.5, 0.5, 0], clamp)} />}
    </AbsoluteFill>
  );
};
