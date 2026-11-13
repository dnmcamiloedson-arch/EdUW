import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from './components';
import {F, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Video institucional: Reacreditación COMAEM de la Facultad de Medicina (1920x1080, uso interno).
// Música: "Time" (Hans Zimmer), editada con scripts/comaem_musica.py para que el clímax entre cuando termina el
// Rector (CLIMAX). Material preparado con scripts/comaem_preparar.py (proxies y voces limpias a -16 LUFS).
//
// Estructura (segundos del video):
//   0–8      negro con polvo dorado, logo Westhill y entrada de la Facultad
//   8–32.6   Mtra. Elvia: a cuadro su primera frase; el resto en voz en off sobre tomas de la facultad
//   32.6     título "REACREDITACIÓN COMAEM" (aquí la canción empieza a crecer)
//   37.2     Dr. Alan · 50.8 docentes (Loera, Bonilla, Dra. Yarim en voz en off, Pérez Peláez)
//   89.4     alumnos (Frida, Alexa, Jorge) · 122.4 Dr. Asisclo con tomas de apoyo en dos tramos
//   166.4    espacio en negro para el Rector (falta su toma) hasta CLIMAX
//   CLIMAX   "REACREDITACIÓN COMAEM" con fuegos dorados (5.7 s), montaje de cinco palabras clave y cortinilla con el piano
// Entre escenas cruza un "pulso": dos paneles azules se cierran sobre una línea de electrocardiograma con chispas
// y se abren hacia la escena siguiente (sin texto). Entre personas cruza un barrido de luz dorada con chispas.
// Sobre todas las tomas flota polvo dorado muy tenue. Las tomas de apoyo del cliente traen varios planos
// pegados; aquí cada toma usa un solo plano (ver PLANOS).
// Por indicación del cliente: sin rótulos de nombre, sin subtítulos y sin logo de la Facultad de Medicina.
// ---------------------------------------------------------------------------
const W = 1920;
const H = 1080;
const FPS = 30;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const s = (t: number) => Math.round(t * FPS);
const NAVY = '#0B1B33';
const NAVY2 = '#06101F';
const ORO = '#D9B76A';
const ORO_GRAD = 'linear-gradient(180deg, #F6E3B0 0%, #D9B76A 55%, #A97B35 100%)';
const CREMA = '#F4EEE2';
const vid = (n: string) => staticFile(`proxies/comaem/${n}.mp4`);
const voz = (n: string) => staticFile(`comaem/voz/${n}.wav`);
const LOGO_UW = staticFile('logos/logo_westhill_blanco_total.png');
const LOGO_COMAEM = staticFile('comaem/logo_comaem_blanco_brillo.png');
/** azar determinista y rápido */
const hh = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const c01 = (x: number) => Math.max(0, Math.min(1, x));

const FRASE = (60 / 63) * 16; // frase musical de 4 compases (15.24 s)
const COMPAS2 = (60 / 63) * 2; // dos tiempos (1.9 s): ritmo del montaje final
const TITULO = 32.6; // la canción empieza a crecer aquí (segundo 30.75 de la pista + 1.85 s de silencio inicial)
/** segundo del video en que termina el Rector y entra el clímax: título + 8 frases de la canción + 2 repetidas */
const CLIMAX = TITULO + 122 + 2 * FRASE;
const A = 125.0; // inicio del Dr. Asisclo
const RECTOR_DESDE = A + 41.4;
const FIN = CLIMAX + FRASE + 10.5;
export const COMAEM_FRAMES = s(FIN);

// ---------------------------------------------------------------------------
// Tomas (video). PLANOS: cortes internos de las tomas de apoyo, para no cruzar de un plano a otro:
//   b1: 0–5.9 pipeta · 5.9–9.2 guantes · 9.2–21.9 grupo en laboratorio · 21.9–27.8 laboratorio abierto
//   b2: 0–7.2 dos alumnos de perfil · 7.2–15.3 alumnas con tableta · 15.3–22.4 alumna junto a la ventana · 22.4–29.8 salón abierto
//   b3: 0–4.0 docente con proyector · 4.0–11.6 alumnas con tableta · 11.6–17.3 docente presentando · 17.3–24.5 docente, otro ángulo
//   b4: 0–6.6 clase desde atrás · 6.6–11.3 docente junto a la puerta · 11.3–17.0 alumnos atentos
// ---------------------------------------------------------------------------
type Entrada = 'corte' | 'fundido' | 'barrido' | 'lento';
type Toma = {src: string; at: number; dur: number; desde: number; entra?: Entrada; sale?: boolean; zoom?: [number, number]; rate?: number};
const TOMAS: Toma[] = [
  // apertura y Mtra. Elvia
  {src: 'b13', at: 4.4, dur: 4.1, desde: 0.4, entra: 'lento', zoom: [1.0, 1.07]},
  {src: 'elvia', at: 8.0, dur: 4.0, desde: 2.0, entra: 'barrido'},
  {src: 'b9', at: 11.8, dur: 3.4, desde: 0.8, entra: 'fundido'},
  {src: 'b11', at: 15.0, dur: 2.5, desde: 0.05, entra: 'fundido'},
  {src: 'b12', at: 17.3, dur: 2.6, desde: 0.05, entra: 'fundido'},
  {src: 'b2', at: 19.7, dur: 3.3, desde: 9.0, entra: 'fundido'},
  {src: 'b1', at: 22.8, dur: 3.0, desde: 12.0, entra: 'fundido'},
  {src: 'b5', at: 25.6, dur: 2.1, desde: 0.05, entra: 'fundido', rate: 0.9},
  {src: 'b4', at: 27.5, dur: 2.5, desde: 11.7, entra: 'fundido'},
  {src: 'b10', at: 29.8, dur: 3.4, desde: 1.5, entra: 'fundido'},
  // Dr. Alan
  {src: 'alan', at: 37.2, dur: 13.6, desde: 0},
  // docentes
  {src: 'b8', at: 50.8, dur: 2.4, desde: 2.0},
  {src: 'loera', at: 53.0, dur: 6.3, desde: 1.6, entra: 'barrido'},
  {src: 'bonilla', at: 58.9, dur: 10.8, desde: 4.9, entra: 'barrido'},
  // Dra. Yarim: solo su voz, sobre clases y prácticas
  {src: 'b3', at: 69.5, dur: 3.6, desde: 4.5, entra: 'barrido'},
  {src: 'b7', at: 72.9, dur: 3.4, desde: 0.3, entra: 'fundido'},
  {src: 'b2', at: 76.1, dur: 4.0, desde: 0.8, entra: 'fundido'},
  {src: 'perez', at: 79.9, dur: 5.9, desde: 0.7, entra: 'barrido'},
  {src: 'b6', at: 85.6, dur: 3.8, desde: 3.0, entra: 'fundido'},
  // alumnos
  {src: 'b2', at: 89.4, dur: 2.8, desde: 23.0, rate: 0.85},
  {src: 'frida', at: 92.0, dur: 10.9, desde: 3.5, entra: 'barrido'},
  {src: 'alexa', at: 102.5, dur: 8.8, desde: 3.2, entra: 'barrido'},
  {src: 'jorge', at: 110.9, dur: 11.5, desde: 2.2, entra: 'barrido'},
  // Dr. Asisclo y sus tomas de apoyo
  {src: 'b1', at: 122.4, dur: 2.8, desde: 1.0, rate: 0.85},
  {src: 'asisclo', at: A, dur: 41.3, desde: 0, entra: 'barrido', zoom: [1.0, 1.04]},
  {src: 'b3', at: A + 9.0, dur: 3.2, desde: 12.0, entra: 'fundido'},
  {src: 'b4', at: A + 12.0, dur: 3.1, desde: 2.0, entra: 'fundido'},
  {src: 'b7', at: A + 14.9, dur: 3.1, desde: 0.2, entra: 'fundido', sale: true},
  {src: 'b6', at: A + 26.4, dur: 3.5, desde: 0.5, entra: 'fundido'},
  {src: 'b1', at: A + 29.7, dur: 3.5, desde: 22.3, entra: 'fundido'},
  {src: 'b2', at: A + 33.0, dur: 3.6, desde: 16.0, entra: 'fundido', sale: true},
];

// Voces: [archivo, segundo del video, segundo de la toma donde empieza, segundo de la toma donde termina]
const VOCES: [string, number, number, number][] = [
  ['elvia', 8.0, 2.0, 26.5],
  ['alan', 37.2, 0.0, 13.3],
  ['loera', 53.0, 1.6, 7.7],
  ['bonilla', 61.3, 7.3, 15.4],
  ['yarim', 69.5, 4.1, 14.7],
  ['perez', 79.9, 0.7, 10.0],
  ['frida', 92.0, 3.5, 14.2],
  ['alexa', 102.5, 3.2, 11.8],
  ['jorge', 113.4, 4.7, 13.2],
  ['asisclo', A, 0.0, 41.3],
];

/** segundos del video donde cambia la escena con el pulso (el corte cae en PULSO_CORTE) */
const PULSOS = [37.2, 50.8, 89.4, 122.4, RECTOR_DESDE];
const PULSO_F = 22;
const PULSO_CORTE = 10;

// ---------------------------------------------------------------------------
// Partículas (canvas)
// ---------------------------------------------------------------------------
/** Polvo dorado que flota hacia arriba y titila; con `bokeh`, además discos grandes y suaves al fondo */
const Particulas: React.FC<{n?: number; op?: number; semilla?: number; bokeh?: boolean; vel?: number}> = ({n = 60, op = 1, semilla = 1, bokeh = false, vel = 1}) => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    const alto = H + 160;
    for (let i = 0; i < n; i++) {
      const k = i + semilla * 97;
      const grande = bokeh && i % 5 === 0;
      const v = (grande ? 0.12 + hh(k * 5.3) * 0.2 : 0.25 + hh(k * 5.3) * 0.7) * vel;
      const x = hh(k * 2.3) * W + Math.sin(f / 55 + k) * (grande ? 30 : 18);
      const y = ((((hh(k * 7.1) * alto - f * v) % alto) + alto) % alto) - 80;
      const titila = 0.35 + 0.65 * Math.abs(Math.sin(f / (16 + hh(k) * 22) + k * 1.7));
      const r = grande ? 22 + hh(k * 3.7) * 46 : 1.2 + hh(k * 3.7) * 2.4;
      const a = (grande ? 0.1 + hh(k * 4.1) * 0.08 : 0.5 * titila) * op;
      const col = i % 6 === 0 ? '255,250,238' : '246,214,150';
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * (grande ? 1 : 3));
      g.addColorStop(0, `rgba(${col},${a})`);
      g.addColorStop(grande ? 0.55 : 0.3, `rgba(${col},${a * (grande ? 0.5 : 0.35)})`);
      g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * (grande ? 1 : 3), 0, Math.PI * 2);
      ctx.fill();
    }
  }, [f, n, op, semilla, bokeh, vel]);
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />;
};

