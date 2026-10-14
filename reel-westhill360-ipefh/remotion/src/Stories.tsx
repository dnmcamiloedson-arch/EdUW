import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {CleanBg, Grain, MaskReveal, WordsIn} from './components';
import {CornholeText, Counter, GanadoresRibbon, Logrado, MUSIC, pickSections, ReglasCard, Section, WinnerPhoto} from './Reel';
import {Banner, BehindShot, Sfx, Shade, SoftCtx, VideoShot} from './shots';
import {C, F, ease, tw} from './theme';

export const OPENER = 45;
const XFADE = 10; // cuadros de fundido entre tomas (transición "natural")

type Item = {dur: number; el: React.ReactNode; overlay?: React.ReactNode};

/** Toma que aparece con fundido + leve acercamiento (sin barridos ni flashes) */
const FadeIn: React.FC<{children: React.ReactNode; first: boolean}> = ({children, first}) => {
  const f = useCurrentFrame();
  const o = first ? 1 : tw(f, [0, XFADE], [0, 1], ease.inOut);
  const s = first ? 1 : tw(f, [0, XFADE + 8], [1.04, 1], ease.out);
  return <AbsoluteFill style={{opacity: o, transform: `scale(${s})`}}>{children}</AbsoluteFill>;
};

/** Reproduce tomas con fundidos encadenados; la duración total no cambia */
const SoftPlayer: React.FC<{items: Item[]; sections?: {start: number; dur: number; s: Section}[]}> = ({items, sections = []}) => {
  let t = 0;
  return (
    <SoftCtx.Provider value>
      {items.map((item, i) => {
        const start = t;
        t += item.dur;
        const from = i === 0 ? 0 : start - XFADE;
        return (
          <Sequence key={i} from={from} durationInFrames={item.dur + (i === 0 ? 0 : XFADE)}>
            <FadeIn first={i === 0}>
              {item.el}
              {item.overlay}
            </FadeIn>
          </Sequence>
        );
      })}
      {sections.map(({start, dur, s}) => (
        <Sequence key={s.name} from={start} durationInFrames={dur}>
          {s.shade && <Shade />}
          {s.overlay}
        </Sequence>
      ))}
    </SoftCtx.Provider>
  );
};

/** Portada de cada historia: "Así fue la visita de IPEFH" + tema */
const Opener: React.FC<{title: string}> = ({title}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <CleanBg />
      <div style={{position: 'absolute', top: 600, width: '100%'}}>
        <WordsIn text="Así fue la visita de" start={1} stagger={2} style={{fontFamily: F.sans, fontWeight: 800, fontSize: 66, color: C.marino}} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 690,
          width: '100%',
          textAlign: 'center',
          fontFamily: F.display,
          fontSize: 250,
          lineHeight: 1,
          color: C.amarillo,
          WebkitTextStroke: `6px ${C.marino}`,
          transform: `scale(${tw(f, [5, 17], [0.85, 1], ease.out)})`,
          opacity: tw(f, [5, 12], [0, 1]),
        }}
      >
        IPEFH
      </div>
      <MaskReveal start={12} style={{position: 'absolute', top: 960, width: '100%', textAlign: 'center'}}>
        <span style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 92, color: C.azul}}>{title}</span>
      </MaskReveal>
    </AbsoluteFill>
  );
};

