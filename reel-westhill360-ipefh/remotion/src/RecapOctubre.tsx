import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Flash, Grain} from './components';
import {Banner, Sfx} from './shots';
import {C, F, SAFE_X, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Recap de octubre (reel 9:16), con el formato del recap de septiembre del cliente:
// arranque en frío con alguien hablando → título "Recap OCTUBRE" → secciones con etiqueta arriba a la
// izquierda y banderín UW → cierre con el logo sobre azul.
// Canción: "Hold On, We're Going Home" (100 BPM → 1 tiempo = 18 cuadros). Los cortes caen en los tiempos:
// la canción arranca desde MUSICA_DESDE para que su entrada fuerte (18.0 s) coincida con el título.
// Clips en public/proxies (IPEFH visita 1), proxies/v2 (visita 2), proxies/flyover, proxies/medico, proxies/titanic.
// PRIVACIDAD FlyOver: solo tramos donde no aparece el compañero en silla de ruedas (ver FlyOver.tsx).
// ---------------------------------------------------------------------------
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const BEAT = 18;
const sec = (s: number) => Math.round(s * 30);

type Toma = [src: string, from: number, beats: number];
type Seccion = {titulo: string; sub?: string; tomas: Toma[]};

/** Arranque en frío: "si usara tres palabras… pero bueno, no son más de tres palabras" */
const FRIO = {src: 'medico/v3_limpio', from: 5.0, to: 14.9};
export const FRIO_F = sec(FRIO.to - FRIO.from);
export const TITULO_F = 8 * BEAT;
export const FIN_F = 8 * BEAT;

const SECCIONES: Seccion[] = [
  {
    titulo: 'Experiencia Westhill 360',
    sub: 'Visitas de IPEFH',
    tomas: [
      ['IMG_0574', 0.1, 2],
      ['IMG_0509', 1.2, 1],
      ['IMG_0513', 1.0, 1],
      ['IMG_0522', 3.0, 2],
      ['v2/IMG_0909', 0.5, 2],
      ['v2/IMG_0899', 1.0, 1],
      ['v2/IMG_0884', 2.0, 1],
      ['v2/IMG_1040', 1.0, 2],
      ['v2/IMG_1057', 1.5, 2],
      ['IMG_0566_luz_fuerte', 0.5, 2],
      ['v2/IMG_0913', 2.0, 1],
      ['v2/IMG_0933', 1.5, 1],
      ['IMG_0596', 0.3, 2],
      ['IMG_0608', 1.0, 2],
      ['v2/IMG_0980', 3.0, 2],
    ],
  },
  {
    titulo: 'FlyOver México',
    sub: 'Coordinación de Inclusión',
    tomas: [
      ['flyover/fly_01', 0.2, 2],
      ['flyover/fly_04', 1.0, 2],
      ['flyover/fly_02', 0.5, 2],
      ['flyover/fly_05', 2.5, 2],
      ['flyover/fly_03', 1.5, 2],
      ['flyover/fly_06', 25.0, 2],
    ],
  },
  {
    titulo: 'Día del Médico',
    tomas: [
      ['medico/v2', 12.5, 2],
      ['medico/v1', 1.0, 2],
      ['medico/v5', 5.0, 1],
      ['medico/v7', 1.5, 1],
      ['medico/v8', 3.0, 1],
      ['medico/v4', 6.0, 1],
      ['medico/v9', 6.0, 2],
      ['medico/v2', 18.2, 2],
    ],
  },
  {
    titulo: 'Un viaje por el Titanic',
    sub: 'Coordinación de Inclusión',
    tomas: [
      ['titanic/t1', 0.3, 2],
      ['titanic/t3', 0.0, 1],
      ['titanic/t4', 0.5, 1],
      ['titanic/t2', 0.5, 2],
      ['titanic/t9', 2.0, 2],
      ['titanic/t10', 0.0, 2],
      ['titanic/t12', 3.0, 2],
      ['titanic/t14', 0.8, 2],
      ['titanic/t8', 0.0, 2],
    ],
  },
];

const durSeccion = (s: Seccion) => s.tomas.reduce((a, t) => a + t[2] * BEAT, 0);
const ARRANQUES = (() => {
  const r: number[] = [];
  let t = FRIO_F + TITULO_F;
  SECCIONES.forEach((s) => {
    r.push(t);
    t += durSeccion(s);
  });
  return {secciones: r, fin: t};
})();
export const RECAP_FRAMES = ARRANQUES.fin + FIN_F;
/** segundo de la canción en que empieza el video: su entrada fuerte (18.0 s) cae en el título */
const MUSICA_DESDE = 18.0 - FRIO_F / 30;

const Clip: React.FC<{src: string; from: number; dur: number; k: number}> = ({src, from, dur, k}) => {
  const f = useCurrentFrame();
  const golpe = 1.08 - 0.08 * tw(f, [0, 6], [0, 1], ease.out);
  const z = golpe + 0.04 * (f / dur);
  const x = (k % 2 ? 1 : -1) * 12 * (f / dur);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${z}) translateX(${x}px)`}}>
        <OffthreadVideo src={staticFile(`proxies/${src}.mp4`)} startFrom={sec(from)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Etiqueta de sección (como en el recap de septiembre): píldora azul arriba a la izquierda */
const Etiqueta: React.FC<{titulo: string; sub?: string; dur: number}> = ({titulo, sub, dur}) => {
  const f = useCurrentFrame();
  const p = tw(f, [4, 16], [0, 1], ease.back);
  const out = tw(f, [dur - 10, dur], [1, 0]);
  return (
    <div style={{position: 'absolute', left: SAFE_X - 20, top: 170, opacity: out, transform: `translateX(${(1 - p) * -500}px)`}}>
      <div style={{background: C.azul, borderRadius: 26, padding: '16px 28px 18px', boxShadow: '0 12px 30px rgba(0,0,0,0.35)', border: '3px solid rgba(255,255,255,0.85)', maxWidth: 780}}>
        <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 46, lineHeight: 1.05, color: '#fff'}}>{titulo}</div>
        {sub && <div style={{marginTop: 6, fontFamily: F.sans, fontWeight: 700, fontSize: 28, color: C.amarillo}}>{sub}</div>}
      </div>
    </div>
  );
};

const SeccionVid: React.FC<{s: Seccion}> = ({s}) => {
  let acc = 0;
  const dur = durSeccion(s);
  return (
    <AbsoluteFill>
      {s.tomas.map(([src, from, b], k) => {
        const d = b * BEAT;
        const at = acc;
        acc += d;
        return (
          <Sequence key={k} from={at} durationInFrames={d}>
            <Clip src={src} from={from} dur={d} k={k} />
          </Sequence>
        );
      })}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 22%)'}} />
      <Etiqueta titulo={s.titulo} sub={s.sub} dur={Math.min(dur, 6 * BEAT)} />
      <Flash at={0} dur={8} />
      <Sfx at={0} name="flash" volume={0.45} />
    </AbsoluteFill>
  );
};

/** Arranque en frío: la toma con su audio, sin rótulos */
const Frio: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${1.02 + 0.05 * (f / FRIO_F)})`}}>
        <OffthreadVideo src={staticFile(`proxies/${FRIO.src}.mp4`)} startFrom={sec(FRIO.from)} style={{width: '100%', height: '100%', objectFit: 'cover'}} volume={(fr) => interpolate(fr, [0, 4, FRIO_F - 6, FRIO_F], [0, 1, 1, 0], clamp)} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Título "Recap OCTUBRE" sobre tomas rápidas oscurecidas */
