import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Sfx} from './shots';
import {F, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Reel (9:16, ~46 s): Experiencia Gastronómica de Relaciones Internacionales.
// Al compás de la música original (sfx/generar_musica_fiesta.py, 120 BPM, 1 compás = 60 cuadros):
//  1. Gancho (2 compases): cuatro saludos rápidos y el título.
//  2. El arranque (5 compases): autoridades con los alumnos (placas con nombre y cargo) y la vista de los stands.
//  3. Recorrido (7 × 2 compases): cada país con su comida y el saludo del equipo; entre países barre una cortina
//     con los colores de la bandera.
//  4. Despedida: mosaico con los 7 equipos saludando y el logo arriba; golpe final de la música.
// Música: python3 sfx/generar_musica_fiesta.py remotion/public/gastro/fiesta.wav 2 7 23
// Clips en public/proxies/gastro (1080x1920, 30 fps; originales 4K en media/gastro/fuente). IMG_4793 (horizontal)
// no se usa.
// ---------------------------------------------------------------------------
const W = 1080;
const H = 1920;
const COMPAS = 60;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const NAVY = '#0E2C52';
const AMARILLO = '#F2C94C';
const LOGO = staticFile('logos/logo_westhill_blanco_total.png');
const v = (n: number) => staticFile(`proxies/gastro/IMG_${n}.mp4`);

// Textos (los nombres de las autoridades se cambian aquí)
const TEXTO_1 = 'Hoy vivimos la *Experiencia *Gastronómica de Relaciones Internacionales';
const TEXTO_2 = ''; // en esta toma van las placas de las autoridades
const AUTORIDADES: [string, string][] = [
  ['Dr. Julio César Gómez', 'Director General Académico y de Enlace'],
  ['Guillermo López Andrade', 'Director de la carrera de Relaciones Internacionales'],
];
const TEXTO_3 = 'junto con alumnos de *Universidad *Westhill';

// ---------------------------------------------------------------------------
// Banderas dibujadas (sin emojis)
// ---------------------------------------------------------------------------
type Pais = {
  nombre: string;
  colores: string[]; // para la cortina
  bandera: (w: number, h: number) => React.ReactNode;
};
const vert = (c: string[]) => (w: number, h: number) => (
  <div style={{display: 'flex', width: w, height: h}}>
    {c.map((x, i) => (
      <div key={i} style={{flex: 1, background: x}} />
    ))}
  </div>
);
const horiz = (c: [string, number][]) => (w: number, h: number) => (
  <div style={{display: 'flex', flexDirection: 'column', width: w, height: h}}>
    {c.map(([x, k], i) => (
      <div key={i} style={{flex: k, background: x}} />
    ))}
  </div>
);
const rayas = (n: number, a: string, b: string) => (
  <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column'}}>
    {Array.from({length: n}).map((_, i) => (
      <div key={i} style={{flex: 1, background: i % 2 === 0 ? a : b}} />
    ))}
  </div>
);
const PAISES: Record<string, Pais> = {
  italia: {nombre: 'ITALIA', colores: ['#009246', '#F4F5F0', '#CE2B37'], bandera: vert(['#009246', '#F4F5F0', '#CE2B37'])},
  grecia: {
    nombre: 'GRECIA',
    colores: ['#0D5EAF', '#FFFFFF', '#0D5EAF'],
    bandera: (w, h) => (
      <div style={{position: 'relative', width: w, height: h}}>
        {rayas(9, '#0D5EAF', '#FFFFFF')}
        <div style={{position: 'absolute', left: 0, top: 0, width: (h * 5) / 9, height: (h * 5) / 9, background: '#0D5EAF'}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: '40%', height: '20%', background: '#fff'}} />
          <div style={{position: 'absolute', top: 0, bottom: 0, left: '40%', width: '20%', background: '#fff'}} />
        </div>
      </div>
    ),
  },
  francia: {nombre: 'FRANCIA', colores: ['#0055A4', '#F4F5F0', '#EF4135'], bandera: vert(['#0055A4', '#F4F5F0', '#EF4135'])},
  eu: {
    nombre: 'ESTADOS UNIDOS',
    colores: ['#B22234', '#FFFFFF', '#3C3B6E'],
    bandera: (w, h) => (
      <div style={{position: 'relative', width: w, height: h}}>
        {rayas(13, '#B22234', '#FFFFFF')}
        <div style={{position: 'absolute', left: 0, top: 0, width: w * 0.42, height: (h * 7) / 13, background: '#3C3B6E', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', alignItems: 'center', justifyItems: 'center', padding: 2}}>
          {Array.from({length: 12}).map((_, i) => (
            <div key={i} style={{width: h * 0.05, height: h * 0.05, borderRadius: '50%', background: '#fff'}} />
          ))}
        </div>
      </div>
    ),
  },
  espana: {nombre: 'ESPAÑA', colores: ['#AA151B', '#F1BF00', '#AA151B'], bandera: horiz([['#AA151B', 1], ['#F1BF00', 2], ['#AA151B', 1]])},
  mexico: {
    nombre: 'MÉXICO',
    colores: ['#006847', '#F4F5F0', '#CE1126'],
    bandera: (w, h) => (
      <div style={{position: 'relative', width: w, height: h}}>
        {vert(['#006847', '#F4F5F0', '#CE1126'])(w, h)}
        <div style={{position: 'absolute', left: w / 2 - h * 0.15, top: h / 2 - h * 0.15, width: h * 0.3, height: h * 0.3, borderRadius: '50%', background: '#8C6A2F'}} />
      </div>
    ),
  },
  colombia: {nombre: 'COLOMBIA', colores: ['#FCD116', '#003893', '#CE1126'], bandera: horiz([['#FCD116', 2], ['#003893', 1], ['#CE1126', 1]])},
};

// ---------------------------------------------------------------------------
// Piezas
// ---------------------------------------------------------------------------
/** Clip a pantalla completa con un acercamiento suave */
const Clip: React.FC<{n: number; desde: number; dur: number; rate?: number; z0?: number; z1?: number; cy?: number; volumen?: number}> = ({n, desde, dur, rate = 1, z0 = 1.0, z1 = 1.06, cy = 50, volumen = 0}) => {
  const f = useCurrentFrame();
  const z = z0 + (z1 - z0) * (f / dur);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      <OffthreadVideo src={v(n)} startFrom={Math.round(desde * 30)} playbackRate={rate} volume={volumen} muted={volumen === 0} style={{width: W, height: H, objectFit: 'cover', transform: `scale(${z})`, transformOrigin: `50% ${cy}%`}} />
    </AbsoluteFill>
  );
};

/** Texto en recuadro blanco; las palabras con * van resaltadas en amarillo */
const Rotulo: React.FC<{texto: string; top: number; dur: number; size?: number}> = ({texto, top, dur, size = 54}) => {
  const f = useCurrentFrame();
  const palabras = texto.split(' ');
  const sale = tw(f, [dur - 8, dur], [0, 1], ease.in);
  const caja = tw(f, [0, 10], [0, 1], ease.out);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top, opacity: 1 - sale, transform: `translateY(${sale * -20}px)`}}>
      <div style={{display: 'inline-block', padding: '26px 34px', borderRadius: 26, background: 'rgba(255,255,255,0.96)', boxShadow: '0 20px 50px rgba(0,0,0,0.35)', transformOrigin: '0 50%', transform: `scaleX(${0.6 + 0.4 * caja})`, opacity: caja}}>
        <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: size, lineHeight: 1.18, color: NAVY}}>
          {palabras.map((p, i) => {
            const q = tw(f, [4 + i * 2, 12 + i * 2], [0, 1], ease.out);
            const resalta = p.startsWith('*');
            return (
              <span key={i} style={{display: 'inline-block', marginRight: '0.28em', opacity: q, transform: `translateY(${(1 - q) * 18}px)`, color: resalta ? '#B07A00' : undefined, backgroundImage: resalta ? `linear-gradient(${AMARILLO}, ${AMARILLO})` : undefined, backgroundSize: resalta ? `${tw(f, [14 + i * 2, 24 + i * 2], [0, 1]) * 100}% 32%` : undefined, backgroundPosition: '0 88%', backgroundRepeat: 'no-repeat'}}>
                {resalta ? p.slice(1) : p}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/** Etiqueta del país: bandera + nombre + número de parada */
const EtiquetaPais: React.FC<{p: Pais; i: number; dur: number}> = ({p, i, dur}) => {
  const f = useCurrentFrame();
  const entra = tw(f, [6, 18], [0, 1], ease.out);
  const sale = tw(f, [dur - 8, dur], [0, 1], ease.in);
  const largo = p.nombre.length > 8;
  return (
    <div style={{position: 'absolute', left: 54, top: 170, display: 'flex', alignItems: 'center', gap: 26, opacity: entra * (1 - sale), transform: `translateX(${(1 - entra) * -80 - sale * 40}px)`}}>
      <div style={{borderRadius: 14, overflow: 'hidden', border: '5px solid #fff', boxShadow: '0 12px 30px rgba(0,0,0,0.45)', transform: `rotate(${(1 - entra) * -20 - 4}deg) scale(${0.6 + 0.4 * entra})`}}>{p.bandera(150, 100)}</div>
      <div>
        <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 28, letterSpacing: 4, color: AMARILLO, textShadow: '0 3px 12px rgba(0,0,0,0.7)'}}>PARADA {String(i + 1).padStart(2, '0')} / 07</div>
        <div style={{fontFamily: F.display, fontSize: largo ? 92 : 118, lineHeight: 1, marginTop: 18, color: '#fff', textShadow: '0 8px 26px rgba(0,0,0,0.6)', letterSpacing: 2}}>{p.nombre}</div>
      </div>
    </div>
  );
};

/** Cortina diagonal con los colores de la bandera; cubre la pantalla en el cuadro `mitad` */
const Cortina: React.FC<{colores: string[]; mitad: number}> = ({colores, mitad}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      {colores.map((c, i) => {
        const p = interpolate(f, [mitad - 9 + i * 1.5, mitad + 9 + i * 1.5], [0, 1], {...clamp, easing: ease.inOut});
        const x = interpolate(p, [0, 1], [-2600, 2600]);
        return <div key={i} style={{position: 'absolute', left: x - 600 + i * 260, top: -400, width: 1300, height: 2800, background: c, transform: 'rotate(18deg)', boxShadow: '0 0 60px rgba(0,0,0,0.25)'}} />;
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 1. Gancho
// ---------------------------------------------------------------------------
const GANCHO_F = 2 * COMPAS;
const GANCHO: [number, number][] = [
  [4801, 3.2],
  [4784, 2.8],
  [4780, 1.9],
  [4807, 1.4],
];
const Gancho: React.FC = () => {
  const f = useCurrentFrame();
  const t1 = tw(f, [4, 16], [0, 1], ease.out);
  const t2 = tw(f, [12, 24], [0, 1], ease.out);
  const t3 = tw(f, [22, 34], [0, 1], ease.out);
  const sale = tw(f, [GANCHO_F - 10, GANCHO_F], [0, 1], ease.in);
  return (
    <AbsoluteFill>
      {GANCHO.map(([n, d], i) => (
        <Sequence key={n} from={i * 30} durationInFrames={30}>
          <Clip n={n} desde={d} dur={30} z0={1.12} z1={1.0} cy={45} />
        </Sequence>
      ))}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,20,40,0.15) 30%, rgba(8,20,40,0.75) 100%)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1240, textAlign: 'center', opacity: 1 - sale, transform: `translateY(${sale * 40}px)`}}>
        <div style={{fontFamily: F.display, fontSize: 132, lineHeight: 0.95, color: '#fff', textShadow: '0 10px 30px rgba(0,0,0,0.5)', opacity: t1, transform: `scale(${1.3 - 0.3 * t1})`}}>EXPERIENCIA</div>
        <div style={{fontFamily: F.display, fontSize: 132, lineHeight: 0.95, color: AMARILLO, textShadow: '0 10px 30px rgba(0,0,0,0.5)', opacity: t2, transform: `scale(${1.3 - 0.3 * t2})`}}>GASTRONÓMICA</div>
        <div style={{display: 'inline-block', marginTop: 26, padding: '12px 30px', borderRadius: 40, background: NAVY, border: `3px solid ${AMARILLO}`, fontFamily: F.sans, fontWeight: 800, fontSize: 40, color: '#fff', opacity: t3, transform: `translateY(${(1 - t3) * 20}px)`}}>Relaciones Internacionales</div>
      </div>
      <Img src={LOGO} style={{position: 'absolute', left: W / 2 - 150, top: 110, width: 300, opacity: t1 * (1 - sale), filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.5))'}} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 2. Arranque del evento
// ---------------------------------------------------------------------------
const ARRANQUE: {n: number; desde: number; dur: number; texto: string}[] = [
  {n: 4775, desde: 0.3, dur: 75, texto: TEXTO_1},
  {n: 4778, desde: 0.6, dur: 150, texto: TEXTO_2},
  {n: 4779, desde: 1.4, dur: 75, texto: TEXTO_3},
];
const ARRANQUE_F = ARRANQUE.reduce((a, c) => a + c.dur, 0); // 300 = 5 compases

/** Placas con nombre y cargo de las autoridades */
const Placas: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const sale = tw(f, [dur - 8, dur], [0, 1], ease.in);
  const titulo = tw(f, [2, 12], [0, 1], ease.out);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1200, opacity: 1 - sale, transform: `translateY(${sale * -20}px)`}}>
      <div style={{display: 'inline-block', padding: '10px 26px', borderRadius: 30, background: NAVY, border: `3px solid ${AMARILLO}`, fontFamily: F.sans, fontWeight: 800, fontSize: 36, color: '#fff', opacity: titulo, transform: `translateY(${(1 - titulo) * 16}px)`}}>Nos acompañaron</div>
      {AUTORIDADES.map(([nombre, cargo], i) => {
        const k = tw(f, [10 + i * 12, 24 + i * 12], [0, 1], ease.out);
        return (
          <div key={nombre} style={{marginTop: 22, display: 'flex', borderRadius: 22, overflow: 'hidden', background: 'rgba(255,255,255,0.96)', boxShadow: '0 20px 50px rgba(0,0,0,0.35)', opacity: k, transform: `translateX(${(1 - k) * -120}px)`}}>
            <div style={{width: 14, background: AMARILLO}} />
            <div style={{padding: '20px 28px'}}>
              <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 50, lineHeight: 1.1, color: NAVY}}>{nombre}</div>
              <div style={{marginTop: 6, fontFamily: F.sans, fontWeight: 700, fontSize: 32, lineHeight: 1.2, color: '#5A6B80'}}>{cargo}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 3. Recorrido: comida y la visita de las autoridades (1 compás, cortes en el tiempo) + saludo (1 compás)
// ---------------------------------------------------------------------------
// comida: [clip, desde (s), cuadros]; los cuadros de cada parada suman un compás (60)
type Parada = {pais: string; comida: [number, number, number][]; saludo: [number, number]; cy?: number};
const PARADAS: Parada[] = [
  {pais: 'italia', comida: [[4788, 0.5, 30], [4818, 0.8, 30]], saludo: [4780, 1.6]},
  {pais: 'grecia', comida: [[4790, 0.3, 15], [4791, 0.3, 15], [4814, 0.8, 30]], saludo: [4781, 1.4]},
  {pais: 'francia', comida: [[4792, 0.5, 15], [4794, 0.5, 15], [4812, 0.8, 30]], saludo: [4782, 2.2]},
  {pais: 'eu', comida: [[4795, 0.5, 15], [4796, 0.5, 15], [4808, 0.8, 30]], saludo: [4783, 2.2]},
  {pais: 'espana', comida: [[4789, 0.5, 30], [4799, 0.6, 30]], saludo: [4784, 2.3]},
  {pais: 'mexico', comida: [[4802, 0.5, 15], [4804, 0.5, 15], [4825, 0.8, 30]], saludo: [4801, 2.8]},
  {pais: 'colombia', comida: [[4787, 0.8, 30], [4785, 1.0, 30]], saludo: [4807, 1.0]},
];
const PARADA_F = 2 * COMPAS;
const RECORRIDO_F = PARADAS.length * PARADA_F;
const ParadaEscena: React.FC<{p: Parada; i: number}> = ({p, i}) => {
  let t = 0;
  return (
    <AbsoluteFill>
      {p.comida.map(([n, d, cuadros]) => {
        const from = t;
        t += cuadros;
        return (
          <Sequence key={n} from={from} durationInFrames={cuadros}>
            <Clip n={n} desde={d} dur={cuadros} z0={1.0} z1={1.06} />
          </Sequence>
        );
      })}
      <Sequence from={COMPAS} durationInFrames={COMPAS}>
        <Clip n={p.saludo[0]} desde={p.saludo[1]} dur={COMPAS} z0={1.08} z1={1.0} cy={45} volumen={0.35} />
      </Sequence>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,20,40,0.55) 0%, rgba(8,20,40,0) 22%)'}} />
      <EtiquetaPais p={PAISES[p.pais]} i={i} dur={PARADA_F} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 4. Despedida: mosaico de saludos con el logo arriba
// ---------------------------------------------------------------------------
const MOSAICO_F = 195;
const MOSAICO: {pais: string; n: number; desde: number; dur: number; cy: number}[] = [
  {pais: 'italia', n: 4780, desde: 0.6, dur: 4.38, cy: 48},
  {pais: 'grecia', n: 4781, desde: 0.6, dur: 4.2, cy: 55},
  {pais: 'francia', n: 4782, desde: 1.0, dur: 5.29, cy: 52},
  {pais: 'eu', n: 4783, desde: 1.0, dur: 4.67, cy: 50},
  {pais: 'espana', n: 4784, desde: 1.0, dur: 5.08, cy: 50},
  {pais: 'mexico', n: 4801, desde: 1.5, dur: 5.54, cy: 50},
  {pais: 'colombia', n: 4807, desde: 0.3, dur: 4.79, cy: 55},
];
const CELDA_W = 516;
const CELDA_H = 366;
const MOS_TOP = 330;
const Mosaico: React.FC = () => {
  const f = useCurrentFrame();
  const logo = tw(f, [4, 20], [0, 1], ease.out);
  const negro = tw(f, [MOSAICO_F - 14, MOSAICO_F], [0, 1]);
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 30%, #17406F 0%, ${NAVY} 55%, #071729 100%)`}}>
      <Img src={LOGO} style={{position: 'absolute', left: W / 2 - 200, top: 70, width: 400, opacity: logo, transform: `translateY(${(1 - logo) * -30}px)`, filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.5))'}} />
      {MOSAICO.map((m, i) => {
        const col = i % 2;
        const fila = Math.floor(i / 2);
        const at = 6 + i * 4;
        const k = tw(f, [at, at + 14], [0, 1], ease.out);
        const x = 16 + col * (CELDA_W + 16);
        const y = MOS_TOP + fila * (CELDA_H + 16);
        const rate = Math.max(0.5, Math.min(1, ((m.dur - m.desde - 0.1) * 30) / MOSAICO_F));
        const p = PAISES[m.pais];
        return (
          <div key={m.n} style={{position: 'absolute', left: x, top: y, width: CELDA_W, height: CELDA_H, borderRadius: 22, overflow: 'hidden', border: '4px solid rgba(255,255,255,0.9)', boxShadow: '0 16px 40px rgba(0,0,0,0.45)', opacity: k, transform: `scale(${0.7 + 0.3 * k}) rotate(${(1 - k) * (col ? 6 : -6)}deg)`}}>
            <OffthreadVideo src={v(m.n)} startFrom={Math.round(m.desde * 30)} playbackRate={rate} muted style={{position: 'absolute', left: 0, width: CELDA_W, height: (CELDA_W * 16) / 9, top: -((CELDA_W * 16) / 9) * (m.cy / 100) + CELDA_H / 2}} />
            <div style={{position: 'absolute', left: 12, bottom: 12, display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px 6px 8px', borderRadius: 30, background: 'rgba(14,44,82,0.85)'}}>
              <div style={{borderRadius: 4, overflow: 'hidden', border: '2px solid #fff'}}>{p.bandera(42, 28)}</div>
              <span style={{fontFamily: F.sans, fontWeight: 800, fontSize: 22, color: '#fff', letterSpacing: 1}}>{p.nombre}</span>
            </div>
          </div>
        );
      })}
      {/* celda 8: el nombre de la experiencia */}
      {(() => {
        const k = tw(f, [40, 56], [0, 1], ease.out);
        return (
          <div style={{position: 'absolute', left: 16 + CELDA_W + 16, top: MOS_TOP + 3 * (CELDA_H + 16), width: CELDA_W, height: CELDA_H, borderRadius: 22, background: AMARILLO, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: k, transform: `scale(${0.7 + 0.3 * k})`, boxShadow: '0 16px 40px rgba(0,0,0,0.45)'}}>
            <div style={{fontFamily: F.display, fontSize: 64, lineHeight: 1, color: NAVY}}>EXPERIENCIA</div>
            <div style={{fontFamily: F.display, fontSize: 64, lineHeight: 1, color: NAVY}}>GASTRONÓMICA</div>
            <div style={{marginTop: 14, fontFamily: F.sans, fontWeight: 800, fontSize: 28, color: NAVY}}>Relaciones Internacionales</div>
          </div>
        );
      })()}
      <AbsoluteFill style={{background: '#000', opacity: negro}} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Composición
// ---------------------------------------------------------------------------
const T_ARRANQUE = GANCHO_F;
const T_RECORRIDO = T_ARRANQUE + ARRANQUE_F;
const T_MOSAICO = T_RECORRIDO + RECORRIDO_F;
export const GASTRO_FRAMES = T_MOSAICO + MOSAICO_F;

export const Gastronomica: React.FC<{music?: boolean}> = ({music = true}) => {
  let t = T_ARRANQUE;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence durationInFrames={GANCHO_F}>
        <Gancho />
      </Sequence>
      {ARRANQUE.map((a) => {
        const from = t;
        t += a.dur;
        return (
          <Sequence key={a.n} from={from} durationInFrames={a.dur}>
            <Clip n={a.n} desde={a.desde} dur={a.dur} z0={1.0} z1={1.07} />
            <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,20,40,0) 55%, rgba(8,20,40,0.6) 100%)'}} />
            {a.texto ? <Rotulo texto={a.texto} top={1430} dur={a.dur} /> : <Placas dur={a.dur} />}
          </Sequence>
        );
      })}
      {PARADAS.map((p, i) => (
        <Sequence key={p.pais} from={T_RECORRIDO + i * PARADA_F} durationInFrames={PARADA_F}>
          <ParadaEscena p={p} i={i} />
        </Sequence>
      ))}
      <Sequence from={T_MOSAICO} durationInFrames={MOSAICO_F}>
        <Mosaico />
      </Sequence>
      {/* cortinas con los colores de cada país al entrar a su parada, y una con los de Westhill al mosaico */}
      {PARADAS.map((p, i) => (
        <Sequence key={p.pais} from={T_RECORRIDO + i * PARADA_F - 14} durationInFrames={32}>
          <Cortina colores={PAISES[p.pais].colores} mitad={14} />
        </Sequence>
      ))}
      <Sequence from={T_MOSAICO - 14} durationInFrames={32}>
        <Cortina colores={[NAVY, AMARILLO, '#17406F']} mitad={14} />
      </Sequence>

      {/* efectos */}
      {[0, 30, 60, 90].map((k) => (
        <Sfx key={k} at={k} name="ref_swoosh_short" volume={0.22} />
      ))}
      <Sfx at={4} name="impact" volume={0.3} />
      <Sfx at={T_ARRANQUE} name="whoosh" volume={0.25} />
      {PARADAS.map((p, i) => (
        <React.Fragment key={p.pais}>
          <Sfx at={T_RECORRIDO + i * PARADA_F - 10} name="whoosh" volume={0.3} />
          <Sfx at={T_RECORRIDO + i * PARADA_F + 8} name="pop" volume={0.25} />
        </React.Fragment>
      ))}
      <Sfx at={T_MOSAICO - 10} name="whoosh_largo" volume={0.3} />
      {MOSAICO.map((m, i) => (
        <Sfx key={m.n} at={T_MOSAICO + 6 + i * 4} name="pop" volume={0.14} />
      ))}
      <Sfx at={T_MOSAICO + 2 * COMPAS} name="impact" volume={0.35} />
      {music && <Audio src={staticFile('gastro/fiesta.wav')} volume={(fr) => interpolate(fr, [0, 6, GASTRO_FRAMES - 30, GASTRO_FRAMES], [0, 0.55, 0.55, 0], clamp)} />}
    </AbsoluteFill>
  );
};
