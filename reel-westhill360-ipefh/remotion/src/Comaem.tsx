import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from './components';
import {F, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Video institucional: Reacreditación COMAEM de la Facultad de Medicina (1920x1080, uso interno).
// Música: "Time" (Hans Zimmer), editada con scripts/comaem_musica.py para que el clímax entre cuando termina el
// Rector (CLIMAX). Material preparado con scripts/comaem_preparar.py (proxies y voces limpias a -16 LUFS).
//
// Estructura (segundos del video):
//   0–8      negro, logo Westhill, capítulo 1 y entrada de la Facultad
//   8–32.6   Mtra. Elvia: a cuadro su primera frase; el resto en voz en off sobre tomas de la facultad
//   32.6     título "REACREDITACIÓN COMAEM" (aquí la canción empieza a crecer)
//   37.2     Dr. Alan · 51.1 docentes (Loera, Bonilla, Pérez Peláez) · 79.4 alumnos (Frida, Alexa, Jorge)
//   109.8    Dr. Asisclo (completo hasta "…se renueva cada día"), con tomas de apoyo en dos tramos
//   151.8    espacio en negro para el Rector (falta su toma) hasta CLIMAX
//   CLIMAX   "REACREDITACIÓN COMAEM", montaje con palabras clave, y cortinilla final con el piano
// Los cambios de escena son tarjetas de capítulo: dos paneles azules se cierran sobre una línea de pulso
// (electrocardiograma) que se dibuja, aparece el título del capítulo y se abren hacia la escena siguiente.
// Entre personas de una misma escena cruza un barrido de luz dorada. Por indicación del cliente las personas
// aparecen sin rótulo de nombre y sin subtítulos.
// ---------------------------------------------------------------------------
const W = 1920;
const H = 1080;
const FPS = 30;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const s = (t: number) => Math.round(t * FPS);
const NAVY = '#0B1B33';
const NAVY2 = '#06101F';
const ORO = '#D9B76A';
const ORO_GRAD = 'linear-gradient(180deg, #F6E3B0 0%, #D9B76A 55%, #A97B35 100%)';
const CREMA = '#F4EEE2';
const vid = (n: string) => staticFile(`proxies/comaem/${n}.mp4`);
const voz = (n: string) => staticFile(`comaem/voz/${n}.wav`);
const LOGO_UW = staticFile('logos/logo_westhill_blanco_total.png');
const LOGO_COMAEM = staticFile('comaem/logo_comaem_blanco_brillo.png');

/** segundo del video en que termina el Rector y entra el clímax de la canción */
const CLIMAX = 169.84;
const FRASE = (60 / 63) * 16; // frase musical de 4 compases (15.24 s)
const COMPAS2 = (60 / 63) * 2; // dos tiempos (1.9 s): ritmo del montaje final
const RECTOR_DESDE = 151.8;
const FIN = CLIMAX + FRASE + 10.5;
export const COMAEM_FRAMES = s(FIN);

// ---------------------------------------------------------------------------
// Tomas (video): [archivo, segundo del video, duración, segundo de la toma, entrada]
// ---------------------------------------------------------------------------
type Entrada = 'corte' | 'fundido' | 'barrido';
type Toma = {src: string; at: number; dur: number; desde: number; entra?: Entrada; sale?: boolean; zoom?: [number, number]; rate?: number; x?: number};
const A = 109.8; // inicio del Dr. Asisclo
const TOMAS: Toma[] = [
  // apertura y Mtra. Elvia
  {src: 'b13', at: 5.7, dur: 2.8, desde: 0.6, zoom: [1.0, 1.06]},
  {src: 'elvia', at: 8.0, dur: 4.0, desde: 2.0, entra: 'barrido'},
  {src: 'b9', at: 11.8, dur: 3.4, desde: 0.8, entra: 'fundido'},
  {src: 'b11', at: 15.0, dur: 2.5, desde: 0.05, entra: 'fundido'},
  {src: 'b12', at: 17.3, dur: 2.6, desde: 0.05, entra: 'fundido'},
  {src: 'b2', at: 19.7, dur: 3.3, desde: 9.0, entra: 'fundido'},
  {src: 'b1', at: 22.8, dur: 3.0, desde: 12.0, entra: 'fundido'},
  {src: 'b5', at: 25.6, dur: 2.1, desde: 0.05, entra: 'fundido', rate: 0.9},
  {src: 'b4', at: 27.5, dur: 2.5, desde: 11.0, entra: 'fundido'},
  {src: 'b10', at: 29.8, dur: 3.4, desde: 1.5, entra: 'fundido'},
  // Dr. Alan
  {src: 'alan', at: 37.2, dur: 13.6, desde: 0},
  // docentes
  {src: 'b8', at: 51.1, dur: 2.4, desde: 2.0},
  {src: 'loera', at: 53.1, dur: 6.3, desde: 1.6, entra: 'barrido'},
  {src: 'bonilla', at: 59.0, dur: 10.8, desde: 4.9, entra: 'barrido'},
  {src: 'perez', at: 69.4, dur: 5.9, desde: 0.7, entra: 'barrido'},
  {src: 'b6', at: 75.1, dur: 2.1, desde: 5.5, entra: 'fundido'},
  {src: 'b7', at: 77.0, dur: 2.5, desde: 3.3, entra: 'fundido'},
  // alumnos
  {src: 'frida', at: 79.4, dur: 10.9, desde: 3.5},
  {src: 'alexa', at: 89.9, dur: 8.8, desde: 3.2, entra: 'barrido'},
  {src: 'jorge', at: 98.3, dur: 11.5, desde: 2.2, entra: 'barrido'},
  // Dr. Asisclo y sus tomas de apoyo
  {src: 'asisclo', at: A, dur: 41.3, desde: 0, zoom: [1.0, 1.04]},
  {src: 'b3', at: A + 9.0, dur: 3.2, desde: 13.0, entra: 'fundido'},
  {src: 'b4', at: A + 12.0, dur: 3.1, desde: 2.0, entra: 'fundido'},
  {src: 'b7', at: A + 14.9, dur: 3.1, desde: 0.2, entra: 'fundido', sale: true},
  {src: 'b6', at: A + 26.4, dur: 3.5, desde: 0.5, entra: 'fundido'},
  {src: 'b1', at: A + 29.7, dur: 3.5, desde: 20.0, entra: 'fundido'},
  {src: 'b2', at: A + 33.0, dur: 3.6, desde: 20.0, entra: 'fundido', sale: true},
];

// Voces: [archivo, segundo del video, segundo de la toma donde empieza, segundo de la toma donde termina]
const VOCES: [string, number, number, number][] = [
  ['elvia', 8.0, 2.0, 26.5],
  ['alan', 37.2, 0.0, 13.3],
  ['loera', 53.1, 1.6, 7.7],
  ['bonilla', 61.4, 7.3, 15.4],
  ['perez', 69.4, 0.7, 10.0],
  ['frida', 79.4, 3.5, 14.2],
  ['alexa', 89.9, 3.2, 11.8],
  ['jorge', 100.8, 4.7, 13.2],
  ['asisclo', A, 0.0, 41.3],
];

// Capítulos: [segundo en que empieza a cerrarse, número, título]. El corte de escena cae 0.8 s después.
const CAP_F = 48;
const CAP_CORTE = 24;
const CAPITULOS: [number, string, string][] = [
  [36.4, '02', 'El trabajo detrás del logro'],
  [50.3, '03', 'La calidad en la formación médica'],
  [78.6, '04', 'El orgullo de ser Medicina Westhill'],
  [109.0, '05', 'Un logro de toda la comunidad'],
  [151.0, '06', 'Un legado que continúa'],
];

// ---------------------------------------------------------------------------
// Piezas
// ---------------------------------------------------------------------------
/** Toma de video con acercamiento lento y su entrada (corte, fundido o barrido de luz dorada) */
const Clip: React.FC<{t: Toma}> = ({t}) => {
  const f = useCurrentFrame();
  const dur = s(t.dur);
  const [z0, z1] = t.zoom ?? (t.src.startsWith('b') ? [1.04, 1.1] : [1.0, 1.05]);
  const z = interpolate(f, [0, dur], [z0, z1], clamp);
  const sale = t.sale ? tw(f, [dur - 8, dur], [1, 0], ease.inOut) : 1;
  let op = sale;
  let clip: string | undefined;
  let linea: React.ReactNode = null;
  if (t.entra === 'fundido') op *= tw(f, [0, 7], [0, 1], ease.inOut);
  if (t.entra === 'barrido' && f < 14) {
    const p = tw(f, [0, 13], [0, 1], ease.inOut);
    const x = -80 + p * (W + 160);
    clip = `polygon(0 0, ${x + 60}px 0, ${x - 60}px 100%, 0 100%)`;
    linea = (
      <div style={{position: 'absolute', left: x - 70, top: -40, width: 140, height: H + 80, transform: 'skewX(-6.3deg)', background: 'linear-gradient(90deg, rgba(246,227,176,0) 0%, rgba(246,227,176,0.5) 38%, rgba(255,250,235,1) 50%, rgba(246,227,176,0.5) 62%, rgba(246,227,176,0) 100%)', mixBlendMode: 'screen', opacity: Math.sin(p * Math.PI)}} />
    );
  }
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: op, clipPath: clip, overflow: 'hidden', background: '#000'}}>
        <OffthreadVideo src={vid(t.src)} startFrom={s(t.desde)} playbackRate={t.rate ?? 1} muted style={{width: W, height: H, objectFit: 'cover', transform: `scale(${z})`, filter: 'contrast(1.04) saturate(1.06)'}} />
      </AbsoluteFill>
      {linea}
    </AbsoluteFill>
  );
};

