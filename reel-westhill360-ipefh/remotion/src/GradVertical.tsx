import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from './components';
import {Sfx} from './shots';
import {F, ease, tw} from './theme';
import {DUR} from './grad2Info';
import {CierreVertical} from './gradCierreVertical';

// ---------------------------------------------------------------------------
// Reel vertical (1080x1920) de la graduación de la Generación 2026 (Arquitectura y Diseño del Espacio, Negocios,
// Psicología y Ciencias de la Educación y posgrados), con "Desire (Gryffin Remix)" de Years & Years (122 BPM).
// Sigue el formato del reel de Medicina del cliente (cajas de texto azul con sombra verde, pestaña UW arriba a la
// derecha, destellos de luz) pero todo cortado al ritmo, con down bass en cada cambio de sección y el drop en el
// lanzamiento de birretes. Cierra con la pirotecnia y el logo hecho de chispas del video de graduación (vertical).
//
// Línea de tiempo (tiempos de la canción, b(n) = 0.304 + 0.4918 n segundos):
//   b0–b32     intro: todos saludando a la cámara (la canción aún sin bajo)
//   b32–b64    camino al auditorio, presídium y discursos (la canción va creciendo)
//   b64–b128   entrega de diplomas (entra el bajo)
//   b128–b152  toma de protesta
//   b152–b160  subida: "¡LO LOGRARON!"
//   b160–b224  DROP: birretes, festejo, abrazos, familias, vestíbulo y fotos en la W
//   b224–      cierre con pirotecnia; la canción salta de b224 a b480 (fin del segundo drop) sin que se note
// ---------------------------------------------------------------------------
const W = 1080;
const H = 1920;
const FPS = 30;
const P = 0.4918;
const PH = 0.304;
const b = (n: number) => PH + n * P;
const fb = (n: number) => Math.round(b(n) * FPS);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const hh = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const c01 = (x: number) => Math.max(0, Math.min(1, x));

const CIERRE_BEAT = 224;
const SALTO_BEAT = 480;
const CIERRE_DESDE = fb(CIERRE_BEAT);
const FIN_CANCION = 264.5;
const CIERRE_F = Math.round((FIN_CANCION - b(SALTO_BEAT)) * FPS);
export const GRADV_FRAMES = CIERRE_DESDE + CIERRE_F;
export const GRADV_W = W;
export const GRADV_H = H;

const AZUL = '#265F92';
const VERDE = '#27AB5D';
const BANDERIN = staticFile('logos/banderin_uw.png');
const vid = (n: string) => staticFile(`proxies/grad2/${n}.mp4`);
const fot = (n: string) => staticFile(`grad2/${n}.jpg`);

// ---------------------------------------------------------------------------
// Tomas
// ---------------------------------------------------------------------------
type Entrada = 'corte' | 'flash' | 'zoom' | 'whip' | 'whipX' | 'luz' | 'foto';
type Toma = {
  n: number; // tiempo de la canción en que entra
  beats: number;
  src: string; // 'v:<video>' o 'f:<foto>'
  desde?: number;
  rate?: number;
  entra?: Entrada;
  foco?: string; // object-position
  zoom?: [number, number];
  bn?: boolean;
};
const SOLAPA = 8; // cuadros que cada toma sigue debajo de la siguiente (para barridos y fundidos)

