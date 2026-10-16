import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {BlurIn, Doodle, Grain, ScriptWord, WordsIn} from './components';
import {Sfx} from './shots';
import {C, F, SAFE_X, ease, safeSize, tw} from './theme';

// ---------------------------------------------------------------------------
// Historia de Instagram: visita de la Coordinación de Inclusión a FlyOver México.
// Tono tranquilo: fundidos suaves, texto que se lee con calma, sonidos discretos.
// PRIVACIDAD: el compañero en silla de ruedas no debe reconocerse. Sus fotos ya llevan
// la cara difuminada y de los videos solo se usan tramos donde NO aparece:
//   fly_01 < 2.8 s · fly_06 fuera de 4.3–5.6 s y 10.3–13.6 s · fly_08 < 5.0 s
// ---------------------------------------------------------------------------
const XF = 12; // cuadros de fundido entre tomas

const vid = (n: string) => staticFile(`proxies/flyover/${n}.mp4`);
const pic = (n: string) => staticFile(`photos/flyover/${n}.jpg`);

const Clip: React.FC<{src: string; from: number; dur: number; dim?: number; blur?: number}> = ({src, from, dur, dim = 0, blur = 0}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${1.04 + 0.05 * (f / dur)})`, filter: blur ? `blur(${blur}px)` : undefined}}>
        <OffthreadVideo src={vid(src)} startFrom={Math.round(from * 30)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      {dim > 0 && <AbsoluteFill style={{background: `rgba(10,20,40,${dim})`}} />}
    </AbsoluteFill>
  );
};

/** Foto completa ajustada al ancho sobre su propia versión desenfocada (no se recorta a nadie) */
const PhotoFit: React.FC<{src: string; dur: number; y0?: number; y1?: number; aspect: number}> = ({src, dur, y0 = 0, y1 = 1, aspect}) => {
  const f = useCurrentFrame();
  const shownH = (1080 / aspect) * (y1 - y0); // alto visible de la franja elegida
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      <Img src={src} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(36px) brightness(0.5)', transform: 'scale(1.25)'}} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: 1080,
          top: 200,
          height: shownH,
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
          transform: `scale(${1 + 0.04 * (f / dur)})`,
        }}
      >
        <Img src={src} style={{position: 'absolute', left: 0, width: 1080, top: -(1080 / aspect) * y0}} />
      </div>
      <Sfx at={0} name="shutter" volume={0.5} />
    </AbsoluteFill>
  );
};

/** Fundido encadenado entre tomas, sin cambiar la duración total */
type Shot = {dur: number; el: React.ReactNode};
const Fade: React.FC<{first: boolean; children: React.ReactNode}> = ({first, children}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{opacity: first ? 1 : tw(f, [0, XF], [0, 1], ease.inOut)}}>{children}</AbsoluteFill>;
};
const Chain: React.FC<{shots: Shot[]}> = ({shots}) => {
  let t = 0;
  return (
    <>
      {shots.map((s, i) => {
        const st = t;
        t += s.dur;
        const from = i === 0 ? 0 : st - XF;
        return (
          // + XF al final: la toma sigue visible mientras la siguiente (o la escena siguiente) se funde encima
          <Sequence key={i} from={from} durationInFrames={s.dur + (i === 0 ? 0 : XF) + XF}>
            <Fade first={i === 0}>{s.el}</Fade>
          </Sequence>
        );
      })}
    </>
  );
};
const chainDur = (shots: Shot[]) => shots.reduce((a, s) => a + s.dur, 0);

/** Etiqueta "Coordinación de Inclusión" */
const Tag: React.FC<{start?: number}> = ({start = 0}) => {
  const f = useCurrentFrame();
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: F.sans,
        fontWeight: 800,
        fontSize: 34,
        letterSpacing: 4,
        color: C.marino,
        background: C.amarillo,
        padding: '8px 22px 10px',
        borderRadius: 40,
        transform: `scale(${tw(f, [start, start + 10], [0.6, 1], ease.back)})`,
        opacity: tw(f, [start, start + 6], [0, 1]),
      }}
    >
      COORDINACIÓN DE INCLUSIÓN
    </span>
  );
};

// ---------------------------------------------------------------------------
// Escenas
// ---------------------------------------------------------------------------
const Portada: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Clip src="fly_05" from={0.3} dur={135} dim={0.45} blur={4} />
      <div style={{position: 'absolute', top: 470, width: '100%', textAlign: 'center'}}>
        <Tag start={4} />
      </div>
      <div style={{position: 'absolute', top: 600, width: '100%'}}>
        <WordsIn text="Visitamos" start={12} style={{fontFamily: F.sans, fontWeight: 800, fontSize: 76, color: C.blanco}} />
      </div>
      <div style={{position: 'absolute', top: 690, width: '100%', textAlign: 'center'}}>
        <ScriptWord text="FlyOver México" start={18} size={150} neon tilt={-5} dur={20} />
      </div>
      <div style={{position: 'absolute', top: 905, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <Doodle kind="underline" start={38} width={460} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1010,
          left: SAFE_X,
          right: SAFE_X,
          textAlign: 'center',
          fontFamily: F.sans,
          fontWeight: 700,
          fontSize: 44,
          lineHeight: 1.3,
          color: C.blanco,
          textShadow: '0 3px 16px rgba(0,0,0,0.6)',
          opacity: tw(f, [46, 60], [0, 1]),
          transform: `translateY(${tw(f, [46, 62], [20, 0])}px)`,
        }}
      >
        El primer <span style={{color: C.amarillo}}>Flying Theater</span>
        <br />
        de Latinoamérica
      </div>
      <Sfx at={4} name="pop" volume={0.35} />
      <Sfx at={18} name="flicker" volume={0.35} />
    </AbsoluteFill>
  );
};

const EXPERIENCIA: Shot[] = [
  {dur: 45, el: <Clip src="fly_01" from={0.2} dur={45} />},
  {dur: 48, el: <Clip src="fly_04" from={1.0} dur={48} />},
  {dur: 42, el: <Clip src="fly_02" from={0.5} dur={42} />},
  {dur: 42, el: <Clip src="fly_05" from={2.5} dur={42} />},
  {dur: 48, el: <Clip src="fly_06" from={25.0} dur={48} />},
];
const ExperienciaText: React.FC = () => (
  <AbsoluteFill>
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,20,40,0) 45%, rgba(10,20,40,0.7) 100%)'}} />
    <div style={{position: 'absolute', top: 1150, left: SAFE_X, right: SAFE_X}}>
      <BlurIn start={6} from="left" dist={220}>
        <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 56, lineHeight: 1.2, color: C.blanco, textShadow: '0 4px 20px rgba(0,0,0,0.6)'}}>
          Exploramos paisajes, tradiciones y lugares emblemáticos
        </div>
      </BlurIn>
    </div>
    <div style={{position: 'absolute', top: 1330, left: SAFE_X - 10}}>
      <ScriptWord text="con todos los sentidos" start={24} size={96} neon tilt={-4} dur={20} />
    </div>
    <Sfx at={6} name="whoosh" volume={0.3} />
    <Sfx at={24} name="flicker" volume={0.3} />
  </AbsoluteFill>
);

/** Tarjeta de cada aprendizaje: número, título en cinta, palabra manuscrita y descripción */
const Pilar: React.FC<{n: string; title: string; script: string; desc: string; dy?: number}> = ({n, title, script, desc, dy = 0}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,20,40,0) 38%, rgba(10,20,40,0.78) 100%)'}} />
      <div
        style={{
          position: 'absolute',
          left: SAFE_X,
          top: 960 + dy,
          fontFamily: F.display,
          fontSize: 150,
          lineHeight: 1,
          color: 'transparent',
          WebkitTextStroke: '3px rgba(255,255,255,0.9)',
          opacity: tw(f, [4, 12], [0, 1]),
          transform: `translateY(${tw(f, [4, 18], [40, 0])}px)`,
        }}
      >
        {n}
      </div>
      <div style={{position: 'absolute', left: 0, top: 1120 + dy, overflow: 'hidden', paddingRight: 40}}>
        <div style={{background: C.azul, padding: `12px 40px 16px ${SAFE_X}px`, transform: `translateX(${tw(f, [8, 22], [-105, 0])}%)`, boxShadow: '0 12px 40px rgba(0,0,0,0.25)'}}>
          <span style={{fontFamily: F.sans, fontWeight: 900, fontSize: safeSize(title, 72, 0.66), color: C.blanco, letterSpacing: -1}}>{title}</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: SAFE_X - 10, top: 1250 + dy}}>
        <ScriptWord text={script} start={18} size={safeSize(script, 92, 0.4)} neon tilt={-4} dur={14} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: SAFE_X,
          right: SAFE_X,
          top: 1400 + dy,
          fontFamily: F.sans,
          fontWeight: 600,
          fontSize: 42,
          lineHeight: 1.3,
          color: C.blanco,
          textShadow: '0 3px 14px rgba(0,0,0,0.6)',
          opacity: tw(f, [30, 42], [0, 1]),
          transform: `translateY(${tw(f, [30, 44], [16, 0])}px)`,
        }}
      >
        {desc}
      </div>
      <Sfx at={8} name="swipe" volume={0.3} />
      <Sfx at={18} name="flicker" volume={0.28} />
    </AbsoluteFill>
  );
};

const PD = 112; // duración de cada aprendizaje
const PILARES: Shot[] = [
  {
    dur: PD,
    el: (
      <>
        <Clip src="fly_06" from={17.0} dur={PD} />
        <Pilar n="01" title="Percepción sensorial" script="ver, oír y sentir" desc="Exploramos estímulos visuales, auditivos y de movimiento." />
      </>
    ),
  },
  {
    dur: PD,
    el: (
      <>
        <Clip src="fly_03" from={1.5} dur={PD} />
        <Pilar n="02" title="Atención y observación" script="mirar con detalle" desc="Reconocimos elementos de distintos paisajes y escenarios." />
      </>
    ),
  },
  {
    dur: PD,
    el: (
      <>
        <PhotoFit src={pic('collage_llorona_mictlan')} dur={PD} aspect={1078 / 1600} y0={0.5} y1={1} />
        <Pilar n="03" title="Expresión emocional" script="sorpresa y alegría" desc="Identificamos y compartimos lo que sentimos." dy={90} />
      </>
    ),
  },
  {
    dur: PD,
    el: (
      <>
        <Clip src="fly_08" from={0.3} dur={PD} />
        <Pilar n="04" title="Autonomía" script="fuera del aula" desc="Participamos con confianza en nuevas actividades." />
      </>
    ),
  },
  {
    dur: PD,
    el: (
      <>
        <PhotoFit src={pic('grupo_arco')} dur={PD} aspect={1200 / 1600} y0={0.33} y1={0.9} />
        <Pilar n="05" title="Convivencia" script="juntos" desc="Compartimos la experiencia y fortalecimos vínculos." dy={90} />
      </>
    ),
  },
];

const Aprendizaje: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Clip src="fly_09" from={4.0} dur={180} dim={0.55} blur={6} />
      <div style={{position: 'absolute', top: 470, width: '100%', textAlign: 'center'}}>
        <span style={{fontFamily: F.sans, fontWeight: 800, fontSize: 34, letterSpacing: 6, color: C.amarillo, opacity: tw(f, [2, 10], [0, 1])}}>
          APRENDIZAJE SIGNIFICATIVO
        </span>
      </div>
      <div style={{position: 'absolute', top: 560, width: '100%'}}>
        <WordsIn text="Aprender también es" start={8} style={{fontFamily: F.sans, fontWeight: 800, fontSize: 70, color: C.blanco}} />
      </div>
      {['sentir,', 'explorar,', 'sorprendernos'].map((w, i) => (
        <div key={w} style={{position: 'absolute', top: 660 + i * 135, width: '100%', textAlign: 'center'}}>
          <ScriptWord text={w} start={20 + i * 12} size={128} neon tilt={-4} dur={14} />
        </div>
      ))}
      <div
        style={{
          position: 'absolute',
          top: 1110,
          left: SAFE_X,
          right: SAFE_X,
          textAlign: 'center',
          fontFamily: F.sans,
          fontWeight: 600,
          fontSize: 44,
          lineHeight: 1.35,
          color: C.blanco,
          opacity: tw(f, [62, 78], [0, 1]),
          transform: `translateY(${tw(f, [62, 80], [18, 0])}px)`,
        }}
      >
        y compartir experiencias que nos conectan con nuestro entorno y con los demás.
      </div>
      {[20, 32, 44].map((s) => (
        <Sfx key={s} at={s} name="flicker" volume={0.25} />
      ))}
    </AbsoluteFill>
  );
};

const Cierre: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: C.azul}}>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, rgba(61,139,212,0.85) 0%, rgba(39,99,154,0) 60%, rgba(10,25,50,0.55) 100%)'}} />
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 190,
          top: 640,
          width: 700,
          clipPath: `inset(0 0 ${tw(f, [4, 22], [100, 0], ease.inOut)}% 0)`,
          transform: `translateY(${tw(f, [4, 26], [40, 0])}px)`,
        }}
      >
        <Img src={staticFile('logos/logo_westhill_blanco_total.png')} style={{width: '100%'}} />
      </div>
      <div style={{position: 'absolute', top: 1000, width: '100%', textAlign: 'center'}}>
        <Tag start={20} />
      </div>
      <div style={{position: 'absolute', top: 1100, width: '100%', textAlign: 'center'}}>
        <ScriptWord text="¡Gracias por la experiencia!" start={30} size={safeSize('¡Gracias por la experiencia!', 96, 0.4)} neon tilt={-4} dur={18} />
      </div>
      <div style={{position: 'absolute', top: 1290, width: '100%', textAlign: 'center', fontFamily: F.sans, fontWeight: 800, fontSize: 34, letterSpacing: 8, color: C.blanco, opacity: tw(f, [44, 56], [0, 1])}}>
        #SOMOSWESTHILL
      </div>
      <Sfx at={20} name="pop" volume={0.35} />
      <Sfx at={30} name="flicker" volume={0.3} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Línea de tiempo
// ---------------------------------------------------------------------------
const SCENES: Shot[] = [
  {dur: 135, el: <Portada />},
  {
    dur: chainDur(EXPERIENCIA),
    el: (
      <>
        <Chain shots={EXPERIENCIA} />
        <ExperienciaText />
      </>
    ),
  },
  {dur: chainDur(PILARES), el: <Chain shots={PILARES} />},
  {dur: 180, el: <Aprendizaje />},
  {dur: 120, el: <Cierre />},
];
export const FLYOVER_FRAMES = chainDur(SCENES);
const startOfScene = (i: number) => SCENES.slice(0, i).reduce((a, s) => a + s.dur, 0);

// Música: "Música de fondo alegre" del cliente, desde su parte tranquila; su drop (33.565 s)
// llega justo con "Aprendizaje significativo".
const DROP1 = 33.565;
export const FlyOverStory: React.FC<{music?: boolean}> = ({music = true}) => {
  const dropFrame = startOfScene(3) + 20;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Chain shots={SCENES} />
      <Grain opacity={0.04} />
      {music && (
        <Audio
          src={staticFile('music/fondo_alegre.mp3')}
          startFrom={Math.max(0, Math.round(DROP1 * 30) - dropFrame)}
          volume={(fr) => interpolate(fr, [0, 20, FLYOVER_FRAMES - 60, FLYOVER_FRAMES], [0, 0.45, 0.45, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
        />
      )}
    </AbsoluteFill>
  );
};