/** Línea de pulso (electrocardiograma) que se dibuja de izquierda a derecha con un punto de luz en la punta */
const PULSO = 'M0,540 L330,540 L352,522 L372,540 L404,540 L424,452 L448,628 L470,540 L512,540 L540,508 L572,540 L1348,540 L1370,522 L1390,540 L1422,540 L1442,452 L1466,628 L1488,540 L1530,540 L1558,508 L1590,540 L1920,540';
const Pulso: React.FC<{p: number; op?: number}> = ({p, op = 1}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: op, filter: 'drop-shadow(0 0 10px rgba(246,227,176,0.9))'}}>
    <path d={PULSO} fill="none" stroke={ORO} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
    <path d={PULSO} fill="none" stroke="#FFF6DC" strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray="0.03 1" strokeDashoffset={-(p - 0.03)} opacity={p > 0.03 && p < 1 ? 1 : 0} />
  </svg>
);

/** Tarjeta de capítulo: paneles azules que se cierran, pulso, número y título, y se abren a la escena siguiente */
const Capitulo: React.FC<{num: string; titulo: string; cerrado?: number}> = ({num, titulo, cerrado = 0}) => {
  const f = useCurrentFrame();
  const total = CAP_F + cerrado;
  const cierra = cerrado ? 1 : tw(f, [0, 9], [0, 1], ease.inOut);
  const abre = tw(f, [total - 13, total], [0, 1], ease.inOut);
  const k = cierra * (1 - abre); // 1 = cerrado
  const pulso = tw(f, [cerrado ? 6 : 5, total - 12], [0, 1], ease.inOut);
  const txt = tw(f, [cerrado ? 10 : 8, cerrado ? 26 : 20], [0, 1]) * (1 - tw(f, [total - 16, total - 9], [0, 1]));
  const panel: React.CSSProperties = {position: 'absolute', left: 0, width: W, height: H / 2 + 2, background: `linear-gradient(180deg, ${NAVY2} 0%, ${NAVY} 100%)`};
  return (
    <AbsoluteFill>
      <div style={{...panel, top: 0, transform: `translateY(${-(1 - k) * (H / 2 + 4)}px)`}} />
      <div style={{...panel, top: H / 2 - 2, background: `linear-gradient(0deg, ${NAVY2} 0%, ${NAVY} 100%)`, transform: `translateY(${(1 - k) * (H / 2 + 4)}px)`}} />
      <Pulso p={pulso} op={Math.min(1, k * 1.6)} />
      <div style={{position: 'absolute', left: 0, width: W, top: 296, textAlign: 'center', opacity: txt, transform: `translateY(${(1 - txt) * 14}px)`}}>
        <div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 26, letterSpacing: 12, color: ORO}}>CAPÍTULO {num}</div>
        <div style={{marginTop: 12, fontFamily: F.clasica, fontWeight: 700, fontSize: 68, letterSpacing: 3, color: '#fff'}}>{titulo}</div>
      </div>
      <div style={{position: 'absolute', left: 0, width: W, top: 668, textAlign: 'center', opacity: txt * 0.75, fontFamily: F.sans, fontWeight: 500, fontSize: 22, letterSpacing: 10, color: CREMA}}>REACREDITACIÓN COMAEM · FACULTAD DE MEDICINA</div>
    </AbsoluteFill>
  );
};