const SAL = 'v:fila_saludos_1118_2';
const TOMAS: Toma[] = [
  // intro: todos saludando (el clip trae tres planos: 0–4.67, 4.67–9.93 y 9.93–14.2 s)
  {n: 0, beats: 8, src: SAL, desde: 0.0, rate: 0.6, entra: 'corte', zoom: [1.12, 1.0]},
  {n: 8, beats: 4, src: SAL, desde: 2.4, rate: 1.15, entra: 'zoom'},
  {n: 12, beats: 2, src: SAL, desde: 4.75, entra: 'whip'},
  {n: 14, beats: 2, src: SAL, desde: 5.8, entra: 'whipX'},
  {n: 16, beats: 4, src: SAL, desde: 6.9, rate: 0.75, entra: 'zoom', zoom: [1.0, 1.1]},
  {n: 20, beats: 2, src: SAL, desde: 8.45, rate: 1.3, entra: 'whip'},
  {n: 22, beats: 4, src: SAL, desde: 10.0, entra: 'whipX'},
  {n: 26, beats: 2, src: SAL, desde: 12.0, entra: 'zoom'},
  {n: 28, beats: 4, src: SAL, desde: 13.0, rate: 0.55, entra: 'flash', zoom: [1.0, 1.12]},
  // camino al auditorio, presídium y discursos
  {n: 32, beats: 4, src: 'f:IMG_4209', entra: 'luz', bn: true, zoom: [1.12, 1.0], foco: '50% 40%'},
  {n: 36, beats: 4, src: 'v:IMG_4203', desde: 0.6, entra: 'whip'},
  {n: 40, beats: 4, src: 'v:IMG_4271', desde: 0.4, entra: 'zoom'},
  {n: 44, beats: 4, src: 'v:IMG_4249', desde: 0.6, entra: 'whipX'},
  {n: 48, beats: 4, src: 'v:IMG_4323', desde: 0.3, entra: 'whip'},
  {n: 52, beats: 4, src: 'v:IMG_4324', desde: 2.0, entra: 'zoom'},
  {n: 56, beats: 4, src: 'v:IMG_4325', desde: 1.5, entra: 'whip'},
  {n: 60, beats: 4, src: 'f:IMG_4223', entra: 'foto', foco: '50% 45%', zoom: [1.12, 1.0]},
  // entrega de diplomas
  {n: 64, beats: 4, src: 'v:IMG_4268', desde: 2.4, entra: 'flash'},
  {n: 68, beats: 4, src: 'v:IMG_4266', desde: 3.3, entra: 'whip'},
  {n: 72, beats: 4, src: 'f:IMG_4229', entra: 'foto', foco: '45% 40%'},
  {n: 76, beats: 4, src: 'v:IMG_4252', desde: 4.2, entra: 'zoom'},
  {n: 80, beats: 4, src: 'v:regina_psicologia', desde: 7.0, entra: 'whip'},
  {n: 84, beats: 4, src: 'v:IMG_4254', desde: 2.6, entra: 'whip'},
  {n: 88, beats: 4, src: 'f:IMG_4240', entra: 'foto', foco: '35% 40%'},
  {n: 92, beats: 4, src: 'v:IMG_4248', desde: 1.6, entra: 'zoom'},
  {n: 96, beats: 2, src: 'f:diploma_pedagogia_k2', entra: 'flash', foco: '50% 40%'},
  {n: 98, beats: 2, src: 'v:IMG_4277', desde: 0.2, entra: 'whip'},
  {n: 100, beats: 2, src: 'f:IMG_4233', entra: 'foto', foco: '50% 35%'},
  {n: 102, beats: 2, src: 'v:IMG_4251', desde: 2.3, entra: 'whipX'},
  {n: 104, beats: 2, src: 'f:IMG_4245', entra: 'foto', foco: '55% 40%'},
  {n: 106, beats: 2, src: 'v:IMG_4269', desde: 2.2, entra: 'zoom'},
  {n: 108, beats: 2, src: 'f:IMG_4246', entra: 'foto', foco: '50% 35%'},
  {n: 110, beats: 2, src: 'v:IMG_4267', desde: 4.6, entra: 'whip'},
  {n: 112, beats: 2, src: 'f:diploma_estola_azul', entra: 'foto', foco: '50% 45%'},
  {n: 114, beats: 2, src: 'v:IMG_4255', desde: 1.6, entra: 'whipX'},
  {n: 116, beats: 2, src: 'f:IMG_4242', entra: 'foto', foco: '50% 35%'},
  {n: 118, beats: 2, src: 'v:IMG_4265', desde: 2.6, entra: 'zoom'},
  {n: 120, beats: 2, src: 'f:IMG_4258', entra: 'foto', foco: '50% 35%'},
  {n: 122, beats: 2, src: 'v:IMG_4261', desde: 2.6, entra: 'whip'},
  {n: 124, beats: 2, src: 'f:IMG_4239', entra: 'foto', foco: '50% 35%'},
  {n: 126, beats: 2, src: 'v:IMG_4253', desde: 1.0, entra: 'whipX'},
  // toma de protesta
  {n: 128, beats: 8, src: 'v:IMG_4328', desde: 0.4, entra: 'flash', zoom: [1.0, 1.06]},
  {n: 136, beats: 8, src: 'v:IMG_4329', desde: 0.6, entra: 'luz', zoom: [1.0, 1.06]},
  {n: 144, beats: 8, src: 'v:IMG_4330', desde: 0.3, entra: 'luz', zoom: [1.0, 1.06]},
  // subida al drop: el auditorio de pie, cada vez más oscuro, con "¡LO LOGRARON!"
  {n: 152, beats: 8, src: 'f:IMG_4327', entra: 'corte', zoom: [1.0, 1.22], foco: '50% 50%'},
  // DROP
  {n: 160, beats: 4, src: 'f:birretes', entra: 'flash', zoom: [1.18, 1.0], foco: '50% 45%'},
  {n: 164, beats: 4, src: 'v:IMG_4341', desde: 1.0, entra: 'zoom'},
  {n: 168, beats: 4, src: 'v:IMG_4342', desde: 2.2, entra: 'whip'},
  {n: 172, beats: 2, src: 'f:IMG_4338', entra: 'foto', foco: '50% 60%'},
  {n: 174, beats: 2, src: 'v:IMG_4347', desde: 0.6, entra: 'zoom'},
  {n: 176, beats: 4, src: 'v:IMG_4343', desde: 0.4, entra: 'whip'},
  {n: 180, beats: 4, src: 'v:IMG_4256', desde: 3.2, entra: 'zoom'},
  {n: 184, beats: 2, src: 'v:IMG_4357', desde: 0.9, entra: 'whipX'},
  {n: 186, beats: 2, src: 'v:IMG_4350', desde: 0.3, entra: 'zoom'},
  {n: 188, beats: 2, src: 'v:IMG_4291', desde: 0.6, entra: 'whip'},
  {n: 190, beats: 2, src: 'v:IMG_4352', desde: 1.0, entra: 'zoom'},
  {n: 192, beats: 4, src: 'v:IMG_4361', desde: 0.4, entra: 'flash'},
  {n: 196, beats: 2, src: 'v:IMG_4365', desde: 0.2, entra: 'whip'},
  {n: 198, beats: 2, src: 'v:IMG_4208', desde: 0.2, entra: 'zoom', foco: '50% 40%'},
  {n: 200, beats: 2, src: 'f:IMG_4198', entra: 'foto', foco: '50% 62%', zoom: [1.35, 1.25]},
  {n: 202, beats: 2, src: 'v:IMG_4368', desde: 0.4, entra: 'whipX'},
  {n: 204, beats: 2, src: 'v:IMG_4202', desde: 1.4, entra: 'zoom'},
  {n: 206, beats: 2, src: 'f:IMG_4201', entra: 'foto', foco: '50% 50%'},
  {n: 208, beats: 2, src: 'v:IMG_4371', desde: 2.0, entra: 'whip'},
  {n: 210, beats: 2, src: 'v:IMG_4363', desde: 0.2, entra: 'zoom'},
  {n: 212, beats: 2, src: 'v:IMG_4358', desde: 0.6, entra: 'whipX'},
  {n: 214, beats: 2, src: 'v:IMG_4360', desde: 0.3, entra: 'zoom'},
  {n: 216, beats: 2, src: 'f:IMG_4193', entra: 'foto', foco: '50% 50%'},
  {n: 218, beats: 2, src: 'v:IMG_4344', desde: 1.2, entra: 'whip'},
  {n: 220, beats: 4, src: 'v:IMG_4364', desde: 0.5, entra: 'zoom'},
];

