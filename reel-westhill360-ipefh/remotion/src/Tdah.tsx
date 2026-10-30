import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain, ScriptWord} from './components';
import {Banner, Sfx} from './shots';
import {C, F, SAFE_X, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Reel de Inclusión: "¿Y tú, sabes qué es el TDAH?" (entrevistas en la universidad).
// Las entrevistas se aprietan con cortes: se quitan pausas, muletillas y las preguntas de la entrevistadora;
// cada corte alterna un ligero acercamiento para que se sienta dinámico. Subtítulos por frases con palabras
// clave en amarillo. Bloques con preguntas en motion graphics y un outro nuevo.
// Clips en public/proxies/tdah (iN = presentadora, eN = entrevistas; *_limpio = audio limpio).
// Tramos medidos con Whisper + silencedetect (scripts en el historial de la sesión).
// ---------------------------------------------------------------------------
const sec = (s: number) => Math.round(s * 30);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const AZUL = C.azul;
const AZUL_CL = C.azulClaro;
const AMARILLO = C.amarillo;
const VERDE = '#1FB37A';
const MARINO = C.marino;

type Tramo = [number, number];
type Resp = {n: string; segs: Tramo[]; texto: string};

const HOOK: Resp[] = [
  {n: 'i1', segs: [[0.0, 0.8]], texto: '¿Y tú…'},
  {n: 'i2', segs: [[1.62, 3.0]], texto: '…sabes qué es el *TDAH*?'},
];
const QUE: Resp[] = [
  {n: 'e1', segs: [[5.92, 8.94]], texto: 'Sí, el TDA es un *trastorno* de *déficit de atención*'},
  {n: 'e3', segs: [[5.7, 8.67]], texto: 'Es el trastorno por *déficit de atención* e *hiperactividad*'},
  {n: 'e5', segs: [[10.26, 12.56]], texto: 'Es un trastorno de déficit de atención e *hiperactividad*'},
  {n: 'e2', segs: [[14.79, 17.89]], texto: '…que tienen *dificultad* en poner atención'},
];
const COMO: Resp[] = [
  {n: 'e1', segs: [[9.53, 15.19]], texto: 'Existen dos tipos… el TDA es cuando las personas están muy *distraídas*'},
  {n: 'e4', segs: [[16.77, 21.39], [21.54, 22.71]], texto: 'Les cuesta mucho poner atención, son un poco *impulsivos*… son muy *dispersos*'},
  {n: 'e7', segs: [[22.92, 24.91], [25.13, 28.75]], texto: 'Falta de atención… una persona que *escucha poco* y que suele estar *dispersa*'},
  {n: 'e4', segs: [[29.25, 36.39]], texto: 'Se presenta en general en todas las poblaciones, ya sea *adultos* o *niños*'},
];
const CONOCES: Resp[] = [
  {n: 'e2', segs: [[26.12, 28.14], [28.35, 29.22], [29.83, 33.21]], texto: 'Mi *hermano menor* tiene 9 años… y pues sí, es mucho trabajo con él'},
  {n: 'e1', segs: [[33.66, 37.25], [37.82, 43.06]], texto: 'Tengo un *amigo* que estudia arquitectura que tiene TDAH… es muy distraído, *hiperactivo*, le gusta estar haciendo muchas cosas'},
  {n: 'e6', segs: [[13.09, 19.84]], texto: 'No conozco a nadie personalmente, pero creo que es algo *muy común*… muchos aquí podríamos *identificarnos*'},
  {n: 'e7', segs: [[43.34, 50.18]], texto: 'Le brindaba *estrategias*, daba mayor contención, *lo escuchaba* y pasaba mayor tiempo con él'},
];
const HOST: Resp[] = [
  {n: 'i3', segs: [[0.94, 5.62], [5.72, 7.03]], texto: 'Es una condición del *neurodesarrollo* que afecta la *atención*, la *impulsividad* y el *nivel de actividad*'},
  {n: 'i4', segs: [[0.71, 1.23], [1.81, 6.5]], texto: 'No es *flojera* ni falta de ganas, es simplemente que el cerebro *funciona diferente*'},
];

const durResp = (r: Resp) => r.segs.reduce((a, [x, y]) => a + sec(y - x), 0);
const durLista = (l: Resp[]) => l.reduce((a, r) => a + durResp(r), 0);

/** Toma de una respuesta: tramos pegados con corte seco y acercamiento alterno */
const RespuestaClip: React.FC<{r: Resp; k: number}> = ({r, k}) => {
  const f = useCurrentFrame();
  let acc = 0;
  const entra = tw(f, [0, 7], [0, 1], ease.out);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {r.segs.map(([a, b], j) => {
        const d = sec(b - a);
        const from = acc;
        acc += d;
        const zoom = (k + j) % 2 === 0 ? 1.0 : 1.14;
        return (
          <Sequence key={j} from={from} durationInFrames={d}>
            <AbsoluteFill style={{transform: `scale(${zoom + 0.03 * ((f - from) / d)}) translateX(${j === 0 ? (1 - entra) * (k % 2 ? 90 : -90) : 0}px)`, transformOrigin: '50% 38%', filter: j === 0 ? `blur(${(1 - entra) * 10}px)` : 'none'}}>
              <OffthreadVideo src={staticFile(`proxies/tdah/${r.n}_limpio.mp4`)} startFrom={sec(a)} style={{width: 1080, height: 1920, objectFit: 'cover'}} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)'}} />
    </AbsoluteFill>
  );
};

/** Subtítulo por frases (máx ~4 palabras), con las palabras *marcadas* en amarillo */
const Subtitulo: React.FC<{texto: string; dur: number}> = ({texto, dur}) => {
  const f = useCurrentFrame();
  const palabras = texto.split(' ');
  const trozos: string[][] = [];
  let cur: string[] = [];
  palabras.forEach((w) => {
    cur.push(w);
    if (cur.length >= 4 || /[…,.?]$/.test(w.replace(/\*/g, ''))) {
      trozos.push(cur);
      cur = [];
    }
  });
  if (cur.length) trozos.push(cur);
  const letras = trozos.map((t) => t.join(' ').length);
  const total = letras.reduce((a, b) => a + b, 0);
  let acc = 0;
  const tiempos = letras.map((l) => {
    const a = (acc / total) * dur;
    acc += l;
    return a;
  });
  const i = Math.max(0, tiempos.filter((t) => f >= t).length - 1);
  const t0 = tiempos[i];
  const p = tw(f, [t0, t0 + 5], [0, 1], ease.back);
  return (
    <div style={{position: 'absolute', top: 1330, left: SAFE_X, right: SAFE_X, textAlign: 'center'}}>
      <div style={{display: 'inline-block', transform: `scale(${0.85 + 0.15 * p})`, opacity: Math.min(1, p * 2)}}>
        {trozos[i].map((w, j) => {
          const marca = w.includes('*');
          return (
            <span
              key={j}
              style={{
                fontFamily: F.sans,
                fontWeight: 900,
                fontSize: 64,
                lineHeight: 1.2,
                color: marca ? AMARILLO : '#fff',
                textTransform: 'uppercase',
                WebkitTextStroke: '2px rgba(0,0,0,0.35)',
                textShadow: '0 5px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.5)',
                marginRight: '0.25em',
                display: 'inline-block',
              }}
            >
              {w.replace(/\*/g, '')}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/** Bloque de respuestas: tomas seguidas con subtítulos */
const Bloque: React.FC<{lista: Resp[]; pregunta?: string; num?: string}> = ({lista, pregunta, num}) => {
  const f = useCurrentFrame();
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
            <Subtitulo texto={r.texto} dur={d} />
            <Sfx at={0} name={k % 2 ? 'whoosh' : 'swipe'} volume={0.25} />
          </Sequence>
        );
      })}
      {pregunta && (
        <div style={{position: 'absolute', top: 300, left: SAFE_X, opacity: tw(f, [4, 14], [0, 1]), transform: `translateX(${(1 - tw(f, [4, 16], [0, 1], ease.out)) * -60}px)`}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 14, background: 'rgba(14,30,52,0.82)', padding: '12px 26px 12px 14px', borderRadius: 50, border: `3px solid ${AMARILLO}`}}>
            <span style={{background: AMARILLO, color: MARINO, fontFamily: F.display, fontSize: 34, borderRadius: 30, padding: '2px 14px'}}>{num}</span>
            <span style={{fontFamily: F.sans, fontWeight: 800, fontSize: 34, color: '#fff'}}>{pregunta}</span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Motion graphics
// ---------------------------------------------------------------------------
const FondoMG: React.FC<{color?: string}> = ({color = AZUL}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: MARINO, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, ${color} 0%, rgba(20,35,60,0) 70%)`, opacity: 0.85}} />
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 2.5px, transparent 3px)',
          backgroundSize: '54px 54px',
          backgroundPosition: `${(f * 0.8) % 54}px ${(f * 0.5) % 54}px`,
          maskImage: 'radial-gradient(ellipse at 50% 50%, #000 15%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, #000 15%, transparent 75%)',
        }}
      />
    </AbsoluteFill>
  );
};

/** Garabatos que orbitan (la mente que se mueve por todos lados) */
const Garabatos: React.FC<{n?: number}> = ({n = 7}) => {
  const f = useCurrentFrame();
  const formas = ['M-20 0 Q0 -30 20 0 T60 0', 'M0 -18 L5 -5 L18 0 L5 5 L0 18 L-5 5 L-18 0 L-5 -5 Z', 'M-14 -14 L14 14 M14 -14 L-14 14', 'M0 0 m-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0'];
  const cols = [AMARILLO, VERDE, '#fff', AZUL_CL];
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const ang = f / (40 + i * 6) + i * 1.3;
        const r = 360 + (i % 3) * 70;
        const x = 540 + Math.cos(ang) * r;
        const y = 900 + Math.sin(ang * 1.2) * (r + 120);
        return (
          <svg key={i} width={120} height={120} viewBox="-60 -60 120 120" style={{position: 'absolute', left: x - 60, top: y - 60, transform: `rotate(${f * (i % 2 ? 2 : -2)}deg)`, opacity: 0.8}}>
            <path d={formas[i % formas.length]} fill={i % 4 === 1 ? cols[i % 4] : 'none'} stroke={cols[i % 4]} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      })}
    </>
  );
};

/** Título: ¿Sabes qué es el TDAH? → T·D·A·H se despliega en su nombre completo */
export const TITULO_F = 120;
const SIGLAS: [string, string][] = [
  ['T', 'rastorno por'],
  ['D', 'éficit de'],
  ['A', 'tención e'],
  ['H', 'iperactividad'],
];
const TituloTdah: React.FC = () => {
  const f = useCurrentFrame();
  const q = tw(f, [2, 14], [0, 1], ease.back);
  const abre = tw(f, [52, 70], [0, 1], ease.inOut);
  const salida = tw(f, [TITULO_F - 10, TITULO_F], [0, 1], ease.in);
  return (
    <AbsoluteFill>
      <FondoMG />
      <Garabatos />
      <AbsoluteFill style={{transform: `scale(${1 + salida * 2})`, opacity: 1 - salida}}>
        <div style={{position: 'absolute', top: 380, width: '100%', textAlign: 'center', opacity: q, transform: `translateY(${(1 - q) * -40}px)`}}>
          <span style={{fontFamily: F.sans, fontWeight: 800, fontSize: 56, color: '#fff'}}>¿Sabes qué es el</span>
        </div>
        <div style={{position: 'absolute', top: 520, left: 0, right: 0}}>
          {SIGLAS.map(([l, resto], i) => {
            const cae = tw(f, [10 + i * 6, 22 + i * 6], [0, 1], ease.back);
            const fila = abre;
            // al principio en fila (TDAH grande); luego en columna con la palabra completa
            const x0 = 540 + (i - 1.5) * 215;
            const y0 = 80;
            const x1 = 110;
            const y1 = i * 185;
            const x = interpolate(fila, [0, 1], [x0, x1]);
            const y = interpolate(fila, [0, 1], [y0, y1]);
            const s = interpolate(fila, [0, 1], [1.25, 0.82]);
            const r = tw(f, [62 + i * 6, 80 + i * 6], [0, 1], ease.out);
            return (
              <div key={l} style={{position: 'absolute', left: x, top: y, transform: `translate(${-50 * (1 - fila)}%, ${(1 - cae) * -500}px) scale(${s})`, transformOrigin: `${50 * (1 - fila)}% 50%`, display: 'flex', alignItems: 'baseline'}}>
                <span style={{fontFamily: F.display, fontSize: 210, lineHeight: 1, color: i % 2 ? AMARILLO : '#fff', textShadow: '0 10px 30px rgba(0,0,0,0.35)'}}>{l}</span>
                <span style={{fontFamily: F.sans, fontWeight: 800, fontSize: 76, color: '#fff', whiteSpace: 'nowrap', clipPath: `inset(0 ${(1 - r) * 100}% 0 0)`, marginLeft: 6, maxWidth: fila < 0.5 ? 0 : 900, overflow: fila < 0.5 ? 'hidden' : 'visible'}}>{resto}</span>
              </div>
            );
          })}
        </div>
        <div style={{position: 'absolute', top: 1340, width: '100%', textAlign: 'center', opacity: tw(f, [20, 32], [0, 1]) * (1 - abre), fontFamily: F.display, fontSize: 160, color: AMARILLO}}>?</div>
      </AbsoluteFill>
      {SIGLAS.map((_, i) => (
        <Sfx key={i} at={18 + i * 6} name="pop" volume={0.5} />
      ))}
      <Sfx at={52} name="whoosh" volume={0.45} />
      <Sfx at={62} name="taps" volume={0.35} />
      <Sfx at={TITULO_F - 10} name="whoosh_largo" volume={0.4} />
    </AbsoluteFill>
  );
};

/** Tarjeta de sección: número + pregunta */
export const SECCION_F = 42;
/** La tarjeta entra PRE cuadros antes de su lugar (barre sobre la toma anterior) y sale PRE cuadros
 *  sobre la toma siguiente, para que nunca se vea negro entre tomas */
const PRE = 10;
const Seccion: React.FC<{num: string; titulo: string; color?: string}> = ({num, titulo, color = AZUL}) => {
  const f = useCurrentFrame();
  const barre = tw(f, [0, PRE], [0, 1], ease.inOut);
  const n = tw(f, [PRE - 4, PRE + 6], [0, 1], ease.back);
  const t = tw(f, [PRE - 2, PRE + 8], [0, 1], ease.back);
  const sale = tw(f, [SECCION_F + PRE, SECCION_F + 2 * PRE], [0, 1], ease.in);
  return (
    <AbsoluteFill style={{clipPath: `inset(0 ${sale * 100}% 0 ${(1 - barre) * 100}%)`}}>
      <FondoMG color={color} />
      <Garabatos n={5} />
      <div style={{position: 'absolute', top: 700, width: '100%', textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: AMARILLO, color: MARINO, fontFamily: F.display, fontSize: 90, padding: '0 34px', borderRadius: 20, transform: `scale(${n}) rotate(${(1 - n) * -20}deg)`}}>{num}</div>
        <div style={{marginTop: 30, fontFamily: F.display, fontSize: 130, lineHeight: 1.05, color: '#fff', transform: `scale(${t})`, padding: '0 60px'}}>{titulo}</div>
      </div>
      <Sfx at={0} name="whoosh" volume={0.45} />
      <Sfx at={4} name="pop" volume={0.5} />
    </AbsoluteFill>
  );
};

/** Outro: "No es flojera…" → "La inclusión empieza por entender" → logo */
export const OUTRO_F = 270;
const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const a = tw(f, [6, 18], [0, 1], ease.back);
  const tacha = tw(f, [26, 36], [0, 1], ease.inOut);
  const b = tw(f, [40, 56], [0, 1], ease.back);
  const cambio = tw(f, [100, 116], [0, 1], ease.inOut);
  const c1 = tw(f, [112, 126], [0, 1]);
  const c2 = tw(f, [122, 140], [0, 1], ease.back);
  const logo = tw(f, [170, 192], [0, 1]);
  const pie = tw(f, [188, 202], [0, 1]);
  const negro = tw(f, [OUTRO_F - 22, OUTRO_F], [0, 1]);
  const late = 1 + 0.07 * Math.max(0, Math.sin(((f - 140) / 30) * Math.PI * 2)) ** 6;
  return (
    <AbsoluteFill>
      <FondoMG />
      <Garabatos />
      {/* parte 1 */}
      <AbsoluteFill style={{opacity: 1 - cambio, transform: `translateY(${-cambio * 120}px)`}}>
        <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center'}}>
          <div style={{position: 'relative', display: 'inline-block', fontFamily: F.display, fontSize: 120, color: '#fff', transform: `scale(${a})`, opacity: 1 - tacha * 0.45}}>
            NO ES FLOJERA
            <div style={{position: 'absolute', left: -10, top: '52%', height: 14, borderRadius: 8, width: `${tacha * 104}%`, background: '#E8545C', transform: 'rotate(-3deg)'}} />
          </div>
          <div style={{marginTop: 40, fontFamily: F.sans, fontWeight: 700, fontSize: 52, color: '#E6ECF3', opacity: b, transform: `translateY(${(1 - b) * 20}px)`}}>Es un cerebro que</div>
          <div style={{marginTop: 6}}>
            <ScriptWord text="funciona diferente" start={48} size={130} neon tilt={-5} dur={16} />
          </div>
        </div>
      </AbsoluteFill>
      {/* parte 2 */}
      <AbsoluteFill style={{opacity: cambio}}>
        <div style={{position: 'absolute', top: 470, width: '100%', textAlign: 'center'}}>
          <div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 54, color: '#E6ECF3', opacity: c1, transform: `translateY(${(1 - c1) * 20}px)`}}>La inclusión empieza por</div>
          <div style={{marginTop: 8, fontFamily: F.display, fontSize: 190, lineHeight: 1, color: AMARILLO, transform: `scale(${c2})`, textShadow: '0 10px 40px rgba(0,0,0,0.35)'}}>ENTENDER</div>
          <div style={{marginTop: 10, fontSize: 110, transform: `scale(${tw(f, [138, 150], [0, 1], ease.back) * late})`}}>💙</div>
        </div>
        <div style={{position: 'absolute', left: 260, top: 1080, width: 560, clipPath: `inset(0 0 ${(1 - logo) * 100}% 0)`, transform: `translateY(${(1 - logo) * 24}px)`}}>
          <Img src={staticFile('logos/logo_westhill_blanco_total.png')} style={{width: '100%'}} />
        </div>
        <div style={{position: 'absolute', top: 1360, width: '100%', textAlign: 'center', opacity: pie}}>
          <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 34, letterSpacing: 6, color: '#fff'}}>COORDINACIÓN DE INCLUSIÓN</div>
          <div style={{marginTop: 14, fontFamily: F.sans, fontWeight: 800, fontSize: 30, letterSpacing: 8, color: AMARILLO}}>#SOMOSWESTHILL</div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#000', opacity: negro}} />
      <Sfx at={6} name="impact" volume={0.5} />
      <Sfx at={26} name="click" volume={0.5} />
      <Sfx at={48} name="flicker" volume={0.45} />
      <Sfx at={100} name="whoosh_largo" volume={0.4} />
      <Sfx at={122} name="impact" volume={0.5} />
      <Sfx at={140} name="ding" volume={0.45} />
      <Sfx at={170} name="whoosh" volume={0.35} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Línea de tiempo
// ---------------------------------------------------------------------------
type Pieza = {dur: number; el: React.ReactNode; voz?: boolean; tarjeta?: boolean};
const PIEZAS: Pieza[] = [
  {dur: durLista(HOOK), el: <Bloque lista={HOOK} />, voz: true},
  {dur: TITULO_F, el: <TituloTdah />},
  {dur: SECCION_F, tarjeta: true, el: <Seccion num="01" titulo="¿Qué es?" />},
  {dur: durLista(QUE), el: <Bloque lista={QUE} pregunta="¿Qué es el TDAH?" num="01" />, voz: true},
  {dur: SECCION_F, tarjeta: true, el: <Seccion num="02" titulo="¿Cómo se ve?" color={VERDE} />},
  {dur: durLista(COMO), el: <Bloque lista={COMO} pregunta="¿Cómo se manifiesta?" num="02" />, voz: true},
  {dur: SECCION_F, tarjeta: true, el: <Seccion num="03" titulo="¿Conoces a alguien?" color={AZUL_CL} />},
  {dur: durLista(CONOCES), el: <Bloque lista={CONOCES} pregunta="¿Conoces a alguien con TDAH?" num="03" />, voz: true},
  {dur: SECCION_F, tarjeta: true, el: <Seccion num="✓" titulo="Lo que hay que saber" color={AZUL} />},
  {dur: durLista(HOST), el: <Bloque lista={HOST} />, voz: true},
  {dur: OUTRO_F, el: <Outro />},
];
const STARTS = PIEZAS.reduce<number[]>((a, p, i) => [...a, i === 0 ? 0 : a[i - 1] + PIEZAS[i - 1].dur], []);
export const TDAH_FRAMES = STARTS[STARTS.length - 1] + PIEZAS[PIEZAS.length - 1].dur;
export const TDAH_MARCAS = {titulo: STARTS[1] / 30, host: STARTS[9] / 30, outro: STARTS[10] / 30, fin: TDAH_FRAMES / 30};

export const Tdah: React.FC<{music?: boolean}> = ({music = true}) => {
  // la música baja cuando hay voz y sube en los motion graphics
  const vol = (fr: number) => {
    const i = STARTS.findIndex((s, k) => fr >= s && fr < s + PIEZAS[k].dur);
    const v = i >= 0 && PIEZAS[i].voz ? 0.13 : 0.5;
    const prevV = i > 0 && PIEZAS[i - 1].voz ? 0.13 : 0.5;
    const s = STARTS[Math.max(0, i)];
    return interpolate(fr, [s, s + 8], [prevV, v], clamp) * interpolate(fr, [TDAH_FRAMES - 30, TDAH_FRAMES], [1, 0], clamp);
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
      {/* tarjetas de sección encima, traslapadas con la toma anterior y la siguiente */}
      {PIEZAS.map((p, i) =>
        p.tarjeta ? (
          <Sequence key={`t${i}`} from={STARTS[i] - PRE} durationInFrames={p.dur + 2 * PRE}>
            {p.el}
          </Sequence>
        ) : null,
      )}
      <Sequence from={STARTS[2]} durationInFrames={STARTS[10] - STARTS[2]}>
        <Banner />
      </Sequence>
      <Grain opacity={0.04} />
      {music && <Audio src={staticFile('music/tdah_fondo.mp3')} volume={vol} />}
    </AbsoluteFill>
  );
};
