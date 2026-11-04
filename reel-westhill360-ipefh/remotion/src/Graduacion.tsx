import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from './components';
import {Sfx} from './shots';
import {F, ease, tw} from './theme';
import {FOTOS} from './gradFotos';

// ---------------------------------------------------------------------------
// Video interno de graduación (1920x1080, para proyector) con "Happier" (Marshmello ft. Bastille, 100 BPM).
//  1. Intro tranquila (0–28 s): frases emotivas en negro y el logo con "Generación 2026".
//  2. Desde el coro (28.08 s) las fotos por facultad: portada de la facultad y luego espacios de 4 tiempos
//     (2.4 s) que alternan foto sola, trío, tira de película y collage de 4.
//  3. Un interludio con frase a mitad del video y el cierre con "¡Felicidades, Generación 2026!".
// Preparado para voz en off: la prop `voz` (archivo en public/) entra en VOZ_DESDE y baja la música mientras suena.
// Una facultad sin fotos (Derecho, por ahora) no aparece; al agregar sus fotos a gradFotos.ts entra sola.
// ---------------------------------------------------------------------------
const W = 1920;
const H = 1080;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const BEAT = 0.5986 * 30; // cuadros por tiempo
const CORO = 28.08; // entrada del coro en la canción
const SLOT = 4 * BEAT;
const NAVY = '#0B1B33';
const ORO = '#D9B76A';
const ORO_GRAD = 'linear-gradient(180deg, #F6E3B0 0%, #D9B76A 55%, #A97B35 100%)';
const CREMA = '#F4EEE2';

const FACULTADES: {key: string; nombre: string}[] = [
  {key: 'Arquitectura', nombre: 'Arquitectura y Diseño del Espacio'},
  {key: 'Derecho', nombre: 'Derecho y Estudios Internacionales'},
  {key: 'Negocios', nombre: 'Negocios'},
  {key: 'Odontologia', nombre: 'Odontología'},
  {key: 'Psicologia', nombre: 'Psicología y Ciencias de la Educación'},
];
const foto = (fac: string, n: string) => staticFile(`photos/grad/${fac}/${n}`);

// ---------------------------------------------------------------------------
// Línea de tiempo (se calcula en tiempos de la canción para que todo caiga en el ritmo)
// ---------------------------------------------------------------------------
type Tipo = 'single' | 'trio' | 'strip' | 'quad';
const PATRON: Tipo[] = ['single', 'trio', 'single', 'strip', 'quad'];
const CUANTAS: Record<Tipo, number> = {single: 1, trio: 3, strip: 4, quad: 4};
type Item =
  | {k: 'portada'; fac: string; nombre: string; num: number; beats: number}
  | {k: 'fotos'; fac: string; tipo: Tipo; fotos: [string, number, number][]; beats: number}
  | {k: 'frase'; arriba: string; grande: string; beats: number};
const INTERLUDIO: Item = {k: 'frase', arriba: 'Lo que aprendiste aquí', grande: 'no se queda aquí: va contigo.', beats: 12};
const ITEMS: Item[] = (() => {
  const r: Item[] = [];
  let num = 0;
  FACULTADES.forEach(({key, nombre}) => {
    const fs = FOTOS[key] ?? [];
    if (!fs.length) return;
    num += 1;
    if (key === 'Psicologia') r.push(INTERLUDIO);
    r.push({k: 'portada', fac: key, nombre, num, beats: 4});
    let i = 0;
    let p = 0;
    while (i < fs.length) {
      let tipo = PATRON[p % PATRON.length];
      const quedan = fs.length - i;
      if (CUANTAS[tipo] > quedan) tipo = quedan >= 3 ? 'trio' : 'single';
      r.push({k: 'fotos', fac: key, tipo, fotos: fs.slice(i, i + CUANTAS[tipo]), beats: 4});
      i += CUANTAS[tipo];
      p += 1;
    }
  });
  return r;
})();
const INICIO = Math.round(CORO * 30);
const beatF = (b: number) => Math.round(INICIO + b * BEAT);
const ARRANQUES = ITEMS.reduce<number[]>((a, it, i) => [...a, i === 0 ? 0 : a[i - 1] + ITEMS[i - 1].beats], []);
const BEATS_TOTAL = ARRANQUES[ARRANQUES.length - 1] + ITEMS[ITEMS.length - 1].beats;
const FIN_DESDE = beatF(BEATS_TOTAL);
export const CIERRE_F = Math.round(46 * BEAT); // termina con la canción (~221 s)
export const GRAD_FRAMES = FIN_DESDE + CIERRE_F;
/** voz en off opcional: entra aquí (segundo 1 del video) */
export const VOZ_DESDE = 30;