/** fotos horizontales: se muestran completas sobre una copia desenfocada (no caben en vertical) */
const HORIZONTALES = new Set(['IMG_4201', 'IMG_4193', 'IMG_4208']);

/** ajusta inicio y velocidad para que el tramo quepa en la toma */
const ajusta = (src: string, desde: number, seg: number, rate: number) => {
  const dur = DUR[src] ?? 0;
  let r = rate;
  let d = desde;
  const necesita = seg * r;
  if (necesita > dur - 0.08) {
    r = (dur - 0.08) / seg;
    d = 0;
  } else if (d + necesita > dur - 0.08) {
    d = Math.max(0, dur - 0.08 - necesita);
  }
  return {desde: d, rate: r};
};

const Medio: React.FC<{src: string; dur: number; desde: number; rate: number; foco: string; filtro: string}> = ({src, dur, desde, rate, foco, filtro}) => {
  const [tipo, n] = src.split(':');
  const esVideo = tipo === 'v';
  const {desde: d, rate: r} = esVideo ? ajusta(n, desde, dur / FPS, rate) : {desde: 0, rate: 1};
  const estilo: React.CSSProperties = {position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: foco, filter: filtro};
  const medio = (extra: React.CSSProperties) =>
    esVideo ? <OffthreadVideo src={vid(n)} startFrom={Math.round(d * FPS)} playbackRate={r} muted style={{...estilo, ...extra}} /> : <Img src={fot(n)} style={{...estilo, ...extra}} />;
  if (!HORIZONTALES.has(n)) return medio({});
  // horizontal: fondo desenfocado y la imagen completa al centro con un marco fino
  return (
    <AbsoluteFill>
      {medio({filter: `${filtro} blur(38px) brightness(0.55)`, transform: 'scale(1.2)'})}
      <div style={{position: 'absolute', left: 36, right: 36, top: '50%', transform: 'translateY(-50%)', aspectRatio: '16 / 9', boxShadow: '0 30px 80px rgba(0,0,0,0.55)', outline: '3px solid rgba(255,255,255,0.85)', overflow: 'hidden'}}>
        {medio({objectFit: 'cover', objectPosition: '50% 50%'})}
      </div>
    </AbsoluteFill>
  );
};

