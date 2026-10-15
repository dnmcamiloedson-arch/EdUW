import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {BlurIn, CircleWipe, CleanBg, Doodle, Flash, Grain, Highlight, MaskReveal, ScriptWord, WordsIn} from './components';
import {Intro, INTRO_FRAMES} from './Intro';
import {Banner, BehindShot, PhotoShot, SectionLabel, Sfx, Shade, VideoShot} from './shots';
import {C, F, SAFE_X, ease, safeSize, tw} from './theme';

// ---------------------------------------------------------------------------
// Tarjetas de título (fondo limpio / azul, como la referencia)
// ---------------------------------------------------------------------------
export const TitleCard: React.FC<{small: string; big: string; color?: string; bg?: 'clean' | 'blue'}> = ({small, big, bg = 'blue'}) => {
  const blue = bg === 'blue';
  return (
    <AbsoluteFill>
      {blue ? (
        <AbsoluteFill style={{background: C.azul}}>
          <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(61,139,212,0.8) 0%, rgba(39,99,154,0) 60%, rgba(10,25,50,0.5) 100%)'}} />
        </AbsoluteFill>
      ) : (
        <CleanBg />
      )}
      <div style={{position: 'absolute', top: 740, width: '100%'}}>
        <WordsIn text={small} start={1} stagger={2} style={{fontFamily: F.sans, fontWeight: 800, fontSize: 70, color: blue ? C.blanco : C.marino}} />
      </div>
      <div style={{position: 'absolute', top: 815, width: '100%', textAlign: 'center'}}>
        <ScriptWord text={big} start={6} size={Math.min(170, safeSize(big, 170, 0.42))} color={blue ? C.amarillo : C.azul} neon={blue} tilt={-5} dur={16} />
      </div>
      <div style={{position: 'absolute', top: 1035, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <Doodle kind="underline" start={20} width={380} color={blue ? C.blanco : C.amarillo} />
      </div>
      <Sfx at={1} name="whoosh" volume={0.5} />
      <Sfx at={6} name="flicker" volume={0.55} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Llegada: toma exterior frente al edificio WESTHILL, texto sobre el pasto
// (sin texto detrás de las personas)
// ---------------------------------------------------------------------------
const LlegadaText: React.FC = () => (
  <AbsoluteFill>
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,20,40,0) 52%, rgba(10,20,40,0.55) 100%)'}} />
    <div style={{position: 'absolute', top: 1170, left: 0, right: 0, textAlign: 'center'}}>
      <BlurIn start={6} from="left" dist={300}>
        <span style={{fontFamily: F.sans, fontWeight: 900, fontSize: 128, color: C.blanco, letterSpacing: -3, textShadow: '0 6px 30px rgba(0,0,0,0.45)'}}>
          ¡Llegó IPEFH!
        </span>
      </BlurIn>
    </div>
    <div style={{position: 'absolute', top: 1305, left: 0, right: 0, textAlign: 'center'}}>
      <ScriptWord text="Plantel Aeropuerto" start={14} size={118} neon tilt={-5} dur={18} />
    </div>
    <div style={{position: 'absolute', top: 1470, left: 330}}>
      <Doodle kind="underline" start={28} width={430} />
    </div>
    <Sfx at={6} name="whoosh" volume={0.7} />
    <Sfx at={14} name="flicker" volume={0.6} />
    <Sfx at={28} name="taps" volume={0.45} />
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Cornhole
// ---------------------------------------------------------------------------
export const CornholeText: React.FC<{estreno?: boolean}> = ({estreno = true}) => {
  const f = useCurrentFrame();
  const letters = 'CORNHOLE'.split('');
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 420, width: '100%', display: 'flex', justifyContent: 'center'}}>
        {letters.map((l, i) => (
          <span
            key={i}
            style={{
              fontFamily: F.display,
              fontSize: 210,
              lineHeight: 1,
              color: C.marino,
              display: 'inline-block',
              transform: `translateY(${tw(f, [3 + i * 2, 15 + i * 2], [260, 0])}px)`,
            }}
          >
            {l}
          </span>
        ))}
      </div>
      {estreno && <div
        style={{
          position: 'absolute',
          top: 330,
          left: 0,
          right: 0,
          textAlign: 'center',
          transform: `scale(${tw(f, [22, 32], [0, 1], ease.back)}) rotate(-4deg)`,
        }}
      >
        <span style={{fontFamily: F.sans, fontWeight: 900, fontSize: 52, background: C.amarillo, color: C.marino, padding: '6px 26px 10px', borderRadius: 8}}>
          #ESTRENO
        </span>
      </div>}
      {estreno && <Sfx at={22} name="pop" />}
    </AbsoluteFill>
  );
};

