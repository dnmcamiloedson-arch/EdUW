import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Sfx} from './shots';
import {F, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// "Westhill en Google" (9:16, ~20 s), armado sobre dos grabaciones de pantalla reales del cliente
// (public/proxies/grabacion/intro.mp4 y notas.mp4, 1080x2348 a 30 fps; originales en media/grabacion/fuente).
//  1. Gancho + escritura: "¿Qué sale si buscas WESTHILL en Google?" y una lupa sobre el campo (teclado completo
//     abajo; la pantalla de navegación privada queda tapada).
//  2. Carga: la página acelerada y desenfocada con barra de progreso.
//  3. #1: nuestra noticia (uw.edu.mx) es el primer resultado.
//  4. La visión general por IA: "la primera universidad privada" resaltado ("Hasta Google lo reconoce").
//  5. Scroll a Excélsior y su vista previa: titular resaltado ("Lo publicó Excélsior").
//  6. Cada nota: vista previa y luego se "abre" a pantalla completa con la página real (Excélsior → La Crónica →
//     MVS), y al final Reforma entra con un zoom (sin etiqueta: basta su logo). Fondo: la develación de la placa.
//  7. Collage: la última nota se encoge y las demás llegan a acomodarse ("Todos hablan de WESTHILL").
//  8. CTA: el collage se va atrás y entra una hoja de periódico genérica: "El próximo titular puede ser el tuyo."
//     + Solicita información.
// Todas las coordenadas (x, y) son de la grabación (1080x2348).
// ---------------------------------------------------------------------------
const W = 1080;
const H = 1920;
const SH = 2348;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const NAVY = '#0E2C52';
const NAVY2 = '#0A2141';
const AMARILLO = '#F2C94C';
const INTRO = staticFile('proxies/grabacion/intro.mp4');
const NOTAS = staticFile('proxies/grabacion/notas.mp4');
const LOGO = staticFile('logos/logo_westhill_blanco_total.png');

// --- línea de tiempo (cuadros del video) y tramos de la fuente (s) ---
const S_ESCRIBE = 1.55;
const S_CARGA = 4.4;
const S_PAGINA = 7.0;
const ESCRIBE_F = Math.round((S_CARGA - S_ESCRIBE) * 30); // 86
const CARGA_F = 28;
const PRIMERO_F = 54;
const IA_F = 84;
const SCROLL_F = 28;
const EXC_F = 114;
const CRON_F = 102;
const MVS_F = 93;
const REF_F = 64;
const COLLAGE_F = 96;
const CTA_F = 126;
const SOLAPE = 6; // las tarjetas de las notas se enciman para que el paso de una a otra sea continuo
const T = (() => {
  let t = 0;
  const r: Record<string, number> = {};
  for (const [k, d] of [['escribe', ESCRIBE_F], ['carga', CARGA_F], ['primero', PRIMERO_F], ['ia', IA_F], ['scroll', SCROLL_F], ['exc', EXC_F], ['cron', CRON_F], ['mvs', MVS_F], ['ref', REF_F], ['collage', COLLAGE_F], ['cta', CTA_F]] as [string, number][]) {
    r[k] = t;
    t += d;
  }
  r.fin = t;
  return r;
})();
export const BUSQUEDA_FRAMES = T.fin;

const TECLAS = [1.67, 1.78, 1.9, 2.07, 2.2, 2.3, 2.5, 2.63, 2.82, 2.98, 3.15, 3.27, 3.37, 3.55, 3.65, 3.85, 4.03, 4.15, 4.3];

type Rect = {x0: number; y0: number; x1: number; y1: number};

/** La grabación colocada en el cuadro: `top` es la fila de la fuente que queda arriba; zoom alrededor de (540, cy) */
const Grabacion: React.FC<{src: string; desde: number; rate?: number; top: number; z?: number; cy?: number; blur?: number}> = ({src, desde, rate = 1, top, z = 1, cy = 960, blur = 0}) => (
  <div style={{position: 'absolute', left: 0, top: -top, width: W, height: SH, transform: `scale(${z})`, transformOrigin: `540px ${cy + top}px`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined}}>
    <OffthreadVideo src={src} startFrom={Math.round(desde * 30)} playbackRate={rate} muted style={{width: W, height: SH}} />
  </div>
);

/** Etiqueta azul marino con borde amarillo (las palabras entre * van en amarillo) */
const Etiqueta: React.FC<{texto: string; top: number; at?: number; size?: number}> = ({texto, top, at = 6, size = 58}) => {
  const f = useCurrentFrame();
  const p = tw(f, [at, at + 12], [0, 1], ease.out);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center', opacity: p, transform: `translateY(${(1 - p) * -30}px) scale(${0.9 + 0.1 * p})`}}>
      <div style={{padding: '22px 42px', borderRadius: 26, background: NAVY, borderBottom: `6px solid ${AMARILLO}`, boxShadow: '0 20px 50px rgba(0,0,0,0.55)', fontFamily: F.sans, fontWeight: 900, fontSize: size, color: '#fff', textAlign: 'center', lineHeight: 1.1}}>
        {texto.split(' ').map((w, i) => (
          <span key={i} style={{color: w.startsWith('*') ? AMARILLO : undefined}}>
            {w.replace('*', '')}{' '}
          </span>
        ))}
      </div>
    </div>
  );
};