const Plano: React.FC<{t: Toma; dur: number}> = ({t, dur}) => {
  const f = useCurrentFrame();
  const entra = t.entra ?? 'corte';
  const [z0, z1] = t.zoom ?? (t.src.startsWith('f:') ? [1.0, 1.1] : [1.0, 1.05]);
  let escala = interpolate(f, [0, dur], [z0, z1], clamp);
  let x = 0;
  let y = 0;
  let blur = 0;
  let op = 1;
  if (entra === 'zoom') {
    const p = tw(f, [0, 9], [0, 1], ease.out);
    escala *= 1.28 - 0.28 * p;
    blur = 14 * (1 - p);
    op = c01(f / 3);
  } else if (entra === 'whip') {
    const p = tw(f, [0, 7], [0, 1], ease.out);
    y = (1 - p) * H;
    blur = 18 * (1 - p);
  } else if (entra === 'whipX') {
    const p = tw(f, [0, 7], [0, 1], ease.out);
    x = (1 - p) * W;
    blur = 18 * (1 - p);
  } else if (entra === 'luz') {
    op = tw(f, [0, 10], [0, 1]);
  } else if (entra === 'flash') {
    escala *= 1.07 - 0.07 * tw(f, [0, 10], [0, 1], ease.out);
  }
  const filtro = t.bn ? 'grayscale(1) contrast(1.18) brightness(1.04)' : 'contrast(1.07) saturate(1.1) brightness(1.02)';
  const flash = entra === 'flash' ? interpolate(f, [0, 1, 9], [1, 0.9, 0], clamp) : entra === 'foto' ? interpolate(f, [0, 1, 6], [0.75, 0.6, 0], clamp) : 0;
  return (
    <AbsoluteFill style={{opacity: op}}>
      <AbsoluteFill style={{transform: `translate(${x}px, ${y}px) scale(${escala})`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined, overflow: 'hidden', background: '#000'}}>
        <Medio src={t.src} dur={dur} desde={t.desde ?? 0} rate={t.rate ?? 1} foco={t.foco ?? '50% 40%'} filtro={filtro} />
      </AbsoluteFill>
      {flash > 0 && <AbsoluteFill style={{background: '#FFFDF6', opacity: flash}} />}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Tarjetas de texto (la idea del reel de Medicina, mejorada, con los mismos colores): una franja verde crece en el
// borde, el panel azul se despliega desde la izquierda con su capa verde desfasada detrás, las palabras suben
// una por una y las palabras clave (**así**) se subrayan con un marcador verde. Al salir, el texto sube y las
// capas se recogen hacia la izquierda, la verde al último.
// ---------------------------------------------------------------------------
type Texto = {a: number; z: number; lineas: string[]; top?: number};
const TEXTOS: Texto[] = [
  {a: 4, z: 28, lineas: ['Hoy se graduó la', '**Generación del cambio.**']},
  {a: 33, z: 46, lineas: ['El último camino como **estudiantes.**', 'El primero como **profesionistas.**']},
  {a: 49, z: 62, lineas: ['Frente a sus **familias**, cerraron', 'un capítulo que les tomó', 'años escribir.']},
  {a: 65, z: 79, lineas: ['Años de **esfuerzo**, **desvelos**', 'y **sacrificio**…']},
  {a: 97, z: 111, lineas: ['…que hoy tienen nombre,', 'apellido y **diploma.**']},
  {a: 129, z: 150, lineas: ['Hoy se comprometieron a poner', 'su talento al **servicio**', '**de los demás.**']},
  {a: 177, z: 190, lineas: ['Detrás de cada logro, una', '**familia** que nunca dejó de creer.']},
  {a: 205, z: 219, lineas: ['Con orgullo,', '**Universidad Westhill.**']},
];
/** separa una línea en palabras, marcando las que van entre ** ** */
const palabras = (l: string) => {
  const r: {w: string; clave: boolean; suf: string}[] = [];
  l.split(/(\*\*[^*]+\*\*)/).forEach((trozo) => {
    const clave = trozo.startsWith('**');
    trozo
      .replace(/\*\*/g, '')
      .split(' ')
      .forEach((w, i) => {
        if (!w) return;
        // puntuación pegada a la palabra clave anterior (", " o "…"): va junto, sin marcador
        if (i === 0 && !clave && /^[,.;:…!?]+$/.test(w) && r.length) r[r.length - 1].suf += w;
        else if (i === 0 && !clave && /^[,.;:…!?]/.test(w) && r.length) {
          const m = w.match(/^[,.;:…!?]+/)![0];
          r[r.length - 1].suf += m;
          r.push({w: w.slice(m.length), clave, suf: ''});
        } else r.push({w, clave, suf: ''});
      });
  });
  return r;
};
const Caja: React.FC<{tx: Texto; dur: number}> = ({tx, dur}) => {
  const f = useCurrentFrame();
  const top = tx.top ?? 330;
  // entrada
  const franja = tw(f, [0, 8], [0, 1], ease.out);
  const verde = tw(f, [3, 16], [0, 1], ease.out);
  const azul = tw(f, [0, 11], [0, 1], ease.out);
  const brillo = interpolate(f, [12, 34], [-0.3, 1.3], clamp);
  // salida
  const sAzul = tw(f, [dur - 11, dur - 2], [0, 1], ease.in);
  const sVerde = tw(f, [dur - 7, dur], [0, 1], ease.in);
  const abreAzul = azul * (1 - sAzul);
  const abreVerde = verde * (1 - sVerde);
  let k = 0;
  return (
    <div style={{position: 'absolute', left: 0, top}}>
      {/* capa verde desfasada */}
      <div style={{position: 'absolute', left: 0, top: 18, right: -22, bottom: -18, background: `linear-gradient(135deg, #2FC06C 0%, ${VERDE} 60%, #1F8F4C 100%)`, borderRadius: '0 44px 44px 0', clipPath: `inset(0 ${(1 - abreVerde) * 100}% 0 0 round 0 44px 44px 0)`}} />
      {/* panel azul */}
      <div style={{position: 'relative', borderRadius: '0 44px 44px 0', overflow: 'hidden', clipPath: `inset(0 ${(1 - abreAzul) * 100}% 0 0 round 0 44px 44px 0)`, boxShadow: '0 14px 34px rgba(0,0,0,0.28)'}}>
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(135deg, #2F72AC 0%, ${AZUL} 52%, #1D4C78 100%)`}} />
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0) 42%)'}} />
        {/* destello que cruza el panel al abrirse */}
        <div style={{position: 'absolute', top: 0, bottom: 0, left: `${brillo * 100}%`, width: 160, transform: 'translateX(-50%) skewX(-18deg)', background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0) 100%)'}} />
        <div style={{position: 'relative', padding: '26px 56px 30px 46px'}}>
          {tx.lineas.map((l, i) => (
            <div key={i} style={{whiteSpace: 'nowrap', lineHeight: 1.3}}>
              {palabras(l).map(({w, clave, suf}, j) => {
                const at = 1 + 1.1 * k++;
                const p = tw(f, [at, at + 8], [0, 1], ease.out);
                const marca = clave ? tw(f, [at + 6, at + 16], [0, 1], ease.out) : 0;
                return (
                  <span key={j} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', padding: '2px 0 6px', marginRight: 12}}>
                    <span style={{position: 'relative', display: 'inline-block', fontFamily: F.sans, fontWeight: clave ? 800 : 700, fontSize: 44, color: '#fff', transform: `translateY(${(1 - p) * 105}%)`, opacity: Math.min(1, p * 2)}}>
                      {clave && <span style={{position: 'absolute', left: -4, right: suf ? `${0.3 * suf.length + 0.1}em` : -4, bottom: 4, height: '0.34em', background: VERDE, borderRadius: 3, transformOrigin: '0 50%', transform: `scaleX(${marca})`, opacity: 0.95}} />}
                      <span style={{position: 'relative'}}>{w}</span>
                      {suf && <span style={{position: 'relative', fontWeight: 700}}>{suf}</span>}
                    </span>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* franja verde del borde */}
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 12, background: VERDE, transformOrigin: '50% 0', transform: `scaleY(${franja * (1 - sAzul)})`}} />
    </div>
  );
};

/** Pestaña UW de arriba a la derecha (como en el reel de Medicina) */
const Banderin: React.FC<{hasta: number}> = ({hasta}) => {
  const f = useCurrentFrame();
  const op = tw(f, [6, 18], [0, 1]) * (1 - tw(f, [hasta - 12, hasta], [0, 1]));
  const baja = tw(f, [6, 22], [0, 1], ease.out);
  return <Img src={BANDERIN} style={{position: 'absolute', right: 58, top: -8 - (1 - baja) * 200, width: 176, opacity: op, filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.25))'}} />;
};

// ---------------------------------------------------------------------------
// Subida al drop: "¡LO LOGRARON!" palabra por palabra en los tiempos de la subida
// ---------------------------------------------------------------------------
const Lograron: React.FC = () => {
  const f = useCurrentFrame();
  const t0 = fb(156) - fb(152);
  const t1 = fb(158) - fb(152);
  const oscuro = interpolate(f, [0, t0, fb(160) - fb(152)], [0.15, 0.5, 0.72], clamp);
  const palabra = (at: number) => {
    const p = tw(f, [at, at + 8], [0, 1], ease.out);
    return {opacity: p, transform: `scale(${1.35 - 0.35 * p})`, filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined};
  };
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: '#000', opacity: oscuro}} />
      <div style={{position: 'absolute', top: 700, width: '100%', textAlign: 'center', fontFamily: F.sans, fontWeight: 900, color: '#fff', lineHeight: 0.98, textShadow: '0 0 40px rgba(255,214,150,0.55), 0 6px 30px rgba(0,0,0,0.6)'}}>
        <div style={{fontSize: 190, ...palabra(t0)}}>¡LO</div>
        <div style={{fontSize: 150, letterSpacing: -2, ...palabra(t1)}}>LOGRARON!</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Efectos de pantalla: destello de luz cálida (light leak) y confeti del drop
// ---------------------------------------------------------------------------
const Luz: React.FC<{dur?: number}> = ({dur = 24}) => {
  const f = useCurrentFrame();
  const p = f / dur;
  const op = Math.sin(c01(p) * Math.PI);
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', opacity: op * 0.9, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: -600 + p * 1300, top: -300, width: 1500, height: 2600, transform: 'rotate(18deg)', background: 'radial-gradient(ellipse at 50% 50%, rgba(255,170,70,0.95) 0%, rgba(255,110,40,0.55) 35%, rgba(255,90,30,0) 70%)'}} />
      <div style={{position: 'absolute', left: 500 - p * 600, top: 600, width: 900, height: 1200, background: 'radial-gradient(ellipse at 50% 50%, rgba(255,230,170,0.8) 0%, rgba(255,200,120,0) 65%)'}} />
    </AbsoluteFill>
  );
};

const CONFETI = Array.from({length: 220}, (_, i) => ({
  x: hh(i * 1.7) * W,
  y0: -80 - hh(i * 3.1) * 900,
  v: 7 + hh(i * 5.3) * 9,
  osc: 20 + hh(i * 2.9) * 50,
  w: 12 + hh(i * 7.7) * 14,
  h: 6 + hh(i * 4.4) * 8,
  giro: hh(i * 9.1) * 12,
  col: ['#F6E3B0', '#D9B76A', '#FFFFFF', '#3D8BD9', '#27AB5D', '#C92A5B'][i % 6],
}));
const Confeti: React.FC = () => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    for (const c of CONFETI) {
      const y = c.y0 + f * c.v;
      if (y > H + 40) continue;
      const x = c.x + Math.sin(f / 9 + c.giro) * c.osc;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(f * 0.12 + c.giro);
      ctx.scale(1, Math.cos(f * 0.21 + c.giro));
      ctx.globalAlpha = 0.95 * (1 - c01((f - 75) / 30));
      ctx.fillStyle = c.col;
      ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
      ctx.restore();
    }
  }, [f]);
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />;
};

