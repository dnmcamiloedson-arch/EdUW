import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from './components';
import {Banner, Sfx} from './shots';
import {C, F, SAFE_X, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Reel (9:16): opiniones de los estudiantes sobre el Onceavo Congreso Académico de Derecho.
//  Intro con el arte del congreso → 01 ¿Qué te pareció el Congreso? → 02 ¿Qué fue lo que más te gustó?
//  (cierra Miguel) → 03 ¿Por qué recomendarías venir al Congreso? (Miguel) → agradecimiento sobre el
//  auditorio lleno y logo.
// Las respuestas se aprietan quitando pausas y muletillas; algunas partes van en voz en off sobre tomas del
// congreso (el ponente de inteligencia artificial, el público, el break, los reconocimientos).
// Subtítulos animados palabra por palabra, con las palabras clave en amarillo.
// Material: public/proxies/preguntas (e1–e5, miguel, a1–a9) y voces limpias en public/preguntas/voz
// (scripts/preguntas_preparar.py). Tramos medidos con Whisper + detección de silencios.
// ---------------------------------------------------------------------------
const FPS = 30;
const W = 1080;
const H = 1920;
const sec = (s: number) => Math.round(s * FPS);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const AZUL = C.azul;
const MARINO = C.marino;
const AMARILLO = '#F0C84A';
const vid = (n: string) => staticFile(`proxies/preguntas/${n}.mp4`);
const hh = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Tramo = [number, number];
/** cubre: [segundo dentro de la respuesta, duración, toma de apoyo, segundo de la toma] */
type Cubre = [number, number, string, number];
/** texto: uno por tramo; *palabra* = palabra clave en amarillo */
type Resp = {n: string; segs: Tramo[]; texto: string[]; cubre?: Cubre[]};

const Q1: Resp[] = [
  {
    n: 'e1',
    segs: [[0.55, 5.15], [5.65, 9.3]],
    texto: ['A mí lo que me gustó en general fue la actitud de todos los *ponentes*.', 'Su manera de explicar fue bastante *entretenida*, la verdad.'],
    cubre: [[3.6, 3.4, 'a2', 0.5]],
  },
  {
    n: 'e2',
    segs: [[1.4, 8.2]],
    texto: ['Creo que está súper bien que hagan estos congresos, porque así podemos *conectar* con los *ministros* que vienen, con las personas de la fiscalía.'],
    cubre: [[2.4, 3.6, 'a4', 1.5]],
  },
  {
    n: 'e4',
    segs: [[3.2, 8.98], [9.4, 17.2]],
    texto: ['Hola, mi nombre es Susan, soy estudiante de Derecho, y mi opinión general del Congreso es que fue un Congreso bastante *enriquecedor*.', 'Trajeron ponentes bastante buenos, y la verdad fue una *experiencia* muy grata para mí poder convivir con personalidades tan *importantes* y relevantes.'],
    cubre: [[7.0, 4.4, 'a7', 0.4]],
  },
  {
    n: 'e3',
    segs: [[13.45, 20.5]],
    texto: ['Y en general siento que es una muy buena conferencia, un Congreso muy bueno. Cada una de las conferencias estuvo *increíble*.'],
    cubre: [[3.0, 3.6, 'a6', 0.0]],
  },
  {
    n: 'e5',
    segs: [[12.7, 16.5], [28.95, 32.4]],
    texto: ['El *conocimiento* hace la diferencia para tu nivel académico…', 'y poder obtener opiniones de *ministros* es súper fundamental.'],
    cubre: [[3.0, 4.0, 'a1', 0.3]],
  },
];
const Q2: Resp[] = [
  {
    n: 'e1',
    segs: [[20.6, 27.5], [28.2, 32.2]],
    texto: ['Bueno, mi parte favorita en el Congreso fue la última *conferencia* que tuvimos con el doctor que es ministro.', 'Y nada, siento que *conectó* bien con el público, y eso lo hizo más entretenido.'],
    cubre: [[7.0, 3.8, 'a8', 0.0]],
  },
  {
    n: 'e2',
    segs: [[38.3, 42.45], [53.95, 55.9]],
    texto: ['Mi parte favorita del Congreso fue sobre la *inteligencia artificial*.', 'En general estuvo muy padre y *divertido*.'],
    cubre: [[1.6, 4.0, 'a5', 2.0]],
  },
  {
    n: 'e3',
    segs: [[0.1, 7.85]],
    texto: ['Hola, yo soy Emily. La verdad, mi parte favorita del Congreso fue lo de la *inteligencia artificial*, ya que yo sí lo utilizo.'],
    cubre: [[4.1, 3.5, 'a3', 1.0]],
  },
  {
    n: 'e5',
    segs: [[33.5, 37.0], [40.2, 47.85]],
    texto: ['Y la parte que más me gustó fue la *inteligencia artificial*…', 'y la parte de la *inclusión*, los diferentes tipos de *discapacidad* que puede haber a nivel derecho.'],
    cubre: [[3.6, 3.8, 'a4', 4.5]],
  },
  {
    n: 'e4',
    segs: [[21.75, 27.7], [28.15, 33.1]],
    texto: ['Y mi parte favorita… es difícil poder elegir alguna, ya que las ponencias fueron bastante…', 'bastante buenas, y yo me quedo muy satisfecha y *agradecida* con mi institución por habernos traído este Congreso.'],
    cubre: [[5.4, 4.0, 'a1', 6.0]],
  },
  {
    n: 'miguel',
    segs: [[3.25, 5.95], [6.75, 14.7], [15.0, 17.5]],
    texto: ['Escoger una parte favorita fue muy *difícil*, sin duda.', 'Mi parte favorita fue la ponencia del ministro Arístides Guerrero García, sobre la *inteligencia artificial*, así como la del ministro Giovanni Azael Mejía…', 'en *igualdad* y no discriminación.'],
    cubre: [[4.3, 4.6, 'a2', 4.6]],
  },
];
const Q3: Resp[] = [
  {
    n: 'miguel',
    segs: [[17.6, 31.95]],
    texto: ['*Recomiendo* mucho este Congreso, el Congreso de Derecho de Universidad Westhill, porque permite que diferentes puntos de vista del más alto nivel converjan en un solo espacio, para permitirnos tener una visión más *holística* sobre el derecho en México y en el mundo.'],
  },
];

const durResp = (r: Resp) => r.segs.reduce((a, [x, y]) => a + sec(y - x), 0);
const durLista = (l: Resp[]) => l.reduce((a, r) => a + durResp(r), 0);

// ---------------------------------------------------------------------------
// Subtítulos animados: cada tramo reparte sus palabras según su largo; se muestran de 3 en 3 (o hasta una
// pausa de puntuación), la palabra que se está diciendo sube y se ilumina, y las palabras clave van en amarillo.
// ---------------------------------------------------------------------------
type Palabra = {w: string; t0: number; t1: number; clave: boolean};
const palabras = (r: Resp): Palabra[] => {
  const out: Palabra[] = [];
  let base = 0;
  r.segs.forEach(([a, b], j) => {
    const d = sec(b - a);
    const ws = r.texto[j].split(' ').filter(Boolean);
    const pesos = ws.map((w) => w.replace(/\*/g, '').length + 2);
    const total = pesos.reduce((x, y) => x + y, 0);
    let acc = 0;
    ws.forEach((w, k) => {
      const t0 = base + 2 + (acc / total) * (d - 4);
      acc += pesos[k];
      const t1 = base + 2 + (acc / total) * (d - 4);
      out.push({w: w.replace(/\*/g, ''), t0, t1, clave: w.includes('*')});
    });
    base += d;
  });
  return out;
};
const grupos = (ps: Palabra[]): Palabra[][] => {
  const g: Palabra[][] = [];
  let cur: Palabra[] = [];
  ps.forEach((p, i) => {
    cur.push(p);
    const pausa = /[,.…?!]$/.test(p.w);
    const largo = cur.reduce((a, x) => a + x.w.length, 0);
    if (cur.length >= 3 || pausa || largo > 16 || i === ps.length - 1) {
      g.push(cur);
      cur = [];
    }
  });
  return g;
};
const Subtitulos: React.FC<{r: Resp}> = ({r}) => {
  const f = useCurrentFrame();
  const gs = grupos(palabras(r));
  const i = gs.findIndex((g, k) => f >= g[0].t0 - 1 && (k === gs.length - 1 || f < gs[k + 1][0].t0 - 1));
  if (i < 0) return null;
  const g = gs[i];
  const entra = tw(f, [g[0].t0 - 1, g[0].t0 + 4], [0, 1], ease.out);
  return (
    <div style={{position: 'absolute', top: 1290, left: SAFE_X - 20, right: SAFE_X - 20, textAlign: 'center', opacity: entra, transform: `translateY(${(1 - entra) * 18}px)`}}>
      {g.map((p, j) => {
        const activa = f >= p.t0 - 1 && f < p.t1 + 1;
        const dicha = f >= p.t0 - 1;
        // la palabra que se dice se levanta un poco; la escala crece menos en palabras largas para no encimarse
        const s = activa ? 1 + (p.w.length > 8 ? 0.02 : 0.06) * tw(f, [p.t0 - 1, p.t0 + 3], [0, 1], ease.out) : 1;
        return (
          <span
            key={j}
            style={{
              display: 'inline-block',
              margin: '0 0.3em',
              fontFamily: F.sans,
              fontWeight: 900,
              fontSize: 70,
              lineHeight: 1.18,
              textTransform: 'uppercase',
              color: p.clave ? AMARILLO : '#FFFFFF',
              opacity: dicha ? 1 : 0.55,
              transform: `translateY(${activa ? -6 : 0}px) scale(${s})`,
              transformOrigin: '50% 100%',
              WebkitTextStroke: '3px rgba(0,0,0,0.55)',
              paintOrder: 'stroke fill',
              textShadow: `0 6px 0 rgba(0,0,0,0.5), 0 0 24px rgba(0,0,0,0.45)${activa && p.clave ? ', 0 0 26px rgba(240,200,74,0.75)' : ''}`,
            }}
          >
            {p.w}
          </span>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tomas
// ---------------------------------------------------------------------------
/** Respuesta: tramos pegados con corte seco y acercamiento alterno; tomas de apoyo encima en voz en off */
const RespuestaClip: React.FC<{r: Resp; k: number}> = ({r, k}) => {
  const f = useCurrentFrame();
  let acc = 0;
  const entra = tw(f, [0, 8], [0, 1], ease.out);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {r.segs.map(([a, b], j) => {
        const d = sec(b - a);
        const from = acc;
        acc += d;
        const zoom = (k + j) % 2 === 0 ? 1.0 : 1.12;
        return (
          <Sequence key={j} from={from} durationInFrames={d}>
            <AbsoluteFill style={{transform: `scale(${zoom + 0.03 * ((f - from) / d)}) translateX(${j === 0 ? (1 - entra) * (k % 2 ? 80 : -80) : 0}px)`, transformOrigin: '50% 36%', filter: j === 0 && entra < 1 ? `blur(${(1 - entra) * 10}px)` : undefined}}>
              <OffthreadVideo src={vid(r.n)} startFrom={sec(a)} muted style={{width: W, height: H, objectFit: 'cover'}} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      {(r.cubre ?? []).map(([at, d, src, desde], j) => (
        <Sequence key={`c${j}`} from={sec(at)} durationInFrames={sec(d)}>
          <Apoyo src={src} desde={desde} dur={sec(d)} />
        </Sequence>
      ))}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 52%, rgba(0,0,0,0.6) 100%)'}} />
    </AbsoluteFill>
  );
};

/** Toma de apoyo en voz en off: entra y sale con fundido corto y se acerca despacio */
const Apoyo: React.FC<{src: string; desde: number; dur: number}> = ({src, desde, dur}) => {
  const f = useCurrentFrame();
  const op = tw(f, [0, 6], [0, 1], ease.inOut) * (1 - tw(f, [dur - 6, dur], [0, 1], ease.inOut));
  return (
    <AbsoluteFill style={{opacity: op, overflow: 'hidden'}}>
      <OffthreadVideo src={vid(src)} startFrom={sec(desde)} muted style={{width: W, height: H, objectFit: 'cover', transform: `scale(${1.04 + 0.06 * (f / dur)})`}} />
    </AbsoluteFill>
  );
};

/** Pregunta fija arriba durante cada bloque */
const PreguntaFija: React.FC<{num: string; texto: string}> = ({num, texto}) => {
  const f = useCurrentFrame();
  const p = tw(f, [4, 16], [0, 1], ease.out);
  return (
    <div style={{position: 'absolute', top: 300, left: SAFE_X, right: SAFE_X, opacity: p, transform: `translateX(${(1 - p) * -50}px)`}}>
      <div style={{display: 'inline-flex', alignItems: 'center', gap: 14, background: 'rgba(11,27,51,0.82)', padding: '12px 26px 12px 12px', borderRadius: 50, border: `3px solid ${AMARILLO}`}}>
        <span style={{background: AMARILLO, color: MARINO, fontFamily: F.display, fontSize: 32, borderRadius: 30, padding: '2px 14px'}}>{num}</span>
        <span style={{fontFamily: F.sans, fontWeight: 800, fontSize: 30, color: '#fff'}}>{texto}</span>
      </div>
    </div>
  );
};

const Bloque: React.FC<{lista: Resp[]; num: string; pregunta: string}> = ({lista, num, pregunta}) => {
  let acc = 0;
  return (
    <AbsoluteFill>
      {lista.map((r, k) => {
        const d = durResp(r);
        const from = acc;
        acc += d;
        return (
          <Sequence key={k} from={from} durationInFrames={d}>
            <RespuestaClip r={r} k={k} />
            <Subtitulos r={r} />
            {k > 0 && <Sfx at={0} name={k % 2 ? 'whoosh' : 'swipe'} volume={0.2} />}
          </Sequence>
        );
      })}
      <PreguntaFija num={num} texto={pregunta} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Motion graphics
// ---------------------------------------------------------------------------
/** Polvo dorado que sube despacio */
const Polvo: React.FC<{op?: number}> = ({op = 1}) => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 60; i++) {
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

const FondoMG: React.FC = () => (
  <AbsoluteFill style={{background: '#081022', overflow: 'hidden'}}>
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 46%, ${AZUL} 0%, rgba(11,27,51,0) 72%)`, opacity: 0.75}} />
    <Polvo />
  </AbsoluteFill>
);

/** Franja del arte del título (filas y0–y1 del PNG de 1080x1920) */
const ARTE = staticFile('congreso/titulo_congreso.png');
const Franja: React.FC<{y0: number; y1: number; x0?: number; x1?: number; style?: React.CSSProperties}> = ({y0, y1, x0 = 0, x1 = W, style}) => (
  <Img src={ARTE} style={{position: 'absolute', left: 0, top: 0, width: W, height: H, clipPath: `inset(${y0}px ${W - x1}px ${H - y1}px ${x0}px)`, ...style}} />
);

/** Intro: "Esto opinan del" + arte del congreso, que sale con zoom hacia la primera pregunta */
export const INTRO_F = 120;
const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const k = tw(f, [4, 20], [0, 1]);
  const lin = tw(f, [10, 32], [0, 1], ease.inOut);
  const on = tw(f, [18, 34], [0, 1]);
  const c1 = tw(f, [16, 34], [0, 1]);
  const c2 = tw(f, [22, 40], [0, 1]);
  const d = tw(f, [28, 48], [0, 1]);
  const sub = tw(f, [44, 64], [0, 1]);
  const luz = interpolate(f, [52, 84], [0, 1], clamp);
  const sale = tw(f, [INTRO_F - 14, INTRO_F], [0, 1], ease.in);
  const sube = (p: number, dist = 40): React.CSSProperties => ({transform: `translateY(${(1 - p) * dist}px)`, opacity: Math.min(1, p * 1.6)});
  const mask = `linear-gradient(105deg, rgba(0,0,0,0) ${luz * 140 - 30}%, rgba(0,0,0,1) ${luz * 140 - 20}%, rgba(0,0,0,0) ${luz * 140 - 10}%)`;
  return (
    <AbsoluteFill>
      <FondoMG />
      <AbsoluteFill style={{transform: `translateY(-120px) scale(${1 + 0.02 * (f / INTRO_F) + sale * 0.6})`, opacity: 1 - sale, filter: sale > 0 ? `blur(${sale * 12}px)` : undefined}}>
        <div style={{position: 'absolute', left: 0, width: W, top: 600, textAlign: 'center', fontFamily: F.sans, fontWeight: 800, fontSize: 40, letterSpacing: 8, color: '#FFFFFF', ...sube(k, 24)}}>ESTO OPINAN DEL</div>
        <Franja y0={722} y1={760} x0={223 + (1 - lin) * 152} x1={376} />
        <Franja y0={722} y1={760} x0={716} x1={869 - (1 - lin) * 152} />
        <div style={{position: 'absolute', left: 376, width: 340, top: 724, textAlign: 'center', fontFamily: F.sans, fontWeight: 800, fontSize: 30, letterSpacing: 10, color: AMARILLO, ...sube(on, 16)}}>ONCEAVO</div>
        <div style={{position: 'absolute', inset: 0, clipPath: 'inset(780px 0 1052px 0)'}}>
          <Franja y0={780} y1={868} style={{transform: `translateY(${(1 - c1) * 90}px)`}} />
        </div>
        <div style={{position: 'absolute', inset: 0, clipPath: 'inset(864px 0 976px 0)'}}>
          <Franja y0={864} y1={944} style={{transform: `translateY(${(1 - c2) * 84}px)`}} />
        </div>
        <div style={{position: 'absolute', inset: 0, clipPath: 'inset(952px 0 860px 0)'}}>
          <Franja y0={952} y1={1060} style={{transform: `translateY(${(1 - d) * 110}px)`, filter: 'drop-shadow(0 0 18px rgba(240,200,74,0.35))'}} />
          {luz > 0 && luz < 1 && <Franja y0={952} y1={1060} style={{filter: 'brightness(1.9)', WebkitMaskImage: mask, maskImage: mask}} />}
        </div>
        <div style={{position: 'absolute', left: 0, width: W, top: 1110, textAlign: 'center', fontFamily: F.sans, fontWeight: 700, fontSize: 38, letterSpacing: 3, color: '#E6ECF3', ...sube(sub, 20)}}>
          Nuestros estudiantes nos cuentan
        </div>
      </AbsoluteFill>
      <Sfx at={4} name="whoosh" volume={0.3} />
      <Sfx at={28} name="impact" volume={0.4} />
      <Sfx at={INTRO_F - 14} name="whoosh" volume={0.35} />
    </AbsoluteFill>
  );
};

/** Tarjeta de pregunta: barre sobre la toma anterior, número y pregunta, y se abre hacia la siguiente */
export const SECCION_F = 48;
const PRE = 10;
const Seccion: React.FC<{num: string; titulo: string}> = ({num, titulo}) => {
  const f = useCurrentFrame();
  const barre = tw(f, [0, PRE], [0, 1], ease.inOut);
  const n = tw(f, [PRE - 4, PRE + 8], [0, 1], ease.out);
  const t = tw(f, [PRE, PRE + 14], [0, 1], ease.out);
  const sale = tw(f, [SECCION_F + PRE, SECCION_F + 2 * PRE], [0, 1], ease.in);
  return (
    <AbsoluteFill style={{clipPath: `inset(0 ${sale * 100}% 0 ${(1 - barre) * 100}%)`}}>
      <FondoMG />
      <div style={{position: 'absolute', top: 660, left: SAFE_X, right: SAFE_X, textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: AMARILLO, color: MARINO, fontFamily: F.display, fontSize: 92, padding: '0 34px', borderRadius: 20, opacity: n, transform: `translateY(${(1 - n) * 40}px)`}}>{num}</div>
        <div style={{marginTop: 34, fontFamily: F.display, fontSize: 112, lineHeight: 1.05, color: '#fff', opacity: t, transform: `translateY(${(1 - t) * 50}px)`}}>{titulo}</div>
      </div>
      <Sfx at={0} name="whoosh" volume={0.4} />
      <Sfx at={PRE} name="pop" volume={0.4} />
    </AbsoluteFill>
  );
};

/** Cierre: auditorio lleno con "¡Gracias a todos los que asistieron!" y el logo */
export const OUTRO_F = sec(7.2);
const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const a = tw(f, [10, 28], [0, 1]);
  const b = tw(f, [20, 40], [0, 1]);
  const logo = tw(f, [70, 96], [0, 1]);
  const pie = tw(f, [90, 110], [0, 1]);
  const negro = tw(f, [OUTRO_F - 24, OUTRO_F], [0, 1]);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <OffthreadVideo src={vid('a9')} startFrom={0} muted style={{width: W, height: H, objectFit: 'cover', transform: `scale(${1.02 + 0.05 * (f / OUTRO_F)})`}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,16,34,0.15) 0%, rgba(8,16,34,0.55) 40%, rgba(8,16,34,0.88) 100%)', opacity: a}} />
      <div style={{position: 'absolute', top: 820, left: SAFE_X, right: SAFE_X, textAlign: 'center'}}>
        <div style={{fontFamily: F.display, fontSize: 150, lineHeight: 1, color: AMARILLO, opacity: a, transform: `translateY(${(1 - a) * 40}px)`, textShadow: '0 8px 30px rgba(0,0,0,0.5)'}}>¡GRACIAS!</div>
        <div style={{marginTop: 20, fontFamily: F.sans, fontWeight: 800, fontSize: 46, lineHeight: 1.2, color: '#fff', opacity: b, transform: `translateY(${(1 - b) * 24}px)`, textShadow: '0 4px 18px rgba(0,0,0,0.6)'}}>
          a todos los que asistieron al
          <br />
          Onceavo Congreso Académico
          <br />
          de Derecho
        </div>
      </div>
      <div style={{position: 'absolute', left: 290, top: 1230, width: 500, opacity: logo, transform: `translateY(${(1 - logo) * 20}px)`}}>
        <Img src={staticFile('logos/logo_westhill_blanco_total.png')} style={{width: '100%'}} />
      </div>
      <div style={{position: 'absolute', top: 1460, width: '100%', textAlign: 'center', opacity: pie, fontFamily: F.sans, fontWeight: 800, fontSize: 30, letterSpacing: 8, color: AMARILLO}}>#SOMOSWESTHILL</div>
      <AbsoluteFill style={{background: '#000', opacity: negro}} />
      <Sfx at={10} name="whoosh" volume={0.35} />
      <Sfx at={70} name="ding" volume={0.3} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Línea de tiempo
// ---------------------------------------------------------------------------
const P1 = '¿Qué te pareció el Congreso?';
const P2 = '¿Qué fue lo que más te gustó?';
const P3 = '¿Por qué recomendarías venir?';
type Pieza = {dur: number; el: React.ReactNode; voz?: Resp[]; tarjeta?: boolean};
const PIEZAS: Pieza[] = [
  {dur: INTRO_F, el: <Intro />},
  {dur: SECCION_F, tarjeta: true, el: <Seccion num="01" titulo={P1} />},
  {dur: durLista(Q1), el: <Bloque lista={Q1} num="01" pregunta={P1} />, voz: Q1},
  {dur: SECCION_F, tarjeta: true, el: <Seccion num="02" titulo={P2} />},
  {dur: durLista(Q2), el: <Bloque lista={Q2} num="02" pregunta={P2} />, voz: Q2},
  {dur: SECCION_F, tarjeta: true, el: <Seccion num="03" titulo="¿Por qué recomendarías venir al Congreso?" />},
  {dur: durLista(Q3), el: <Bloque lista={Q3} num="03" pregunta={P3} />, voz: Q3},
  {dur: OUTRO_F, el: <Outro />},
];
const STARTS = PIEZAS.reduce<number[]>((a, p, i) => [...a, i === 0 ? 0 : a[i - 1] + PIEZAS[i - 1].dur], []);
export const OPINION_FRAMES = STARTS[STARTS.length - 1] + PIEZAS[PIEZAS.length - 1].dur;
const ULTIMA = PIEZAS.length - 1;

export const OpinionCongreso: React.FC<{music?: boolean}> = ({music = true}) => {
  // la música baja cuando hay voz y sube en las tarjetas, la intro y el cierre
  const vol = (fr: number) => {
    const i = STARTS.findIndex((s, k) => fr >= s && fr < s + PIEZAS[k].dur);
    const nivel = (k: number) => (k >= 0 && PIEZAS[k].voz ? 0.12 : 0.5);
    const s = STARTS[Math.max(0, i)];
    return interpolate(fr, [s - 8, s + 8], [nivel(i - 1), nivel(i)], clamp) * interpolate(fr, [0, 10, OPINION_FRAMES - 40, OPINION_FRAMES], [0, 1, 1, 0], clamp);
  };
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {PIEZAS.map((p, i) =>
        p.tarjeta ? null : (
          <Sequence key={i} from={STARTS[i]} durationInFrames={p.dur}>
            {p.el}
          </Sequence>
        ),
      )}
      {PIEZAS.map((p, i) =>
        p.tarjeta ? (
          <Sequence key={`t${i}`} from={STARTS[i] - PRE} durationInFrames={p.dur + 2 * PRE}>
            {p.el}
          </Sequence>
        ) : null,
      )}
      <Sequence from={STARTS[1]} durationInFrames={STARTS[ULTIMA] - STARTS[1]}>
        <Banner />
      </Sequence>
      {/* voces: una pista por tramo, alineada con su toma */}
      {PIEZAS.map((p, i) => {
        if (!p.voz) return null;
        let acc = STARTS[i];
        return p.voz.flatMap((r, k) =>
          r.segs.map(([a, b], j) => {
            const d = sec(b - a);
            const from = acc;
            acc += d;
            return (
              <Sequence key={`v${i}-${k}-${j}`} from={from} durationInFrames={d}>
                <Audio src={staticFile(`preguntas/voz/${r.n}.wav`)} startFrom={sec(a)} volume={(fr) => interpolate(fr, [0, 3, d - 3, d], [0, 1, 1, 0], clamp)} />
              </Sequence>
            );
          }),
        );
      })}
      <Grain opacity={0.03} />
      {music && <Audio src={staticFile('music/opinion_congreso.wav')} volume={vol} />}
    </AbsoluteFill>
  );
};