const StoryFrame: React.FC<{title: string; dur: number; banner?: boolean; children: React.ReactNode}> = ({title, dur, banner = true, children}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <Sequence durationInFrames={OPENER + XFADE}>
      <Opener title={title} />
    </Sequence>
    <Sequence from={OPENER}>
      <FadeIn first={false}>{children}</FadeIn>
    </Sequence>
    {banner && (
      <Sequence from={OPENER}>
        <Banner />
      </Sequence>
    )}
    <Grain opacity={0.05} />
    <Audio
      src={staticFile(MUSIC.src)}
      startFrom={MUSIC.dropAt - OPENER}
      volume={(f) => interpolate(f, [0, 10, dur - 30, dur], [0, 0.6, 0.6, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
    />
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Historias "Así fue la visita" (todo sale del reel, sin nombrar carreras)
// ---------------------------------------------------------------------------
export const CHAPTERS: {id: string; title: string; sections: string[]}[] = [
  {id: 'Historia1-Talleres', title: 'Los talleres', sections: ['llegada', 'talleres', 'talleres-montaje']},
  {id: 'Historia2-Conferencia', title: 'Conferencia y biblioteca', sections: ['conferencia', 'biblioteca']},
  // la 3 es la historia del cornhole (abajo)
  {id: 'Historia4-Recorrido', title: 'El recorrido', sections: ['recorrido-card', 'recorrido']},
  {id: 'Historia5-Despedida', title: 'La despedida', sections: ['cierre']},
];

const flatten = (names: string[]) => {
  const secs = pickSections(names);
  const items: Item[] = [];
  const ranges: {start: number; dur: number; s: Section}[] = [];
  let t = 0;
  for (const s of secs) {
    const d = s.items.reduce((a, b) => a + b.dur, 0);
    ranges.push({start: t, dur: d, s});
    items.push(...s.items);
    t += d;
  }
  return {items, ranges, total: t};
};
export const chapterDur = (sections: string[]) => OPENER + flatten(sections).total;

export const Chapter: React.FC<{title: string; sections: string[]}> = ({title, sections}) => {
  const {items, ranges} = flatten(sections);
  return (
    <StoryFrame title={title} dur={chapterDur(sections)} banner={!sections.includes('cierre')}>
      <SoftPlayer items={items} sections={ranges} />
    </StoryFrame>
  );
};

// ---------------------------------------------------------------------------
// Historia aparte: el CORNHOLE
// ---------------------------------------------------------------------------
const SlowLanding: React.FC = () => {
  // tiro en cámara lenta (0.5x) con golpe suave al caer la bolsa
  const f = useCurrentFrame();
  const punch = f >= 42 ? tw(f, [42, 52], [1.06, 1], ease.out) : 1;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${punch * (1 + 0.06 * (f / 75))})`}}>
        <OffthreadVideo src={staticFile('proxies/IMG_0601.mp4')} startFrom={Math.round(3.8 * 30)} playbackRate={0.5} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <Sfx at={42} name="impact" volume={0.5} />
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
      <div style={{position: 'absolute', top: 430, width: '100%'}}>
        <WordsIn text="¡Gracias por" start={1} stagger={3} style={{fontFamily: F.sans, fontWeight: 800, fontSize: 70, color: C.blanco}} />
      </div>
      <MaskReveal start={8} style={{position: 'absolute', top: 520, width: '100%', textAlign: 'center'}}>
        <span style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 170, color: C.blanco}}>jugar!</span>
      </MaskReveal>
      <Img
        src={staticFile('logos/termo_recorte.png')}
        style={{
          position: 'absolute',
          left: 540 - 115,
          top: 790,
          width: 230,
          transform: `translateY(${tw(f, [10, 26], [260, 0])}px) rotate(${tw(f, [10, 30], [8, -3])}deg)`,
          filter: 'drop-shadow(0 24px 30px rgba(0,0,0,0.4))',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 1300,
          width: '100%',
          textAlign: 'center',
          fontFamily: F.sans,
          fontWeight: 700,
          fontSize: 44,
          color: C.blanco,
          opacity: tw(f, [22, 32], [0, 1]),
          transform: `translateY(${tw(f, [22, 34], [20, 0])}px)`,
        }}
      >
        Felicidades a quienes atinaron
        <br />
        <span style={{fontFamily: F.display, fontSize: 90, color: C.amarillo, letterSpacing: 2}}>3 DE 3</span>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1530,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 30,
          opacity: tw(f, [34, 44], [0, 1]),
        }}
      >
        <Img src={staticFile('logos/logo_westhill_blanco_total.png')} style={{width: 330}} />
        <span style={{fontFamily: F.sans, fontWeight: 500, fontSize: 52, color: C.blanco}}>×</span>
        <Img src={staticFile('logos/logo_ipefh_transparente_contorno_blanco.png')} style={{width: 190}} />
      </div>
      <Sfx at={12} name="ding" volume={0.45} />
    </AbsoluteFill>
  );
};

const CORNHOLE_ITEMS: Item[] = [
  {dur: 45, el: <VideoShot src="IMG_0581" from={0.2} dur={45} />},
  {
    dur: 90,
    el: (
      <BehindShot seg="cornhole" frames={90} dur={90}>
        <CornholeText estreno={false} />
      </BehindShot>
    ),
  },
  {dur: 60, el: <ReglasCard />},
  {dur: 60, el: <VideoShot src="IMG_0594" from={0.3} dur={60} />},
  {dur: 60, el: <VideoShot src="IMG_0596" from={0.3} dur={60} />, overlay: <Counter n={1} />},
  {dur: 75, el: <SlowLanding />, overlay: <Counter n={2} />},
  {dur: 60, el: <VideoShot src="IMG_0607" from={0.6} dur={60} />, overlay: <Counter n={3} />},
  {dur: 60, el: <VideoShot src="IMG_0608" from={0.8} dur={60} />, overlay: <Logrado />},
  {dur: 40, el: <WinnerPhoto src="ganador1" tilt={-3} dur={40} />, overlay: <GanadoresRibbon />},
  {dur: 40, el: <WinnerPhoto src="ganador2" tilt={2.5} dur={40} />, overlay: <GanadoresRibbon />},
  {dur: 40, el: <WinnerPhoto src="ganador3" tilt={-2} dur={40} />, overlay: <GanadoresRibbon />},
  {dur: 80, el: <CornholeOutro />},
];
export const CORNHOLE_FRAMES = OPENER + CORNHOLE_ITEMS.reduce((a, b) => a + b.dur, 0);

export const CornholeStory: React.FC = () => (
  <StoryFrame title="El reto del cornhole" dur={CORNHOLE_FRAMES}>
    <SoftPlayer items={CORNHOLE_ITEMS} />
  </StoryFrame>
);
