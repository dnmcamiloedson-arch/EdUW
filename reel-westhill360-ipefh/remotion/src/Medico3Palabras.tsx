import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain, ScriptWord} from './components';
import {DiaMedico} from './DiaMedico';
import {Sfx} from './shots';
import {C, F, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Historia "Día del Médico · describe tu carrera en 3 palabras".
//  1. Intro de cine: pantalla negra, la voz del doctor y sus frases en blanco; su imagen aparece
//     oscura y desenfocada en una franja; termina con un latido de monitor.
//  2. Título con el estilo del banner (papel, ondas, West).
//  3. Respuestas: cada palabra aparece como estampa de papel rasgado justo cuando la dicen.
//  4. El que no pudo con 3 palabras.
//  5. El director con subtítulos palabra por palabra.
//  6. Cierre: el banner del Día del Médico armándose.
// Clips en public/proxies/medico (vN_limpio.mp4 = audio limpio con scripts/limpiar_voz.py).
// Tiempos de palabras medidos sobre el audio (Whisper + búsqueda del inicio de cada palabra).
// ---------------------------------------------------------------------------
const sec = (s: number) => Math.round(s * 30);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const vid = (n: string) => staticFile(`proxies/medico/${n}_limpio.mp4`);
const capa = (n: string) => staticFile(`photos/medico/${n}.png`);
const AZUL_T = '#0E4C8E'; // azul del título del banner
const PAPEL = '#FBF9F5';

const Clip: React.FC<{n: string; from: number; dur: number; vol?: number; style?: React.CSSProperties}> = ({n, from, dur, vol = 1, style}) => (
  <OffthreadVideo
    src={vid(n)}
    startFrom={sec(from)}
    volume={(fr) => vol * interpolate(fr, [0, 3, dur - 4, dur], [0, 1, 1, 0], clamp)}
    style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, objectFit: 'cover', ...style}}
  />
);

const Papel: React.FC = () => (
  <AbsoluteFill style={{background: PAPEL}}>
    <Img src={capa('fondo')} style={{width: 1080, height: 1920}} />
    <AbsoluteFill>
      <Img src={capa('trama')} style={{width: 1080, height: 1920, opacity: 0.8}} />
    </AbsoluteFill>
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// 1. Intro de cine
// ---------------------------------------------------------------------------
type Linea = {text: string; at: number; big?: boolean; amarillo?: boolean};
type Tarjeta = {from: number; to: number; lineas: Linea[]};
const VOZ_AT = 36; // cuadros de negro antes de la voz
const BANDA_AT = 11.6; // segundo de la voz en que aparece su imagen
const FIN_VOZ = 16.1;
const INTRO_TARJETAS: Tarjeta[] = [
  {from: 0.4, to: 3.3, lineas: [{text: 'Una de las cosas', at: 0.5}, {text: 'más hermosas', at: 1.35, big: true}]},
  {from: 3.4, to: 7.95, lineas: [{text: 'Por un lado', at: 3.5}, {text: 'poder ayudar', at: 5.8, big: true}, {text: 'a la gente con problemas', at: 6.9}]},
  {from: 8.0, to: 11.5, lineas: [{text: 'Por otro lado', at: 8.1}, {text: 'que no tenga problemas de salud', at: 10.2, big: true}]},
  {from: 11.6, to: 13.95, lineas: [{text: 'A través de la', at: 11.7}, {text: 'prevención', at: 12.0, big: true}, {text: 'y la promoción', at: 12.85, big: true}]},
  {from: 14.05, to: 17.2, lineas: [{text: 'Nada como', at: 14.1}, {text: 'la carrera de medicina', at: 14.7, big: true, amarillo: true}]},
];
export const INTRO_FRAMES = VOZ_AT + sec(FIN_VOZ) + 40;

const TarjetaCine: React.FC<{t: Tarjeta; abajo: boolean}> = ({t, abajo}) => {
  const f = useCurrentFrame();
  const a = VOZ_AT + sec(t.from);
  const b = VOZ_AT + sec(t.to);
  const out = tw(f, [b - 8, b], [1, 0]);
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: abajo ? 1400 : 760, textAlign: 'center', opacity: out}}>
      {t.lineas.map((l) => {
        const s = VOZ_AT + sec(l.at);
        const p = tw(f, [s, s + 14], [0, 1]);
        return (
          <div
            key={l.text}
            style={{
              fontFamily: l.big ? F.serif : F.sans,
              fontStyle: l.big ? 'italic' : 'normal',
              fontWeight: l.big ? 600 : 500,
              fontSize: l.big ? 84 : 40,
              letterSpacing: l.big ? 0 : 8,
              textTransform: l.big ? 'none' : 'uppercase',
              lineHeight: 1.25,
              color: l.amarillo ? C.amarillo : '#F4F1EA',
              textShadow: l.amarillo ? `0 0 26px rgba(242,194,48,0.55)` : '0 0 18px rgba(255,255,255,0.18)',
              opacity: p,
              filter: `blur(${(1 - p) * 10}px)`,
              transform: `translateY(${(1 - p) * 18}px)`,
              marginTop: l.big ? 6 : 0,
            }}
          >
            {l.text}
          </div>
        );
      })}
    </div>
  );
};

