import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Flash, Grain, ScriptWord} from './components';
import {Banner, Sfx} from './shots';
import {C, F, SAFE_X, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Recap de octubre (reel 9:16), con el formato del recap de septiembre del cliente:
// arranque en frío con alguien hablando → título "Recap OCTUBRE" → secciones con etiqueta arriba a la
// izquierda y banderín UW → cierre con el logo sobre azul.
// Canción: "Hold On, We're Going Home" (100 BPM → 1 tiempo = 18 cuadros). Los cortes caen en los tiempos:
// la canción arranca desde MUSICA_DESDE para que su entrada fuerte (18.0 s) coincida con el título.
// Clips en public/proxies (IPEFH visita 1), proxies/v2 (visita 2), proxies/flyover, proxies/medico, proxies/titanic.
// PRIVACIDAD FlyOver: solo tramos donde no aparece el compañero en silla de ruedas (ver FlyOver.tsx).
// ---------------------------------------------------------------------------
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const BEAT = 18;
const sec = (s: number) => Math.round(s * 30);

type Toma = [src: string, from: number, beats: number];
/** foto: tomas que son una imagen fija; recorteArriba: clips exportados de Instagram (se sube el encuadre para ocultar su barra) */
type Seccion = {titulo?: string; sub?: string; tomas: Toma[]; foto?: string; recorteArriba?: boolean};

/** Intro emotiva: el doctor del Día del Médico ("…una de las cosas más hermosas… poder ayudar a la gente") */
const FRIO = {src: 'medico/v1_limpio', from: 0.0, to: 8.2};
const TOMA_DOC = 3.4; // segundo en que entra su toma completa
export const FRIO_F = sec(FRIO.to - FRIO.from);
export const TITULO_F = 8 * BEAT;
export const FIN_F = 8 * BEAT;

const SECCIONES: Seccion[] = [
  {tomas: [['', 0, 6]], foto: 'TEXTOS'},
  {tomas: [['', 0, 4]], foto: 'photos/experiencia_westhill.jpg'},
  {
    titulo: 'Experiencia Westhill 360',
    sub: 'Visitas de IPEFH',
    tomas: [
      ['IMG_0574', 0.1, 2],
      ['IMG_0509', 1.2, 1],
      ['IMG_0513', 1.0, 1],
      ['IMG_0522', 3.0, 2],
      ['v2/IMG_0909', 0.5, 2],
      ['v2/IMG_0899', 1.0, 1],
      ['v2/IMG_0884', 2.0, 1],
      ['v2/IMG_1040', 1.0, 2],
      ['v2/IMG_1057', 1.5, 2],
      ['IMG_0566_luz_fuerte', 0.5, 2],
      ['v2/IMG_0913', 2.0, 1],
      ['v2/IMG_0933', 1.5, 1],
      ['IMG_0596', 0.3, 2],
      ['IMG_0608', 1.0, 2],
      ['v2/IMG_0980', 3.0, 2],
    ],
  },
  {
    titulo: 'FlyOver México',
    sub: 'Coordinación de Inclusión',
    tomas: [
      ['flyover/fly_01', 0.2, 2],
      ['flyover/fly_04', 1.0, 2],
      ['flyover/fly_02', 0.5, 2],
      ['flyover/fly_05', 2.5, 2],
      ['flyover/fly_03', 1.5, 2],
      ['flyover/fly_06', 25.0, 2],
    ],
  },
  {
    titulo: 'Día del Médico',
    tomas: [
      ['medico/v2', 12.5, 2],
      ['medico/v1', 1.0, 2],
      ['medico/v5', 5.0, 1],
      ['medico/v7', 1.5, 1],
      ['medico/v8', 3.0, 1],
      ['medico/v4', 6.0, 1],
      ['medico/v9', 6.0, 2],
      ['medico/v2', 18.2, 2],
    ],
  },
  {
    titulo: 'Feria de la Salud',
    recorteArriba: true,
    tomas: [
      ['recap/feria_salud', 3.6, 2],
      ['recap/feria_salud', 5.4, 1],
      ['recap/feria_salud', 6.3, 2],
      ['recap/feria_salud', 7.6, 2],
      ['recap/feria_salud', 9.0, 1],
      ['recap/feria_salud', 9.7, 2],
      ['recap/feria_salud', 10.9, 1],
    ],
  },
  {
    titulo: 'Un viaje por el Titanic',
    sub: 'Coordinación de Inclusión',
    tomas: [
      ['titanic/t1', 0.3, 2],
      ['titanic/t3', 0.0, 1],
      ['titanic/t4', 0.5, 1],
      ['titanic/t2', 0.5, 2],
      ['titanic/t9', 2.0, 2],
      ['titanic/t10', 0.0, 2],
      ['titanic/t12', 3.0, 2],
      ['titanic/t14', 0.8, 2],
      ['titanic/t8', 0.0, 2],
    ],
  },
];

const durSeccion = (s: Seccion) => s.tomas.reduce((a, t) => a + t[2] * BEAT, 0);
const ARRANQUES = (() => {
  const r: number[] = [];
  let t = FRIO_F + TITULO_F;
  SECCIONES.forEach((s) => {
    r.push(t);
    t += durSeccion(s);
  });
  return {secciones: r, fin: t};
})();
/** Día de Muertos: recap que hizo el cliente (proxies/recap/muertos_base). Su cuenta regresiva (20 números de 3 s)
 *  se acelera a un tiempo de la canción por número; lo demás va a velocidad normal. */
const MUERTOS = 'recap/muertos_base';
const CUENTA = 20;
const CUENTA_DESDE = 1.0; // dentro de cada bloque de 3 s se toma desde aquí…
const CUENTA_TRAMO = 1.2; // …este tramo, comprimido a un tiempo de la canción
/** Tramos del recap del cliente después de la cuenta (se quitan 60–66 "HOY / Bienvenido a casa" y 72–75 "Hoy vuelven a casa") */
const TRAMOS_RESTO: [number, number][] = [
  [66.0, 72.0],
  [75.0, 95.9],
];
const RESTO_FIN = 106.95;
/** el "¡Gracias! … Universidad Westhill" se queda completo unos segundos antes del outro */
const GRACIAS_HOLD = 60;
/** Las fotos del momento entran entre los altares y el 1er lugar del recap del cliente */
const CORTE_FOTOS = 95.9;
const T_POL = 22; // cada polaroid cae en dos tiempos de "Fantasmas"
/** Collage: 7 polaroids en tres filas que cubren la pantalla; caen en este orden */
const POLAROIDS: {n: string; x: number; y: number; r: number}[] = [
  {n: 'f4', x: 60, y: 150, r: -7},
  {n: 'f2', x: 590, y: 200, r: 6},
  {n: 'f1', x: 10, y: 720, r: -4},
  {n: 'f6', x: 650, y: 760, r: 5},
  {n: 'f3', x: 90, y: 1270, r: 4},
  {n: 'f7', x: 570, y: 1250, r: -5},
  {n: 'f5', x: 330, y: 680, r: 2},
];
const FOTOS_F = POLAROIDS.length * T_POL + 70;
/** después de las fotos se salta la tarjeta "Y el primer lugar es para…" (96.0–96.45 s) y entra directo el 1er lugar */
const REANUDA = 96.5;
const durResto = TRAMOS_RESTO.reduce((a, [x, y]) => a + sec(y - x), 0) + sec(RESTO_FIN - REANUDA);
/** Día de Muertos usa "Fantasmas" (instrumental) desde 1:10: lo tranquilo de 70.0 a 75.1 s va bajo la voz en
 *  negro y el golpe de 75.1 s abre la cuenta regresiva; cada número dura dos tiempos (0.72 s). */
const FANTASMAS_DESDE = 67.1;
/** al terminar Drake: 2 s de negro total; luego se prende una luz y entra "Fantasmas" */
const APAGON = 60;
const NEGRO_F = APAGON + sec(75.1 - FANTASMAS_DESDE);
const NUM = 0.72; // segundos por número
const numIni = (k: number) => NEGRO_F + Math.round(k * NUM * 30);
const CUENTA_F = numIni(CUENTA) - NEGRO_F;
const LUZ_AT = APAGON; // se prende la luz
const VOZ1_AT = APAGON + 55; // primera frase, grande al centro
const VOZ2_AT = APAGON + 150; // segunda frase, separada para dar suspenso
export const MUERTOS_F = NEGRO_F + CUENTA_F + durResto + FOTOS_F + GRACIAS_HOLD;
export const RECAP_FRAMES = ARRANQUES.fin + MUERTOS_F + FIN_F;
/** segundo de la canción en que empieza el video: su entrada fuerte (18.0 s) cae en el título */
const MUSICA_DESDE = 18.0 - FRIO_F / 30;

const Clip: React.FC<{src: string; from: number; dur: number; k: number; recorte?: boolean}> = ({src, from, dur, k, recorte}) => {
  const f = useCurrentFrame();
  const golpe = 1.08 - 0.08 * tw(f, [0, 6], [0, 1], ease.out);
  const z = golpe + 0.04 * (f / dur) + (recorte ? 0.18 : 0);
  const x = (k % 2 ? 1 : -1) * 12 * (f / dur);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${z}) translateX(${x}px)`, transformOrigin: recorte ? '50% 100%' : '50% 50%'}}>
        <OffthreadVideo src={staticFile(`proxies/${src}.mp4`)} startFrom={sec(from)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Foto fija: entra con golpe de zoom y sacudida, luego acercamiento lento */
const Foto: React.FC<{src: string; dur: number}> = ({src, dur}) => {
  const f = useCurrentFrame();
  const golpe = tw(f, [0, 10], [0, 1], ease.out);
  const sacude = f < 10 ? (10 - f) * 1.8 : 0;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `translate(${Math.sin(f * 3) * sacude}px, ${Math.cos(f * 4) * sacude}px) scale(${1.35 - 0.3 * golpe + 0.05 * (f / dur)}) rotate(${(1 - golpe) * -3}deg)`}} />
      <Sfx at={0} name="impact" volume={0.55} />
    </AbsoluteFill>
  );
};
/** Antes de la foto: frases de la Experiencia Westhill al ritmo (un cambio por tiempo de la canción) */
const FRASES_EXP: {t: number; arriba?: string; grande?: string; script?: string}[] = [
  {t: 0, grande: 'Este mes'},
  {t: 1, arriba: 'abrimos nuestras', grande: 'PUERTAS'},
  {t: 3, arriba: 'a quienes vienen a', script: 'descubrir su futuro'},
  {t: 5, arriba: 'EXPERIENCIA', grande: 'WESTHILL 360'},
];
const TextosExperiencia: React.FC = () => {
  const f = useCurrentFrame();
  const i = FRASES_EXP.filter((x) => f >= x.t * BEAT).length - 1;
  const fr = FRASES_EXP[i];
  const at = fr.t * BEAT;
  const p = tw(f, [at, at + 8], [0, 1], ease.back);
  return (
    <AbsoluteFill style={{background: C.azul, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(61,139,212,0.95) 0%, rgba(39,99,154,0) 65%)'}} />
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(255,255,255,0.14) 2.5px, transparent 3px)', backgroundSize: '50px 50px', backgroundPosition: `${(f * 0.8) % 50}px ${(f * 0.4) % 50}px`}} />
      <div style={{position: 'absolute', top: 780, left: SAFE_X, right: SAFE_X, textAlign: 'center', transform: `scale(${0.6 + 0.4 * p})`, opacity: Math.min(1, p * 2)}}>
        {fr.arriba && <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 58, color: '#fff', letterSpacing: fr.t === 5 ? 14 : 0}}>{fr.arriba}</div>}
        {fr.grande && <div style={{fontFamily: F.display, fontSize: fr.t === 0 ? 170 : 150, lineHeight: 1.05, color: fr.t === 5 ? C.amarillo : '#fff', textShadow: '0 10px 0 rgba(20,35,60,0.35)'}}>{fr.grande}</div>}
        {fr.script && (
          <div style={{marginTop: 6}}>
            <ScriptWord text={fr.script} start={at + 2} size={120} neon tilt={-5} dur={12} />
          </div>
        )}
      </div>
      {FRASES_EXP.map((x) => (
        <Sfx key={x.t} at={x.t * BEAT} name={x.t === 5 ? 'impact' : 'whoosh'} volume={0.4} />
      ))}
    </AbsoluteFill>
  );
};

/** Etiqueta de sección (como en el recap de septiembre): píldora azul arriba a la izquierda */
const Etiqueta: React.FC<{titulo: string; sub?: string; dur: number}> = ({titulo, sub, dur}) => {
  const f = useCurrentFrame();
  const p = tw(f, [4, 16], [0, 1], ease.back);
  const out = tw(f, [dur - 10, dur], [1, 0]);
  return (
    <div style={{position: 'absolute', left: SAFE_X - 20, top: 170, opacity: out, transform: `translateX(${(1 - p) * -500}px)`}}>
      <div style={{background: C.azul, borderRadius: 26, padding: '16px 28px 18px', boxShadow: '0 12px 30px rgba(0,0,0,0.35)', border: '3px solid rgba(255,255,255,0.85)', maxWidth: 780}}>
        <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 46, lineHeight: 1.05, color: '#fff'}}>{titulo}</div>
        {sub && <div style={{marginTop: 6, fontFamily: F.sans, fontWeight: 700, fontSize: 28, color: C.amarillo}}>{sub}</div>}
      </div>
    </div>
  );
};

const SeccionVid: React.FC<{s: Seccion}> = ({s}) => {
  let acc = 0;
  const dur = durSeccion(s);
  return (
    <AbsoluteFill>
      {s.tomas.map(([src, from, b], k) => {
        const d = b * BEAT;
        const at = acc;
        acc += d;
        return (
          <Sequence key={k} from={at} durationInFrames={d}>
            {s.foto === 'TEXTOS' ? <TextosExperiencia /> : s.foto ? <Foto src={s.foto} dur={d} /> : <Clip src={src} from={from} dur={d} k={k} recorte={s.recorteArriba} />}
          </Sequence>
        );
      })}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 22%)'}} />
      {s.titulo && <Etiqueta titulo={s.titulo} sub={s.sub} dur={Math.min(dur, 6 * BEAT)} />}
      <Flash at={0} dur={8} />
      <Sfx at={0} name="flash" volume={0.45} />
    </AbsoluteFill>
  );
};

/** Pétalos de cempasúchil que caen despacio sobre el negro */
const PetalosNegro: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      {Array.from({length: 16}, (_, i) => {
        const y = ((f * (1.4 + (i % 4) * 0.4) + i * 197) % 2100) - 120;
        const x = ((i * 263) % 1000) + 40 + Math.sin(f / (26 + i) + i) * 40;
        const s = 20 + (i % 3) * 8;
        return (
          <svg key={i} width={s} height={s * 1.3} viewBox="-10 -13 20 26" style={{position: 'absolute', left: x, top: y, opacity: 0.45, transform: `rotate(${f * 2 + i * 50}deg) scaleX(${Math.cos(f / 10 + i)})`}}>
            <path d="M0 -12 C8 -6 8 6 0 12 C-8 6 -8 -6 0 -12 Z" fill={i % 2 ? '#E8811A' : '#F4A93C'} />
          </svg>
        );
      })}
    </>
  );
};
/** Entrada emotiva: pantalla negra con la voz "México no le teme a la muerte. Le teme al olvido." */
const LINEA1 = {at: 0.0, to: 1.58};
const LINEA2 = {at: 2.26, to: 3.12};
const EntradaMuertos: React.FC = () => {
  const f = useCurrentFrame();
  const luz = tw(f, [LUZ_AT, LUZ_AT + 36], [0, 1], ease.inOut);
  // la luz "prende" con un pequeño parpadeo, como vela que agarra flama
  const chispa = f >= LUZ_AT && f < LUZ_AT + 14 ? (Math.floor((f - LUZ_AT) / 3) % 2 ? 0.45 : 1) : 1;
  const vela = (0.85 + 0.15 * Math.sin(f * 0.5) + 0.06 * Math.sin(f * 1.7)) * luz * chispa;
  const p1 = tw(f, [VOZ1_AT, VOZ1_AT + 18], [0, 1]);
  const sube = tw(f, [VOZ2_AT - 12, VOZ2_AT + 8], [0, 1], ease.inOut);
  const p2 = tw(f, [VOZ2_AT, VOZ2_AT + 18], [0, 1]);
  const ol = tw(f, [VOZ2_AT + 12, VOZ2_AT + 30], [0, 1], ease.back);
  const out = tw(f, [NEGRO_F - 14, NEGRO_F - 2], [1, 0]);
  const crema = {color: '#F3E3C8', textShadow: '0 0 22px rgba(232,129,26,0.5)'};
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 55%, rgba(244,169,60,${0.42 * vela}) 0%, rgba(194,90,18,${0.18 * vela}) 30%, rgba(0,0,0,0) 62%)`}} />
      <AbsoluteFill style={{opacity: luz}}>
        <PetalosNegro />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 50, right: 50, top: 820 - 230 * sube, textAlign: 'center', opacity: p1 * out, filter: `blur(${(1 - p1) * 12}px)`, transform: `scale(${(0.94 + 0.06 * p1) * (1 - 0.28 * sube)})`}}>
        <div style={{fontFamily: F.clasica, fontWeight: 700, fontSize: 74, lineHeight: 1.2, letterSpacing: 3, whiteSpace: 'nowrap', ...crema}}>MÉXICO NO LE TEME</div>
        <div style={{fontFamily: F.clasica, fontWeight: 700, fontSize: 74, lineHeight: 1.2, letterSpacing: 3, whiteSpace: 'nowrap', ...crema}}>A LA MUERTE.</div>
      </div>
      <div style={{position: 'absolute', left: 50, right: 50, top: 890, textAlign: 'center', opacity: p2 * out, filter: `blur(${(1 - p2) * 12}px)`}}>
        <div style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 72, ...crema}}>Le teme al</div>
        <div
          style={{
            fontFamily: F.clasica,
            fontWeight: 700,
            fontSize: 170,
            letterSpacing: 8,
            lineHeight: 1.1,
            backgroundImage: 'linear-gradient(180deg, #FFE3A3 0%, #F4A93C 50%, #C25A12 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            filter: `drop-shadow(0 0 ${22 * vela}px rgba(244,169,60,0.75))`,
            transform: `scale(${0.7 + 0.3 * ol})`,
            opacity: ol,
          }}
        >
          OLVIDO
        </div>
      </div>
      <Sfx at={LUZ_AT} name="flicker" volume={0.35} />
      <Sequence from={VOZ1_AT} durationInFrames={sec(LINEA1.to + 0.1)} layout="none">
        <Audio src={staticFile('music/voz_muertos.mp3')} volume={1} />
      </Sequence>
      <Sequence from={VOZ2_AT} layout="none">
        <Audio src={staticFile('music/voz_muertos.mp3')} startFrom={sec(LINEA2.at - 0.12)} volume={1} />
      </Sequence>
    </AbsoluteFill>
  );
};
const fotoSrc = (n: string) => staticFile(`photos/muertos_fotos/${n}.jpg`);
/** Entrada al 1er lugar: viene de un destello dorado y se asienta con un leve zoom */
const PrimerLugar: React.FC = () => {
  const f = useCurrentFrame();
  const luz = interpolate(f, [0, 3, 18], [1, 0.9, 0], clamp);
  const z = 1.12 - 0.12 * tw(f, [0, 16], [0, 1], ease.out);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${z})`}}>
        <OffthreadVideo src={staticFile(`proxies/${MUERTOS}.mp4`)} startFrom={sec(REANUDA)} muted style={{width: '100%', height: '100%'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, #FFF1C9 0%, #F4A93C 45%, rgba(194,90,18,0.6) 100%)', opacity: luz}} />
      <Sfx at={0} name="impact" volume={0.6} />
    </AbsoluteFill>
  );
};
/** Polaroids que caen y se acomodan en collage sobre fondo oscuro con pétalos; al final la cámara entra con luz dorada */
const FotosMuertos: React.FC = () => {
  const f = useCurrentFrame();
  const sale = tw(f, [FOTOS_F - 14, FOTOS_F], [0, 1], ease.in);
  const empuje = (1 + 0.03 * (f / FOTOS_F)) * (1 + sale * 1.4);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, #2A1408 0%, #080405 75%)', overflow: 'hidden'}}>
      <PetalosNegro />
      <AbsoluteFill style={{transform: `scale(${empuje})`}}>
        {POLAROIDS.map(({n, x, y, r}, i) => {
          const at = i * T_POL;
          const p = tw(f, [at, at + 12], [0, 1], ease.back);
          if (f < at) return null;
          const flash = interpolate(f, [at + 10, at + 11, at + 16], [0, 0.7, 0], clamp);
          return (
            <div key={n} style={{position: 'absolute', left: x, top: y, width: 420, padding: '18px 18px 74px', background: '#F7F2E8', boxShadow: '0 24px 50px rgba(0,0,0,0.65)', transform: `translateY(${(1 - p) * -1000}px) rotate(${r + (1 - p) * 30}deg) scale(${1.3 - 0.3 * p})`}}>
              <div style={{position: 'relative'}}>
                <Img src={fotoSrc(n)} style={{width: 384, height: 520, objectFit: 'cover', display: 'block'}} />
                <AbsoluteFill style={{background: '#fff', opacity: flash}} />
              </div>
              <Sfx at={at} name="shutter" volume={0.55} />
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, #FFF1C9 0%, #F4A93C 45%, rgba(194,90,18,0.6) 100%)', opacity: sale}} />
      <Sfx at={FOTOS_F - 14} name="whoosh_largo" volume={0.45} />
    </AbsoluteFill>
  );
};
const Muertos: React.FC = () => {
  const vel = CUENTA_TRAMO / NUM;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence durationInFrames={NEGRO_F}>
        <EntradaMuertos />
      </Sequence>
      {Array.from({length: CUENTA}, (_, k) => (
        <Sequence key={k} from={numIni(k)} durationInFrames={numIni(k + 1) - numIni(k)}>
          <OffthreadVideo src={staticFile(`proxies/${MUERTOS}.mp4`)} startFrom={sec(3 * k + CUENTA_DESDE)} playbackRate={vel} muted style={{width: '100%', height: '100%'}} />
          <Sfx at={0} name="click" volume={0.3} />
        </Sequence>
      ))}
      {TRAMOS_RESTO.map(([a, b], i) => {
        const from = NEGRO_F + CUENTA_F + TRAMOS_RESTO.slice(0, i).reduce((acc, [x, y]) => acc + sec(y - x), 0);
        return (
          <Sequence key={a} from={from} durationInFrames={sec(b - a)}>
            <OffthreadVideo src={staticFile(`proxies/${MUERTOS}.mp4`)} startFrom={sec(a)} muted style={{width: '100%', height: '100%'}} />
          </Sequence>
        );
      })}
      <Sequence from={NEGRO_F + CUENTA_F + durResto - sec(RESTO_FIN - REANUDA)} durationInFrames={FOTOS_F}>
        <FotosMuertos />
      </Sequence>
      <Sequence from={NEGRO_F + CUENTA_F + durResto + FOTOS_F} durationInFrames={GRACIAS_HOLD}>
        <Img src={staticFile('photos/muertos_gracias_final.png')} style={{width: '100%', height: '100%'}} />
      </Sequence>
      <Sequence from={NEGRO_F + CUENTA_F + durResto - sec(RESTO_FIN - REANUDA) + FOTOS_F} durationInFrames={sec(RESTO_FIN - REANUDA)}>
        <PrimerLugar />
      </Sequence>
      <Sequence from={NEGRO_F} layout="none">
        <Flash at={0} dur={8} />
      </Sequence>
    </AbsoluteFill>
  );
};

/** Intro: negro con la voz del doctor y sus frases; su toma entra con look de cine */
type LineaDoc = {text: string; at: number; big?: boolean};
const TARJETAS_DOC: {from: number; to: number; abajo?: boolean; lineas: LineaDoc[]}[] = [
  {from: 0.4, to: 3.3, lineas: [{text: 'Una de las cosas', at: 0.5}, {text: 'más hermosas', at: 1.35, big: true}]},
  {from: 3.4, to: 8.1, abajo: true, lineas: [{text: 'Por un lado', at: 3.5}, {text: 'poder ayudar', at: 5.8, big: true}, {text: 'a la gente', at: 6.9}]},
];
const Frio: React.FC = () => {
  const f = useCurrentFrame();
  const toma = sec(TOMA_DOC);
  const vis = interpolate(f, [toma, toma + 24, FRIO_F - 8, FRIO_F], [0, 1, 1, 0.3], clamp);
  const barras = tw(f, [toma, toma + 24], [0, 1], ease.inOut);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{opacity: vis}}>
        <AbsoluteFill style={{transform: `scale(${1.0 + 0.06 * (f / FRIO_F)})`, transformOrigin: '540px 640px', filter: 'contrast(1.1) saturate(0.8) brightness(0.9) sepia(0.1)'}}>
          <OffthreadVideo src={staticFile(`proxies/${FRIO.src}.mp4`)} startFrom={sec(FRIO.from)} style={{width: '100%', height: '100%', objectFit: 'cover'}} volume={(fr) => interpolate(fr, [0, 4, FRIO_F - 6, FRIO_F], [0, 1, 1, 0], clamp)} />
        </AbsoluteFill>
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.8) 85%)'}} />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 150 * barras, background: '#000'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 150 * barras, background: '#000'}} />
      {TARJETAS_DOC.map((t, i) => {
        const out = tw(f, [sec(t.to) - 8, sec(t.to)], [1, 0]);
        return (
          <div key={i} style={{position: 'absolute', left: 70, right: 70, top: t.abajo ? 1330 : 780, textAlign: 'center', opacity: out}}>
            {t.lineas.map((l, j) => {
              const p = tw(f, [sec(l.at), sec(l.at) + 14], [0, 1]);
              const antes = t.lineas[j - 1];
              return (
                <div
                  key={l.text}
                  style={{
                    marginTop: !antes ? 0 : antes.big && !l.big ? 26 : 12,
                    fontFamily: l.big ? F.serif : F.sans,
                    fontStyle: l.big ? 'italic' : 'normal',
                    fontWeight: l.big ? 600 : 500,
                    fontSize: l.big ? 88 : 40,
                    letterSpacing: l.big ? 0 : 8,
                    textTransform: l.big ? 'none' : 'uppercase',
                    lineHeight: 1.2,
                    color: '#F4F1EA',
                    textShadow: '0 4px 24px rgba(0,0,0,0.9)',
                    opacity: p,
                    filter: `blur(${(1 - p) * 10}px)`,
                    transform: `translateY(${(1 - p) * 18}px)`,
                  }}
                >
                  {l.text}
                </div>
              );
            })}
          </div>
        );
      })}
      <Grain opacity={0.08} />
      <Sfx at={6} name="latido" volume={0.5} />
      <Sfx at={FRIO_F - 16} name="riser" volume={0.45} />
    </AbsoluteFill>
  );
};

/** Título "Recap OCTUBRE" sobre tomas rápidas oscurecidas */
const FONDO_TITULO: Toma[] = [
  ['v2/IMG_0909', 1.0, 1],
  ['medico/v2', 14.0, 1],
  ['titanic/t10', 1.0, 1],
  ['IMG_0574', 0.6, 1],
  ['flyover/fly_04', 1.5, 1],
  ['v2/IMG_1057', 2.0, 1],
  ['titanic/t1', 1.0, 1],
  ['IMG_0596', 0.8, 1],
];
const Titulo: React.FC = () => {
  const f = useCurrentFrame();
  const r = tw(f, [2, 18], [0, 1]);
  const m = tw(f, [10, 24], [0, 1], ease.back);
  const glow = 0.6 + 0.4 * Math.sin(f / 5);
  const out = tw(f, [TITULO_F - 8, TITULO_F], [1, 0]);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {FONDO_TITULO.map(([src, from], k) => (
        <Sequence key={k} from={k * BEAT} durationInFrames={BEAT}>
          <AbsoluteFill style={{filter: 'brightness(0.32) saturate(0.8)'}}>
            <Clip src={src} from={from} dur={BEAT} k={k} />
          </AbsoluteFill>
        </Sequence>
      ))}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.75) 100%)'}} />
      <div style={{position: 'absolute', top: 760, width: '100%', textAlign: 'center', opacity: out}}>
        <div style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 150, lineHeight: 1, color: '#fff', opacity: r, filter: `blur(${(1 - r) * 10}px)`, transform: `translateY(${(1 - r) * -40}px)`, textShadow: `0 0 ${24 * glow}px rgba(255,255,255,0.6)`}}>Recap</div>
        <div style={{marginTop: 4, fontFamily: F.display, fontSize: 210, lineHeight: 1, letterSpacing: 6, color: '#fff', transform: `scale(${m})`, textShadow: `0 0 ${36 * glow}px rgba(242,194,48,0.8), 0 0 8px rgba(255,255,255,0.8)`}}>OCTUBRE</div>
      </div>
      <Flash at={0} dur={10} />
      <Sfx at={0} name="impact" volume={0.6} />
      <Sfx at={10} name="flicker" volume={0.5} />
    </AbsoluteFill>
  );
};

/** Cierre: logo sobre azul */
const FadeNegro: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: '#000', opacity: tw(f, [0, dur - 2], [0, 1], ease.inOut)}} />;
};

const Fin: React.FC = () => {
  const f = useCurrentFrame();
  const entra = tw(f, [0, 16], [0, 1]);
  const logo = tw(f, [10, 34], [0, 1]);
  const t = tw(f, [32, 48], [0, 1]);
  const vela = 0.85 + 0.15 * Math.sin(f * 0.5) + 0.06 * Math.sin(f * 1.7);
  const negro = tw(f, [FIN_F - 26, FIN_F], [0, 1]);
  return (
    <AbsoluteFill style={{background: '#080405', opacity: entra}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, rgba(232,129,26,${0.32 * vela}) 0%, rgba(8,4,5,0) 60%)`}} />
      <PetalosNegro />
      <div style={{position: 'absolute', left: 240, top: 660, width: 600, clipPath: `inset(0 0 ${(1 - logo) * 100}% 0)`, transform: `translateY(${(1 - logo) * 30}px)`, filter: `drop-shadow(0 0 ${16 * vela}px rgba(244,169,60,0.55))`}}>
        <Img src={staticFile('logos/logo_westhill_blanco_total.png')} style={{width: '100%'}} />
      </div>
      <div style={{position: 'absolute', top: 1000, width: '100%', textAlign: 'center', opacity: t, transform: `translateY(${(1 - t) * 20}px)`}}>
        <span style={{fontFamily: F.clasica, fontWeight: 700, fontSize: 44, letterSpacing: 10, backgroundImage: 'linear-gradient(180deg, #FFE3A3 0%, #F4A93C 50%, #C25A12 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>#SOMOSWESTHILL</span>
      </div>
      <AbsoluteFill style={{background: '#000', opacity: negro}} />
      <Sfx at={10} name="whoosh_largo" volume={0.35} />
    </AbsoluteFill>
  );
};

