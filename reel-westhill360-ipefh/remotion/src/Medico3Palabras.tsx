import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain, ScriptWord} from './components';
import {Sfx} from './shots';
import {C, F, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Historia "Día del Médico · describe tu carrera en 3 palabras".
//  1. Intro de cine: pantalla negra con la voz del doctor y sus frases; después entra su toma
//     completa con look de cine y termina con un latido de monitor.
//  2. Motion graphics "Describe tu carrera en 3 palabras" (gráficos propios, sin capas del banner).
//  3. Respuestas: cada palabra aparece como estampa justo cuando la dicen. En dos respuestas la
//     toma va como tarjeta sobre tomas del lugar (clip del director, sin su audio).
//  4. El que no pudo con 3 palabras.
//  5. Cierre en motion graphics con el logo de la universidad.
// Clips en public/proxies/medico (vN_limpio.mp4 = audio limpio con scripts/limpiar_voz.py).
// Tiempos de palabras medidos sobre el audio (Whisper + búsqueda del inicio de cada palabra).
// ---------------------------------------------------------------------------
const sec = (s: number) => Math.round(s * 30);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const vid = (n: string) => staticFile(`proxies/medico/${n}_limpio.mp4`);
const AZUL_T = '#0E4C8E';
const CLARO = '#E3EDF7'; // fondo de los motion graphics: azul muy suave
const ORO = '#E8A900'; // amarillo más profundo para que se lea sobre el fondo claro

const Clip: React.FC<{n: string; from: number; dur: number; vol?: number; style?: React.CSSProperties}> = ({n, from, dur, vol = 1, style}) => (
  <OffthreadVideo
    src={vid(n)}
    startFrom={sec(from)}
    muted={vol === 0}
    volume={(fr) => vol * interpolate(fr, [0, 3, dur - 4, dur], [0, 1, 1, 0], clamp)}
    style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, objectFit: 'cover', ...style}}
  />
);

// ---------------------------------------------------------------------------
// Fondo de motion graphics: marino con brillo azul, anillos de pulso, cruces que flotan y rejilla de puntos
// ---------------------------------------------------------------------------
const CRUCES = [
  [130, 300, 46, 0.5, C.azulClaro],
  [920, 260, 34, 0.8, C.amarillo],
  [860, 1540, 52, 0.4, '#1FB37A'],
  [170, 1460, 30, 0.9, C.amarillo],
  [980, 980, 26, 0.6, C.azulClaro],
  [80, 880, 24, 0.7, '#1FB37A'],
] as const;
const FondoMG: React.FC<{pulsoEn?: number[]}> = ({pulsoEn = []}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: CLARO, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 60%)'}} />
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(rgba(39,99,154,0.16) 2px, transparent 2.5px)',
          backgroundSize: '46px 46px',
          backgroundPosition: `${(f * 0.6) % 46}px ${(f * 0.3) % 46}px`,
          maskImage: 'radial-gradient(ellipse at 50% 50%, #000 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, #000 20%, transparent 75%)',
        }}
      />
      {pulsoEn.map((at) => {
        const p = tw(f, [at, at + 40], [0, 1]);
        return p > 0 && p < 1 ? (
          <div key={at} style={{position: 'absolute', left: 540 - 600 * p, top: 960 - 600 * p, width: 1200 * p, height: 1200 * p, borderRadius: '50%', border: `${6 * (1 - p) + 1}px solid ${C.azulClaro}`, opacity: (1 - p) * 0.7}} />
        ) : null;
      })}
      {CRUCES.map(([x, y, s, v, col], i) => {
        const d = Math.sin(f / (30 + i * 7) + i) * 22;
        const r = (f * v) % 360;
        return (
          <svg key={i} width={s} height={s} viewBox="-10 -10 20 20" style={{position: 'absolute', left: x - s / 2, top: y - s / 2 + d, transform: `rotate(${r}deg)`, opacity: 0.55}}>
            <path d="M-3 -9 H3 V-3 H9 V3 H3 V9 H-3 V3 H-9 V-3 H-3 Z" fill={col} />
          </svg>
        );
      })}
    </AbsoluteFill>
  );
};