// ---------------------------------------------------------------------------
// Sonido: down bass en cada cambio de sección, golpe en el drop, cámara en cada foto, barridos en cada transición
// ---------------------------------------------------------------------------
const SECCIONES = [64, 96, 128, 192];
const sonidos = (): [number, string, number][] => {
  const r: [number, string, number][] = [];
  r.push([fb(32) - 10, 'whoosh_largo', 0.35]);
  SECCIONES.forEach((n) => {
    r.push([fb(n), 'down_bass', n === 96 ? 0.65 : 0.9]);
    r.push([fb(n), 'impact', 0.22]);
  });
  // subida y drop
  r.push([fb(152), 'ref_charge_swoosh', 0.35]);
  r.push([fb(156), 'impact', 0.32]);
  r.push([fb(158), 'impact', 0.42]);
  r.push([fb(160) - 48, 'riser', 0.55]);
  r.push([fb(160), 'down_bass', 1.0]);
  r.push([fb(160), 'impact', 0.6]);
  r.push([fb(160), 'fw_boom', 0.22]);
  // al cierre
  r.push([fb(CIERRE_BEAT) - 12, 'whoosh_largo', 0.4]);
  r.push([fb(CIERRE_BEAT), 'down_bass', 0.95]);
  TOMAS.forEach((t) => {
    const at = fb(t.n);
    if (t.entra === 'foto') r.push([at, 'ref_shutter', 0.32]);
    if (t.entra === 'whip' || t.entra === 'whipX') r.push([at - 2, 'ref_swoosh_short', 0.3]);
    if (t.entra === 'zoom') r.push([at - 3, 'whoosh', 0.18]);
    if (t.entra === 'luz') r.push([at - 4, 'whoosh_largo', 0.22]);
  });
  return r;
};

