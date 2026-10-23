import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Sfx} from './shots';
import {C, F, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Día del Médico (23 de octubre): story animada a partir de las capas del banner del cliente.
// Entra la frase sola, grande al centro; luego se acomoda y se arma el banner completo
// (cinta, título, lince, ondas, dibujos, destellos, logo y fecha). Las capas vienen en
// public/photos/medico (scripts/capas_medico.py las escala a 1080x1920 y separa las piezas).
// ---------------------------------------------------------------------------
export const MEDICO_FRAMES = 330;
const src = (n: string) => staticFile(`photos/medico/${n}.png`);

/** Capa completa (1080x1920), opcionalmente recortada a una franja horizontal */
const Layer: React.FC<{n: string; band?: [number, number]; style?: React.CSSProperties}> = ({n, band, style}) => (
  <AbsoluteFill style={{clipPath: band ? `inset(${band[0]}px 0 ${1920 - band[1]}px 0)` : undefined, ...style}}>
    <Img src={src(n)} style={{width: 1080, height: 1920}} />
  </AbsoluteFill>
);

type Box = {x: number; y: number; w: number; h: number};
/** Pieza suelta (destello, dibujo, onda) en su posición del banner */
const Piece: React.FC<{n: string; b: Box; style?: React.CSSProperties}> = ({n, b, style}) => (
  <Img src={src(n)} style={{position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, ...style}} />
);

// Posiciones medidas por capas_medico.py (piezas.json)
const DESTELLO: Record<string, Box> = {
  verdeArriba: {x: 762, y: 218, w: 102, h: 104},
  rayosTitulo: {x: 561, y: 365, w: 109, h: 134},
  rayosDerecha: {x: 973, y: 592, w: 96, h: 111},
  subrayado: {x: 77, y: 938, w: 294, h: 91},
  rayosAzules: {x: 285, y: 1053, w: 92, h: 98},
  verdeAbajo: {x: 139, y: 1180, w: 102, h: 105},
};
const PIEZA_N: Record<string, number> = {verdeArriba: 0, rayosTitulo: 1, rayosDerecha: 2, subrayado: 3, rayosAzules: 4, verdeAbajo: 5};
const DIBUJO: Box[] = [
  {x: 845, y: 94, w: 235, h: 414}, // estetoscopio
  {x: 899, y: 704, w: 181, h: 180}, // corazón con electro
  {x: 174, y: 1050, w: 204, h: 170}, // corazón chico
];
const ONDA: Box[] = [
  {x: 0, y: 872, w: 206, h: 687}, // izquierda
  {x: 1034, y: 1445, w: 46, h: 264}, // orilla derecha
  {x: 0, y: 1583, w: 1080, h: 337}, // inferior
];

/** La capa del lince viene con otro encuadre: se escala y mueve para que quede como en el banner */
const LINCE = {s: 0.79, x: 308, y: 291}; // x +80 para que la cinta de "Médico" no le tape la cara

// Renglones de la frase (y de la capa a 1080x1920)
const RENGLONES: [number, number][] = [
  [722, 781],
  [781, 836],
  [836, 893],
  [893, 950],
];
const R_START = [12, 26, 40, 60];
const FRASE_C = {x: 290, y: 835}; // centro de la frase en el banner
const INTRO_S = 1.75; // escala de la frase sola al centro

// Tiempos del armado
const T = {
  acomoda: 100,
  subrayado: 126,
  dia: 128,
  cinta: 134,
  medico: 148,
  ondas: 150,
  lince: 160,
  dibujos: 188,
  destellos: 200,
  logo: 206,
  fecha: 222,
};

/** Línea de electrocardiograma que se dibuja bajo la frase en la entrada */
const Electro: React.FC = () => {
  const f = useCurrentFrame();
  const p = tw(f, [66, 96], [0, 1], ease.inOut);
  const o = tw(f, [T.acomoda, T.acomoda + 14], [1, 0]);
  return (
    <svg width={1080} height={200} style={{position: 'absolute', left: 0, top: 1110, opacity: o}}>
      <path
        d="M120 100 L430 100 L465 100 L490 40 L520 165 L548 70 L568 100 L640 100 L960 100"
        fill="none"
        stroke={C.azulClaro}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - p}
        opacity={0.75}
      />
    </svg>
  );
};