/**
 * Fuegos artificiales dorados (canvas), sobrios: cometa que sube y esfera de chispas con estela que cae y
 * chisporrotea. Solo oro, champán y blanco.
 */
type Carcasa = {at: number; x: number; y: number; r: number; sauce?: boolean};
const Fuegos: React.FC<{carcasas: Carcasa[]; op?: number}> = ({carcasas, op = 1}) => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    const SUBE = 22;
    const FRENO = 1 - Math.exp(-4);
    carcasas.forEach((c, ci) => {
      const vida = c.sauce ? 110 : 64;
      const grav = c.sauce ? 300 : 90;
      const lag = c.sauce ? 14 : 7;
      const n = c.sauce ? 120 : 150;
      const t = f - c.at;
      if (t < -SUBE || t > vida) return;
      if (t < 0) {
        const k = (t + SUBE) / SUBE;
        const pos = (kk: number): [number, number] => {
          const e = 1 - Math.pow(1 - c01(kk), 2);
          return [c.x + (ci % 2 ? 50 : -50) * (1 - e), H + 30 + (c.y - H - 30) * e];
        };
        const [hx, hy] = pos(k);
        const [tx, ty] = pos(k - 0.14);
        const g = ctx.createLinearGradient(tx, ty, hx, hy);
        g.addColorStop(0, 'rgba(255,200,120,0)');
        g.addColorStop(1, `rgba(255,246,222,${0.9 * op})`);
        ctx.strokeStyle = g;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(hx, hy);
        ctx.stroke();
        return;
      }
      if (t < 14) {
        const fl = (1 - t / 14) * op;
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r * 2);
        g.addColorStop(0, `rgba(255,244,214,${0.5 * fl})`);
        g.addColorStop(0.2, `rgba(255,214,140,${0.22 * fl})`);
        g.addColorStop(1, 'rgba(255,214,140,0)');
        ctx.fillStyle = g;
        ctx.fillRect(c.x - c.r * 2, c.y - c.r * 2, c.r * 4, c.r * 4);
      }
      const u = t / vida;
      const pos = (dx: number, dy: number, v: number, tt: number): [number, number] => {
        const uu = c01(tt / vida);
        const e = (1 - Math.exp(-4 * uu)) / FRENO;
        return [c.x + dx * c.r * v * e, c.y + dy * c.r * v * e + grav * uu * uu];
      };
      ctx.lineWidth = c.sauce ? 1.7 : 2.2;
      for (let i = 0; i < n; i++) {
        const z = hh(ci * 13.1 + i * 1.17) * 2 - 1;
        const th = hh(ci * 7.3 + i * 2.31) * Math.PI * 2;
        const rr = Math.sqrt(1 - z * z);
        const v = 0.9 + 0.1 * hh(i * 5.3 + ci);
        let a = (u < 0.55 ? 1 : 1 - (u - 0.55) / 0.45) * op;
        if (u > 0.4) a *= hh(i * 3.7 + f * 0.61 + ci) > 0.42 ? 1 : 0.2;
        if (a < 0.02) continue;
        const col = u < 0.12 ? '255,250,240' : i % 3 === 0 ? '255,246,222' : '255,214,140';
        const [hx, hy] = pos(rr * Math.cos(th), rr * Math.sin(th), v, t);
        const [tx, ty] = pos(rr * Math.cos(th), rr * Math.sin(th), v, t - lag);
        ctx.strokeStyle = `rgba(${col},${a * 0.8})`;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(hx + 0.01, hy);
        ctx.stroke();
      }
    });
  }, [f, carcasas, op]);
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, filter: 'drop-shadow(0 0 6px rgba(255,214,150,0.8))'}} />;
};