// ---------------------------------------------------------------------------
// Sincronía con la canción: tramos con bajo fuerte ("drops") y golpes donde arranca cada uno.
// En los drops las fotos salen con barrido o atravesando y laten con el ritmo; en las partes tranquilas
// se revelan y salen con un destello de luz cálida.
// ---------------------------------------------------------------------------
const DROPS: [number, number][] = [
  [30.4, 38.0],
  [54.4, 56.8],
  [59.2, 95.1],
  [112.0, 114.4],
  [116.7, 133.5],
  [143.2, 150.4],
  [181.3, 210.0],
];
const GOLPES = [30.5, 59.2, 116.7, 143.2, 181.3];
const enDrop = (t: number) => DROPS.some(([a, b]) => t >= a && t < b);
const esGolpe = (t: number) => GOLPES.some((g) => Math.abs(g - t) < 0.5);
type Entra = 'sube' | 'zoom' | 'cae' | 'lado' | 'revela';
type Sale = 'fade' | 'barrido' | 'atraviesa' | 'luz';
type Estilo = {entra: Entra; sale: Sale; drop: boolean; golpe: boolean};
/** estilo de cada espacio de fotos según dónde cae en la canción; la entrada combina con la salida anterior */
const ESTILOS: Estilo[] = (() => {
  const r: Estilo[] = [];
  let prev: Sale = 'fade';
  let n = 0;
  ITEMS.forEach((it, i) => {
    const t = beatF(ARRANQUES[i]) / 30;
    const drop = enDrop(t);
    let sale: Sale;
    let entra: Entra;
    if (drop) {
      sale = n % 2 ? 'atraviesa' : 'barrido';
      entra = prev === 'barrido' ? 'lado' : prev === 'atraviesa' ? 'zoom' : 'cae';
    } else {
      sale = n % 2 ? 'fade' : 'luz';
      entra = n % 2 ? 'sube' : 'revela';
    }
    r.push({entra, sale, drop, golpe: esGolpe(t)});
    prev = it.k === 'fotos' ? sale : 'fade';
    n += 1;
  });
  return r;
})();

// ---------------------------------------------------------------------------
// Piezas visuales
// ---------------------------------------------------------------------------
const Fondo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: NAVY, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(39,99,154,0.55) 0%, rgba(11,27,51,0) 65%)'}} />
      {Array.from({length: 26}, (_, i) => {
        const x = ((i * 277) % W) + Math.sin(f / 60 + i) * 30;
        const y = ((i * 131 + f * (0.25 + (i % 4) * 0.1)) % (H + 100)) - 50;
        const s = 6 + (i % 5) * 4;
        return <div key={i} style={{position: 'absolute', left: x, top: H - y, width: s, height: s, borderRadius: '50%', background: ORO, opacity: 0.12 + (i % 3) * 0.06, filter: 'blur(2px)'}} />;
      })}
    </AbsoluteFill>
  );
};

