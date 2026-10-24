import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from './components';
import {Sfx} from './shots';
import {F, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Historia de Inclusión: "¡Un viaje por la historia del Titanic!" (Aprendizaje en Comunidad).
// Estilo elegante de cartel de cine: serif clásica dorada (Cinzel), fundidos suaves, look cálido.
// Capítulos con las palabras del texto: Explorar · Observar · Descubrir. La parte fuerte de
// "My Heart Will Go On" (69.9 s de la canción) cae justo al empezar "Descubrir".
// Clips en public/proxies/titanic (tN.mp4, de los videos de WhatsApp escalados a 1080x1920).
// ---------------------------------------------------------------------------
const sec = (s: number) => Math.round(s * 30);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const XF = 10; // fundido entre tomas
const ORO = '#E2C27D';
const ORO_GRAD = 'linear-gradient(180deg, #F6E3B0 0%, #D8B064 55%, #A97B35 100%)';
const NOCHE = '#0A1420';
const CLIMAX = 69.9; // segundo de la canción donde entra la parte fuerte

type Plano = {n: string; from: number; dur: number; capitulo?: Capitulo; push?: number};
type Capitulo = {titulo: string; sub: string};

const EXPLORAR: Capitulo = {titulo: 'Explorar', sub: 'cada rincón de su historia'};
const OBSERVAR: Capitulo = {titulo: 'Observar', sub: 'los detalles que la cuentan'};
const DESCUBRIR: Capitulo = {titulo: 'Descubrir', sub: 'lo que se vivió a bordo'};

const INTRO: Plano[] = [{n: 't1', from: 0.3, dur: 6.0, push: 0.06}];
const AULA: Plano[] = [
  {n: 't3', from: 0.0, dur: 3.0},
  {n: 't4', from: 0.5, dur: 3.2},
];
const PLANOS_EXPLORAR: Plano[] = [
  {n: 't2', from: 0.5, dur: 2.8, capitulo: EXPLORAR},
  {n: 't7', from: 5.0, dur: 2.6},
  {n: 't13', from: 0.0, dur: 2.4},
];
const PLANOS_OBSERVAR: Plano[] = [
  {n: 't5', from: 0.3, dur: 2.5, capitulo: OBSERVAR},
  {n: 't5', from: 6.9, dur: 2.4},
  {n: 't6', from: 0.4, dur: 2.5},
];
const PLANOS_DESCUBRIR: Plano[] = [
  {n: 't9', from: 2.0, dur: 2.6, capitulo: DESCUBRIR},
  {n: 't10', from: 0.0, dur: 3.0},
  {n: 't10', from: 11.0, dur: 2.8},
  {n: 't12', from: 3.0, dur: 3.2},
  {n: 't14', from: 0.8, dur: 3.2},
];
const COMUNIDAD: Plano[] = [{n: 't8', from: 0.0, dur: 3.1, push: 0.05}];
const CIERRE: Plano[] = [{n: 't11', from: 2.5, dur: 4.6, push: 0.05}];
const PLANOS: Plano[] = [...INTRO, ...AULA, ...PLANOS_EXPLORAR, ...PLANOS_OBSERVAR, ...PLANOS_DESCUBRIR, ...COMUNIDAD, ...CIERRE];

// inicio (cuadro) de cada toma: cada una entra XF cuadros antes de que acabe la anterior
const INICIOS = PLANOS.reduce<number[]>((a, p, i) => [...a, i === 0 ? 0 : a[i - 1] + sec(PLANOS[i - 1].dur) - XF], []);
const inicioDe = (p: Plano) => INICIOS[PLANOS.indexOf(p)];
const finDe = (p: Plano) => inicioDe(p) + sec(p.dur);
export const END_FRAMES = 105;
const END_AT = finDe(CIERRE[CIERRE.length - 1]) - XF;
export const TITANIC_FRAMES = END_AT + END_FRAMES;
/** La música arranca de modo que su parte fuerte coincida con "Descubrir" */
const MUSICA_DESDE = CLIMAX - inicioDe(PLANOS_DESCUBRIR[0]) / 30;

const Toma: React.FC<{p: Plano}> = ({p}) => {
  const f = useCurrentFrame();
  const d = sec(p.dur);
  const op = interpolate(f, [0, XF], [0, 1], clamp);
  const s = 1.02 + (p.push ?? 0.04) * (f / d);
  return (
    <AbsoluteFill style={{opacity: op}}>
      <AbsoluteFill style={{transform: `scale(${s})`, filter: 'contrast(1.06) saturate(0.88) brightness(0.95) sepia(0.12)'}}>
        <OffthreadVideo src={staticFile(`proxies/titanic/${p.n}.mp4`)} startFrom={sec(p.from)} muted style={{width: 1080, height: 1920, objectFit: 'cover'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Línea dorada fina que crece desde el centro */
const Regla: React.FC<{at: number; w?: number}> = ({at, w = 260}) => {
  const f = useCurrentFrame();
  const p = tw(f, [at, at + 18], [0, 1], ease.inOut);
  return <div style={{width: w * p, height: 2, background: ORO, margin: '0 auto', opacity: 0.9}} />;
};

const Dorado: React.FC<{children: React.ReactNode; size: number; spacing?: number; style?: React.CSSProperties}> = ({children, size, spacing = 10, style}) => (
  <span
    style={{
      fontFamily: F.clasica,
      fontWeight: 700,
      fontSize: size,
      letterSpacing: spacing,
      backgroundImage: ORO_GRAD,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      filter: 'drop-shadow(0 4px 18px rgba(0,0,0,0.55))',
      ...style,
    }}
  >
    {children}
  </span>
);

/** Aparición elegante: sube, se enfoca y se abre el espaciado */
const useEntra = (at: number, dur = 18) => {
  const f = useCurrentFrame();
  const p = tw(f, [at, at + dur], [0, 1]);
  return {opacity: p, transform: `translateY(${(1 - p) * 26}px)`, filter: `blur(${(1 - p) * 8}px)`};
};

const Titulo: React.FC = () => {
  const f = useCurrentFrame();
  const fin = sec(INTRO[0].dur) - 14;
  const out = tw(f, [fin, fin + 12], [1, 0]);
  const tit = tw(f, [24, 54], [0, 1]);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,20,32,0) 40%, rgba(10,20,32,0.85) 78%)'}} />
      <div style={{position: 'absolute', top: 1170, width: '100%', textAlign: 'center'}}>
        <div style={{...useEntra(10), fontFamily: F.clasica, fontWeight: 400, fontSize: 34, letterSpacing: 7, color: '#F3EBDD'}}>UN VIAJE POR LA HISTORIA DEL</div>
        <div style={{marginTop: 18}}>
          <Regla at={20} w={520} />
        </div>
        <div style={{marginTop: 10, opacity: tit, filter: `blur(${(1 - tit) * 10}px)`, transform: `scale(${1.08 - 0.08 * tit})`}}>
          <Dorado size={150} spacing={10 + 14 * (1 - tit)}>
            TITANIC
          </Dorado>
        </div>
        <div style={{marginTop: 6}}>
          <Regla at={40} w={520} />
        </div>
        <div style={{...useEntra(58), marginTop: 30, fontFamily: F.sans, fontWeight: 600, fontSize: 30, letterSpacing: 6, color: '#F3EBDD'}}>COORDINACIÓN DE INCLUSIÓN</div>
      </div>
      <Sfx at={20} name="whoosh_largo" volume={0.25} />
    </AbsoluteFill>
  );
};

/** Texto suave abajo, para frases del copy */
const Frase: React.FC<{dur: number; arriba?: string; grande: string; abajo?: string; top?: number}> = ({dur, arriba, grande, abajo, top = 1300}) => {
  const f = useCurrentFrame();
  const out = tw(f, [dur - 12, dur], [1, 0]);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,20,32,0) 45%, rgba(10,20,32,0.82) 82%)'}} />
      <div style={{position: 'absolute', top, left: 80, right: 80, textAlign: 'center'}}>
        {arriba && <div style={{...useEntra(6), fontFamily: F.clasica, fontSize: 34, letterSpacing: 8, color: '#F3EBDD'}}>{arriba}</div>}
        <div style={{...useEntra(16), marginTop: 10, fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 80, lineHeight: 1.12, color: ORO, textShadow: '0 4px 20px rgba(0,0,0,0.6)'}}>{grande}</div>
        {abajo && <div style={{...useEntra(30), marginTop: 18, fontFamily: F.sans, fontWeight: 600, fontSize: 30, letterSpacing: 4, color: '#F3EBDD'}}>{abajo}</div>}
      </div>
    </AbsoluteFill>
  );
};