const IntroCine: React.FC = () => {
  const f = useCurrentFrame();
  const banda = VOZ_AT + sec(BANDA_AT);
  const vis = interpolate(f, [banda, banda + 40, VOZ_AT + sec(FIN_VOZ), INTRO_FRAMES - 10], [0, 0.6, 0.75, 0], clamp);
  const blur = interpolate(f, [banda, VOZ_AT + sec(FIN_VOZ)], [8, 2], clamp);
  const push = 1.04 + 0.05 * tw(f, [banda, INTRO_FRAMES], [0, 1], ease.inOut);
  const ecg = tw(f, [VOZ_AT + sec(15.2), VOZ_AT + sec(16.3)], [0, 1], ease.inOut);
  const ecgOut = tw(f, [INTRO_FRAMES - 14, INTRO_FRAMES - 4], [1, 0]);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {/* franja de cine con su imagen (el audio sale del mismo clip) */}
      <AbsoluteFill style={{clipPath: 'inset(560px 0 600px 0)', opacity: vis}}>
        <AbsoluteFill style={{transform: `translateY(470px) scale(${push})`, transformOrigin: '540px 420px', filter: `blur(${blur}px) grayscale(0.55) brightness(0.75) contrast(1.1)`}}>
          <Sequence from={VOZ_AT} layout="none">
            <Clip n="v1" from={0} dur={INTRO_FRAMES - VOZ_AT} vol={1} />
          </Sequence>
        </AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)'}} />
      {INTRO_TARJETAS.map((t, i) => (
        <TarjetaCine key={i} t={t} abajo={t.from >= BANDA_AT} />
      ))}
      {/* electro que cruza la franja al final */}
      <svg width={1080} height={240} style={{position: 'absolute', left: 0, top: 1210, opacity: ecgOut}}>
        <path
          d="M0 120 L380 120 L420 120 L450 40 L490 210 L520 80 L545 120 L1080 120"
          fill="none"
          stroke={C.amarillo}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - ecg}
          style={{filter: `drop-shadow(0 0 10px ${C.amarillo})`}}
        />
      </svg>
      <Grain opacity={0.09} />
      <Sfx at={8} name="latido" volume={0.6} />
      <Sfx at={VOZ_AT + sec(15.7)} name="beep_monitor" volume={0.5} />
      <Sfx at={INTRO_FRAMES - 16} name="latido" volume={0.7} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 2. Título
