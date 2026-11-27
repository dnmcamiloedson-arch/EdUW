import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Sfx} from './shots';
import {F, SAFE_X, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Historia/reel (9:16, 43.5 s): Coordinación de Inclusión en Mystika, un viaje inmersivo espiritual (CDMX).
// Música original mística a 80 BPM (sfx/generar_musica_mistica.py; 1 compás = 90 cuadros):
//   python3 sfx/generar_musica_mistica.py remotion/public/mystika/mistica.wav 2 6 10 12 44
//  1. Intro (2 compases): mariposas — "Hay lugares que no se visitan… SE SIENTEN"; recepción — "Inclusión vivió MYSTIKA".
//  2. Pepe Soho (2): galería de caballos y su foto — "El legado del fotógrafo mexicano PEPE SOHO…".
//  3. Origen (2): "Nació en Tulum. Llegó hasta la Expo 2020 Dubái. Y ahora, lo vivimos NOSOTROS".
//  4. Salas (4): "Recorrimos México con todos los sentidos" + una palabra por toma (naturaleza, bosques…).
//  5. Aprender (2): "Por un día, el aula fue LUZ · SONIDO · ASOMBRO".
//  6. Cierre (2.5): "Porque la INCLUSIÓN también se vive, se siente y se comparte", logo y Coordinación de Inclusión.
// Entre tomas, fundidos con un destello suave. El banderín UW va arriba a la derecha toda la historia.
// Datos verificados en prensa (Milenio, La Jornada, Crónica): Pepe Soho (†2025) creó Mystika en Tulum y la
// presentó en el Pabellón de México de la Expo 2020 Dubái. Clips de WhatsApp en public/proxies/mystika (m*.mp4,
// reescalados a 1080x1920); m1/m2 y la foto del grupo son de otra visita (13 nov) y no se usan.
// ---------------------------------------------------------------------------
const W = 1080;
const H = 1920;
const COMPAS = 90;
const XF = 18; // fundido entre tomas
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ORO = '#E9C978';
const VIOLETA = '#B9A2FF';
const LOGO = staticFile('logos/logo_westhill_blanco_total.png');
const m = (n: number) => staticFile(`proxies/mystika/m${n}.mp4`);

type Toma = {n: number; desde: number; dur: number; rate?: number; z0?: number; z1?: number};
const SEGMENTOS: {id: string; tomas: Toma[]}[] = [
  {id: 'intro', tomas: [{n: 10, desde: 1.0, dur: 90, z0: 1.12, z1: 1.04}, {n: 5, desde: 1.7, dur: 90, rate: 0.95}]},
  {id: 'pepe', tomas: [{n: 4, desde: 1.0, dur: 180, rate: 0.95}]},
  {id: 'origen', tomas: [{n: 3, desde: 0.2, dur: 180, rate: 0.95}]},
  {id: 'sentir', tomas: [{n: 7, desde: 1.5, dur: 90}, {n: 12, desde: 0.2, dur: 90}, {n: 9, desde: 1.0, dur: 90}, {n: 8, desde: 0.6, dur: 90}]},
  {id: 'aprender', tomas: [{n: 6, desde: 1.0, dur: 90}, {n: 14, desde: 15.0, dur: 90}]},
  {id: 'cierre', tomas: [{n: 16, desde: 8.0, dur: 225, z0: 1.15, z1: 1.0}]},
];
const INICIO: Record<string, number> = {};
let acum = 0;
const TOMAS_ABS: (Toma & {from: number})[] = [];
for (const s of SEGMENTOS) {
  INICIO[s.id] = acum;
  for (const t of s.tomas) {
    TOMAS_ABS.push({...t, from: acum});
    acum += t.dur;
  }
}
export const MYSTIKA_FRAMES = acum; // 1305

const hh = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ---------------------------------------------------------------------------
// Piezas
// ---------------------------------------------------------------------------
const Clip: React.FC<{t: Toma; entra: boolean}> = ({t, entra}) => {
  const f = useCurrentFrame();
  const total = t.dur + (entra ? XF : 0);
  const z0 = t.z0 ?? 1.0;
  const z1 = t.z1 ?? 1.07;
  const z = z0 + (z1 - z0) * (f / total);
  const o = entra ? tw(f, [0, XF], [0, 1], ease.inOut) : 1;
  return (
    <AbsoluteFill style={{opacity: o, overflow: 'hidden'}}>
      <OffthreadVideo src={m(t.n)} startFrom={Math.round(t.desde * 30)} playbackRate={t.rate ?? 1} muted style={{width: W, height: H, objectFit: 'cover', transform: `scale(${z})`, filter: 'saturate(1.12) contrast(1.06)'}} />
    </AbsoluteFill>
  );
};

/** Destello suave en cada cambio de toma */
const Destello: React.FC = () => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, XF / 2, XF], [0, 1, 0], clamp);
  return <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, rgba(255,240,220,${0.32 * p}) 0%, rgba(185,162,255,${0.18 * p}) 45%, rgba(0,0,0,0) 75%)`, mixBlendMode: 'screen'}} />;
};

/** Partículas de luz que flotan */
const Particulas: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {Array.from({length: 42}).map((_, i) => {
        const x = hh(i) * W + Math.sin(f / (40 + hh(i + 3) * 40) + i) * 30;
        const y = ((hh(i + 7) * H - f * (0.6 + hh(i + 11) * 1.4)) % H + H) % H;
        const r = 2 + hh(i + 5) * 5;
        const a = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(f / 12 + i * 1.7));
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: r * 2, height: r * 2, borderRadius: '50%', background: i % 3 === 0 ? VIOLETA : '#FFF4DA', opacity: a, boxShadow: `0 0 ${r * 4}px ${r}px rgba(255,236,200,0.5)`}} />;
      })}
    </AbsoluteFill>
  );
};

const Banderin: React.FC = () => {
  const f = useCurrentFrame();
  const p = tw(f, [0, 20], [0, 1]);
  const sale = tw(f, [MYSTIKA_FRAMES - 20, MYSTIKA_FRAMES - 6], [0, 1]);
  return (
    <div style={{position: 'absolute', right: SAFE_X, top: 130, width: 150, opacity: p * (1 - sale), transform: `translateY(${(1 - p) * -30}px)`, filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.35))'}}>
      <Img src={staticFile('logos/banderin_uw.png')} style={{width: '100%', display: 'block'}} />
    </div>
  );
};

const brillo = '0 0 18px rgba(233,201,120,0.55), 0 6px 26px rgba(0,0,0,0.75)';
const sombra = '0 4px 22px rgba(0,0,0,0.85)';

const Bloque: React.FC<{top: number; children: React.ReactNode}> = ({top, children}) => (
  <div style={{position: 'absolute', left: 70, right: 70, top, textAlign: 'center', color: '#fff'}}>{children}</div>
);

// ---------------------------------------------------------------------------
// Textos por segmento (narrativos: cuentan el viaje en lugar de solo informar)
// ---------------------------------------------------------------------------
/** Frase que aparece palabra por palabra (con desenfoque); las palabras con * van en dorado */
const Frase: React.FC<{texto: string; at: number; hasta: number; estilo: React.CSSProperties; paso?: number}> = ({texto, at, hasta, estilo, paso = 4}) => {
  const f = useCurrentFrame();
  const s = tw(f, [hasta - 12, hasta], [0, 1], ease.in);
  return (
    <div style={estilo}>
      {texto.split(' ').map((p, i) => {
        const q = tw(f, [at + i * paso, at + i * paso + 16], [0, 1], ease.out);
        const oro = p.startsWith('*');
        return (
          <span key={i} style={{display: 'inline-block', marginRight: '0.26em', opacity: q * (1 - s), transform: `translateY(${(1 - q) * 18}px)`, filter: q < 0.98 ? `blur(${(1 - q) * 9}px)` : undefined, color: oro ? ORO : undefined, textShadow: oro ? brillo : undefined}}>
            {oro ? p.slice(1) : p}
          </span>
        );
      })}
    </div>
  );
};

/** Palabra grande en Cinzel dorado; se encoge si es larga */
const Grande: React.FC<{texto: string; at: number; hasta: number; max?: number}> = ({texto, at, hasta, max = 124}) => {
  const f = useCurrentFrame();
  const a = tw(f, [at, at + 20], [0, 1], ease.out);
  const s = tw(f, [hasta - 12, hasta], [0, 1], ease.in);
  const size = Math.min(max, 940 / (texto.length * 0.82));
  return (
    <div style={{fontFamily: F.clasica, fontWeight: 700, fontSize: size, letterSpacing: size * 0.08, lineHeight: 1.05, color: ORO, textShadow: brillo, opacity: a * (1 - s), transform: `scale(${1.08 - 0.08 * a})`, filter: a < 0.98 ? `blur(${(1 - a) * 12}px)` : undefined}}>
      {texto}
    </div>
  );
};

/** Línea dorada fina que se dibuja (adorno) */
const Linea: React.FC<{at: number; hasta: number}> = ({at, hasta}) => {
  const f = useCurrentFrame();
  const a = tw(f, [at, at + 20], [0, 1], ease.inOut);
  const s = tw(f, [hasta - 12, hasta], [0, 1], ease.in);
  return <div style={{margin: '18px auto', width: 220 * a, height: 2, background: `linear-gradient(90deg, rgba(233,201,120,0), ${ORO}, rgba(233,201,120,0))`, opacity: 1 - s}} />;
};

const SERIF: React.CSSProperties = {fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 64, lineHeight: 1.2, textShadow: sombra};
const SANS: React.CSSProperties = {fontFamily: F.sans, fontWeight: 700, fontSize: 48, lineHeight: 1.25, textShadow: sombra};
const SANS_SM: React.CSSProperties = {fontFamily: F.sans, fontWeight: 700, fontSize: 40, letterSpacing: 6, textShadow: sombra};

// 1. Intro: el gancho poético sobre las mariposas y el nombre sobre la recepción
const TextoIntro: React.FC = () => (
  <>
    <Bloque top={330}>
      <Frase texto="Hay lugares que no se visitan…" at={6} hasta={92} estilo={SERIF} />
      <Grande texto="SE SIENTEN" at={40} hasta={92} />
    </Bloque>
    <Bloque top={1260}>
      <Frase texto="INCLUSIÓN VIVIÓ" at={96} hasta={178} estilo={SANS_SM} paso={6} />
      <Grande texto="MYSTIKA" at={104} hasta={178} max={150} />
      <Frase texto="un viaje inmersivo espiritual" at={124} hasta={178} estilo={{...SERIF, fontSize: 52}} paso={3} />
    </Bloque>
  </>
);

// 2. El legado de Pepe Soho
const TextoPepe: React.FC = () => {
  const f = useCurrentFrame();
  const foto = tw(f, [8, 30], [0, 1], ease.out);
  const sale = tw(f, [166, 180], [0, 1], ease.in);
  return (
    <>
      <div style={{position: 'absolute', left: 80, right: 80, top: 360, opacity: foto * (1 - sale), transform: `translateY(${(1 - foto) * 40}px) scale(${0.96 + 0.04 * foto + 0.02 * (f / 180)})`}}>
        <div style={{borderRadius: 16, overflow: 'hidden', border: `3px solid ${ORO}`, boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 40px rgba(233,201,120,0.25)'}}>
          <Img src={staticFile('mystika/pepe_soho.jpg')} style={{width: '100%', display: 'block'}} />
        </div>
      </div>
      <Bloque top={1180}>
        <Frase texto="El legado del fotógrafo mexicano" at={24} hasta={176} estilo={SERIF} paso={3} />
        <Grande texto="PEPE SOHO" at={44} hasta={176} />
        <Linea at={60} hasta={176} />
        <Frase texto="convertido en luz, sonido y naturaleza" at={70} hasta={176} estilo={{...SANS, fontSize: 42}} paso={3} />
      </Bloque>
    </>
  );
};

// 3. Origen: tres golpes que se van sumando
const TextoOrigen: React.FC = () => (
  <Bloque top={1130}>
    <Frase texto="Nació en *Tulum." at={8} hasta={176} estilo={{...SANS, fontSize: 62, fontWeight: 800}} />
    <Frase texto="Llegó hasta la *Expo *2020 *Dubái." at={52} hasta={176} estilo={{...SANS, fontSize: 48, fontWeight: 800, marginTop: 14}} />
    <Linea at={96} hasta={176} />
    <Frase texto="Y ahora, lo vivimos" at={104} hasta={176} estilo={SERIF} />
    <Grande texto="NOSOTROS" at={124} hasta={176} />
  </Bloque>
);

// 4. Salas: una palabra por toma
const SALAS: [string, string][] = [
  ['Su', 'NATURALEZA'],
  ['Sus', 'BOSQUES'],
  ['Su', 'MISTICISMO'],
  ['Sus', 'ESTRELLAS'],
];
const TextoSentir: React.FC = () => (
  <>
    <Bloque top={360}>
      <Frase texto="Recorrimos *México con todos los sentidos" at={8} hasta={352} estilo={{...SANS, fontSize: 46}} paso={3} />
    </Bloque>
    {SALAS.map(([art, sala], i) => (
      <Bloque key={sala} top={1300}>
        <Frase texto={art} at={i * 90 + 10} hasta={i * 90 + 92} estilo={{...SERIF, fontSize: 56}} />
        <Grande texto={sala} at={i * 90 + 16} hasta={i * 90 + 92} />
      </Bloque>
    ))}
  </>
);

// 5. Aprender fuera del aula
const TextoAprender: React.FC = () => {
  const f = useCurrentFrame();
  const palabras = ['LUZ', 'SONIDO', 'ASOMBRO'];
  return (
    <Bloque top={1160}>
      <Frase texto="Por un día, el aula fue" at={8} hasta={176} estilo={SERIF} />
      <div style={{marginTop: 16}}>
        {palabras.map((p, i) => {
          const q = tw(f, [40 + i * 24, 60 + i * 24], [0, 1], ease.out);
          const s = tw(f, [164, 176], [0, 1], ease.in);
          return (
            <div key={p} style={{fontFamily: F.clasica, fontWeight: 700, fontSize: 92, letterSpacing: 10, lineHeight: 1.1, color: i === 2 ? ORO : '#fff', textShadow: i === 2 ? brillo : sombra, opacity: q * (1 - s), transform: `scale(${1.1 - 0.1 * q})`, filter: q < 0.98 ? `blur(${(1 - q) * 10}px)` : undefined}}>
              {p}
            </div>
          );
        })}
      </div>
    </Bloque>
  );
};

// 6. Cierre
const Cierre: React.FC = () => {
  const f = useCurrentFrame();
  const oscuro = tw(f, [0, 30], [0, 1]);
  const logo = tw(f, [104, 124], [0, 1], ease.out);
  const coord = tw(f, [116, 136], [0, 1], ease.out);
  const negro = tw(f, [210, 225], [0, 1]);
  return (
    <>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, rgba(10,6,30,${0.35 * oscuro}) 0%, rgba(6,4,20,${0.75 * oscuro}) 80%)`}} />
      <Bloque top={470}>
        <Frase texto="Porque la" at={10} hasta={240} estilo={SERIF} />
        <Grande texto="INCLUSIÓN" at={22} hasta={240} />
        <Frase texto="también se vive," at={44} hasta={240} estilo={{...SANS, fontSize: 54}} />
        <Frase texto="se siente" at={60} hasta={240} estilo={{...SANS, fontSize: 54}} />
        <Frase texto="y se *comparte." at={76} hasta={240} estilo={{...SANS, fontSize: 54}} />
      </Bloque>
      <Img src={LOGO} style={{position: 'absolute', left: W / 2 - 210, top: 1290, width: 420, opacity: logo, transform: `translateY(${(1 - logo) * 24}px)`, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1500, textAlign: 'center', opacity: coord, transform: `translateY(${(1 - coord) * 16}px)`}}>
        <div style={{display: 'inline-block', width: 120, height: 2, background: ORO, marginBottom: 18, opacity: 0.8}} />
        <div style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 56, color: ORO, textShadow: sombra}}>Coordinación de Inclusión</div>
      </div>
      <AbsoluteFill style={{background: '#000', opacity: negro}} />
    </>
  );
};

