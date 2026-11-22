import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from './components';
import {Sfx} from './shots';
import {F, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Versión NARRADA del anuncio de la placa COMAEM (9:16, 42.3 s), con la voz de IA que preparó el cliente
// (public/placa/voz_ia.mp3, ElevenLabs "Renata"). Misma línea gráfica que PlacaComaem.tsx, pero toda la línea de
// tiempo sigue a la narración: cada bloque entra cuando la voz lo dice (tiempos medidos con Parakeet) y la
// narración hace una pausa para que se escuche al Dr. Asisclo. La música ("Solace", alargada con tres repeticiones
// de su frase, scripts/placa_musica_extendida.py) va baja debajo de la voz.
// ---------------------------------------------------------------------------
const W = 1080;
const H = 1920;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const NAVY = '#0E2C52';
const NAVY2 = '#0A2141';
const AZUL = '#1F5A96';
const AMARILLO = '#F2C94C';
const VERDE = '#2BAE66';
const BLANCO = '#FFFFFF';
const vid = (n: string) => staticFile(`proxies/placa/${n}.mp4`);
const LOGO = staticFile('logos/logo_westhill_blanco_total.png');
export const PLACA_VOZ_FRAMES = 1270; // 42.3 s: la narración termina en 41.1 s
const CIERRE = 1053;

type Toma = {src: string; at: number; dur: number; desde: number; rate?: number; origen?: string; zoom?: [number, number]};
const TOMAS: Toma[] = [
  {src: '11218', at: 0, dur: 110, desde: 0.4, origen: '72% 22%', zoom: [1.0, 1.24]},
  {src: '1126', at: 108, dur: 194, desde: 0.3, zoom: [1.04, 1.16]},
  {src: '1121', at: 300, dur: 107, desde: 0.5, zoom: [1.0, 1.1]},
  {src: '11211', at: 405, dur: 103, desde: 0.6, zoom: [1.04, 1.12]},
  {src: 'IMG_4448', at: 506, dur: 63, desde: 0.5, zoom: [1.02, 1.12]},
  {src: 'IMG_4449', at: 567, dur: 63, desde: 0.4, zoom: [1.02, 1.12]},
  {src: '11217', at: 628, dur: 67, desde: 2.0, origen: '40% 50%', zoom: [1.0, 1.08]},
  {src: '112110', at: 693, dur: 134, desde: 0.0, origen: '50% 40%', zoom: [1.2, 1.3]},
  {src: 'IMG_4440', at: 825, dur: 26, desde: 0.0, zoom: [1.1, 1.0]},
  {src: 'IMG_4440', at: 849, dur: 26, desde: 2.9, origen: '50% 40%', zoom: [1.0, 1.08]},
  {src: '11216', at: 873, dur: 28, desde: 1.5, origen: '45% 45%', zoom: [1.0, 1.06]},
  {src: '11219', at: 899, dur: 34, desde: 2.5, origen: '45% 45%', zoom: [1.0, 1.06]},
  {src: 'f:foto_59', at: 931, dur: 35, desde: 0, origen: '54% 45%', zoom: [1.0, 1.08]},
  {src: 'IMG_4526', at: 964, dur: 91, desde: 0.2, zoom: [1.0, 1.1]},
];

const Clip: React.FC<{t: Toma}> = ({t}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, t.dur], t.zoom ?? [1.0, 1.08], clamp);
  const entra = tw(f, [0, 6], [0, 1], ease.out);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: NAVY2}}>
      {t.src.startsWith('f:') ? (
        <Img src={staticFile(`placa/${t.src.slice(2)}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: t.origen ?? '50% 50%', transform: `scale(${z * (1.06 - 0.06 * entra)})`, filter: `contrast(1.06) saturate(1.08) blur(${(1 - entra) * 8}px)`}} />
      ) : (
        <OffthreadVideo src={vid(t.src)} startFrom={Math.round(t.desde * 30)} playbackRate={t.rate ?? 1} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z * (1.06 - 0.06 * entra)})`, transformOrigin: t.origen ?? '50% 50%', filter: `contrast(1.06) saturate(1.08) blur(${(1 - entra) * 8}px)`}} />
      )}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,33,65,0.55) 0%, rgba(10,33,65,0) 22%, rgba(10,33,65,0) 45%, rgba(10,33,65,0.85) 100%)'}} />
    </AbsoluteFill>
  );
};

/** Encabezado fijo como en las cápsulas: "UNIVERSIDAD WESTHILL / MEDICINA" con raya amarilla, logo a la derecha */
const Encabezado: React.FC = () => {
  const f = useCurrentFrame();
  const p = tw(f, [0, 10], [0, 1], ease.out);
  return (
    <>
      <div style={{position: 'absolute', left: 72, top: 120, opacity: p, transform: `translateY(${(1 - p) * -20}px)`}}>
        <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 30, letterSpacing: 1.5, color: BLANCO, textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>UNIVERSIDAD WESTHILL / MEDICINA</div>
        <div style={{width: 96 * p, height: 7, borderRadius: 4, background: AMARILLO, marginTop: 12}} />
      </div>
      <Img src={LOGO} style={{position: 'absolute', right: 72, top: 108, width: 200, opacity: p * 0.95, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))'}} />
    </>
  );
};

