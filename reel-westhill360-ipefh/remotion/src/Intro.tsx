import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {BarSweep, CleanBg, Flash, Grain, Highlight, MaskReveal, WordsIn} from './components';
import {C, F, ease, sfxFile, tw} from './theme';

export const INTRO_FRAMES = 180;

const Sfx: React.FC<{at: number; name: string; volume?: number}> = ({at, name, volume = 1}) => (
  <Sequence from={at} layout="none">
    <Audio src={staticFile(sfxFile(name))} volume={volume} />
  </Sequence>
);

/** Escena A: logos Westhill × IPEFH sobre fondo limpio */
const Logos: React.FC = () => {
  const f = useCurrentFrame();
  const push = tw(f, [0, 80], [1, 1.07], (t) => t);
  // "360" fantasma detrás de los logos, con parallax
  const ghostX = tw(f, [0, 80], [80, -60], (t) => t);
  const lineP = tw(f, [20, 36], [0, 1], ease.inOut);
  const xS = tw(f, [28, 40], [0, 1], ease.back);
  return (
    <AbsoluteFill>
      <CleanBg />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div
          style={{
            fontFamily: F.display,
            fontSize: 760,
            color: '#E1E6ED',
            transform: `translateX(${ghostX}px) scale(${tw(f, [0, 30], [1.15, 1])})`,
            opacity: tw(f, [0, 20], [0, 1]),
            letterSpacing: -10,
          }}
        >
          360
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${push})`}}>
        {/* Westhill */}
        <div
          style={{
            position: 'absolute',
            left: 160,
            top: 560,
            width: 760,
            clipPath: `inset(0 0 ${tw(f, [4, 26], [100, 0], ease.inOut)}% 0)`,
            transform: `translateY(${tw(f, [4, 30], [60, 0])}px)`,
            filter: `blur(${tw(f, [4, 24], [14, 0])}px)`,
          }}
        >
          <Img src={staticFile('logos/logo_westhill_sin_blanco.png')} style={{width: '100%'}} />
        </div>
        {/* línea + × */}
        <div
          style={{
            position: 'absolute',
            top: 985,
            left: 140,
            width: 800,
            height: 4,
            background: C.azul,
            transform: `scaleX(${lineP})`,
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 935,
            left: 490,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: C.fondo,
            transform: `scale(${xS}) rotate(${tw(f, [28, 44], [-90, 0])}deg)`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: F.sans,
            fontWeight: 500,
            fontSize: 84,
            color: C.azul,
            lineHeight: 1,
          }}
        >
          ×
        </div>
        {/* IPEFH */}
        <div
          style={{
            position: 'absolute',
            left: 300,
            top: 1080,
            width: 480,
            opacity: tw(f, [30, 40], [0, 1]),
            transform: `translateY(${tw(f, [30, 52], [90, 0])}px) rotate(${tw(f, [30, 54], [-6, 0], ease.back)}deg)`,
            filter: `blur(${tw(f, [30, 48], [14, 0])}px)`,
          }}
        >
          <Img src={staticFile('logos/logo_ipefh_transparente.png')} style={{width: '100%'}} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Emblema 360°: número centrado + anillo amarillo que se dibuja y da la vuelta completa */
const EMB_X = 540; // centro horizontal (pantalla)
const EMB_Y = 1365; // centro vertical (pantalla)
const Emblem360: React.FC<{start: number}> = ({start: s}) => {
  const f = useCurrentFrame();
  const S = 560; // lienzo SVG
  const c = S / 2;
  const R = 215;
  const circ = 2 * Math.PI * R;
  // anillo amarillo: se dibuja mientras gira 360° completos
  const p = tw(f, [s + 2, s + 28], [0, 1], ease.inOut);
  const spin = tw(f, [s + 2, s + 50], [-200, 160], ease.inOut);
  const arc = 0.84 * p;
  const phi = arc * 2 * Math.PI;
  const ex = c + R * Math.cos(phi);
  const ey = c + R * Math.sin(phi);
  const track = tw(f, [s, s + 14], [0, 1], ease.out);
  const num = tw(f, [s + 4, s + 20], [0, 1], ease.back);
  if (f < s) return null;
  const box: React.CSSProperties = {position: 'absolute', left: EMB_X - c, top: EMB_Y - c, width: S, height: S};
  return (
    <>
      <svg width={S} height={S} style={box}>
        {/* pista tenue + anillo punteado exterior que gira en sentido contrario */}
        <circle cx={c} cy={c} r={R} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={6} transform={`translate(${c} ${c}) scale(${0.6 + 0.4 * track}) translate(${-c} ${-c})`} opacity={track} />
        <circle
          cx={c}
          cy={c}
          r={R + 30}
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={3}
          strokeDasharray="2 14"
          strokeLinecap="round"
          opacity={tw(f, [s + 6, s + 18], [0, 1])}
          transform={`rotate(${-f * 1.4} ${c} ${c})`}
        />
      </svg>
      <svg width={S} height={S} style={{...box, filter: 'drop-shadow(0 0 16px rgba(242,194,48,0.55))'}}>
        {p > 0.01 && (
          <g transform={`rotate(${spin - 90} ${c} ${c})`}>
            <circle cx={c} cy={c} r={R} fill="none" stroke={C.amarillo} strokeWidth={12} strokeLinecap="round" strokeDasharray={`${circ * arc} ${circ}`} />
            <polygon points="-8,-20 26,0 -8,20" fill={C.amarillo} transform={`translate(${ex} ${ey}) rotate(${(phi * 180) / Math.PI + 90})`} />
          </g>
        )}
      </svg>
      {/* número perfectamente centrado en el anillo (el ° va aparte para no descentrarlo) */}
      <div
        style={{
          ...box,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: tw(f, [s + 4, s + 10], [0, 1]),
          transform: `scale(${0.5 + 0.5 * num})`,
          filter: `blur(${tw(f, [s + 4, s + 16], [10, 0])}px)`,
        }}
      >
        <div style={{position: 'relative', fontFamily: F.display, fontSize: 165, lineHeight: 1, color: C.amarillo, transform: `translateY(${NUM_DY}px)`}}>
          360
          <span style={{position: 'absolute', left: '100%', top: '0.02em', marginLeft: 4, fontSize: "0.4em"}}>°</span>
        </div>
      </div>
    </>
  );
};
const NUM_DY = 0;

/** Escena B: "Bienvenidos a la Experiencia Westhill 360" */
const Welcome: React.FC<{subtitle: string}> = ({subtitle}) => {
  const f = useCurrentFrame();
  const exitS = tw(f, [156, 178], [1, 2.6], ease.in);
  const exitB = tw(f, [160, 178], [0, 22], ease.in);
  const letters = 'WESTHILL'.split('');
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: C.azul}}>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, rgba(61,139,212,0.85) 0%, rgba(39,99,154,0) 60%, rgba(10,25,50,0.55) 100%)'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${exitS})`, filter: `blur(${exitB}px)`}}>
        <div style={{position: 'absolute', top: 545, width: '100%'}}>
          <WordsIn
            text="Bienvenidos a la"
            start={82}
            style={{fontFamily: F.sans, fontWeight: 700, fontSize: 70, color: C.blanco, letterSpacing: -1}}
          />
        </div>
        <MaskReveal start={90} dur={18} style={{position: 'absolute', top: 625, width: '100%', textAlign: 'center'}}>
          <span style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 150, color: C.blanco, lineHeight: 1.05}}>
            Experiencia
          </span>
        </MaskReveal>
        <div
          style={{
            position: 'absolute',
            top: 830,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            overflow: 'hidden',
            height: 300,
          }}
        >
          {letters.map((l, i) => {
            const s = 98 + i * 2;
            return (
              <span
                key={i}
                style={{
                  fontFamily: F.display,
                  fontSize: 215,
                  lineHeight: 1.12,
                  color: C.blanco,
                  display: 'inline-block',
                  transform: `translateY(${tw(f, [s, s + 14], [110, 0])}%)`,
                  letterSpacing: tw(f, [98, 140], [12, 2]),
                }}
              >
                {l}
              </span>
            );
          })}
        </div>
