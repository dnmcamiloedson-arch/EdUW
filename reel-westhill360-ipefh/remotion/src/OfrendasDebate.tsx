import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from './components';
import {Sfx} from './shots';
import {C, F, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Debate del concurso de ofrendas: "A su criterio, ¿quién fue el ganador?"
//  1. Intro: la historia de Instagram (grabación de pantalla) dentro de un celular, hasta abrir respuestas.
//     La grabación ya viene sin barra de estado y con fotos/nombres desenfocados (scripts/historia_privada.py).
//  2. Negro y suspenso: las respuestas caen como lluvia con profundidad y luego se arman en collage.
//     Cada respuesta se redibuja: foto de perfil -> círculo de color sin cara, nombre recortado (al•••rm).
//  3. Gráfica animada con el conteo de votos (una respuesta por persona).
//  4. Cierre: "¿Derecho o Psicología?".
// Colores de Día de Muertos: Derecho = cempasúchil, Psicología = rosa mexicano.
// ---------------------------------------------------------------------------
const sec = (s: number) => Math.round(s * 30);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const CEMPA = '#FF8A1F';
const ROSA = '#E8237F';
const MORADO = '#6B2FB3';
const NEGRO = '#07060A';

type Voto = 'D' | 'P' | 'O';
/** Respuestas tal como aparecen en la historia (en orden), sin repetir personas.
 *  Los nombres se guardan ya recortados: aquí no se guarda ningún usuario completo. */
const RESPUESTAS: [string, string, Voto][] = [
  ['al•••rm', 'Derecho es la mejor', 'D'],
  ['kp•••_a', 'NEGOCIOS 🗣️', 'O'],
  ['so•••••ir', 'Medicina', 'O'],
  ['rv•••20', 'Negocios', 'O'],
  ['ha••••••72', 'Derecho y Estudios Internacionales', 'D'],
  ['ka•••••ll', 'Derecho', 'D'],
  ['ps••••li', 'Psicología', 'P'],
  ['bo••••••y_', 'La hermosa Facultad de Derecho 🫶🫶🫶', 'D'],
  ['sa••••••gh', 'La de pedagogía', 'O'],
  ['bo••••••aa', 'Psic ! ❤️', 'P'],
  ['el••••••is', 'Medicina', 'O'],
  ['re•••••to', 'Psicologiaaaa!', 'P'],
  ['st••••bc', 'Psicología', 'P'],
  ['da•••••hv', 'Derecho', 'D'],
  ['ke••••31', 'Brujas', 'O'],
  ['so••••••r_', 'Psicología', 'P'],
  ['em••••••14', 'Derecho', 'D'],
  ['he••••c_', 'Psicología', 'P'],
  ['__•••••__', 'derecho', 'D'],
  ['ka•••••st', 'Psicología', 'P'],
  ['ca••••••zc', 'las brujas', 'O'],
  ['an•••••12', 'Pq suben foto de todas las ofrendas y no de la de psico? sospechosoooo', 'P'],
  ['os••••••r9', 'Por mucho Facultad de Psicología y Ciencias de la Educación. La duda ¿qué pasó?', 'P'],
  ['an••••••15', 'Economia', 'O'],
  ['ig•••76', 'DERECHO, SIN DUDA!!!', 'D'],
  ['ci••••••r_', 'el disfraz de la rata', 'O'],
  ['oo••••••27', 'psicologia', 'P'],
  ['ar••••••am', 'psicología', 'P'],
  ['ca••••••oo', 'Psicología!', 'P'],
  ['dr••••••ch', 'Psicología', 'P'],
  ['go••••••da', 'Derecho, presentación impecable de equipo ante Rector y Jurado.', 'D'],
  ['ma••••••23', 'Derecho aunque de estructura psicológica', 'D'],
  ['xi••••••80', 'La ratita que sale bailando al inicio', 'O'],
  ['_m••••••._', 'La leyenda de las brujas', 'O'],
  ['so••••••mo', 'Psicología', 'P'],
  ['na••••••is', 'Psicología', 'P'],
  ['pr••••••ta', 'La ofrenda de las brujas', 'O'],
  ['fv••••fi', 'Psicología', 'P'],
  ['_a•••••__', 'Psicología', 'P'],
  ['al••••••ss', 'Derecho 😮‍💨', 'D'],
  ['ad••••••5_', 'la 2', 'O'],
  ['ac••••••ra', 'Psicología 🙂🙌🖤', 'P'],
  ['y9••••vv', 'PSICOLOGÍA!!', 'P'],
  ['al••••••z_', 'Psicología', 'P'],
  ['so••••••o_', 'Arquitecturaaa', 'O'],
  ['al••••••zz', 'psicología y pedagogía', 'P'],
  ['ma•••••z_', 'Psicología', 'P'],
  ['re••••••ez', 'psicología', 'P'],
  ['ra••••••ec', 'Psicologia', 'P'],
  ['c.•••kk', 'derecho', 'D'],
  ['li••••••59', 'Psicología y ciencias de la educación', 'P'],
  ['or••••••ze', 'psicología y ciencias de la comunicación', 'P'],
  ['fe••••••na', 'Psicología', 'P'],
  ['de••••••16', 'Psicológia', 'P'],
  ['_r••••••pe', 'Pedagogía y psicología', 'P'],
  ['re••••••_c', 'negocios', 'O'],
  ['am•••••rt', 'Arq 😔', 'O'],
  ['vi••••gu', 'Los de psicología', 'P'],
  ['zu•••••to', 'Psicología', 'P'],
  ['ma••••••06', 'Pedagogía, psicología y inclusión', 'P'],
  ['ro••••••zz', 'Obvio derecho', 'D'],
  ['da••••••11', 'Arqui', 'O'],
  ['ta••••••do', 'Pedagogía', 'O'],
  ['va••••••no', 'negocios', 'O'],
  ['na•••••06', 'Pedagogía y psicología', 'P'],
  ['mi••••••ar', 'Derecho', 'D'],
];
/** Conteo para la gráfica (una respuesta por persona) */
const CONTEO: {label: string; n: number; color: string}[] = [
  {label: 'Psicología', n: 33, color: ROSA},
  {label: 'Derecho', n: 14, color: CEMPA},
  {label: 'Negocios', n: 4, color: '#8E8AA8'},
  {label: 'Las brujas', n: 4, color: '#8E8AA8'},
  {label: 'Arquitectura', n: 3, color: '#8E8AA8'},
  {label: 'Medicina', n: 2, color: '#8E8AA8'},
  {label: 'Pedagogía', n: 2, color: '#8E8AA8'},
  {label: 'El ratón', n: 2, color: '#8E8AA8'},
  {label: 'Economía', n: 1, color: '#8E8AA8'},
];
const TOTAL = CONTEO.reduce((a, c) => a + c.n, 0);

const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const AVATAR = [
  ['#FF9A3C', '#E8237F'],
  ['#6B2FB3', '#E8237F'],
  ['#2D9CDB', '#6B2FB3'],
  ['#FFB800', '#FF5E3A'],
  ['#1FB37A', '#2D9CDB'],
];

/** Tarjeta de respuesta redibujada (estilo de Instagram), sin foto ni nombre completo */
const Tarjeta: React.FC<{i: number; w?: number; tinte?: number}> = ({i, w = 460, tinte = 0}) => {
  const [u, t, v] = RESPUESTAS[i];
  const [a, b] = AVATAR[i % AVATAR.length];
  const fs = t.length > 40 ? w * 0.062 : t.length > 22 ? w * 0.072 : w * 0.085;
  const borde = v === 'P' ? ROSA : v === 'D' ? CEMPA : '#8E8AA8';
  return (
    <div style={{width: w, borderRadius: w * 0.055, overflow: 'hidden', background: '#fff', boxShadow: `0 ${w * 0.03}px ${w * 0.08}px rgba(0,0,0,0.5)${tinte > 0 ? `, 0 0 0 ${w * 0.018 * tinte}px ${borde}` : ''}`}}>
      <div style={{padding: `${w * 0.05}px ${w * 0.055}px ${w * 0.07}px`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: w * 0.035}}>
          <div style={{width: w * 0.13, height: w * 0.13, borderRadius: '50%', background: `linear-gradient(135deg, ${a}, ${b})`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden'}}>
            <div style={{width: w * 0.06, height: w * 0.06, borderRadius: '50%', background: 'rgba(255,255,255,0.75)', marginBottom: w * 0.012}} />
          </div>
          <div style={{fontFamily: F.sans, fontWeight: 500, fontSize: w * 0.055, color: '#333', letterSpacing: 0.5}}>{u}</div>
        </div>
        <div style={{marginTop: w * 0.06, fontFamily: F.sans, fontWeight: 700, fontSize: fs, lineHeight: 1.2, color: '#1C1C1E'}}>{t}</div>
      </div>
      <div style={{background: '#24272D', padding: `${w * 0.045}px ${w * 0.055}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: F.sans, fontWeight: 500, fontSize: w * 0.055, color: '#fff'}}>
        Responder <span style={{fontSize: w * 0.06}}>›</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 1. Intro: la historia en un celular
// ---------------------------------------------------------------------------
export const INTRO_F = 200;
/** tramos de la grabación (segundos) y su velocidad */
const TRAMOS: [number, number, number][] = [
  [2.0, 7.0, 1.6], // la historia con la pregunta
  [7.0, 9.05, 1.5], // panel de respuestas
  [9.55, 10.38, 1.0], // todas las respuestas (se salta la pantalla en blanco mientras cargan)
];
const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const sube = tw(f, [0, 22], [0, 1]);
  const zoom = tw(f, [INTRO_F - 34, INTRO_F], [0, 1], ease.in);
  let acc = 12;
  return (
    <AbsoluteFill style={{background: NEGRO}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 55%, rgba(232,35,127,0.28) 0%, rgba(7,6,10,0) 60%)`}} />
      <div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center', opacity: sube * (1 - zoom)}}>
        <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 34, letterSpacing: 8, color: '#E8E4F0'}}>CONCURSO DE OFRENDAS</div>
        <div style={{marginTop: 8, fontFamily: F.display, fontSize: 72, color: '#fff', letterSpacing: 1}}>
          Les preguntamos <span style={{color: CEMPA}}>a ustedes</span>
        </div>
      </div>
      {/* celular */}
      <div
        style={{
          position: 'absolute',
          left: 540 - 400,
          top: 330,
          width: 800,
          height: 1520,
          borderRadius: 90,
          background: '#111',
          border: '14px solid #2A2A30',
          boxShadow: '0 40px 120px rgba(0,0,0,0.7), 0 0 0 2px #3A3A44',
          overflow: 'hidden',
          transformOrigin: '540px 260px',
          transform: `translateY(${(1 - sube) * 500}px) scale(${1 + zoom * 1.6})`,
          opacity: 1 - zoom * 0.9,
        }}
      >
        {TRAMOS.map(([a, b, r]) => {
          const d = Math.round(((b - a) / r) * 30);
          const from = acc;
          acc += d;
          return (
            <Sequence key={a} from={from} durationInFrames={d} layout="none">
              <OffthreadVideo src={staticFile('proxies/ofrendas/historia.mp4')} startFrom={Math.round(a * 30)} playbackRate={r} muted style={{position: 'absolute', left: -18, top: -30, width: 808, height: 1642}} />
            </Sequence>
          );
        })}
      </div>
      <Sfx at={4} name="whoosh" volume={0.4} />
      <Sfx at={12 + Math.round((5.0 / 1.6) * 30)} name="click" volume={0.5} />
      <Sfx at={INTRO_F - 34} name="whoosh_largo" volume={0.45} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 2. Lluvia de respuestas y collage
// ---------------------------------------------------------------------------
export const LLUVIA_F = 300;
const COLLAGE_AT = 220; // las tarjetas se acomodan en collage
const COLS = 6;
const Lluvia: React.FC = () => {
  const f = useCurrentFrame();
  const n = RESPUESTAS.length;
  const flash = interpolate(f, [COLLAGE_AT - 4, COLLAGE_AT, COLLAGE_AT + 8], [0, 0.6, 0], clamp);
  const resalta = tw(f, [COLLAGE_AT + 40, COLLAGE_AT + 60], [0, 1]);
  const salida = tw(f, [LLUVIA_F - 14, LLUVIA_F], [0, 1]);
  const tarjetas = RESPUESTAS.map((_, i) => {
    // lluvia: aparecen cada vez más seguido (más suspenso)
    const sale = Math.round(COLLAGE_AT * Math.sqrt(i / n) * 0.92);
    const z = 0.45 + rnd(i, 1) * 0.7;
    const caida = 120 + rnd(i, 2) * 60;
    const p = (f - sale) / caida;
    const x = 40 + rnd(i, 3) * 640;
    const y = -520 + p * 2600;
    const rot = (rnd(i, 4) - 0.5) * 22 + Math.sin(f / 20 + i) * 3;
    // collage: celda en la rejilla
    const k = i % (COLS * 11);
    const cx = (k % COLS) * 180 + 6;
    const cy = Math.floor(k / COLS) * 174 + 10;
    const c = tw(f, [COLLAGE_AT + (i % 22), COLLAGE_AT + (i % 22) + 16], [0, 1], ease.back);
    const enLluvia = f < COLLAGE_AT;
    return {i, z, x, y, rot, p, cx, cy, c, enLluvia, sale};
  });
  return (
    <AbsoluteFill style={{background: NEGRO, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, rgba(107,47,179,0.25) 0%, rgba(7,6,10,0) 65%)`}} />
      {/* lluvia: primero las de atrás (pequeñas y desenfocadas) */}
      {f < COLLAGE_AT &&
        [...tarjetas]
          .sort((a, b) => a.z - b.z)
          .map((t) =>
            t.p > 0 && t.p < 1 ? (
              <div key={t.i} style={{position: 'absolute', left: t.x, top: t.y, transform: `rotate(${t.rot}deg) scale(${t.z})`, transformOrigin: '0 0', filter: `blur(${Math.max(0, (0.85 - t.z) * 9)}px)`, opacity: 0.35 + t.z * 0.6}}>
                <Tarjeta i={t.i} />
              </div>
            ) : null,
          )}
      {/* pregunta en el centro: franja oscura fija y texto que parpadea como en suspenso */}
      {f < COLLAGE_AT && (
        <div style={{position: 'absolute', zIndex: 10, top: 640, left: 0, right: 0, height: 520, opacity: tw(f, [10, 30], [0, 1]) * tw(f, [COLLAGE_AT - 30, COLLAGE_AT - 10], [1, 0])}}>
          <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(7,6,10,0) 0%, rgba(7,6,10,0.97) 22%, rgba(7,6,10,0.97) 78%, rgba(7,6,10,0) 100%)'}} />
          <div style={{position: 'absolute', top: 120, left: 60, right: 60, textAlign: 'center', opacity: 0.82 + 0.18 * Math.sin(f * 0.9)}}>
            <div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 40, letterSpacing: 6, color: '#E8E4F0'}}>A SU CRITERIO,</div>
            <div style={{fontFamily: F.display, fontSize: 118, lineHeight: 1.05, color: '#fff'}}>
              ¿quién fue el <span style={{color: CEMPA}}>ganador</span>?
            </div>
          </div>
        </div>
      )}
      {/* collage */}
      {f >= COLLAGE_AT &&
        tarjetas.map((t) => {
          const v = RESPUESTAS[t.i][2];
          const dim = v === 'O' ? 1 - resalta * 0.7 : 1;
          return (
            <div key={t.i} style={{position: 'absolute', left: t.cx, top: t.cy, transform: `scale(${(168 / 460) * t.c}) rotate(${(1 - t.c) * 30}deg)`, transformOrigin: '0 0', opacity: Math.min(1, t.c * 2) * dim}}>
              <Tarjeta i={t.i} tinte={v === 'O' ? 0 : resalta} />
            </div>
          );
        })}
      {f >= COLLAGE_AT + 70 && (
        <div style={{position: 'absolute', top: 820, width: '100%', textAlign: 'center', opacity: tw(f, [COLLAGE_AT + 70, COLLAGE_AT + 82], [0, 1])}}>
          <span style={{background: NEGRO, padding: '18px 44px', borderRadius: 20, fontFamily: F.display, fontSize: 110, color: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.8)'}}>
            {RESPUESTAS.length} RESPUESTAS
          </span>
        </div>
      )}
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
      <AbsoluteFill style={{background: NEGRO, opacity: salida}} />
      <Sfx at={0} name="latido" volume={0.7} />
      <Sfx at={60} name="latido" volume={0.7} />
      <Sfx at={110} name="latido" volume={0.75} />
      <Sfx at={150} name="latido" volume={0.8} />
      <Sfx at={180} name="latido" volume={0.85} />
      <Sfx at={200} name="latido" volume={0.9} />
      <Sfx at={COLLAGE_AT} name="impact" volume={0.6} />
      <Sfx at={COLLAGE_AT + 2} name="taps" volume={0.5} />
      <Sfx at={COLLAGE_AT + 70} name="flicker" volume={0.5} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 3. Gráfica de votos
// ---------------------------------------------------------------------------
export const GRAFICA_F = 330;
const BARRAS_AT = 70;
const Grafica: React.FC = () => {
  const f = useCurrentFrame();
  const max = CONTEO[0].n;
  // todos crecen a la misma velocidad: el que tiene más votos sigue subiendo (efecto carrera)
  const crece = (n: number) => Math.min(n, Math.max(0, ((f - BARRAS_AT) / 120) * max));
  const fin = BARRAS_AT + 120;
  const gana = tw(f, [fin, fin + 16], [0, 1], ease.back);
  const l1 = tw(f, [4, 18], [0, 1]);
  const l2 = tw(f, [34, 48], [0, 1]);
  const subeTitulo = tw(f, [56, 72], [0, 1], ease.inOut);
  return (
    <AbsoluteFill style={{background: NEGRO}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 30%, rgba(232,35,127,${0.18 + gana * 0.2}) 0%, rgba(7,6,10,0) 60%)`}} />
      {/* El jurado eligió... pero ustedes dijeron */}
      <div style={{position: 'absolute', top: interpolate(subeTitulo, [0, 1], [700, 150]), width: '100%', textAlign: 'center', transform: `scale(${1 - subeTitulo * 0.35})`}}>
        <div style={{opacity: l1, fontFamily: F.sans, fontWeight: 700, fontSize: 52, color: '#E8E4F0'}}>
          El jurado eligió a <span style={{color: CEMPA}}>Derecho</span> 🏆
        </div>
        <div style={{opacity: l2, transform: `translateY(${(1 - l2) * 20}px)`, marginTop: 14, fontFamily: F.display, fontSize: 104, color: '#fff'}}>…pero ustedes dijeron:</div>
      </div>
      {/* barras */}
      <div style={{position: 'absolute', top: 470, left: 70, right: 70, opacity: tw(f, [60, 74], [0, 1])}}>
        {CONTEO.map((c, i) => {
          const big = i < 2;
          const v = crece(c.n);
          const w = (v / max) * (big ? 640 : 560);
          const pct = Math.round((Math.round(v) / TOTAL) * 100);
          const glow = i === 0 ? gana : 0;
          return (
            <div key={c.label} style={{marginBottom: big ? 38 : 20}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontFamily: F.sans, fontWeight: big ? 900 : 700, fontSize: big ? 56 : 34, color: big ? '#fff' : '#B9B4CC'}}>
                <span>
                  {c.label}
                  {i === 0 && gana > 0.5 ? ' 👑' : ''}
                </span>
                <span style={{fontFamily: F.display, fontSize: big ? 70 : 40, color: big ? c.color : '#B9B4CC'}}>
                  {Math.round(v)}
                  {big && <span style={{fontFamily: F.sans, fontWeight: 700, fontSize: 30, color: '#E8E4F0', marginLeft: 12}}>{pct}%</span>}
                </span>
              </div>
              <div style={{marginTop: 8, height: big ? 64 : 22, borderRadius: 40, background: 'rgba(255,255,255,0.08)', overflow: 'hidden'}}>
                <div
                  style={{
                    width: w,
                    height: '100%',
                    borderRadius: 40,
                    background: big ? `linear-gradient(90deg, ${c.color}, ${i === 0 ? MORADO : '#FFC24A'})` : c.color,
                    boxShadow: glow > 0 ? `0 0 ${40 * glow}px ${ROSA}` : 'none',
                    transform: `scaleY(${1 + glow * 0.08})`,
                  }}
                />
              </div>
            </div>
          );
        })}
        <div style={{marginTop: 26, textAlign: 'center', fontFamily: F.sans, fontWeight: 600, fontSize: 30, color: '#8E8AA8', opacity: tw(f, [fin, fin + 14], [0, 1])}}>{TOTAL} votos · una respuesta por persona</div>
      </div>
      {/* confeti de papel picado al ganar */}
      {f >= fin &&
        Array.from({length: 46}, (_, i) => {
          const t = (f - fin) / 50;
          const x = 540 + (rnd(i, 7) - 0.5) * 1100 * Math.min(1, t * 1.5);
          const y = 520 - 500 * Math.sin(Math.min(1, t) * Math.PI * 0.6) + t * t * 900 * rnd(i, 8);
          const col = [ROSA, CEMPA, MORADO, '#1FB37A', '#FFC24A'][i % 5];
          return <div key={i} style={{position: 'absolute', left: x, top: y, width: 18, height: 12, background: col, transform: `rotate(${f * 12 + i * 40}deg)`, opacity: tw(f, [fin + 60, fin + 90], [1, 0])}} />;
        })}
      <Sfx at={4} name="whoosh" volume={0.4} />
      <Sfx at={34} name="impact" volume={0.4} />
      <Sfx at={BARRAS_AT} name="riser" volume={0.5} />
      <Sfx at={fin} name="ding" volume={0.6} />
      <Sfx at={fin} name="impact" volume={0.6} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 4. Cierre: ¿Derecho o Psicología?
// ---------------------------------------------------------------------------
export const CIERRE_F = 150;
const Cierre: React.FC = () => {
  const f = useCurrentFrame();
  const a = tw(f, [4, 18], [0, 1], ease.back);
  const o = tw(f, [14, 24], [0, 1], ease.back);
  const b = tw(f, [22, 36], [0, 1], ease.back);
  const cta = tw(f, [50, 64], [0, 1]);
  const logo = tw(f, [70, 90], [0, 1]);
  const lado = tw(f, [0, 20], [0, 1], ease.inOut);
  const negro = tw(f, [CIERRE_F - 12, CIERRE_F], [0, 1]);
  return (
    <AbsoluteFill style={{background: NEGRO, overflow: 'hidden'}}>
      {/* fondo partido en diagonal con los dos colores */}
      <AbsoluteFill style={{background: CEMPA, clipPath: `polygon(0 0, ${100 * lado}% 0, ${100 * lado - 30}% 100%, 0 100%)`, opacity: 0.92}} />
      <AbsoluteFill style={{background: ROSA, clipPath: `polygon(${100 - 70 * lado + 30}% 0, 100% 0, 100% 100%, ${100 - 70 * lado}% 100%)`, opacity: lado > 0 ? 0.92 : 0}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(7,6,10,0.15) 0%, rgba(7,6,10,0.55) 100%)'}} />
      <div style={{position: 'absolute', top: 560, width: '100%', textAlign: 'center', fontFamily: F.display, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.45)'}}>
        <div style={{fontSize: 200, lineHeight: 1, transform: `scale(${a}) rotate(${(1 - a) * -10}deg)`}}>¿DERECHO</div>
        <div style={{fontFamily: F.script, fontSize: 150, lineHeight: 1.1, color: '#FFF3C9', transform: `scale(${o})`}}>o</div>
        <div style={{fontSize: 172, lineHeight: 1, transform: `scale(${b}) rotate(${(1 - b) * 10}deg)`}}>PSICOLOGÍA?</div>
      </div>
      <div style={{position: 'absolute', top: 1270, width: '100%', textAlign: 'center', opacity: cta, transform: `translateY(${(1 - cta) * 20}px)`}}>
        <span style={{background: '#fff', color: NEGRO, padding: '16px 40px', borderRadius: 60, fontFamily: F.sans, fontWeight: 800, fontSize: 44}}>Te leemos en comentarios 👇</span>
      </div>
      <div style={{position: 'absolute', left: 340, top: 1450, width: 400, clipPath: `inset(0 0 ${(1 - logo) * 100}% 0)`}}>
        <Img src={staticFile('logos/logo_westhill_blanco_total.png')} style={{width: '100%'}} />
      </div>
      <AbsoluteFill style={{background: '#000', opacity: negro}} />
      <Sfx at={4} name="impact" volume={0.6} />
      <Sfx at={14} name="pop" volume={0.6} />
      <Sfx at={22} name="impact" volume={0.6} />
      <Sfx at={50} name="flicker" volume={0.4} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
const BLOQUES = [
  {dur: INTRO_F, el: <Intro />},
  {dur: LLUVIA_F, el: <Lluvia />},
  {dur: GRAFICA_F, el: <Grafica />},
  {dur: CIERRE_F, el: <Cierre />},
];
const STARTS = BLOQUES.reduce<number[]>((a, b, i) => [...a, i === 0 ? 0 : a[i - 1] + BLOQUES[i - 1].dur], []);
export const OFRENDAS_FRAMES = STARTS[STARTS.length - 1] + BLOQUES[BLOQUES.length - 1].dur;
/** Momentos para la música: inicio de la lluvia, del collage, de la gráfica y del cierre (segundos) */
export const MARCAS = {lluvia: STARTS[1] / 30, collage: (STARTS[1] + COLLAGE_AT) / 30, grafica: STARTS[2] / 30, cierre: STARTS[3] / 30};

export const OfrendasDebate: React.FC<{music?: boolean}> = ({music = true}) => (
  <AbsoluteFill style={{background: NEGRO}}>
    {BLOQUES.map((b, i) => (
      <Sequence key={i} from={STARTS[i]} durationInFrames={b.dur}>
        {b.el}
      </Sequence>
    ))}
    <Grain opacity={0.06} />
    {music && <Audio src={staticFile('music/ofrendas_suspenso.mp3')} volume={(fr) => interpolate(fr, [0, 10, OFRENDAS_FRAMES - 20, OFRENDAS_FRAMES], [0, 0.8, 0.8, 0], clamp)} />}
  </AbsoluteFill>
);