// ---------------------------------------------------------------------------
// Piezas
// ---------------------------------------------------------------------------
/** Toma de video con acercamiento lento y su entrada (corte, fundido o barrido de luz dorada con chispas) */
const Clip: React.FC<{t: Toma; i: number}> = ({t, i}) => {
  const f = useCurrentFrame();
  const dur = s(t.dur);
  const [z0, z1] = t.zoom ?? (t.src.startsWith('b') ? [1.04, 1.1] : [1.0, 1.05]);
  const z = interpolate(f, [0, dur], [z0, z1], clamp);
  const sale = t.sale ? tw(f, [dur - 8, dur], [1, 0], ease.inOut) : 1;
  let op = sale;
  let clip: string | undefined;
  let linea: React.ReactNode = null;
  let fuga = 0;
  if (t.entra === 'fundido') {
    op *= tw(f, [0, 7], [0, 1], ease.inOut);
    fuga = interpolate(f, [0, 5, 16], [0, 0.16, 0], clamp); // fuga de luz cálida muy breve en cada cambio
  }
  if (t.entra === 'lento') op *= tw(f, [0, 36], [0, 1], ease.inOut);
  if (t.entra === 'barrido' && f < 20) {
    const p = tw(f, [0, 13], [0, 1], ease.inOut);
    const x = -80 + p * (W + 160);
    if (f < 14) clip = `polygon(0 0, ${x + 60}px 0, ${x - 60}px 100%, 0 100%)`;
    linea = (
      <>
        <div style={{position: 'absolute', left: x - 70, top: -40, width: 140, height: H + 80, transform: 'skewX(-6.3deg)', background: 'linear-gradient(90deg, rgba(246,227,176,0) 0%, rgba(246,227,176,0.5) 38%, rgba(255,250,235,1) 50%, rgba(246,227,176,0.5) 62%, rgba(246,227,176,0) 100%)', mixBlendMode: 'screen', opacity: Math.sin(p * Math.PI)}} />
        {/* chispas que deja la línea de luz */}
        {Array.from({length: 16}, (_, k) => {
          const nace = 1 + hh(i * 9.1 + k) * 11;
          const edad = f - nace;
          if (edad < 0 || edad > 12) return null;
          const xk = -80 + tw(nace, [0, 13], [0, 1], ease.inOut) * (W + 160);
          const yk = hh(i * 3.3 + k * 2.1) * H;
          const tam = 3 + hh(k * 5.7 + i) * 4;
          return <div key={k} style={{position: 'absolute', left: xk - 60 * ((yk - H / 2) / (H / 2)) - edad * (6 + hh(k) * 8), top: yk + edad * (hh(k * 1.3) - 0.5) * 6, width: tam, height: tam, borderRadius: '50%', background: '#FFF3D0', boxShadow: '0 0 10px 2px rgba(246,214,150,0.9)', opacity: 1 - edad / 12}} />;
        })}
      </>
    );
  }
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: op, clipPath: clip, overflow: 'hidden', background: '#000'}}>
        <OffthreadVideo src={vid(t.src)} startFrom={s(t.desde)} playbackRate={t.rate ?? 1} muted style={{width: W, height: H, objectFit: 'cover', transform: `scale(${z})`, filter: 'contrast(1.04) saturate(1.06)'}} />
        {fuga > 0 && <AbsoluteFill style={{background: 'radial-gradient(ellipse at 20% 30%, rgba(255,214,150,1) 0%, rgba(255,170,90,0.5) 45%, rgba(255,170,90,0) 80%)', opacity: fuga, mixBlendMode: 'screen'}} />}
      </AbsoluteFill>
      {linea}
    </AbsoluteFill>
  );
};

