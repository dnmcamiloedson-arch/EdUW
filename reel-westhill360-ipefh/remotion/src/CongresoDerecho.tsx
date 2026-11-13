import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from './components';
import {Sfx} from './shots';
import {F, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Onceavo Congreso Académico de Derecho: intro de 5 s ("Así se está viviendo el…") antes del video del cliente,
// que va completo y sin recortes (public/proxies/congreso/video.mp4, 21.8 s, con su audio).
// La intro arranca sobre el primer cuadro del video, desenfocado y oscurecido; el arte del título
// (public/congreso/titulo_congreso.png, 1080x1920 con transparencia) se anima por franjas:
// líneas doradas, CONGRESO, ACADÉMICO DE, DERECHO (con brillo) y el subtítulo. Al final el fondo se enfoca y
// coincide con el primer cuadro del video, que empieza sin corte visible.
// ---------------------------------------------------------------------------
const W = 1080;
const H = 1920;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const INTRO = 150;
const VIDEO_F = 654; // 21.8 s
export const CONGRESO_FRAMES = INTRO + VIDEO_F;
const ORO = '#F0C84A';
const ARTE = staticFile('congreso/titulo_congreso.png');
const hh = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Franja del arte del título (filas y0–y1 del PNG) */
const Franja: React.FC<{y0: number; y1: number; x0?: number; x1?: number; style?: React.CSSProperties}> = ({y0, y1, x0 = 0, x1 = W, style}) => (
  <Img src={ARTE} style={{position: 'absolute', left: 0, top: 0, width: W, height: H, clipPath: `inset(${y0}px ${W - x1}px ${H - y1}px ${x0}px)`, ...style}} />
);

/** Polvo dorado que sube despacio */
const Polvo: React.FC<{op: number}> = ({op}) => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 70; i++) {
      const grande = i % 6 === 0;
      const v = grande ? 0.4 + hh(i * 5.3) * 0.4 : 0.8 + hh(i * 5.3) * 1.6;
      const x = hh(i * 2.3) * W + Math.sin(f / 40 + i) * 14;
      const y = ((((hh(i * 7.1) * (H + 200) - f * v) % (H + 200)) + (H + 200)) % (H + 200)) - 100;
      const r = grande ? 26 + hh(i * 3.7) * 40 : 1.5 + hh(i * 3.7) * 2.5;
      const a = (grande ? 0.12 : 0.55 * (0.4 + 0.6 * Math.abs(Math.sin(f / 14 + i)))) * op;
      const g = ctx.createRadialGradient(x, y, 0, x, y, grande ? r : r * 3);
      g.addColorStop(0, `rgba(246,214,140,${a})`);
      g.addColorStop(1, 'rgba(246,214,140,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, grande ? r : r * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [f, op]);
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />;
};

const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const sale = tw(f, [INTRO - 30, INTRO], [0, 1], ease.inOut); // el fondo se enfoca hacia el video
  const salTitulo = tw(f, [INTRO - 32, INTRO - 10], [0, 1], ease.in);
  const kicker = tw(f, [6, 26], [0, 1]);
  const lineas = tw(f, [14, 40], [0, 1], ease.inOut);
  const xi = tw(f, [26, 44], [0, 1]);
  const c1 = tw(f, [22, 42], [0, 1]);
  const c2 = tw(f, [30, 50], [0, 1]);
  const d = tw(f, [38, 60], [0, 1]);
  const sub = tw(f, [56, 80], [0, 1]);
  const luz = interpolate(f, [62, 96], [0, 1], clamp);
  const flash = interpolate(f, [38, 41, 60], [0, 0.35, 0], clamp);
  const sube = (p: number, dist = 60): React.CSSProperties => ({transform: `translateY(${(1 - p) * dist}px)`, opacity: Math.min(1, p * 1.6)});
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {/* fondo: primer cuadro del video, desenfocado y oscurecido; al final se enfoca */}
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <Img src={staticFile('proxies/congreso/primer_cuadro.jpg')} style={{width: W, height: H, objectFit: 'cover', transform: `scale(${1.12 - 0.12 * sale + 0.03 * (f / INTRO) * (1 - sale)})`, filter: `blur(${(1 - sale) * 26}px)`}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,16,34,0.9) 0%, rgba(8,16,34,0.72) 45%, rgba(8,16,34,0.9) 100%)', opacity: 1 - sale}} />
      <AbsoluteFill style={{opacity: 1 - sale}}>
        <Polvo op={1} />
      </AbsoluteFill>
      {/* título */}
      <AbsoluteFill style={{opacity: 1 - salTitulo, transform: `scale(${1 + 0.02 * (f / INTRO) + salTitulo * 0.08})`, filter: salTitulo > 0 ? `blur(${salTitulo * 10}px)` : undefined}}>
        <div style={{position: 'absolute', left: 0, width: W, top: 628, textAlign: 'center', fontFamily: F.sans, fontWeight: 700, fontSize: 32, letterSpacing: 9, color: '#FFFFFF', ...sube(kicker, 24)}}>ASÍ SE ESTÁ VIVIENDO EL</div>
        {/* líneas: crecen desde el centro hacia afuera */}
        <Franja y0={722} y1={760} x0={223 + (1 - lineas) * 152} x1={376} />
        <Franja y0={722} y1={760} x0={716} x1={869 - (1 - lineas) * 152} />
        <div style={{position: 'absolute', left: 376, width: 340, top: 724, textAlign: 'center', fontFamily: F.sans, fontWeight: 800, fontSize: 30, letterSpacing: 10, color: ORO, ...sube(xi, 16)}}>ONCEAVO</div>
        {/* palabras: suben desde su propia máscara */}
        <div style={{position: 'absolute', inset: 0, clipPath: 'inset(780px 0 1052px 0)'}}>
          <Franja y0={780} y1={868} style={{transform: `translateY(${(1 - c1) * 90}px)`}} />
        </div>
        <div style={{position: 'absolute', inset: 0, clipPath: 'inset(864px 0 976px 0)'}}>
          <Franja y0={864} y1={944} style={{transform: `translateY(${(1 - c2) * 84}px)`}} />
        </div>
        <div style={{position: 'absolute', inset: 0, clipPath: 'inset(952px 0 860px 0)'}}>
          <Franja y0={952} y1={1060} style={{transform: `translateY(${(1 - d) * 110}px) scale(${1.06 - 0.06 * d})`, transformOrigin: '540px 1008px', filter: 'drop-shadow(0 0 18px rgba(240,200,74,0.35))'}} />
          {/* brillo que recorre DERECHO */}
          {luz > 0 && luz < 1 && (
            <Franja y0={952} y1={1060} style={{filter: 'brightness(1.9)', WebkitMaskImage: `linear-gradient(105deg, rgba(0,0,0,0) ${luz * 140 - 30}%, rgba(0,0,0,1) ${luz * 140 - 20}%, rgba(0,0,0,0) ${luz * 140 - 10}%)`, maskImage: `linear-gradient(105deg, rgba(0,0,0,0) ${luz * 140 - 30}%, rgba(0,0,0,1) ${luz * 140 - 20}%, rgba(0,0,0,0) ${luz * 140 - 10}%)`}} />
          )}
        </div>
        <Franja y0={1088} y1={1212} style={sube(sub, 22)} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#FFF4D8', opacity: flash, mixBlendMode: 'screen'}} />
      <Sfx at={4} name="whoosh" volume={0.3} />
      <Sfx at={38} name="impact" volume={0.45} />
      <Sfx at={64} name="ding" volume={0.18} />
      <Sfx at={INTRO - 30} name="whoosh_largo" volume={0.3} />
    </AbsoluteFill>
  );
};

export const CongresoDerecho: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <Sequence durationInFrames={INTRO}>
      <Intro />
      <Grain opacity={0.03} />
    </Sequence>
    <Sequence from={INTRO} durationInFrames={VIDEO_F}>
      <OffthreadVideo src={staticFile('proxies/congreso/video.mp4')} style={{width: W, height: H}} />
    </Sequence>
  </AbsoluteFill>
);