/** Electrocardiograma que se dibuja de izquierda a derecha */
const Electro: React.FC<{y: number; from: number; dur: number; out?: number; color?: string}> = ({y, from, dur, out, color = C.amarillo}) => {
  const f = useCurrentFrame();
  const p = tw(f, [from, from + dur], [0, 1], ease.inOut);
  const o = out !== undefined ? tw(f, [out, out + 8], [1, 0]) : 1;
  return (
    <svg width={1080} height={240} style={{position: 'absolute', left: 0, top: y - 120, opacity: o}}>
      <path
        d="M0 120 L380 120 L420 120 L450 40 L490 210 L520 80 L545 120 L1080 120"
        fill="none"
        stroke={color}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - p}
        style={{filter: `drop-shadow(0 0 12px ${color})`}}
      />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// 1. Intro de cine
// ---------------------------------------------------------------------------
type Linea = {text: string; at: number; big?: boolean; amarillo?: boolean};
type Tarjeta = {from: number; to: number; lineas: Linea[]};
const VOZ_AT = 36; // cuadros de negro antes de la voz
const TOMA_AT = 8.0; // segundo de la voz en que entra su toma completa ("Por otro lado")
const FIN_VOZ = 16.1;
const INTRO_TARJETAS: Tarjeta[] = [
  {from: 0.4, to: 3.3, lineas: [{text: 'Una de las cosas', at: 0.5}, {text: 'más hermosas', at: 1.35, big: true}]},
  {from: 3.4, to: 7.8, lineas: [{text: 'Por un lado', at: 3.5}, {text: 'poder ayudar', at: 5.8, big: true}, {text: 'a la gente con problemas', at: 6.9}]},
  {from: 8.3, to: 11.5, lineas: [{text: 'Por otro lado', at: 8.3}, {text: 'que no tenga problemas de salud', at: 10.2, big: true}]},
  {from: 11.6, to: 13.95, lineas: [{text: 'A través de la', at: 11.7}, {text: 'prevención', at: 12.0, big: true}, {text: 'y la promoción', at: 12.85, big: true}]},
  {from: 14.05, to: 17.2, lineas: [{text: 'Nada como', at: 14.1}, {text: 'la carrera de medicina', at: 14.7, big: true, amarillo: true}]},
];
export const INTRO_FRAMES = VOZ_AT + sec(FIN_VOZ) + 40;

const TarjetaCine: React.FC<{t: Tarjeta; abajo: boolean; off?: number; base?: number}> = ({t, abajo, off = VOZ_AT, base = 0}) => {
  const f = useCurrentFrame();
  const b = off + sec(t.to - base);
  const out = tw(f, [b - 8, b], [1, 0]);
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: abajo ? 1330 : 760, textAlign: 'center', opacity: out}}>
      {t.lineas.map((l, i) => {
        const s = off + sec(l.at - base);
        const antes = t.lineas[i - 1];
        // aire entre renglones: más espacio cuando una línea chica va después de una grande
        const sep = !antes ? 0 : antes.big && !l.big ? 26 : 12;
        const p = tw(f, [s, s + 14], [0, 1]);
        return (
          <div
            key={l.text}
            style={{
              fontFamily: l.big ? F.serif : F.sans,
              fontStyle: l.big ? 'italic' : 'normal',
              fontWeight: l.big ? 600 : 500,
              fontSize: l.big ? 84 : 40,
              letterSpacing: l.big ? 0 : 8,
              textTransform: l.big ? 'none' : 'uppercase',
              lineHeight: 1.25,
              color: l.amarillo ? C.amarillo : '#F4F1EA',
              textShadow: abajo ? '0 4px 24px rgba(0,0,0,0.9)' : l.amarillo ? '0 0 26px rgba(242,194,48,0.55)' : '0 0 18px rgba(255,255,255,0.18)',
              opacity: p,
              filter: `blur(${(1 - p) * 10}px)`,
              transform: `translateY(${(1 - p) * 18}px)`,
              marginTop: sep,
            }}
          >
            {l.text}
          </div>
        );
      })}
    </div>
  );
};