/**
 * Pulso: cambio de escena sin texto. Dos paneles azules se cierran, una línea de electrocardiograma cruza la
 * pantalla con un punto de luz y chispas, y los paneles se abren hacia la escena siguiente.
 */
const LINEA_PULSO = 'M0,540 L760,540 L790,516 L818,540 L862,540 L890,430 L924,650 L954,540 L1010,540 L1046,500 L1086,540 L1920,540';
const Pulso: React.FC<{semilla: number}> = ({semilla}) => {
  const f = useCurrentFrame();
  const cierra = tw(f, [0, 7], [0, 1], ease.inOut);
  const abre = tw(f, [12, PULSO_F], [0, 1], ease.inOut);
  const k = cierra * (1 - abre);
  const p = tw(f, [3, 14], [0, 1], ease.inOut);
  const panel: React.CSSProperties = {position: 'absolute', left: 0, width: W, height: H / 2 + 2};
  return (
    <AbsoluteFill>
      <div style={{...panel, top: 0, background: `linear-gradient(180deg, ${NAVY2} 0%, ${NAVY} 100%)`, transform: `translateY(${-(1 - k) * (H / 2 + 4)}px)`}} />
      <div style={{...panel, top: H / 2 - 2, background: `linear-gradient(0deg, ${NAVY2} 0%, ${NAVY} 100%)`, transform: `translateY(${(1 - k) * (H / 2 + 4)}px)`}} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: Math.min(1, k * 1.8 + (abre < 1 ? 0.25 * (1 - abre) : 0)), filter: 'drop-shadow(0 0 10px rgba(246,227,176,0.95))'}}>
        <path d={LINEA_PULSO} fill="none" stroke={ORO} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
        <path d={LINEA_PULSO} fill="none" stroke="#FFF6DC" strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray="0.035 1" strokeDashoffset={-(p - 0.035)} opacity={p > 0.035 && p < 1 ? 1 : 0} />
      </svg>
      {/* chispas que se desprenden de la línea al abrirse */}
      {Array.from({length: 26}, (_, i) => {
        const x = hh(semilla * 5.1 + i * 1.9) * W;
        const nace = 4 + (x / W) * 9;
        const edad = f - nace;
        if (edad < 0 || edad > 14) return null;
        const dir = hh(i * 2.7 + semilla) > 0.5 ? 1 : -1;
        const tam = 3 + hh(i * 4.3) * 4;
        return <div key={i} style={{position: 'absolute', left: x + edad * (hh(i) - 0.5) * 5, top: H / 2 + dir * edad * (4 + hh(i * 7.7) * 12), width: tam, height: tam, borderRadius: '50%', background: '#FFF3D0', boxShadow: '0 0 10px 2px rgba(246,214,150,0.9)', opacity: 1 - edad / 14}} />;
      })}
    </AbsoluteFill>
  );
};

