import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from './components';
import {Sfx} from './shots';
import {F, SAFE_X, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Historia de IG (9:16, 37 s): Coordinación de Inclusión en el Museo Banco de México.
// Mismo formato que la historia del Museo del Chocolate (que le gustó al cliente), con monedas de oro en lugar de
// chocolate:
//  1. Intro: lluvia de monedas doradas y "Hoy fuimos al Museo Banco de México".
//  2. Montaje de la visita al compás de la música (120 BPM, 1 compás = 2 s), en el orden del recorrido: historia
//     del dinero, la bóveda, las primeras monedas, los billetes, el oro y el grupo con la guía. Entre bloques
//     cruza una cortina de monedas.
//  3. Cierre: logo y "Coordinación de Inclusión".
// El banderín UW va arriba a la derecha toda la historia. Los textos salen del copy de Ale (Coordinación).
// Clips en public/proxies/banxico (scripts/banxico_preparar.py); música original en public/music/banxico.wav.
// ---------------------------------------------------------------------------
const W = 1080;
const H = 1920;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const NAVY = '#0B1B33';
const ORO = '#D9B76A';
const ORO_OSC = '#9C7230';
const CREMA = '#F6EEDD';
const COMPAS = 60;
const vid = (n: number) => staticFile(`proxies/banxico/wa${n}.mp4`);
const hh = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/**
 * Moneda dorada dibujada en canvas: canto grueso, cara con degradado metálico, aro en relieve, una "W" estampada
 * y un brillo que corre al girar. `giro` (radianes) achata la moneda como si diera vueltas.
 */
const moneda = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, giro: number, inclina: number, a: number) => {
  const sx = Math.max(0.08, Math.abs(Math.cos(giro)));
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, y);
  ctx.rotate(inclina);
  // canto
  const canto = r * 0.16 * Math.sqrt(1 - sx * sx) + r * 0.05;
  ctx.fillStyle = '#7A5520';
  ctx.beginPath();
  ctx.ellipse(canto * 0.6, 0, r * sx + 0.5, r, 0, 0, Math.PI * 2);
  ctx.fill();
  // cara
  const g = ctx.createLinearGradient(-r * sx, -r, r * sx, r);
  const luz = (Math.sin(giro * 2) + 1) / 2;
  g.addColorStop(0, '#FFF1C2');
  g.addColorStop(0.35 + 0.3 * luz, '#E8C46E');
  g.addColorStop(0.75, '#B98A3A');
  g.addColorStop(1, '#8A6224');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * sx, r, 0, 0, Math.PI * 2);
  ctx.fill();
  // aro en relieve
  ctx.strokeStyle = 'rgba(255,240,200,0.75)';
  ctx.lineWidth = Math.max(1, r * 0.07);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * sx * 0.8, r * 0.8, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(120,80,25,0.5)';
  ctx.lineWidth = Math.max(1, r * 0.04);
  ctx.beginPath();
  ctx.ellipse(r * sx * 0.03, r * 0.03, r * sx * 0.86, r * 0.86, 0, 0, Math.PI * 2);
  ctx.stroke();
  // W estampada
  if (sx > 0.35) {
    ctx.save();
    ctx.scale(sx, 1);
    ctx.fillStyle = 'rgba(122,82,28,0.55)';
    ctx.font = `900 ${r * 0.95}px Montserrat`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('W', 0, r * 0.05);
    ctx.fillStyle = 'rgba(255,244,214,0.35)';
    ctx.fillText('W', -r * 0.03, 0);
    ctx.restore();
  }
  // destello
  ctx.fillStyle = `rgba(255,255,240,${0.35 * luz})`;
  ctx.beginPath();
  ctx.ellipse(-r * sx * 0.35, -r * 0.4, r * sx * 0.22, r * 0.12, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

type MonedaCae = {x: number; r: number; v: number; giro0: number; vg: number; inc: number; retraso: number};
const lluvia = (n: number, semilla: number, rMin: number, rMax: number): MonedaCae[] =>
  Array.from({length: n}, (_, i) => ({
    x: hh(i * 3.7 + semilla) * W,
    r: rMin + hh(i * 5.1 + semilla) * (rMax - rMin),
    v: 0.75 + hh(i * 2.3 + semilla) * 0.5,
    giro0: hh(i * 7.9 + semilla) * 6,
    vg: 0.08 + hh(i * 1.3 + semilla) * 0.16,
    inc: (hh(i * 4.4 + semilla) - 0.5) * 0.8,
    retraso: hh(i * 6.1 + semilla),
  }));

/** Monedas que caen girando; `p` (0 a 1) es el avance de la caída de todo el grupo */
const Monedas: React.FC<{lista: MonedaCae[]; p: number; f: number; alto?: number}> = ({lista, p, f, alto = 1}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    // las más chicas (lejanas) primero
    [...lista].sort((a, b) => a.r - b.r).forEach((m) => {
      const k = (p - m.retraso * 0.45) / 0.55;
      if (k <= 0 || k >= 1.15) return;
      const y = -m.r * 2 + k * (H * alto + m.r * 4) * m.v;
      moneda(ctx, m.x, y, m.r, m.giro0 + f * m.vg, m.inc, 1);
    });
  }, [lista, p, f, alto]);
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.35))'}} />;
};