/** Palabras que suben una tras otra; las marcadas con * van en amarillo */
const Linea: React.FC<{texto: string; at: number; size: number; peso?: number; paso?: number; color?: string}> = ({texto, at, size, peso = 900, paso = 2, color = BLANCO}) => {
  const f = useCurrentFrame();
  return (
    <div style={{fontFamily: F.sans, fontWeight: peso, fontSize: size, lineHeight: 1.04, color, letterSpacing: -0.5}}>
      {texto.split(' ').map((w, i) => {
        const p = tw(f, [at + i * paso, at + i * paso + 8], [0, 1], ease.out);
        const amarillo = w.startsWith('*');
        return (
          <span key={i} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.08em', marginRight: '0.24em'}}>
            <span style={{display: 'inline-block', transform: `translateY(${(1 - p) * 105}%)`, color: amarillo ? AMARILLO : undefined}}>{w.replace('*', '')}</span>
          </span>
        );
      })}
    </div>
  );
};

/**
 * Panel del tercio inferior: entra inclinado desde abajo mientras una barra verde lo "dibuja" de izquierda a
 * derecha; lleva una franja verde-amarilla a la izquierda, un patrón de puntos en la esquina y un brillo que lo
 * cruza. Sale hacia la izquierda con desenfoque.
 */
const Panel: React.FC<{dur: number; children: React.ReactNode; top?: number}> = ({dur, children, top = 1180}) => {
  const f = useCurrentFrame();
  const p = tw(f, [0, 10], [0, 1], ease.out);
  const borde = tw(f, [0, 12], [0, 1], ease.inOut);
  const s = tw(f, [dur - 7, dur], [0, 1], ease.in);
  const brillo = interpolate(f, [10, 30], [-0.3, 1.3], clamp);
  return (
    <div style={{position: 'absolute', left: 56, right: 56, top, perspective: 1200, opacity: 1 - s, transform: `translateX(${-s * 160}px)`, filter: s > 0 ? `blur(${s * 10}px)` : undefined}}>
      <div style={{position: 'relative', padding: '44px 52px 50px 70px', borderRadius: 30, overflow: 'hidden', background: `linear-gradient(150deg, ${NAVY} 0%, ${NAVY2} 100%)`, boxShadow: '0 30px 70px rgba(0,0,0,0.5)', transform: `translateY(${(1 - p) * 90}px) rotateX(${(1 - p) * 28}deg)`, transformOrigin: '50% 100%', clipPath: `inset(0 ${(1 - borde) * 100}% 0 0 round 30px)`}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 14, background: `linear-gradient(180deg, ${VERDE} 0%, ${AMARILLO} 100%)`}} />
        <div style={{position: 'absolute', right: -10, top: -10, width: 230, height: 150, opacity: 0.35, backgroundImage: 'radial-gradient(rgba(242,201,76,0.9) 2.2px, transparent 2.6px)', backgroundSize: '22px 22px', WebkitMaskImage: 'linear-gradient(225deg, black 20%, transparent 75%)', maskImage: 'linear-gradient(225deg, black 20%, transparent 75%)'}} />
        <div style={{position: 'absolute', top: 0, bottom: 0, left: `${brillo * 100}%`, width: 180, transform: 'translateX(-50%) skewX(-18deg)', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.14), rgba(255,255,255,0))'}} />
        <div style={{position: 'relative'}}>{children}</div>
      </div>
      <div style={{position: 'absolute', left: `${borde * 100}%`, top: 0, bottom: 0, width: 10, marginLeft: -5, borderRadius: 5, background: VERDE, boxShadow: `0 0 24px ${VERDE}`, opacity: borde < 1 ? 1 : 0}} />
    </div>
  );
};