/** Rayos de luz suaves detrás de los títulos */
const Rayos: React.FC<{giro: number; op: number}> = ({giro, op}) => {
  const m = 'radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 34%, rgba(0,0,0,0) 70%)';
  return <div style={{position: 'absolute', left: W / 2 - 1500, top: H / 2 - 1500, width: 3000, height: 3000, borderRadius: '50%', opacity: op, mixBlendMode: 'screen', background: `repeating-conic-gradient(from ${giro}deg, rgba(255,222,160,0) 0deg, rgba(255,222,160,0.45) 3deg, rgba(255,222,160,0) 8deg, rgba(255,222,160,0) 30deg)`, WebkitMaskImage: m, maskImage: m}} />;
};

const Dorado: React.FC<{children: React.ReactNode; size: number; spacing: number; luz?: number}> = ({children, size, spacing, luz}) => {
  const con = luz !== undefined && luz > 0 && luz < 1;
  return (
    <span style={{fontFamily: F.clasica, fontWeight: 700, fontSize: size, letterSpacing: spacing, backgroundImage: con ? `linear-gradient(105deg, rgba(255,255,255,0) 43%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 57%), ${ORO_GRAD}` : ORO_GRAD, backgroundSize: con ? '300% 100%, 100% 100%' : undefined, backgroundPosition: con ? `${(1 - (luz as number)) * 100}% 0, 0 0` : undefined, backgroundRepeat: 'no-repeat', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>
      {children}
    </span>
  );
};

/** Título "REACREDITACIÓN COMAEM" con el logo; `grande` es la versión del clímax */
const TituloComaem: React.FC<{dur: number; frase?: string; grande?: boolean}> = ({dur, frase, grande}) => {
  const f = useCurrentFrame();
  const d = s(dur);
  const fondo = tw(f, [0, 10], [0, 1]);
  const logo = tw(f, [4, 26], [0, 1]);
  const t1 = tw(f, [12, 34], [0, 1]);
  const linea = tw(f, [22, 48], [0, 1], ease.inOut);
  const t2 = tw(f, [34, 56], [0, 1]);
  const flash = interpolate(f, [0, 2, 16], [0, grande ? 0.85 : 0.45, 0], clamp);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, #163A66 0%, ${NAVY} 55%, ${NAVY2} 100%)`, opacity: fondo}} />
      <Rayos giro={f * 0.2} op={0.3 * logo} />
      <AbsoluteFill style={{transform: `scale(${1 + 0.05 * (f / d)})`}}>
        <Img src={LOGO_COMAEM} style={{position: 'absolute', left: W / 2 - (grande ? 190 : 165), top: grande ? 150 : 170, width: grande ? 380 : 330, opacity: logo, transform: `scale(${1.12 - 0.12 * logo})`, filter: `blur(${(1 - logo) * 10}px) drop-shadow(0 0 ${24 * (1 - logo) + 10}px rgba(255,236,196,0.55))`}} />
        <div style={{position: 'absolute', left: 0, width: W, top: grande ? 548 : 520, textAlign: 'center', opacity: t1, filter: t1 < 1 ? `blur(${(1 - t1) * 8}px)` : undefined}}>
          <Dorado size={grande ? 98 : 88} spacing={(grande ? 8 : 10) + (1 - t1) * 30} luz={interpolate(f, [40, 76], [0, 1], clamp)}>
            REACREDITACIÓN COMAEM
          </Dorado>
        </div>
        <div style={{position: 'absolute', left: W / 2 - 330 * linea, top: grande ? 690 : 646, width: 660 * linea, height: 2, background: `linear-gradient(90deg, rgba(217,183,106,0), ${ORO}, rgba(217,183,106,0))`}} />
        {frase && <div style={{position: 'absolute', left: 0, width: W, top: grande ? 716 : 672, textAlign: 'center', fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 44, color: CREMA, opacity: t2, transform: `translateY(${(1 - t2) * 14}px)`}}>{frase}</div>}
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#FFF6E2', opacity: flash}} />
    </AbsoluteFill>
  );
};

/** Apertura: logo Westhill sobre negro con una línea que se dibuja */
const Apertura: React.FC = () => {
  const f = useCurrentFrame();
  const logo = tw(f, [s(1.0), s(2.2)], [0, 1]) * (1 - tw(f, [s(3.5), s(4.2)], [0, 1]));
  const linea = tw(f, [s(1.3), s(2.8)], [0, 1], ease.inOut);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Img src={LOGO_UW} style={{position: 'absolute', left: W / 2 - 260, top: 380, width: 520, opacity: logo, transform: `scale(${1.04 - 0.04 * tw(f, [s(1.0), s(4.2)], [0, 1])})`}} />
      <div style={{position: 'absolute', left: W / 2 - 260 * linea, top: 632, width: 520 * linea, height: 2, background: `linear-gradient(90deg, rgba(217,183,106,0), ${ORO}, rgba(217,183,106,0))`, opacity: logo}} />
    </AbsoluteFill>
  );
};