<Emblem360 start={112} />
        <div style={{position: 'absolute', top: 1640, width: '100%', textAlign: 'center'}}>
          <Highlight start={132} dur={12} color={C.blanco} pad="0.12em 0.45em">
            <span
              style={{
                fontFamily: F.sans,
                fontWeight: 800,
                fontSize: 44,
                color: C.azul,
                letterSpacing: 1,
                opacity: tw(f, [138, 146], [0, 1]),
              }}
            >
              {subtitle}
            </span>
          </Highlight>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Intro: React.FC<{subtitle?: string}> = ({subtitle = 'IPEFH · PLANTEL AEROPUERTO'}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.fondo}}>
      {f < 76 ? <Logos /> : <Welcome subtitle={subtitle} />}
      <BarSweep start={66} dur={20} color={C.azul} />
      <Flash at={177} dur={8} />
      <Grain />
      <Sfx at={0} name="charge" volume={0.55} />
      <Sfx at={4} name="flicker" volume={0.7} />
      <Sfx at={30} name="taps" volume={0.7} />
      <Sfx at={64} name="swipe" />
      <Sfx at={82} name="flicker" volume={0.6} />
      <Sfx at={90} name="whoosh" volume={0.5} />
      <Sfx at={99} name="impact" volume={0.7} />
      <Sfx at={113} name="digital" volume={0.8} />
      <Sfx at={132} name="click" />
      <Sfx at={140} name="riser" volume={0.6} />
      <Sfx at={158} name="whoosh_largo" />
      <Sfx at={174} name="flash" volume={0.8} />
    </AbsoluteFill>
  );
};