export const GradVertical: React.FC = () => {
  const salto = Math.round(b(SALTO_BEAT) * FPS);
  const volumen = (fr: number) => interpolate(fr, [0, 6], [0, 0.88], clamp);
  const volumen2 = (fr: number) => interpolate(fr, [0, 2, CIERRE_F - 50, CIERRE_F], [0.6, 0.88, 0.88, 0], clamp);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {TOMAS.map((t, i) => {
        const from = fb(t.n);
        const sig = TOMAS[i + 1];
        const hasta = fb(t.n + t.beats);
        const dur = hasta - from + (sig && fb(sig.n) === hasta ? SOLAPA : 0);
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <Plano t={t} dur={dur} />
          </Sequence>
        );
      })}
      <Sequence durationInFrames={14}>
        <Entrada />
      </Sequence>
      <Sequence from={fb(152)} durationInFrames={fb(160) - fb(152)}>
        <Lograron />
      </Sequence>
      <Sequence from={fb(160)} durationInFrames={110}>
        <Confeti />
      </Sequence>
      {[32, 136, 144].map((n) => (
        <Sequence key={n} from={fb(n) - 10} durationInFrames={26}>
          <Luz dur={26} />
        </Sequence>
      ))}
      {/* viñeta y textos */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)', pointerEvents: 'none'}} />
      {TEXTOS.map((tx, i) => {
        const from = fb(tx.a);
        const dur = fb(tx.z) - from;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <Caja tx={tx} dur={dur} />
          </Sequence>
        );
      })}
      <Sequence durationInFrames={CIERRE_DESDE}>
        <Banderin hasta={CIERRE_DESDE} />
      </Sequence>
      {/* cierre con pirotecnia; entra con un destello */}
      <Sequence from={CIERRE_DESDE} durationInFrames={CIERRE_F}>
        <CierreVertical cfg={{beatF: P * FPS, dur: CIERRE_F, explotaBeat: 32, fotos: ['grad2/IMG_4229.jpg', 'grad2/IMG_4240.jpg', 'grad2/diploma_psicologia.jpg', 'grad2/IMG_4245.jpg', 'grad2/IMG_4233.jpg', 'grad2/diploma_pedagogia_k2.jpg', 'grad2/IMG_4246.jpg', 'grad2/IMG_4258.jpg', 'grad2/IMG_4242.jpg', 'grad2/diploma_estola_azul.jpg', 'grad2/IMG_4239.jpg', 'grad2/IMG_4263.jpg', 'grad2/birretes.jpg', 'grad2/IMG_4338.jpg', 'grad2/IMG_4198.jpg']}} />
      </Sequence>
      <Sequence from={CIERRE_DESDE} durationInFrames={14}>
        <Destellazo />
      </Sequence>
      <Grain opacity={0.03} />
      {sonidos().map(([at, name, vol], i) => (
        <Sfx key={i} at={at} name={name} volume={vol} />
      ))}
      <Sequence durationInFrames={CIERRE_DESDE + 2}>
        <Audio src={staticFile('music/desire_gryffin.mp3')} volume={volumen} />
      </Sequence>
      <Sequence from={CIERRE_DESDE} durationInFrames={CIERRE_F}>
        <Audio src={staticFile('music/desire_gryffin.mp3')} startFrom={salto} volume={volumen2} />
      </Sequence>
    </AbsoluteFill>
  );
};

/** entrada del video desde negro */
const Entrada: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: '#000', opacity: interpolate(f, [0, 12], [1, 0], clamp)}} />;
};

/** destello blanco-dorado con el que entra el cierre */
const Destellazo: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #FFFDF4 0%, #FFE6B0 60%, #F2C77A 100%)', opacity: interpolate(f, [0, 1, 14], [1, 0.95, 0], clamp)}} />;
};