const Bag: React.FC<{color: string; start: number}> = ({color, start}) => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        width: 120,
        height: 120,
        borderRadius: 22,
        background: color,
        boxShadow: 'inset 0 -10px 0 rgba(0,0,0,0.18), 0 14px 30px rgba(20,35,60,0.25)',
        transform: `scale(${tw(f, [start, start + 9], [0, 1], ease.back)}) rotate(${tw(f, [start, start + 12], [-30, (start % 3) * 6 - 6])}deg)`,
      }}
    />
  );
};

export const ReglasCard: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <CleanBg />
      <div style={{position: 'absolute', top: 360, width: '100%'}}>
        <WordsIn text="El reto" start={1} style={{fontFamily: F.sans, fontWeight: 800, fontSize: 64, color: C.marino}} />
      </div>
      <div style={{position: 'absolute', top: 470, width: '100%', display: 'flex', justifyContent: 'center', gap: 34}}>
        <Bag color={C.azul} start={6} />
        <Bag color="#C8323C" start={11} />
        <Bag color={C.azul} start={16} />
      </div>
      <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center'}}>
        <Highlight start={20} color={C.azul} pad="0.05em 0.35em">
          <span style={{fontFamily: F.sans, fontWeight: 900, fontSize: 80, color: C.blanco}}>Atina 3 seguidos</span>
        </Highlight>
      </div>
      <div style={{position: 'absolute', top: 770, width: '100%', textAlign: 'center'}}>
        <ScriptWord text="y gana un termo" start={26} size={112} color={C.azul} tilt={-4} />
      </div>
      <div style={{position: 'absolute', top: 1010, left: 690}}>
        <Doodle kind="arrow" start={44} width={200} color={C.amarillo} style={{transform: 'scaleX(-1) rotate(20deg)'}} />
      </div>
      {/* termo con círculo azul detrás (estilo referencia) */}
      <div
        style={{
          position: 'absolute',
          left: 540 - 250,
          top: 960,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: C.azul,
          transform: `scale(${tw(f, [30, 44], [0, 1], ease.out)})`,
        }}
      />
      <Img
        src={staticFile('logos/termo_recorte.png')}
        style={{
          position: 'absolute',
          left: 540 - 140,
          top: 880,
          width: 280,
          transform: `translateY(${tw(f, [34, 48], [300, 0])}px) rotate(${tw(f, [34, 52], [12, -4])}deg)`,
          filter: 'drop-shadow(0 24px 30px rgba(10,20,40,0.45))',
        }}
      />
      {[6, 11, 16].map((s) => (
        <Sfx key={s} at={s} name="click" volume={0.7} />
      ))}
      <Sfx at={34} name="whoosh" volume={0.6} />
    </AbsoluteFill>
  );
};

/** Contador de tiros */
export const Counter: React.FC<{n: number}> = ({n}) => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: SAFE_X, top: 1240, display: 'flex', alignItems: 'center', gap: 18}}>
      <span style={{fontFamily: F.display, fontSize: 110, color: C.blanco, textShadow: '0 4px 24px rgba(0,0,0,0.45)'}}>TIRO</span>
      {[1, 2, 3].map((i) => {
        const on = i <= n;
        const pop = i === n ? tw(f, [8, 18], [0.3, 1], ease.back) : 1;
        return (
          <div
            key={i}
            style={{
              width: 78,
              height: 78,
              borderRadius: 16,
              border: `5px solid ${C.blanco}`,
              background: on ? C.amarillo : 'rgba(255,255,255,0.12)',
              transform: `scale(${on ? pop : 1})`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontFamily: F.display,
              fontSize: 54,
              color: C.marino,
            }}
          >
            {on ? i : ''}
          </div>
        );
      })}
      <Sfx at={8} name="pop" />
    </div>
  );
};