/** Texto dorado con un brillo que lo recorre (luz de 0 a 1); fuera de ese rango el brillo queda fuera del texto */
const Dorado: React.FC<{children: React.ReactNode; size: number; spacing: number; luz: number}> = ({children, size, spacing, luz}) => (
  <span style={{fontFamily: F.clasica, fontWeight: 700, fontSize: size, letterSpacing: spacing, backgroundImage: `linear-gradient(105deg, rgba(255,255,255,0) 43%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 57%), ${ORO_GRAD}`, backgroundSize: '300% 100%, 100% 100%', backgroundPosition: `${(1 - c01(luz)) * 100}% 0, 0 0`, backgroundRepeat: 'no-repeat', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>{children}</span>
);

/** Fondo de los títulos: azul profundo con una luz suave al centro y polvo dorado con profundidad */
const FondoTitulo: React.FC<{op: number; semilla: number}> = ({op, semilla}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: op}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 46%, #17406F 0%, ${NAVY} 52%, ${NAVY2} 100%)`}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 46% 34% at 50% ${44 + Math.sin(f / 50) * 1.5}%, rgba(246,214,150,0.16) 0%, rgba(246,214,150,0) 100%)`}} />
      <Particulas n={90} semilla={semilla} bokeh />
    </AbsoluteFill>
  );
};

/**
 * Título "REACREDITACIÓN COMAEM" con el logo. Todo entra con opacidad, desplazamiento y máscara (sin cambiar
 * el espaciado ni desenfocar el texto, que era lo que se veía trabado). `grande` es la versión del clímax.
 */