/** Reflector: oscurece todo menos el rectángulo (en coordenadas del cuadro) */
const Reflector: React.FC<{x: number; y: number; w: number; h: number; p: number}> = ({x, y, w, h, p}) => {
  const f = useCurrentFrame();
  const pulso = 0.6 + 0.4 * Math.sin(f / 6);
  return <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 26, boxShadow: `0 0 0 3000px rgba(0,0,0,${0.62 * p})`, border: `4px solid rgba(242,201,76,${p * pulso})`}} />;
};

/** Marcador amarillo (multiply) que se dibuja de izquierda a derecha, en coordenadas del cuadro */
const Marcador: React.FC<{x: number; y: number; w: number; h: number; p: number; linea?: boolean}> = ({x, y, w, h, p, linea}) => (
  <>
    {!linea && <div style={{position: 'absolute', left: x, top: y, width: w * p, height: h, background: AMARILLO, mixBlendMode: 'multiply'}} />}
    <div style={{position: 'absolute', left: x, top: y + h - 4, width: w * p, height: 7, borderRadius: 4, background: AMARILLO, boxShadow: '0 0 14px rgba(242,201,76,0.8)'}} />
  </>
);

// ---------------------------------------------------------------------------
// 1. Gancho y escritura
// ---------------------------------------------------------------------------
const Escritura: React.FC = () => {
  const f = useCurrentFrame();
  const lupa = tw(f, [2, 14], [0, 1], ease.out);
  const sale = tw(f, [ESCRIBE_F - 6, ESCRIBE_F], [0, 1], ease.in);
  const g1 = tw(f, [0, 8], [0, 1], ease.out);
  const g2 = tw(f, [5, 13], [0, 1], ease.out);
  return (
    <AbsoluteFill style={{background: '#0B0D11'}}>
      <Grabacion src={INTRO} desde={S_ESCRIBE} top={SH - H} z={1.0 + 0.03 * (f / ESCRIBE_F)} cy={1500} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 1010, background: 'linear-gradient(180deg, #0E1726 0%, #0E1726 96%, rgba(14,23,38,0) 100%)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', fontFamily: F.sans, color: '#fff'}}>
        <div style={{fontWeight: 800, fontSize: 62, opacity: g1, transform: `translateY(${(1 - g1) * 20}px)`}}>¿Qué sale si buscas</div>
        <div style={{fontWeight: 900, fontSize: 86, opacity: g2, transform: `scale(${1.2 - 0.2 * g2})`}}>
          <span style={{color: AMARILLO}}>WESTHILL</span> en Google?
        </div>
      </div>
      <div style={{position: 'absolute', left: 40, right: 40, top: 400, height: 280, borderRadius: 44, overflow: 'hidden', border: `5px solid ${AMARILLO}`, boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(242,201,76,0.25)', opacity: lupa * (1 - sale), transform: `scale(${0.85 + 0.15 * lupa})`}}>
        <div style={{position: 'absolute', left: -40, top: -1395 * 2 + 30, width: W * 2, height: SH * 2}}>
          <OffthreadVideo src={INTRO} startFrom={Math.round(S_ESCRIBE * 30)} muted style={{width: W * 2, height: SH * 2}} />
        </div>
      </div>
      <div style={{position: 'absolute', left: 300, top: 680, width: 4, height: 315, background: `linear-gradient(180deg, ${AMARILLO}, rgba(242,201,76,0))`, opacity: lupa * 0.6 * (1 - sale), transformOrigin: '50% 0', transform: `scaleY(${lupa})`}} />
      <AbsoluteFill style={{background: '#000', opacity: sale * 0.4}} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 2. Carga
// ---------------------------------------------------------------------------
const Carga: React.FC = () => {
  const f = useCurrentFrame();
  const p = f / CARGA_F;
  const top = interpolate(p, [0, 1], [SH - H, 0], {...clamp, easing: ease.inOut});
  const blur = interpolate(p, [0, 0.25, 0.8, 1], [6, 26, 18, 0], clamp);
  const barra = interpolate(p, [0, 0.6, 1], [0.08, 0.7, 1], {...clamp, easing: ease.out});
  return (
    <AbsoluteFill style={{background: '#202124'}}>
      <Grabacion src={INTRO} desde={S_CARGA} rate={((S_PAGINA - S_CARGA) * 30) / CARGA_F} top={top} blur={blur} />
      <AbsoluteFill style={{background: '#202124', opacity: interpolate(p, [0, 0.2, 0.75, 1], [0.2, 0.55, 0.4, 0], clamp)}} />
      <div style={{position: 'absolute', left: 0, top: 0, height: 10, width: `${barra * 100}%`, background: 'linear-gradient(90deg, #4C8BF5, #8AB4F8)', boxShadow: '0 0 16px rgba(138,180,248,0.8)', opacity: p < 0.97 ? 1 : 0}} />
      <div style={{position: 'absolute', left: W / 2 - 48, top: H / 2 - 48, width: 96, height: 96, borderRadius: 48, border: '9px solid rgba(255,255,255,0.18)', borderTopColor: '#8AB4F8', transform: `rotate(${f * 22}deg)`, opacity: interpolate(p, [0, 0.15, 0.7, 0.9], [0, 1, 1, 0], clamp)}} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 3. Primer resultado: nuestra noticia
// ---------------------------------------------------------------------------
const PRIMERO: Rect = {x0: 12, y0: 795, x1: 1068, y1: 1290};
const PRIMERO_TIT: Rect = {x0: 40, y0: 935, x1: 1020, y1: 1085};
const Primero: React.FC = () => {
  const f = useCurrentFrame();
  const luz = tw(f, [4, 16], [0, 1], ease.out);
  const res = tw(f, [14, 30], [0, 1], ease.out);
  const insignia = tw(f, [10, 20], [0, 1], ease.out);
  return (
    <AbsoluteFill style={{background: '#202124'}}>
      <Grabacion src={INTRO} desde={S_PAGINA} rate={0.55} top={0} z={1 + 0.02 * (f / PRIMERO_F)} cy={1040} />
      <Reflector x={PRIMERO.x0} y={PRIMERO.y0} w={PRIMERO.x1 - PRIMERO.x0} h={PRIMERO.y1 - PRIMERO.y0} p={luz} />
      <Marcador x={PRIMERO_TIT.x0} y={PRIMERO_TIT.y1 - 10} w={PRIMERO_TIT.x1 - PRIMERO_TIT.x0} h={10} p={res} linea />
      <div style={{position: 'absolute', right: 30, top: PRIMERO.y0 - 58, width: 116, height: 116, borderRadius: 58, background: AMARILLO, color: NAVY, fontFamily: F.sans, fontWeight: 900, fontSize: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 30px rgba(0,0,0,0.5)', transform: `scale(${insignia}) rotate(${(1 - insignia) * -40}deg)`}}>#1</div>
      <Etiqueta texto="Primer resultado: *nuestra *noticia" top={PRIMERO.y0 - 200} at={8} size={50} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 4. Visión general por IA
// ---------------------------------------------------------------------------
const S_IA = 8.6;
const PARR: Rect = {x0: 22, y0: 1022, x1: 1058, y1: 1590};
const RES_IA: Rect[] = [
  {x0: 806, x1: 1020, y0: 1398, y1: 1450},
  {x0: 40, x1: 422, y0: 1460, y1: 1514},
];
const ZMAX = 1.08;
const CENTRO_SRC = 1306;
const CENTRO_OUT = 1090;
const IA: React.FC = () => {
  const f = useCurrentFrame();
  const k = tw(f, [0, 22], [0, 1], ease.inOut);
  const z = 1.02 + (ZMAX - 1.02) * k;
  const despl = (CENTRO_OUT - CENTRO_SRC) * k;
  const mapY = (y: number) => (y - CENTRO_SRC) * z + CENTRO_SRC + despl;
  const mapX = (x: number) => (x - 540) * z + 540;
  const luz = tw(f, [10, 26], [0, 1], ease.out);
  return (
    <AbsoluteFill style={{background: '#202124', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${despl}px)`}}>
        <Grabacion src={INTRO} desde={S_IA} top={0} z={z} cy={CENTRO_SRC} />
      </div>
      <Reflector x={mapX(PARR.x0)} y={mapY(PARR.y0)} w={(PARR.x1 - PARR.x0) * z} h={(PARR.y1 - PARR.y0) * z} p={luz} />
      {RES_IA.map((r, i) => (
        <Marcador key={i} x={mapX(r.x0)} y={mapY(r.y0)} w={(r.x1 - r.x0) * z} h={(r.y1 - r.y0) * z} p={tw(f, [26 + i * 10, 40 + i * 10], [0, 1], ease.out)} />
      ))}
      <Etiqueta texto="Hasta *Google lo reconoce" top={mapY(PARR.y0) - 190} at={18} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 5. Scroll a Excélsior y su vista previa
// ---------------------------------------------------------------------------
/** Tarjeta: un recorte de la grabación (vista previa de una nota) sobre fondo azul con la grabación desenfocada */
const Tarjeta: React.FC<{src: string; desde: number; rate?: number; partes: Rect[]; top: number; dur: number; marcas: Rect[]; etiqueta: string; marcasAt?: number; sinSalida?: boolean; lineas?: boolean}> = ({src, desde, rate = 1, partes, top, dur, marcas, etiqueta, marcasAt = 20, sinSalida, lineas}) => {
  const f = useCurrentFrame();
  const entra = tw(f, [0, 12], [0, 1], ease.out);
  const sale = sinSalida ? 0 : tw(f, [dur - SOLAPE - 2, dur], [0, 1], ease.in);
  const ancho = Math.max(...partes.map((p) => p.x1 - p.x0));
  const s = Math.min(1.02, 1000 / ancho);
  const left = (W - ancho * s) / 2;
  let y = top;
  const bloques = partes.map((p) => {
    const b = {p, y};
    y += (p.y1 - p.y0) * s;
    return b;
  });
  const altoTotal = y - top;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <div style={{position: 'absolute', left, top, width: ancho * s, height: altoTotal, borderRadius: 28, overflow: 'hidden', boxShadow: '0 40px 90px rgba(0,0,0,0.6)', transform: `translateX(${(1 - entra) * 1150 - sale * 1150}px) rotate(${(1 - entra) * 7 - sale * 7}deg) scale(${0.94 + 0.06 * entra + 0.02 * (f / dur)})`}}>
        {bloques.map(({p, y: by}, i) => (
          <div key={i} style={{position: 'absolute', left: 0, top: by - top, width: (p.x1 - p.x0) * s, height: (p.y1 - p.y0) * s, overflow: 'hidden'}}>
            <div style={{position: 'absolute', left: -p.x0 * s, top: -p.y0 * s, width: W * s, height: SH * s}}>
              <OffthreadVideo src={src} startFrom={Math.round(desde * 30)} playbackRate={rate} muted style={{width: W * s, height: SH * s}} />
            </div>
            {marcas
              .filter((m) => m.y0 >= p.y0 && m.y1 <= p.y1)
              .map((m, j) => (
                <Marcador key={j} x={(m.x0 - p.x0) * s} y={(m.y0 - p.y0) * s} w={(m.x1 - m.x0) * s} h={(m.y1 - m.y0) * s} p={tw(f, [marcasAt + marcas.indexOf(m) * 7, marcasAt + 12 + marcas.indexOf(m) * 7], [0, 1], ease.out)} linea={lineas} />
              ))}
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', inset: 0, opacity: 1 - sale}}>
        <Etiqueta texto={etiqueta} top={top - 200} at={6} size={60} />
      </div>
    </AbsoluteFill>
  );
};

const EXC: Rect[] = [{x0: 40, y0: 228, x1: 1045, y1: 1645}];
const EXC_MARCAS: Rect[] = [
  {x0: 88, x1: 972, y0: 668, y1: 752},
  {x0: 88, x1: 897, y0: 762, y1: 846},
  {x0: 88, x1: 817, y0: 856, y1: 940},
  {x0: 88, x1: 514, y0: 950, y1: 1032},
];

// ---------------------------------------------------------------------------
// 7. La Crónica: encabezado + el párrafo (sin el espacio del anuncio)
// ---------------------------------------------------------------------------
const CRON: Rect[] = [
  {x0: 40, y0: 228, x1: 1035, y1: 560},
  {x0: 40, y0: 1160, x1: 1035, y1: 1625},
];
const CRON_MARCAS: Rect[] = [
  {x0: 88, x1: 1005, y0: 1330, y1: 1392},
  {x0: 88, x1: 712, y0: 1392, y1: 1454},
];

// ---------------------------------------------------------------------------
// 6. MVS Noticias (resultado de búsqueda) — es la última nota: no sale, se encoge hacia el collage
// ---------------------------------------------------------------------------
const MVS: Rect[] = [{x0: 15, y0: 1040, x1: 1065, y1: 1530}];
const MVS_MARCAS: Rect[] = [{x0: 40, x1: 1040, y0: 1185, y1: 1335}];
const MVS_TOP = 720;

// ---------------------------------------------------------------------------
// Nota completa: primero la vista previa (tarjeta) y luego la animación de "abrir" la nota: la tarjeta crece hasta
// llenar la pantalla y entra la grabación de la página ya cargada (sin cargas, cookies ni anuncios). Los anuncios
// que quedan dentro del cuadro se desenfocan. La página sale deslizándose a la izquierda para dar paso a la
// siguiente; la última no sale (se encoge hacia el collage).
// ---------------------------------------------------------------------------
type Previo = {src: string; desde: number; rate?: number; partes: Rect[]; top: number; marcas: Rect[]; etiqueta: string; lineas?: boolean; marcasAt?: number; dur: number};
type Pagina = {src: string; desde: number; rate?: number; marcas?: Rect[]; blur?: Rect[]; marcasAt?: number};
const ABRE_F = 12;
const NotaCompleta: React.FC<{dur: number; previo?: Previo; pagina: Pagina; sinSalida?: boolean}> = ({dur, previo, pagina, sinSalida}) => {
  const f = useCurrentFrame();
  const pf = previo ? previo.dur : 0;
  // rectángulo final de la tarjeta (igual que en <Tarjeta>, con su escala final de 1.02)
  let k0 = 1;
  let x0 = 0;
  let y0 = 0;
  let h0 = H;
  if (previo) {
    const ancho = Math.max(...previo.partes.map((p) => p.x1 - p.x0));
    const s = Math.min(1.02, 1000 / ancho);
    const cw = ancho * s;
    const ch = previo.partes.reduce((a, p) => a + (p.y1 - p.y0) * s, 0);
    k0 = (cw * 1.02) / W;
    x0 = (W - cw) / 2 - cw * 0.01;
    y0 = previo.top - ch * 0.01;
    h0 = (ch * 1.02) / k0;
  }
  const o = previo ? tw(f, [pf, pf + ABRE_F], [0, 1], ease.inOut) : 1;
  const k = k0 + (1 - k0) * o;
  const x = x0 * (1 - o);
  const y = y0 * (1 - o);
  const visible = h0 + (H - h0) * o;
  const radio = (28 / k0) * (1 - o);
  // entrada sin vista previa (zoom con desenfoque) y salida hacia la izquierda
  const entraZ = previo ? 1 : tw(f, [0, 12], [0, 1], ease.out);
  const sale = sinSalida ? 0 : tw(f, [dur - SOLAPE - 2, dur], [0, 1], ease.in);
  const pg = f - pf; // cuadros desde que se abre la página
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {previo && f < pf + ABRE_F && (
        <div style={{position: 'absolute', inset: 0, opacity: 1 - tw(f, [pf, pf + ABRE_F * 0.7], [0, 1])}}>
          <Tarjeta src={previo.src} desde={previo.desde} rate={previo.rate} partes={previo.partes} top={previo.top} dur={pf + ABRE_F} marcas={previo.marcas} etiqueta={previo.etiqueta} marcasAt={previo.marcasAt} lineas={previo.lineas} sinSalida />
        </div>
      )}
      {f >= pf && (
        <div style={{position: 'absolute', inset: 0, transform: `translateX(${-sale * 1150}px) rotate(${-sale * 7}deg) scale(${(1.2 - 0.2 * entraZ) * (1 - 0.08 * sale)})`, filter: entraZ < 1 ? `blur(${(1 - entraZ) * 18}px)` : undefined, opacity: Math.min(1, entraZ * 1.6)}}>
          <div style={{position: 'absolute', left: x, top: y, width: W, height: H, transform: `scale(${k})`, transformOrigin: '0 0', clipPath: `inset(0 0 ${H - visible}px 0 round ${radio}px)`, boxShadow: o < 1 ? '0 40px 90px rgba(0,0,0,0.6)' : undefined}}>
            <Sequence from={pf} layout="none">
              <AbsoluteFill style={{background: '#fff'}}>
                <Grabacion src={pagina.src} desde={pagina.desde} rate={pagina.rate} top={0} z={1 + 0.03 * Math.max(0, pg) / Math.max(1, dur - pf)} cy={900} />
                {(pagina.blur ?? []).map((r, i) => (
                  <div key={i} style={{position: 'absolute', left: r.x0, top: r.y0, width: r.x1 - r.x0, height: r.y1 - r.y0, overflow: 'hidden', borderRadius: 18}}>
                    <div style={{position: 'absolute', left: -r.x0, top: -r.y0, width: W, height: SH, filter: 'blur(38px)'}}>
                      <OffthreadVideo src={pagina.src} startFrom={Math.round(pagina.desde * 30)} playbackRate={pagina.rate ?? 1} muted style={{width: W, height: SH}} />
                    </div>
                    <div style={{position: 'absolute', inset: 0, background: 'rgba(14,44,82,0.35)'}} />
                  </div>
                ))}
                {(pagina.marcas ?? []).map((m, i) => (
                  <Marcador key={i} x={m.x0} y={m.y0} w={m.x1 - m.x0} h={m.y1 - m.y0} p={tw(pg, [(pagina.marcasAt ?? 16) + i * 6, (pagina.marcasAt ?? 16) + 12 + i * 6], [0, 1], ease.out)} />
                ))}
              </AbsoluteFill>
            </Sequence>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// páginas abiertas (grabaciones del cliente) y sus marcas, en coordenadas de la grabación
const NOTA3 = staticFile('proxies/grabacion/nota3.mp4'); // Excélsior
const NOTA2 = staticFile('proxies/grabacion/nota2.mp4'); // La Crónica
const MVSPAG = staticFile('proxies/grabacion/mvs.mp4');
const REFORMA = staticFile('proxies/grabacion/reforma.mp4');
const CRON_PAG_MARCAS: Rect[] = [
  {x0: 52, x1: 660, y0: 812, y1: 922},
  {x0: 52, x1: 972, y0: 928, y1: 1038},
];
const MVS_PAG_MARCAS: Rect[] = [
  {x0: 48, x1: 996, y0: 648, y1: 735},
  {x0: 48, x1: 962, y0: 737, y1: 822},
  {x0: 48, x1: 206, y0: 826, y1: 912},
];
const MVS_PAG_BLUR: Rect[] = [{x0: 95, x1: 990, y0: 945, y1: 1672}];
const REF_PAG_MARCAS: Rect[] = [
  {x0: 48, x1: 704, y0: 975, y1: 1072},
  {x0: 48, x1: 1002, y0: 1075, y1: 1172},
  {x0: 48, x1: 354, y0: 1175, y1: 1270},
];

// ---------------------------------------------------------------------------
// 7. Collage: la última nota se hace pequeña y las demás llegan a acomodarse sobre el video de la placa
// ---------------------------------------------------------------------------
type Pieza = {img: string; w: number; h: number; cx: number; cy: number; s: number; rot: number; at: number; desdeX: number; desdeY: number; desdeRot: number; desdeS?: number};
const PIEZAS: Pieza[] = [
  {img: 'excelsior_pag.jpg', w: 1080, h: 1760, cx: 200, cy: 470, s: 0.29, rot: -6, at: 8, desdeX: -500, desdeY: 300, desdeRot: -25},
  {img: 'cronica_pag.jpg', w: 1080, h: 1410, cx: 545, cy: 425, s: 0.3, rot: 2, at: 13, desdeX: 540, desdeY: -700, desdeRot: 15},
  {img: 'google1.jpg', w: 1056, h: 495, cx: 290, cy: 905, s: 0.44, rot: -3, at: 18, desdeX: -700, desdeY: 1000, desdeRot: -20},
  {img: 'ia.jpg', w: 1036, h: 568, cx: 795, cy: 895, s: 0.42, rot: 3, at: 23, desdeX: 1700, desdeY: 900, desdeRot: 20},
  {img: 'mvs.jpg', w: 1050, h: 490, cx: 540, cy: 1165, s: 0.44, rot: -2, at: 28, desdeX: 540, desdeY: 2300, desdeRot: 10},
  // la última nota (Reforma) parte de pantalla completa
  {img: 'reforma_pag.jpg', w: 1080, h: 1920, cx: 885, cy: 480, s: 0.29, rot: 6, at: 0, desdeX: 540, desdeY: 960, desdeRot: 0, desdeS: 1},
];

/** Fondo de las notas y del collage: el video de la develación de la placa, oscurecido */
const FondoPlaca: React.FC<{blur?: number; oscuro?: number}> = ({blur = 10, oscuro = 0.62}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: NAVY2, overflow: 'hidden'}}>
      <OffthreadVideo src={staticFile('proxies/placa/11218.mp4')} playbackRate={0.8} muted style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.1 + 0.0004 * f})`, filter: `blur(${blur}px) saturate(0.9)`}} />
      <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(10,33,65,${oscuro + 0.15}) 0%, rgba(10,33,65,${oscuro - 0.1}) 50%, rgba(10,33,65,${oscuro + 0.2}) 100%)`}} />
    </AbsoluteFill>
  );
};

const Collage: React.FC<{f: number; salida?: number}> = ({f, salida = 0}) => (
  <AbsoluteFill style={{transform: `translateY(${-170 * salida}px) scale(${1 - 0.12 * salida})`, transformOrigin: '50% 30%', filter: salida > 0.02 ? `blur(${3.5 * salida}px) brightness(${1 - 0.35 * salida})` : undefined}}>
    {PIEZAS.map((p) => {
      const k = tw(f, [p.at, p.at + 18], [0, 1], ease.out);
      const asienta = interpolate(f - p.at - 18, [0, 6, 12], [0, 1, 0], clamp);
      const s0 = p.desdeS ?? p.s * 1.8;
      const cx = p.desdeX + (p.cx - p.desdeX) * k;
      const cy = p.desdeY + (p.cy - p.desdeY) * k;
      const s = s0 + (p.s - s0) * k;
      const rot = p.desdeRot + (p.rot - p.desdeRot) * k;
      if (f < p.at && p.desdeS === undefined) return null;
      return (
        <div key={p.img} style={{position: 'absolute', left: cx - (p.w * s) / 2, top: cy - (p.h * s) / 2, width: p.w * s, height: p.h * s, transform: `rotate(${rot}deg)`, borderRadius: 18, overflow: 'hidden', border: `${6 * k}px solid #fff`, boxShadow: `0 ${20 + 14 * asienta}px 50px rgba(0,0,0,0.55)`}}>
          <Img src={staticFile(`grabacion/${p.img}`)} style={{width: '100%', height: '100%', display: 'block'}} />
        </div>
      );
    })}
  </AbsoluteFill>
);

const CollageEscena: React.FC = () => {
  const f = useCurrentFrame();
  const t1 = tw(f, [44, 56], [0, 1], ease.out);
  const golpe = interpolate(f, [44, 50, 58], [1.4, 0.95, 1], clamp);
  return (
    <AbsoluteFill>
      <Collage f={f} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1440, textAlign: 'center', fontFamily: F.sans, color: '#fff', textShadow: '0 8px 30px rgba(0,0,0,0.7)', opacity: t1}}>
        <div style={{fontWeight: 800, fontSize: 64, transform: `translateY(${(1 - t1) * 20}px)`}}>Todos hablan de</div>
        <div style={{fontWeight: 900, fontSize: 150, lineHeight: 1, color: AMARILLO, transform: `scale(${golpe})`}}>WESTHILL</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 8. CTA: el collage se va atrás y aparece "el próximo titular puede ser el tuyo"
// ---------------------------------------------------------------------------
const PALABRAS_TIT = ['El', 'próximo', 'titular', 'puede', 'ser', 'el', 'tuyo.'];
const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const atras = tw(f, [0, 18], [0, 1], ease.inOut);
  const hoja = tw(f, [10, 26], [0, 1], ease.out);
  const sub = tw(f, [52, 64], [0, 1], ease.out);
  const boton = tw(f, [66, 78], [0, 1], ease.out);
  const late = f > 78 ? 1 + 0.045 * Math.max(0, Math.sin(((f - 78) / 15) * Math.PI)) : 1;
  const brillo = interpolate((f - 80) % 40, [0, 16], [-0.3, 1.3], clamp);
  const logo = tw(f, [74, 88], [0, 1], ease.out);
  const negro = tw(f, [CTA_F - 10, CTA_F], [0, 1]);
  return (
    <AbsoluteFill>
      <Collage f={COLLAGE_F + f} salida={atras} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 62%, rgba(10,33,65,0.35) 0%, rgba(10,33,65,0.8) 70%)`, opacity: atras}} />
      {/* hoja de periódico (genérica) con el titular */}
      <div style={{position: 'absolute', left: 70, right: 70, top: 920, padding: '44px 50px 50px', borderRadius: 14, background: '#F7F3EA', boxShadow: '0 40px 100px rgba(0,0,0,0.6)', transform: `translateY(${(1 - hoja) * 500}px) rotate(${(1 - hoja) * 8 - 1.5}deg)`, opacity: hoja}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: F.sans, fontWeight: 800, fontSize: 24, letterSpacing: 3, color: '#6B6457', borderBottom: '3px solid #2B2B2B', paddingBottom: 12}}>
          <span>MEDICINA · WESTHILL</span>
          <span>TU HISTORIA</span>
        </div>
        <div style={{marginTop: 26, fontFamily: F.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 92, lineHeight: 1.05, color: '#1B1B1B'}}>
          {PALABRAS_TIT.map((w, i) => {
            const q = tw(f, [22 + i * 4, 32 + i * 4], [0, 1], ease.out);
            const dorado = w === 'tuyo.';
            return (
              <span key={i} style={{display: 'inline-block', marginRight: 22, opacity: q, transform: `translateY(${(1 - q) * 30}px)`, color: dorado ? '#B8860B' : undefined, backgroundImage: dorado ? `linear-gradient(${AMARILLO}, ${AMARILLO})` : undefined, backgroundSize: dorado ? `${tw(f, [50, 60], [0, 1]) * 100}% 30%` : undefined, backgroundPosition: '0 85%', backgroundRepeat: 'no-repeat'}}>
                {w}
              </span>
            );
          })}
        </div>
        <div style={{marginTop: 26, fontFamily: F.sans, fontWeight: 700, fontSize: 38, color: '#3A3A3A', opacity: sub, transform: `translateY(${(1 - sub) * 16}px)`}}>Estudia Médico Cirujano en la primera universidad privada con Distinción de Excelencia COMAEM.</div>
      </div>
      <div style={{position: 'absolute', left: 110, right: 110, top: 1620, height: 124, borderRadius: 62, background: `linear-gradient(180deg, #FFE38A 0%, ${AMARILLO} 55%, #E0B12E 100%)`, boxShadow: '0 16px 40px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', opacity: boton, transform: `translateY(${(1 - boton) * 50}px) scale(${late * (0.85 + 0.15 * boton)})`}}>
        <div style={{position: 'absolute', top: 0, bottom: 0, left: `${brillo * 100}%`, width: 120, transform: 'translateX(-50%) skewX(-18deg)', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.7), rgba(255,255,255,0))'}} />
        <span style={{position: 'relative', fontFamily: F.sans, fontWeight: 900, fontSize: 50, color: NAVY}}>SOLICITA INFORMACIÓN →</span>
      </div>
      <Img src={LOGO} style={{position: 'absolute', left: W / 2 - 170, top: 1790, width: 340, opacity: logo}} />
      <AbsoluteFill style={{background: '#000', opacity: negro}} />
    </AbsoluteFill>
  );
};

const Flash: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: '#FFFDF4', opacity: interpolate(f, [0, 1, 8], [0.7, 0.55, 0], clamp)}} />;
};

