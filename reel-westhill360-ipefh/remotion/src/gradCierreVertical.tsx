import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Sfx} from './shots';
import {F, ease, tw} from './theme';
import {LOGO_PNG, LOGO_PUNTOS} from './gradLogoPuntos';

// ---------------------------------------------------------------------------
// Cierre vertical (1080x1920) del video de la graduación de la Generación 2026: la misma idea del cierre del
// video de graduación horizontal (Graduacion.tsx) acomodada a vertical: "¡Felicidades, Generación 2026!",
// huellas de caracal que suben desde las esquinas, pirotecnia en canvas y un cohete cuyas chispas forman el logo.
// Todo se mide en tiempos de la canción (BEAT_F cuadros por tiempo) desde el inicio del cierre.
// ---------------------------------------------------------------------------
const W = 1080;
const H = 1920;
const NAVY = '#0B1B33';
const ORO = '#D9B76A';
const ORO_GRAD = 'linear-gradient(180deg, #F6E3B0 0%, #D9B76A 55%, #A97B35 100%)';
const CREMA = '#F4EEE2';
const LOGO = staticFile('logos/logo_westhill_blanco_total.png');
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const hh = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const c01 = (x: number) => Math.max(0, Math.min(1, x));

export type CierreCfg = {
  /** cuadros por tiempo de la canción */
  beatF: number;
  /** duración total del cierre en cuadros */
  dur: number;
  /** tiempo (desde el inicio del cierre) en que estalla el cohete del logo */
  explotaBeat: number;
  /** fotos para las tiras del fondo (rutas dentro de public/) */
  fotos: string[];
};

// ---------------------------------------------------------------------------
// Piezas
// ---------------------------------------------------------------------------
const Rayos: React.FC<{x: number; y: number; giro: number; op: number; radio?: number}> = ({x, y, giro, op, radio = 1400}) => {
  const mascara = 'radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 32%, rgba(0,0,0,0) 70%)';
  return (
    <div
      style={{
        position: 'absolute',
        left: x - radio,
        top: y - radio,
        width: 2 * radio,
        height: 2 * radio,
        borderRadius: '50%',
        opacity: op,
        mixBlendMode: 'screen',
        background: `repeating-conic-gradient(from ${giro}deg, rgba(255,222,160,0) 0deg, rgba(255,222,160,0.55) 3deg, rgba(255,222,160,0) 8deg, rgba(255,222,160,0) 14deg, rgba(255,240,210,0.35) 16.5deg, rgba(255,222,160,0) 21deg, rgba(255,222,160,0) 30deg)`,
        WebkitMaskImage: mascara,
        maskImage: mascara,
      }}
    />
  );
};

const Destello: React.FC<{at: number; x: number; y: number; s?: number}> = ({at, x, y, s = 44}) => {
  const f = useCurrentFrame();
  const a = f - at;
  if (a < 0 || a > 20) return null;
  const p = Math.sin((a / 20) * Math.PI);
  return (
    <svg viewBox="-10 -10 20 20" style={{position: 'absolute', left: x - s, top: y - s, width: 2 * s, height: 2 * s, transform: `scale(${p}) rotate(${a * 3}deg)`, opacity: p, filter: 'drop-shadow(0 0 8px rgba(255,220,150,0.95))'}}>
      <path d="M0,-10 C0.8,-2.4 2.4,-0.8 10,0 C2.4,0.8 0.8,2.4 0,10 C-0.8,2.4 -2.4,0.8 -10,0 C-2.4,-0.8 -0.8,-2.4 0,-10 Z" fill="#FFF6DC" />
    </svg>
  );
};

export const Dorado: React.FC<{children: React.ReactNode; size: number; spacing?: number; luz?: number}> = ({children, size, spacing = 8, luz}) => {
  const conLuz = luz !== undefined && luz > 0 && luz < 1;
  return (
    <span
      style={{
        fontFamily: F.clasica,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: spacing,
        lineHeight: 1.05,
        backgroundImage: conLuz ? `linear-gradient(105deg, rgba(255,255,255,0) 43%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 57%), ${ORO_GRAD}` : ORO_GRAD,
        backgroundSize: conLuz ? '300% 100%, 100% 100%' : undefined,
        backgroundPosition: conLuz ? `${(1 - luz) * 100}% 0, 0 0` : undefined,
        backgroundRepeat: 'no-repeat',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
      }}
    >
      {children}
    </span>
  );
};

