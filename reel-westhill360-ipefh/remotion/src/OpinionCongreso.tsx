import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from './components';
import {Banner, Sfx} from './shots';
import {C, F, SAFE_X, ease, tw} from './theme';
import {VOZ_TRAMOS} from './preguntasVoz';

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

// Respuestas completas. Se quitan muletillas y tropiezos ("este", "pues", "bueno", "eh", "y nada", "¿no?",
// "y así", palabras repetidas) cortando entre palabras; los cortes se midieron con tiempos por palabra
// (Parakeet v3) y la energía de la voz para no cortar sílabas.
const Q1: Resp[] = [
  {
    n: 'e1',
    segs: [[0.35, 2.52], [3.24, 9.26], [9.9, 11.62], [13.14, 14.04], [14.6, 19.12]],
    texto: [
      'A mí lo que me gustó en general fue',
      'la actitud de todos los *ponentes*. Su manera de explicar fue bastante *entretenida*, y la verdad,',
      'son personas con mucho *conocimiento*.',
      'Es la primera vez,',
      'y la verdad fue *maravilloso* para mí estar en el Congreso el día de hoy.',
    ],
    cubre: [[2.6, 3.0, 'a2', 0.3], [8.0, 2.6, 'a5', 0.2]],
  },
  {
    n: 'e2',
    segs: [[0.43, 17.17], [18.27, 28.88], [29.7, 36.8]],
    texto: [
      'En mi opinión, creo que está súper bien que hagan esta parte de los congresos, porque así podemos *conectar* con los *ministros* que vienen, con las personas de la fiscalía. Nos ayuda a integrarnos un poco más con ellos, a ampliar nuestro mundo *laboral* y nuestras mentes, obviamente, para que',
      'podamos conectar un poco más con las personas, con los fiscales, con los docentes. Entonces siento que está súper bien que hagan esto, y con las personas que también vienen de afuera, los exteriores.',
      'A mí la verdad me gustó mucho. Es la primera vez que estoy en un Congreso, y lo *repetiría* otra vez, sin duda.',
    ],
    cubre: [[3.5, 3.4, 'a4', 0.3], [17.0, 2.7, 'a7', 0.3], [26.5, 3.4, 'a1', 8.0]],
  },
  {
    n: 'e4',
    segs: [[2.92, 21.12]],
    texto: [
      'Hola, mi nombre es Susan, soy estudiante de Derecho, y mi opinión general del Congreso fue que fue un Congreso bastante *enriquecedor*. Trajeron ponentes bastante buenos, y la verdad es que fue una *experiencia* muy grata para mí el poder convivir con personalidades tan *importantes* y relevantes, y que nos han aportado bastante conocimiento en este día.',
    ],
    cubre: [[10.6, 2.7, 'a7', 3.2], [15.0, 3.0, 'a1', 4.0]],
  },
  {
    n: 'e3',
    segs: [[13.45, 18.45], [18.69, 23.5]],
    texto: ['Y en general, siento que es una muy buena conferencia, un Congreso muy bueno.', 'Cada una de las conferencias estuvo *increíble*, y me encanta, chicos. ¡Muchas *gracias*, adiós!'],
    cubre: [[4.4, 3.0, 'a6', 0.0]],
  },
  {
    n: 'e5',
    segs: [[2.62, 11.99], [12.7, 28.62], [29.3, 32.74]],
    texto: [
      'Hola, mi nombre es Emily, y yo creo que mi parte general del Congreso fue que llevamos *conocimiento* de los diferentes ministros, porque',
      'el conocimiento hace la *diferencia* para tu nivel académico y tu formación académica día a día, porque no nos estancamos solamente en temas generales, sino tenemos más conocimiento contundente de las diferentes ramas.',
      'Obtener opiniones de *ministros* es súper fundamental.',
    ],
    cubre: [[6.0, 3.4, 'a1', 0.3], [15.5, 3.0, 'a2', 3.5], [25.2, 3.4, 'a4', 4.4]],
  },
];
const Q2: Resp[] = [
  {
    n: 'e1',
    segs: [[20.62, 27.46], [28.96, 32.16]],
    texto: ['Mi parte favorita en el Congreso fue la última *conferencia* que tuvimos con el doctor que es ministro.', 'Siento que *conectó* bien con el público, y eso lo hizo más entretenido.'],
    cubre: [[6.5, 3.5, 'a8', 0.0]],
  },
  {
    n: 'e2',
    segs: [[38.18, 45.08], [48.73, 55.86]],
    texto: ['Mi parte favorita del Congreso fue sobre la *inteligencia artificial*. Me gustó mucho la interacción que tuvo', 'el ministro con todos los presentes, cómo lo explicó, los videos. En general estuvo muy padre y *divertido*.'],
    cubre: [[1.5, 3.0, 'a5', 3.6], [8.5, 3.0, 'a3', 5.0]],
  },
  {
    n: 'e3',
    segs: [[0.1, 1.36], [1.88, 6.67], [6.8, 7.82], [8.84, 12.47]],
    texto: ['Hola, yo soy Emily.', 'La verdad, mi parte favorita del Congreso fue lo de la *inteligencia artificial*, ya que', 'yo sí lo utilizo.', 'Sí me ayudó un poco a comprender un poco de los *datos personales*.'],
    cubre: [[4.6, 3.4, 'a3', 0.5]],
  },
  {
    n: 'e5',
    segs: [[33.86, 37.22], [40.2, 47.7]],
    texto: ['La parte que más me gustó fue esta parte de la *inteligencia artificial*…', 'la parte de la *inclusión*, y los diferentes tipos de *discapacidades* que puede tener a nivel del derecho.'],
    cubre: [[2.4, 3.0, 'a2', 6.7]],
  },
  {
    n: 'e4',
    segs: [[21.55, 27.25], [28.12, 33.1]],
    texto: ['Y mi parte favorita… es difícil el poder elegir alguna parte favorita, ya que las ponencias fueron', 'bastante buenas, y yo me quedo muy satisfecha y *agradecida* con mi institución por habernos traído este Congreso.'],
  },
  {
    n: 'miguel',
    segs: [[2.9, 15.31], [16.03, 17.36]],
    texto: ['Escoger mi parte favorita fue muy *difícil*, sin duda. Mi parte favorita fue la ponencia del ministro Arístides Guerrero García, la *inteligencia artificial*, así como del ministro Giovanni Azael Mejía, en', '*igualdad* y no discriminación.'],
    cubre: [[5.2, 2.0, 'a5', 6.8]],
  },
];
const Q3: Resp[] = [
  {
    n: 'miguel',
    segs: [[17.58, 31.7]],
    texto: ['*Recomiendo* mucho este Congreso, el Congreso Nacional de Derecho de Universidad Westhill, porque permite que diferentes puntos de vista del más alto nivel converjan en un solo espacio, para permitirnos tener una visión más *holística* sobre el derecho en México y en el mundo.'],
  },
];

