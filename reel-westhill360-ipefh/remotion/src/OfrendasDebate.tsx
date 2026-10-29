import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from './components';
import {Sfx} from './shots';
import {C, F, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Debate del concurso de ofrendas: "A su criterio, ¿quién fue el ganador?"
//  1. Intro: la historia de Instagram (grabación de pantalla) dentro de un celular. Al tocar "Ver todo"
//     se apaga todo. La grabación ya viene sin barra de estado y con fotos/nombres desenfocados
//     (scripts/historia_privada.py).
//  2. Negro total; cae una respuesta ("Psicología"), luego otra, y cada vez más rápido hasta llenar la pantalla.
//     Cada respuesta se redibuja: foto de perfil -> círculo de color sin cara, nombre recortado (al•••rm).
//  3. Gráfica: duelo de barras Psicología vs Derecho, golpe final y luego el resto de respuestas.
//  4. Cierre: "¿Derecho o Psicología?".
// Solo colores de la universidad (azul, amarillo, verde) sobre negro. Psicología = azul, Derecho = amarillo.
// ---------------------------------------------------------------------------
const sec = (s: number) => Math.round(s * 30);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const AZUL = '#3D8BD4';
const AZUL_OSC = C.azul;
const AMARILLO = C.amarillo;
const VERDE = '#1FB37A';
const NEGRO = '#060709';

type Voto = 'D' | 'P' | 'O';
/** Respuestas tal como aparecen en la historia (en orden), sin repetir personas.
 *  Los nombres se guardan ya recortados: aquí no se guarda ningún usuario completo.
 *  "Las brujas" cuentan para Psicología (su ofrenda era de brujas). */
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
  ['ke••••31', 'Brujas', 'P'],
  ['so••••••r_', 'Psicología', 'P'],
  ['em••••••14', 'Derecho', 'D'],
  ['he••••c_', 'Psicología', 'P'],
  ['__•••••__', 'derecho', 'D'],
  ['ka•••••st', 'Psicología', 'P'],
  ['ca••••••zc', 'las brujas', 'P'],
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
  ['_m••••••._', 'La leyenda de las brujas', 'P'],
  ['so••••••mo', 'Psicología', 'P'],
  ['na••••••is', 'Psicología', 'P'],
  ['pr••••••ta', 'La ofrenda de las brujas', 'P'],
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
/** Conteo para la gráfica (una respuesta por persona; "la 2" no se cuenta) */
const PSICO = RESPUESTAS.filter((r) => r[2] === 'P').length;
const DERECHO = RESPUESTAS.filter((r) => r[2] === 'D').length;
const OTRAS: [string, number][] = [
  ['Negocios', 4],
  ['Arquitectura', 3],
  ['Medicina', 2],
  ['Pedagogía', 2],
  ['El ratón', 2],
  ['Economía', 1],
];
const TOTAL = PSICO + DERECHO + OTRAS.reduce((a, o) => a + o[1], 0);

const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const AVATAR = [
  [AZUL, AZUL_OSC],
  [AMARILLO, '#E39B00'],
  [VERDE, AZUL_OSC],
  ['#6FB2F0', AZUL],
  [AMARILLO, VERDE],
];

/** Tarjeta de respuesta redibujada (estilo de Instagram), sin foto ni nombre completo */
const Tarjeta: React.FC<{i: number; w?: number; tinte?: number; datos?: [string, string, Voto]}> = ({i, w = 460, tinte = 0, datos}) => {
  const [u, t, v] = datos ?? RESPUESTAS[i];
  const [a, b] = AVATAR[i % AVATAR.length];
  const fs = t.length > 40 ? w * 0.062 : t.length > 22 ? w * 0.072 : w * 0.085;
  const borde = v === 'P' ? AZUL : v === 'D' ? AMARILLO : '#5A6170';
  return (
    <div style={{width: w, borderRadius: w * 0.055, overflow: 'hidden', background: '#fff', boxShadow: `0 ${w * 0.03}px ${w * 0.08}px rgba(0,0,0,0.6)${tinte > 0 ? `, 0 0 0 ${w * 0.02 * tinte}px ${borde}` : ''}`}}>
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
// 1. Intro: la historia en un celular; al tocar "Ver todo" se corta a negro
// ---------------------------------------------------------------------------
const TRAMOS: [number, number, number][] = [
  [2.0, 7.0, 1.6], // la historia con la pregunta
  [7.0, 9.1, 1.5], // panel de respuestas hasta tocar "Ver todo"
];
const VIDEO_AT = 12;
export const INTRO_F = VIDEO_AT + TRAMOS.reduce((a, [x, y, r]) => a + Math.round(((y - x) / r) * 30), 0);
const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const sube = tw(f, [0, 22], [0, 1]);
  const toque = tw(f, [INTRO_F - 10, INTRO_F - 4], [0, 1]);
  let acc = VIDEO_AT;
  return (
    <AbsoluteFill style={{background: NEGRO}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 55%, rgba(39,99,154,0.4) 0%, rgba(6,7,9,0) 60%)`}} />
      <div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center', opacity: sube}}>
        <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 34, letterSpacing: 8, color: '#E6ECF3'}}>CONCURSO DE OFRENDAS</div>
        <div style={{marginTop: 8, fontFamily: F.display, fontSize: 72, color: '#fff', letterSpacing: 1}}>
          Les preguntamos <span style={{color: AMARILLO}}>a ustedes</span>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 140,
          top: 330,
          width: 800,
          height: 1520,
          borderRadius: 90,
          background: '#111',
          border: '14px solid #2A2A30',
          boxShadow: '0 40px 120px rgba(0,0,0,0.7), 0 0 0 2px #3A3A44',
          overflow: 'hidden',
          transform: `translateY(${(1 - sube) * 500}px)`,
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
        {/* toque sobre "Ver todo" */}
        <div style={{position: 'absolute', left: 640, top: 330, width: 90, height: 90, borderRadius: 45, background: 'rgba(255,255,255,0.55)', transform: `scale(${toque})`, opacity: toque > 0 ? 1 - toque * 0.4 : 0}} />
      </div>
      <Sfx at={4} name="whoosh" volume={0.4} />
      <Sfx at={VIDEO_AT + Math.round((5.0 / 1.6) * 30)} name="click" volume={0.5} />
      <Sfx at={INTRO_F - 6} name="click" volume={0.8} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 2. Apagón y caída de respuestas hasta llenar la pantalla
// ---------------------------------------------------------------------------
const APAGON = 26; // cuadros en negro total
const PRIMERA = RESPUESTAS.findIndex((r) => r[1] === 'Psicología');
/** orden de caída: primero una "Psicología", luego las demás mezcladas */
const ORDEN = [PRIMERA, ...RESPUESTAS.map((_, i) => i).filter((i) => i !== PRIMERA).sort((a, b) => rnd(a, 9) - rnd(b, 9))];
/** cuadro en que cae cada una: cada vez más seguido */
const CAE: number[] = ORDEN.reduce<number[]>((acc, _, k) => [...acc, k === 0 ? APAGON : acc[k - 1] + Math.max(1.6, 32 * 0.8 ** (k - 1))], []).map(Math.round);
const LLENO = CAE[CAE.length - 1] + 14;
export const CAIDA_F = LLENO + 80;
/** destino de cada tarjeta: rejilla con desorden (celdas en orden aleatorio) para cubrir toda la pantalla */
const CELDAS = Array.from({length: ORDEN.length - 1}, (_, i) => i).sort((a, b) => rnd(a, 11) - rnd(b, 11));
const DESTINO = ORDEN.map((_, k) => {
  if (k === 0) return {x: 540 - 0.95 * 230, y: 820, s: 0.95, r: -4};
  const celda = CELDAS[k - 1];
  const c = celda % 4;
  const fila = Math.floor(celda / 4);
  const s = 0.6 + rnd(k, 3) * 0.12;
  return {x: -60 + c * 290 + (rnd(k, 1) - 0.5) * 90, y: -40 + fila * 126 + (rnd(k, 2) - 0.5) * 70, s, r: (rnd(k, 4) - 0.5) * 22};
});
const Caida: React.FC = () => {
  const f = useCurrentFrame();
  const temblor = ORDEN.slice(0, 8).reduce((a, _, k) => a + Math.max(0, 1 - Math.abs(f - CAE[k] - 12) / 6) * (8 - k), 0);
  const tinte = tw(f, [LLENO + 10, LLENO + 28], [0, 1]);
  const salida = tw(f, [CAIDA_F - 10, CAIDA_F], [0, 1]);
  return (
    <AbsoluteFill style={{background: NEGRO, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${Math.sin(f * 2.3) * temblor}px, ${Math.cos(f * 2.9) * temblor}px)`}}>
        {ORDEN.map((i, k) => {
          const d = DESTINO[k];
          const p = tw(f, [CAE[k], CAE[k] + 12], [0, 1], (t) => t * t); // cae con gravedad
          const asienta = tw(f, [CAE[k] + 12, CAE[k] + 20], [1, 0], ease.out);
          if (f < CAE[k]) return null;
          const v = RESPUESTAS[i][2];
          const dim = v === 'O' ? 1 - tinte * 0.65 : 1;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: d.x,
                top: d.y - (1 - p) * 1500,
                transformOrigin: '0 0',
                transform: `rotate(${d.r + (1 - p) * 25}deg) scale(${d.s * (1 + asienta * 0.05)})`,
                opacity: dim,
              }}
            >
              <Tarjeta i={i} tinte={v === 'O' ? 0 : tinte} />
            </div>
          );
        })}
      </AbsoluteFill>
      {f >= LLENO + 24 && (
        <div style={{position: 'absolute', top: 800, width: '100%', textAlign: 'center', opacity: tw(f, [LLENO + 24, LLENO + 34], [0, 1]), transform: `scale(${tw(f, [LLENO + 24, LLENO + 36], [1.4, 1], ease.back)})`}}>
          <span style={{background: NEGRO, padding: '18px 44px', borderRadius: 20, fontFamily: F.display, fontSize: 110, color: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.8)'}}>
            {RESPUESTAS.length} <span style={{color: AMARILLO}}>RESPUESTAS</span>
          </span>
        </div>
      )}
      <AbsoluteFill style={{background: NEGRO, opacity: salida}} />
      {CAE.slice(0, 9).map((c, k) => (
        <Sfx key={k} at={c + 11} name="hist_stamp" volume={0.75 - k * 0.05} />
      ))}
      {CAE.slice(9, 20).map((c, k) => (
        <Sfx key={k} at={c + 11} name="pop" volume={0.35} />
      ))}
      <Sfx at={CAE[20]} name="charge" volume={0.55} />
      <Sfx at={LLENO} name="impact" volume={0.7} />
      <Sfx at={LLENO + 24} name="flicker" volume={0.5} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 3. Gráfica: duelo de barras
// ---------------------------------------------------------------------------
export const GRAFICA_F = 440;
// Historia de los votos: Derecho va ganando, de repente se estanca (¡pam!) y Psicología sube muy rápido
const DUELO_AT = 78; // empiezan a crecer
const ESTANCA = 152; // Derecho se frena en seco
const REMONTA = 180; // Psicología despega
const FIN_D = 204; // Derecho llega a su total
const FIN_P = 226; // Psicología llega a su total (golpe final)
const votosD = (f: number) => interpolate(f, [DUELO_AT, ESTANCA, REMONTA, FIN_D], [0, DERECHO - 2, DERECHO - 1, DERECHO], {...clamp, easing: ease.out});
const votosP = (f: number) =>
  f < REMONTA ? interpolate(f, [DUELO_AT, ESTANCA, REMONTA], [0, 5, 7], clamp) : interpolate(f, [REMONTA, FIN_P], [7, PSICO], {...clamp, easing: (t) => t * t * (3 - 2 * t)});
/** cuadro en que Psicología rebasa a Derecho */
const REBASA = (() => {
  for (let f = REMONTA; f < FIN_P; f++) if (Math.floor(votosP(f)) > Math.floor(votosD(f))) return f;
  return FIN_P;
})();
/** reloj: desde que se subió la historia (miércoles 28 de octubre, 3:00 p.m.) hasta el momento de la captura (21 h 36 min) */
const HORAS = (f: number) => interpolate(f, [DUELO_AT, ESTANCA, REMONTA, FIN_P], [0, 3.5, 5, 21.6], clamp);
const reloj = (h: number) => {
  const min = Math.round(h * 60);
  const total = 15 * 60 + min;
  const dia = total >= 24 * 60 ? 'JUE 29 OCT' : 'MIÉ 28 OCT';
  const hh = Math.floor((total % (24 * 60)) / 60);
  const mm = total % 60;
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return {dia, hora: `${h12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'A.M.' : 'P.M.'}`, pasado: `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`};
};
const OTRAS_AT = FIN_P + 72;
const BASE = 1420;
const ALTO = 700;
const Barra: React.FC<{x: number; v: number; color: string; color2: string; label: string; fin: number; gana: boolean}> = ({x, v, color, color2, label, fin, gana}) => {
  const f = useCurrentFrame();
  const vv = Math.floor(v);
  const paro = f < fin ? 0 : tw(f, [fin, fin + 10], [1, 0]);
  const h = (v / PSICO) * ALTO;
  const rebote = f >= fin ? 1 + 0.04 * Math.sin((f - fin) * 0.6) * Math.exp(-(f - fin) / 10) : 1;
  const pct = Math.round((vv / TOTAL) * 100);
  const barrido = ((f * 14) % (ALTO + 400)) - 200;
  return (
    <div style={{position: 'absolute', left: x - 160, top: 0, width: 320, height: 1920}}>
      {/* número que cuenta */}
      <div style={{position: 'absolute', bottom: 1920 - BASE + h + 30, width: '100%', textAlign: 'center', transform: `scale(${rebote + (gana ? 0 : 0)})`}}>
        <div style={{fontFamily: F.display, fontSize: 190, lineHeight: 0.9, color, textShadow: `0 0 ${30 + 30 * paro}px ${color}88`}}>{vv}</div>
        <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 40, color: '#fff', opacity: v > 0 ? 1 : 0}}>{pct}%</div>
      </div>
      {/* barra */}
      <div style={{position: 'absolute', top: BASE - h, width: '100%', height: h, borderRadius: '28px 28px 0 0', overflow: 'hidden', background: `linear-gradient(180deg, ${color} 0%, ${color2} 100%)`, boxShadow: `0 0 ${gana ? 80 : 30}px ${color}66`, transform: `scaleX(${rebote})`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: ALTO - barrido - (ALTO - h), height: 120, background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 100%)'}} />
        <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 2px, transparent 2px, transparent 26px)'}} />
        <AbsoluteFill style={{background: '#fff', opacity: paro * 0.7}} />
      </div>
      <div style={{position: 'absolute', top: BASE + 26, width: '100%', textAlign: 'center', fontFamily: F.display, fontSize: 62, letterSpacing: 2, color: '#fff'}}>{label}</div>
    </div>
  );
};
const Grafica: React.FC = () => {
  const f = useCurrentFrame();
  const l1 = tw(f, [4, 18], [0, 1]);
  const l2 = tw(f, [30, 42], [0, 1], ease.back);
  const subeTitulo = tw(f, [56, 74], [0, 1], ease.inOut);
  const duelo = tw(f, [64, 80], [0, 1]);
  const golpe = tw(f, [FIN_P, FIN_P + 8], [0, 1]);
  const reduce = tw(f, [OTRAS_AT - 10, OTRAS_AT + 14], [0, 1], ease.inOut);
  const flash = interpolate(f, [FIN_P - 1, FIN_P + 1, FIN_P + 10], [0, 0.8, 0], clamp) + interpolate(f, [REBASA - 1, REBASA + 1, REBASA + 8], [0, 0.45, 0], clamp);
  const golpeSeco = (at: number, fuerza: number) => (f >= at && f < at + 14 ? (at + 14 - f) * fuerza : 0);
  const sacude = golpeSeco(FIN_P, 1.6) + golpeSeco(ESTANCA, 1.3);
  const rel = reloj(HORAS(f));
  const relojVis = tw(f, [DUELO_AT - 6, DUELO_AT + 8], [0, 1]) * (1 - reduce);
  const congelado = f >= ESTANCA && f < REMONTA;
  const empuje = 1 + 0.06 * tw(f, [DUELO_AT, FIN_P], [0, 1], ease.inOut);
  return (
    <AbsoluteFill style={{background: NEGRO, overflow: 'hidden'}}>
      {/* rejilla de fondo que se mueve */}
      <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(61,139,212,0.08) 2px, transparent 2px), linear-gradient(90deg, rgba(61,139,212,0.08) 2px, transparent 2px)', backgroundSize: '90px 90px', backgroundPosition: `0 ${(f * 1.5) % 90}px`, opacity: duelo}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 30% 60%, rgba(61,139,212,${0.15 + golpe * 0.25}) 0%, rgba(6,7,9,0) 55%)`}} />
      {/* rayos de luz detrás de la barra ganadora */}
      {golpe > 0 && (
        <div style={{position: 'absolute', left: 310 - 900, top: 700 - 900, width: 1800, height: 1800, borderRadius: '50%', background: `repeating-conic-gradient(from ${f * 1.2}deg, rgba(61,139,212,0.22) 0deg 8deg, rgba(0,0,0,0) 8deg 20deg)`, opacity: golpe * (1 - reduce), maskImage: 'radial-gradient(circle, #000 20%, transparent 65%)', WebkitMaskImage: 'radial-gradient(circle, #000 20%, transparent 65%)'}} />
      )}
      {/* El jurado eligió... pero ustedes dijeron */}
      <div style={{position: 'absolute', top: interpolate(subeTitulo, [0, 1], [700, 40]), width: '100%', textAlign: 'center', transformOrigin: '50% 0%', transform: `scale(${1 - subeTitulo * 0.42})`, opacity: (1 - reduce) * (1 - golpe)}}>
        <div style={{opacity: l1, fontFamily: F.sans, fontWeight: 700, fontSize: 52, color: '#E6ECF3'}}>
          El jurado eligió a <span style={{color: AMARILLO}}>Derecho</span> 🏆
        </div>
        <div style={{opacity: Math.min(1, l2 * 2), transform: `scale(${0.7 + 0.3 * l2})`, marginTop: 14, fontFamily: F.display, fontSize: 112, color: '#fff'}}>…pero ustedes dijeron:</div>
      </div>
      {/* reloj: tiempo desde que se subió la historia */}
      <div style={{position: 'absolute', top: 205, width: '100%', textAlign: 'center', opacity: relojVis}}>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, padding: '10px 30px', borderRadius: 50, background: 'rgba(255,255,255,0.06)', border: `2px solid ${congelado ? AMARILLO : 'rgba(255,255,255,0.15)'}`}}>
          <span style={{fontSize: 40}}>🕒</span>
          <span style={{fontFamily: F.sans, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: '#B9C2D0'}}>{rel.dia}</span>
          <span style={{fontFamily: F.display, fontSize: 58, color: '#fff', minWidth: 230, textAlign: 'left'}}>{rel.hora}</span>
        </div>
        <div style={{marginTop: 8, fontFamily: F.sans, fontWeight: 600, fontSize: 26, color: '#8B93A3'}}>
          {rel.pasado} desde que subimos la historia (ayer, 3:00 p.m.)
        </div>
      </div>
      {/* duelo */}
      <AbsoluteFill style={{opacity: duelo, transformOrigin: '540px 0px', transform: `translate(${Math.sin(f * 3) * sacude}px, ${-reduce * 40}px) scale(${empuje * (1 - reduce * 0.48)})`}}>
        <Barra x={310} v={votosP(f)} color={AZUL} color2={AZUL_OSC} label="PSICOLOGÍA" fin={FIN_P} gana />
        <Barra x={770} v={votosD(f)} color={AMARILLO} color2="#C98E00" label="DERECHO" fin={ESTANCA} gana={false} />
      </AbsoluteFill>
      {/* el resto de respuestas */}
      <div style={{position: 'absolute', top: 1060, left: 90, right: 90, opacity: reduce}}>
        <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 34, letterSpacing: 6, color: VERDE, marginBottom: 22}}>OTRAS RESPUESTAS</div>
        {OTRAS.map(([lab, n], i) => {
          const p = tw(f, [OTRAS_AT + i * 5, OTRAS_AT + i * 5 + 16], [0, 1], ease.out);
          return (
            <div key={lab} style={{display: 'flex', alignItems: 'center', gap: 20, marginBottom: 18, opacity: p, transform: `translateX(${(1 - p) * -80}px)`}}>
              <div style={{width: 250, fontFamily: F.sans, fontWeight: 700, fontSize: 34, color: '#E6ECF3'}}>{lab}</div>
              <div style={{flex: 1, height: 26, borderRadius: 14, background: 'rgba(255,255,255,0.07)'}}>
                <div style={{width: `${(n / PSICO) * 100 * p}%`, height: '100%', borderRadius: 14, background: `linear-gradient(90deg, ${VERDE}, #7FE0B5)`}} />
              </div>
              <div style={{width: 50, textAlign: 'right', fontFamily: F.display, fontSize: 42, color: VERDE}}>{n}</div>
            </div>
          );
        })}
        <div style={{marginTop: 18, textAlign: 'center', fontFamily: F.sans, fontWeight: 600, fontSize: 28, color: '#8B93A3'}}>{TOTAL} votos · una respuesta por persona</div>
      </div>
      {/* confeti con los colores de la universidad */}
      {f >= FIN_P &&
        Array.from({length: 60}, (_, i) => {
          const t = (f - FIN_P) / 45;
          const x = 310 + (rnd(i, 7) - 0.3) * 1300 * Math.min(1, t * 1.4);
          const y = 520 - 520 * Math.sin(Math.min(1, t) * Math.PI * 0.55) + t * t * 1000 * (0.4 + rnd(i, 8));
          const col = [AZUL, AMARILLO, VERDE, '#fff'][i % 4];
          return <div key={i} style={{position: 'absolute', left: x, top: y, width: 20, height: 12, background: col, transform: `rotate(${f * 12 + i * 40}deg)`, opacity: tw(f, [FIN_P + 50, FIN_P + 80], [1, 0])}} />;
        })}
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
      <Sfx at={4} name="whoosh" volume={0.4} />
      <Sfx at={30} name="impact" volume={0.5} />
      <Sfx at={DUELO_AT} name="charge" volume={0.45} />
      <Sfx at={ESTANCA} name="impact" volume={0.75} />
      <Sfx at={ESTANCA} name="hist_stamp" volume={0.8} />
      <Sfx at={REMONTA - 6} name="riser" volume={0.6} />
      <Sfx at={REMONTA} name="whoosh_largo" volume={0.5} />
      <Sfx at={REBASA} name="flash" volume={0.6} />
      <Sfx at={FIN_P} name="impact" volume={0.8} />
      <Sfx at={FIN_P} name="ding" volume={0.6} />
      <Sfx at={OTRAS_AT - 10} name="whoosh" volume={0.4} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 4. Cierre: ¿Derecho o Psicología?