/** Foto con marco blanco, sombra y un leve movimiento; la entrada cambia según el momento de la canción */
const Marco: React.FC<{src: string; w: number; h: number; x: number; y: number; maxW: number; maxH: number; r?: number; at?: number; dur: number; entra: Entra; lado?: number}> = ({src, w, h, x, y, maxW, maxH, r = 0, at = 0, dur, entra, lado = 1}) => {
  const f = useCurrentFrame();
  const s = Math.min(maxW / w, maxH / h);
  const fw = w * s;
  const fh = h * s;
  const p = tw(f, [at, at + 12], [0, 1], entra === 'cae' ? ease.back : ease.out);
  const q = 1 - p;
  const deriva = 1 + 0.03 * ((f - at) / dur);
  let t = '';
  let filtro = 'none';
  let op = Math.min(1, p * 1.5);
  if (entra === 'sube') t = `translateY(${q * 60}px) scale(${0.92 + 0.08 * p})`;
  if (entra === 'zoom') {
    t = `scale(${1 + q * 0.45})`;
    filtro = `blur(${q * 14}px)`;
  }
  if (entra === 'cae') t = `translateY(${q * -760}px) rotate(${q * 14}deg)`;
  if (entra === 'lado') {
    t = `translateX(${q * 1500 * lado}px)`;
    filtro = `blur(${q * 18}px)`;
    op = 1;
  }
  if (entra === 'revela') {
    const rev = tw(f, [at, at + 26], [0, 1]);
    t = `scale(${0.96 + 0.04 * p})`;
    filtro = `brightness(${2.4 - 1.4 * rev}) sepia(${0.6 * (1 - rev)}) contrast(${0.7 + 0.3 * rev})`;
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: x - fw / 2 - 14,
        top: y - fh / 2 - 14,
        padding: 14,
        background: '#FDFBF6',
        boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
        transform: `${t} rotate(${r * Math.min(1, p)}deg) scale(${deriva})`,
        filter: filtro,
        opacity: op,
      }}
    >
      <Img src={src} style={{width: fw, height: fh, objectFit: 'cover', display: 'block'}} />
    </div>
  );
};

