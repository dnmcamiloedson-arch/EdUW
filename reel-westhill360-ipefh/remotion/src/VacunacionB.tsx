import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from './components';
import {Sfx} from './shots';
import {F, ease, tw} from './theme';
import {AMARILLO, AZUL, capa, CREMA, ESCALA_HISTORIA, FondoDifuso, NAVY, Pieza, Poster, POSTER_F, Recorte, VAC_H, VAC_W} from './Vacunacion';

// ---------------------------------------------------------------------------
// Jornada de Vacunación, versión B (historia 9:16). Misma meta que la versión A (termina en el póster
// original), pero con otra narrativa:
//  1. Intro en azul: West pregunta "¿Ya te vacunaste?", tres razones en tarjetas y un calendario que
//     cae en el 5 de noviembre.
//  2. El póster se arma igual que en la versión A (Poster de Vacunacion.tsx). PosterB (cámara que se aleja
//     de West) se conserva como alternativa.
// Reutiliza las capas y posiciones de Vacunacion.tsx (coordenadas del póster de 1292x2000).
// ---------------------------------------------------------------------------
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const K = VAC_W / 1292;

// ---------------------------------------------------------------------------
// 1. Intro
// ---------------------------------------------------------------------------
export const INTRO_B = 300;
const FondoAzul: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: AZUL, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 40% 35%, rgba(61,139,212,0.9) 0%, rgba(21,101,181,0) 65%)'}} />
      <Img src={capa('semitono')} style={{position: 'absolute', right: -60, top: -40 + Math.sin(f / 40) * 20, width: 760, opacity: 0.35, filter: 'brightness(1.6)'}} />
      <Img src={capa('semitono')} style={{position: 'absolute', left: -120, bottom: -80, width: 700, opacity: 0.25, filter: 'brightness(1.6)', transform: 'rotate(180deg)'}} />
    </AbsoluteFill>
  );
};
/** Escena 1: West entra y pregunta */
const Pregunta: React.FC = () => {
  const f = useCurrentFrame();
  const ya = tw(f, [8, 20], [0, 1], ease.back);
  const vac = tw(f, [20, 34], [0, 1], ease.back);
  const q = tw(f, [32, 46], [0, 1], ease.back);
  const sale = tw(f, [70, 84], [0, 1], ease.in);
  return (
    <AbsoluteFill style={{opacity: 1 - sale, transform: `scale(${1 + sale * 0.15})`}}>
      <div style={{position: 'absolute', top: 560, width: '100%', textAlign: 'center'}}>
        <div style={{position: 'relative', display: 'inline-block', transform: `scale(${ya}) rotate(-3deg)`}}>
          <Img src={capa('parche')} style={{position: 'absolute', left: -50, top: -30, width: 640, height: 220}} />
          <span style={{position: 'relative', fontFamily: F.sans, fontWeight: 900, fontSize: 140, color: NAVY, letterSpacing: -3}}>¿Ya te</span>
        </div>
        <div style={{marginTop: 10, fontFamily: F.sans, fontWeight: 900, fontSize: 168, lineHeight: 1, color: '#fff', letterSpacing: -5, transform: `translateY(${(1 - vac) * 160}px) scale(${0.7 + 0.3 * vac})`, opacity: Math.min(1, vac * 2), textShadow: '0 10px 0 rgba(4,57,113,0.35)'}}>vacunaste</div>
        <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 300, lineHeight: 0.9, color: AMARILLO, transform: `scale(${q}) rotate(${(1 - q) * 60 + Math.sin(f / 6) * 5}deg)`, textShadow: '0 10px 0 rgba(4,57,113,0.35)'}}>?</div>
      </div>
      <Sfx at={8} name="hist_paper" volume={0.6} />
      <Sfx at={20} name="whoosh" volume={0.4} />
      <Sfx at={32} name="pop" volume={0.6} />
    </AbsoluteFill>
  );
};
/** Escena 2: tres razones en tarjetas */
const RAZONES = ['Te proteges a ti', 'Cuidas a quienes te rodean', 'Reduces el riesgo de complicaciones'];
const Razones: React.FC = () => {
  const f = useCurrentFrame();
  const t1 = tw(f, [0, 12], [0, 1], ease.back);
  const sale = tw(f, [118, 130], [0, 1], ease.in);
  return (
    <AbsoluteFill style={{opacity: 1 - sale}}>
      <div style={{position: 'absolute', top: 300, width: '100%', textAlign: 'center', transform: `scale(${t1})`, fontFamily: F.sans, fontWeight: 900, color: '#fff', lineHeight: 1}}>
        <div style={{fontSize: 84}}>
          <span style={{color: AMARILLO, fontSize: 120}}>3</span> razones
        </div>
        <div style={{fontSize: 70, marginTop: 6}}>para vacunarte</div>
      </div>
      {RAZONES.map((r, i) => {
        const at = 22 + i * 26;
        const p = tw(f, [at, at + 14], [0, 1], ease.back);
        const ok = tw(f, [at + 10, at + 20], [0, 1], ease.inOut);
        return (
          <div key={r} style={{position: 'absolute', left: 90, right: 90, top: 590 + i * 230, height: 180, borderRadius: 34, background: '#fff', boxShadow: '0 18px 0 rgba(4,57,113,0.35)', display: 'flex', alignItems: 'center', gap: 34, padding: '0 40px', transform: `translateX(${(1 - p) * (i % 2 ? 1200 : -1200)}px) rotate(${(i % 2 ? 1.5 : -1.5) * p}deg)`}}>
            <div style={{flex: '0 0 110px', height: 110, borderRadius: 55, background: AMARILLO, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.sans, fontWeight: 900, fontSize: 70, color: NAVY}}>{i + 1}</div>
            <div style={{flex: 1, fontFamily: F.sans, fontWeight: 800, fontSize: r.length > 26 ? 50 : 58, lineHeight: 1.1, color: NAVY}}>{r}</div>
            <svg width={70} height={70} viewBox="-35 -35 70 70">
              <path d="M-20 0 L-6 14 L22 -16" fill="none" stroke="#1FB37A" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ok} />
            </svg>
          </div>
        );
      })}
      <Sfx at={0} name="impact" volume={0.45} />
      {[0, 1, 2].map((i) => (
        <React.Fragment key={i}>
          <Sfx at={22 + i * 26} name="swipe" volume={0.4} />
          <Sfx at={32 + i * 26} name="ding" volume={0.25} />
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};
/** Escena 3: el calendario cae en el 5 de noviembre */
const Calendario: React.FC = () => {
  const f = useCurrentFrame();
  const cae = tw(f, [0, 16], [0, 1], ease.back);
  const hojas = Math.min(4, Math.floor(Math.max(0, f - 14) / 5));
  const dia = [1, 2, 3, 4, 5][hojas];
  const golpe = f >= 34 ? tw(f, [34, 44], [1.15, 1], ease.out) : 1;
  const txt = tw(f, [40, 54], [0, 1]);
  const zoom = tw(f, [76, 90], [0, 1], ease.in);
  return (
    <AbsoluteFill style={{transform: `scale(${1 + zoom * 6})`, transformOrigin: '540px 820px', opacity: 1 - tw(f, [84, 90], [0, 1])}}>
      <div style={{position: 'absolute', left: 290, top: 470, width: 500, transform: `translateY(${(1 - cae) * -1200}px) rotate(${(1 - cae) * -14}deg) scale(${golpe})`}}>
        <div style={{borderRadius: 34, overflow: 'hidden', background: '#fff', boxShadow: '0 24px 0 rgba(4,57,113,0.35)'}}>
          <div style={{background: AMARILLO, padding: '18px 0', textAlign: 'center', fontFamily: F.sans, fontWeight: 900, fontSize: 64, color: NAVY, letterSpacing: 4}}>NOVIEMBRE</div>
          <div style={{textAlign: 'center', fontFamily: F.sans, fontWeight: 900, fontSize: 300, lineHeight: 1.05, color: NAVY}}>{dia}</div>
          <div style={{textAlign: 'center', fontFamily: F.sans, fontWeight: 800, fontSize: 50, color: AZUL, paddingBottom: 26}}>8:30 a. m.</div>
        </div>
      </div>
      <div style={{position: 'absolute', top: 1180, width: '100%', textAlign: 'center', opacity: txt, transform: `translateY(${(1 - txt) * 30}px)`}}>
        <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 62, color: '#fff'}}>Aparta la fecha,</div>
        <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 96, color: AMARILLO}}>te esperamos</div>
      </div>
      <Sfx at={2} name="whoosh" volume={0.45} />
      <Sfx at={16} name="hist_stamp" volume={0.6} />
      {[19, 24, 29].map((a) => (
        <Sfx key={a} at={a} name="click" volume={0.35} />
      ))}
      <Sfx at={34} name="impact" volume={0.6} />
      <Sfx at={76} name="whoosh_largo" volume={0.5} />
    </AbsoluteFill>
  );
};
const IntroB: React.FC = () => (
  <AbsoluteFill>
    <FondoAzul />
    <Sequence durationInFrames={86}>
      <Pregunta />
    </Sequence>
    <Sequence from={80} durationInFrames={132}>
      <Razones />
    </Sequence>
    <Sequence from={210} durationInFrames={92}>
      <Calendario />
    </Sequence>
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// 2. Revelación con la cámara que se aleja de West
// ---------------------------------------------------------------------------
export const POSTER_B = 330;
const CARA = {x: 985, y: 1085}; // cara de West en coordenadas del póster
const GOLPES = [30, 60, 90]; // la cámara se aleja en cada golpe
const ZOOMS = [3.0, 2.0, 1.4, 1.0];
const PosterB: React.FC = () => {
  const f = useCurrentFrame();
  // zoom escalonado: se queda quieto y salta en cada golpe
  let z = ZOOMS[0];
  GOLPES.forEach((g, i) => {
    const p = tw(f, [g, g + 10], [0, 1], ease.out);
    z = z * Math.pow(ZOOMS[i + 1] / ZOOMS[i], p);
  });
  const deriva = 1 + 0.03 * (1 - tw(f, [0, 30], [0, 1]));
  // la cámara pasa de la cara al centro del póster conforme se aleja
  const cx = interpolate(z, [1, ZOOMS[0]], [646, CARA.x], clamp);
  const cy = interpolate(z, [1, ZOOMS[0]], [1000, CARA.y], clamp);
  const sacude = GOLPES.reduce((a, g) => a + (f >= g && f < g + 8 ? (g + 8 - f) * 2.2 : 0), 0);
  const flash = GOLPES.reduce((a, g) => a + interpolate(f, [g - 1, g + 1, g + 8], [0, 0.45, 0], clamp), 0);
  // entrada de cada grupo de piezas con el golpe que les toca
  const ent = (g: number, d = 0) => tw(f, [g + d, g + d + 12], [0, 1], ease.back);
  const golpe = (g: number, d = 0): React.CSSProperties => {
    const p = ent(g, d);
    return {transform: `scale(${0.3 + 0.7 * p}) rotate(${(1 - p) * 18}deg)`, opacity: Math.min(1, p * 2), filter: `blur(${(1 - Math.min(1, p)) * 10}px)`};
  };
  const parpadeo = 1 + 0.04 * Math.sin(f / 5) * (1 - tw(f, [30, 40], [0, 1]));
  const final = tw(f, [250, 280], [0, 1], ease.inOut);
  return (
    <AbsoluteFill style={{background: CREMA, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: VAC_W, height: VAC_H, transform: `translate(${Math.sin(f * 3) * sacude}px, ${Math.cos(f * 4) * sacude}px)`}}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 1292,
            height: 2000,
            transformOrigin: '0 0',
            transform: `scale(${K}) translate(${646 - cx * z * deriva}px, ${1000 - cy * z * deriva}px) scale(${z * deriva})`,
          }}
        >
          {/* fondo y West, visibles desde el inicio */}
          <AbsoluteFill style={{background: CREMA}} />
          <Pieza n="lince" style={{transformOrigin: '57% 25%', transform: `scale(${parpadeo})`}} />
          {/* golpe 1: lo que rodea a West */}
          <Pieza n="ondas" style={golpe(GOLPES[0])} />
          <Pieza n="verde" style={golpe(GOLPES[0], 2)} />
          <Pieza n="linea_ola" style={golpe(GOLPES[0], 4)} />
          <Pieza n="parche" style={golpe(GOLPES[0], 2)} />
          <Pieza n="fecha" style={golpe(GOLPES[0], 4)} />
          <Pieza n="anio" style={golpe(GOLPES[0], 6)} />
          <Pieza n="hora" style={golpe(GOLPES[0], 6)} />
          <Recorte n="contra" style={golpe(GOLPES[0], 8)} />
          {/* golpe 2: datos y decoración de abajo */}
          <Pieza n="linea1" style={golpe(GOLPES[1])} />
          <Pieza n="lugar" style={golpe(GOLPES[1], 2)} />
          <Pieza n="linea2" style={golpe(GOLPES[1], 4)} />
          <Recorte n="tusalud" style={golpe(GOLPES[1], 4)} />
          <Pieza n="esquina_izq" style={golpe(GOLPES[1], 2)} />
          <Recorte n="redes" style={golpe(GOLPES[1], 6)} />
          {/* golpe 3: el título y lo de arriba */}
          <Pieza n="cinta" style={golpe(GOLPES[2])} />
          <Pieza n="vacunacion" style={golpe(GOLPES[2], 3)} />
          <Pieza n="jornada" style={golpe(GOLPES[2], 5)} />
          <Pieza n="cuidarte" style={golpe(GOLPES[2], 7)} />
          <Recorte n="logo" style={golpe(GOLPES[2], 9)} />
          <Pieza n="esquina_sup" style={golpe(GOLPES[2], 4)} />
          <Pieza n="semitono" style={golpe(GOLPES[2], 6)} />
          {/* al final queda idéntico al diseño original */}
          <AbsoluteFill style={{opacity: final}}>
            <Img src={capa('original')} style={{width: 1292, height: 2000}} />
          </AbsoluteFill>
        </div>
      </div>
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
      <Sfx at={0} name="riser" volume={0.4} />
      {GOLPES.map((g) => (
        <React.Fragment key={g}>
          <Sfx at={g} name="impact" volume={0.65} />
          <Sfx at={g} name="whoosh" volume={0.35} />
        </React.Fragment>
      ))}
      <Sfx at={110} name="ding" volume={0.4} />
    </AbsoluteFill>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const _PosterB = () => PosterB;
export const VACUNA_B_FRAMES = INTRO_B + POSTER_F;
export const VacunacionB: React.FC<{music?: boolean}> = ({music = true}) => {
  const s = ESCALA_HISTORIA;
  return (
    <AbsoluteFill style={{background: AZUL}}>
      <Sequence durationInFrames={INTRO_B + 6}>
        <IntroB />
      </Sequence>
      <Sequence from={INTRO_B}>
        <AbsoluteFill style={{background: CREMA}} />
        <FondoDifuso />
        <div style={{position: 'absolute', left: (VAC_W - VAC_W * s) / 2, top: (1920 - VAC_H * s) / 2, width: VAC_W, height: VAC_H, transformOrigin: '0 0', transform: `scale(${s})`, overflow: 'hidden', borderRadius: 28, boxShadow: '0 30px 80px rgba(0,0,0,0.35)'}}>
          <Poster />
        </div>
      </Sequence>
      <Grain opacity={0.035} />
      {music && <Audio src={staticFile('music/vacuna_b.mp3')} volume={(fr) => interpolate(fr, [0, 10, VACUNA_B_FRAMES - 30, VACUNA_B_FRAMES], [0, 0.6, 0.6, 0], clamp)} />}
    </AbsoluteFill>
  );
};