const durResp = (r: Resp) => r.segs.reduce((a, [x, y]) => a + sec(y - x), 0);
const durLista = (l: Resp[]) => l.reduce((a, r) => a + durResp(r), 0);

// ---------------------------------------------------------------------------
// Subtítulos: cada palabra se reparte solo dentro de los tramos con voz de su grabación (preguntasVoz.ts),
// así entra justo cuando se dice. Se muestran en frases de hasta dos renglones; cada palabra sube desde abajo
// con un desvanecido suave al decirse, y al pasar a la siguiente frase la anterior sube y se desvanece.
// Las palabras clave van en amarillo.
// ---------------------------------------------------------------------------
type Palabra = {w: string; t0: number; t1: number; clave: boolean};
const palabras = (r: Resp): Palabra[] => {
  const out: Palabra[] = [];
  let base = 0;
  r.segs.forEach(([a, b], j) => {
    const d = sec(b - a);
    // tramos con voz dentro de este segmento, en cuadros relativos a la respuesta
    const voz = (VOZ_TRAMOS[r.n] ?? [])
      .map(([x, y]) => [Math.max(x, a), Math.min(y, b)] as [number, number])
      .filter(([x, y]) => y - x > 0.04)
      .map(([x, y]) => [base + (x - a) * FPS, base + (y - a) * FPS] as [number, number]);
    const tramos = voz.length ? voz : [[base + 2, base + d - 2] as [number, number]];
    const totalVoz = tramos.reduce((acc, [x, y]) => acc + (y - x), 0);
    // posición dentro del habla (0..totalVoz) → cuadro
    const aCuadro = (u: number) => {
      let resto = u;
      for (const [x, y] of tramos) {
        if (resto <= y - x) return x + resto;
        resto -= y - x;
      }
      return tramos[tramos.length - 1][1];
    };
    const ws = r.texto[j].split(' ').filter(Boolean);
    const pesos = ws.map((w) => w.replace(/[*,.…?!]/g, '').length + 1.5);
    const total = pesos.reduce((x, y) => x + y, 0);
    let acc = 0;
    ws.forEach((w, k) => {
      const t0 = aCuadro((acc / total) * totalVoz);
      acc += pesos[k];
      const t1 = aCuadro((acc / total) * totalVoz);
      out.push({w: w.replace(/\*/g, ''), t0, t1, clave: w.includes('*')});
    });
    base += d;
  });
  return out;
};
/** frases de hasta ~26 letras por renglón y dos renglones; corta también en la puntuación */
const frases = (ps: Palabra[]): Palabra[][] => {
  const g: Palabra[][] = [];
  let cur: Palabra[] = [];
  ps.forEach((p, i) => {
    cur.push(p);
    const letras = cur.reduce((a, x) => a + x.w.length + 1, 0);
    const sig = ps[i + 1];
    const pausa = /[.…?!]$/.test(p.w) || (/,$/.test(p.w) && letras > 18);
    const lleno = sig ? letras + sig.w.length > 40 : true;
    if (pausa || lleno) {
      g.push(cur);
      cur = [];
    }
  });
  if (cur.length) g.push(cur);
  return g;
};
const Subtitulos: React.FC<{r: Resp}> = ({r}) => {
  const f = useCurrentFrame();
  const gs = frases(palabras(r));
  return (
    <>
      {gs.map((g, k) => {
        const ini = g[0].t0 - 2;
        // la frase sale (sube y se desvanece) justo antes de que entre la siguiente, para no encimarse
        const fin = k < gs.length - 1 ? gs[k + 1][0].t0 - 9 : durResp(r);
        if (f < ini || f > fin + 7) return null;
        const sale = tw(f, [fin, fin + 7], [0, 1], ease.inOut);
        return (
          <div key={k} style={{position: 'absolute', top: 1270, left: SAFE_X - 10, right: SAFE_X - 10, textAlign: 'center', opacity: 1 - sale, transform: `translateY(${-sale * 46}px)`, filter: sale > 0 ? `blur(${sale * 4}px)` : undefined}}>
            {g.map((p, j) => {
              const e = tw(f, [p.t0 - 3, p.t0 + 5], [0, 1], ease.out);
              const dicha = f >= p.t0 - 1;
              return (
                <span key={j} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', padding: '4px 9px 12px', margin: '-4px 0 -12px'}}>
                  <span
                    style={{
                      display: 'inline-block',
                      fontFamily: F.sans,
                      fontWeight: 800,
                      fontSize: 62,
                      lineHeight: 1.22,
                      color: p.clave ? AMARILLO : '#FFFFFF',
                      opacity: e * (dicha ? 1 : 0.9),
                      transform: `translateY(${(1 - e) * 72}px)`,
                      textShadow: '0 3px 0 rgba(0,0,0,0.35), 0 4px 22px rgba(0,0,0,0.75)',
                    }}
                  >
                    {p.w}
                  </span>
                </span>
              );
            })}
          </div>
        );
      })}
    </>
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
      <Sfx at={PRE} name="whoosh" volume={0.3} />
      <Sfx at={PRE + 4} name="pop" volume={0.3} />
    </AbsoluteFill>
  );
};

