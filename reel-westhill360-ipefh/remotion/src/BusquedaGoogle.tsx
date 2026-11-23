import React from 'react';
import {AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Sfx} from './shots';
import {F, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Intro del video "Westhill en Google" (9:16), sobre la grabación de pantalla real del cliente
// (public/proxies/grabacion/intro.mp4: 1080x2348, 30 fps; original en media/grabacion/fuente).
//  1. Escritura (fuente 1.55–4.40 s): se ve el teclado completo y una lupa con el campo de búsqueda en grande
//     ("Westhill y comaem"); la parte de arriba (la pantalla de navegación privada) queda tapada.
//  2. Carga (fuente 4.40–7.0 s, acelerada y desenfocada) con barra de progreso: no se ve nada antes de que la
//     página termine de cargar.
//  3. La página de resultados completa (fuente 7.0–8.6 s) y luego zoom a la visión general creada por IA, con
//     reflector, "la primera universidad privada" resaltado en amarillo y la etiqueta "Hasta Google lo reconoce".
// Después de esto va la parte de las notas de los diarios (cuando el cliente mande esa grabación).
// ---------------------------------------------------------------------------
const W = 1080;
const H = 1920;
const SH = 2348; // alto de la grabación
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const NAVY = '#0E2C52';
const AMARILLO = '#F2C94C';
const VIDEO = staticFile('proxies/grabacion/intro.mp4');

// tiempos en la fuente (s) y en el video (cuadros)
const S_ESCRIBE = 1.55;
const S_CARGA = 4.4;
const S_PAGINA = 7.0;
const S_ZOOM = 8.6;
const S_FIN = 11.6;
const ESCRIBE_F = Math.round((S_CARGA - S_ESCRIBE) * 30); // 86
const CARGA_F = 28;
const PAGINA_F = Math.round((S_ZOOM - S_PAGINA) * 30); // 48
const ZOOM_F = Math.round((S_FIN - S_ZOOM) * 30); // 90
const T_CARGA = ESCRIBE_F;
const T_PAGINA = T_CARGA + CARGA_F;
const T_ZOOM = T_PAGINA + PAGINA_F;
export const BUSQUEDA_FRAMES = T_ZOOM + ZOOM_F;

// teclas (s de la fuente) detectadas en el campo de búsqueda
const TECLAS = [1.67, 1.78, 1.9, 2.07, 2.2, 2.3, 2.5, 2.63, 2.82, 2.98, 3.15, 3.27, 3.37, 3.55, 3.65, 3.85, 4.03, 4.15, 4.3];

/** La grabación colocada en el cuadro: `top` es la fila de la fuente que queda arriba; zoom alrededor de (cx, cy) */
const Grabacion: React.FC<{desde: number; rate?: number; top: number; z?: number; cy?: number; blur?: number}> = ({desde, rate = 1, top, z = 1, cy = 960, blur = 0}) => (
  <div style={{position: 'absolute', left: 0, top: -top, width: W, height: SH, transform: `scale(${z})`, transformOrigin: `540px ${cy + top}px`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined}}>
    <OffthreadVideo src={VIDEO} startFrom={Math.round(desde * 30)} playbackRate={rate} muted style={{width: W, height: SH}} />
  </div>
);

/** 1. Escritura: teclado completo abajo, la parte de arriba tapada y una lupa con el campo en grande */
const Escritura: React.FC = () => {
  const f = useCurrentFrame();
  const lupa = tw(f, [2, 14], [0, 1], ease.out);
  const sale = tw(f, [ESCRIBE_F - 6, ESCRIBE_F], [0, 1], ease.in);
  const top = SH - H; // la grabación alineada abajo: se ve el teclado completo
  return (
    <AbsoluteFill style={{background: '#0B0D11'}}>
      <Grabacion desde={S_ESCRIBE} top={top} z={1.0 + 0.03 * (f / ESCRIBE_F)} cy={1500} />
      {/* tapa todo lo que está arriba del campo (incluida la pantalla de navegación privada) */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 1010, background: 'linear-gradient(180deg, #0E1726 0%, #0E1726 96%, rgba(14,23,38,0) 100%)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 230, textAlign: 'center', fontFamily: F.sans, fontWeight: 700, fontSize: 40, letterSpacing: 6, color: 'rgba(255,255,255,0.55)', opacity: lupa}}>BUSCANDO EN GOOGLE…</div>
      {/* lupa: el campo de búsqueda real, ampliado 2x */}
      <div style={{position: 'absolute', left: 40, right: 40, top: 360, height: 300, borderRadius: 44, overflow: 'hidden', border: `5px solid ${AMARILLO}`, boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(242,201,76,0.25)', opacity: lupa * (1 - sale), transform: `scale(${0.85 + 0.15 * lupa})`}}>
        <div style={{position: 'absolute', left: -20 * 2, top: -1395 * 2 + 40, width: W * 2, height: SH * 2, transform: 'scale(1)'}}>
          <OffthreadVideo src={VIDEO} startFrom={Math.round(S_ESCRIBE * 30)} muted style={{width: W * 2, height: SH * 2}} />
        </div>
      </div>
      {/* línea que une la lupa con el campo */}
      <div style={{position: 'absolute', left: 300, top: 660, width: 4, height: 335, background: `linear-gradient(180deg, ${AMARILLO}, rgba(242,201,76,0))`, opacity: lupa * 0.6 * (1 - sale), transformOrigin: '50% 0', transform: `scaleY(${lupa})`}} />
      <AbsoluteFill style={{background: '#000', opacity: sale * 0.4}} />
    </AbsoluteFill>
  );
};

/** 2. Carga: la página acelerada y desenfocada, con barra de progreso y la cámara pasando de abajo a arriba */
const Carga: React.FC = () => {
  const f = useCurrentFrame();
  const p = f / CARGA_F;
  const top = interpolate(p, [0, 1], [SH - H, 0], {...clamp, easing: ease.inOut});
  const blur = interpolate(p, [0, 0.25, 0.8, 1], [6, 26, 18, 0], clamp);
  const barra = interpolate(p, [0, 0.6, 1], [0.08, 0.7, 1], {...clamp, easing: ease.out});
  return (
    <AbsoluteFill style={{background: '#202124'}}>
      <Grabacion desde={S_CARGA} rate={(S_PAGINA - S_CARGA) * 30 / CARGA_F} top={top} blur={blur} />
      <AbsoluteFill style={{background: '#202124', opacity: interpolate(p, [0, 0.2, 0.75, 1], [0.2, 0.55, 0.4, 0], clamp)}} />
      <div style={{position: 'absolute', left: 0, top: 0, height: 10, width: `${barra * 100}%`, background: 'linear-gradient(90deg, #4C8BF5, #8AB4F8)', boxShadow: '0 0 16px rgba(138,180,248,0.8)', opacity: p < 0.97 ? 1 : 0}} />
      <div style={{position: 'absolute', left: W / 2 - 48, top: H / 2 - 48, width: 96, height: 96, borderRadius: 48, border: '9px solid rgba(255,255,255,0.18)', borderTopColor: '#8AB4F8', transform: `rotate(${f * 22}deg)`, opacity: interpolate(p, [0, 0.15, 0.7, 0.9], [0, 1, 1, 0], clamp)}} />
    </AbsoluteFill>
  );
};

/** 3a. La página completa ya cargada (con un leve acercamiento) */
const Pagina: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#202124'}}>
      <Grabacion desde={S_PAGINA} top={0} z={1 + 0.02 * (f / PAGINA_F)} cy={1100} />
    </AbsoluteFill>
  );
};

// párrafo de la visión general por IA (coordenadas de la fuente a partir de 8.5 s)
const PARR = {x0: 22, x1: 1058, y0: 1022, y1: 1590};
const RESALTES = [
  {x0: 806, x1: 1020, y0: 1398, y1: 1450}, // "la primera"
  {x0: 40, x1: 422, y0: 1460, y1: 1514}, // "universidad privada"
];
const ZMAX = 1.08;
const CENTRO_SRC = 1306; // centro vertical del párrafo en la fuente
const CENTRO_OUT = 1090; // a dónde se lleva en el video
/** 3b. Zoom a la visión general por IA con reflector, resaltado amarillo y etiqueta */
const ZoomIA: React.FC = () => {
  const f = useCurrentFrame();
  const k = tw(f, [0, 22], [0, 1], ease.inOut);
  const z = 1.02 + (ZMAX - 1.02) * k;
  // posición: el centro del párrafo pasa de su lugar natural a CENTRO_OUT
  const cy = CENTRO_SRC; // el zoom se hace alrededor del centro del párrafo
  const despl = (CENTRO_OUT - CENTRO_SRC) * k;
  const mapY = (y: number) => (y - cy) * z + cy + despl;
  const mapX = (x: number) => (x - 540) * z + 540;
  const luz = tw(f, [10, 26], [0, 1], ease.out);
  const res = (i: number) => tw(f, [26 + i * 10, 40 + i * 10], [0, 1], ease.out);
  const etiqueta = tw(f, [18, 32], [0, 1], ease.out);
  const pulso = 0.5 + 0.5 * Math.sin(f / 6);
  return (
    <AbsoluteFill style={{background: '#202124', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${despl}px)`}}>
        <Grabacion desde={S_ZOOM} top={0} z={z} cy={cy} />
      </div>
      {/* reflector: oscurece todo menos el párrafo */}
      <div style={{position: 'absolute', left: mapX(PARR.x0), top: mapY(PARR.y0), width: (PARR.x1 - PARR.x0) * z, height: (PARR.y1 - PARR.y0) * z, borderRadius: 28, boxShadow: `0 0 0 3000px rgba(0,0,0,${0.62 * luz})`, border: `4px solid rgba(242,201,76,${luz * (0.6 + 0.4 * pulso)})`}} />
      {/* resaltado: el texto se vuelve amarillo (multiply) y una línea amarilla lo subraya */}
      {RESALTES.map((r, i) => (
        <React.Fragment key={i}>
          <div style={{position: 'absolute', left: mapX(r.x0), top: mapY(r.y0), width: (r.x1 - r.x0) * z * res(i), height: (r.y1 - r.y0) * z, background: AMARILLO, mixBlendMode: 'multiply'}} />
          <div style={{position: 'absolute', left: mapX(r.x0), top: mapY(r.y1) - 2, width: (r.x1 - r.x0) * z * res(i), height: 7, borderRadius: 4, background: AMARILLO, boxShadow: '0 0 14px rgba(242,201,76,0.8)'}} />
        </React.Fragment>
      ))}
      {/* etiqueta */}
      <div style={{position: 'absolute', left: 0, right: 0, top: mapY(PARR.y0) - 190, display: 'flex', justifyContent: 'center', opacity: etiqueta, transform: `translateY(${(1 - etiqueta) * -30}px) scale(${0.9 + 0.1 * etiqueta})`}}>
        <div style={{padding: '22px 44px', borderRadius: 26, background: NAVY, borderBottom: `6px solid ${AMARILLO}`, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', fontFamily: F.sans, fontWeight: 900, fontSize: 58, color: '#fff'}}>
          Hasta <span style={{color: AMARILLO}}>Google</span> lo reconoce
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const BusquedaGoogle: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <Sequence durationInFrames={T_CARGA}>
      <Escritura />
    </Sequence>
    <Sequence from={T_CARGA} durationInFrames={CARGA_F}>
      <Carga />
    </Sequence>
    <Sequence from={T_PAGINA} durationInFrames={PAGINA_F}>
      <Pagina />
    </Sequence>
    <Sequence from={T_ZOOM} durationInFrames={ZOOM_F}>
      <ZoomIA />
    </Sequence>
    {TECLAS.map((t) => (
      <Sfx key={t} at={Math.round((t - S_ESCRIBE) * 30)} name="ref_click" volume={0.4} />
    ))}
    <Sfx at={T_CARGA - 2} name="ref_tap" volume={0.5} />
    <Sfx at={T_CARGA} name="whoosh" volume={0.3} />
    <Sfx at={T_PAGINA} name="ref_digital" volume={0.3} />
    <Sfx at={T_ZOOM + 4} name="whoosh" volume={0.25} />
    <Sfx at={T_ZOOM + 26} name="ding" volume={0.3} />
    <Sfx at={T_ZOOM + 36} name="pop" volume={0.3} />
    <Audio src={staticFile('placa/solace_ext.wav')} volume={(fr) => interpolate(fr, [0, 20, BUSQUEDA_FRAMES - 15, BUSQUEDA_FRAMES], [0, 0.5, 0.5, 0], clamp)} />
  </AbsoluteFill>
);
