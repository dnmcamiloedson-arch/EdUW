import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, F, tw, ease} from './theme';

/** Fondo gris limpio con viñeta suave, como la referencia */
export const CleanBg: React.FC<{color?: string}> = ({color = C.fondo}) => (
  <AbsoluteFill style={{background: color}}>
    <AbsoluteFill
      style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 55%, rgba(20,35,60,0.16) 100%)'}}
    />
  </AbsoluteFill>
);

/** Grano de película muy sutil para que todo se sienta "en capas" */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.06}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <svg width="100%" height="100%">
        <filter id={`g${f % 6}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 6} />
        </filter>
        <rect width="100%" height="100%" filter={`url(#g${f % 6})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** Palabras que entran una por una (subida + desenfoque → nítido) */
export const WordsIn: React.FC<{
  text: string;
  start: number;
  stagger?: number;
  dur?: number;
  style?: React.CSSProperties;
  wordStyle?: (i: number) => React.CSSProperties;
}> = ({text, start, stagger = 3, dur = 14, style, wordStyle}) => {
  const f = useCurrentFrame();
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 0.28em', ...style}}>
      {text.split(' ').map((w, i) => {
        const s = start + i * stagger;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: tw(f, [s, s + dur * 0.6], [0, 1]),
              transform: `translateY(${tw(f, [s, s + dur], [40, 0])}px)`,
              filter: `blur(${tw(f, [s, s + dur], [10, 0])}px)`,
              ...wordStyle?.(i),
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** Texto que se revela con máscara desde abajo (sin opacidad, puro recorte) */
export const MaskReveal: React.FC<{start: number; dur?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  start,
  dur = 16,
  children,
  style,
}) => {
  const f = useCurrentFrame();
  const y = tw(f, [start, start + dur], [105, 0]);
  return (
    <div style={{overflow: 'hidden', paddingBottom: '0.08em', ...style}}>
      <div style={{transform: `translateY(${y}%)`}}>{children}</div>
    </div>
  );
};

/** Recuadro que se dibuja detrás de una palabra (resaltado de la referencia) */
export const Highlight: React.FC<{
  start: number;
  dur?: number;
  color?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  pad?: string;
}> = ({start, dur = 12, color = C.azul, children, style, pad = '0.08em 0.28em'}) => {
  const f = useCurrentFrame();
  const p = tw(f, [start, start + dur], [0, 1], ease.inOut);
  return (
    <span style={{position: 'relative', display: 'inline-block', padding: pad, ...style}}>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          background: color,
          transformOrigin: 'left center',
          transform: `scaleX(${p})`,
        }}
      />
      <span style={{position: 'relative'}}>{children}</span>
    </span>
  );
};

/** Etiqueta tipo cinta que entra desde un lado (como "personales / religiosas") */
export const Ribbon: React.FC<{
  start: number;
  text: string;
  from?: 'left' | 'right';
  bg?: string;
  color?: string;
  size?: number;
  style?: React.CSSProperties;
}> = ({start, text, from = 'right', bg = C.azul, color = C.blanco, size = 64, style}) => {
  const f = useCurrentFrame();
  const x = tw(f, [start, start + 16], [from === 'right' ? 110 : -110, 0]);
  const tx = tw(f, [start + 4, start + 20], [from === 'right' ? 40 : -40, 0]);
  return (
    <div
      style={{
        transform: `translateX(${x}%)`,
        background: `linear-gradient(${from === 'right' ? 90 : 270}deg, rgba(39,99,154,0) 0%, ${bg} 22%)`,
        padding: '10px 48px 14px 80px',
        ...style,
      }}
    >
      <div style={{transform: `translateX(${tx}px)`, color, fontFamily: F.sans, fontWeight: 800, fontSize: size, letterSpacing: -1}}>
        {text}
      </div>
    </div>
  );
};

/** Círculo que crece desde un punto (transición de forma) */
export const CircleWipe: React.FC<{start: number; dur?: number; color?: string; x?: number; y?: number}> = ({
  start,
  dur = 16,
  color = C.azul,
  x = 540,
  y = 960,
}) => {
  const f = useCurrentFrame();
  const r = tw(f, [start, start + dur], [0, 2300], ease.inOut);
  if (f < start) return null;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: x - r,
          top: y - r,
          width: r * 2,
          height: r * 2,
          borderRadius: '50%',
          background: color,
        }}
      />
    </AbsoluteFill>
  );
};

/** Barra que barre toda la pantalla (cubre y descubre) */
export const BarSweep: React.FC<{start: number; dur?: number; color?: string; dir?: 'left' | 'right'}> = ({
  start,
  dur = 18,
  color = C.azul,
  dir = 'left',
}) => {
  const f = useCurrentFrame();
  if (f < start || f > start + dur) return null;
  const half = dur / 2;
  const inP = tw(f, [start, start + half], [0, 1], ease.inOut);
  const outP = tw(f, [start + half, start + dur], [0, 1], ease.inOut);
  const sign = dir === 'left' ? 1 : -1;
  const left = sign > 0 ? (1 - inP) * 100 : 0;
  const right = sign > 0 ? 0 : (1 - inP) * 100;
  const left2 = sign > 0 ? 0 : outP * 100;
  const right2 = sign > 0 ? outP * 100 : 0;
  return (
    <AbsoluteFill
      style={{
        background: color,
        clipPath: `inset(0 ${Math.max(right, right2)}% 0 ${Math.max(left, left2)}%)`,
      }}
    />
  );
};

/** Destello blanco (light leak) */
export const Flash: React.FC<{at: number; dur?: number; color?: string}> = ({at, dur = 10, color = '#fff'}) => {
  const f = useCurrentFrame();
  const o = f < at ? tw(f, [at - 3, at], [0, 1], ease.in) : tw(f, [at, at + dur], [1, 0], ease.out);
  return <AbsoluteFill style={{background: color, opacity: o, pointerEvents: 'none'}} />;
};