/** Título de capítulo: palabra dorada al centro con reglas finas */
const CapituloTitulo: React.FC<{c: Capitulo}> = ({c}) => {
  const f = useCurrentFrame();
  const out = tw(f, [52, 66], [1, 0]);
  const p = tw(f, [4, 26], [0, 1]);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(10,20,32,0.55) 0%, rgba(10,20,32,0) 60%)'}} />
      <div style={{position: 'absolute', top: 820, width: '100%', textAlign: 'center'}}>
        <Regla at={2} w={300} />
        <div style={{marginTop: 18, opacity: p, filter: `blur(${(1 - p) * 10}px)`}}>
          <Dorado size={118} spacing={8 + 18 * (1 - p)}>
            {c.titulo.toUpperCase()}
          </Dorado>
        </div>
        <div style={{...useEntra(18), marginTop: 6, fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 46, color: '#F3EBDD', textShadow: '0 3px 14px rgba(0,0,0,0.7)'}}>{c.sub}</div>
        <div style={{marginTop: 22}}>
          <Regla at={10} w={300} />
        </div>
      </div>
      <Sfx at={2} name="whoosh" volume={0.22} />
    </AbsoluteFill>
  );
};

/** Cierre: cielo de noche con estrellas, logo y Coordinación de Inclusión; se desvanece a negro */
const ESTRELLAS = Array.from({length: 70}, (_, i) => ({x: (i * 397) % 1080, y: (i * 613) % 1920, r: 1 + (i % 3), ph: i * 1.7}));
const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const entra = tw(f, [0, 14], [0, 1]);
  const logo = tw(f, [10, 34], [0, 1]);
  const negro = tw(f, [END_FRAMES - 24, END_FRAMES - 2], [0, 1]);
  return (
    <AbsoluteFill style={{background: NOCHE, opacity: entra}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, rgba(60,90,120,0.45) 0%, rgba(10,20,32,0) 62%)'}} />
      {ESTRELLAS.map((s, i) => (
        <div key={i} style={{position: 'absolute', left: s.x, top: s.y, width: s.r * 2, height: s.r * 2, borderRadius: s.r, background: '#fff', opacity: 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(f / 9 + s.ph))}} />
      ))}
      <div style={{position: 'absolute', left: 230, top: 700, width: 620, clipPath: `inset(0 0 ${(1 - logo) * 100}% 0)`, transform: `translateY(${(1 - logo) * 24}px)`}}>
        <Img src={staticFile('logos/logo_westhill_blanco_total.png')} style={{width: '100%'}} />
      </div>
      <div style={{position: 'absolute', top: 1010, width: '100%', textAlign: 'center'}}>
        <Regla at={30} w={420} />
        <div style={{...useEntra(36), marginTop: 22}}>
          <Dorado size={40} spacing={8}>
            COORDINACIÓN DE INCLUSIÓN
          </Dorado>
        </div>
        <div style={{...useEntra(46), marginTop: 18, fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 40, color: '#F3EBDD'}}>Aprendizaje en Comunidad</div>
        <div style={{...useEntra(58), marginTop: 40, fontFamily: F.sans, fontWeight: 800, fontSize: 30, letterSpacing: 8, color: ORO}}>#SOMOSWESTHILL</div>
      </div>
      <AbsoluteFill style={{background: '#000', opacity: negro}} />
      <Sfx at={10} name="whoosh_largo" volume={0.2} />
    </AbsoluteFill>
  );
};

