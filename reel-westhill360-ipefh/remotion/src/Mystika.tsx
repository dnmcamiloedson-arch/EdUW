import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Sfx} from './shots';
import {F, SAFE_X, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Historia/reel (9:16, 43.5 s): Coordinación de Inclusión en Mystika, un viaje inmersivo espiritual (CDMX).
// Música original mística a 80 BPM (sfx/generar_musica_mistica.py; 1 compás = 90 cuadros):
//   python3 sfx/generar_musica_mistica.py remotion/public/mystika/mistica.wav 2 6 10 12 44
//  1. Intro (2 compases): mariposas monarca y el letrero de la recepción — "Inclusión visitó MYSTIKA".
//  2. Pepe Soho (2): la galería de caballos y su foto — "Creado por el fotógrafo mexicano Pepe Soho".
//  3. Origen (2): la galería — "Nació en Tulum y representó a México en la Expo 2020 Dubái".
//  4. Salas inmersivas (4): flores, bosque, galaxia y estrellas — "Arte, luz, sonido y aromas para sentir México".
//  5. Aprender fuera del aula (2): luces y la puerta de luz.
//  6. Cierre (2.5): el cuarto infinito, "Seguimos construyendo inclusión…", logo y Coordinación de Inclusión.
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

/** Envoltura de texto: entra subiendo y con desenfoque, sale con fundido */
const Aparece: React.FC<{at: number; hasta: number; children: React.ReactNode; dy?: number}> = ({at, hasta, children, dy = 26}) => {
  const f = useCurrentFrame();
  const a = tw(f, [at, at + 16], [0, 1], ease.out);
  const s = tw(f, [hasta - 12, hasta], [0, 1], ease.in);
  return <div style={{opacity: a * (1 - s), transform: `translateY(${(1 - a) * dy}px)`, filter: a < 0.98 ? `blur(${(1 - a) * 8}px)` : undefined}}>{children}</div>;
};

/** Texto con *palabras* en dorado */
const Resalta: React.FC<{texto: string}> = ({texto}) => (
  <>
    {texto.split(' ').map((p, i) => (
      <span key={i} style={{color: p.startsWith('*') ? ORO : undefined}}>{(p.startsWith('*') ? p.slice(1) : p) + ' '}</span>
    ))}
  </>
);

const Bloque: React.FC<{top: number; children: React.ReactNode}> = ({top, children}) => (
  <div style={{position: 'absolute', left: 70, right: 70, top, textAlign: 'center', color: '#fff'}}>{children}</div>
);

// ---------------------------------------------------------------------------
// Textos por segmento
// ---------------------------------------------------------------------------
const TextoIntro: React.FC = () => {
  const f = useCurrentFrame();
  const letras = 'MYSTIKA'.split('');
  return (
    <Bloque top={330}>
      <Aparece at={10} hasta={172}>
        <div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 46, letterSpacing: 6, textShadow: sombra}}>INCLUSIÓN VISITÓ</div>
      </Aparece>
      <div style={{marginTop: 10, fontFamily: F.clasica, fontWeight: 700, fontSize: 150, letterSpacing: 16, color: ORO, textShadow: brillo}}>
        {letras.map((l, i) => {
          const q = tw(f, [22 + i * 4, 40 + i * 4], [0, 1], ease.out);
          const s = tw(f, [160, 172], [0, 1], ease.in);
          return (
            <span key={i} style={{display: 'inline-block', opacity: q * (1 - s), filter: q < 0.98 ? `blur(${(1 - q) * 10}px)` : undefined, transform: `translateY(${(1 - q) * 20}px)`}}>
              {l}
            </span>
          );
        })}
      </div>
      <Aparece at={58} hasta={172}>
        <div style={{marginTop: 6, fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 52, textShadow: sombra}}>Un viaje inmersivo espiritual</div>
      </Aparece>
    </Bloque>
  );
};

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
      <Bloque top={1260}>
        <Aparece at={26} hasta={176}>
          <div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 46, textShadow: sombra}}>Creado por el fotógrafo mexicano</div>
        </Aparece>
        <Aparece at={38} hasta={176}>
          <div style={{marginTop: 8, fontFamily: F.clasica, fontWeight: 700, fontSize: 116, letterSpacing: 8, color: ORO, textShadow: brillo}}>PEPE SOHO</div>
        </Aparece>
      </Bloque>
    </>
  );
};