const LogoBlanco: React.FC<{x: number; y: number; w: number; op: number; escala?: number; halo?: number; barrido?: number}> = ({x, y, w, op, escala = 1, halo = 8, barrido}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, opacity: op, transform: `scale(${escala})`, filter: `drop-shadow(0 0 ${halo}px rgba(255,214,150,0.55))`}}>
    <Img src={LOGO} style={{width: '100%', display: 'block', opacity: 0.94}} />
    {barrido !== undefined && barrido > -0.15 && barrido < 1.15 && (
      <Img src={LOGO} style={{position: 'absolute', left: 0, top: 0, width: '100%', clipPath: `polygon(${(barrido - 0.07) * 100}% 0, ${(barrido + 0.07) * 100}% 0, ${(barrido + 0.01) * 100}% 100%, ${(barrido - 0.13) * 100}% 100%)`, filter: 'brightness(1.8) drop-shadow(0 0 5px rgba(255,255,255,0.9))'}} />
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Pirotecnia
// ---------------------------------------------------------------------------
type TipoF = 'peonia' | 'crisantemo' | 'sauce' | 'anillo' | 'palma' | 'doble';
type Carcasa = {at: number; x: number; y: number; r: number; tipo: TipoF; col: string; col2: string; seed: number; son: number};
const CFG: Record<TipoF, {n: number; vida: number; g: number; lag: number; w: number}> = {
  peonia: {n: 150, vida: 58, g: 70, lag: 4, w: 2.4},
  crisantemo: {n: 170, vida: 72, g: 95, lag: 9, w: 1.8},
  sauce: {n: 140, vida: 124, g: 340, lag: 16, w: 1.7},
  anillo: {n: 96, vida: 56, g: 50, lag: 4, w: 2.6},
  palma: {n: 150, vida: 86, g: 210, lag: 10, w: 2.6},
  doble: {n: 220, vida: 62, g: 70, lag: 4, w: 2.3},
};
const C_ORO = '255,214,140';
const C_BLA = '255,250,240';
const C_CHA = '246,227,176';
const C_AZU = '170,214,255';
const C_ROS = '255,196,170';
const C_PLA = '214,228,255';
const SUBE = 26;

// geometría del logo hecho de chispas
const LOGO_W = 800;
const LOGO_X = W / 2 - LOGO_W / 2;
const LOGO_Y = 640;
const LOGO_K = LOGO_W / LOGO_PNG.w;
const LOGO_ALTO = LOGO_PNG.h * LOGO_K;
const CENTRO_LOGO = {x: W / 2, y: LOGO_Y + LOGO_ALTO / 2};

type Tiempos = {cb: (k: number) => number; explota: number; cohete: number; forma: number; dur: number};
const tiempos = (c: CierreCfg): Tiempos => {
  const cb = (k: number) => Math.round(k * c.beatF);
  const explota = cb(c.explotaBeat);
  return {cb, explota, cohete: explota - 40, forma: explota + 118, dur: c.dur};
};

const carcasas = (T: Tiempos): Carcasa[] => {
  const {cb} = T;
  const r: Carcasa[] = [];
  let s = 1;
  const add = (at: number, x: number, y: number, rad: number, tipo: TipoF, col: string, son = 0, col2 = C_BLA) => r.push({at, x, y, r: rad, tipo, col, col2, seed: s++, son});
  // 1. mientras entran el texto y las huellas: una cada dos tiempos, arriba y a los lados del texto
  const P1 = [
    [230, 260],
    [850, 220],
    [540, 140],
    [180, 1180],
    [900, 1220],
    [700, 300],
    [330, 170],
    [920, 1040],
    [160, 980],
  ];
  const T1: TipoF[] = ['peonia', 'crisantemo', 'anillo', 'doble', 'palma', 'peonia', 'sauce', 'crisantemo', 'doble'];
  const K1 = [C_ORO, C_BLA, C_AZU, C_CHA, C_ORO, C_ROS, C_ORO, C_PLA, C_CHA];
  let j = 0;
  for (let k = 2; k < 20; k += 2) {
    const [x, y] = P1[j % P1.length];
    add(cb(k), x, y, 230 + (j % 3) * 40, T1[j % T1.length], K1[j % K1.length], 0.16);
    if (k % 4 === 0) add(cb(k) + 4, W - x, y + 60, 200, T1[(j + 3) % T1.length], K1[(j + 4) % K1.length]);
    j += 1;
  }
  // 2. crescendo: una por tiempo y luego dos por tiempo, por todo el cielo
  const T2: TipoF[] = ['crisantemo', 'peonia', 'doble', 'sauce', 'palma', 'anillo'];
  const K2 = [C_ORO, C_BLA, C_AZU, C_ROS, C_CHA, C_PLA];
  const finSalva = T.cohete - 30;
  let m = 0;
  for (let k = 20; cb(k) < finSalva - 8; k += k < 25 ? 1 : 0.5) {
    const arriba = m % 3 !== 2;
    add(cb(k), 120 + hh(k * 3.3) * 840, arriba ? 120 + hh(k * 7.1) * 560 : 1000 + hh(k * 5.7) * 380, 250 + hh(k) * 110, T2[m % T2.length], K2[m % K2.length], m % 2 ? 0 : 0.2);
    m += 1;
  }
  // 3. salva final: cinco a la vez
  [150, 345, 540, 735, 930].forEach((x, i) => add(finSalva + i * 2, x, [420, 300, 230, 300, 420][i], 280, 'crisantemo', i % 2 ? C_BLA : C_ORO, i === 2 ? 0.34 : 0));
  // 4. ya con el logo: fuegos arriba y abajo del logo, sin taparlo
  const F0 = T.forma;
  add(F0 + 10, 200, 330, 240, 'sauce', C_ORO, 0.2);
  add(F0 + 10, 880, 330, 240, 'sauce', C_ORO);
  add(F0 + 40, 360, 180, 200, 'peonia', C_BLA, 0.16);
  add(F0 + 40, 720, 180, 200, 'peonia', C_BLA);
  add(F0 + 66, 190, 1340, 200, 'anillo', C_AZU, 0.14);
  add(F0 + 66, 890, 1340, 200, 'anillo', C_AZU);
  [
    [170, 420],
    [355, 250],
    [540, 190],
    [725, 250],
    [910, 420],
  ].forEach(([x, y], i) => add(F0 + 94 + i * 3, x, y, i === 2 ? 150 : 190, 'doble', C_ORO, i === 2 ? 0.3 : 0));
  add(F0 + 124, 260, 1420, 230, 'sauce', C_CHA, 0.16);
  add(F0 + 124, 820, 1420, 230, 'sauce', C_CHA);
  add(F0 + 146, 400, 200, 190, 'peonia', C_ROS, 0.14);
  add(F0 + 146, 680, 200, 190, 'peonia', C_ROS);
  return r;
};

type Fuente = {x: number; a: number; b: number; alto: number};
const fuentes = (T: Tiempos): Fuente[] => [
  ...[150, 410, 670, 930].map((x) => ({x, a: T.cb(24), b: T.cohete - 22, alto: 420})),
  ...[110, 330, 750, 970].map((x) => ({x, a: T.forma + 20, b: T.dur - 70, alto: 380})),
];

const dirChispa = (c: Carcasa, i: number): [number, number, number, boolean] => {
  const n = CFG[c.tipo].n;
  if (c.tipo === 'anillo') {
    const th = (i / n) * Math.PI * 2;
    const incl = hh(c.seed * 3.1) * Math.PI;
    const ex = Math.cos(th);
    const ey = Math.sin(th) * 0.42;
    return [ex * Math.cos(incl) - ey * Math.sin(incl), ex * Math.sin(incl) + ey * Math.cos(incl), 1, false];
  }
  if (c.tipo === 'palma') {
    const brazo = i % 9;
    const th = (brazo / 9) * Math.PI * 2 + hh(c.seed) * 6 + (hh(i * 1.3 + c.seed) - 0.5) * 0.09;
    return [Math.cos(th), Math.sin(th), 0.3 + 0.7 * hh(i * 2.7 + c.seed), false];
  }
  const u = hh(c.seed * 13.1 + i * 1.17) * 2 - 1;
  const th = hh(c.seed * 7.3 + i * 2.31) * Math.PI * 2;
  const rr = Math.sqrt(1 - u * u);
  const dentro = c.tipo === 'doble' && i % 5 < 2;
  return [rr * Math.cos(th), rr * Math.sin(th), (dentro ? 0.46 : 1) * (0.9 + 0.1 * hh(i * 5.3 + c.seed)), dentro];
};
const FRENO = 1 - Math.exp(-4);

const Pirotecnia: React.FC<{cs: Carcasa[]; fs: Fuente[]}> = ({cs, fs}) => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const c of cs) {
      const cfg = CFG[c.tipo];
      const t = f - c.at;
      if (t < -SUBE || t > cfg.vida) continue;
      if (t < 0) {
        const lado = c.seed % 2 ? 1 : -1;
        const x0 = c.x + lado * (40 + 50 * hh(c.seed));
        const pos = (k: number): [number, number] => {
          const e = 1 - Math.pow(1 - c01(k), 2);
          return [x0 + (c.x - x0) * e, H + 30 + (c.y - H - 30) * e];
        };
        const k = (t + SUBE) / SUBE;
        const [hx, hy] = pos(k);
        const [tx, ty] = pos(k - 0.14);
        const g = ctx.createLinearGradient(tx, ty, hx, hy);
        g.addColorStop(0, 'rgba(255,200,120,0)');
        g.addColorStop(1, 'rgba(255,246,222,0.95)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(hx, hy);
        ctx.stroke();
        for (let q = 0; q < 8; q++) {
          const [sx, sy] = pos(k - q * 0.022);
          ctx.fillStyle = `rgba(255,214,150,${0.55 * (1 - q / 8)})`;
          ctx.beginPath();
          ctx.arc(sx + (hh(q * 3.3 + f * 1.7 + c.seed) - 0.5) * 12, sy + q * 3, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        continue;
      }
      if (t < 14) {
        const fl = 1 - t / 14;
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r * 2.2);
        g.addColorStop(0, `rgba(255,244,214,${0.55 * fl})`);
        g.addColorStop(0.18, `rgba(${c.col},${0.26 * fl})`);
        g.addColorStop(1, `rgba(${c.col},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(c.x - c.r * 2.2, c.y - c.r * 2.2, c.r * 4.4, c.r * 4.4);
      }
      const u = t / cfg.vida;
      const chispea = c.tipo === 'crisantemo' || c.tipo === 'sauce';
      const pos = (dx: number, dy: number, v: number, tt: number): [number, number] => {
        const uu = c01(tt / cfg.vida);
        const e = (1 - Math.exp(-4 * uu)) / FRENO;
        return [c.x + dx * c.r * v * e, c.y + dy * c.r * v * e + cfg.g * uu * uu];
      };
      ctx.lineWidth = cfg.w;
      for (let i = 0; i < cfg.n; i++) {
        const [dx, dy, v, dentro] = dirChispa(c, i);
        let a = u < 0.6 ? 1 : 1 - (u - 0.6) / 0.4;
        if (chispea && u > 0.42) a *= hh(i * 3.7 + f * 0.61 + c.seed) > 0.42 ? 1 : 0.2;
        if (a < 0.02) continue;
        const col = dentro ? c.col2 : u < 0.14 ? C_BLA : c.col;
        const [hx, hy] = pos(dx, dy, v, t);
        const [mx, my] = pos(dx, dy, v, t - cfg.lag * 0.5);
        const [tx, ty] = pos(dx, dy, v, t - cfg.lag);
        ctx.strokeStyle = `rgba(${col},${a * 0.3})`;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(mx, my);
        ctx.stroke();
        ctx.strokeStyle = `rgba(${col},${a * 0.85})`;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(hx + 0.01, hy);
        ctx.stroke();
        if (i % 3 === 0) {
          ctx.fillStyle = `rgba(${col},${a * 0.16})`;
          ctx.beginPath();
          ctx.arc(hx, hy, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    // fuentes de chispas en el piso
    const VIDA = 30;
    const RITMO = 5;
    ctx.lineWidth = 2;
    for (const fu of fs) {
      if (f < fu.a || f > fu.b + VIDA) continue;
      const j0 = Math.max(0, Math.floor((f - VIDA - fu.a) * RITMO));
      const j1 = Math.floor((Math.min(f, fu.b) - fu.a) * RITMO);
      const pos = (j: number, edad: number): [number, number] => {
        const uu = edad / VIDA;
        const v = fu.alto * (0.7 + 0.3 * hh(j * 3.1 + fu.x));
        return [fu.x + (hh(j * 1.7 + fu.x) - 0.5) * 0.5 * fu.alto * uu, H + 6 - (2.4 * v * uu - 1.6 * fu.alto * uu * uu)];
      };
      for (let j = j0; j <= j1; j++) {
        const edad = f - (fu.a + j / RITMO);
        if (edad < 0 || edad > VIDA) continue;
        const a = (1 - edad / VIDA) * (hh(j * 2.3 + f * 0.9) > 0.3 ? 1 : 0.35);
        const [hx, hy] = pos(j, edad);
        const [tx, ty] = pos(j, Math.max(0, edad - 2));
        ctx.strokeStyle = `rgba(${j % 4 === 0 ? C_BLA : C_ORO},${a})`;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(hx + 0.01, hy);
        ctx.stroke();
      }
    }
  }, [f, cs, fs]);
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, filter: 'drop-shadow(0 0 7px rgba(255,214,150,0.85))'}} />;
};

// ---------------------------------------------------------------------------
// Cohete cuyas chispas forman el logo
// ---------------------------------------------------------------------------
const CHISPA_COL = ['255,236,190', '255,255,255', '246,214,140', '255,246,222'];
const CHISPAS = Array.from({length: LOGO_PUNTOS.length / 2}, (_, i) => ({
  tx: LOGO_X + LOGO_PUNTOS[2 * i] * LOGO_K,
  ty: LOGO_Y + LOGO_PUNTOS[2 * i + 1] * LOGO_K,
  ang: random(`la${i}`) * Math.PI * 2,
  vel: 200 + 420 * Math.sqrt(random(`lv${i}`)),
  espera: 26 + 20 * random(`le${i}`),
  viaje: 46 + 24 * random(`lj${i}`),
  fase: random(`lf${i}`) * Math.PI * 2,
  col: CHISPA_COL[i % CHISPA_COL.length],
  queda: i % 7 === 0,
}));
const posChispa = (c: (typeof CHISPAS)[number], t: number): [number, number, number] => {
  const e = 1 - Math.pow(1 - Math.min(1, Math.max(0, t) / 24), 3);
  const libre = Math.max(0, t) / 40;
  const ex = CENTRO_LOGO.x + Math.cos(c.ang) * c.vel * e;
  const ey = CENTRO_LOGO.y + Math.sin(c.ang) * c.vel * e * 1.15 + 70 * libre * libre;
  const k = c01((t - c.espera) / c.viaje);
  const s = k * k * (3 - 2 * k);
  const px = ex + (c.tx - ex) * s - CENTRO_LOGO.x;
  const py = ey + (c.ty - ey) * s - CENTRO_LOGO.y;
  const phi = 0.6 * Math.sin(Math.PI * s);
  return [CENTRO_LOGO.x + px * Math.cos(phi) - py * Math.sin(phi), CENTRO_LOGO.y + px * Math.sin(phi) + py * Math.cos(phi), k];
};
const N_POLVO = 1500;
const LogoFuego: React.FC<{T: Tiempos}> = ({T}) => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const t = f - T.explota;
  const funde = tw(f, [T.forma, T.forma + 50], [0, 1], ease.inOut);
  const resto = 1 - tw(f, [T.forma + 30, T.forma + 130], [0, 1]);
  useLayoutEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    if (t < 0) {
      const k = (t + 40) / 40;
      const pos = (kk: number): [number, number] => {
        const c = 1 - Math.pow(1 - c01(kk), 2.2);
        return [CENTRO_LOGO.x + 60 * Math.pow(1 - c, 1.5), H + 40 + (CENTRO_LOGO.y - H - 40) * c];
      };
      const [hx, hy] = pos(k);
      const [cx, cy] = pos(k - 0.2);
      const g = ctx.createLinearGradient(cx, cy, hx, hy);
      g.addColorStop(0, 'rgba(255,200,120,0)');
      g.addColorStop(1, 'rgba(255,248,228,1)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(hx, hy);
      ctx.stroke();
      const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, 70);
      halo.addColorStop(0, 'rgba(255,244,214,0.75)');
      halo.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(hx - 70, hy - 70, 140, 140);
      for (let j = 0; j < 46; j++) {
        const kk = k - j * 0.012;
        if (kk < 0) break;
        const [sx, sy] = pos(kk);
        ctx.fillStyle = `rgba(255,214,150,${0.7 * (1 - j / 46)})`;
        ctx.beginPath();
        ctx.arc(sx + (hh(j * 2.1 + f * 1.3) - 0.5) * (8 + j * 0.8), sy + j * 1.6 * hh(j + f), 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    [0, 9].forEach((ret) => {
      const tt = t - ret;
      if (tt < 0 || tt > 46) return;
      const p = 1 - Math.pow(1 - tt / 46, 2.4);
      ctx.strokeStyle = `rgba(255,236,196,${0.55 * (1 - tt / 46)})`;
      ctx.lineWidth = 7 * (1 - tt / 46) + 1;
      ctx.beginPath();
      ctx.arc(CENTRO_LOGO.x, CENTRO_LOGO.y, 50 + p * 1300, 0, Math.PI * 2);
      ctx.stroke();
    });
    for (let i = 0; i < N_POLVO; i++) {
      const vida = 105 + hh(i * 1.9) * 50;
      if (t > vida) continue;
      const ang = hh(i * 3.3) * Math.PI * 2;
      const vel = 220 + 760 * Math.sqrt(hh(i * 7.7));
      const pos = (tt: number): [number, number] => {
        const e = (1 - Math.exp(-4.4 * c01(tt / 60))) / (1 - Math.exp(-4.4));
        const uu = tt / 120;
        return [CENTRO_LOGO.x + Math.cos(ang) * vel * e * 0.8, CENTRO_LOGO.y + Math.sin(ang) * vel * e * 1.3 + 300 * uu * uu];
      };
      const u = t / vida;
      const a = (u < 0.5 ? 1 : 1 - (u - 0.5) / 0.5) * (t > 22 && hh(i * 2.7 + f * 0.53) < 0.4 ? 0.15 : 1) * 0.8;
      if (a < 0.03) continue;
      const [hx, hy] = pos(t);
      const [tx, ty] = pos(Math.max(0, t - (t < 30 ? 5 : 2)));
      ctx.strokeStyle = `rgba(${i % 5 === 0 ? C_BLA : i % 5 === 1 ? C_CHA : C_ORO},${a})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(hx + 0.01, hy);
      ctx.stroke();
    }
    const ola = interpolate(f, [T.forma - 30, T.forma + 8], [LOGO_X - 120, LOGO_X + LOGO_W + 120]);
    for (const c of CHISPAS) {
      const [hx, hy, k] = posChispa(c, t);
      const [cx, cy] = posChispa(c, t - (k < 1 ? 5 : 1));
      const titila = k >= 1 ? 0.7 + 0.3 * Math.sin(f * 0.35 + c.fase) : 1;
      const vivo = c.queda ? Math.max(1 - funde, resto * 0.8) : 1 - funde;
      const luz = k >= 1 ? Math.exp(-Math.pow((c.tx - ola) / 70, 2)) : 0;
      const a = Math.min(1, t / 3) * Math.min(1, titila + luz) * vivo;
      if (a <= 0.01) continue;
      ctx.strokeStyle = `rgba(${c.col},${a * (k < 1 ? 0.55 : 0.5)})`;
      ctx.lineWidth = k < 1 ? 1.5 : 1.6;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(hx + 0.01, hy);
      ctx.stroke();
      ctx.fillStyle = `rgba(${c.col},${a})`;
      ctx.beginPath();
      ctx.arc(hx, hy, (k < 1 ? 1.9 : 1.5) + 2.2 * luz, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [f, t, funde, resto, T]);
  if (t < -40 || f > T.forma + 140) return null;
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, filter: 'drop-shadow(0 0 5px rgba(255,214,150,0.85))'}} />;
};

// ---------------------------------------------------------------------------
// Huellas de caracal: dos caminos suben desde las esquinas de abajo y se encuentran al centro
// ---------------------------------------------------------------------------
const HUELLA_ORO = staticFile('logos/huella_caracal_oro.png');
const HUELLA_LUZ = staticFile('logos/huella_caracal.png');
const PASOS = 8;
const HUELLA_GRANDE = PASOS + 1;
const HUELLA_Y = 1530;
type Pisada = {x: number; y: number; rot: number; at: number; S: number; k: number};
const pisadas = (desde: number, beatF: number): Pisada[] => {
  const r: Pisada[] = [];
  [-1, 1].forEach((lado) => {
    const p0 = [W / 2 + lado * 560, 1960];
    const c = [W / 2 + lado * 400, 1700];
    const p1 = [W / 2 + lado * 120, HUELLA_Y + 40];
    for (let k = 0; k < PASOS; k++) {
      const u = (k + 0.5) / PASOS;
      const bx = (1 - u) * (1 - u) * p0[0] + 2 * u * (1 - u) * c[0] + u * u * p1[0];
      const by = (1 - u) * (1 - u) * p0[1] + 2 * u * (1 - u) * c[1] + u * u * p1[1];
      const dx = 2 * (1 - u) * (c[0] - p0[0]) + 2 * u * (p1[0] - c[0]);
      const dy = 2 * (1 - u) * (c[1] - p0[1]) + 2 * u * (p1[1] - c[1]);
      const ang = Math.atan2(dy, dx);
      const pie = k % 2 ? 1 : -1;
      r.push({x: bx - Math.sin(ang) * 24 * pie, y: by + Math.cos(ang) * 24 * pie, rot: (ang * 180) / Math.PI + 90 + pie * 6, at: desde + Math.round(k * beatF), S: 66, k: k + (lado > 0 ? 50 : 0)});
    }
  });
  r.push({x: W / 2, y: HUELLA_Y, rot: 0, at: desde + Math.round(HUELLA_GRANDE * beatF), S: 140, k: 99});
  return r;
};
const Huellas: React.FC<{desde: number; beatF: number; atenua: number}> = ({desde, beatF, atenua}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {pisadas(desde, beatF).map(({x, y, rot, at, S, k}) => {
        const a = f - at;
        if (a < 0) return null;
        const grande = S > 100;
        const e = tw(a, [0, grande ? 18 : 12], [0, 1]);
        const luz = interpolate(a, [0, 3, grande ? 60 : 36], [0, 1, grande ? 0.35 : 0], clamp);
        const onda = tw(a, [0, grande ? 40 : 28], [0, 1]);
        const ondaR = grande ? 220 : 80;
        const brilla = 0.88 + 0.12 * Math.sin(f / 11 + k);
        const chispas = grande ? 16 : 6;
        return (
          <React.Fragment key={k}>
            <div style={{position: 'absolute', left: x - S / 3 - ondaR * onda, top: y - S / 3 - ondaR * onda, width: (2 * S) / 3 + 2 * ondaR * onda, height: (2 * S) / 3 + 2 * ondaR * onda, borderRadius: '50%', border: `${grande ? 3 : 2}px solid #F6E3B0`, opacity: 0.75 * (1 - onda) * atenua}} />
            {Array.from({length: chispas}, (_, c) => {
              const ca = random(`ch${k}-${c}`) * Math.PI * 2;
              const cd = (grande ? 90 : 30) + (grande ? 120 : 40) * random(`cd${k}-${c}`);
              const cv = tw(a, [0, grande ? 34 : 22], [0, 1]);
              return <div key={c} style={{position: 'absolute', left: x + Math.cos(ca) * cd * cv - 2.5, top: y + Math.sin(ca) * cd * cv - 2.5 - 14 * cv, width: 5, height: 5, borderRadius: '50%', background: '#FFF3D0', boxShadow: '0 0 8px #F6E3B0', opacity: (1 - cv) * atenua}} />;
            })}
            <div style={{position: 'absolute', left: x - S / 2, top: y - S / 2, width: S, height: S, opacity: Math.min(1, a / 4) * atenua * brilla, transform: `rotate(${rot}deg) scale(${(grande ? 1.5 : 1.3) - (grande ? 0.5 : 0.3) * e})`, filter: `drop-shadow(0 0 ${6 + (grande ? 26 : 16) * luz}px rgba(255,206,125,${0.5 + 0.45 * luz}))`}}>
              <Img src={HUELLA_ORO} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
              <Img src={HUELLA_LUZ} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.85 * luz}} />
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Cierre
// ---------------------------------------------------------------------------
const HUELLAS_DESDE = 124;
export const CierreVertical: React.FC<{cfg: CierreCfg}> = ({cfg}) => {
  const f = useCurrentFrame();
  const T = React.useMemo(() => tiempos(cfg), [cfg]);
  const cs = React.useMemo(() => carcasas(T), [T]);
  const fs = React.useMemo(() => fuentes(T), [T]);
  const {explota: EXPLOTA_F, cohete: COHETE_F, forma: FORMA_F, dur: CIERRE_F, cb} = T;
  const t1 = tw(f, [10, 36], [0, 1]);
  const t2 = tw(f, [40, 70], [0, 1]);
  const t2b = tw(f, [52, 84], [0, 1]);
  const t3 = tw(f, [90, 116], [0, 1]);
  const logo = tw(f, [FORMA_F, FORMA_F + 50], [0, 1], ease.inOut);
  const gen = tw(f, [FORMA_F + 46, FORMA_F + 80], [0, 1]);
  const ocultaTexto = tw(f, [COHETE_F - 14, COHETE_F + 10], [0, 1]);
  const negro = tw(f, [CIERRE_F - 44, CIERRE_F - 4], [0, 1]);
  const te = f - EXPLOTA_F;
  const destello = interpolate(te, [0, 2, 22], [0, 0.85, 0], clamp);
  const rayos = interpolate(f, [EXPLOTA_F, EXPLOTA_F + 12, FORMA_F, FORMA_F + 40, CIERRE_F - 40], [0, 0.5, 0.22, 0.34, 0.24], clamp);
  const lente = interpolate(f, [FORMA_F - 6, FORMA_F + 8, FORMA_F + 46], [0, 1, 0], clamp);
  const fotosOp = 0.3 - 0.14 * tw(f, [COHETE_F - 20, COHETE_F + 20], [0, 1]);
  const enciende = interpolate(f - (HUELLAS_DESDE + Math.round(HUELLA_GRANDE * cfg.beatF)), [0, 4, 50], [0, 1, 0.35], clamp);
  const entra = tw(f, [0, 16], [0, 1]);
  const filas = [0, 1, 2, 3, 4];
  return (
    <AbsoluteFill style={{background: NAVY, overflow: 'hidden'}}>
      {/* cinco tiras de fotos de la ceremonia que corren en sentidos opuestos */}
      <AbsoluteFill style={{opacity: fotosOp * entra, filter: 'grayscale(0.3)'}}>
        {filas.map((r) => {
          const dir = r % 2 ? 1 : -1;
          const largo = 12 * 296;
          const x = (dir * f * 2.0 + r * 140) % largo;
          return (
            <div key={r} style={{position: 'absolute', top: 30 + r * 380, left: dir > 0 ? x - largo : x, display: 'flex', gap: 16}}>
              {Array.from({length: 24}, (_, k) => cfg.fotos[(r * 5 + k * 3) % cfg.fotos.length]).map((p, k) => (
                <Img key={k} src={staticFile(p)} style={{width: 280, height: 360, objectFit: 'cover'}} />
              ))}
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 60% at 50% 42%, rgba(11,27,51,0.93) 0%, rgba(11,27,51,0.72) 50%, rgba(11,27,51,0.4) 100%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(11,27,51,0) 62%, rgba(11,27,51,0.85) 100%)'}} />
      {rayos > 0 && <Rayos x={CENTRO_LOGO.x} y={CENTRO_LOGO.y} giro={f * 0.2} op={rayos} radio={1500} />}
      <Pirotecnia cs={cs} fs={fs} />
      <Huellas desde={HUELLAS_DESDE} beatF={cfg.beatF} atenua={1 - 0.4 * logo} />
      <div style={{position: 'absolute', top: 470, width: '100%', textAlign: 'center', opacity: 1 - ocultaTexto, transform: `scale(${1 + ocultaTexto * 0.05})`, filter: ocultaTexto > 0 ? `blur(${ocultaTexto * 8}px)` : undefined}}>
        <div style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 100, color: CREMA, opacity: t1, filter: `blur(${(1 - t1) * 10}px)`, textShadow: '0 4px 30px rgba(0,0,0,0.6)'}}>¡Felicidades,</div>
        <div style={{marginTop: 18, transform: `scale(${0.9 + 0.1 * t2})`, opacity: t2, filter: `blur(${(1 - t2) * 10}px) drop-shadow(0 6px 26px rgba(0,0,0,0.55))`}}>
          <Dorado size={90} spacing={6} luz={interpolate(f % 150, [72, 112], [0, 1], clamp)}>
            GENERACIÓN
          </Dorado>
        </div>
        <div style={{marginTop: 4, transform: `scale(${0.9 + 0.1 * t2b})`, opacity: t2b, filter: `blur(${(1 - t2b) * 10}px) drop-shadow(0 6px 26px rgba(0,0,0,0.55))`}}>
          <Dorado size={190} spacing={10} luz={interpolate(f % 150, [80, 120], [0, 1], clamp)}>
            2026!
          </Dorado>
        </div>
        <div style={{marginTop: 46, fontFamily: F.sans, fontWeight: 600, fontSize: 46, lineHeight: 1.35, letterSpacing: 2, color: CREMA, opacity: t3, textShadow: '0 2px 18px rgba(0,0,0,0.7)'}}>
          Gracias por dejar
          <br />
          <span style={{fontFamily: F.serif, fontStyle: 'italic', fontSize: 60, letterSpacing: 1, color: ORO, textShadow: `0 0 ${24 * enciende}px rgba(255,214,140,${enciende})`}}>huella</span> en Westhill.
        </div>
      </div>
      <Destello at={64} x={150} y={640} s={40} />
      <Destello at={72} x={W - 150} y={760} s={48} />
      <LogoFuego T={T} />
      {lente > 0 && (
        <AbsoluteFill style={{mixBlendMode: 'screen', opacity: lente}}>
          <div style={{position: 'absolute', left: CENTRO_LOGO.x - 700 * (0.4 + 0.6 * lente), top: CENTRO_LOGO.y - 5, width: 1400 * (0.4 + 0.6 * lente), height: 10, borderRadius: 5, filter: 'blur(3px)', background: 'linear-gradient(90deg, rgba(255,230,180,0) 0%, rgba(255,240,210,0.95) 50%, rgba(255,230,180,0) 100%)'}} />
          <div style={{position: 'absolute', left: CENTRO_LOGO.x - 520, top: CENTRO_LOGO.y - 300, width: 1040, height: 600, background: 'radial-gradient(ellipse, rgba(255,236,196,0.45) 0%, rgba(255,214,150,0.14) 40%, rgba(255,214,150,0) 70%)'}} />
        </AbsoluteFill>
      )}
      <LogoBlanco x={LOGO_X} y={LOGO_Y} w={LOGO_W} op={logo} escala={1.05 - 0.05 * logo} halo={8 + 22 * (1 - logo)} barrido={interpolate(f, [FORMA_F + 58, FORMA_F + 96], [-0.2, 1.2])} />
      <div style={{position: 'absolute', top: LOGO_Y + LOGO_ALTO + 40, width: '100%', textAlign: 'center', opacity: gen}}>
        <div style={{width: 560 * gen, height: 2, margin: '0 auto 26px', background: `linear-gradient(90deg, rgba(217,183,106,0), ${ORO}, rgba(217,183,106,0))`}} />
        <div style={{transform: `translateY(${(1 - gen) * 12}px)`, filter: gen < 1 ? `blur(${(1 - gen) * 6}px)` : undefined}}>
          <Dorado size={60} spacing={14 + (1 - gen) * 30} luz={interpolate(f, [FORMA_F + 92, FORMA_F + 128], [0, 1], clamp)}>
            GENERACIÓN 2026
          </Dorado>
        </div>
      </div>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(255,250,236,1) 0%, rgba(255,226,170,0.9) 35%, rgba(255,200,120,0.5) 100%)', opacity: destello}} />
      {cs.filter((c) => c.son > 0).map((c) => (
        <Sfx key={c.seed} at={c.at} name="fw_boom" volume={c.son} />
      ))}
      <Sfx at={cb(24)} name="fw_crackle" volume={0.12} />
      <Sfx at={cb(27)} name="fw_crackle" volume={0.14} />
      <Sfx at={COHETE_F} name="fw_silbido" volume={0.3} />
      <Sfx at={EXPLOTA_F} name="fw_boom_grande" volume={0.6} />
      <Sfx at={EXPLOTA_F} name="down_bass" volume={0.7} />
      <Sfx at={EXPLOTA_F + 14} name="fw_crackle" volume={0.26} />
      <Sfx at={EXPLOTA_F + 70} name="fw_crackle" volume={0.16} />
      <Sfx at={FORMA_F + 30} name="fw_crackle" volume={0.12} />
      <AbsoluteFill style={{background: '#000', opacity: negro}} />
    </AbsoluteFill>
  );
};