const seccion = (ps: Plano[]) => ({from: inicioDe(ps[0]), dur: finDe(ps[ps.length - 1]) - inicioDe(ps[0])});

export const Titanic: React.FC<{music?: boolean}> = ({music = true}) => {
  const aula = seccion(AULA);
  const com = seccion(COMUNIDAD);
  const cie = seccion(CIERRE);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {PLANOS.map((p, i) => (
        <Sequence key={i} from={INICIOS[i]} durationInFrames={sec(p.dur)}>
          <Toma p={p} />
          {p.capitulo && <CapituloTitulo c={p.capitulo} />}
        </Sequence>
      ))}
      <Sequence from={0} durationInFrames={sec(INTRO[0].dur)}>
        <Titulo />
      </Sequence>
      <Sequence from={aula.from + 6} durationInFrames={aula.dur - 6}>
        <Frase dur={aula.dur - 6} arriba="EXPERIENCIAS DE APRENDIZAJE" grande="más allá del aula" />
      </Sequence>
      <Sequence from={com.from} durationInFrames={com.dur}>
        <Frase dur={com.dur} arriba="APRENDIZAJE EN" grande="Comunidad" abajo="AUTONOMÍA · PARTICIPACIÓN · VIDA COTIDIANA" top={1240} />
      </Sequence>
      <Sequence from={cie.from} durationInFrames={cie.dur}>
        <Frase dur={cie.dur} arriba="PORQUE APRENDER TAMBIÉN ES" grande="explorar, descubrir y vivir nuevas experiencias" top={1180} />
      </Sequence>
      {/* viñeta y grano de película */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none'}} />
      <Grain opacity={0.06} />
      <Sequence from={END_AT} durationInFrames={END_FRAMES}>
        <EndCard />
      </Sequence>
      {music && (
        <Audio
          src={staticFile('music/titanic.mp3')}
          startFrom={sec(MUSICA_DESDE)}
          volume={(fr) => interpolate(fr, [0, 20, TITANIC_FRAMES - 70, TITANIC_FRAMES - 4], [0, 0.85, 0.85, 0], clamp)}
        />
      )}
    </AbsoluteFill>
  );
};