const Gancho: React.FC = () => {
  const f = useCurrentFrame();
  const sale = tw(f, [38, 44], [0, 1], ease.in);
  // "WESTHILL" cae en grande con un golpe y una luz que lo recorre
  const w = tw(f, [80, 90], [0, 1], ease.out);
  const golpe = interpolate(f, [80, 86, 94], [1.5, 0.94, 1], clamp);
  const luz = interpolate(f, [90, 108], [-0.3, 1.3], clamp);
  const sale2 = tw(f, [102, 108], [0, 1], ease.in);
  return (
    <>
      <div style={{position: 'absolute', left: 72, right: 72, top: 1210, opacity: 1 - sale, transform: `translateY(${-sale * 30}px)`, textShadow: '0 6px 30px rgba(0,0,0,0.6)'}}>
        <Linea texto="¿Vas a estudiar" at={0} size={86} paso={1} />
        <Linea texto="*MEDICINA?" at={4} size={150} paso={1} />
      </div>
      {f >= 42 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1170, textAlign: 'center', opacity: 1 - sale2, textShadow: '0 6px 30px rgba(0,0,0,0.6)'}}>
          <div style={{display: 'inline-block', textAlign: 'center'}}>
            <Linea texto="Mira lo que acaba de pasar en" at={44} size={60} peso={800} paso={1} />
          </div>
          <div style={{marginTop: 18, opacity: w, transform: `scale(${golpe})`}}>
            <span style={{position: 'relative', display: 'inline-block', fontFamily: F.sans, fontWeight: 900, fontSize: 176, letterSpacing: 4, lineHeight: 1, color: AMARILLO, padding: '0 10px', textShadow: 'none', filter: 'drop-shadow(0 6px 22px rgba(0,0,0,0.7)) drop-shadow(0 0 18px rgba(242,201,76,0.45))', backgroundImage: `linear-gradient(105deg, rgba(255,255,255,0) ${(luz - 0.08) * 100}%, rgba(255,255,255,0.95) ${luz * 100}%, rgba(255,255,255,0) ${(luz + 0.08) * 100}%), linear-gradient(180deg, #FFE38A 0%, ${AMARILLO} 60%, #D9A91F 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text'}}>
              <span style={{color: 'transparent'}}>WESTHILL</span>
            </span>
          </div>
          <div style={{margin: '18px auto 0', width: 560 * tw(f, [88, 100], [0, 1], ease.out), height: 9, borderRadius: 5, background: VERDE}} />
        </div>
      )}
    </>
  );
};

/** Íconos que se dibujan solos (trazo animado) */
const Icono: React.FC<{tipo: 'check' | 'ciclo' | 'escudo'; p: number}> = ({tipo, p}) => {
  const trazo = (d: string, largo: number, delay = 0) => <path d={d} fill="none" stroke={BLANCO} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={largo} strokeDashoffset={largo * (1 - c01((p - delay) / (1 - delay)))} />;
  return (
    <svg viewBox="0 0 60 60" style={{width: 62, height: 62}}>
      {tipo === 'check' && (
        <>
          {trazo('M30 6 A24 24 0 1 1 29.9 6', 151)}
          {trazo('M18 31 L27 40 L43 22', 40, 0.4)}
        </>
      )}
      {tipo === 'ciclo' && (
        <>
          {trazo('M46 24 A17 17 0 1 0 47 36', 95)}
          {trazo('M47 12 L46 24 L34 23', 26, 0.5)}
        </>
      )}
      {tipo === 'escudo' && (
        <>
          {trazo('M30 6 L49 13 V29 C49 41 41 50 30 54 C19 50 11 41 11 29 V13 Z', 150)}
          {trazo('M21 30 L28 37 L40 24', 32, 0.5)}
        </>
      )}
    </svg>
  );
};
const c01 = (x: number) => Math.max(0, Math.min(1, x));

const TARJETAS: {n: string; tipo: 'check' | 'ciclo' | 'escudo'; titulo: string; texto: string}[] = [
  {n: '01', tipo: 'check', titulo: 'Calidad evaluada', texto: 'Tu programa cumple criterios académicos de acreditación.'},
  {n: '02', tipo: 'ciclo', titulo: 'Mejora continua', texto: 'Lo que aprendes se revisa y se actualiza.'},
  {n: '03', tipo: 'escudo', titulo: 'Respaldo externo', texto: 'Lo avala un organismo acreditador independiente.'},
];
/**
 * Las tres tarjetas se apilan: cada una entra desde la derecha con su ícono dibujándose y su barra de progreso
 * (1/3, 2/3, 3/3); la anterior sube, se encoge y se queda detrás, como una pila de notificaciones.
 */
const ENTRADAS = [42, 80, 112]; // "Calidad evaluada", "mejora continua", "el respaldo"
const Tarjetas: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const sale = tw(f, [dur - 7, dur], [0, 1], ease.in);
  return (
    <div style={{position: 'absolute', left: 56, right: 56, top: 1190, opacity: 1 - sale, transform: `translateY(${sale * 40}px)`}}>
      {TARJETAS.map((t, i) => {
        const a = f - ENTRADAS[i];
        if (a < 0) return null;
        const entra = tw(a, [0, 10], [0, 1], ease.out);
        const sube = TARJETAS.slice(i + 1).reduce((x, _, k) => x + tw(f - ENTRADAS[i + 1 + k], [0, 10], [0, 1], ease.out), 0);
        const icono = tw(a, [4, 22], [0, 1]);
        const barra = tw(a, [6, 36], [0, 1]);
        return (
          <div key={i} style={{position: 'absolute', left: 0, right: 0, top: 0, zIndex: i, transform: `translateX(${(1 - entra) * 700}px) translateY(${-sube * 100}px) scale(${1 - sube * 0.05}) rotate(${(1 - entra) * 6}deg)`, transformOrigin: '50% 0', opacity: 1 - sube * 0.12, filter: sube > 0.05 ? `brightness(${1 - sube * 0.12})` : undefined}}>
            <div style={{position: 'relative', padding: '36px 40px 40px', borderRadius: 30, background: BLANCO, boxShadow: '0 26px 60px rgba(0,0,0,0.4)', display: 'flex', gap: 30, alignItems: 'center', overflow: 'hidden'}}>
              <div style={{flex: 'none', position: 'relative', width: 110, height: 110, borderRadius: 26, background: `linear-gradient(150deg, ${VERDE} 0%, #1F8F52 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 24px rgba(43,174,102,0.45)', transform: `scale(${0.5 + 0.5 * tw(a, [2, 12], [0, 1], ease.out)})`}}>
                <Icono tipo={t.tipo} p={icono} />
                <div style={{position: 'absolute', right: -10, top: -10, width: 46, height: 46, borderRadius: 23, background: AMARILLO, color: NAVY, fontFamily: F.sans, fontWeight: 900, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `4px solid ${BLANCO}`}}>{t.n}</div>
              </div>
              <div style={{flex: 1}}>
                <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 54, color: NAVY, lineHeight: 1.05}}>{t.titulo}</div>
                <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 34, color: '#3A4F6B', lineHeight: 1.3, marginTop: 12}}>{t.texto}</div>
              </div>
              <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 9, background: '#E4ECF5'}}>
                <div style={{width: `${((i + barra) / 3) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${VERDE}, ${AMARILLO})`}} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PALABRAS: [string, number][] = [
  ['Estas', 0.0],
  ['placas', 0.48],
  ['les', 1.28],
  ['pertenecen', 1.52],
  ['a', 2.56],
  ['todos', 2.8],
  ['ustedes.', 3.12],
];
const Voz: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const p = tw(f, [0, 8], [0, 1], ease.out);
  return (
    <>
      <div style={{position: 'absolute', left: 72, top: 1150, opacity: p}}>
        <div style={{display: 'inline-block', padding: '10px 22px', borderRadius: 12, background: AMARILLO, fontFamily: F.sans, fontWeight: 800, fontSize: 30, color: NAVY}}>Director de la Facultad de Medicina</div>
      </div>
      <div style={{position: 'absolute', left: 72, right: 72, top: 1240, fontFamily: F.sans, fontWeight: 900, fontSize: 86, lineHeight: 1.08, color: BLANCO, textShadow: '0 6px 30px rgba(0,0,0,0.7)'}}>
        <span style={{color: AMARILLO}}>“</span>
        {PALABRAS.map(([w, a], i) => {
          const q = tw(t, [a - 0.05, a + 0.12], [0, 1]);
          return (
            <span key={i} style={{opacity: 0.22 + 0.78 * q, color: q > 0.5 && i >= 5 ? AMARILLO : undefined}}>
              {w}{' '}
            </span>
          );
        })}
        <span style={{color: AMARILLO, opacity: tw(t, [3.5, 3.7], [0, 1])}}>”</span>
      </div>
    </>
  );
};

