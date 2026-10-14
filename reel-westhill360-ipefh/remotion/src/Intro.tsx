import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {BarSweep, CleanBg, Flash, Grain, Highlight, MaskReveal, WordsIn} from './components';
import {C, F, ease, tw} from './theme';

export const INTRO_FRAMES = 180;

const Sfx: React.FC<{at: number; name: string; volume?: number}> = ({at, name, volume = 1}) => (
  <Sequence from={at} layout="none">
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
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

/** Anillo 360° que se dibuja alrededor del número */
const Ring360: React.FC<{start: number}> = ({start}) => {
  const f = useCurrentFrame();
  const R = 205;
  const circ = 2 * Math.PI * R;
  const draw = tw(f, [start, start + 22], [0, 0.92], ease.inOut);
  const rot = tw(f, [start, start + 60], [-140, 40], ease.out);
  const end = -Math.PI / 2 + draw * 2 * Math.PI;
  const ax = 260 + R * Math.cos(end);
  const ay = 260 + R * Math.sin(end);
  const ang = (end * 180) / Math.PI + 90;
  if (draw <= 0.01) return null;
  return (
    <svg width={520} height={520} style={{position: 'absolute', left: 280, top: 1080, transform: `rotate(${rot}deg)`}}>
      <circle
        cx={260}
        cy={260}
        r={R}
        fill="none"
        stroke={C.amarillo}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={`${circ * draw} ${circ}`}
        transform="rotate(-90 260 260)"
      />
      {draw > 0.05 && (
        <polygon points="-22,-6 22,-6 0,28" fill={C.amarillo} transform={`translate(${ax} ${ay}) rotate(${ang - 90})`} />
      )}
    </svg>
  );
};

/** Escena B: "Bienvenidos a la Experiencia Westhill 360" */
const Welcome: React.FC = () => {
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
          <span style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 176, color: C.blanco, lineHeight: 1.05}}>
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
                  fontSize: 262,
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
        <div
          style={{
            position: 'absolute',
            top: 1175,
            width: '100%',
            textAlign: 'center',
            fontFamily: F.display,
            fontSize: 230,
            color: C.amarillo,
            lineHeight: 1,
            transform: `scale(${tw(f, [112, 128], [0.4, 1], ease.back)})`,
            opacity: tw(f, [112, 118], [0, 1]),
          }}
        >
          360°
        </div>
        <Ring360 start={116} />
        <div style={{position: 'absolute', top: 1640, width: '100%', textAlign: 'center'}}>
          <Highlight start={132} dur={12} color={C.blanco} pad="0.12em 0.45em">
            <span
              style={{
                fontFamily: F.sans,
                fontWeight: 800,
                fontSize: 50,
                color: C.azul,
                letterSpacing: 1,
                opacity: tw(f, [138, 146], [0, 1]),
              }}
            >
              IPEFH · PLANTEL AEROPUERTO
            </span>
          </Highlight>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Intro: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.fondo}}>
      {f < 76 ? <Logos /> : <Welcome />}
      <BarSweep start={66} dur={20} color={C.azul} />
      <Flash at={177} dur={8} />
      <Grain />
      <Sfx at={2} name="whoosh" volume={0.7} />
      <Sfx at={30} name="pop" volume={0.8} />
      <Sfx at={64} name="swipe" />
      <Sfx at={82} name="click_suave" volume={0.7} />
      <Sfx at={90} name="whoosh" volume={0.5} />
      <Sfx at={99} name="impact" volume={0.9} />
      <Sfx at={113} name="pop" />
      <Sfx at={132} name="click" />
      <Sfx at={140} name="riser" volume={0.6} />
      <Sfx at={158} name="whoosh_largo" />
    </AbsoluteFill>
  );
};