const TEXTOS: Record<string, React.FC> = {intro: TextoIntro, pepe: TextoPepe, origen: TextoOrigen, sentir: TextoSentir, aprender: TextoAprender, cierre: Cierre};

// ---------------------------------------------------------------------------
// Composición
// ---------------------------------------------------------------------------
export const Mystika: React.FC<{music?: boolean}> = ({music = true}) => (
  <AbsoluteFill style={{background: '#05030C'}}>
    {TOMAS_ABS.map((t, i) => {
      const entra = i > 0;
      const from = entra ? t.from - XF : t.from;
      return (
        <Sequence key={`${t.n}-${i}`} from={from} durationInFrames={t.dur + (entra ? XF : 0)}>
          <Clip t={t} entra={entra} />
        </Sequence>
      );
    })}
    {/* gradación: viñeta y velo violeta, y sombra abajo para los textos */}
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 45%, rgba(8,4,24,0.55) 100%)'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,4,24,0.35) 0%, rgba(8,4,24,0) 18%, rgba(8,4,24,0) 50%, rgba(8,4,24,0.72) 100%)'}} />
    <AbsoluteFill style={{background: 'rgba(120,90,255,0.06)', mixBlendMode: 'screen'}} />
    {TOMAS_ABS.slice(1).map((t, i) => (
      <Sequence key={`d${i}`} from={t.from - XF} durationInFrames={XF}>
        <Destello />
      </Sequence>
    ))}
    <Particulas />
    {SEGMENTOS.map((s) => {
      const T = TEXTOS[s.id];
      const dur = s.tomas.reduce((a, t) => a + t.dur, 0);
      return (
        <Sequence key={s.id} from={INICIO[s.id]} durationInFrames={dur}>
          <T />
        </Sequence>
      );
    })}
    <Banderin />

    {/* efectos: barridos suaves en los cambios de sección */}
    {['pepe', 'origen', 'sentir', 'aprender', 'cierre'].map((id) => (
      <Sfx key={id} at={INICIO[id] - 12} name="whoosh" volume={0.16} />
    ))}
    {music && <Audio src={staticFile('mystika/mistica.wav')} volume={(fr) => interpolate(fr, [0, 10, MYSTIKA_FRAMES - 25, MYSTIKA_FRAMES], [0, 0.7, 0.7, 0], clamp)} />}
  </AbsoluteFill>
);