const TextoOrigen: React.FC = () => (
  <Bloque top={1200}>
    <Aparece at={10} hasta={176}>
      <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 60, lineHeight: 1.2, textShadow: sombra}}>
        <Resalta texto="Nació en *Tulum" />
      </div>
    </Aparece>
    <Aparece at={30} hasta={176}>
      <div style={{marginTop: 14, fontFamily: F.sans, fontWeight: 700, fontSize: 50, lineHeight: 1.25, textShadow: sombra}}>
        <Resalta texto="y representó a *México en la" />
      </div>
      <div style={{marginTop: 4, fontFamily: F.clasica, fontWeight: 700, fontSize: 76, letterSpacing: 4, color: ORO, textShadow: brillo}}>EXPO 2020 DUBÁI</div>
    </Aparece>
  </Bloque>
);

const TextoSentir: React.FC = () => {
  const f = useCurrentFrame();
  const palabras = ['Arte,', 'luz,', 'sonido', 'y aromas'];
  return (
    <Bloque top={1220}>
      <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 64, textShadow: sombra}}>
        {palabras.map((p, i) => {
          const q = tw(f, [10 + i * 14, 26 + i * 14], [0, 1], ease.out);
          const s = tw(f, [300, 316], [0, 1], ease.in);
          return (
            <span key={i} style={{display: 'inline-block', marginRight: 16, opacity: q * (1 - s), transform: `translateY(${(1 - q) * 20}px)`, filter: q < 0.98 ? `blur(${(1 - q) * 8}px)` : undefined}}>
              {p}
            </span>
          );
        })}
      </div>
      <Aparece at={74} hasta={316}>
        <div style={{marginTop: 12, fontFamily: F.sans, fontWeight: 700, fontSize: 44, textShadow: sombra}}>para</div>
        <div style={{fontFamily: F.clasica, fontWeight: 700, fontSize: 112, letterSpacing: 8, color: ORO, textShadow: brillo, lineHeight: 1.05}}>SENTIR MÉXICO</div>
      </Aparece>
    </Bloque>
  );
};

const TextoAprender: React.FC = () => {
  const f = useCurrentFrame();
  const verbos = ['observar', 'imaginar', 'sorprenderse'];
  return (
    <Bloque top={1180}>
      <Aparece at={8} hasta={176}>
        <div style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 70, textShadow: sombra}}>Aprender fuera del aula</div>
      </Aparece>
      <div style={{marginTop: 22}}>
        {verbos.map((v, i) => {
          const q = tw(f, [40 + i * 22, 58 + i * 22], [0, 1], ease.out);
          const s = tw(f, [164, 176], [0, 1], ease.in);
          return (
            <div key={v} style={{fontFamily: F.clasica, fontWeight: 700, fontSize: 70, letterSpacing: 6, lineHeight: 1.15, color: i === 2 ? ORO : '#fff', textShadow: i === 2 ? brillo : sombra, opacity: q * (1 - s), transform: `translateY(${(1 - q) * 20}px)`, filter: q < 0.98 ? `blur(${(1 - q) * 8}px)` : undefined}}>
              {v.toUpperCase()}
            </div>
          );
        })}
      </div>
    </Bloque>
  );
};

const Cierre: React.FC = () => {
  const f = useCurrentFrame();
  const oscuro = tw(f, [0, 30], [0, 1]);
  const logo = tw(f, [92, 112], [0, 1], ease.out);
  const coord = tw(f, [104, 124], [0, 1], ease.out);
  const negro = tw(f, [210, 225], [0, 1]);
  return (
    <>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, rgba(10,6,30,${0.35 * oscuro}) 0%, rgba(6,4,20,${0.75 * oscuro}) 80%)`}} />
      <Bloque top={560}>
        <Aparece at={14} hasta={240}>
          <div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 50, textShadow: sombra}}>Seguimos construyendo</div>
        </Aparece>
        <Aparece at={26} hasta={240}>
          <div style={{marginTop: 6, fontFamily: F.clasica, fontWeight: 700, fontSize: 120, letterSpacing: 8, color: ORO, textShadow: brillo}}>INCLUSIÓN</div>
        </Aparece>
        <Aparece at={44} hasta={240}>
          <div style={{marginTop: 6, fontFamily: F.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 52, textShadow: sombra}}>a través del arte y la cultura</div>
        </Aparece>
      </Bloque>
      <Img src={LOGO} style={{position: 'absolute', left: W / 2 - 210, top: 1240, width: 420, opacity: logo, transform: `translateY(${(1 - logo) * 24}px)`, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1450, textAlign: 'center', opacity: coord, transform: `translateY(${(1 - coord) * 16}px)`}}>
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