export const BusquedaGoogle: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <Sequence durationInFrames={ESCRIBE_F}>
      <Escritura />
    </Sequence>
    <Sequence from={T.carga} durationInFrames={CARGA_F}>
      <Carga />
    </Sequence>
    <Sequence from={T.primero} durationInFrames={PRIMERO_F}>
      <Primero />
    </Sequence>
    <Sequence from={T.ia} durationInFrames={IA_F}>
      <IA />
    </Sequence>
    <Sequence from={T.scroll} durationInFrames={SCROLL_F}>
      <AbsoluteFill style={{background: '#202124'}}>
        <Grabacion src={NOTAS} desde={1.2} rate={(3.6 - 1.2) * 30 / SCROLL_F} top={0} />
      </AbsoluteFill>
    </Sequence>
    <Sequence from={T.exc} durationInFrames={T.fin - T.exc}>
      <FondoPlaca />
    </Sequence>
    <Sequence from={T.exc} durationInFrames={EXC_F + SOLAPE}>
      <NotaCompleta dur={EXC_F + SOLAPE} previo={{src: NOTAS, desde: 3.9, partes: EXC, top: 330, marcas: EXC_MARCAS, etiqueta: 'Lo publicó *Excélsior', marcasAt: 12, dur: 48}} pagina={{src: NOTA3, desde: 0.2, rate: 0.8}} />
    </Sequence>
    <Sequence from={T.cron} durationInFrames={CRON_F + SOLAPE}>
      <NotaCompleta dur={CRON_F + SOLAPE} previo={{src: NOTAS, desde: 10.9, rate: 0.75, partes: CRON, top: 560, marcas: CRON_MARCAS, etiqueta: 'También *La *Crónica *de *Hoy', marcasAt: 10, dur: 45}} pagina={{src: NOTA2, desde: 3.5, rate: 0.9, marcas: CRON_PAG_MARCAS, marcasAt: 22}} />
    </Sequence>
    <Sequence from={T.mvs} durationInFrames={MVS_F + SOLAPE}>
      <NotaCompleta dur={MVS_F + SOLAPE} previo={{src: NOTAS, desde: 8.6, rate: 0.5, partes: MVS, top: MVS_TOP, marcas: MVS_MARCAS, etiqueta: 'Y *MVS *Noticias', lineas: true, marcasAt: 8, dur: 36}} pagina={{src: MVSPAG, desde: 0.3, marcas: MVS_PAG_MARCAS, blur: MVS_PAG_BLUR, marcasAt: 14}} />
    </Sequence>
    <Sequence from={T.ref} durationInFrames={REF_F}>
      <NotaCompleta dur={REF_F} pagina={{src: REFORMA, desde: 0.15, rate: 0.5, marcas: REF_PAG_MARCAS, marcasAt: 16}} sinSalida />
    </Sequence>
    <Sequence from={T.collage} durationInFrames={COLLAGE_F}>
      <CollageEscena />
    </Sequence>
    <Sequence from={T.cta} durationInFrames={CTA_F}>
      <Cta />
    </Sequence>
    {[T.primero, T.exc, T.cta].map((at) => (
      <Sequence key={at} from={at} durationInFrames={8}>
        <Flash />
      </Sequence>
    ))}
    {TECLAS.map((t) => (
      <Sfx key={t} at={Math.round((t - S_ESCRIBE) * 30)} name="ref_click" volume={0.4} />
    ))}
    <Sfx at={T.carga - 2} name="ref_tap" volume={0.5} />
    <Sfx at={T.carga} name="whoosh" volume={0.3} />
    <Sfx at={T.primero} name="impact" volume={0.35} />
    <Sfx at={T.primero + 10} name="pop" volume={0.35} />
    <Sfx at={T.ia} name="whoosh" volume={0.28} />
    <Sfx at={T.ia + 26} name="ding" volume={0.3} />
    <Sfx at={T.scroll} name="swipe" volume={0.3} />
    <Sfx at={T.exc} name="impact" volume={0.35} />
    <Sfx at={T.exc + 20} name="ref_shutter" volume={0.3} />
    <Sfx at={T.cron - 4} name="ref_swoosh" volume={0.32} />
    <Sfx at={T.mvs - 4} name="ref_swoosh" volume={0.32} />
    <Sfx at={T.ref - 4} name="whoosh" volume={0.35} />
    {[T.exc + 48, T.cron + 45, T.mvs + 36].map((at) => (
      <Sfx key={at} at={at} name="ref_tap" volume={0.45} />
    ))}
    {[T.exc + 49, T.cron + 46, T.mvs + 37].map((at) => (
      <Sfx key={at} at={at} name="swipe" volume={0.3} />
    ))}
    <Sfx at={T.collage} name="whoosh" volume={0.3} />
    {[8, 14, 20, 26].map((k) => (
      <Sfx key={k} at={T.collage + k + 14} name="ref_shutter" volume={0.25} />
    ))}
    <Sfx at={T.collage + 44} name="down_bass" volume={0.8} />
    <Sfx at={T.collage + 44} name="impact" volume={0.4} />
    <Sfx at={T.cta - 30} name="riser" volume={0.35} />
    <Sfx at={T.cta + 10} name="whoosh_largo" volume={0.35} />
    <Sfx at={T.cta + 50} name="ding" volume={0.3} />
    <Sfx at={T.cta + 66} name="pop" volume={0.35} />
    <Audio src={staticFile('placa/solace_ext.wav')} volume={(fr) => interpolate(fr, [0, 20, BUSQUEDA_FRAMES - 20, BUSQUEDA_FRAMES], [0, 0.5, 0.5, 0], clamp)} />
  </AbsoluteFill>
);