/** Cortina de monedas: una lluvia densa cruza la pantalla y la tapa un instante entre bloques */
const CORTINA = 26;
const LLUVIA_CORTINA = lluvia(70, 11, 60, 150);
const Cortina: React.FC = () => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, CORTINA], [0, 1], clamp);
  const destello = interpolate(f, [CORTINA / 2 - 4, CORTINA / 2, CORTINA / 2 + 6], [0, 0.55, 0], clamp);
  return (
    <AbsoluteFill>
      <Monedas lista={LLUVIA_CORTINA} p={p} f={f} alto={1.6} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(255,236,190,1) 0%, rgba(232,196,110,0.6) 50%, rgba(232,196,110,0) 80%)', opacity: destello}} />
    </AbsoluteFill>
  );
};

/** Clip a pantalla completa: entra fundiéndose sobre el anterior y se acerca despacio */
const FUNDE = 8;
const Clip: React.FC<{n: number; desde: number; dur: number; funde: number}> = ({n, desde, dur, funde}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, dur], [1.0, 1.06], clamp);
  const op = funde ? tw(f, [0, funde], [0, 1], ease.inOut) : 1;
  return (
    <AbsoluteFill style={{background: NAVY, overflow: 'hidden', opacity: op}}>
      <OffthreadVideo src={vid(n)} startFrom={Math.max(0, Math.round(desde * 30) - funde)} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(11,27,51,0) 55%, rgba(11,27,51,0.5) 100%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(11,27,51,0) 58%, rgba(11,27,51,0.6) 100%)'}} />
    </AbsoluteFill>
  );
};

