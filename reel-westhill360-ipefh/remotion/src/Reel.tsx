import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {BarSweep, CircleWipe, CleanBg, Flash, Grain, Highlight, MaskReveal, WordsIn} from './components';
import {Intro, INTRO_FRAMES} from './Intro';
import {Banner, BehindShot, PhotoShot, PlacePill, SectionLabel, Sfx, Shade, VideoShot} from './shots';
import {C, F, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Tarjetas de título (fondo limpio / azul, como la referencia)
// ---------------------------------------------------------------------------
const TalleresCard: React.FC = () => {
  const f = useCurrentFrame();
  const items = ['Arquitectura', 'Administración', 'Medicina', 'Cirujano Dentista'];
  return (
    <AbsoluteFill>
      <CleanBg />
      <div style={{position: 'absolute', top: 560, width: '100%'}}>
        <WordsIn text="Talleres por" start={2} style={{fontFamily: F.sans, fontWeight: 800, fontSize: 84, color: C.marino, letterSpacing: -2}} />
      </div>
      <MaskReveal start={8} style={{position: 'absolute', top: 650, width: '100%', textAlign: 'center'}}>
        <span style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 150, color: C.azul}}>licenciatura</span>
      </MaskReveal>
      <div style={{position: 'absolute', top: 900, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
        {items.map((t, i) => {
          const s = 16 + i * 5;
          return (
            <div
              key={t}
              style={{
                fontFamily: F.sans,
                fontWeight: 800,
                fontSize: 50,
                color: C.blanco,
                background: C.azul,
                padding: '8px 30px 12px',
                borderRadius: 8,
                transform: `translateX(${tw(f, [s, s + 12], [i % 2 ? 900 : -900, 0])}px)`,
              }}
            >
              {t}
            </div>
          );
        })}
      </div>
      {[16, 21, 26, 31].map((s) => (
        <Sfx key={s} at={s} name="click_suave" volume={0.6} />
      ))}
    </AbsoluteFill>
  );
};

const TitleCard: React.FC<{small: string; big: string; color?: string; bg?: 'clean' | 'blue'}> = ({small, big, bg = 'blue'}) => {
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
      <MaskReveal start={5} dur={14} style={{position: 'absolute', top: 830, width: '100%', textAlign: 'center'}}>
        <span style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 160, color: blue ? C.blanco : C.azul}}>{big}</span>
      </MaskReveal>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Llegada: "¡LLEGÓ IPEFH!" detrás de las personas
// ---------------------------------------------------------------------------
const LlegadaText: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <div style={{position: 'absolute', top: 300, textAlign: 'center', width: '100%'}}>
        <div style={{overflow: 'hidden'}}>
          <div
            style={{
              fontFamily: F.display,
              fontSize: 250,
              lineHeight: 1,
              color: C.azul,
              transform: `translateY(${tw(f, [4, 18], [100, 0])}%)`,
            }}
          >
            ¡LLEGÓ
          </div>
        </div>
        <div
          style={{
            fontFamily: F.display,
            fontSize: 330,
            lineHeight: 0.95,
            color: C.amarillo,
            WebkitTextStroke: `6px ${C.marino}`,
            transform: `scale(${tw(f, [10, 24], [0.6, 1], ease.back)})`,
            opacity: tw(f, [10, 15], [0, 1]),
          }}
        >
          IPEFH!
        </div>
      </div>
      <Sfx at={10} name="impact" volume={0.6} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Cornhole
