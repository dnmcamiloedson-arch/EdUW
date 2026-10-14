import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {CleanBg, Grain, MaskReveal, WordsIn} from './components';
import {
  CornholeText,
  Counter,
  GanadoresRibbon,
  Logrado,
  pickSections,
  ReglasCard,
  sectionsDur,
  SectionsPlayer,
  WinnerPhoto,
} from './Reel';
import {Banner, BehindShot, PlacePill, Sfx, VideoShot} from './shots';
import {C, F, ease, tw} from './theme';

export const OPENER = 45;

/** Portada de cada historia: "Así fue la visita de IPEFH" + capítulo */
const Opener: React.FC<{n: number; total: number; title: string}> = ({n, total, title}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <CleanBg />
      <div style={{position: 'absolute', top: 560, width: '100%'}}>
        <WordsIn text="Así fue la visita de" start={1} stagger={2} style={{fontFamily: F.sans, fontWeight: 800, fontSize: 66, color: C.marino}} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 650,
          width: '100%',
          textAlign: 'center',
          fontFamily: F.display,
          fontSize: 250,
          lineHeight: 1,
          color: C.amarillo,
          WebkitTextStroke: `6px ${C.marino}`,
          transform: `scale(${tw(f, [5, 17], [0.5, 1], ease.back)})`,
          opacity: tw(f, [5, 9], [0, 1]),
        }}
      >
        IPEFH
      </div>
      <MaskReveal start={12} style={{position: 'absolute', top: 920, width: '100%', textAlign: 'center'}}>
        <span style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 92, color: C.azul}}>{title}</span>
      </MaskReveal>
      <div style={{position: 'absolute', top: 1090, width: '100%', textAlign: 'center', opacity: tw(f, [18, 26], [0, 1])}}>
        <span style={{fontFamily: F.sans, fontWeight: 800, fontSize: 36, letterSpacing: 6, color: C.blanco, background: C.azul, padding: '8px 22px 10px', borderRadius: 30}}>
          {n} / {total}
        </span>
      </div>
      <Sfx at={1} name="whoosh" volume={0.6} />
      <Sfx at={6} name="pop" volume={0.8} />
    </AbsoluteFill>
  );
};

/** Etiqueta fija arriba a la izquierda durante la historia */
const StoryTag: React.FC<{n: number; total: number}> = ({n, total}) => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        left: 56,
        top: 190,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        opacity: tw(f, [0, 8], [0, 1]),
        transform: `translateX(${tw(f, [0, 12], [-40, 0])}px)`,
      }}
    >
      <span style={{fontFamily: F.sans, fontWeight: 900, fontSize: 30, letterSpacing: 3, color: C.marino, background: C.amarillo, padding: '6px 16px 8px', borderRadius: 6}}>
        ASÍ FUE LA VISITA
      </span>
      <span style={{fontFamily: F.sans, fontWeight: 800, fontSize: 30, color: C.blanco, textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>
        {n}/{total}
      </span>
    </div>
  );
};