// ---------------------------------------------------------------------------
export const TITULO_FRAMES = 105;
const Titulo: React.FC = () => {
  const f = useCurrentFrame();
  const west = tw(f, [10, 34], [0, 1]);
  const ondas = tw(f, [0, 22], [0, 1]);
  const l1 = tw(f, [8, 22], [0, 1]);
  const cinta = tw(f, [16, 30], [0, 100], ease.inOut);
  const l2 = tw(f, [26, 38], [0, 1], ease.back);
  const l3 = tw(f, [36, 50], [0, 1]);
  const tres = tw(f, [46, 58], [0, 1], ease.back);
  return (
    <AbsoluteFill>
      <Papel />
      <Img src={capa('ondas_0')} style={{position: 'absolute', left: 0, top: 872, width: 206, height: 687, transform: `translateX(${-230 * (1 - ondas)}px)`}} />
      <AbsoluteFill style={{transformOrigin: '0 0', transform: `translate(${228 + (1 - west) * 240}px, ${291 + 120}px) scale(0.79)`, opacity: Math.min(1, west * 3)}}>
        <Img src={capa('lince')} style={{width: 1080, height: 1920}} />
      </AbsoluteFill>
      <Img src={capa('ondas_2')} style={{position: 'absolute', left: 0, top: 1583, width: 1080, height: 337, transform: `translateY(${360 * (1 - ondas)}px)`}} />
      <div style={{position: 'absolute', left: 74, top: 330, fontFamily: F.sans, fontWeight: 900, fontSize: 92, color: AZUL_T, letterSpacing: -2, opacity: l1, transform: `translateY(${(1 - l1) * -40}px)`, filter: `blur(${(1 - l1) * 8}px)`}}>
        Describe tu
      </div>
      <div style={{position: 'absolute', left: 40, top: 445, width: 600, height: 170, clipPath: `inset(0 ${100 - cinta}% 0 0)`}}>
        <Img src={capa('cinta_strip')} style={{width: '100%', height: '100%'}} />
      </div>
      <div style={{position: 'absolute', left: 78, top: 462, fontFamily: F.sans, fontWeight: 900, fontSize: 112, color: '#fff', letterSpacing: -2, transformOrigin: '250px 70px', transform: `scale(${0.6 + 0.4 * l2})`, opacity: Math.min(1, l2 * 2)}}>
        carrera
      </div>
      <div style={{position: 'absolute', left: 78, top: 660, display: 'flex', alignItems: 'center', gap: 18, fontFamily: F.sans, fontWeight: 800, fontSize: 64, color: AZUL_T, opacity: l3}}>
        en
        <span style={{display: 'inline-flex', width: 104, height: 104, borderRadius: 52, background: C.amarillo, color: AZUL_T, justifyContent: 'center', alignItems: 'center', fontWeight: 900, fontSize: 74, transform: `scale(${tres}) rotate(${(1 - tres) * -90}deg)`}}>
          3
        </span>
        palabras
      </div>
      <Sfx at={2} name="swipe" volume={0.4} />
      <Sfx at={8} name="whoosh" volume={0.35} />
      <Sfx at={16} name="hist_paper" volume={0.6} />
      <Sfx at={26} name="pop" volume={0.5} />
      <Sfx at={46} name="pop" volume={0.6} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 3. Respuestas
// ---------------------------------------------------------------------------
type Palabra = {text: string; t: number; script?: boolean};
type Respuesta = {n: string; from: number; to: number; palabras: Palabra[]; reemplaza?: boolean; extra?: (dur: number) => React.ReactNode};

/** Estampa de papel rasgado con la palabra */
const Estampa: React.FC<{text: string; at: number; i: number; total: number; reemplaza?: boolean; hasta?: number}> = ({text, at, i, total, reemplaza, hasta}) => {
  const f = useCurrentFrame();
  const p = tw(f, [at, at + 12], [0, 1], ease.back);
  const out = hasta !== undefined ? tw(f, [hasta, hasta + 8], [1, 0]) : 1;
  const blanco = i % 2 === 1;
  const fs = Math.min(84, Math.floor(1150 / Math.max(6, text.length)));
  const tilt = [-3, 2.5, -1.5, 2][i % 4];
  const y = reemplaza ? 1240 : 1500 - (total - 1 - i) * 150;
  return (
    <div style={{position: 'absolute', top: y, width: '100%', display: 'flex', justifyContent: 'center', opacity: Math.min(1, p * 2) * out}}>
      <div style={{position: 'relative', padding: `${fs * 0.26}px ${fs * 0.55}px ${fs * 0.32}px`, transform: `rotate(${tilt}deg) scale(${0.45 + 0.55 * p})`, filter: 'drop-shadow(0 10px 16px rgba(0,0,0,0.35))'}}>
        <Img src={capa('cinta_strip')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', filter: blanco ? 'grayscale(1) brightness(3.4)' : 'none'}} />
        <span style={{position: 'relative', fontFamily: F.sans, fontWeight: 900, fontSize: fs, letterSpacing: -1, color: blanco ? AZUL_T : '#fff', whiteSpace: 'nowrap'}}>{text}</span>
      </div>
    </div>
  );
};

/** Pregunta fija arriba, como sticker de pregunta de historia */
const Pregunta: React.FC = () => (
  <div style={{position: 'absolute', top: 210, width: '100%', display: 'flex', justifyContent: 'center'}}>
    <div style={{background: '#fff', borderRadius: 26, padding: '16px 30px', boxShadow: '0 12px 30px rgba(0,0,0,0.25)', fontFamily: F.sans, fontWeight: 800, fontSize: 34, color: AZUL_T, display: 'flex', alignItems: 'center', gap: 12}}>
      Describe tu carrera en
      <span style={{display: 'inline-flex', width: 50, height: 50, borderRadius: 25, background: C.amarillo, justifyContent: 'center', alignItems: 'center', fontWeight: 900}}>3</span>
      palabras
    </div>
  </div>
);

const RespuestaShot: React.FC<{r: Respuesta}> = ({r}) => {
  const f = useCurrentFrame();
  const dur = sec(r.to - r.from);
  const punch = 1.08 - 0.08 * tw(f, [0, 8], [0, 1]);
  const estampas = r.palabras.filter((p) => !p.script);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${punch + 0.03 * (f / dur)})`}}>
        <Clip n={r.n} from={r.from} dur={dur} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.5) 100%)'}} />
      {estampas.map((p, i) => {
        const at = sec(p.t - r.from);
        const sig = r.palabras[r.palabras.indexOf(p) + 1];
        const hasta = r.reemplaza && sig ? sec(sig.t - r.from) - 2 : undefined;
        return <Estampa key={i} text={p.text} at={at} i={i} total={r.reemplaza ? 1 : estampas.length} reemplaza={r.reemplaza} hasta={hasta} />;
      })}
      {r.palabras
        .filter((p) => p.script)
        .map((p) => (
          <div key={p.text} style={{position: 'absolute', top: r.reemplaza ? 1220 : 1500 - estampas.length * 150 - 40, left: 60, right: 60, textAlign: 'center'}}>
            <ScriptWord text={p.text} start={sec(p.t - r.from)} size={Math.min(130, Math.floor(2300 / p.text.length))} neon tilt={-5} dur={16} />
          </div>
        ))}
      {r.extra?.(dur)}
      {estampas.map((p, i) => (
        <Sfx key={i} at={sec(p.t - r.from)} name="pop" volume={0.45} />
      ))}
      <Sfx at={0} name="swipe" volume={0.35} />
    </AbsoluteFill>
  );
};

/** "¿3 palabras?" tachado cuando el chico admite que fueron más */
const MasDeTres: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  const p = tw(f, [at, at + 12], [0, 1], ease.back);
  const tache = tw(f, [at + 12, at + 22], [0, 1], ease.inOut);
  return (
    <div style={{position: 'absolute', top: 360, width: '100%', display: 'flex', justifyContent: 'center', opacity: Math.min(1, p * 2)}}>
      <div style={{position: 'relative', background: C.amarillo, borderRadius: 18, padding: '14px 34px', transform: `rotate(-6deg) scale(${p})`, fontFamily: F.sans, fontWeight: 900, fontSize: 64, color: AZUL_T, boxShadow: '0 12px 30px rgba(0,0,0,0.3)'}}>
        3 palabras
        <div style={{position: 'absolute', left: 20, top: '50%', height: 9, borderRadius: 5, width: `${tache * 88}%`, background: '#C8323C', transform: 'rotate(-4deg)'}} />
      </div>
    </div>
  );
};

/** Aviso antes del que no pudo con 3 palabras */
export const AVISO_FRAMES = 60;
const Aviso: React.FC = () => {
  const f = useCurrentFrame();
  const p = tw(f, [4, 18], [0, 1]);
  return (
    <AbsoluteFill>
      <Papel />
      <div style={{position: 'absolute', top: 740, width: '100%', textAlign: 'center', fontFamily: F.sans, fontWeight: 800, fontSize: 56, color: AZUL_T, opacity: p, transform: `translateY(${(1 - p) * 20}px)`}}>
        …y hubo quien
      </div>
      <div style={{position: 'absolute', top: 830, width: '100%', textAlign: 'center'}}>
        <ScriptWord text="no pudo con solo 3" start={16} size={120} color={C.azul} tilt={-5} dur={16} />
      </div>
      <Sfx at={4} name="whoosh" volume={0.35} />
      <Sfx at={16} name="flicker" volume={0.35} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 5. Director con subtítulos palabra por palabra
// ---------------------------------------------------------------------------
type Sub = {from: number; to: number; text: string};
/** Tramos del clip del director que se usan (se quita un pedazo que no se entiende) */
const DIR_TRAMOS: [number, number][] = [
  [0, 3.7],
  [6.9, 21.9],
];
/** segundo del clip original → cuadro dentro de la sección */
const dirLocal = (t: number) => {
  let acc = 0;
  for (const [a, b] of DIR_TRAMOS) {
    if (t <= b) return sec(acc + Math.max(0, t - a));
    acc += b - a;
  }
  return sec(acc);
};
const SUBS: Sub[] = [
  {from: 0.1, to: 3.6, text: 'Reconocer a quienes han dedicado su vida a cuidar a otros'},
  {from: 7.0, to: 10.5, text: 'y a quienes apenas inician este camino.'},
  {from: 10.6, to: 13.8, text: 'A nuestros alumnos quiero decirles algo:'},
  {from: 14.0, to: 17.4, text: 'su formación como médicos…'},
  {from: 17.6, to: 21.8, text: '…se construye cuando estudian con responsabilidad.'},
];
export const DIRECTOR_FRAMES = dirLocal(DIR_TRAMOS[DIR_TRAMOS.length - 1][1]);
const Subtitulo: React.FC<{s: Sub}> = ({s}) => {
  const f = useCurrentFrame();
  const words = s.text.split(' ');
  const a = dirLocal(s.from);
  const b = dirLocal(s.to);
  const step = (b - a - 6) / words.length;
  if (f < a - 2 || f > b + 6) return null;
  return (
    <div style={{position: 'absolute', top: 1330, left: 90, right: 90, textAlign: 'center', fontFamily: F.sans, fontWeight: 800, fontSize: 54, lineHeight: 1.3, opacity: tw(f, [b, b + 6], [1, 0])}}>
      {words.map((w, i) => {
        const at = a + i * step;
        const on = f >= at;
        const cur = on && f < at + step + 2;
        return (
          <span
            key={i}
            style={{
              color: cur ? C.amarillo : '#fff',
              opacity: on ? 1 : 0,
              display: 'inline-block',
              transform: `translateY(${on ? 0 : 10}px)`,
              textShadow: '0 4px 14px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)',
              marginRight: '0.28em',
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};
const Director: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    {DIR_TRAMOS.map(([a, b]) => (
      <Sequence key={a} from={dirLocal(a)} durationInFrames={sec(b - a)}>
        <Clip n="v2" from={a} dur={sec(b - a)} />
      </Sequence>
    ))}
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)'}} />
    {SUBS.map((s, i) => (
      <Subtitulo key={i} s={s} />
    ))}
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Línea de tiempo
// ---------------------------------------------------------------------------
const RESPUESTAS: Respuesta[] = [
  {n: 'v5', from: 4.0, to: 9.05, palabras: [{text: 'Apasionante', t: 5.15}, {text: 'Divertida', t: 6.3}, {text: 'Sumamente interesante', t: 7.6}]},
  {n: 'v7', from: 0.75, to: 5.65, palabras: [{text: 'Retadora', t: 2.0}, {text: 'Divertida', t: 3.3}, {text: 'Competitiva', t: 4.8}]},
  {n: 'v8', from: 1.0, to: 6.9, palabras: [{text: 'Inspiradora', t: 2.9}, {text: 'Retadora', t: 4.35}, {text: 'Muy divertida', t: 5.75}]},
  {n: 'v4', from: 6.0, to: 9.3, palabras: [{text: 'Divertida', t: 6.2}, {text: 'Demandante', t: 8.3}]},
  {n: 'v6', from: 0.0, to: 7.9, reemplaza: true, palabras: [{text: 'Interesante', t: 0.4}, {text: 'Demandante', t: 2.31}, {text: 'Demandante', t: 4.15}, {text: 'La mejor decisión de mi vida', t: 5.75, script: true}]},
  {n: 'v9', from: 5.0, to: 13.4, palabras: [{text: 'Hermosa', t: 5.9}, {text: 'Muy cansada', t: 8.0}, {text: 'Bastante pesada', t: 10.2}, {text: 'pero sobre todo hermosa', t: 11.5, script: true}]},
];
const MAS_DE_TRES: Respuesta = {
  n: 'v3',
  from: 5.0,
  to: 18.6,
  palabras: [{text: 'Muy cansada', t: 6.8}, {text: 'Muy divertida', t: 8.6}, {text: 'Llena de experiencias', t: 10.6}, {text: 'me ha llenado de mucha vida', t: 16.9, script: true}],
  extra: () => <MasDeTres at={sec(13.9 - 5.0)} />,
};

type Bloque = {dur: number; el: React.ReactNode; musica: number};
const respDur = (r: Respuesta) => sec(r.to - r.from);
const FINAL_DESDE = 100; // cuadro interno de DiaMedico desde el que se muestra
const FINAL_FRAMES = 330 - FINAL_DESDE;
const BLOQUES: Bloque[] = [
  {dur: INTRO_FRAMES, el: <IntroCine />, musica: 0},
  {dur: TITULO_FRAMES, el: <Titulo />, musica: 0.4},
  ...RESPUESTAS.map((r) => ({dur: respDur(r), el: <RespuestaShot r={r} />, musica: 0.1})),
  {dur: AVISO_FRAMES, el: <Aviso />, musica: 0.35},
  {dur: respDur(MAS_DE_TRES), el: <RespuestaShot r={MAS_DE_TRES} />, musica: 0.1},
  {dur: DIRECTOR_FRAMES, el: <Director />, musica: 0.1},
  {
    dur: FINAL_FRAMES,
    el: (
      <Sequence from={-FINAL_DESDE}>
        <DiaMedico music={false} />
      </Sequence>
    ),
    musica: 0.45,
  },
];
const STARTS = BLOQUES.reduce<number[]>((a, b, i) => [...a, i === 0 ? 0 : a[i - 1] + BLOQUES[i - 1].dur], []);
export const M3P_FRAMES = STARTS[STARTS.length - 1] + BLOQUES[BLOQUES.length - 1].dur;
/** Inicio de la música (después de la intro de cine) */
export const MUSICA_DESDE = INTRO_FRAMES;

export const Medico3Palabras: React.FC<{music?: boolean}> = ({music = true}) => {
  const vol = (fr: number) => {
    const g = fr + MUSICA_DESDE;
    const i = STARTS.findIndex((s, k) => g >= s && g < s + BLOQUES[k].dur);
    const v = i >= 0 ? BLOQUES[i].musica : 0;
    const prev = i > 0 ? BLOQUES[i - 1].musica : v;
    const fade = interpolate(g, [STARTS[i] ?? 0, (STARTS[i] ?? 0) + 12], [prev, v], clamp);
    return fade * interpolate(g, [M3P_FRAMES - 45, M3P_FRAMES], [1, 0], clamp);
  };
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {BLOQUES.map((b, i) => (
        <Sequence key={i} from={STARTS[i]} durationInFrames={b.dur}>
          {b.el}
        </Sequence>
      ))}
      <Sequence from={STARTS[2]} durationInFrames={STARTS[2 + RESPUESTAS.length] - STARTS[2]}>
        <Pregunta />
      </Sequence>
      {music && (
        <Sequence from={MUSICA_DESDE}>
          <Audio src={staticFile('music/medico_3palabras.mp3')} volume={vol} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