// ---------------------------------------------------------------------------
export const CornholeText: React.FC = () => {
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
              fontSize: 250,
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
      <div
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
      </div>
      <Sfx at={22} name="pop" />
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
        <WordsIn text="La dinámica" start={1} style={{fontFamily: F.sans, fontWeight: 800, fontSize: 64, color: C.marino}} />
      </div>
      <div style={{position: 'absolute', top: 470, width: '100%', display: 'flex', justifyContent: 'center', gap: 34}}>
        <Bag color={C.azul} start={6} />
        <Bag color="#C8323C" start={11} />
        <Bag color={C.azul} start={16} />
      </div>
      <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center'}}>
        <Highlight start={20} color={C.azul} pad="0.05em 0.35em">
          <span style={{fontFamily: F.sans, fontWeight: 900, fontSize: 92, color: C.blanco}}>3 tiros seguidos</span>
        </Highlight>
      </div>
      <div style={{position: 'absolute', top: 790, width: '100%', textAlign: 'center', fontFamily: F.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 96, color: C.azul, opacity: tw(f, [28, 34], [0, 1])}}>
        = un termo
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
    <div style={{position: 'absolute', left: 64, top: 1240, display: 'flex', alignItems: 'center', gap: 18}}>
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
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          fontFamily: F.display,
          fontSize: 210,
          lineHeight: 0.95,
          textAlign: 'center',
          color: C.amarillo,
          WebkitTextStroke: `5px ${C.marino}`,
          transform: `scale(${tw(f, [2, 12], [2.2, 1], ease.out)}) rotate(-5deg)`,
          opacity: tw(f, [2, 6], [0, 1]),
          textShadow: '0 10px 40px rgba(0,0,0,0.35)',
          marginTop: -300,
        }}
      >
        ¡LO
        <br />
        LOGRARON!
      </div>
      <Sfx at={2} name="impact" volume={0.8} />
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
      <Sfx at={0} name="shutter" volume={0.9} />
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
// Cierre: foto grupal frente a WESTHILL con "GRACIAS" detrás del grupo
// ---------------------------------------------------------------------------
const Cierre: React.FC = () => {
  const f = useCurrentFrame();
  const PW = 2576, PH = 1450;
  // Fase A: llena la altura y recorre el grupo; Fase B: se aleja hasta verse completa
  const sA = 1920 / PH;
  const sB = 1080 / PW;
  const k = tw(f, [118, 150], [0, 1], ease.inOut);
  const s = sA + (sB - sA) * k;
  const panA = tw(f, [0, 118], [0, -(PW * sA - 1080)], (t) => ease.inOut(t));
  const xB = 0;
  const yA = 0, yB = 520;
  const x = panA + (xB - panA) * k;
  const y = yA + (yB - yA) * k;
  const layer: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: PW, height: PH, transformOrigin: '0 0', transform: `translate(${x}px, ${y}px) scale(${s})`};
  const textO = tw(f, [8, 16], [0, 1]) * tw(f, [108, 120], [1, 0]);
  return (
    <AbsoluteFill style={{background: C.marino, overflow: 'hidden'}}>
      {/* fondo desenfocado para la fase B */}
      <AbsoluteFill style={{opacity: k}}>
        <Img src={staticFile('seg/final/bg_0000.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(36px) brightness(0.55)', transform: 'scale(1.2)'}} />
      </AbsoluteFill>
      <div style={layer}>
        <Img src={staticFile('seg/final/bg_0000.jpg')} style={{width: PW, height: PH}} />
      </div>
      {/* GRACIAS detrás del grupo */}
      <div style={{position: 'absolute', top: 690, width: '100%', textAlign: 'center', opacity: textO}}>
        <div style={{overflow: 'hidden'}}>
          <div
            style={{
              fontFamily: F.display,
              fontSize: 300,
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
        <Img src={staticFile('seg/final/fg_0000.png')} style={{width: PW, height: PH, opacity: 1 - k}} />
      </div>
      {/* marco de foto fase B */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: yB,
          width: 1080,
          height: PH * sB,
          boxShadow: `0 0 0 ${10 * k}px ${C.blanco}, 0 30px 80px rgba(0,0,0,${0.5 * k})`,
          opacity: k,
          pointerEvents: 'none',
        }}
      />
      {/* textos fase B */}
      <Sequence from={140} layout="none">
        <CierreTextos />
      </Sequence>
      <Flash at={0} dur={10} />
      <Sfx at={0} name="shutter" />
      <Sfx at={116} name="whoosh_largo" volume={0.7} />
    </AbsoluteFill>
  );
};