/** Comunidad: una palabra por corte y luego la frase completa */
const COMUNIDAD = ['Profesores.', 'Estudiantes.', 'Directivos.'];
const Comunidad: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      {COMUNIDAD.map((w, i) => {
        const a = f - i * 24;
        if (a < 0 || a >= (i === 2 ? 26 : 24)) return null;
        const p = tw(a, [0, 7], [0, 1], ease.out);
        return (
          <div key={w} style={{position: 'absolute', left: 0, right: 0, top: 1240, textAlign: 'center', fontFamily: F.sans, fontWeight: 900, fontSize: 132, color: i === 1 ? AMARILLO : BLANCO, transform: `scale(${1.5 - 0.5 * p})`, opacity: p * (1 - tw(a, [20, 25], [0, 1])), filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined, textShadow: '0 8px 30px rgba(0,0,0,0.6)'}}>
            {w}
          </div>
        );
      })}
      <Sequence from={74} durationInFrames={65} layout="none">
        <Panel dur={65} top={1200}>
          <Linea texto="Una comunidad que lo hizo *posible." at={0} size={70} paso={1.5} />
        </Panel>
      </Sequence>
    </>
  );
};

const Vigencia: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const p = tw(f, [2, 12], [0, 1], ease.out);
  const k = interpolate(f, [6, 30], [0, 1], {...clamp, easing: ease.inOut});
  const n = Math.round(2026 + 5 * k);
  return (
    <Panel dur={dur} top={1100}>
      <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 32, letterSpacing: 2, color: VERDE}}>DISTINCIÓN VIGENTE HASTA</div>
      <div style={{display: 'flex', alignItems: 'center', gap: 30, marginTop: 14}}>
        <div style={{padding: '4px 28px 10px', borderRadius: 18, background: `linear-gradient(180deg, #FFE38A 0%, ${AMARILLO} 60%, #D9A91F 100%)`, fontFamily: F.sans, fontWeight: 900, fontSize: 150, lineHeight: 1, color: NAVY, transform: `scale(${0.7 + 0.3 * p})`, boxShadow: '0 12px 30px rgba(242,201,76,0.35)'}}>{n}</div>
        <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 42, lineHeight: 1.15, color: BLANCO, opacity: tw(f, [14, 24], [0, 1])}}>
          octubre
          <br />
          de 2031
        </div>
      </div>
      {/* línea del tiempo 2026 → 2031 */}
      <div style={{position: 'relative', marginTop: 34, height: 54}}>
        <div style={{position: 'absolute', left: 8, right: 8, top: 10, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.18)'}} />
        <div style={{position: 'absolute', left: 8, top: 10, height: 6, borderRadius: 3, width: `calc(${k * 100}% - ${16 * k}px)`, background: `linear-gradient(90deg, ${VERDE}, ${AMARILLO})`}} />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const on = k >= i / 5 - 0.001;
          return (
            <div key={i} style={{position: 'absolute', left: `calc(${(i / 5) * 100}% - ${(i / 5) * 16}px)`, top: 0}}>
              <div style={{width: 26, height: 26, borderRadius: 13, background: on ? (i === 5 ? AMARILLO : VERDE) : '#2A4670', border: `4px solid ${NAVY}`, transform: `scale(${on ? 1 : 0.7})`}} />
              <div style={{marginTop: 4, marginLeft: -10, fontFamily: F.sans, fontWeight: 700, fontSize: 18, color: on ? BLANCO : '#6E86A8'}}>{2026 + i}</div>
            </div>
          );
        })}
      </div>
      <div style={{marginTop: 18, fontFamily: F.sans, fontWeight: 600, fontSize: 30, color: '#BFD4EE', opacity: tw(f, [26, 36], [0, 1])}}>Consulta el registro oficial en comaem.org.mx</div>
    </Panel>
  );
};