const FONDO_TITULO: Toma[] = [
  ['v2/IMG_0909', 1.0, 1],
  ['medico/v2', 14.0, 1],
  ['titanic/t10', 1.0, 1],
  ['IMG_0574', 0.6, 1],
  ['flyover/fly_04', 1.5, 1],
  ['v2/IMG_1057', 2.0, 1],
  ['titanic/t1', 1.0, 1],
  ['IMG_0596', 0.8, 1],
];
const Titulo: React.FC = () => {
  const f = useCurrentFrame();
  const r = tw(f, [2, 18], [0, 1]);
  const m = tw(f, [10, 24], [0, 1], ease.back);
  const glow = 0.6 + 0.4 * Math.sin(f / 5);
  const out = tw(f, [TITULO_F - 8, TITULO_F], [1, 0]);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {FONDO_TITULO.map(([src, from], k) => (
        <Sequence key={k} from={k * BEAT} durationInFrames={BEAT}>
          <AbsoluteFill style={{filter: 'brightness(0.32) saturate(0.8)'}}>
            <Clip src={src} from={from} dur={BEAT} k={k} />
          </AbsoluteFill>
        </Sequence>
      ))}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.75) 100%)'}} />
      <div style={{position: 'absolute', top: 760, width: '100%', textAlign: 'center', opacity: out}}>
        <div style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 150, lineHeight: 1, color: '#fff', opacity: r, filter: `blur(${(1 - r) * 10}px)`, transform: `translateY(${(1 - r) * -40}px)`, textShadow: `0 0 ${24 * glow}px rgba(255,255,255,0.6)`}}>Recap</div>
        <div style={{marginTop: 4, fontFamily: F.display, fontSize: 210, lineHeight: 1, letterSpacing: 6, color: '#fff', transform: `scale(${m})`, textShadow: `0 0 ${36 * glow}px rgba(242,194,48,0.8), 0 0 8px rgba(255,255,255,0.8)`}}>OCTUBRE</div>
      </div>
      <Flash at={0} dur={10} />
      <Sfx at={0} name="impact" volume={0.6} />
      <Sfx at={10} name="flicker" volume={0.5} />
    </AbsoluteFill>
  );
};