const StoryFrame: React.FC<{n: number; total: number; title: string; dur: number; children: React.ReactNode}> = ({n, total, title, dur, children}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <Sequence durationInFrames={OPENER}>
      <Opener n={n} total={total} title={title} />
    </Sequence>
    <Sequence from={OPENER}>{children}</Sequence>
    <Sequence from={OPENER}>
      <StoryTag n={n} total={total} />
      <Banner />
    </Sequence>
    <Grain opacity={0.05} />
    <Audio
      src={staticFile('music/beat_westhill360.wav')}
      startFrom={150}
      volume={(f) =>
        interpolate(f, [0, 10, dur - 30, dur], [0, 0.6, 0.6, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
      }
    />
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Capítulos "Así fue la visita" (todas las secciones salen del reel)
// ---------------------------------------------------------------------------
export const TOTAL = 6;
export const CHAPTERS: {id: string; n: number; title: string; sections: string[]}[] = [
  {id: 'Historia1-Talleres', n: 1, title: 'Talleres', sections: ['llegada', 'talleres', 'arquitectura', 'administracion']},
  {id: 'Historia2-Salud', n: 2, title: 'Medicina y Dentista', sections: ['medicina', 'dentista']},
  {id: 'Historia3-Conferencia', n: 3, title: 'Conferencia y Biblioteca', sections: ['conferencia', 'biblioteca']},
  // la 4 es la historia del cornhole (abajo)
  {id: 'Historia5-Recorrido', n: 5, title: 'Recorrido', sections: ['recorrido-card', 'recorrido']},
  {id: 'Historia6-Despedida', n: 6, title: 'La despedida', sections: ['cierre']},
];
export const chapterDur = (sections: string[]) => OPENER + sectionsDur(sections);

export const Chapter: React.FC<{n: number; title: string; sections: string[]}> = ({n, title, sections}) => (
  <StoryFrame n={n} total={TOTAL} title={title} dur={chapterDur(sections)}>
    <SectionsPlayer sections={pickSections(sections)} />
  </StoryFrame>
);

// ---------------------------------------------------------------------------
// Historia aparte: el CORNHOLE (capítulo 4)
// ---------------------------------------------------------------------------
const SlowLanding: React.FC = () => {
  // tiro en cámara lenta (0.5x) con golpe al caer la bolsa
  const f = useCurrentFrame();
  const punch = f >= 42 ? tw(f, [42, 52], [1.12, 1], ease.out) : 1;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${punch * (1 + 0.06 * (f / 75))})`}}>
        <OffthreadVideo src={staticFile('proxies/IMG_0601.mp4')} startFrom={Math.round(3.8 * 30)} playbackRate={0.5} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <Sfx at={0} name="swipe" volume={0.5} />
      <Sfx at={42} name="impact" volume={0.7} />
      <div
        style={{
          position: 'absolute',
          top: 560,
          width: '100%',
          textAlign: 'center',
          fontFamily: F.sans,
          fontWeight: 900,
          fontSize: 40,
          letterSpacing: 8,
          color: C.blanco,
          textShadow: '0 2px 14px rgba(0,0,0,0.6)',
          opacity: tw(f, [4, 10], [0, 1]) * tw(f, [36, 42], [1, 0]),
        }}
      >
        CÁMARA LENTA
      </div>
    </AbsoluteFill>
  );
};

const CornholeOutro: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: C.azul}}>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(61,139,212,0.8) 0%, rgba(39,99,154,0) 60%, rgba(10,25,50,0.5) 100%)'}} />
      </AbsoluteFill>
      <div style={{position: 'absolute', top: 470, width: '100%'}}>
        <WordsIn text="¡Gracias por estrenar el" start={1} stagger={2} style={{fontFamily: F.sans, fontWeight: 800, fontSize: 62, color: C.blanco}} />
      </div>
      <MaskReveal start={8} style={{position: 'absolute', top: 550, width: '100%', textAlign: 'center'}}>
        <span style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 150, color: C.blanco}}>cornhole!</span>
      </MaskReveal>
      <Img
        src={staticFile('logos/termo_recorte.png')}
        style={{
          position: 'absolute',
          left: 540 - 120,
          top: 790,
          width: 240,
          transform: `translateY(${tw(f, [10, 24], [300, 0])}px) rotate(${tw(f, [10, 30], [10, -3])}deg)`,
          filter: 'drop-shadow(0 24px 30px rgba(0,0,0,0.4))',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 1330,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 34,
          opacity: tw(f, [20, 30], [0, 1]),
        }}
      >
        <Img src={staticFile('logos/logo_westhill_transparente_texto_blanco.png')} style={{width: 420}} />
        <span style={{fontFamily: F.sans, fontWeight: 500, fontSize: 64, color: C.blanco}}>×</span>
        <Img src={staticFile('logos/logo_ipefh_transparente_contorno_blanco.png')} style={{width: 240}} />
      </div>
      <Sfx at={1} name="whoosh" volume={0.6} />
      <Sfx at={12} name="ding" volume={0.5} />
    </AbsoluteFill>
  );
};

type Item = {dur: number; el: React.ReactNode; overlay?: React.ReactNode};
const CORNHOLE_ITEMS: Item[] = [
  {...{dur: 45, el: <VideoShot src="IMG_0581" from={0.2} dur={45} enter="zoom" />}, overlay: <PlacePill text="Break al aire libre" top={1250} />},
  {
    dur: 90,
    el: (
      <BehindShot seg="cornhole" frames={90} dur={90}>
        <CornholeText />
      </BehindShot>
    ),
  },
  {dur: 60, el: <ReglasCard />},
  {dur: 60, el: <VideoShot src="IMG_0594" from={0.3} dur={60} enter="whipL" />, overlay: <PlacePill text="¡A jugar!" top={1250} />},
  {dur: 60, el: <VideoShot src="IMG_0596" from={0.3} dur={60} enter="zoom" />, overlay: <Counter n={1} />},
  {dur: 75, el: <SlowLanding />, overlay: <Counter n={2} />},
  {dur: 60, el: <VideoShot src="IMG_0607" from={0.6} dur={60} enter="whipR" />, overlay: <Counter n={3} />},
  {dur: 60, el: <VideoShot src="IMG_0608" from={0.8} dur={60} enter="flash" />, overlay: <Logrado />},
  {dur: 40, el: <WinnerPhoto src="ganador1" tilt={-3} dur={40} />, overlay: <GanadoresRibbon />},
  {dur: 40, el: <WinnerPhoto src="ganador2" tilt={2.5} dur={40} />, overlay: <GanadoresRibbon />},
  {dur: 40, el: <WinnerPhoto src="ganador3" tilt={-2} dur={40} />, overlay: <GanadoresRibbon />},
  {dur: 75, el: <CornholeOutro />},
];
export const CORNHOLE_FRAMES = OPENER + CORNHOLE_ITEMS.reduce((a, b) => a + b.dur, 0);

export const CornholeStory: React.FC = () => {
  let t = 0;
  return (
    <StoryFrame n={4} total={TOTAL} title="El cornhole" dur={CORNHOLE_FRAMES}>
      {CORNHOLE_ITEMS.map((item, i) => {
        const st = t;
        t += item.dur;
        return (
          <Sequence key={i} from={st} durationInFrames={item.dur}>
            {item.el}
            {item.overlay}
          </Sequence>
        );
      })}
    </StoryFrame>
  );
};