export const RecapOctubre: React.FC<{music?: boolean}> = ({music = true}) => {
  const inicioTitulo = FRIO_F;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence durationInFrames={FRIO_F}>
        <Frio />
      </Sequence>
      <Sequence from={inicioTitulo} durationInFrames={TITULO_F}>
        <Titulo />
      </Sequence>
      {SECCIONES.map((s, i) => (
        <Sequence key={i} from={ARRANQUES.secciones[i]} durationInFrames={durSeccion(s)}>
          <SeccionVid s={s} />
        </Sequence>
      ))}
      {/* fin de la parte de Drake: el video se va a negro */}
      <Sequence from={ARRANQUES.fin - 36} durationInFrames={36}>
        <FadeNegro dur={36} />
      </Sequence>
      <Sequence from={ARRANQUES.fin} durationInFrames={MUERTOS_F}>
        <Muertos />
      </Sequence>
      <Sequence from={ARRANQUES.fin + MUERTOS_F} durationInFrames={FIN_F}>
        <Fin />
      </Sequence>
      {/* banderín: se oculta durante la foto de bienvenida, que ya trae su propio título arriba */}
      <Sequence from={inicioTitulo} durationInFrames={ARRANQUES.secciones[1] - inicioTitulo}>
        <Banner />
      </Sequence>
      <Sequence from={ARRANQUES.secciones[2]} durationInFrames={ARRANQUES.fin - ARRANQUES.secciones[2]}>
        <Banner />
      </Sequence>
      <Grain opacity={0.04} />
      {music && (
        <Sequence durationInFrames={ARRANQUES.fin + 46}>
          <Audio
            src={staticFile('music/recap_octubre.mp3')}
            startFrom={sec(MUSICA_DESDE)}
            volume={(fr) => interpolate(fr, [0, 10, FRIO_F - 10, FRIO_F, ARRANQUES.fin - 36, ARRANQUES.fin + 44], [0, 0.18, 0.18, 0.85, 0.85, 0], {...clamp, easing: (t) => t})}
          />
        </Sequence>
      )}
      {music && (
        <Sequence from={ARRANQUES.fin + APAGON}>
          <Audio
            src={staticFile('music/fantasmas.mp3')}
            startFrom={sec(FANTASMAS_DESDE)}
            volume={(fr) => interpolate(fr, [0, 24, NEGRO_F - APAGON, NEGRO_F - APAGON + 1, RECAP_FRAMES - ARRANQUES.fin - APAGON - 45, RECAP_FRAMES - ARRANQUES.fin - APAGON], [0, 0.35, 0.35, 0.85, 0.85, 0], clamp)}
          />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Teaser de 20 s para historias: cortes rápidos al ritmo, título, un guiño a Día de Muertos y llamada a ver el recap
// ---------------------------------------------------------------------------
const TEASER_CORTES: Toma[] = [
  ['IMG_0574', 0.4, 1],
  ['v2/IMG_0899', 1.2, 1],
  ['v2/IMG_1057', 1.8, 1],
  ['IMG_0596', 0.5, 1],
  ['flyover/fly_04', 1.2, 1],
  ['flyover/fly_03', 1.8, 1],
  ['medico/v5', 5.3, 1],
  ['medico/v2', 13.0, 1],
  ['recap/feria_salud', 6.5, 1],
  ['titanic/t10', 0.5, 1],
  ['titanic/t9', 2.3, 1],
  ['v2/IMG_0980', 3.2, 1],
  ['titanic/t8', 0.3, 1],
  ['v2/IMG_0909', 0.8, 1],
];
const T_CORTES = TEASER_CORTES.length * BEAT;
const T_MUERTOS = 6 * BEAT;
const T_FIN = 6 * BEAT;
export const TEASER_FRAMES = T_CORTES + TITULO_F + T_MUERTOS + T_FIN;

const TeaserMuertos: React.FC = () => {
  // cuatro números de la cuenta y dos polaroids, rápido
  const nums = [0, 5, 10, 18];
  const vel = CUENTA_TRAMO / NUM;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {nums.map((k, i) => (
        <Sequence key={k} from={i * 9} durationInFrames={9}>
          <OffthreadVideo src={staticFile(`proxies/${MUERTOS}.mp4`)} startFrom={sec(3 * k + CUENTA_DESDE)} playbackRate={vel} muted style={{width: '100%', height: '100%'}} />
          <Sfx at={0} name="click" volume={0.35} />
        </Sequence>
      ))}
      <Sequence from={36} durationInFrames={T_MUERTOS - 36}>
        <OffthreadVideo src={staticFile(`proxies/${MUERTOS}.mp4`)} startFrom={sec(97.2)} muted style={{width: '100%', height: '100%'}} />
      </Sequence>
      <Flash at={0} dur={8} />
    </AbsoluteFill>
  );
};
const TeaserFin: React.FC = () => {
  const f = useCurrentFrame();
  const r = tw(f, [2, 16], [0, 1]);
  const m = tw(f, [8, 22], [0, 1], ease.back);
  const cta = tw(f, [26, 40], [0, 1]);
  const logo = tw(f, [40, 60], [0, 1]);
  const vela = 0.85 + 0.15 * Math.sin(f * 0.5);
  const negro = tw(f, [T_FIN - 10, T_FIN], [0, 1]);
  return (
    <AbsoluteFill style={{background: '#080405'}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, rgba(232,129,26,${0.3 * vela}) 0%, rgba(8,4,5,0) 60%)`}} />
      <PetalosNegro />
      <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center'}}>
        <div style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 120, lineHeight: 1, color: '#fff', opacity: r, filter: `blur(${(1 - r) * 10}px)`}}>Recap</div>
        <div style={{fontFamily: F.display, fontSize: 180, lineHeight: 1, letterSpacing: 6, color: '#fff', transform: `scale(${m})`, textShadow: '0 0 30px rgba(244,169,60,0.7)'}}>OCTUBRE</div>
        <div style={{marginTop: 40, opacity: cta, transform: `translateY(${(1 - cta) * 20}px)`}}>
          <span style={{background: C.amarillo, color: C.marino, fontFamily: F.sans, fontWeight: 900, fontSize: 46, padding: '14px 34px', borderRadius: 50}}>Míralo completo en nuestro perfil</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 340, top: 1260, width: 400, clipPath: `inset(0 0 ${(1 - logo) * 100}% 0)`}}>
        <Img src={staticFile('logos/logo_westhill_blanco_total.png')} style={{width: '100%'}} />
      </div>
      <AbsoluteFill style={{background: '#000', opacity: negro}} />
      <Flash at={0} dur={8} />
      <Sfx at={0} name="impact" volume={0.55} />
      <Sfx at={26} name="pop" volume={0.5} />
    </AbsoluteFill>
  );
};
export const RecapTeaser: React.FC<{music?: boolean}> = ({music = true}) => (
  <AbsoluteFill style={{background: '#000'}}>
    {TEASER_CORTES.map(([src, from], k) => (
      <Sequence key={k} from={k * BEAT} durationInFrames={BEAT}>
        <Clip src={src} from={from} dur={BEAT} k={k} />
        {k % 3 === 0 && <Flash at={0} dur={6} />}
      </Sequence>
    ))}
    <Sequence from={T_CORTES} durationInFrames={TITULO_F}>
      <Titulo />
    </Sequence>
    <Sequence from={T_CORTES + TITULO_F} durationInFrames={T_MUERTOS}>
      <TeaserMuertos />
    </Sequence>
    <Sequence from={T_CORTES + TITULO_F + T_MUERTOS} durationInFrames={T_FIN}>
      <TeaserFin />
    </Sequence>
    <Sequence from={0} durationInFrames={T_CORTES + TITULO_F}>
      <Banner />
    </Sequence>
    <Grain opacity={0.04} />
    {music && (
      <Audio src={staticFile('music/recap_octubre.mp3')} startFrom={sec(18.0 - T_CORTES / 30)} volume={(fr) => interpolate(fr, [0, 8, TEASER_FRAMES - 30, TEASER_FRAMES], [0, 0.85, 0.85, 0], clamp)} />
    )}
  </AbsoluteFill>
);