const IntroCine: React.FC = () => {
  const f = useCurrentFrame();
  const toma = VOZ_AT + sec(TOMA_AT);
  const fin = VOZ_AT + sec(FIN_VOZ);
  // la toma completa entra desde negro, con un destello suave de luz, y se va a negro con el latido final
  const vis = interpolate(f, [toma, toma + 30, fin + 6, INTRO_FRAMES - 8], [0, 1, 1, 0], clamp);
  const luz = interpolate(f, [toma + 10, toma + 26, toma + 60], [0, 0.35, 0], clamp);
  const push = 1.0 + 0.07 * tw(f, [toma, INTRO_FRAMES], [0, 1], ease.inOut);
  const barras = tw(f, [toma, toma + 30], [0, 1], ease.inOut);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{opacity: vis}}>
        <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '540px 640px', filter: 'contrast(1.1) saturate(0.8) brightness(0.9) sepia(0.1)'}}>
          <Sequence from={VOZ_AT} layout="none">
            <Clip n="v1" from={0} dur={INTRO_FRAMES - VOZ_AT} vol={1} />
          </Sequence>
        </AbsoluteFill>
        {/* viñeta, degradado para el texto y luz cálida */}
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 38%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.7) 100%)'}} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 85%)'}} />
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 85% 15%, rgba(255,190,110,1) 0%, rgba(255,190,110,0) 55%)', opacity: luz, mixBlendMode: 'screen'}} />
      </AbsoluteFill>
      {/* barras de cine */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 150 * barras, background: '#000'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 150 * barras, background: '#000'}} />
      {INTRO_TARJETAS.map((t, i) => (
        <TarjetaCine key={i} t={t} abajo={t.from >= TOMA_AT} />
      ))}
      <Electro y={1700} from={VOZ_AT + sec(15.2)} dur={sec(1.1)} out={INTRO_FRAMES - 14} color={C.amarillo} />
      <Grain opacity={0.09} />
      <Sfx at={8} name="latido" volume={0.6} />
      <Sfx at={toma} name="whoosh_largo" volume={0.25} />
      <Sfx at={VOZ_AT + sec(15.7)} name="beep_monitor" volume={0.5} />
      <Sfx at={INTRO_FRAMES - 16} name="latido" volume={0.7} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 2. Motion graphics: "Describe tu carrera en 3 palabras"