export const Logrado: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 470, left: 0, right: 0, textAlign: 'center', transform: `scale(${tw(f, [2, 12], [1.6, 1], ease.out)})`}}>
        <BlurIn start={2} from="down" dist={160} dur={9}>
          <span style={{fontFamily: F.sans, fontWeight: 900, fontSize: 120, color: C.blanco, letterSpacing: -3, textShadow: '0 6px 30px rgba(0,0,0,0.45)'}}>¡Lo</span>
        </BlurIn>
      </div>
      <div style={{position: 'absolute', top: 570, left: 0, right: 0, textAlign: 'center'}}>
        <ScriptWord text="lograron!" start={7} size={190} neon tilt={-7} dur={12} />
      </div>
      <div style={{position: 'absolute', top: 545, left: 820}}>
        <Doodle kind="spark" start={18} width={120} />
      </div>
      <Sfx at={2} name="impact" volume={0.6} />
      <Sfx at={7} name="flicker" volume={0.6} />
      <Sfx at={4} name="ding" volume={0.6} />
    </AbsoluteFill>
  );
};

/** Foto de ganadores tipo polaroid */
export const WinnerPhoto: React.FC<{src: string; tilt: number; dur: number}> = ({src, tilt, dur}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <Img src={staticFile(`photos/${src}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(28px) brightness(0.65)', transform: 'scale(1.2)'}} />
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 110,
          top: 300,
          width: 860,
          background: C.blanco,
          padding: '28px 28px 130px',
          boxShadow: '0 40px 80px rgba(0,0,0,0.45)',
          transform: `translateY(${tw(f, [0, 10], [700, 0], ease.out)}px) rotate(${tw(f, [0, 14], [tilt * 3, tilt])}deg) scale(${1 + 0.04 * (f / dur)})`,
        }}
      >
        <Img src={staticFile(`photos/${src}.jpg`)} style={{width: '100%', height: 1180, objectFit: 'cover', display: 'block'}} />
        <div style={{position: 'absolute', bottom: 34, left: 0, right: 0, textAlign: 'center', fontFamily: F.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 56, color: C.azul}}>
          ¡Termo Westhill!
        </div>
      </div>
      <Flash at={1} dur={8} />
      <Sfx at={0} name="shutter_clicks" volume={0.9} />
    </AbsoluteFill>
  );
};

export const GanadoresRibbon: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'absolute', top: 190, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: C.amarillo, padding: '8px 46px 14px', transform: `scaleX(${tw(f, [0, 10], [0, 1], ease.inOut)}) rotate(-2deg)`}}>
        <span style={{fontFamily: F.display, fontSize: 96, color: C.marino, letterSpacing: 4}}>GANADORES</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Cierre: recorrido por la foto grupal frente a WESTHILL con "GRACIAS" detrás del
// grupo → círculo azul → tarjeta final limpia con logos (espejo de la intro)
// ---------------------------------------------------------------------------
export const CIERRE_FRAMES = 210;

const Cierre: React.FC = () => {
  const f = useCurrentFrame();
  const PW = 2576, PH = 1450;
  const sA = 1920 / PH;
  const x = tw(f, [0, 125], [0, -(PW * sA - 1080)], ease.inOut);
  const zoom = tw(f, [0, 125], [1, 1.06], (t) => t);
  const layer: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: PW, height: PH, transformOrigin: '0 0', transform: `translate(${x}px, 0px) scale(${sA * zoom})`};
  return (
    <AbsoluteFill style={{background: C.marino, overflow: 'hidden'}}>
      <div style={layer}>
        <Img src={staticFile('seg/final/bg_0000.webp')} style={{width: PW, height: PH}} />
      </div>
      {/* GRACIAS detrás del grupo */}
      <div style={{position: 'absolute', top: 690, width: '100%', textAlign: 'center'}}>
        <div style={{overflow: 'hidden'}}>
          <div
            style={{
              fontFamily: F.display,
              fontSize: 230,
              lineHeight: 1.05,
              color: C.blanco,
              textShadow: '0 10px 40px rgba(20,35,60,0.4)',
              transform: `translateY(${tw(f, [10, 26], [100, 0])}%)`,
              letterSpacing: 4,
            }}
          >
            GRACIAS
          </div>
        </div>
      </div>
      <div style={layer}>
        <Img src={staticFile('seg/final/fg_0000.webp')} style={{width: PW, height: PH}} />
      </div>
      <CircleWipe start={108} dur={16} color={C.azul} x={540} y={1100} />
      <Sequence from={120} layout="none">
        <EndCard />
      </Sequence>
      <Flash at={0} dur={10} />
      <Sfx at={0} name="shutter" />
      <Sfx at={104} name="whoosh_largo" volume={0.7} />
    </AbsoluteFill>
  );
};

/** Tarjeta final: logos en blanco sobre azul, gracias y hashtag */
export const EndCard: React.FC<{line1?: string; line2?: string}> = ({line1 = 'Gracias por visitarnos', line2 = '¡Nos vemos pronto!'}) => {
  const f = useCurrentFrame();
  const lineP = tw(f, [12, 26], [0, 1], ease.inOut);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: C.azul}}>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(61,139,212,0.85) 0%, rgba(39,99,154,0) 60%, rgba(10,25,50,0.55) 100%)'}} />
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 190,
          top: 470,
          width: 700,
          clipPath: `inset(0 0 ${tw(f, [2, 20], [100, 0], ease.inOut)}% 0)`,
          transform: `translateY(${tw(f, [2, 24], [50, 0])}px)`,
          filter: `blur(${tw(f, [2, 18], [12, 0])}px)`,
        }}
      >
        <Img src={staticFile('logos/logo_westhill_blanco_total.png')} style={{width: '100%'}} />
      </div>
      <div style={{position: 'absolute', top: 805, left: 240, width: 600, height: 3, background: 'rgba(255,255,255,0.8)', transform: `scaleX(${lineP})`}} />
      <div
        style={{
          position: 'absolute',
          top: 770,
          left: 505,
          width: 70,
          height: 70,
          borderRadius: 35,
          background: C.azul,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: F.sans,
          fontWeight: 500,
          fontSize: 60,
          color: C.blanco,
          transform: `scale(${tw(f, [18, 28], [0, 1], ease.back)})`,
        }}
      >
        ×
      </div>
      <div
        style={{
          position: 'absolute',
          left: 365,
          top: 880,
          width: 350,
          opacity: tw(f, [20, 28], [0, 1]),
          transform: `translateY(${tw(f, [20, 38], [60, 0])}px)`,
          filter: `blur(${tw(f, [20, 34], [10, 0])}px)`,
        }}
      >
        <Img src={staticFile('logos/logo_ipefh_transparente_contorno_blanco.png')} style={{width: '100%'}} />
      </div>
      <div style={{position: 'absolute', top: 1180, width: '100%'}}>
        <WordsIn text={line1} start={30} stagger={3} style={{fontFamily: F.sans, fontWeight: 800, fontSize: 58, color: C.blanco}} />
      </div>
      <div style={{position: 'absolute', top: 1240, width: '100%', textAlign: 'center'}}>
        <ScriptWord text={line2} start={38} size={safeSize(line2, 120, 0.4)} neon tilt={-5} dur={16} />
      </div>
      <Sfx at={38} name="flicker" volume={0.55} />
      <div
        style={{
          position: 'absolute',
          top: 1470,
          width: '100%',
          textAlign: 'center',
          fontFamily: F.sans,
          fontWeight: 800,
          fontSize: 38,
          letterSpacing: 8,
          color: C.amarillo,
          opacity: tw(f, [50, 60], [0, 1]),
        }}
      >
        #SOMOSWESTHILL
      </div>
      <Sfx at={18} name="pop" volume={0.6} />
      <Sfx at={38} name="click_suave" volume={0.6} />
      <Sfx at={50} name="ding" volume={0.45} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Línea de tiempo (30 fps)
// ---------------------------------------------------------------------------
type Item = {dur: number; el: React.ReactNode; overlay?: React.ReactNode};

const S = (src: string, from: number, sec: number, enter: Parameters<typeof VideoShot>[0]['enter'] = 'zoom'): Item => {
  const dur = Math.round(sec * 30);
  return {dur, el: <VideoShot src={src} from={from} dur={dur} enter={enter} />};
};
const P = (src: string, sec: number, enter: Parameters<typeof PhotoShot>[0]['enter'] = 'flash', origin?: string): Item => {
  const dur = Math.round(sec * 30);
  return {dur, el: <PhotoShot src={src} dur={dur} enter={enter} origin={origin} />};
};

export type Section = {name: string; items: Item[]; overlay?: React.ReactNode; shade?: boolean};

export const SECTIONS: Section[] = [
  {
    name: 'llegada',
    items: [
      // misma duración total que antes (90 cuadros) para no mover la sincronía con la música
      {dur: 62, el: <VideoShot src="IMG_0574" from={0.1} dur={62} enter="zoom" push={0.1} />, overlay: <LlegadaText />},
      S('IMG_0509', 1.2, 28 / 30, 'whipL'),
    ],
  },
  // Talleres: sin nombrar carreras (hubo alumnos en más licenciaturas de las que salen en video)
  {name: 'talleres', items: [{dur: 45, el: <TitleCard small="Vivieron un día en su" big="futura carrera" bg="clean" />}]},
  {
    name: 'talleres-montaje',
    items: [
      S('IMG_0513', 1.0, 1.4, 'whipL'),
      P('taller_maestro', 0.9),
      S('IMG_0522', 3.0, 1.3, 'whipR'),
      P('taller_maestra_mesa', 0.9),
      S('IMG_0541', 0.5, 1.2, 'zoom'),
      S('IMG_0526', 1.0, 1.0, 'whipL'),
      P('medicina_rcp2', 0.8),
      S('IMG_0543', 2.5, 1.5, 'whipR'),
      P('dentista', 0.9),
      S('IMG_0515', 2.2, 1.2, 'zoom'),
    ],
  },
  {
    name: 'conferencia',
    shade: true,
    overlay: <SectionLabel name="Conferencia" sub="en el auditorio" />,
    // el 2º corte cae justo en el regreso del beat de la canción (≈23.55 s del reel)
    items: [S('IMG_0558', 2.0, 58 / 30, 'card'), S('IMG_0548', 0.5, 1.2, 'whipL'), S('IMG_0553', 3.0, 26 / 30, 'whipR')],
  },
  {
    name: 'biblioteca',
    shade: true,
    overlay: <SectionLabel name="Biblioteca" sub="Westhill" />,
    items: [S('IMG_0566_luz_fuerte', 0.5, 2.5, 'card'), P('grupo_bloques', 1.5, 'flash')],
  },
  {
    name: 'break',
    shade: true,
    overlay: <SectionLabel name="Break" sub="al aire libre" />,
    items: [S('IMG_0581', 0.2, 1.5, 'card'), P('termos', 1.5, 'zoom', '50% 45%')],
  },
  {
    name: 'cornhole',
    items: [
      {
        dur: 90,
        el: (
          <BehindShot seg="cornhole" frames={90} dur={90}>
            <CornholeText />
          </BehindShot>
        ),
      },
      {dur: 60, el: <ReglasCard />},
      {dur: 60, el: <VideoShot src="IMG_0596" from={0.3} dur={60} enter="zoom" />, overlay: <Counter n={1} />},
      {dur: 60, el: <VideoShot src="IMG_0601" from={3.6} dur={60} enter="whipL" />, overlay: <Counter n={2} />},
      {dur: 45, el: <VideoShot src="IMG_0607" from={0.6} dur={45} enter="whipR" />, overlay: <Counter n={3} />},
      {dur: 45, el: <VideoShot src="IMG_0608" from={1.0} dur={45} enter="flash" />, overlay: <Logrado />},
      {dur: 30, el: <WinnerPhoto src="ganador1" tilt={-3} dur={30} />, overlay: <GanadoresRibbon />},
      {dur: 30, el: <WinnerPhoto src="ganador2" tilt={2.5} dur={30} />, overlay: <GanadoresRibbon />},
      {dur: 30, el: <WinnerPhoto src="ganador3" tilt={-2} dur={30} />, overlay: <GanadoresRibbon />},
    ],
  },
  {name: 'recorrido-card', items: [{dur: 36, el: <TitleCard small="Recorrido" big="por el campus" bg="blue" />}]},
  {
    name: 'recorrido',
    items: [
      S('IMG_0619', 1.0, 2.0, 'card'),
      S('IMG_0622', 0.0, 1.5, 'whipL'),
      S('IMG_0629', 0.0, 2.0, 'whipR'),
      S('IMG_0645', 1.0, 1.5, 'zoom'),
      S('IMG_0647', 2.5, 2.0, 'whipL'),
    ],
  },
  {name: 'cierre', items: [{dur: CIERRE_FRAMES, el: <Cierre />}]},
];

/** Canción elegida por el cliente: el "drop" (7.825 s) cae justo al terminar la intro */
export type Musica = 'cancion' | 'original' | 'ninguna';
/** Pistas: 'cancion' = la del cliente (Instagram la silencia por derechos); 'original' = pista propia
 *  libre de derechos (su drop ya cae en el segundo 6); 'ninguna' = solo efectos, para poner música en Instagram */
export const MUSICAS: Record<Exclude<Musica, 'ninguna'>, {src: string; dropAt: number}> = {
  cancion: {src: 'music/cancion_referencia.mp3', dropAt: Math.round(7.825 * 30)},
  original: {src: 'music/beat_westhill360.mp3', dropAt: 180},
};
export const MUSIC = MUSICAS.cancion;

export const sectionDur = (s: Section) => s.items.reduce((a, b) => a + b.dur, 0);
export const REEL_FRAMES = INTRO_FRAMES + SECTIONS.reduce((a, s) => a + sectionDur(s), 0);
const BANNER_END = REEL_FRAMES - CIERRE_FRAMES;

/** Reproduce una lista de secciones una tras otra */
export const SectionsPlayer: React.FC<{sections: Section[]}> = ({sections}) => {
  let t = 0;
  return (
    <>
      {sections.map((s) => {
        const start = t;
        const dur = sectionDur(s);
        t += dur;
        let it = 0;
        return (
          <Sequence key={s.name} from={start} durationInFrames={dur} name={s.name}>
            {s.items.map((item, i) => {
              const st = it;
              it += item.dur;
              return (
                <Sequence key={i} from={st} durationInFrames={item.dur}>
                  {item.el}
                  {item.overlay}
                </Sequence>
              );
            })}
            {s.shade && <Shade />}
            {s.overlay}
          </Sequence>
        );
      })}
    </>
  );
};

export const sectionsDur = (names: string[]) => names.reduce((a, n) => a + sectionDur(SECTIONS.find((s) => s.name === n)!), 0);
export const pickSections = (names: string[]) => names.map((n) => SECTIONS.find((s) => s.name === n)!);

export const Reel: React.FC<{music?: Musica}> = ({music = 'original'}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <Sequence durationInFrames={INTRO_FRAMES + 8}>
      <Intro />
    </Sequence>
    <Sequence from={INTRO_FRAMES}>
      <SectionsPlayer sections={SECTIONS} />
    </Sequence>
    <Sequence from={INTRO_FRAMES} durationInFrames={BANNER_END - INTRO_FRAMES}>
      <Banner />
    </Sequence>
    <Grain opacity={0.05} />
    {music !== 'ninguna' && (
      <Audio
        src={staticFile(MUSICAS[music].src)}
        startFrom={MUSICAS[music].dropAt - INTRO_FRAMES}
        volume={(f) => interpolate(f, [REEL_FRAMES - 75, REEL_FRAMES], [0.6, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
      />
    )}
  </AbsoluteFill>
);
