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
//  6. Más medios: La Crónica de Hoy, MVS Noticias y COMAEM (sus títulos subrayados).
//  7. Vista previa de La Crónica: "han obtenido la máxima distinción del organismo acreditador".
//  8. Cierre: la placa real, "Tu vocación merece EXCELENCIA" y Solicita información.
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
const EXC_F = 84;
const MEDIOS_F = 66;
const CRON_F = 57;
const CIERRE_F = 120;
const T = (() => {
  let t = 0;
  const r: Record<string, number> = {};
  for (const [k, d] of [['escribe', ESCRIBE_F], ['carga', CARGA_F], ['primero', PRIMERO_F], ['ia', IA_F], ['scroll', SCROLL_F], ['exc', EXC_F], ['medios', MEDIOS_F], ['cron', CRON_F], ['cierre', CIERRE_F]] as [string, number][]) {
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
const Tarjeta: React.FC<{src: string; desde: number; rate?: number; partes: Rect[]; top: number; dur: number; marcas: Rect[]; etiqueta: string; marcasAt?: number}> = ({src, desde, rate = 1, partes, top, dur, marcas, etiqueta, marcasAt = 20}) => {
  const f = useCurrentFrame();
  const entra = tw(f, [0, 10], [0, 1], ease.out);
  const sale = tw(f, [dur - 6, dur], [0, 1], ease.in);
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
    <AbsoluteFill style={{background: NAVY2, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, opacity: 0.45}}>
        <Grabacion src={src} desde={desde} rate={rate} top={0} blur={30} z={1.15} />
      </div>
      <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(10,33,65,0.75) 0%, rgba(10,33,65,0.55) 50%, rgba(10,33,65,0.85) 100%)`}} />
      <div style={{position: 'absolute', left, top, width: ancho * s, height: altoTotal, borderRadius: 28, overflow: 'hidden', boxShadow: '0 40px 90px rgba(0,0,0,0.6)', opacity: entra * (1 - sale), transform: `translateY(${(1 - entra) * 80}px) scale(${0.94 + 0.06 * entra + 0.02 * (f / dur)})`}}>
        {bloques.map(({p, y: by}, i) => (
          <div key={i} style={{position: 'absolute', left: 0, top: by - top, width: (p.x1 - p.x0) * s, height: (p.y1 - p.y0) * s, overflow: 'hidden'}}>
            <div style={{position: 'absolute', left: -p.x0 * s, top: -p.y0 * s, width: W * s, height: SH * s}}>
              <OffthreadVideo src={src} startFrom={Math.round(desde * 30)} playbackRate={rate} muted style={{width: W * s, height: SH * s}} />
            </div>
            {marcas
              .filter((m) => m.y0 >= p.y0 && m.y1 <= p.y1)
              .map((m, j) => (
                <Marcador key={j} x={(m.x0 - p.x0) * s} y={(m.y0 - p.y0) * s} w={(m.x1 - m.x0) * s} h={(m.y1 - m.y0) * s} p={tw(f, [marcasAt + marcas.indexOf(m) * 7, marcasAt + 12 + marcas.indexOf(m) * 7], [0, 1], ease.out)} />
              ))}
          </div>
        ))}
      </div>
      <Etiqueta texto={etiqueta} top={top - 200} at={8} size={60} />
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
// 6. Más medios
// ---------------------------------------------------------------------------
const MEDIOS_TIT: Rect[] = [
  {x0: 40, x1: 900, y0: 635, y1: 785},
  {x0: 40, x1: 1040, y0: 1185, y1: 1335},
  {x0: 40, x1: 1040, y0: 1735, y1: 1885},
];
const Medios: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#202124'}}>
      <Grabacion src={NOTAS} desde={8.55} rate={0.5} top={60} />
      {MEDIOS_TIT.map((r, i) => (
        <Marcador key={i} x={r.x0} y={r.y0 - 60} w={r.x1 - r.x0} h={r.y1 - r.y0} p={tw(f, [10 + i * 9, 24 + i * 9], [0, 1], ease.out)} linea />
      ))}
      <Etiqueta texto="También *La *Crónica, *MVS y *COMAEM" top={300} at={4} size={54} />
    </AbsoluteFill>
  );
};

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
// 8. Cierre
// ---------------------------------------------------------------------------
const Cierre: React.FC = () => {
  const f = useCurrentFrame();
  const a = tw(f, [0, 14], [0, 1], ease.out);
  const t1 = tw(f, [8, 20], [0, 1], ease.out);
  const t2 = tw(f, [16, 26], [0, 1], ease.out);
  const golpe = interpolate(f, [16, 22, 28], [1.5, 0.95, 1], clamp);
  const b = tw(f, [34, 46], [0, 1], ease.out);
  const late = f > 46 ? 1 + 0.04 * Math.max(0, Math.sin(((f - 46) / 15) * Math.PI)) : 1;
  const brillo = interpolate((f - 50) % 40, [0, 16], [-0.3, 1.3], clamp);
  const negro = tw(f, [CIERRE_F - 12, CIERRE_F], [0, 1]);
  return (
    <AbsoluteFill style={{background: NAVY2, overflow: 'hidden'}}>
      <OffthreadVideo src={staticFile('proxies/placa/1126.mp4')} startFrom={78} muted style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.08 + 0.06 * (f / CIERRE_F)})`, filter: 'saturate(0.9)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,33,65,0.88) 0%, rgba(10,33,65,0.45) 38%, rgba(10,33,65,0.55) 62%, rgba(10,33,65,0.92) 100%)'}} />
      <Img src={LOGO} style={{position: 'absolute', left: W / 2 - 230, top: 140, width: 460, opacity: a, transform: `translateY(${(1 - a) * -30}px)`, filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.5))'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1180, textAlign: 'center', fontFamily: F.sans, color: '#fff', textShadow: '0 6px 26px rgba(0,0,0,0.6)'}}>
        <div style={{fontWeight: 800, fontSize: 76, opacity: t1, transform: `translateY(${(1 - t1) * 20}px)`}}>Tu vocación merece</div>
        <div style={{fontWeight: 900, fontSize: 138, lineHeight: 1.05, color: AMARILLO, opacity: t2, transform: `scale(${golpe})`}}>EXCELENCIA.</div>
      </div>
      <div style={{position: 'absolute', left: 110, right: 110, top: 1560, height: 120, borderRadius: 60, background: `linear-gradient(180deg, #FFE38A 0%, ${AMARILLO} 55%, #E0B12E 100%)`, boxShadow: '0 16px 40px rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', opacity: b, transform: `translateY(${(1 - b) * 40}px) scale(${late * (0.85 + 0.15 * b)})`}}>
        <div style={{position: 'absolute', top: 0, bottom: 0, left: `${brillo * 100}%`, width: 120, transform: 'translateX(-50%) skewX(-18deg)', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.7), rgba(255,255,255,0))'}} />
        <span style={{position: 'relative', fontFamily: F.sans, fontWeight: 900, fontSize: 48, color: NAVY}}>SOLICITA INFORMACIÓN →</span>
      </div>
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
    <Sequence from={T.exc} durationInFrames={EXC_F}>
      <Tarjeta src={NOTAS} desde={3.9} partes={EXC} top={330} dur={EXC_F} marcas={EXC_MARCAS} etiqueta="Lo publicó *Excélsior" />
    </Sequence>
    <Sequence from={T.medios} durationInFrames={MEDIOS_F}>
      <Medios />
    </Sequence>
    <Sequence from={T.cron} durationInFrames={CRON_F}>
      <Tarjeta src={NOTAS} desde={10.9} rate={0.75} partes={CRON} top={560} dur={CRON_F} marcas={CRON_MARCAS} etiqueta="*La *Crónica *de *Hoy" marcasAt={14} />
    </Sequence>
    <Sequence from={T.cierre} durationInFrames={CIERRE_F}>
      <Cierre />
    </Sequence>
    {[T.primero, T.exc, T.cierre].map((at) => (
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
    {[0, 9, 18].map((k) => (
      <Sfx key={k} at={T.medios + 10 + k} name="pop" volume={0.28} />
    ))}
    <Sfx at={T.cron} name="ref_swoosh" volume={0.3} />
    <Sfx at={T.cierre - 8} name="whoosh_largo" volume={0.35} />
    <Sfx at={T.cierre} name="down_bass" volume={0.8} />
    <Sfx at={T.cierre + 46} name="pop" volume={0.35} />
    <Audio src={staticFile('placa/solace_ext.wav')} volume={(fr) => interpolate(fr, [0, 20, BUSQUEDA_FRAMES - 20, BUSQUEDA_FRAMES], [0, 0.5, 0.5, 0], clamp)} />
  </AbsoluteFill>
);