/** Texto de cada bloque: tarjeta crema con letras azul marino; las palabras clave en dorado */
type Parte = [string, boolean?];
const Texto: React.FC<{lineas: {at: number; partes: Parte[]}[]; dur: number}> = ({lineas, dur}) => {
  const f = useCurrentFrame();
  const sale = tw(f, [dur - 12, dur], [0, 1]);
  return (
    <div style={{position: 'absolute', top: 1330, left: 70, right: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: 1 - sale}}>
      {lineas.map(({at, partes}, i) => {
        const p = tw(f, [at, at + 16], [0, 1]);
        return (
          <div key={i} style={{padding: '16px 34px', borderRadius: 26, background: 'rgba(246,238,221,0.96)', borderBottom: `5px solid ${ORO}`, boxShadow: '0 14px 30px rgba(6,16,31,0.4)', fontFamily: F.sans, fontWeight: 800, fontSize: 50, lineHeight: 1.15, color: NAVY, textAlign: 'center', opacity: p, transform: `translateY(${(1 - p) * 26}px)`, filter: `blur(${(1 - p) * 6}px)`}}>
            {partes.map(([t, clave], k) => (
              <span key={k} style={clave ? {color: ORO_OSC, fontFamily: F.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 58} : undefined}>
                {t}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
};

/** Banderín UW en la esquina superior derecha; entra suave */
const Banderin: React.FC = () => {
  const f = useCurrentFrame();
  const p = tw(f, [0, 20], [0, 1]);
  return (
    <div style={{position: 'absolute', right: SAFE_X, top: 130, width: 150, opacity: p, transform: `translateY(${(1 - p) * -30}px)`, filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.35))'}}>
      <Img src={staticFile('logos/banderin_uw.png')} style={{width: '100%', display: 'block'}} />
    </div>
  );
};

const LLUVIA_INTRO = lluvia(46, 3, 34, 120);
const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const a = tw(f, [22, 38], [0, 1]);
  const b = tw(f, [36, 52], [0, 1]);
  const c = tw(f, [50, 66], [0, 1]);
  const brillo = interpolate(f, [70, 104], [-0.3, 1.3], clamp);
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 55%, #17406F 0%, ${NAVY} 60%, #06101F 100%)`}}>
      <Monedas lista={LLUVIA_INTRO} p={interpolate(f, [0, 150], [0, 1], clamp)} f={f} alto={1.3} />
      <div style={{position: 'absolute', top: 760, width: '100%', textAlign: 'center'}}>
        <div style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 92, color: CREMA, opacity: a, transform: `translateY(${(1 - a) * 30}px)`, textShadow: '0 6px 24px rgba(0,0,0,0.5)'}}>Hoy fuimos al</div>
        <div style={{marginTop: 14, fontFamily: F.sans, fontWeight: 900, fontSize: 124, lineHeight: 1, color: CREMA, letterSpacing: 6, opacity: b, transform: `translateY(${(1 - b) * 40}px)`, textShadow: '0 6px 24px rgba(0,0,0,0.5)'}}>MUSEO</div>
        <div style={{marginTop: 10, opacity: c, transform: `scale(${0.85 + 0.15 * c})`, filter: `blur(${(1 - c) * 8}px) drop-shadow(0 6px 22px rgba(0,0,0,0.55))`}}>
          <span style={{fontFamily: F.sans, fontWeight: 900, fontSize: 104, lineHeight: 1.05, letterSpacing: 1, backgroundImage: `linear-gradient(105deg, rgba(255,255,255,0) ${(brillo - 0.08) * 100}%, rgba(255,255,255,0.95) ${brillo * 100}%, rgba(255,255,255,0) ${(brillo + 0.08) * 100}%), linear-gradient(180deg, #FFF1C2 0%, ${ORO} 55%, ${ORO_OSC} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', display: 'inline-block'}}>
            BANCO DE
            <br />
            MÉXICO
          </span>
        </div>
      </div>
      <Sfx at={2} name="whoosh" volume={0.35} />
      <Sfx at={50} name="pop" volume={0.45} />
    </AbsoluteFill>
  );
};

const LLUVIA_CIERRE = lluvia(30, 7, 26, 80);
const Cierre: React.FC = () => {
  const f = useCurrentFrame();
  const a = tw(f, [8, 26], [0, 1]);
  const b = tw(f, [22, 40], [0, 1]);
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, #17406F 0%, ${NAVY} 70%)`}}>
      <AbsoluteFill style={{opacity: 0.55}}>
        <Monedas lista={LLUVIA_CIERRE} p={interpolate(f, [0, 110], [0.1, 0.95], clamp)} f={f} alto={1.2} />
      </AbsoluteFill>
      <div style={{position: 'absolute', top: 700, width: '100%', textAlign: 'center'}}>
        <Img src={staticFile('logos/logo_westhill_blanco_total.png')} style={{width: 520, opacity: a, transform: `translateY(${(1 - a) * 24}px)`}} />
        <div style={{width: 360 * b, height: 4, background: ORO, margin: '40px auto', borderRadius: 2}} />
        <div style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 70, color: ORO, opacity: b, transform: `translateY(${(1 - b) * 24}px)`}}>Coordinación de</div>
        <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 116, color: CREMA, letterSpacing: 3, opacity: b, transform: `translateY(${(1 - b) * 34}px)`}}>INCLUSIÓN</div>
      </div>
      <Sfx at={8} name="ding" volume={0.3} />
    </AbsoluteFill>
  );
};