/** Cierre: logo sobre azul */
const Fin: React.FC = () => {
  const f = useCurrentFrame();
  const logo = tw(f, [6, 28], [0, 1]);
  const t = tw(f, [26, 40], [0, 1]);
  const negro = tw(f, [FIN_F - 24, FIN_F], [0, 1]);
  return (
    <AbsoluteFill style={{background: C.azul}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(61,139,212,0.9) 0%, rgba(39,99,154,0) 65%)'}} />
      <div style={{position: 'absolute', left: 240, top: 690, width: 600, clipPath: `inset(0 0 ${(1 - logo) * 100}% 0)`, transform: `translateY(${(1 - logo) * 30}px)`}}>
        <Img src={staticFile('logos/logo_westhill_blanco_total.png')} style={{width: '100%'}} />
      </div>
      <div style={{position: 'absolute', top: 1010, width: '100%', textAlign: 'center', opacity: t, transform: `translateY(${(1 - t) * 20}px)`}}>
        <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 48, color: '#fff'}}>¡Nos vemos en noviembre!</div>
        <div style={{marginTop: 18, fontFamily: F.sans, fontWeight: 800, fontSize: 32, letterSpacing: 8, color: C.amarillo}}>#SOMOSWESTHILL</div>
      </div>
      <AbsoluteFill style={{background: '#000', opacity: negro}} />
      <Flash at={0} dur={10} />
      <Sfx at={0} name="whoosh_largo" volume={0.45} />
    </AbsoluteFill>
  );
};

export const RecapOctubre: React.FC<{music?: boolean}> = ({music = true}) => {
  const inicioTitulo = FRIO_F;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence durationInFrames={FRIO_F}>
        <Frio />
      </Sequence>
      <Sequence from={inicioTitulo} durationInFrames={TITULO_F}>
        <Titulo />
      </Sequence>
      {SECCIONES.map((s, i) => (
        <Sequence key={i} from={ARRANQUES.secciones[i]} durationInFrames={durSeccion(s)}>
          <SeccionVid s={s} />
        </Sequence>
      ))}
      <Sequence from={ARRANQUES.fin} durationInFrames={FIN_F}>
        <Fin />
      </Sequence>
      <Sequence from={inicioTitulo} durationInFrames={ARRANQUES.fin - inicioTitulo}>
        <Banner />
      </Sequence>
      <Grain opacity={0.04} />
      {music && (
        <Audio
          src={staticFile('music/recap_octubre.mp3')}
          startFrom={sec(MUSICA_DESDE)}
          volume={(fr) => interpolate(fr, [0, 10, FRIO_F - 10, FRIO_F, RECAP_FRAMES - 40, RECAP_FRAMES], [0, 0.18, 0.18, 0.85, 0.85, 0], clamp)}
        />
      )}
    </AbsoluteFill>
  );
};