/** Sello circular que gira: "DISTINCIÓN DE EXCELENCIA · COMAEM ·" alrededor y una estrella al centro */
const Sello: React.FC<{p: number; giro: number}> = ({p, giro}) => (
  <svg viewBox="0 0 200 200" style={{width: 210, height: 210, transform: `scale(${p}) rotate(${(1 - p) * -90}deg)`, filter: 'drop-shadow(0 10px 22px rgba(0,0,0,0.45))'}}>
    <defs>
      <path id="selloCirc" d="M100 100 m-72 0 a72 72 0 1 1 144 0 a72 72 0 1 1 -144 0" />
      <linearGradient id="selloOro" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFE38A" />
        <stop offset="0.6" stopColor={AMARILLO} />
        <stop offset="1" stopColor="#D9A91F" />
      </linearGradient>
    </defs>
    <circle cx="100" cy="100" r="96" fill="url(#selloOro)" />
    <circle cx="100" cy="100" r="86" fill="none" stroke={NAVY} strokeWidth="2" strokeDasharray="3 5" />
    <circle cx="100" cy="100" r="54" fill={NAVY} />
    <g transform={`rotate(${giro} 100 100)`}>
      <text fontFamily="Montserrat" fontWeight={800} fontSize="15.5" letterSpacing="2.2" fill={NAVY}>
        <textPath href="#selloCirc">DISTINCIÓN DE EXCELENCIA · COMAEM · 2026 – 2031 ·</textPath>
      </text>
    </g>
    <path d="M100 66 L109 90 L134 91 L114 106 L121 131 L100 116 L79 131 L86 106 L66 91 L91 90 Z" fill="url(#selloOro)" />
  </svg>
);

const CHISPAS = Array.from({length: 46}, (_, i) => ({x: ((i * 397) % 1000) / 1000, y: ((i * 613) % 1000) / 1000, s: 3 + ((i * 37) % 6), v: 0.6 + ((i * 53) % 10) / 10, fase: i * 1.7}));

/**
 * Cierre de venta: logo de Westhill arriba con un barrido de luz; "Tu vocación merece EXCELENCIA." en dorado;
 * la foto oficial enmarcada con el sello giratorio de la distinción; tres puntos de valor que entran uno a uno;
 * el botón "Solicita información" con flecha, latido y ondas. Fondo azul con el auditorio desenfocado, haces de luz,
 * chispas doradas y las ondas verde-amarillo de las cápsulas entrando desde los lados.
 */
const PUNTOS = ['Plan incorporado a la UNAM', 'Distinción de Excelencia COMAEM', 'Primera universidad privada en recibirla'];
/**
 * Titular cinético del cierre: "Tu", "vocación", "merece" y "EXCELENCIA." llenan la pantalla uno por uno, al
 * ritmo, y cada palabra vuela a su lugar en el titular final mientras entra la siguiente. Los anchos salen de
 * Montserrat medido (800 a 74 px para la primera línea, 900 a 138 px para EXCELENCIA).
 */