/** Montaje del clímax: seis tomas al ritmo de la música, cada una con una palabra clave */
const MONTAJE: [string, number, string][] = [
  ['bonilla', 1.0, 'Calidad'],
  ['b6', 0.6, 'Compromiso'],
  ['b1', 14.0, 'Formación'],
  ['jorge', 2.3, 'Orgullo'],
  ['b2', 3.0, 'Comunidad'],
  ['b9', 1.6, 'Legado'],
];
const Montaje: React.FC = () => {
  const f = useCurrentFrame();
  const paso = COMPAS2 * FPS;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {MONTAJE.map(([src, desde, palabra], i) => {
        const a = Math.round(i * paso);
        const d = Math.round(paso) + 8;
        const k = f - a;
        const p = tw(k, [6, 20], [0, 1]);
        const fuera = tw(k, [d - 14, d - 6], [0, 1]);
        return (
          <Sequence key={i} from={a} durationInFrames={d}>
            <AbsoluteFill style={{opacity: tw(k, [0, 8], [0, 1], ease.inOut), overflow: 'hidden'}}>
              <OffthreadVideo src={vid(src)} startFrom={s(desde)} muted style={{width: W, height: H, objectFit: 'cover', transform: `scale(${1.06 + 0.08 * (k / d)})`, filter: 'contrast(1.06) saturate(1.08)'}} />
              <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(6,16,31,0.15) 40%, rgba(6,16,31,0.78) 100%)'}} />
            </AbsoluteFill>
            <div style={{position: 'absolute', left: 0, width: W, bottom: 120, textAlign: 'center', opacity: p * (1 - fuera), filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined}}>
              <div style={{fontFamily: F.clasica, fontWeight: 700, fontSize: 92, letterSpacing: 14 + (1 - p) * 26, color: '#fff', textShadow: '0 4px 30px rgba(0,0,0,0.6)'}}>{palabra.toUpperCase()}</div>
              <div style={{width: 260 * p, height: 3, background: ORO_GRAD, margin: '18px auto 0', borderRadius: 2}} />
            </div>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

/** Cortinilla final: logos Westhill y COMAEM, la frase de cierre y fundido a negro */
const Cortinilla: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const d = s(dur);
  const fondo = tw(f, [0, 24], [0, 1], ease.inOut);
  const a = tw(f, [14, 44], [0, 1]);
  const linea = tw(f, [34, 70], [0, 1], ease.inOut);
  const b = tw(f, [52, 84], [0, 1]);
  const c = tw(f, [84, 112], [0, 1]);
  const negro = tw(f, [d - 60, d - 10], [0, 1], ease.inOut);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, #163A66 0%, ${NAVY} 55%, ${NAVY2} 100%)`, opacity: fondo}} />
      <Rayos giro={f * 0.12} op={0.2 * a} />
      <AbsoluteFill style={{transform: `scale(${1 + 0.04 * (f / d)})`}}>
        <div style={{position: 'absolute', left: 0, width: W, top: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 70, opacity: a, filter: a < 1 ? `blur(${(1 - a) * 8}px)` : undefined}}>
          <Img src={LOGO_UW} style={{width: 500}} />
          <div style={{width: 2, height: 190 * linea, background: `linear-gradient(180deg, rgba(217,183,106,0), ${ORO}, rgba(217,183,106,0))`}} />
          <Img src={LOGO_COMAEM} style={{width: 250, filter: 'drop-shadow(0 0 10px rgba(255,236,196,0.4))'}} />
        </div>
        <div style={{position: 'absolute', left: W / 2 - 380 * linea, top: 596, width: 760 * linea, height: 2, background: `linear-gradient(90deg, rgba(217,183,106,0), ${ORO}, rgba(217,183,106,0))`}} />
        <div style={{position: 'absolute', left: 0, width: W, top: 628, textAlign: 'center', opacity: b, filter: b < 1 ? `blur(${(1 - b) * 6}px)` : undefined}}>
          <Dorado size={50} spacing={12 + (1 - b) * 20} luz={interpolate(f, [96, 136], [0, 1], clamp)}>
            REACREDITACIÓN COMAEM
          </Dorado>
        </div>
        <div style={{position: 'absolute', left: 200, right: 200, top: 728, textAlign: 'center', fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 46, lineHeight: 1.3, color: CREMA, opacity: c, transform: `translateY(${(1 - c) * 14}px)`}}>“Un compromiso permanente con la calidad de la educación médica.”</div>
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#000', opacity: negro}} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Mezcla: la música baja bajo cada voz y sube en tarjetas, clímax y cierre
// ---------------------------------------------------------------------------
const TRAMOS_VOZ: [number, number][] = VOCES.map(([, at, a, b]) => [s(at) + 6, s(at + (b - a)) - 4]);
const musicaVol = (fr: number) => {
  const t = fr / FPS;
  // nivel base según la parte de la canción (la intro de piano viene muy baja; el final, muy alto)
  const base = interpolate(t, [0, 30, 34, 100, 150, CLIMAX - 0.5, CLIMAX + 0.3, FIN], [1.5, 1.5, 0.95, 0.85, 0.8, 0.8, 1, 1], clamp);
  // bajo las voces
  let duck = 1;
  for (const [a, b] of TRAMOS_VOZ) {
    const k = interpolate(fr, [a - 12, a, b, b + 18], [0, 1, 1, 0], clamp);
    duck = Math.min(duck, 1 - k * (t < 33 ? 0.42 : 0.68));
  }
  // espacio del Rector: se deja como sonará bajo su voz
  const rector = interpolate(t, [RECTOR_DESDE + 0.4, RECTOR_DESDE + 1.4, CLIMAX - 0.8, CLIMAX], [1, 0.42, 0.42, 1], clamp);
  return base * duck * rector;
};

export const Comaem: React.FC = () => {
  const tituloAt = 32.6;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence durationInFrames={s(6.0)}>
        <Apertura />
      </Sequence>
      {TOMAS.map((t, i) => (
        <Sequence key={i} from={s(t.at)} durationInFrames={s(t.dur)}>
          <Clip t={t} />
        </Sequence>
      ))}
      {/* viñeta sobre las tomas */}
      <Sequence from={s(5.7)} durationInFrames={s(RECTOR_DESDE - 5.7)}>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.42) 100%)'}} />
      </Sequence>
      {/* título después de la Mtra. Elvia */}
      <Sequence from={s(tituloAt)} durationInFrames={s(37.2 - tituloAt)}>
        <TituloComaem dur={37.2 - tituloAt} frase="Un compromiso que se demuestra todos los días" />
      </Sequence>
      {/* capítulo 1: sale del negro y se abre hacia la entrada de la Facultad */}
      <Sequence from={s(4.2)} durationInFrames={CAP_F + 6}>
        <Capitulo num="01" titulo="Un compromiso con la calidad" cerrado={6} />
      </Sequence>
      {CAPITULOS.map(([at, num, titulo]) => (
        <Sequence key={num} from={s(at)} durationInFrames={CAP_F}>
          <Capitulo num={num} titulo={titulo} />
        </Sequence>
      ))}
      {/* cierre */}
      <Sequence from={s(CLIMAX)} durationInFrames={s(COMPAS2 * 2) + 8}>
        <TituloComaem dur={COMPAS2 * 2} grande />
      </Sequence>
      <Sequence from={s(CLIMAX + COMPAS2 * 2)} durationInFrames={s(FRASE - COMPAS2 * 2) + 30}>
        <Montaje />
      </Sequence>
      <Sequence from={s(CLIMAX + FRASE) - 12}>
        <Cortinilla dur={FIN - CLIMAX - FRASE + 0.4} />
      </Sequence>
      <Grain opacity={0.03} />
      <Audio src={staticFile('music/comaem_musica.wav')} volume={musicaVol} />
      {VOCES.map(([n, at, a, b]) => {
        const d = s(b - a);
        return (
          <Sequence key={n} from={s(at)} durationInFrames={d}>
            <Audio src={voz(n)} startFrom={s(a)} volume={(fr) => interpolate(fr, [0, 4, d - 5, d], [0, 1, 1, 0], clamp)} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
export const COMAEM_W = W;
export const COMAEM_H = H;
