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

// ---------------------------------------------------------------------------
// Estilo de la referencia: palabra escrita a mano con neón, texto con estela de
// movimiento (motion blur), trazos dibujados y subtítulo con palabra clave
// ---------------------------------------------------------------------------
const NEON = (c: string, k = 1) =>
  `0 0 ${6 * k}px ${c}, 0 0 ${18 * k}px ${c}cc, 0 0 ${42 * k}px ${c}88, 0 4px 18px rgba(0,0,0,0.35)`;

/** Palabra en letra manuscrita que "se escribe" de izquierda a derecha; opcional brillo neón */
export const ScriptWord: React.FC<{
  text: string;
  start: number;
  size?: number;
  color?: string;
  neon?: boolean;
  tilt?: number;
  dur?: number;
  style?: React.CSSProperties;
}> = ({text, start, size = 120, color = C.amarillo, neon = false, tilt = -6, dur = 16, style}) => {
  const f = useCurrentFrame();
  const p = tw(f, [start, start + dur], [0, 1], ease.inOut);
  // parpadeo corto del neón al encender
  const flick = neon ? (f - start < dur + 6 && [3, 5, 9].includes(f - start - dur) ? 0.35 : 1) : 1;
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: F.script,
        fontSize: size,
        lineHeight: 1.25,
        color,
        padding: '0.1em 0.25em 0.2em 0.1em',
        transform: `rotate(${tilt}deg) translateY(${tw(f, [start, start + dur], [12, 0])}px)`,
        clipPath: `inset(-20% ${(1 - p) * 100}% -20% -10%)`,
        textShadow: neon ? NEON(color, 1) : '0 4px 18px rgba(0,0,0,0.35)',
        opacity: flick,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {text}
    </span>
  );
};

/** Texto que entra rápido con estela de movimiento (motion blur direccional simulado) */
export const BlurIn: React.FC<{
  children: React.ReactNode;
  start: number;
  from?: 'left' | 'right' | 'down';
  dist?: number;
  dur?: number;
  style?: React.CSSProperties;
}> = ({children, start, from = 'left', dist = 260, dur = 10, style}) => {
  const f = useCurrentFrame();
  const p = tw(f, [start, start + dur], [0, 1], ease.out);
  const sx = from === 'left' ? -1 : from === 'right' ? 1 : 0;
  const sy = from === 'down' ? 1 : 0;
  const off = (1 - p) * dist;
  const speed = Math.max(0, tw(f, [start, start + dur], [1, 0], ease.out));
  const copies = 6;
  if (f < start) return null;
  return (
    <div style={{position: 'relative', ...style}}>
      {Array.from({length: copies}).map((_, i) => {
        const k = i / copies;
        const trail = speed * 90 * k;
        return (
          <div
            key={i}
            aria-hidden={i > 0}
            style={{
              position: i === 0 ? 'relative' : 'absolute',
              inset: i === 0 ? undefined : 0,
              transform: `translate(${sx * (off + trail)}px, ${sy * (off + trail)}px)`,
              opacity: i === 0 ? tw(f, [start, start + 3], [0, 1]) : speed * 0.28 * (1 - k),
              filter: i === 0 ? `blur(${speed * 6}px)` : `blur(${2 + 8 * k}px)`,
            }}
          >
            {children}
          </div>
        );
      })}
    </div>
  );
};

/** Trazo dibujado (subrayado curvo, flecha o círculo) que se anima como plumón */
export const Doodle: React.FC<{
  kind: 'underline' | 'arrow' | 'circle' | 'spark';
  start: number;
  dur?: number;
  color?: string;
  width?: number;
  style?: React.CSSProperties;
}> = ({kind, start, dur = 14, color = C.amarillo, width = 420, style}) => {
  const f = useCurrentFrame();
  const p = tw(f, [start, start + dur], [0, 1], ease.inOut);
  const paths: Record<string, {d: string[]; vb: string}> = {
    underline: {d: ['M10 40 C 120 10, 260 10, 410 30'], vb: '0 0 420 60'},
    arrow: {d: ['M10 80 C 90 20, 200 10, 300 40', 'M270 18 L 302 42 L 268 62'], vb: '0 0 320 100'},
    circle: {d: ['M210 12 C 340 10, 410 60, 395 110 C 380 170, 60 175, 25 115 C -5 60, 90 15, 230 25'], vb: '0 0 420 180'},
    spark: {d: ['M40 10 L 50 45', 'M10 40 L 45 55', 'M80 20 L 62 50'], vb: '0 0 100 70'},
  };
  const {d, vb} = paths[kind];
  const [, , vw, vh] = vb.split(' ').map(Number);
  return (
    <svg width={width} height={(width * vh) / vw} viewBox={vb} style={{overflow: 'visible', filter: `drop-shadow(0 0 6px ${color}aa)`, ...style}}>
      {d.map((pd, i) => {
        const seg = 1 / d.length;
        const q = Math.min(1, Math.max(0, (p - i * seg) / seg));
        return (
          <path key={i} d={pd} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - q} />
        );
      })}
    </svg>
  );
};

/** Subtítulo inferior: texto en blanco con una palabra clave manuscrita en amarillo */
export const Caption: React.FC<{text: string; keyword: string; start?: number; top?: number}> = ({text, keyword, start = 4, top = 1380}) => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'baseline',
        gap: 14,
        opacity: tw(f, [start, start + 6], [0, 1]),
        transform: `translateY(${tw(f, [start, start + 10], [24, 0])}px)`,
      }}
    >
      <span style={{fontFamily: F.sans, fontWeight: 800, fontSize: 54, color: C.blanco, textShadow: '0 3px 16px rgba(0,0,0,0.6)'}}>{text}</span>
      <ScriptWord text={keyword} start={start + 4} size={92} tilt={-4} dur={12} />
    </div>
  );
};
