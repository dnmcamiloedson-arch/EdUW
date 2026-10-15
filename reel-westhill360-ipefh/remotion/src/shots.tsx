import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Flash, ScriptWord} from './components';
import {C, F, SAFE_X, ease, sfxFile, tw} from './theme';

export type Enter = 'zoom' | 'whipL' | 'whipR' | 'flash' | 'up' | 'card' | 'none';

/** Modo "natural": entradas suaves (sin barridos, flashes ni whooshes); el fundido lo hace el reproductor */
export const SoftCtx = React.createContext(false);

export const Sfx: React.FC<{at: number; name: string; volume?: number}> = ({at, name, volume = 1}) => (
  <Sequence from={at} layout="none">
    <Audio src={staticFile(sfxFile(name))} volume={volume} />
  </Sequence>
);

/** Movimiento de entrada estilo "transición en tendencia" + leve push-in continuo */
const useEnter = (enterIn: Enter, dur: number, push = 0.08) => {
  const f = useCurrentFrame();
  const soft = React.useContext(SoftCtx);
  const enter: Enter = soft ? 'none' : enterIn;
  let scale = 1 + push * (f / dur);
  let x = 0, y = 0, blur = 0, rot = 0;
  if (enter === 'zoom') {
    scale *= tw(f, [0, 8], [1.35, 1], ease.out);
    blur = tw(f, [0, 7], [18, 0]);
  } else if (enter === 'whipL' || enter === 'whipR') {
    const s = enter === 'whipL' ? 1 : -1;
    x = tw(f, [0, 8], [s * 70, 0], ease.out);
    blur = tw(f, [0, 7], [22, 0]);
    rot = tw(f, [0, 8], [s * 3, 0]);
  } else if (enter === 'up') {
    y = tw(f, [0, 9], [60, 0], ease.out);
    blur = tw(f, [0, 7], [16, 0]);
  }
  let radius = 0;
  let shadow: string | undefined;
  if (enter === 'card') {
    // la toma llega como tarjeta redondeada sobre fondo cálido y se expande (estilo referencia)
    const k = tw(f, [0, 14], [0, 1], ease.inOut);
    scale *= 0.8 + 0.2 * k;
    y = (1 - k) * 9;
    rot = (1 - k) * -3;
    radius = (1 - k) * 80;
    blur = tw(f, [0, 5], [10, 0]);
    shadow = k < 1 ? `0 40px 90px rgba(60,40,20,${0.45 * (1 - k)})` : undefined;
  }
  return {
    transform: `translate(${x}%, ${y}%) scale(${scale}) rotate(${rot}deg)`,
    filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
    borderRadius: radius,
    boxShadow: shadow,
    overflow: 'hidden' as const,
  };
};

/** Fondo detrás de la toma: cálido para la entrada tipo tarjeta, negro en las demás */
const BACK = (enter: Enter) => (enter === 'card' ? 'radial-gradient(ellipse at 50% 40%, #F6EFE7 0%, #E6D8C8 100%)' : '#000');

const ENTER_SFX: Record<Enter, string | null> = {zoom: 'zoom', whipL: 'swipe', whipR: 'swipe', flash: 'flash', up: 'whoosh', card: 'whoosh', none: null};

export const VideoShot: React.FC<{src: string; from: number; dur: number; enter?: Enter; push?: number; sfx?: boolean}> = ({
  src,
  from,
  dur,
  enter = 'zoom',
  push,
  sfx = true,
}) => {
  const soft = React.useContext(SoftCtx);
  const st = useEnter(enter, dur, push);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: soft ? '#000' : BACK(enter)}}>
      <AbsoluteFill style={st}>
        <OffthreadVideo src={staticFile(`proxies/${src}.mp4`)} startFrom={Math.round(from * 30)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      {!soft && enter === 'flash' && <Flash at={0} dur={9} />}
      {!soft && sfx && ENTER_SFX[enter] && <Sfx at={0} name={ENTER_SFX[enter]!} volume={0.55} />}
    </AbsoluteFill>
  );
};