type PalabraT = {w: string; peso: number; size: number; ancho: number; x: number; y: number; at: number; vuela: number; dorado?: boolean};
const PAL_T: PalabraT[] = [
  {w: 'Tu', peso: 800, size: 74, ancho: 97.2, x: 197.6, y: 372, at: 0, vuela: 3},
  {w: 'vocación', peso: 800, size: 74, ancho: 350.8, x: 441.6, y: 372, at: 5, vuela: 20},
  {w: 'merece', peso: 800, size: 74, ancho: 294.3, x: 784.2, y: 372, at: 22, vuela: 36},
  {w: 'EXCELENCIA.', peso: 900, size: 138, ancho: 1006.8, x: 540, y: 488, at: 38, vuela: 52, dorado: true},
];
const TitularCinetico: React.FC = () => {
  const f = useCurrentFrame();
  const shine = interpolate(f, [66, 90], [-0.3, 1.3], clamp);
  return (
    <AbsoluteFill>
      {/* destello en cada golpe de palabra */}
      {PAL_T.map((p) => (
        <AbsoluteFill key={p.w} style={{background: p.dorado ? 'radial-gradient(circle at 50% 50%, rgba(255,227,138,0.55), rgba(242,201,76,0) 60%)' : 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.28), rgba(255,255,255,0) 55%)', opacity: interpolate(f - p.at, [0, 1, 7], [0, 1, 0], clamp)}} />
      ))}
      {PAL_T.map((p) => {
        const a = f - p.at;
        if (a < 0) return null;
        const grande = Math.min(p.dorado ? 1.04 : 8, 1000 / p.ancho);
        const entra = tw(a, [0, 5], [0, 1], ease.out);
        const vuela = tw(f, [p.vuela, p.vuela + (p.dorado ? 14 : 10)], [0, 1], ease.inOut);
        // escala: entra un poco más grande (golpe), se asienta en "grande" y luego baja a 1 al volar
        const golpe = p.dorado ? interpolate(a, [0, 10], [2.2, 1], {...clamp, easing: ease.out}) : 1.25 - 0.25 * entra;
        const esc = Math.pow(grande * golpe, 1 - Math.min(1, vuela * 1.6));
        const cx = 540 * (1 - vuela) + p.x * vuela;
        const cy = 960 * (1 - vuela) + p.y * vuela;
        const estilo: React.CSSProperties = p.dorado
          ? {color: 'transparent', backgroundImage: `linear-gradient(105deg, rgba(255,255,255,0) ${(shine - 0.08) * 100}%, rgba(255,255,255,0.95) ${shine * 100}%, rgba(255,255,255,0) ${(shine + 0.08) * 100}%), linear-gradient(180deg, #FFE38A 0%, ${AMARILLO} 60%, #D9A91F 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', letterSpacing: 2, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.45))'}
          : {color: BLANCO, letterSpacing: -0.5, textShadow: '0 6px 24px rgba(0,0,0,0.45)'};
        return (
          <div key={p.w} style={{position: 'absolute', left: cx, top: cy, transform: `translate(-50%, -50%) scale(${esc})`, opacity: Math.min(1, entra * 1.5), filter: entra < 1 ? `blur(${(1 - entra) * 10}px)` : undefined, whiteSpace: 'nowrap'}}>
            <span style={{fontFamily: F.sans, fontWeight: p.peso, fontSize: p.size, lineHeight: 1, display: 'inline-block', ...estilo}}>{p.w}</span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Cierre: React.FC = () => {
  const f = useCurrentFrame();
  const logo = tw(f, [52, 66], [0, 1], ease.out);
  const barridoLogo = interpolate(f, [64, 86], [-0.2, 1.2], clamp);
  const foto = tw(f, [56, 70], [0, 1], ease.out);
  const sello = tw(f, [66, 80], [0, 1], ease.out);
  const boton = tw(f, [128, 140], [0, 1], ease.out);
  const late = f > 140 ? 1 + 0.04 * Math.max(0, Math.sin(((f - 140) / 15) * Math.PI)) : 1;
  const brillo = interpolate((f - 144) % 40, [0, 16], [-0.3, 1.3], clamp);
  const ondas = tw(f, [0, 18], [0, 1], ease.out);
  return (
    <AbsoluteFill style={{background: NAVY2, overflow: 'hidden'}}>
      <OffthreadVideo src={vid('11211')} startFrom={60} muted style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(18px) saturate(0.7)', opacity: 0.35, transform: 'scale(1.15)'}} />
      <AbsoluteFill style={{background: `linear-gradient(175deg, rgba(14,44,82,0.92) 0%, rgba(14,44,82,0.82) 45%, rgba(31,90,150,0.88) 100%)`}} />
      {/* haces de luz */}
      {[0, 1, 2].map((i) => (
        <div key={i} style={{position: 'absolute', left: -300 + i * 380 + Math.sin(f / 40 + i) * 40, top: -400, width: 160, height: 2800, transform: 'rotate(22deg)', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,240,200,0.07), rgba(255,255,255,0))'}} />
      ))}
      {/* chispas doradas */}
      {CHISPAS.map((c, i) => {
        const y = ((c.y * H - f * c.v * 2.2) % H + H) % H;
        return <div key={i} style={{position: 'absolute', left: c.x * W, top: y, width: c.s, height: c.s, borderRadius: '50%', background: '#FFE7A0', boxShadow: '0 0 8px #F2C94C', opacity: 0.25 + 0.45 * Math.abs(Math.sin(f / 12 + c.fase))}} />;
      })}
      {/* ondas de las cápsulas */}
      <svg viewBox="0 0 1080 260" style={{position: 'absolute', left: 0, bottom: 0, width: W}}>
        <path d="M0,120 C300,40 600,200 1080,70 L1080,260 L0,260 Z" fill={VERDE} transform={`translate(${(1 - ondas) * -1080} 0)`} />
        <path d="M0,170 C320,100 640,240 1080,130 L1080,260 L0,260 Z" fill={AMARILLO} transform={`translate(${(1 - ondas) * 1080} 0)`} />
        <path d="M0,210 C340,160 680,260 1080,190 L1080,260 L0,260 Z" fill={NAVY2} transform={`translate(0 ${(1 - ondas) * 120})`} />
      </svg>
      {/* logo arriba */}
      <div style={{position: 'absolute', left: W / 2 - 230, top: 96, width: 460, opacity: logo, transform: `translateY(${(1 - logo) * -40}px) scale(${0.92 + 0.08 * logo})`, filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.45))'}}>
        <Img src={LOGO} style={{width: '100%', display: 'block'}} />
        <Img src={LOGO} style={{position: 'absolute', left: 0, top: 0, width: '100%', clipPath: `polygon(${(barridoLogo - 0.08) * 100}% 0, ${(barridoLogo + 0.06) * 100}% 0, ${barridoLogo * 100}% 100%, ${(barridoLogo - 0.14) * 100}% 100%)`, filter: 'brightness(2) drop-shadow(0 0 8px white)'}} />
      </div>
      <div style={{position: 'absolute', left: W / 2 - 160 * logo, top: 300, width: 320 * logo, height: 6, borderRadius: 3, background: AMARILLO}} />
      <TitularCinetico />
      {/* foto con marco y sello */}
      <div style={{position: 'absolute', left: 160, right: 160, top: 600, height: 527, opacity: foto, transform: `translateY(${(1 - foto) * 80}px) rotate(${-2.5 + (1 - foto) * -6}deg)`}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: 26, background: BLANCO, padding: 10, boxShadow: '0 30px 70px rgba(0,0,0,0.5)'}}>
          <div style={{width: '100%', height: '100%', borderRadius: 18, overflow: 'hidden'}}>
            <Img src={staticFile('placa/foto_61.jpg')} style={{width: '100%', height: '100%', objectFit: 'contain', transform: `scale(${1.04 - 0.04 * foto})`}} />
          </div>
        </div>
        <div style={{position: 'absolute', right: -100, bottom: -125}}>
          <Sello p={sello} giro={f * 1.2} />
        </div>
      </div>
      {/* puntos de valor */}
      <div style={{position: 'absolute', left: 90, right: 90, top: 1185}}>
        <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 52, color: BLANCO, opacity: tw(f, [62, 72], [0, 1]), transform: `translateY(${(1 - tw(f, [62, 72], [0, 1], ease.out)) * 20}px)`}}>
          Estudia <span style={{color: AMARILLO}}>Médico Cirujano</span>
        </div>
        {PUNTOS.map((t, i) => {
          const q = tw(f, [70 + i * 8, 82 + i * 8], [0, 1], ease.out);
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 14, padding: '12px 22px', borderRadius: 16, background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.18)', opacity: q, transform: `translateX(${(1 - q) * -80}px)`}}>
              <div style={{flex: 'none', width: 44, height: 44, borderRadius: 22, background: VERDE, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <svg viewBox="0 0 24 24" style={{width: 28, height: 28}}>
                  <path d="M5 12.5 L10 17 L19 7.5" fill="none" stroke={BLANCO} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={22} strokeDashoffset={22 * (1 - tw(f, [76 + i * 8, 86 + i * 8], [0, 1]))} />
                </svg>
              </div>
              <div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 33, color: BLANCO}}>{t}</div>
            </div>
          );
        })}
      </div>
      {/* botón */}
      <div style={{position: 'absolute', left: 110, right: 110, top: 1555, height: 116}}>
        {[0, 1].map((r) => {
          const fase = ((f - 140 - r * 20) % 40) / 40;
          return f > 140 + r * 20 ? <div key={r} style={{position: 'absolute', inset: 0, borderRadius: 64, border: `4px solid ${AMARILLO}`, opacity: (1 - fase) * 0.7, transform: `scale(${1 + fase * 0.18}, ${1 + fase * 0.5})`}} /> : null;
        })}
        <div style={{position: 'absolute', inset: 0, borderRadius: 64, background: `linear-gradient(180deg, #FFE38A 0%, ${AMARILLO} 55%, #E0B12E 100%)`, boxShadow: '0 16px 40px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, overflow: 'hidden', opacity: boton, transform: `translateY(${(1 - boton) * 50}px) scale(${late * (0.8 + 0.2 * boton)})`}}>
          <div style={{position: 'absolute', top: 0, bottom: 0, left: `${brillo * 100}%`, width: 130, transform: 'translateX(-50%) skewX(-18deg)', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.7), rgba(255,255,255,0))'}} />
          <span style={{position: 'relative', fontFamily: F.sans, fontWeight: 900, fontSize: 50, color: NAVY, letterSpacing: 1}}>SOLICITA INFORMACIÓN</span>
          <svg viewBox="0 0 24 24" style={{position: 'relative', width: 46, height: 46, transform: `translateX(${Math.sin(f / 5) * 6}px)`}}>
            <path d="M4 12 H19 M13 6 L19 12 L13 18" fill="none" stroke={NAVY} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const PlacaComaemVoz: React.FC = () => {
  const musica = (fr: number) => {
    const base = interpolate(fr, [0, 30, PLACA_VOZ_FRAMES - 20, PLACA_VOZ_FRAMES], [0, 0.9, 0.9, 0], {...clamp, easing: (x) => x * x * (3 - 2 * x)});
    // baja debajo de la narración; un poco más bajo con la voz del Dr. Asisclo; sube al terminar la narración
    const bajo = interpolate(fr, [0, 6, 690, 700, 815, 825, 1232, 1250], [1, 0.24, 0.24, 0.18, 0.18, 0.24, 0.24, 0.6], clamp);
    return base * bajo;
  };
  return (
    <AbsoluteFill style={{background: NAVY2}}>
      {TOMAS.map((t, i) => (
        <Sequence key={i} from={t.at} durationInFrames={t.dur}>
          <Clip t={t} />
        </Sequence>
      ))}
      <Sequence durationInFrames={108}>
        <Gancho />
      </Sequence>
      <Sequence from={108} durationInFrames={192}>
        <Panel dur={192}>
          <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 32, letterSpacing: 2, color: VERDE, marginBottom: 14}}>DISTINCIÓN DE EXCELENCIA COMAEM</div>
          <Linea texto="El *máximo *reconocimiento que otorga *COMAEM." at={78} size={64} paso={2.2} />
        </Panel>
      </Sequence>
      <Sequence from={300} durationInFrames={105}>
        <Panel dur={105}>
          <Linea texto="Antes, solo la tenían la *UNAM y la *Escuela *Militar *de *Medicina." at={2} size={60} paso={2.2} />
        </Panel>
      </Sequence>
      <Sequence from={405} durationInFrames={101}>
        <Panel dur={101}>
          <Linea texto="Hoy, Westhill es la *primera *universidad *privada en recibirla." at={2} size={66} paso={2.4} />
        </Panel>
      </Sequence>
      <Sequence from={506} durationInFrames={187}>
        <div style={{position: 'absolute', left: 72, right: 72, top: 840, textShadow: '0 6px 26px rgba(0,0,0,0.7)'}}>
          <Linea texto="¿Qué significa *para *ti?" at={2} size={76} paso={3} />
        </div>
      </Sequence>
      <Sequence from={506} durationInFrames={187}>
        <Tarjetas dur={187} />
      </Sequence>
      <Sequence from={693} durationInFrames={132}>
        <Voz />
        <Audio src={staticFile('placa/asisclo.wav')} />
      </Sequence>
      <Sequence from={825} durationInFrames={139}>
        <Comunidad />
      </Sequence>
      <Sequence from={964} durationInFrames={89}>
        <Vigencia dur={89} />
      </Sequence>
      <Sequence durationInFrames={CIERRE}>
        <Encabezado />
      </Sequence>
      <Sequence from={CIERRE}>
        <Cierre />
      </Sequence>
      {[108, 825, CIERRE].map((at) => (
        <Sequence key={at} from={at} durationInFrames={10}>
          <Flash />
        </Sequence>
      ))}
      <Grain opacity={0.03} />
      {/* narración: hasta "…independiente." y, después del Dr. Asisclo, desde "Profesores" */}
      {/* "¿Vas a estudiar Medicina?…" de la primera grabación; la frase de la placa es la que se regrabó
          ("Recibimos la Distinción de Excelencia, el máximo reconocimiento que otorga la COMAEM", sin "en México") */}
      <Sequence durationInFrames={108}>
        <Audio src={staticFile('placa/voz_ia.wav')} volume={(fr) => interpolate(fr, [100, 108], [1, 0], clamp)} />
      </Sequence>
      <Sequence from={110} durationInFrames={180}>
        <Audio src={staticFile('placa/voz_ia2.wav')} />
      </Sequence>
      <Sequence from={299} durationInFrames={393}>
        <Audio src={staticFile('placa/voz_ia.wav')} startFrom={299} />
      </Sequence>
      <Sequence from={822}>
        <Audio src={staticFile('placa/voz_ia.wav')} startFrom={693} />
      </Sequence>
      <Sfx at={42} name="whoosh" volume={0.25} />
      <Sfx at={82} name="impact" volume={0.4} />
      <Sfx at={108} name="down_bass" volume={0.75} />
      <Sfx at={108} name="impact" volume={0.3} />
      {[300, 405, 506, 567, 628, 693, 849, 873, 899, 931, 964].map((at) => (
        <Sfx key={at} at={at - 3} name="ref_swoosh_short" volume={0.22} />
      ))}
      {[548, 586, 618].map((at) => (
        <Sfx key={at} at={at} name="pop" volume={0.3} />
      ))}
      <Sfx at={990} name="ding" volume={0.25} />
      <Sfx at={785} name="riser" volume={0.22} />
      <Sfx at={825} name="down_bass" volume={0.6} />
      <Sfx at={CIERRE - 10} name="whoosh_largo" volume={0.3} />
      {[0, 5, 22].map((k) => (
        <Sfx key={k} at={CIERRE + k} name="impact" volume={0.22} />
      ))}
      <Sfx at={CIERRE + 38} name="down_bass" volume={0.7} />
      <Sfx at={CIERRE + 56} name="ref_shutter" volume={0.25} />
      <Sfx at={CIERRE + 70} name="pop" volume={0.3} />
      <Sfx at={CIERRE + 128} name="ding" volume={0.25} />
      <Audio src={staticFile('placa/solace_voz.wav')} volume={musica} />
    </AbsoluteFill>
  );
};

const Flash: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: '#FFFDF4', opacity: interpolate(f, [0, 1, 9], [0.85, 0.7, 0], clamp)}} />;
};