// ---------------------------------------------------------------------------
/** Comentario que deja de lado la rivalidad (la misma persona también votó; no entra en el conteo) */
const TODO_WESTHILL: [string, string, Voto] = ['de••••••16', 'Todo Westhill Ganó!!!', 'O'];
const COMENTARIO_AT = 78; // aparece el comentario y empieza a crecer
const POSITIVO = 205; // "Al final, ganó la comunidad Westhill"
export const CIERRE_F = POSITIVO + 160;
const Cierre: React.FC = () => {
  const f = useCurrentFrame();
  const a = tw(f, [4, 18], [0, 1], ease.back);
  const o = tw(f, [14, 24], [0, 1], ease.back);
  const b = tw(f, [22, 36], [0, 1], ease.back);
  const cta = tw(f, [50, 64], [0, 1]);
  const lado = tw(f, [0, 20], [0, 1], ease.inOut);
  // los dos colores se juntan en uno solo: la comunidad
  const une = tw(f, [POSITIVO - 14, POSITIVO + 10], [0, 1], ease.inOut);
  // el comentario crece y la rivalidad se desenfoca y se apaga
  const crece = tw(f, [COMENTARIO_AT, COMENTARIO_AT + 80], [0, 1], ease.inOut);
  const aparece = tw(f, [COMENTARIO_AT, COMENTARIO_AT + 12], [0, 1]);
  const rival = 1 - tw(f, [COMENTARIO_AT + 10, COMENTARIO_AT + 70], [0, 1], ease.inOut);
  const brilla = tw(f, [COMENTARIO_AT + 70, COMENTARIO_AT + 90], [0, 1]);
  const sale = tw(f, [POSITIVO - 20, POSITIVO + 4], [0, 1], ease.in);
  const escala = (0.3 + 1.45 * crece + 0.06 * tw(f, [COMENTARIO_AT + 80, POSITIVO], [0, 1])) * (1 - sale * 0.25);
  const p1 = tw(f, [POSITIVO + 6, POSITIVO + 20], [0, 1]);
  const p2 = tw(f, [POSITIVO + 18, POSITIVO + 34], [0, 1], ease.back);
  const corazon = tw(f, [POSITIVO + 34, POSITIVO + 46], [0, 1], ease.back);
  const logo = tw(f, [POSITIVO + 50, POSITIVO + 72], [0, 1]);
  const hash = tw(f, [POSITIVO + 70, POSITIVO + 82], [0, 1]);
  const late = 1 + 0.08 * Math.max(0, Math.sin(((f - POSITIVO - 46) / 30) * Math.PI * 2)) ** 6;
  const negro = tw(f, [CIERRE_F - 16, CIERRE_F], [0, 1]);
  return (
    <AbsoluteFill style={{background: NEGRO, overflow: 'hidden'}}>
      {/* fondo partido en diagonal: Derecho (amarillo) y Psicología (azul); al final se funden */}
      <AbsoluteFill style={{opacity: rival * (1 - une), filter: `blur(${(1 - rival) * 22}px)`, transform: `scale(${1 + (1 - rival) * 0.08})`}}>
        <AbsoluteFill style={{background: `linear-gradient(160deg, ${AMARILLO}, #E39B00)`, clipPath: `polygon(0 0, ${100 * lado}% 0, ${100 * lado - 30}% 100%, 0 100%)`}} />
        <AbsoluteFill style={{background: `linear-gradient(160deg, ${AZUL}, ${AZUL_OSC})`, clipPath: `polygon(${100 - 70 * lado + 30}% 0, 100% 0, 100% 100%, ${100 - 70 * lado}% 100%)`, opacity: lado > 0 ? 1 : 0}} />
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(6,7,9,0.2) 0%, rgba(6,7,9,0.6) 100%)'}} />
        <div style={{position: 'absolute', top: 560, width: '100%', textAlign: 'center', fontFamily: F.display, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.5)'}}>
          <div style={{fontSize: 200, lineHeight: 1, transform: `scale(${a}) rotate(${(1 - a) * -10}deg)`}}>¿DERECHO</div>
          <div style={{fontFamily: F.script, fontSize: 150, lineHeight: 1.1, color: '#fff', transform: `scale(${o})`}}>o</div>
          <div style={{fontSize: 172, lineHeight: 1, transform: `scale(${b}) rotate(${(1 - b) * 10}deg)`}}>PSICOLOGÍA?</div>
        </div>
        <div style={{position: 'absolute', top: 1270, width: '100%', textAlign: 'center', opacity: cta, transform: `translateY(${(1 - cta) * 20}px)`}}>
          <span style={{background: '#fff', color: NEGRO, padding: '16px 40px', borderRadius: 60, fontFamily: F.sans, fontWeight: 800, fontSize: 44}}>Te leemos en comentarios 👇</span>
        </div>
      </AbsoluteFill>
      {/* el comentario "Todo Westhill ganó" crece hasta ocupar la pantalla */}
      {f >= COMENTARIO_AT && f < POSITIVO + 6 && (
        <AbsoluteFill style={{opacity: aparece * (1 - sale)}}>
          <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, rgba(61,139,212,${0.45 * crece}) 0%, rgba(39,99,154,${0.2 * crece}) 40%, rgba(6,7,9,0) 75%)`}} />
          <div style={{position: 'absolute', left: 540 - 230, top: 960 - 170, transformOrigin: '230px 170px', transform: `scale(${escala}) rotate(${(1 - crece) * -8}deg) translateY(${-sale * 60}px)`}}>
            <div style={{borderRadius: 26, boxShadow: `0 0 ${70 * brilla}px rgba(242,194,48,${0.7 * brilla})`}}>
              <Tarjeta i={0} datos={TODO_WESTHILL} />
            </div>
          </div>
        </AbsoluteFill>
      )}
      {/* cierre positivo */}
      <AbsoluteFill style={{opacity: une}}>
        <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 42%, rgba(61,139,212,0.55) 0%, rgba(39,99,154,0.25) 35%, rgba(6,7,9,0) 70%)`}} />
        <div style={{position: 'absolute', top: 560, width: '100%', textAlign: 'center'}}>
          <div style={{opacity: p1, transform: `translateY(${(1 - p1) * 20}px)`, fontFamily: F.sans, fontWeight: 700, fontSize: 56, color: '#E6ECF3'}}>Al final, ganó la</div>
          <div style={{marginTop: 6, opacity: Math.min(1, p2 * 2), transform: `scale(${0.7 + 0.3 * p2})`, fontFamily: F.display, fontSize: 150, lineHeight: 1, color: '#fff', textShadow: `0 0 40px ${AZUL}`}}>
            COMUNIDAD
            <div style={{fontFamily: F.script, fontSize: 150, lineHeight: 1.1, color: AMARILLO, textShadow: `0 0 30px rgba(242,194,48,0.6)`}}>Westhill</div>
          </div>
          <div style={{marginTop: 4, fontSize: 120, transform: `scale(${corazon * late})`}}>💙</div>
        </div>
        <div style={{position: 'absolute', left: 300, top: 1340, width: 480, clipPath: `inset(0 0 ${(1 - logo) * 100}% 0)`}}>
          <Img src={staticFile('logos/logo_westhill_blanco_total.png')} style={{width: '100%'}} />
        </div>
        <div style={{position: 'absolute', top: 1560, width: '100%', textAlign: 'center', opacity: hash, fontFamily: F.sans, fontWeight: 800, fontSize: 32, letterSpacing: 8, color: AMARILLO}}>#SOMOSWESTHILL</div>
        {/* confeti suave con los colores de la universidad */}
        {Array.from({length: 40}, (_, i) => {
          const t = (f - POSITIVO - (i % 10) * 3) / 120;
          if (t < 0) return null;
          const x = rnd(i, 21) * 1080 + Math.sin(f / 15 + i) * 30;
          const y = -40 + t * 2100 * (0.6 + rnd(i, 22) * 0.6);
          const col = [AZUL, AMARILLO, VERDE, '#fff'][i % 4];
          return <div key={i} style={{position: 'absolute', left: x, top: y, width: 16, height: 10, background: col, opacity: 0.8, transform: `rotate(${f * 8 + i * 37}deg)`}} />;
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#000', opacity: negro}} />
      <Sfx at={4} name="impact" volume={0.6} />
      <Sfx at={14} name="pop" volume={0.6} />
      <Sfx at={22} name="impact" volume={0.6} />
      <Sfx at={50} name="flicker" volume={0.4} />
      <Sfx at={COMENTARIO_AT} name="pop" volume={0.6} />
      <Sfx at={COMENTARIO_AT + 4} name="whoosh_largo" volume={0.4} />
      <Sfx at={COMENTARIO_AT + 72} name="ding" volume={0.45} />
      <Sfx at={POSITIVO - 14} name="whoosh_largo" volume={0.45} />
      <Sfx at={POSITIVO + 18} name="flicker" volume={0.4} />
      <Sfx at={POSITIVO + 34} name="ding" volume={0.5} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
const BLOQUES = [
  {dur: INTRO_F, el: <Intro />},
  {dur: CAIDA_F, el: <Caida />},
  {dur: GRAFICA_F, el: <Grafica />},
  {dur: CIERRE_F, el: <Cierre />},
];
const STARTS = BLOQUES.reduce<number[]>((a, b, i) => [...a, i === 0 ? 0 : a[i - 1] + BLOQUES[i - 1].dur], []);
export const OFRENDAS_FRAMES = STARTS[STARTS.length - 1] + BLOQUES[BLOQUES.length - 1].dur;
/** Momentos para la música (segundos) */
export const MARCAS = {
  apagon: STARTS[1] / 30,
  primera: (STARTS[1] + APAGON) / 30,
  lleno: (STARTS[1] + LLENO) / 30,
  grafica: STARTS[2] / 30,
  estanca: (STARTS[2] + ESTANCA) / 30,
  remonta: (STARTS[2] + REMONTA) / 30,
  golpe: (STARTS[2] + FIN_P) / 30,
  cierre: STARTS[3] / 30,
  comentario: (STARTS[3] + COMENTARIO_AT) / 30,
  positivo: (STARTS[3] + POSITIVO) / 30,
  fin: OFRENDAS_FRAMES / 30,
};

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