/**
 * Cierre (8 s) sobre el auditorio lleno: logo de la universidad arriba al centro, "¡GRACIAS!" en dorado con
 * brillo, "a todos los que fueron parte del" + el arte del Onceavo Congreso, fecha y lugar, polvo dorado y una
 * luz que barre la pantalla; al final todo se funde a negro.
 */
export const OUTRO_F = sec(8.0);
const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const oscuro = tw(f, [0, 24], [0, 1], ease.inOut);
  const logo = tw(f, [6, 30], [0, 1]);
  const g = tw(f, [16, 36], [0, 1]);
  const brillo = interpolate(f, [40, 72], [0, 1], clamp);
  const a = tw(f, [30, 48], [0, 1]);
  const lin = tw(f, [40, 64], [0, 1], ease.inOut);
  const c1 = tw(f, [44, 62], [0, 1]);
  const c2 = tw(f, [50, 68], [0, 1]);
  const d = tw(f, [56, 76], [0, 1]);
  const pie = tw(f, [80, 100], [0, 1]);
  const tag = tw(f, [96, 116], [0, 1]);
  const barre = interpolate(f, [70, 120], [-0.3, 1.3], clamp);
  const negro = tw(f, [OUTRO_F - 26, OUTRO_F], [0, 1], ease.inOut);
  const sube = (p: number, dist = 36): React.CSSProperties => ({transform: `translateY(${(1 - p) * dist}px)`, opacity: Math.min(1, p * 1.5)});
  const mask = `linear-gradient(105deg, rgba(0,0,0,0) ${brillo * 140 - 30}%, rgba(0,0,0,1) ${brillo * 140 - 20}%, rgba(0,0,0,0) ${brillo * 140 - 10}%)`;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <OffthreadVideo src={vid('a9')} startFrom={0} muted style={{width: W, height: H, objectFit: 'cover', transform: `scale(${1.04 + 0.07 * (f / OUTRO_F)})`, filter: `blur(${oscuro * 3}px)`}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(6,12,28,0.92) 0%, rgba(6,12,28,0.62) 30%, rgba(6,12,28,0.7) 62%, rgba(6,12,28,0.95) 100%)', opacity: oscuro}} />
      <AbsoluteFill style={{opacity: oscuro}}>
        <Polvo />
      </AbsoluteFill>
      {/* logo arriba al centro */}
      <div style={{position: 'absolute', left: W / 2 - 230, top: 210, width: 460, ...sube(logo, 24), filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.5))'}}>
        <Img src={staticFile('logos/logo_westhill_blanco_total.png')} style={{width: '100%', display: 'block'}} />
      </div>
      {/* ¡GRACIAS! */}
      <div style={{position: 'absolute', left: 0, width: W, top: 560, textAlign: 'center', overflow: 'hidden', padding: '10px 0'}}>
        <div style={{transform: `translateY(${(1 - g) * 110}%)`, opacity: Math.min(1, g * 1.6)}}>
          <span style={{position: 'relative', display: 'inline-block', fontFamily: F.display, fontSize: 196, lineHeight: 1, letterSpacing: 4, backgroundImage: 'linear-gradient(180deg, #FFF1C2 0%, #F0C84A 55%, #B98A1E 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 8px 28px rgba(0,0,0,0.55))'}}>
            ¡GRACIAS!
            {brillo > 0 && brillo < 1 && <span style={{position: 'absolute', inset: 0, color: '#FFFFFF', WebkitMaskImage: mask, maskImage: mask}}>¡GRACIAS!</span>}
          </span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, width: W, top: 800, textAlign: 'center', fontFamily: F.sans, fontWeight: 700, fontSize: 42, color: '#FFFFFF', ...sube(a, 24)}}>a todos los que fueron parte del</div>
      {/* arte del Onceavo Congreso */}
      {/* el arte del PNG está en las filas 722–1060; se baja 150 px para quedar bajo el texto */}
      <AbsoluteFill style={{transform: 'translateY(150px) scale(0.92)', transformOrigin: '540px 722px'}}>
        <Franja y0={722} y1={760} x0={223 + (1 - lin) * 152} x1={376} />
        <Franja y0={722} y1={760} x0={716} x1={869 - (1 - lin) * 152} />
        <div style={{position: 'absolute', left: 376, width: 340, top: 724, textAlign: 'center', fontFamily: F.sans, fontWeight: 800, fontSize: 30, letterSpacing: 10, color: AMARILLO, ...sube(lin, 14)}}>ONCEAVO</div>
        <div style={{position: 'absolute', inset: 0, clipPath: 'inset(780px 0 1052px 0)'}}>
          <Franja y0={780} y1={868} style={{transform: `translateY(${(1 - c1) * 90}px)`}} />
        </div>
        <div style={{position: 'absolute', inset: 0, clipPath: 'inset(864px 0 976px 0)'}}>
          <Franja y0={864} y1={944} style={{transform: `translateY(${(1 - c2) * 84}px)`}} />
        </div>
        <div style={{position: 'absolute', inset: 0, clipPath: 'inset(952px 0 860px 0)'}}>
          <Franja y0={952} y1={1060} style={{transform: `translateY(${(1 - d) * 110}px)`, filter: 'drop-shadow(0 0 18px rgba(240,200,74,0.35))'}} />
        </div>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, width: W, top: 1268, textAlign: 'center', ...sube(pie, 20)}}>
        <div style={{width: 120, height: 3, background: AMARILLO, margin: '0 auto 22px', borderRadius: 2}} />
        <div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 32, letterSpacing: 2, color: '#E6ECF3'}}>13 de noviembre · Auditorio de la Universidad</div>
      </div>
      <div style={{position: 'absolute', left: 0, width: W, top: 1360, textAlign: 'center', fontFamily: F.sans, fontWeight: 800, fontSize: 30, letterSpacing: 10, color: AMARILLO, ...sube(tag, 16)}}>#SOMOSWESTHILL</div>
      {/* luz que barre la pantalla */}
      <AbsoluteFill style={{background: `linear-gradient(105deg, rgba(255,240,200,0) ${barre * 100 - 18}%, rgba(255,240,200,0.14) ${barre * 100}%, rgba(255,240,200,0) ${barre * 100 + 18}%)`, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{background: '#000', opacity: negro}} />
      <Sfx at={2} name="whoosh_largo" volume={0.3} />
      <Sfx at={16} name="impact" volume={0.4} />
      <Sfx at={44} name="whoosh" volume={0.25} />
      <Sfx at={80} name="ding" volume={0.25} />
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
    return interpolate(fr, [s, s + 10], [nivel(i - 1), nivel(i)], clamp) * interpolate(fr, [0, 10, OPINION_FRAMES - 40, OPINION_FRAMES], [0, 1, 1, 0], clamp);
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