const CierreTextos: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 250, width: '100%'}}>
        <WordsIn text="¡Gracias por visitarnos!" start={0} stagger={3} style={{fontFamily: F.sans, fontWeight: 800, fontSize: 64, color: C.blanco}} />
      </div>
      <MaskReveal start={6} style={{position: 'absolute', top: 330, width: '100%', textAlign: 'center'}}>
        <span style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 112, color: C.blanco}}>IPEFH Aeropuerto</span>
      </MaskReveal>
      <div style={{position: 'absolute', top: 1200, width: '100%', textAlign: 'center'}}>
        <Highlight start={14} color={C.amarillo} pad="0.1em 0.4em">
          <span style={{fontFamily: F.sans, fontWeight: 900, fontSize: 52, color: C.marino, opacity: tw(f, [18, 24], [0, 1])}}>Te esperamos en Westhill</span>
        </Highlight>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1330,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 40,
          opacity: tw(f, [22, 32], [0, 1]),
          transform: `translateY(${tw(f, [22, 36], [40, 0])}px)`,
        }}
      >
        <Img src={staticFile('logos/logo_westhill_transparente_texto_blanco.png')} style={{width: 470}} />
        <span style={{fontFamily: F.sans, fontWeight: 500, fontSize: 70, color: C.blanco}}>×</span>
        <Img src={staticFile('logos/logo_ipefh_transparente_contorno_blanco.png')} style={{width: 270}} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1560,
          width: '100%',
          textAlign: 'center',
          fontFamily: F.sans,
          fontWeight: 800,
          fontSize: 40,
          letterSpacing: 6,
          color: 'rgba(255,255,255,0.85)',
          opacity: tw(f, [36, 46], [0, 1]),
        }}
      >
        #SOMOSWESTHILL
      </div>
      <Sfx at={0} name="click_suave" volume={0.6} />
      <Sfx at={14} name="click" volume={0.6} />
      <Sfx at={22} name="ding" volume={0.5} />
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
      {
        dur: 90,
        el: (
          <BehindShot seg="llegada" frames={90} dur={90}>
            <LlegadaText />
          </BehindShot>
        ),
      },
    ],
  },
  {name: 'talleres', items: [{dur: 60, el: <TalleresCard />}]},
  {
    name: 'arquitectura',
    shade: true,
    overlay: <SectionLabel num="01" name="Arquitectura" sub="Taller de la licenciatura" />,
    items: [S('IMG_0513', 1.0, 1.5, 'whipL'), P('taller_maestro', 1.0), S('IMG_0515', 2.2, 1.5, 'zoom')],
  },
  {
    name: 'administracion',
    shade: true,
    overlay: <SectionLabel num="02" name="Administración" sub="Dirección Empresarial y Mercadotecnia" />,
    items: [S('IMG_0522', 3.0, 1.5, 'whipR'), P('taller_maestra_mesa', 1.0), S('IMG_0521', 0.3, 1.5, 'zoom')],
  },
  {
    name: 'medicina',
    shade: true,
    overlay: <SectionLabel num="03" name="Medicina" sub="Práctica de RCP" />,
    items: [S('IMG_0541', 0.5, 1.2, 'whipL'), S('IMG_0526', 1.0, 1.0, 'zoom'), P('medicina_rcp2', 0.8), S('IMG_0540', 0.5, 1.0, 'whipR')],
  },
  {
    name: 'dentista',
    shade: true,
    overlay: <SectionLabel num="04" name="Cirujano Dentista" sub="Laboratorio dental" />,
    items: [S('IMG_0543', 2.5, 1.8, 'whipL'), P('dentista', 1.2)],
  },
  {
    name: 'conferencia',
    shade: true,
    overlay: <SectionLabel num="05" name="Conferencia" />,
    items: [S('IMG_0558', 2.0, 1.5, 'zoom'), S('IMG_0548', 0.5, 1.2, 'whipL'), S('IMG_0553', 3.0, 1.3, 'whipR')],
  },
  {
    name: 'biblioteca',
    shade: true,
    overlay: <SectionLabel num="06" name="Biblioteca" />,
    items: [S('IMG_0566_luz', 0.5, 2.5, 'zoom'), P('grupo_bloques', 1.5, 'flash')],
  },
  {
    name: 'break',
    shade: true,
    overlay: <SectionLabel num="07" name="Break" sub="Refrigerio al aire libre" />,
    items: [S('IMG_0581', 0.2, 1.5, 'whipL'), P('termos', 1.5, 'zoom', '50% 45%')],
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
      {...S('IMG_0619', 1.0, 2.0, 'zoom'), overlay: <PlacePill text="Alberca" />},
      {...S('IMG_0622', 0.0, 1.5, 'whipL'), overlay: <PlacePill text="Gimnasio" />},
      {...S('IMG_0629', 0.0, 2.0, 'whipR'), overlay: <PlacePill text="Voleibol" />},
      {...S('IMG_0645', 1.0, 1.5, 'zoom'), overlay: <PlacePill text="Quirófano" />},
      {...S('IMG_0647', 2.5, 2.0, 'whipL'), overlay: <PlacePill text="Lab. de Anatomía" />},
    ],
  },
  {name: 'cierre', items: [{dur: 240, el: <Cierre />}]},
];

export const sectionDur = (s: Section) => s.items.reduce((a, b) => a + b.dur, 0);
export const REEL_FRAMES = INTRO_FRAMES + SECTIONS.reduce((a, s) => a + sectionDur(s), 0);
const BANNER_END = REEL_FRAMES - 240;

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

export const Reel: React.FC<{music?: boolean}> = ({music = true}) => (
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
    {music && <Audio src={staticFile('music/beat_westhill360.wav')} volume={(f) => interpolate(f, [REEL_FRAMES - 45, REEL_FRAMES], [0.62, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />}
  </AbsoluteFill>
);
