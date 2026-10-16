import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Flash, Grain, Highlight, ScriptWord, WordsIn} from './components';
import {Banner, Sfx} from './shots';
import {C, F, SAFE_X, ease, safeSize, tw} from './theme';

// ---------------------------------------------------------------------------
// Reel de storytelling: 17 de octubre de 1953, reconocimiento del voto de la mujer en México.
// Datos verificados (CNDH, SEMUJERES CDMX, cronología IEE Sinaloa / INEHRM):
//  1916 Primer Congreso Feminista (Yucatán) · 1923 primeras diputadas locales en Yucatán
//  1947 voto municipal (art. 115) · 1952 mitin de >20 mil mujeres ante Ruiz Cortines
//  17-oct-1953 DOF publica la reforma a los arts. 34 y 115 · 3-jul-1955 primer voto federal
// ---------------------------------------------------------------------------
const XF = 12;

// Locución (ElevenLabs). Todos los tiempos de abajo son segundos del audio de la voz, medidos con
// silencedetect y la envolvente de energía; at() los pasa a cuadros del reel.
const VOZ = 'music/voz_voto.mp3';
const VOZ_OFF = 0.3; // silencio antes de que arranque la voz
const at = (t: number) => Math.round((t + VOZ_OFF) * 30);
/** Cuadro global en que empieza (cuadro local 0) la escena que se está pintando */
const SceneCtx = React.createContext(0);
/** Segundo de la voz → cuadro local de la escena */
const useVoz = () => {
  const o = React.useContext(SceneCtx);
  return (t: number) => at(t) - o;
};
const PAPEL = '#F3EBDC';
const TINTA = '#1E2A3A';

const Paper: React.FC = () => (
  <AbsoluteFill style={{background: PAPEL}}>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 55%, rgba(120,90,50,0.22) 100%)'}} />
    <AbsoluteFill style={{opacity: 0.18, mixBlendMode: 'multiply'}}>
      <svg width="100%" height="100%">
        <filter id="fibra">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.6" numOctaves="3" seed={4} />
          <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.35  0 0 0 0 0.2  0 0 0 0.9 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#fibra)" />
      </svg>
    </AbsoluteFill>
  </AbsoluteFill>
);

const Dark: React.FC = () => (
  <AbsoluteFill style={{background: C.marino}}>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(39,99,154,0.85) 0%, rgba(20,35,60,0) 65%)'}} />
  </AbsoluteFill>
);

const Cursor: React.FC = () => <span style={{display: 'inline-block', width: '0.08em', height: '0.9em', background: 'currentColor', marginLeft: 4, verticalAlign: '-0.08em'}} />;

/** Texto que se escribe letra por letra, con cursor de máquina de escribir */
const Typewriter: React.FC<{text: string; start: number; cps?: number; style?: React.CSSProperties; cursor?: boolean}> = ({
  text,
  start,
  cps = 22,
  style,
  cursor = true,
}) => {
  const f = useCurrentFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor(((f - start) / 30) * cps)));
  const done = n >= text.length;
  const blink = Math.floor(f / 8) % 2 === 0;
  return (
    <span style={style}>
      {text.slice(0, n)}
      {cursor && f >= start && (!done || (blink && f < start + typeFrames(text, cps) + 24)) && <Cursor />}
    </span>
  );
};
const typeFrames = (text: string, cps = 22) => Math.ceil((text.length / cps) * 30);