// ---------------------------------------------------------------------------
export const TITULO_FRAMES = 126;
const Letras: React.FC<{text: string; at: number; style: React.CSSProperties; stagger?: number}> = ({text, at, style, stagger = 2}) => {
  const f = useCurrentFrame();
  return (
    <div style={{display: 'flex', justifyContent: 'center', ...style}}>
      {text.split('').map((ch, i) => {
        const p = tw(f, [at + i * stagger, at + i * stagger + 12], [0, 1], ease.back);
        return (
          <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * -90}px) scale(${0.6 + 0.4 * p})`, filter: `blur(${(1 - Math.min(1, p)) * 8}px)`}}>
            {ch}
          </span>
        );
      })}
    </div>
  );
};
const Titulo: React.FC = () => {
  const f = useCurrentFrame();
  const tres = tw(f, [46, 62], [0, 1], ease.back);
  const relleno = tw(f, [58, 74], [0, 100], ease.inOut);
  const palabras = tw(f, [66, 80], [0, 1]);
  const salida = tw(f, [TITULO_FRAMES - 16, TITULO_FRAMES], [0, 1], ease.in);
  return (
    <AbsoluteFill>
      <FondoMG pulsoEn={[14, 62]} />
      <AbsoluteFill style={{transform: `scale(${1 + salida * 3.5})`, opacity: 1 - salida, filter: `blur(${salida * 14}px)`, transformOrigin: '540px 1080px'}}>
        <Electro y={960} from={0} dur={16} out={16} color={C.azul} />
        <Letras text="DESCRIBE" at={16} style={{position: 'absolute', top: 380, width: '100%', fontFamily: F.display, fontSize: 200, color: C.marino, letterSpacing: 6, lineHeight: 1}} />
        <div style={{position: 'absolute', top: 610, width: '100%', textAlign: 'center', clipPath: `inset(0 ${100 - tw(f, [30, 46], [0, 100], ease.inOut)}% 0 0)`}}>
          <span style={{fontFamily: F.sans, fontWeight: 900, fontSize: 84, color: C.azul, letterSpacing: 14}}>TU CARRERA EN</span>
        </div>
        {/* el 3 gigante: contorno que se rellena */}
        <div style={{position: 'absolute', top: 700, width: '100%', textAlign: 'center', transform: `scale(${tres}) rotate(${(1 - tres) * -25}deg)`}}>
          <span
            style={{
              fontFamily: F.display,
              fontSize: 620,
              lineHeight: 1,
              color: 'transparent',
              WebkitTextStroke: `8px ${C.marino}`,
              backgroundImage: `linear-gradient(0deg, ${C.amarillo} ${relleno}%, transparent ${relleno}%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              filter: `drop-shadow(0 16px 30px rgba(20,35,60,${0.25 * tres}))`,
            }}
          >
            3
          </span>
        </div>
        <div style={{position: 'absolute', top: 1360, width: '100%', display: 'flex', justifyContent: 'center'}}>
          <div style={{background: C.marino, padding: '6px 40px 0', transform: `rotate(-3deg) scaleX(${palabras})`, fontFamily: F.display, fontSize: 150, lineHeight: 1.05, color: '#fff', letterSpacing: 4}}>PALABRAS</div>
        </div>
        {/* 1 · 2 · 3 */}
        <div style={{position: 'absolute', top: 1600, width: '100%', display: 'flex', justifyContent: 'center', gap: 36}}>
          {[1, 2, 3].map((n, i) => {
            const p = tw(f, [80 + i * 7, 92 + i * 7], [0, 1], ease.back);
            return (
              <div key={n} style={{width: 92, height: 92, borderRadius: 46, border: `5px solid ${C.marino}`, color: C.marino, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.sans, fontWeight: 900, fontSize: 46, transform: `scale(${p})`, background: i === 2 ? C.amarillo : 'transparent'}}>
                <span style={{color: C.marino}}>{n}</span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <Sfx at={2} name="beep_monitor" volume={0.4} />
      <Sfx at={16} name="whoosh" volume={0.4} />
      <Sfx at={30} name="swipe" volume={0.35} />
      <Sfx at={46} name="impact" volume={0.5} />
      <Sfx at={66} name="whoosh" volume={0.3} />
      {[80, 87, 94].map((s) => (
        <Sfx key={s} at={s} name="pop" volume={0.45} />
      ))}
      <Sfx at={TITULO_FRAMES - 16} name="whoosh_largo" volume={0.4} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 3. Respuestas
// ---------------------------------------------------------------------------
type Palabra = {text: string; t: number; script?: boolean};
type Respuesta = {n: string; from: number; to: number; palabras: Palabra[]; reemplaza?: boolean; broll?: number; extra?: (dur: number) => React.ReactNode};

/** Estampa de papel rasgado con la palabra */
const Estampa: React.FC<{text: string; at: number; i: number; total: number; reemplaza?: boolean; hasta?: number}> = ({text, at, i, total, reemplaza, hasta}) => {
  const f = useCurrentFrame();
  const p = tw(f, [at, at + 12], [0, 1], ease.back);
  const out = hasta !== undefined ? tw(f, [hasta, hasta + 8], [1, 0]) : 1;
  const blanco = i % 2 === 1;
  const fs = Math.min(84, Math.floor(1150 / Math.max(6, text.length)));
  const tilt = [-3, 2.5, -1.5, 2][i % 4];
  const y = reemplaza ? 1240 : 1500 - (total - 1 - i) * 150;
  return (
    <div style={{position: 'absolute', top: y, width: '100%', display: 'flex', justifyContent: 'center', opacity: Math.min(1, p * 2) * out}}>
      <div style={{position: 'relative', padding: `${fs * 0.26}px ${fs * 0.55}px ${fs * 0.32}px`, transform: `rotate(${tilt}deg) scale(${0.45 + 0.55 * p})`, filter: 'drop-shadow(0 10px 16px rgba(0,0,0,0.35))'}}>
        <Img src={staticFile('photos/medico/cinta_strip.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', filter: blanco ? 'grayscale(1) brightness(3.4)' : 'none'}} />
        <span style={{position: 'relative', fontFamily: F.sans, fontWeight: 900, fontSize: fs, letterSpacing: -1, color: blanco ? AZUL_T : '#fff', whiteSpace: 'nowrap'}}>{text}</span>
      </div>
    </div>
  );
};

/** Pregunta fija arriba, como sticker de pregunta de historia */
const Pregunta: React.FC = () => (
  <div style={{position: 'absolute', top: 210, width: '100%', display: 'flex', justifyContent: 'center'}}>
    <div style={{background: '#fff', borderRadius: 26, padding: '16px 30px', boxShadow: '0 12px 30px rgba(0,0,0,0.25)', fontFamily: F.sans, fontWeight: 800, fontSize: 34, color: AZUL_T, display: 'flex', alignItems: 'center', gap: 12}}>
      Describe tu carrera en
      <span style={{display: 'inline-flex', width: 50, height: 50, borderRadius: 25, background: C.amarillo, justifyContent: 'center', alignItems: 'center', fontWeight: 900}}>3</span>
      palabras
    </div>
  </div>
);

const RespuestaShot: React.FC<{r: Respuesta}> = ({r}) => {
  const f = useCurrentFrame();
  const dur = sec(r.to - r.from);
  const punch = 1.08 - 0.08 * tw(f, [0, 8], [0, 1]);
  const estampas = r.palabras.filter((p) => !p.script);
  const card = tw(f, [0, 14], [0, 1], ease.back);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {r.broll !== undefined ? (
        <>
          {/* tomas del lugar de fondo y la respuesta como tarjeta */}
          <AbsoluteFill style={{transform: `scale(${1.12 + 0.05 * (f / dur)})`, filter: 'blur(3px) brightness(0.55) saturate(0.9)'}}>
            <Clip n="v2" from={r.broll} dur={dur} vol={0} />
          </AbsoluteFill>
          <div
            style={{
              position: 'absolute',
              left: 150,
              top: 330,
              width: 780,
              height: 1387,
              borderRadius: 38,
              overflow: 'hidden',
              border: '9px solid #fff',
              boxShadow: '0 30px 70px rgba(0,0,0,0.55)',
              transform: `rotate(${-2 + (1 - card) * 6}deg) scale(${0.85 + 0.15 * card})`,
              opacity: Math.min(1, card * 2),
            }}
          >
            <Clip n={r.n} from={r.from} dur={dur} style={{width: '100%', height: '100%'}} />
          </div>
        </>
      ) : (
        <AbsoluteFill style={{transform: `scale(${punch + 0.03 * (f / dur)})`}}>
          <Clip n={r.n} from={r.from} dur={dur} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.5) 100%)'}} />
      {estampas.map((p, i) => {
        const sig = r.palabras[r.palabras.indexOf(p) + 1];
        const hasta = r.reemplaza && sig ? sec(sig.t - r.from) - 2 : undefined;
        return <Estampa key={i} text={p.text} at={sec(p.t - r.from)} i={i} total={r.reemplaza ? 1 : estampas.length} reemplaza={r.reemplaza} hasta={hasta} />;
      })}
      {r.palabras
        .filter((p) => p.script)
        .map((p) => (
          <div key={p.text} style={{position: 'absolute', top: r.reemplaza ? 1220 : 1500 - estampas.length * 150 - 40, left: 60, right: 60, textAlign: 'center'}}>
            <ScriptWord text={p.text} start={sec(p.t - r.from)} size={Math.min(130, Math.floor(2300 / p.text.length))} neon tilt={-5} dur={16} />
          </div>
        ))}
      {r.extra?.(dur)}
      {estampas.map((p, i) => (
        <Sfx key={i} at={sec(p.t - r.from)} name="pop" volume={0.45} />
      ))}
      <Sfx at={0} name="swipe" volume={0.35} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 5. Cierre en motion graphics con el logo
// ---------------------------------------------------------------------------
export const CIERRE_FRAMES = 190;
const Corazon: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  const p = tw(f, [at, at + 30], [0, 1], ease.inOut);
  const lat = f > at + 30 ? 1 + 0.06 * Math.max(0, Math.sin(((f - at - 30) / 30) * Math.PI * 2)) ** 8 : 1;
  return (
    <svg width={300} height={280} viewBox="-150 -130 300 280" style={{position: 'absolute', left: 390, top: 300, transform: `scale(${lat})`, overflow: 'visible'}}>
      <path
        d="M0 110 C-70 60 -140 10 -140 -50 C-140 -100 -100 -125 -65 -125 C-30 -125 -8 -100 0 -80 C8 -100 30 -125 65 -125 C100 -125 140 -100 140 -50 C140 10 70 60 0 110 Z"
        fill="none"
        stroke={ORO}
        strokeWidth={10}
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - p}
        style={{filter: 'drop-shadow(0 8px 14px rgba(232,169,0,0.35))'}}
      />
      <path d="M-100 -10 L-40 -10 L-20 -50 L5 40 L25 -10 L100 -10" fill="none" stroke={C.azul} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - tw(f, [at + 20, at + 40], [0, 1])} />
    </svg>
  );
};
const Cierre: React.FC = () => {
  const f = useCurrentFrame();
  const dia = tw(f, [30, 44], [0, 1], ease.back);
  const gracias = tw(f, [56, 70], [0, 1]);
  const logo = tw(f, [84, 104], [0, 1]);
  const hash = tw(f, [104, 116], [0, 1]);
  // entra desde negro (viene de la reflexión) y se desvanece a negro al final
  const negro = interpolate(f, [0, 16, CIERRE_FRAMES - 40, CIERRE_FRAMES - 4], [1, 0, 0, 1], clamp);
  return (
    <AbsoluteFill>
      <FondoMG pulsoEn={[50, 110]} />
      <Corazon at={4} />
      <div style={{position: 'absolute', top: 560, width: '100%', textAlign: 'center'}}>
        <ScriptWord text="Feliz" start={22} size={130} color={ORO} tilt={-6} dur={14} />
      </div>
      <div style={{position: 'absolute', top: 760, width: '100%', textAlign: 'center', fontFamily: F.display, fontSize: 150, lineHeight: 1, color: C.marino, letterSpacing: 4, transform: `scale(${dia})`, opacity: Math.min(1, dia * 2)}}>
        DÍA DEL MÉDICO
      </div>
      <div style={{position: 'absolute', top: 950, left: 120, right: 120, textAlign: 'center', fontFamily: F.sans, fontWeight: 700, fontSize: 44, lineHeight: 1.35, color: AZUL_T, opacity: gracias, transform: `translateY(${(1 - gracias) * 20}px)`}}>
        Gracias a quienes dedican su vida a cuidar la nuestra.
      </div>
      <div style={{position: 'absolute', left: 250, top: 1180, width: 580, clipPath: `inset(0 0 ${(1 - logo) * 100}% 0)`, transform: `translateY(${(1 - logo) * 30}px)`}}>
        <Img src={staticFile('logos/logo_westhill_sin_blanco.png')} style={{width: '100%'}} />
      </div>
      <div style={{position: 'absolute', top: 1470, width: '100%', textAlign: 'center', fontFamily: F.sans, fontWeight: 800, fontSize: 34, letterSpacing: 8, color: C.azul, opacity: hash}}>
        #SOMOSWESTHILL
      </div>
      <AbsoluteFill style={{background: '#000', opacity: negro}} />
      <Sfx at={4} name="latido" volume={0.6} />
      <Sfx at={22} name="flicker" volume={0.4} />
      <Sfx at={30} name="impact" volume={0.45} />
      <Sfx at={84} name="whoosh" volume={0.35} />
      <Sfx at={104} name="ding" volume={0.4} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Línea de tiempo
// ---------------------------------------------------------------------------
const RESPUESTAS: Respuesta[] = [
  {n: 'v5', from: 4.0, to: 9.05, palabras: [{text: 'Apasionante', t: 5.15}, {text: 'Divertida', t: 6.3}, {text: 'Sumamente interesante', t: 7.6}]},
  {n: 'v7', from: 0.75, to: 5.65, palabras: [{text: 'Retadora', t: 2.0}, {text: 'Divertida', t: 3.3}, {text: 'Competitiva', t: 4.8}]},
  {n: 'v8', from: 1.0, to: 6.9, palabras: [{text: 'Inspiradora', t: 2.9}, {text: 'Retadora', t: 4.35}, {text: 'Muy divertida', t: 5.75}]},
  {n: 'v4', from: 6.0, to: 9.3, broll: 12.0, palabras: [{text: 'Divertida', t: 6.2}, {text: 'Demandante', t: 8.3}]},
  {n: 'v6', from: 0.0, to: 7.9, reemplaza: true, palabras: [{text: 'Interesante', t: 0.4}, {text: 'Cansancio', t: 2.31}, {text: 'Demandante', t: 4.15}, {text: 'La mejor decisión de mi vida', t: 5.75, script: true}]},
  {n: 'v9', from: 5.0, to: 13.4, broll: 13.3, palabras: [{text: 'Hermosa', t: 5.9}, {text: 'Muy cansada', t: 8.0}, {text: 'Bastante pesada', t: 10.2}, {text: 'pero sobre todo hermosa', t: 11.5, script: true}]},
];
/** Reflexión final: el chico que no pudo con 3 palabras, con look de cine y subtítulos elegantes */
const REF = {from: 5.0, to: 18.7};
const REF_TARJETAS: Tarjeta[] = [
  {from: 5.0, to: 6.7, lineas: [{text: 'Si usara tres palabras…', at: 5.1}]},
  {from: 6.75, to: 13.5, lineas: [{text: 'muy cansada', at: 6.8, big: true}, {text: 'muy divertida', at: 8.6, big: true}, {text: 'llena de experiencias', at: 10.6, big: true}]},
  {from: 13.6, to: 16.7, lineas: [{text: 'pero a mí mi carrera', at: 14.9}, {text: 'me ha encantado', at: 15.7, big: true}]},
  {from: 16.8, to: 18.8, lineas: [{text: 'y me ha llenado', at: 16.85}, {text: 'de mucha vida', at: 17.5, big: true, amarillo: true}]},
];
export const REF_FRAMES = sec(REF.to - REF.from);
const Reflexion: React.FC = () => {
  const f = useCurrentFrame();
  const push = 1.02 + 0.06 * tw(f, [0, REF_FRAMES], [0, 1], ease.inOut);
  const vis = interpolate(f, [0, 14, REF_FRAMES - 22, REF_FRAMES], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{opacity: vis}}>
        <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '540px 700px', filter: 'contrast(1.08) saturate(0.85) brightness(0.92) sepia(0.08)'}}>
          <Clip n="v3" from={REF.from} dur={REF_FRAMES} />
        </AbsoluteFill>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 38%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.6) 100%)'}} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 52%, rgba(0,0,0,0.78) 85%)'}} />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 150, background: '#000'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 150, background: '#000'}} />
      {REF_TARJETAS.map((t, i) => (
        <TarjetaCine key={i} t={t} abajo off={0} base={REF.from} />
      ))}
      <Grain opacity={0.07} />
    </AbsoluteFill>
  );
};