const FUEGOS_CLIMAX: Carcasa[] = [
  {at: 2, x: 300, y: 300, r: 300},
  {at: 2, x: 1620, y: 300, r: 300},
  {at: 30, x: 560, y: 170, r: 230},
  {at: 44, x: 1360, y: 170, r: 230},
  {at: 56, x: 190, y: 620, r: 250, sauce: true},
  {at: 56, x: 1730, y: 620, r: 250, sauce: true},
  {at: 84, x: 960, y: 120, r: 190},
  {at: 104, x: 420, y: 240, r: 240},
  {at: 112, x: 1500, y: 240, r: 240},
];
const TituloComaem: React.FC<{dur: number; frase?: string; grande?: boolean}> = ({dur, frase, grande}) => {
  const f = useCurrentFrame();
  const d = s(dur);
  const fondo = tw(f, [0, grande ? 6 : 12], [0, 1]);
  const logo = tw(f, [4, 30], [0, 1]);
  const t1 = tw(f, [14, 44], [0, 1]);
  const linea = tw(f, [26, 56], [0, 1], ease.inOut);
  const t2 = tw(f, [40, 64], [0, 1]);
  const flash = grande ? interpolate(f, [0, 3, 22], [0, 0.7, 0], clamp) : 0;
  return (
    <AbsoluteFill>
      <FondoTitulo op={fondo} semilla={grande ? 3 : 2} />
      {grande && <Fuegos carcasas={FUEGOS_CLIMAX} />}
      <AbsoluteFill style={{transform: `scale(${1 + 0.04 * (f / d)})`}}>
        <Img src={LOGO_COMAEM} style={{position: 'absolute', left: W / 2 - (grande ? 190 : 165), top: grande ? 150 : 170, width: grande ? 380 : 330, opacity: logo, transform: `translateY(${(1 - logo) * 24}px) scale(${0.94 + 0.06 * logo})`, filter: 'drop-shadow(0 0 16px rgba(255,236,196,0.5))'}} />
        <div style={{position: 'absolute', left: 0, width: W, top: grande ? 548 : 520, textAlign: 'center', opacity: Math.min(1, t1 * 1.6), transform: `translateY(${(1 - t1) * 26}px)`, clipPath: `inset(-20% ${(1 - t1) * 50}% -20% ${(1 - t1) * 50}%)`}}>
          <Dorado size={grande ? 98 : 88} spacing={grande ? 8 : 10} luz={interpolate(f, [46, 84], [0, 1], clamp)}>
            REACREDITACIÓN COMAEM
          </Dorado>
        </div>
        <div style={{position: 'absolute', left: W / 2 - 330, top: grande ? 690 : 646, width: 660, height: 2, transform: `scaleX(${linea})`, background: `linear-gradient(90deg, rgba(217,183,106,0), ${ORO}, rgba(217,183,106,0))`}} />
        {frase && <div style={{position: 'absolute', left: 0, width: W, top: grande ? 716 : 672, textAlign: 'center', fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 44, color: CREMA, opacity: t2, transform: `translateY(${(1 - t2) * 16}px)`}}>{frase}</div>}
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#FFF6E2', opacity: flash}} />
    </AbsoluteFill>
  );
};

/** Apertura: logo Westhill sobre negro con polvo dorado y una línea que se dibuja */
const Apertura: React.FC = () => {
  const f = useCurrentFrame();
  const logo = tw(f, [s(1.0), s(2.4)], [0, 1]) * (1 - tw(f, [s(3.6), s(4.5)], [0, 1]));
  const linea = tw(f, [s(1.4), s(3.0)], [0, 1], ease.inOut);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Particulas n={50} op={0.8 * (1 - tw(f, [s(4.4), s(5.6)], [0, 1]))} semilla={1} vel={0.7} />
      <Img src={LOGO_UW} style={{position: 'absolute', left: W / 2 - 260, top: 380, width: 520, opacity: logo, transform: `translateY(${(1 - tw(f, [s(1.0), s(2.4)], [0, 1])) * 14}px) scale(${1.03 - 0.03 * tw(f, [s(1.0), s(4.5)], [0, 1])})`}} />
      <div style={{position: 'absolute', left: W / 2 - 260, top: 632, width: 520, height: 2, transform: `scaleX(${linea})`, background: `linear-gradient(90deg, rgba(217,183,106,0), ${ORO}, rgba(217,183,106,0))`, opacity: logo}} />
    </AbsoluteFill>
  );
};