/** Urna con boleta: ok=false la boleta rebota y se tacha; ok=true entra y aparece la palomita */
const Urna: React.FC<{start: number; ok: boolean; x?: number; y?: number; scale?: number}> = ({start, ok, x = 540, y = 1280, scale = 1}) => {
  const f = useCurrentFrame();
  const drop = tw(f, [start, start + 18], [0, 1], ease.inOut);
  const bounce = ok ? 0 : tw(f, [start + 18, start + 30], [0, 1], ease.out);
  const by = -260 + drop * (ok ? 300 : 200) - bounce * 70;
  const into = ok ? tw(f, [start + 14, start + 20], [1, 0]) : 1;
  const mark = tw(f, [start + (ok ? 22 : 30), start + (ok ? 34 : 42)], [0, 1], ease.inOut);
  return (
    <svg width={560 * scale} height={560 * scale} viewBox="-280 -320 560 560" style={{position: 'absolute', left: x - 280 * scale, top: y - 320 * scale, overflow: 'visible'}}>
      {/* boleta */}
      <g transform={`translate(0 ${by}) rotate(${ok ? 0 : bounce * -12})`} opacity={into}>
        <rect x={-70} y={-90} width={140} height={180} rx={8} fill="#fff" stroke={TINTA} strokeWidth={5} />
        <line x1={-40} y1={-50} x2={40} y2={-50} stroke={TINTA} strokeWidth={5} strokeLinecap="round" />
        <line x1={-40} y1={-20} x2={20} y2={-20} stroke={TINTA} strokeWidth={5} strokeLinecap="round" />
        <circle cx={-25} cy={35} r={18} fill="none" stroke={TINTA} strokeWidth={5} />
      </g>
      {/* urna */}
      <path d="M-200 10 L200 10 L170 230 L-170 230 Z" fill={C.azul} stroke={TINTA} strokeWidth={6} strokeLinejoin="round" />
      <rect x={-210} y={-10} width={420} height={30} rx={8} fill={C.azulClaro} stroke={TINTA} strokeWidth={6} />
      <rect x={-90} y={-2} width={180} height={12} rx={6} fill={TINTA} />
      <text x={0} y={150} textAnchor="middle" fontFamily={F.display} fontSize={86} fill="#fff" letterSpacing={6}>
        VOTO
      </text>
      {!ok && (
        <g stroke="#C8323C" strokeWidth={22} strokeLinecap="round">
          {mark > 0.01 && <line x1={-150} y1={-150} x2={-150 + 300 * Math.min(1, mark * 2)} y2={-150 + 300 * Math.min(1, mark * 2)} />}
          {mark > 0.51 && <line x1={150} y1={-150} x2={150 - 300 * (mark * 2 - 1)} y2={-150 + 300 * (mark * 2 - 1)} />}
        </g>
      )}
      {ok && (
        <path d="M-90 -140 L-25 -75 L110 -210" fill="none" stroke={C.amarillo} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - mark} style={{filter: `drop-shadow(0 0 12px ${C.amarillo})`}} />
      )}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Escenas
// ---------------------------------------------------------------------------
const H1 = 'Hasta 1953,';
const Hook: React.FC = () => {
  const v = useVoz();
  const urna = v(3.0); // la boleta rebota y la X se dibuja cuando dice "votar"
  return (
    <AbsoluteFill>
      <Paper />
      <div style={{position: 'absolute', top: 430, left: SAFE_X, right: SAFE_X, textAlign: 'center'}}>
        <Typewriter text={H1} start={v(0)} cps={12} style={{fontFamily: F.sans, fontWeight: 600, fontSize: 62, color: TINTA}} />
      </div>
      <div style={{position: 'absolute', top: 530, width: '100%'}}>
        <WordsIn text="en México las mujeres" start={v(2.49)} style={{fontFamily: F.sans, fontWeight: 900, fontSize: 70, color: TINTA, letterSpacing: -1}} />
      </div>
      <div style={{position: 'absolute', top: 620, width: '100%', textAlign: 'center'}}>
        <ScriptWord text="no podían votar." start={v(3.7)} size={150} color={C.azul} tilt={-5} dur={18} />
      </div>
      <Urna start={urna} ok={false} y={1330} />
      <Sfx at={v(0)} name="hist_typing_largo" volume={0.5} />
      <Sfx at={v(3.7)} name="flicker" volume={0.3} />
      <Sfx at={urna} name="hist_paper" volume={0.5} />
      <Sfx at={urna + 30} name="hist_stamp" volume={0.5} />
    </AbsoluteFill>
  );
};

const NoCalladas: React.FC = () => {
  const v = useVoz();
  return (
    <AbsoluteFill>
      <Dark />
      <div style={{position: 'absolute', top: 760, width: '100%'}}>
        <WordsIn text="Pero nunca se quedaron" start={v(5.14)} style={{fontFamily: F.sans, fontWeight: 800, fontSize: 72, color: C.blanco}} />
      </div>
      <div style={{position: 'absolute', top: 850, width: '100%', textAlign: 'center'}}>
        <ScriptWord text="calladas." start={v(6.1)} size={190} neon tilt={-6} dur={16} />
      </div>
      <Sfx at={v(5.14) - 4} name="whoosh" volume={0.3} />
      <Sfx at={v(6.1)} name="flicker" volume={0.35} />
    </AbsoluteFill>
  );
};

/** Escena de línea del tiempo: año grande, línea que baja, texto escrito y acento manuscrito */
const Year: React.FC<{year: string; text: React.ReactNode; script: string; scriptAt: number; extra?: React.ReactNode}> = ({year, text, script, scriptAt, extra}) => {
  const f = useCurrentFrame();
  const sw = useVoz()(scriptAt);
  const fill = tw(f, [10, 26], [0, 1], ease.inOut);
  return (
    <AbsoluteFill>
      <Paper />
      {/* línea del tiempo */}
      <div style={{position: 'absolute', left: SAFE_X + 18, top: 0, width: 6, height: tw(f, [0, 20], [300, 1920], ease.inOut), background: C.azul, opacity: 0.35}} />
      <div style={{position: 'absolute', left: SAFE_X + 4, top: 520, width: 34, height: 34, borderRadius: 17, background: C.amarillo, border: `6px solid ${C.azul}`, transform: `scale(${tw(f, [6, 16], [0, 1], ease.back)})`}} />
      <div style={{position: 'absolute', left: SAFE_X + 70, top: 380, overflow: 'hidden'}}>
        <div
          style={{
            fontFamily: F.display,
            fontSize: 290,
            lineHeight: 1,
            color: 'transparent',
            WebkitTextStroke: `5px ${C.azul}`,
            backgroundImage: `linear-gradient(90deg, ${C.azul} ${fill * 100}%, transparent ${fill * 100}%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            transform: `translateY(${tw(f, [0, 14], [100, 0])}%)`,
          }}
        >
          {year}
        </div>
      </div>
      <div style={{position: 'absolute', left: SAFE_X + 70, right: SAFE_X - 10, top: 720, fontFamily: F.sans, fontWeight: 700, fontSize: 52, lineHeight: 1.3, color: TINTA}}>
        <div style={{opacity: tw(f, [18, 30], [0, 1]), transform: `translateY(${tw(f, [18, 32], [24, 0])}px)`}}>{text}</div>
      </div>
      <div style={{position: 'absolute', left: SAFE_X + 60, top: 1030}}>
        <ScriptWord text={script} start={sw} size={safeSize(script, 110, 0.45)} color={C.azul} tilt={-4} dur={16} />
      </div>
      {extra}
      <Sfx at={2} name="hist_paper" volume={0.4} />
      <Sfx at={18} name="hist_typing" volume={0.35} />
      <Sfx at={sw} name="flicker" volume={0.25} />
    </AbsoluteFill>
  );
};

const Contador: React.FC<{t: number}> = ({t}) => {
  const f = useCurrentFrame();
  const start = useVoz()(t);
  const v = Math.round(tw(f, [start, start + 36], [0, 20000], ease.out));
  return (
    <div style={{position: 'absolute', left: SAFE_X + 70, top: 1210, fontFamily: F.display, fontSize: 150, color: C.azul, lineHeight: 1}}>
      +{v.toLocaleString('es-MX')}
      <span style={{fontFamily: F.sans, fontWeight: 800, fontSize: 44, color: TINTA, marginLeft: 18}}>mujeres</span>
    </div>
  );
};

/** Clímax: hoja de calendario 17 · OCTUBRE · 1953 */
const Calendario: React.FC = () => {
  const f = useCurrentFrame();
  const v = useVoz();
  const land = v(28.4); // la hoja cae con "El 17 de octubre"
  const flip = tw(f, [land - 18, land], [-95, 0], ease.out);
  const push = 1 + 0.04 * tw(f, [land, land + 220], [0, 1]);
  return (
    <AbsoluteFill>
      <Dark />
      <div style={{position: 'absolute', left: 240, top: 330, width: 600, perspective: 1600}}>
        <div style={{transformOrigin: '50% 0%', transform: `rotateX(${flip}deg) scale(${push})`, boxShadow: '0 40px 80px rgba(0,0,0,0.5)', borderRadius: 26, overflow: 'hidden', background: PAPEL}}>
          <div style={{background: '#C8323C', color: '#fff', textAlign: 'center', fontFamily: F.display, fontSize: 84, letterSpacing: 10, padding: '18px 0 10px'}}>OCTUBRE</div>
          <div style={{textAlign: 'center', fontFamily: F.display, fontSize: 330, lineHeight: 1.05, color: TINTA}}>17</div>
          <div style={{textAlign: 'center', fontFamily: F.sans, fontWeight: 900, fontSize: 70, color: C.azul, paddingBottom: 26, letterSpacing: 6}}>1953</div>
        </div>
      </div>
      <div style={{position: 'absolute', top: 1040, left: SAFE_X, right: SAFE_X, textAlign: 'center'}}>
        <WordsIn text="El presidente Adolfo Ruiz Cortines promulga la reforma a los artículos" start={v(31.32)} stagger={2} style={{fontFamily: F.sans, fontWeight: 700, fontSize: 50, lineHeight: 1.3, color: C.blanco}} />
      </div>
      <div style={{position: 'absolute', top: 1255, width: '100%', textAlign: 'center', opacity: tw(f, [v(34.0) - 6, v(34.0)], [0, 1])}}>
        <Highlight start={v(34.0)} color={C.amarillo} pad="0.02em 0.3em">
          <span style={{fontFamily: F.display, fontSize: 120, color: C.marino, letterSpacing: 2}}>34 y 115</span>
        </Highlight>
      </div>
      <div style={{position: 'absolute', top: 1430, width: '100%', textAlign: 'center', fontFamily: F.sans, fontWeight: 700, fontSize: 46, color: C.blanco, opacity: tw(f, [v(35.4), v(35.4) + 12], [0, 1])}}>
        de la Constitución
      </div>
      <Flash at={land} dur={10} />
      <Sfx at={land - 18} name="hist_paper" volume={0.5} />
      <Sfx at={land} name="hist_stamp" volume={0.6} />
      <Sfx at={v(34.0)} name="click" volume={0.35} />
    </AbsoluteFill>
  );
};

/** El artículo 34 reformado, escrito a máquina, con sello. La voz hace una pausa en "los varones…"
 *  y el texto se detiene ahí; "y las mujeres" se escribe y se resalta al decirlo. */
const ART_A = 'Son ciudadanos de la República los varones ';
const ART_K = 'y las mujeres';
const ART_R = ' que, teniendo la calidad de mexicanos, reúnan, además, los siguientes requisitos…';
const Articulo: React.FC = () => {
  const f = useCurrentFrame();
  const v = useVoz();
  const a = v(37.9); // "la Constitución lo dice claro"
  const k = v(40.45); // "y las mujeres"
  const kEnd = k + typeFrames(ART_K, 20);
  const rEnd = kEnd + typeFrames(ART_R, 60);
  const stamp = kEnd + 8;
  const typed = (txt: string, start: number, cps: number) => txt.slice(0, Math.max(0, Math.min(txt.length, Math.floor(((f - start) / 30) * cps))));
  const typing = (f >= a && f < a + typeFrames(ART_A, 34)) || (f >= k && f < rEnd);
  const cursor = f >= a && f < rEnd + 24 && (typing || Math.floor(f / 8) % 2 === 0);
  const stampS = tw(f, [stamp, stamp + 10], [2.2, 1], ease.out);
  return (
    <AbsoluteFill>
      <Paper />
      <div
        style={{
          position: 'absolute',
          left: 120,
          right: 120,
          top: 380,
          background: '#FBF6EC',
          border: `3px solid rgba(30,42,58,0.25)`,
          borderRadius: 10,
          padding: '56px 58px 70px',
          boxShadow: '0 30px 70px rgba(80,60,30,0.25)',
          transform: `translateY(${tw(f, [0, 14], [80, 0])}px) rotate(-1deg)`,
          opacity: tw(f, [0, 8], [0, 1]),
        }}
      >
        <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 24, letterSpacing: 3, color: C.azul, textAlign: 'center', lineHeight: 1.4}}>
          CONSTITUCIÓN POLÍTICA DE LOS
          <br />
          ESTADOS UNIDOS MEXICANOS
        </div>
        <div style={{height: 3, background: C.azul, opacity: 0.4, margin: '26px 0 34px'}} />
        <div style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 64, color: TINTA, marginBottom: 20}}>Artículo 34.</div>
        <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 44, lineHeight: 1.45, color: TINTA, minHeight: 470}}>
          {typed(ART_A, a, 34)}
          {f >= kEnd ? (
            <Highlight start={kEnd} dur={10} color={C.amarillo} pad="0 0.12em">
              <span style={{fontWeight: 900}}>{ART_K}</span>
            </Highlight>
          ) : (
            <span style={{fontWeight: 900}}>{typed(ART_K, k, 20)}</span>
          )}
          {typed(ART_R, kEnd, 60)}
          {cursor && <Cursor />}
        </div>
      </div>
      {/* sello */}
      <div
        style={{
          position: 'absolute',
          left: 640,
          top: 1300,
          width: 300,
          height: 300,
          borderRadius: 150,
          border: '10px solid #C8323C',
          color: '#C8323C',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: F.display,
          transform: `rotate(-14deg) scale(${f >= stamp ? stampS : 0})`,
          opacity: f >= stamp ? 0.9 : 0,
        }}
      >
        <span style={{fontSize: 56, letterSpacing: 4}}>REFORMA</span>
        <span style={{fontSize: 96, lineHeight: 1}}>1953</span>
      </div>
      <Sfx at={a} name="hist_typing_largo" volume={0.4} />
      <Sfx at={k} name="hist_typing" volume={0.4} />
      <Sfx at={kEnd} name="hist_typing_largo" volume={0.3} />
      <Sfx at={stamp} name="hist_stamp" volume={0.7} />
    </AbsoluteFill>
  );
};

const PrimerVoto: React.FC = () => {
  const urna = useVoz()(44.5); // "votaron en una elección federal"
  return (
    <Year
      year="1955"
      text={
        <>
          El 3 de julio las mujeres votan en una <b style={{color: C.azul}}>elección federal</b>
        </>
      }
      script="por primera vez"
      scriptAt={43.85}
      extra={
        <>
          <Urna start={urna} ok y={1420} scale={0.8} />
          <Sfx at={urna + 22} name="hist_ding" volume={0.3} />
        </>
      }
    />
  );
};

const VERBOS: [string, number][] = [
  ['votamos,', 48.5],
  ['decidimos,', 49.05],
  ['lideramos.', 49.6],
];
const Hoy: React.FC = () => {
  const f = useCurrentFrame();
  const v = useVoz();
  const gracias = v(50.91);
  return (
    <AbsoluteFill>
      <Dark />
      <div style={{position: 'absolute', top: 470, width: '100%'}}>
        <WordsIn text="73 años después," start={v(46.6)} style={{fontFamily: F.sans, fontWeight: 800, fontSize: 70, color: C.blanco}} />
      </div>
      {VERBOS.map(([w, t], i) => (
        <div key={w} style={{position: 'absolute', top: 590 + i * 170, width: '100%', textAlign: 'center'}}>
          <ScriptWord text={w} start={v(t)} size={160} neon tilt={-5} dur={14} />
        </div>
      ))}
      <div
        style={{
          position: 'absolute',
          top: 1180,
          left: SAFE_X,
          right: SAFE_X,
          textAlign: 'center',
          fontFamily: F.sans,
          fontWeight: 700,
          fontSize: 46,
          lineHeight: 1.35,
          color: C.blanco,
          opacity: tw(f, [gracias, gracias + 14], [0, 1]),
          transform: `translateY(${tw(f, [gracias, gracias + 16], [20, 0])}px)`,
        }}
      >
        Gracias a quienes abrieron el camino.
      </div>
      {VERBOS.map(([w, t]) => (
        <Sfx key={w} at={v(t)} name="flicker" volume={0.25} />
      ))}
    </AbsoluteFill>
  );
};

const Final: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: C.azul}}>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, rgba(61,139,212,0.85) 0%, rgba(39,99,154,0) 60%, rgba(10,25,50,0.55) 100%)'}} />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 190, top: 560, width: 700, clipPath: `inset(0 0 ${tw(f, [10, 28], [100, 0], ease.inOut)}% 0)`}}>
        <Img src={staticFile('logos/logo_westhill_blanco_total.png')} style={{width: '100%'}} />
      </div>
      <div style={{position: 'absolute', top: 930, width: '100%', textAlign: 'center', fontFamily: F.display, fontSize: 96, color: C.amarillo, letterSpacing: 4, opacity: tw(f, [28, 38], [0, 1])}}>
        17 DE OCTUBRE
      </div>
      <div style={{position: 'absolute', top: 1050, left: SAFE_X, right: SAFE_X, textAlign: 'center'}}>
        <ScriptWord text="Aniversario del voto de la mujer" start={36} size={safeSize('Aniversario del voto de la mujer', 92, 0.4)} neon tilt={-4} dur={18} />
      </div>
      <div style={{position: 'absolute', top: 1175, width: '100%', textAlign: 'center', fontFamily: F.sans, fontWeight: 800, fontSize: 46, color: C.blanco, opacity: tw(f, [48, 58], [0, 1])}}>
        en México
      </div>
      <div style={{position: 'absolute', top: 1320, width: '100%', textAlign: 'center', fontFamily: F.sans, fontWeight: 800, fontSize: 34, letterSpacing: 8, color: C.blanco, opacity: tw(f, [60, 72], [0, 1])}}>
        #SOMOSWESTHILL
      </div>
      <Sfx at={36} name="flicker" volume={0.3} />
      <Sfx at={48} name="hist_ding" volume={0.45} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Línea de tiempo
// ---------------------------------------------------------------------------
/** t: segundo de la voz en que arranca la frase de la escena; la escena queda del todo visible PRE cuadros antes */
type Shot = {t: number; el: React.ReactNode};
const PRE = 4;
const SCENES: Shot[] = [
  {t: 0, el: <Hook />},
  {t: 5.14, el: <NoCalladas />},
  {
    t: 7.29,
    el: <Year year="1916" text={<>En el <b style={{color: C.azul}}>Primer Congreso Feminista</b>, en Yucatán, las mujeres exigen sus derechos</>} script="igualdad" scriptAt={11.75} />,
  },
  {
    t: 12.88,
    el: <Year year="1923" text={<>Elvia Carrillo Puerto, Beatriz Peniche y Raquel Dzib, <b style={{color: C.azul}}>primeras diputadas locales</b> en Yucatán</>} script="abren camino" scriptAt={15.3} />,
  },
  {
    t: 17.73,
    el: <Year year="1947" text={<>Pueden votar… pero <b style={{color: '#C8323C'}}>sólo en elecciones municipales</b></>} script="no era suficiente" scriptAt={21.0} />,
  },
  {
    t: 22.69,
    el: <Year year="1952" text={<>Se reúnen en la Ciudad de México para <b style={{color: C.azul}}>exigir el voto</b></>} script="una sola voz" scriptAt={25.7} extra={<Contador t={24.87} />} />,
  },
  {t: 28.13, el: <Calendario />},
  {t: 36.99, el: <Articulo />},
  // entra un poco después de la frase para dejar ver el sello de la reforma
  {t: 42.63, el: <PrimerVoto />},
  {t: 46.6, el: <Hoy />},
  {t: 52.69, el: <Final />},
];
const FINAL_FRAMES = 130;
const STARTS = SCENES.map((s, i) => (i === 0 ? 0 : at(s.t) - PRE));
export const VOTO_FRAMES = STARTS[STARTS.length - 1] + FINAL_FRAMES;
export const sceneStart = (i: number) => STARTS[i];
const sceneEnd = (i: number) => (i < STARTS.length - 1 ? STARTS[i + 1] : VOTO_FRAMES);
/** Fin de la voz (cuadro global): la música sube al terminar */
const VOZ_FIN = at(53.7);

const Fade: React.FC<{first: boolean; children: React.ReactNode}> = ({first, children}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{opacity: first ? 1 : tw(f, [0, XF], [0, 1], ease.inOut)}}>{children}</AbsoluteFill>;
};

const musicVol = (fr: number) =>
  interpolate(fr, [0, 8, VOZ_FIN, VOZ_FIN + 20, VOTO_FRAMES - 45, VOTO_FRAMES], [0, 0.26, 0.26, 0.5, 0.5, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const VotoMujer: React.FC<{music?: boolean; voz?: boolean}> = ({music = true, voz = true}) => (
  <AbsoluteFill style={{background: '#000'}}>
    {SCENES.map((s, i) => {
      const from = i === 0 ? 0 : STARTS[i] - XF;
      return (
        <Sequence key={i} from={from} durationInFrames={sceneEnd(i) - from + XF}>
          <SceneCtx.Provider value={from}>
            <Fade first={i === 0}>{s.el}</Fade>
          </SceneCtx.Provider>
        </Sequence>
      );
    })}
    <Sequence from={sceneStart(1)} durationInFrames={sceneStart(10) - sceneStart(1)}>
      <Banner />
    </Sequence>
    <Grain opacity={0.05} />
    {voz && (
      <Sequence from={at(0)}>
        <Audio src={staticFile(VOZ)} />
      </Sequence>
    )}
    {music && <Audio src={staticFile('music/historia_voto.mp3')} volume={voz ? musicVol : (fr) => interpolate(fr, [0, 15, VOTO_FRAMES - 45, VOTO_FRAMES], [0, 0.55, 0.55, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />}
  </AbsoluteFill>
);