/** Rollo de película de 35 mm: base café oscuro, perforaciones a contraluz, números de cuadro y destello de luz */
const PERF = 52;
const Pelicula: React.FC<{fac: string; fotos: [string, number, number][]; dur: number}> = ({fac, fotos, dur}) => {
  const f = useCurrentFrame();
  const FW = 640;
  const FH = 480;
  const GAP = 32;
  const BANDA = 78;
  const cuadros: (string | null)[] = [null, ...fotos.map((x) => x[0]), null];
  const ancho = cuadros.length * (FW + GAP) + GAP;
  const x = interpolate(f, [0, dur], [-380, -380 - (ancho - W - 760) * 1], {...clamp, easing: (k) => k});
  const vaiven = Math.sin(f / 3.1) * 1.4;
  const fuga = interpolate(f, [0, dur], [-600, ancho + 200], clamp);
  const perforaciones = Array.from({length: Math.ceil(ancho / PERF)}, (_, i) => i);
  const hoyo: React.CSSProperties = {position: 'absolute', width: 30, height: 21, borderRadius: 5, background: 'linear-gradient(180deg, #FFF6E6, #E9DCC4)', boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.45), 0 0 6px rgba(255,236,200,0.35)'};
  return (
    <div style={{position: 'absolute', left: x, top: H / 2 - (FH + 2 * BANDA) / 2 + vaiven, width: ancho, height: FH + 2 * BANDA, transform: 'rotate(-4deg)', transformOrigin: '50% 50%'}}>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #2B1A10 0%, #140C07 18%, #0E0805 50%, #140C07 82%, #2B1A10 100%)', boxShadow: '0 50px 90px rgba(0,0,0,0.65)', borderTop: '2px solid #3A2617', borderBottom: '2px solid #3A2617'}} />
      {perforaciones.map((i) => (
        <React.Fragment key={i}>
          <div style={{...hoyo, left: 11 + i * PERF, top: 16}} />
          <div style={{...hoyo, left: 11 + i * PERF, bottom: 16}} />
        </React.Fragment>
      ))}
      {cuadros.map((n, k) => {
        const left = GAP + k * (FW + GAP);
        const num = 12 + k;
        return (
          <React.Fragment key={k}>
            <div style={{position: 'absolute', left: left + 6, top: BANDA - 22, fontFamily: F.sans, fontWeight: 700, fontSize: 15, letterSpacing: 3, color: '#E59B3C', opacity: 0.85, whiteSpace: 'nowrap'}}>
              ◂ {num} &nbsp; WESTHILL 2026 &nbsp; {num}A ▸
            </div>
            <div style={{position: 'absolute', left: left + FW - 60, bottom: BANDA - 22, fontFamily: F.sans, fontWeight: 700, fontSize: 15, letterSpacing: 2, color: '#E59B3C', opacity: 0.7}}>{num}</div>
            <div style={{position: 'absolute', left, top: BANDA, width: FW, height: FH, borderRadius: 6, overflow: 'hidden', background: '#060403', boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.6)'}}>
              {n && <Img src={foto(fac, n)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 35%', filter: 'contrast(1.06) saturate(1.05) sepia(0.06)'}} />}
              <div style={{position: 'absolute', inset: 0, boxShadow: 'inset 0 0 40px rgba(0,0,0,0.55)'}} />
            </div>
          </React.Fragment>
        );
      })}
      {/* destello de luz que recorre el rollo */}
      <div style={{position: 'absolute', top: 0, bottom: 0, left: fuga, width: 520, background: 'linear-gradient(90deg, rgba(255,170,80,0) 0%, rgba(255,170,80,0.28) 45%, rgba(255,230,190,0.38) 52%, rgba(255,170,80,0) 100%)', mixBlendMode: 'screen'}} />
    </div>
  );
};

const FotosSlot: React.FC<{it: Extract<Item, {k: 'fotos'}>; est: Estilo}> = ({it, est}) => {
  const f = useCurrentFrame();
  const dur = Math.round(it.beats * BEAT);
  const SAL = est.sale === 'luz' ? 14 : 9;
  const s = tw(f, [dur - SAL, dur], [0, 1], ease.in);
  const [p0] = it.fotos;
  const b = (k: number) => Math.round(k * BEAT);
  const e = est.entra;
  // en los drops el contenido late en cada tiempo
  const latido = est.drop ? 1 + 0.018 * Math.max(0, 1 - ((f % BEAT) / BEAT) * 3) : 1;
  // golpe de entrada en el arranque de un drop
  const golpe = est.golpe ? interpolate(f, [0, 2, 12], [0, 0.75, 0], clamp) : 0;
  const sacude = est.golpe && f < 12 ? (12 - f) * 2.2 : 0;
  let contenido: React.ReactNode = null;
  if (it.tipo === 'single') {
    contenido = <Marco src={foto(it.fac, p0[0])} w={p0[1]} h={p0[2]} x={W / 2} y={H / 2} maxW={1300} maxH={860} r={-1.5} dur={dur} entra={e} />;
  } else if (it.tipo === 'trio') {
    contenido = it.fotos.map(([n, w, h], i) => <Marco key={n} src={foto(it.fac, n)} w={w} h={h} x={360 + i * 600} y={H / 2 + (i === 1 ? -20 : 20)} maxW={540} maxH={760} r={[-4, 2, 5][i]} at={b(i)} dur={dur} entra={e} lado={i % 2 ? -1 : 1} />);
  } else if (it.tipo === 'quad') {
    const pos = [
      [600, 290],
      [1320, 300],
      [620, 790],
      [1300, 780],
    ];
    contenido = it.fotos.map(([n, w, h], i) => <Marco key={n} src={foto(it.fac, n)} w={w} h={h} x={pos[i][0]} y={pos[i][1]} maxW={760} maxH={470} r={[-3, 3, 2, -2][i]} at={b(i * 0.75)} dur={dur} entra={e} lado={i % 2 ? -1 : 1} />);
  } else {
    const ent = tw(f, [0, 10], [0, 1], ease.out);
    contenido = (
      <AbsoluteFill style={{opacity: ent, transform: `scale(${1.08 - 0.08 * ent})`}}>
        <Pelicula fac={it.fac} fotos={it.fotos} dur={dur} />
      </AbsoluteFill>
    );
  }
  // salidas
  let salida: React.CSSProperties = {opacity: 1 - s};
  if (est.sale === 'barrido') salida = {transform: `translateX(${-s * 1700}px)`, filter: `blur(${s * 22}px)`};
  if (est.sale === 'atraviesa') salida = {transform: `scale(${1 + s * 1.6})`, filter: `blur(${s * 16}px)`, opacity: 1 - s * 0.9};
  return (
    <AbsoluteFill>
      <AbsoluteFill style={salida}>
        <AbsoluteFill style={{opacity: 0.35}}>
          <Img src={foto(it.fac, p0[0])} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(40px) brightness(0.6)', transform: 'scale(1.2)'}} />
        </AbsoluteFill>
        <AbsoluteFill style={{transform: `translate(${Math.sin(f * 3) * sacude}px, ${Math.cos(f * 4) * sacude}px) scale(${latido})`}}>{contenido}</AbsoluteFill>
      </AbsoluteFill>
      {/* destello de luz cálida al salir en las partes tranquilas */}
      {est.sale === 'luz' && (
        <AbsoluteFill style={{background: `radial-gradient(ellipse at ${20 + s * 70}% 40%, rgba(255,222,165,${Math.sin(s * Math.PI)}) 0%, rgba(255,150,70,${0.6 * Math.sin(s * Math.PI)}) 40%, rgba(255,150,70,0) 70%)`, mixBlendMode: 'screen'}} />
      )}
      <AbsoluteFill style={{background: '#fff', opacity: golpe}} />
      {est.sale === 'barrido' && <Sfx at={dur - SAL} name="whoosh" volume={0.18} />}
    </AbsoluteFill>
  );
};

const Dorado: React.FC<{children: React.ReactNode; size: number; spacing?: number; style?: React.CSSProperties}> = ({children, size, spacing = 8, style}) => (
  <span style={{fontFamily: F.clasica, fontWeight: 700, fontSize: size, letterSpacing: spacing, backgroundImage: ORO_GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', ...style}}>{children}</span>
);

const Portada: React.FC<{it: Extract<Item, {k: 'portada'}>}> = ({it}) => {
  const f = useCurrentFrame();
  const dur = Math.round(it.beats * BEAT);
  const linea = tw(f, [0, 16], [0, 1], ease.inOut);
  const t = tw(f, [6, 22], [0, 1]);
  const sale = tw(f, [dur - 8, dur], [0, 1], ease.in);
  return (
    <AbsoluteFill style={{opacity: 1 - sale, transform: `scale(${1 + sale * 0.06})`}}>
      <div style={{position: 'absolute', top: 360, width: '100%', textAlign: 'center'}}>
        <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 30, letterSpacing: 14, color: CREMA, opacity: t}}>FACULTAD DE</div>
        <div style={{width: 520 * linea, height: 2, background: ORO, margin: '22px auto'}} />
        <div style={{opacity: t, filter: `blur(${(1 - t) * 10}px)`, transform: `translateY(${(1 - t) * 20}px)`, padding: '0 120px'}}>
          <Dorado size={it.nombre.length > 24 ? 84 : 120} spacing={4}>
            {it.nombre.toUpperCase()}
          </Dorado>
        </div>
        <div style={{width: 520 * linea, height: 2, background: ORO, margin: '28px auto 0'}} />
      </div>
    </AbsoluteFill>
  );
};

const Frase: React.FC<{arriba: string; grande: string; dur: number}> = ({arriba, grande, dur}) => {
  const f = useCurrentFrame();
  const a = tw(f, [4, 22], [0, 1]);
  const b = tw(f, [26, 46], [0, 1]);
  const sale = tw(f, [dur - 14, dur], [0, 1]);
  return (
    <AbsoluteFill style={{background: '#000', opacity: 1 - sale}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(217,183,106,0.12) 0%, rgba(0,0,0,0) 55%)'}} />
      <div style={{position: 'absolute', top: 380, left: 140, right: 140, textAlign: 'center'}}>
        <div style={{fontFamily: F.sans, fontWeight: 500, fontSize: 50, letterSpacing: 12, color: CREMA, textTransform: 'uppercase', opacity: a, filter: `blur(${(1 - a) * 8}px)`}}>{arriba}</div>
        <div style={{marginTop: 26, fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 120, lineHeight: 1.15, color: ORO, opacity: b, filter: `blur(${(1 - b) * 8}px)`, transform: `translateY(${(1 - b) * 16}px)`}}>{grande}</div>
      </div>
    </AbsoluteFill>
  );
};

/** Intro: frases en negro y el logo; termina justo en la entrada del coro */
const FRASES_INTRO: {at: number; to: number; arriba: string; grande: string}[] = [
  {at: 1.0, to: 7.4, arriba: 'Un día llegaste con una mochila', grande: 'llena de dudas…'},
  {at: 7.8, to: 14.2, arriba: 'y hoy te vas con una', grande: 'llena de historias.'},
  {at: 14.6, to: 21.0, arriba: 'Cada desvelo, cada clase, cada amistad', grande: 'te trajo hasta aquí.'},
];
const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const logoAt = Math.round(21.4 * 30);
  const logo = tw(f, [logoAt, logoAt + 30], [0, 1]);
  const gen = tw(f, [logoAt + 30, logoAt + 54], [0, 1]);
  const sale = tw(f, [INICIO - 10, INICIO], [0, 1], ease.in);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {FRASES_INTRO.map((p) => (
        <Sequence key={p.at} from={Math.round(p.at * 30)} durationInFrames={Math.round((p.to - p.at) * 30)}>
          <Frase arriba={p.arriba} grande={p.grande} dur={Math.round((p.to - p.at) * 30)} />
        </Sequence>
      ))}
      <AbsoluteFill style={{opacity: logo * (1 - sale)}}>
        <Fondo />
        <div style={{position: 'absolute', left: W / 2 - 330, top: 300, width: 660, clipPath: `inset(0 0 ${(1 - logo) * 100}% 0)`}}>
          <Img src={staticFile('logos/logo_westhill_blanco_total.png')} style={{width: '100%'}} />
        </div>
        <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', opacity: gen, transform: `translateY(${(1 - gen) * 16}px)`}}>
          <div style={{width: 460, height: 2, background: ORO, margin: '0 auto 24px'}} />
          <Dorado size={64} spacing={16}>
            GENERACIÓN 2026
          </Dorado>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#fff', opacity: interpolate(f, [INICIO - 3, INICIO, INICIO + 8], [0, 0.7, 0], clamp)}} />
    </AbsoluteFill>
  );
};

/** Cierre: tira de todas las fotos de fondo, "¡Felicidades, Generación 2026!" y el logo */
const TODAS = FACULTADES.flatMap(({key}) => (FOTOS[key] ?? []).map(([n, w, h]) => ({fac: key, n, w, h})));
const Cierre: React.FC = () => {
  const f = useCurrentFrame();
  const t1 = tw(f, [10, 36], [0, 1]);
  const t2 = tw(f, [40, 66], [0, 1], ease.back);
  const t3 = tw(f, [90, 116], [0, 1]);
  const logo = tw(f, [CIERRE_F - 260, CIERRE_F - 220], [0, 1]);
  const ocultaTexto = tw(f, [CIERRE_F - 280, CIERRE_F - 250], [0, 1]);
  const negro = tw(f, [CIERRE_F - 40, CIERRE_F], [0, 1]);
  const filas = [0, 1, 2];
  return (
    <AbsoluteFill style={{background: NAVY, overflow: 'hidden'}}>
      {/* tres tiras de fotos que corren en sentidos opuestos */}
      <AbsoluteFill style={{opacity: 0.32, filter: 'grayscale(0.3)'}}>
        {filas.map((r) => {
          const dir = r % 2 ? 1 : -1;
          const x = (dir * f * 2.2) % 2600;
          return (
            <div key={r} style={{position: 'absolute', top: 40 + r * 350, left: dir > 0 ? x - 2600 : x, display: 'flex', gap: 16}}>
              {Array.from({length: 18}, (_, k) => TODAS[(r * 17 + k * 5) % TODAS.length]).map((p, k) => (
                <Img key={k} src={foto(p.fac, p.n)} style={{width: 300, height: 320, objectFit: 'cover'}} />
              ))}
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(11,27,51,0.92) 0%, rgba(11,27,51,0.7) 45%, rgba(11,27,51,0.35) 100%)'}} />
      <div style={{position: 'absolute', top: 330, width: '100%', textAlign: 'center', opacity: 1 - ocultaTexto}}>
        <div style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 90, color: CREMA, opacity: t1, filter: `blur(${(1 - t1) * 10}px)`}}>¡Felicidades,</div>
        <div style={{marginTop: 6, transform: `scale(${t2})`, opacity: Math.min(1, t2 * 2)}}>
          <Dorado size={130} spacing={10}>
            GENERACIÓN 2026!
          </Dorado>
        </div>
        <div style={{marginTop: 40, fontFamily: F.sans, fontWeight: 600, fontSize: 40, letterSpacing: 4, color: CREMA, opacity: t3}}>Gracias por dejar huella en Westhill.</div>
      </div>
      <div style={{position: 'absolute', left: W / 2 - 330, top: 330, width: 660, opacity: logo, clipPath: `inset(0 0 ${(1 - logo) * 100}% 0)`}}>
        <Img src={staticFile('logos/logo_westhill_blanco_total.png')} style={{width: '100%'}} />
      </div>
      <AbsoluteFill style={{background: '#000', opacity: negro}} />
    </AbsoluteFill>
  );
};

export const Graduacion: React.FC<{music?: boolean; voz?: string; vozDur?: number}> = ({music = true, voz, vozDur = 25}) => {
  const vozA = VOZ_DESDE;
  const vozB = VOZ_DESDE + Math.round(vozDur * 30);
  const musica = (fr: number) => {
    const base = interpolate(fr, [0, 20, GRAD_FRAMES - 60, GRAD_FRAMES], [0, 0.85, 0.85, 0], clamp);
    const baja = voz ? interpolate(fr, [vozA - 15, vozA, vozB, vozB + 20], [1, 0.3, 0.3, 1], clamp) : 1;
    return base * baja;
  };
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence durationInFrames={INICIO + 2}>
        <Intro />
      </Sequence>
      <Sequence from={INICIO} durationInFrames={FIN_DESDE - INICIO}>
        <Fondo />
      </Sequence>
      {ITEMS.map((it, i) => {
        const from = beatF(ARRANQUES[i]);
        const dur = beatF(ARRANQUES[i] + it.beats) - from;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            {it.k === 'portada' ? <Portada it={it} /> : it.k === 'frase' ? <Frase arriba={it.arriba} grande={it.grande} dur={dur} /> : <FotosSlot it={it} est={ESTILOS[i]} />}
          </Sequence>
        );
      })}
      <Sequence from={FIN_DESDE} durationInFrames={CIERRE_F}>
        <Cierre />
      </Sequence>
      <Grain opacity={0.035} />
      {music && <Audio src={staticFile('music/happier.mp3')} volume={musica} />}
      {voz && (
        <Sequence from={vozA}>
          <Audio src={staticFile(voz)} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
export const GRAD_W = W;
export const GRAD_H = H;