const Frase: React.FC = () => {
  const f = useCurrentFrame();
  const k = 1 - tw(f, [T.acomoda, T.acomoda + 28], [0, 1], ease.inOut); // 1 = grande al centro, 0 = en su lugar
  const s = 1 + (INTRO_S - 1) * k;
  return (
    <AbsoluteFill style={{transformOrigin: `${FRASE_C.x}px ${FRASE_C.y}px`, transform: `translate(${(540 - FRASE_C.x) * k}px, ${(880 - FRASE_C.y) * k}px) scale(${s})`}}>
      {RENGLONES.map((band, i) => {
        const p = tw(f, [R_START[i], R_START[i] + 16], [0, 1]);
        return (
          <AbsoluteFill key={i} style={{clipPath: `inset(${band[0]}px 0 ${1920 - band[1]}px 0)`}}>
            <AbsoluteFill style={{transform: `translateY(${(1 - p) * (band[1] - band[0])}px)`, filter: `blur(${(1 - p) * 6}px)`}}>
              <Layer n="frase" band={band} />
            </AbsoluteFill>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

const Destello: React.FC<{name: string; at: number}> = ({name, at}) => {
  const f = useCurrentFrame();
  const p = tw(f, [at, at + 14], [0, 1], ease.back);
  const twinkle = 1 + 0.1 * Math.sin((f - at) / 7) * (f > at + 14 ? 1 : 0);
  return <Piece n={`destellos_${PIEZA_N[name]}`} b={DESTELLO[name]} style={{transform: `scale(${p * twinkle}) rotate(${(1 - p) * -70}deg)`, opacity: Math.min(1, p * 2)}} />;
};

export const DiaMedico: React.FC<{music?: boolean}> = ({music = true}) => {
  const f = useCurrentFrame();
  const push = 1 + 0.025 * tw(f, [T.ondas, MEDICO_FRAMES], [0, 1], ease.inOut);
  const sub = tw(f, [T.subrayado, T.subrayado + 18], [0, 100], ease.inOut);
  const dia = tw(f, [T.dia, T.dia + 16], [0, 1]);
  const cinta = tw(f, [T.cinta, T.cinta + 16], [0, 100], ease.inOut);
  const medico = tw(f, [T.medico, T.medico + 14], [0, 1], ease.back);
  const lince = tw(f, [T.lince, T.lince + 30], [0, 1]);
  const respira = 3 * Math.sin(f / 18);
  const esteto = tw(f, [T.dibujos, T.dibujos + 22], [0, 100], ease.inOut);
  const logo = tw(f, [T.logo, T.logo + 18], [0, 1]);
  const fecha = tw(f, [T.fecha, T.fecha + 16], [0, 1], ease.inOut);
  return (
    <AbsoluteFill style={{background: '#FBF9F5'}}>
      <AbsoluteFill style={{transform: `scale(${push})`}}>
        <Layer n="fondo" />
        <Layer n="trama" style={{opacity: interpolate(f, [0, 20, T.ondas, T.ondas + 30], [0, 0.35, 0.35, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}} />

        {/* dibujos azules del fondo */}
        <Piece n="dibujos_0" b={DIBUJO[0]} style={{clipPath: `inset(0 0 ${100 - esteto}% 0)`}} />
        {[1, 2].map((i) => {
          const p = tw(f, [T.dibujos + 8 + (i - 1) * 8, T.dibujos + 22 + (i - 1) * 8], [0, 1], ease.back);
          return <Piece key={i} n={`dibujos_${i}`} b={DIBUJO[i]} style={{transform: `scale(${p})`, opacity: Math.min(1, p * 2)}} />;
        })}

        {/* onda izquierda (detrás de la cola) */}
        <Piece n="ondas_0" b={ONDA[0]} style={{transform: `translateX(${-230 * (1 - tw(f, [T.ondas + 6, T.ondas + 30], [0, 1]))}px)`}} />

        {/* rayos de la derecha: detrás del lince para no cruzarle la cara */}
        <Destello name="rayosDerecha" at={T.destellos + 6} />

        {/* lince */}
        <Layer n="lince" style={{transformOrigin: '0 0', transform: `translate(${LINCE.x + (1 - lince) * 620}px, ${LINCE.y + respira}px) scale(${LINCE.s})`, opacity: Math.min(1, lince * 3)}} />

        {/* ondas de abajo, delante del lince como en el banner */}
        <Piece n="ondas_1" b={ONDA[1]} style={{transform: `translateX(${60 * (1 - tw(f, [T.ondas + 10, T.ondas + 30], [0, 1]))}px)`}} />
        <Piece n="ondas_2" b={ONDA[2]} style={{transform: `translateY(${360 * (1 - tw(f, [T.ondas, T.ondas + 26], [0, 1]))}px)`}} />

        {/* título: cinta rasgada, "Día del" y "Médico" */}
        <Layer n="cinta" style={{clipPath: `inset(0 ${100 - cinta}% 0 0)`, transformOrigin: '22px 570px', transform: `rotate(${(1 - cinta / 100) * -3}deg)`}} />
        <Layer n="titulo" band={[300, 480]} style={{transform: `translateY(${(1 - dia) * -70}px)`, opacity: dia, filter: `blur(${(1 - dia) * 8}px)`}} />
        <Layer n="titulo" band={[490, 670]} style={{transformOrigin: '370px 575px', transform: `scale(${0.6 + 0.4 * medico})`, opacity: Math.min(1, medico * 2)}} />

        {/* frase + subrayado */}
        <Frase />
        <Piece n="destellos_3" b={DESTELLO.subrayado} style={{clipPath: `inset(0 ${100 - sub}% 0 0)`}} />

        {/* destellos */}
        <Destello name="rayosTitulo" at={T.medico + 6} />
        <Destello name="verdeArriba" at={T.destellos} />
        <Destello name="rayosAzules" at={T.destellos + 12} />
        <Destello name="verdeAbajo" at={T.destellos + 18} />

        {/* logo y fecha */}
        <div style={{position: 'absolute', left: 360, top: 80, width: 360, clipPath: `inset(${(1 - logo) * 100}% 0 0 0)`, transform: `translateY(${(1 - logo) * 24}px)`}}>
          <Img src={staticFile('logos/logo_westhill_sin_blanco.png')} style={{width: '100%'}} />
        </div>
        <div style={{position: 'absolute', top: 244, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22}}>
          <div style={{width: 70 * fecha, height: 4, borderRadius: 2, background: C.amarillo}} />
          <div style={{fontFamily: F.sans, fontWeight: 500, fontSize: 30, letterSpacing: 6, color: '#1F4F86', opacity: fecha}}>23 DE OCTUBRE</div>
          <div style={{width: 70 * fecha, height: 4, borderRadius: 2, background: C.amarillo}} />
        </div>
      </AbsoluteFill>

      <Electro />

      {/* sonido */}
      {R_START.map((s) => (
        <Sfx key={s} at={s} name="pop" volume={0.35} />
      ))}
      <Sfx at={78} name="beep_monitor" volume={0.45} />
      <Sfx at={T.acomoda} name="whoosh" volume={0.45} />
      <Sfx at={T.dia} name="swipe" volume={0.4} />
      <Sfx at={T.cinta} name="hist_paper" volume={0.7} />
      <Sfx at={T.medico} name="pop" volume={0.6} />
      <Sfx at={T.lince} name="whoosh_largo" volume={0.45} />
      <Sfx at={T.ondas} name="swipe" volume={0.35} />
      <Sfx at={T.dibujos} name="taps" volume={0.3} />
      {[T.destellos, T.destellos + 12].map((s) => (
        <Sfx key={s} at={s} name="flicker" volume={0.3} />
      ))}
      <Sfx at={T.logo} name="click" volume={0.35} />
      <Sfx at={T.fecha} name="ding" volume={0.35} />
      {music && (
        <Audio
          src={staticFile('music/dia_medico.mp3')}
          volume={(fr) => interpolate(fr, [0, 10, MEDICO_FRAMES - 30, MEDICO_FRAMES], [0, 0.5, 0.5, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
        />
      )}
    </AbsoluteFill>
  );
};