// montaje: [clip, segundo de entrada, duración en cuadros], en el orden del recorrido
const TOMAS: [number, number, number][] = [
  // la historia del dinero (120)
  [5, 5.0, COMPAS],
  [0, 5.0, COMPAS],
  // la bóveda principal (180)
  [10, 0.3, COMPAS],
  [10, 3.0, COMPAS / 2],
  [11, 5.2, COMPAS / 2],
  [11, 9.0, COMPAS],
  // las primeras monedas (120)
  [7, 0.0, COMPAS],
  [8, 0.5, COMPAS],
  // los billetes (180)
  [7, 3.2, COMPAS],
  [7, 6.6, COMPAS / 2],
  [9, 2.0, COMPAS],
  [9, 5.3, COMPAS / 2],
  // el oro (120)
  [3, 5.0, COMPAS],
  [3, 8.0, COMPAS / 2],
  [4, 0.3, COMPAS / 2],
  // juntos (180)
  [6, 1.0, COMPAS],
  [12, 5.0, COMPAS],
  [14, 4.0, COMPAS],
];
const INTRO = 2 * COMPAS;
const MONTAJE = TOMAS.reduce((a, t) => a + t[2], 0);
const CIERRE = 90;
export const BANXICO_FRAMES = INTRO + MONTAJE + CIERRE;
// textos por bloque: [inicio en el montaje, duración, líneas]
const TEXTOS: [number, number, {at: number; partes: Parte[]}[]][] = [
  [0, 120, [{at: 12, partes: [['Descubrimos la historia del '], ['dinero', true]]}]],
  [120, 180, [{at: 14, partes: [['y entramos hasta su '], ['bóveda principal', true]]}]],
  [300, 120, [{at: 12, partes: [['Vimos algunas de las '], ['primeras monedas', true], [' del mundo']]}]],
  [420, 180, [{at: 14, partes: [['y cómo han cambiado los '], ['billetes', true], [' con los años']]}]],
  [600, 120, [{at: 12, partes: [['Nos llevamos más de un dato del '], ['oro', true]]}]],
  [720, MONTAJE - 720, [{at: 12, partes: [['Aprender también es salir del salón y descubrir '], ['juntos', true]]}]],
];
// cortinas de monedas: al salir de la intro, al entrar a la bóveda, al oro y antes del cierre
const CORTES_CORTINA = [INTRO, INTRO + 120, INTRO + 600, INTRO + MONTAJE];

export const MuseoBanxico: React.FC<{music?: boolean}> = ({music = true}) => {
  let t = INTRO;
  return (
    <AbsoluteFill style={{background: NAVY}}>
      <Sequence durationInFrames={INTRO + CORTINA / 2}>
        <Intro />
      </Sequence>
      {TOMAS.map(([n, desde, dur], i) => {
        const from = t;
        t += dur;
        const funde = CORTES_CORTINA.includes(from) ? 0 : FUNDE;
        return (
          <Sequence key={i} from={from - funde} durationInFrames={dur + funde}>
            <Clip n={n} desde={desde} dur={dur + funde} funde={funde} />
          </Sequence>
        );
      })}
      {TEXTOS.map(([at, dur, lineas]) => (
        <Sequence key={at} from={INTRO + at} durationInFrames={dur}>
          <Texto lineas={lineas} dur={dur} />
        </Sequence>
      ))}
      <Sequence from={INTRO + MONTAJE}>
        <Cierre />
      </Sequence>
      {CORTES_CORTINA.map((c) => (
        <Sequence key={c} from={c - CORTINA / 2} durationInFrames={CORTINA}>
          <Cortina />
          <Sfx at={0} name="whoosh" volume={0.3} />
          <Sfx at={CORTINA / 2 - 2} name="ref_shutter_clicks" volume={0.12} />
        </Sequence>
      ))}
      <Banderin />
      <Grain opacity={0.04} />
      {music && <Audio src={staticFile('music/banxico.wav')} volume={(fr) => interpolate(fr, [0, 6, BANXICO_FRAMES - 30, BANXICO_FRAMES], [0, 0.55, 0.55, 0], clamp)} />}
    </AbsoluteFill>
  );
};