/** Foto con Ken Burns */
export const PhotoShot: React.FC<{src: string; dur: number; enter?: Enter; origin?: string; push?: number; sfx?: boolean}> = ({
  src,
  dur,
  enter = 'flash',
  origin = '50% 50%',
  push = 0.1,
  sfx = true,
}) => {
  const soft = React.useContext(SoftCtx);
  const st = useEnter(enter, dur, push);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: soft ? '#000' : BACK(enter)}}>
      <AbsoluteFill style={{...st, transformOrigin: origin}}>
        <Img src={staticFile(`photos/${src}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      {!soft && enter === 'flash' && <Flash at={0} dur={9} />}
      {!soft && sfx && ENTER_SFX[enter] && <Sfx at={0} name={ENTER_SFX[enter]!} volume={0.6} />}
    </AbsoluteFill>
  );
};

/** Secuencia con texto DETRÁS de las personas: fondo → texto → recorte de personas */
export const BehindShot: React.FC<{seg: string; frames: number; dur: number; children: React.ReactNode; enter?: Enter}> = ({
  seg,
  frames,
  dur,
  children,
  enter = 'zoom',
}) => {
  const f = useCurrentFrame();
  const i = Math.min(frames - 1, f);
  const n = String(i).padStart(4, '0');
  const soft = React.useContext(SoftCtx);
  const st = useEnter(enter, dur, 0.06);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      <AbsoluteFill style={st}>
        <Img src={staticFile(`seg/${seg}/bg_${n}.webp`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      {children}
      <AbsoluteFill style={st}>
        <Img src={staticFile(`seg/${seg}/fg_${n}.webp`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      {!soft && ENTER_SFX[enter] && <Sfx at={0} name={ENTER_SFX[enter]!} volume={0.55} />}
    </AbsoluteFill>
  );
};

/** Degradado inferior para que los textos se lean sobre el video */
export const Shade: React.FC<{from?: number; strength?: number}> = ({from = 45, strength = 0.6}) => (
  <AbsoluteFill
    style={{background: `linear-gradient(180deg, rgba(10,20,40,0) ${from}%, rgba(10,20,40,${strength}) 100%)`, pointerEvents: 'none'}}
  />
);

/** Etiqueta de sección: número outline gigante + cinta con nombre + subtítulo */
export const SectionLabel: React.FC<{num?: string; name: string; sub?: string; top?: number}> = ({num, name, sub, top = 1120}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {num && <div
        style={{
          position: 'absolute',
          left: SAFE_X,
          top,
          fontFamily: F.display,
          fontSize: 210,
          lineHeight: 1,
          color: 'transparent',
          WebkitTextStroke: '4px rgba(255,255,255,0.95)',
          transform: `translateY(${tw(f, [0, 12], [80, 0])}px)`,
          opacity: tw(f, [0, 6], [0, 1]),
        }}
      >
        {num}
      </div>}
      <div style={{position: 'absolute', left: 0, top: top + 205, overflow: 'hidden', paddingRight: 40}}>
        <div
          style={{
            background: C.azul,
            padding: `14px 44px 18px ${SAFE_X}px`,
            transform: `translateX(${tw(f, [4, 18], [-105, 0])}%)`,
            boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
          }}
        >
          <span
            style={{
              fontFamily: F.sans,
              fontWeight: 900,
              fontSize: name.length > 14 ? 66 : 82,
              color: C.blanco,
              letterSpacing: -1.5,
              display: 'inline-block',
              transform: `translateX(${tw(f, [8, 22], [-40, 0])}px)`,
            }}
          >
            {name}
          </span>
        </div>
      </div>
      {sub && (
        <div style={{position: 'absolute', left: SAFE_X - 10, top: top + 315}}>
          <ScriptWord text={sub} start={14} size={sub.length > 16 ? 70 : 84} neon tilt={-5} />
        </div>
      )}
      <Sfx at={4} name="click" volume={0.6} />
      {sub && <Sfx at={14} name="flicker" volume={0.5} />}
    </AbsoluteFill>
  );
};

/** Pastilla de lugar (recorrido) */
export const PlacePill: React.FC<{text: string; top?: number}> = ({text, top = 1300}) => {
  const f = useCurrentFrame();
  const w = tw(f, [2, 14], [0, 1], ease.inOut);
  const pulse = 1 + 0.25 * Math.sin(f / 4);
  return (
    <div style={{position: 'absolute', left: SAFE_X, top, display: 'flex', alignItems: 'center'}}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          background: C.amarillo,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transform: `scale(${tw(f, [0, 10], [0, 1], ease.back)})`,
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{width: 20, height: 20, borderRadius: 10, background: C.marino, transform: `scale(${pulse})`}} />
      </div>
      <div style={{overflow: 'hidden', marginLeft: 14, clipPath: `inset(0 ${100 - w * 100}% 0 0)`}}>
        <div
          style={{
            background: C.blanco,
            color: C.azul,
            fontFamily: F.sans,
            fontWeight: 900,
            fontSize: 58,
            padding: '6px 30px 10px',
            borderRadius: 40,
            letterSpacing: -1,
            whiteSpace: 'nowrap',
            boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
          }}
        >
          {text}
        </div>
      </div>
      <Sfx at={2} name="pop" volume={0.55} />
    </div>
  );
};

/** Banderín UW fijo arriba a la derecha, dentro de la zona segura (entra deslizando desde arriba) */
export const Banner: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        // debajo de la barra de estado y dentro de la zona segura de Instagram
        right: SAFE_X,
        top: 150,
        width: 150,
        opacity: tw(f, [0, 8], [0, 1]),
        transform: `translateY(${tw(f, [0, 16], [-60, 0], ease.back)}px)`,
        filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.35))',
      }}
    >
      <Img src={staticFile('logos/banderin_uw_recortado.png')} style={{width: '100%'}} />
    </div>
  );
};