type Bloque = {dur: number; el: React.ReactNode; musica: number};
const respDur = (r: Respuesta) => sec(r.to - r.from);
const BLOQUES: Bloque[] = [
  {dur: INTRO_FRAMES, el: <IntroCine />, musica: 0},
  {dur: TITULO_FRAMES, el: <Titulo />, musica: 0.45},
  ...RESPUESTAS.map((r) => ({dur: respDur(r), el: <RespuestaShot r={r} />, musica: 0.1})),
  {dur: REF_FRAMES, el: <Reflexion />, musica: 0.16},
  {dur: CIERRE_FRAMES, el: <Cierre />, musica: 0.5},
];
const STARTS = BLOQUES.reduce<number[]>((a, b, i) => [...a, i === 0 ? 0 : a[i - 1] + BLOQUES[i - 1].dur], []);
export const M3P_FRAMES = STARTS[STARTS.length - 1] + BLOQUES[BLOQUES.length - 1].dur;
/** La música entra con los motion graphics, después de la intro de cine */
export const MUSICA_DESDE = INTRO_FRAMES;
export const CIERRE_DESDE = STARTS[STARTS.length - 1];

export const Medico3Palabras: React.FC<{music?: boolean}> = ({music = true}) => {
  const vol = (fr: number) => {
    const g = fr + MUSICA_DESDE;
    const i = STARTS.findIndex((s, k) => g >= s && g < s + BLOQUES[k].dur);
    const v = i >= 0 ? BLOQUES[i].musica : 0;
    const prev = i > 0 ? BLOQUES[i - 1].musica : v;
    const fade = interpolate(g, [STARTS[i] ?? 0, (STARTS[i] ?? 0) + 12], [prev, v], clamp);
    return fade * interpolate(g, [M3P_FRAMES - 45, M3P_FRAMES], [1, 0], clamp);
  };
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {BLOQUES.map((b, i) => (
        <Sequence key={i} from={STARTS[i]} durationInFrames={b.dur}>
          {b.el}
        </Sequence>
      ))}
      <Sequence from={STARTS[2]} durationInFrames={STARTS[2 + RESPUESTAS.length] - STARTS[2]}>
        <Pregunta />
      </Sequence>
      {music && (
        <Sequence from={MUSICA_DESDE}>
          <Audio src={staticFile('music/medico_3palabras.mp3')} volume={vol} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