/** Montaje del clímax: cinco tomas al ritmo de la música, cada una con una palabra clave */
const MONTAJE: [string, number, string][] = [
  ['bonilla', 1.0, 'Calidad'],
  ['b6', 0.6, 'Formación'],
  ['jorge', 2.3, 'Orgullo'],
  ['b1', 14.0, 'Comunidad'],
  ['b9', 1.6, 'Legado'],
];
const Montaje: React.FC = () => {
  const f = useCurrentFrame();
  const paso = COMPAS2 * FPS;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {MONTAJE.map(([src, desde, palabra], i) => {
        const a = Math.round(i * paso);
        const d = Math.round(paso) + 8;
        const k = f - a;
        const p = tw(k, [6, 22], [0, 1]);
        const fuera = tw(k, [d - 14, d - 6], [0, 1]);
        return (
          <Sequence key={i} from={a} durationInFrames={d}>
            <AbsoluteFill style={{opacity: tw(k, [0, 8], [0, 1], ease.inOut), overflow: 'hidden'}}>
              <OffthreadVideo src={vid(src)} startFrom={s(desde)} muted style={{width: W, height: H, objectFit: 'cover', transform: `scale(${1.06 + 0.08 * (k / d)})`, filter: 'contrast(1.06) saturate(1.08)'}} />
              <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(6,16,31,0.15) 40%, rgba(6,16,31,0.78) 100%)'}} />
            </AbsoluteFill>
            <div style={{position: 'absolute', left: 0, width: W, bottom: 120, textAlign: 'center', opacity: Math.min(1, p * 1.5) * (1 - fuera)}}>
              <div style={{overflow: 'hidden', padding: '6px 0'}}>
                <div style={{fontFamily: F.clasica, fontWeight: 700, fontSize: 92, letterSpacing: 14, color: '#fff', textShadow: '0 4px 30px rgba(0,0,0,0.6)', transform: `translateY(${(1 - p) * 100}%)`}}>{palabra.toUpperCase()}</div>
              </div>
              <div style={{width: 260, height: 3, background: ORO_GRAD, margin: '14px auto 0', borderRadius: 2, transform: `scaleX(${p})`}} />
            </div>
          </Sequence>
        );
      })}
      <Particulas n={46} op={0.9} semilla={7} />
    </AbsoluteFill>
  );
};

/** Cortinilla final: logos Westhill y COMAEM, la frase de cierre, polvo dorado y fundido a negro */
const FUEGOS_CIERRE: Carcasa[] = [
  {at: 18, x: 260, y: 300, r: 250, sauce: true},
  {at: 30, x: 1660, y: 300, r: 250, sauce: true},
];
const Cortinilla: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const d = s(dur);
  const fondo = tw(f, [0, 24], [0, 1], ease.inOut);
  const a = tw(f, [14, 46], [0, 1]);
  const linea = tw(f, [34, 72], [0, 1], ease.inOut);
  const b = tw(f, [52, 86], [0, 1]);
  const c = tw(f, [84, 114], [0, 1]);
  const negro = tw(f, [d - 60, d - 10], [0, 1], ease.inOut);
  return (
    <AbsoluteFill>
      <FondoTitulo op={fondo} semilla={5} />
      <Fuegos carcasas={FUEGOS_CIERRE} op={0.8 * fondo} />
      <AbsoluteFill style={{transform: `scale(${1 + 0.04 * (f / d)})`}}>
        <div style={{position: 'absolute', left: 0, width: W, top: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 70, opacity: a, transform: `translateY(${(1 - a) * 20}px)`}}>
          <Img src={LOGO_UW} style={{width: 500}} />
          <div style={{width: 2, height: 190, transform: `scaleY(${linea})`, background: `linear-gradient(180deg, rgba(217,183,106,0), ${ORO}, rgba(217,183,106,0))`}} />
          <Img src={LOGO_COMAEM} style={{width: 250, filter: 'drop-shadow(0 0 10px rgba(255,236,196,0.4))'}} />
        </div>
        <div style={{position: 'absolute', left: W / 2 - 380, top: 596, width: 760, height: 2, transform: `scaleX(${linea})`, background: `linear-gradient(90deg, rgba(217,183,106,0), ${ORO}, rgba(217,183,106,0))`}} />
        <div style={{position: 'absolute', left: 0, width: W, top: 628, textAlign: 'center', opacity: Math.min(1, b * 1.6), transform: `translateY(${(1 - b) * 16}px)`, clipPath: `inset(-20% ${(1 - b) * 50}% -20% ${(1 - b) * 50}%)`}}>
          <Dorado size={50} spacing={12} luz={interpolate(f, [96, 136], [0, 1], clamp)}>
            REACREDITACIÓN COMAEM
          </Dorado>
        </div>
        <div style={{position: 'absolute', left: 200, right: 200, top: 728, textAlign: 'center', fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 46, lineHeight: 1.3, color: CREMA, opacity: c, transform: `translateY(${(1 - c) * 14}px)`}}>“Un compromiso permanente con la calidad de la educación médica.”</div>
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#000', opacity: negro}} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Mezcla: la música baja bajo cada voz y sube en los respiros, el clímax y el cierre
// ---------------------------------------------------------------------------
const TRAMOS_VOZ: [number, number][] = VOCES.map(([, at, a, b]) => [s(at) + 6, s(at + (b - a)) - 4]);
const musicaVol = (fr: number) => {
  const t = fr / FPS;
  // nivel base según la parte de la canción (la intro de piano viene muy baja; el final, muy alto)
  const base = interpolate(t, [0, 30, 34, 110, 160, CLIMAX - 0.5, CLIMAX + 0.3, FIN], [1.5, 1.5, 0.95, 0.85, 0.8, 0.8, 1, 1], clamp);
  let duck = 1;
  for (const [a, b] of TRAMOS_VOZ) {
    const k = interpolate(fr, [a - 12, a, b, b + 18], [0, 1, 1, 0], clamp);
    duck = Math.min(duck, 1 - k * (t < 33 ? 0.42 : 0.68));
  }
  // espacio del Rector: se deja como sonará bajo su voz
  const rector = interpolate(t, [RECTOR_DESDE + 0.4, RECTOR_DESDE + 1.4, CLIMAX - 0.8, CLIMAX], [1, 0.42, 0.42, 1], clamp);
  return base * duck * rector;
};

/** Logo Westhill pequeño en la esquina durante las tomas */
const Mosca: React.FC = () => {
  const f = useCurrentFrame();
  return <Img src={LOGO_UW} style={{position: 'absolute', right: 64, top: 52, width: 190, opacity: 0.6 * tw(f, [20, 60], [0, 1]), filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.55))'}} />;
};

export const Comaem: React.FC = () => {
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence durationInFrames={s(6.0)}>
        <Apertura />
      </Sequence>
      {TOMAS.map((t, i) => (
        <Sequence key={i} from={s(t.at)} durationInFrames={s(t.dur)}>
          <Clip t={t} i={i} />
        </Sequence>
      ))}
      {/* sobre las tomas: viñeta, polvo dorado muy tenue y el logo en la esquina */}
      <Sequence from={s(4.4)} durationInFrames={s(RECTOR_DESDE - 4.4)}>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.42) 100%)'}} />
        <AbsoluteFill style={{mixBlendMode: 'screen'}}>
          <Particulas n={34} op={0.75} semilla={11} vel={0.8} />
        </AbsoluteFill>
        <Mosca />
      </Sequence>
      {/* título después de la Mtra. Elvia */}
      <Sequence from={s(TITULO)} durationInFrames={s(37.2 - TITULO)}>
        <TituloComaem dur={37.2 - TITULO} frase="Un compromiso que se demuestra todos los días" />
      </Sequence>
      {PULSOS.map((t, i) => (
        <Sequence key={t} from={s(t) - PULSO_CORTE} durationInFrames={PULSO_F}>
          <Pulso semilla={i + 1} />
        </Sequence>
      ))}
      {/* cierre */}
      <Sequence from={s(CLIMAX)} durationInFrames={s(COMPAS2 * 3) + 8}>
        <TituloComaem dur={COMPAS2 * 3} grande />
      </Sequence>
      <Sequence from={s(CLIMAX + COMPAS2 * 3)} durationInFrames={s(FRASE - COMPAS2 * 3) + 30}>
        <Montaje />
      </Sequence>
      <Sequence from={s(CLIMAX + FRASE) - 12}>
        <Cortinilla dur={FIN - CLIMAX - FRASE + 0.4} />
      </Sequence>
      <Grain opacity={0.03} />
      <Audio src={staticFile('music/comaem_musica.wav')} volume={musicaVol} />
      {VOCES.map(([n, at, a, b]) => {
        const d = s(b - a);
        return (
          <Sequence key={n} from={s(at)} durationInFrames={d}>
            <Audio src={voz(n)} startFrom={s(a)} volume={(fr) => interpolate(fr, [0, 4, d - 5, d], [0, 1, 1, 0], clamp)} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
export const COMAEM_W = W;
export const COMAEM_H = H;
