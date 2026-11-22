import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from './components';
import {Sfx} from './shots';
import {F, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// Anuncio para pauta (9:16, 24 s): develación de las placas COMAEM en la Facultad de Medicina.
// Objetivo: venta (aspirantes a Médico Cirujano). Quien lo ve no sabe qué es COMAEM, así que se explica con lo
// que significa para el estudiante, con la línea gráfica de las cápsulas del cliente (azul marino, amarillo, verde).
//  0.0  gancho: "¿Vas a estudiar Medicina?" sobre la develación de la placa
//  2.0  drop: la placa de Distinción de Excelencia, "el máximo reconocimiento a la calidad de la educación médica"
//  5.0  "la única universidad privada en recibirlo" (dato que dio el equipo de la universidad)
//  7.0  qué significa para ti: tres tarjetas
// 13.0  el Dr. Asisclo: "Estas placas les pertenecen a todos ustedes." (la música respira)
// 17.0  vigente hasta 2031
// 20.0  cierre de venta: "Tu vocación merece excelencia" + Solicita información
// Música original (sfx/generar_musica.py, 120 BPM, 1 tiempo = 15 cuadros); textos siempre en pantalla (se ve sin
// sonido). Material en public/proxies/placa y public/placa (scripts/placa_preparar.py).
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
export const PLACA_FRAMES = 720;

type Toma = {src: string; at: number; dur: number; desde: number; rate?: number; origen?: string; zoom?: [number, number]};
const TOMAS: Toma[] = [
  {src: '11218', at: 0, dur: 62, desde: 0.4, origen: '72% 22%', zoom: [1.0, 1.18]},
  {src: '1126', at: 60, dur: 92, desde: 2.6, zoom: [1.06, 1.16]},
  {src: '1121', at: 150, dur: 62, desde: 1.0, zoom: [1.0, 1.08]},
  {src: '11211', at: 210, dur: 62, desde: 0.6, zoom: [1.04, 1.1]},
  {src: 'IMG_4448', at: 270, dur: 62, desde: 0.5, zoom: [1.02, 1.1]},
  {src: '11217', at: 330, dur: 62, desde: 2.0, origen: '40% 50%', zoom: [1.0, 1.08]},
  {src: '112110', at: 390, dur: 122, desde: 0.0, origen: '50% 40%', zoom: [1.2, 1.3]},
  {src: 'IMG_4526', at: 510, dur: 92, desde: 0.2, zoom: [1.0, 1.08]},
];

const Clip: React.FC<{t: Toma}> = ({t}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, t.dur], t.zoom ?? [1.0, 1.08], clamp);
  const entra = tw(f, [0, 6], [0, 1], ease.out);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: NAVY2}}>
      <OffthreadVideo src={vid(t.src)} startFrom={Math.round(t.desde * 30)} playbackRate={t.rate ?? 1} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z * (1.06 - 0.06 * entra)})`, transformOrigin: t.origen ?? '50% 50%', filter: `contrast(1.06) saturate(1.08) blur(${(1 - entra) * 8}px)`}} />
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

/** Panel azul marino redondeado del tercio inferior (como el recuadro de las cápsulas) */
const Panel: React.FC<{dur: number; children: React.ReactNode; top?: number}> = ({dur, children, top = 1180}) => {
  const f = useCurrentFrame();
  const p = tw(f, [0, 8], [0, 1], ease.out);
  const s = tw(f, [dur - 6, dur], [0, 1], ease.in);
  return (
    <div style={{position: 'absolute', left: 56, right: 56, top, padding: '44px 52px 50px', borderRadius: 34, background: `linear-gradient(160deg, ${NAVY} 0%, ${NAVY2} 100%)`, boxShadow: '0 24px 60px rgba(0,0,0,0.45)', borderTop: `6px solid ${AMARILLO}`, opacity: 1 - s, transform: `translateY(${(1 - p) * 80 + s * 30}px)`, clipPath: `inset(0 0 ${(1 - p) * 100}% 0 round 34px)`}}>
      {children}
    </div>
  );
};

const Gancho: React.FC = () => {
  const f = useCurrentFrame();
  const sale = tw(f, [30, 36], [0, 1], ease.in);
  return (
    <>
      <div style={{position: 'absolute', left: 72, right: 72, top: 1210, opacity: 1 - sale, transform: `translateY(${-sale * 30}px)`, textShadow: '0 6px 30px rgba(0,0,0,0.6)'}}>
        <Linea texto="¿Vas a estudiar" at={0} size={86} paso={1} />
        <Linea texto="*MEDICINA?" at={4} size={150} paso={1} />
      </div>
      {f >= 34 && (
        <div style={{position: 'absolute', left: 72, right: 72, top: 1290, textShadow: '0 6px 30px rgba(0,0,0,0.6)'}}>
          <Linea texto="Mira lo que acaba" at={36} size={78} paso={1} />
          <Linea texto="de pasar en *Westhill." at={39} size={78} paso={1} />
        </div>
      )}
    </>
  );
};

const Tarjeta: React.FC<{n: string; titulo: string; texto: string; dur: number}> = ({n, titulo, texto, dur}) => {
  const f = useCurrentFrame();
  const p = tw(f, [0, 9], [0, 1], ease.out);
  const s = tw(f, [dur - 5, dur], [0, 1], ease.in);
  return (
    <div style={{position: 'absolute', left: 56, right: 56, top: 1240, padding: '38px 44px', borderRadius: 30, background: BLANCO, boxShadow: '0 24px 60px rgba(0,0,0,0.4)', display: 'flex', gap: 30, alignItems: 'flex-start', opacity: 1 - s, transform: `translateX(${(1 - p) * 120 - s * 120}px)`}}>
      <div style={{flex: 'none', width: 96, height: 96, borderRadius: 22, background: VERDE, color: BLANCO, fontFamily: F.sans, fontWeight: 900, fontSize: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.6 + 0.4 * tw(f, [4, 14], [0, 1], ease.out)})`}}>{n}</div>
      <div>
        <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 54, color: NAVY, lineHeight: 1.05}}>{titulo}</div>
        <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 36, color: '#3A4F6B', lineHeight: 1.3, marginTop: 14}}>{texto}</div>
      </div>
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

const Vigencia: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const p = tw(f, [0, 10], [0, 1], ease.out);
  const n = Math.round(interpolate(f, [4, 26], [2026, 2031], clamp));
  return (
    <Panel dur={dur} top={1130}>
      <Linea texto="Vigente hasta" at={2} size={60} peso={800} />
      <div style={{display: 'flex', alignItems: 'center', gap: 30, marginTop: 18}}>
        <div style={{padding: '6px 30px 10px', borderRadius: 18, background: AMARILLO, fontFamily: F.sans, fontWeight: 900, fontSize: 150, lineHeight: 1, color: NAVY, transform: `scale(${0.8 + 0.2 * p})`}}>{n}</div>
        <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 40, lineHeight: 1.15, color: BLANCO, opacity: tw(f, [14, 24], [0, 1])}}>
          octubre
          <br />
          de 2031
        </div>
      </div>
      <div style={{marginTop: 26, fontFamily: F.sans, fontWeight: 600, fontSize: 32, color: '#BFD4EE', opacity: tw(f, [24, 34], [0, 1])}}>Consulta el registro oficial en comaem.org.mx</div>
    </Panel>
  );
};

const Cierre: React.FC = () => {
  const f = useCurrentFrame();
  const foto = tw(f, [4, 18], [0, 1], ease.out);
  const card = tw(f, [30, 42], [0, 1], ease.out);
  const boton = tw(f, [44, 56], [0, 1], ease.out);
  const late = 1 + 0.035 * Math.max(0, Math.sin(((f - 56) / 15) * Math.PI)) * (f > 56 ? 1 : 0);
  const brillo = interpolate((f - 60) % 45, [0, 18], [-0.3, 1.3], clamp);
  return (
    <AbsoluteFill style={{background: `linear-gradient(170deg, ${NAVY} 0%, ${AZUL} 100%)`, overflow: 'hidden'}}>
      <div style={{position: 'absolute', right: -420, top: -330, width: 760, height: 760, borderRadius: '50%', border: `14px solid ${VERDE}`, opacity: 0.9}} />
      <svg viewBox="0 0 1080 260" style={{position: 'absolute', left: 0, bottom: 0, width: W}}>
        <path d="M0,120 C300,40 600,200 1080,70 L1080,260 L0,260 Z" fill={VERDE} />
        <path d="M0,170 C320,100 640,240 1080,130 L1080,260 L0,260 Z" fill={AMARILLO} />
        <path d="M0,210 C340,160 680,260 1080,190 L1080,260 L0,260 Z" fill={NAVY2} />
      </svg>
      <div style={{position: 'absolute', left: 72, right: 72, top: 260}}>
        <Linea texto="Tu vocación" at={0} size={104} paso={2} />
        <Linea texto="merece" at={4} size={104} paso={2} />
        <Linea texto="*EXCELENCIA." at={8} size={118} paso={2} />
      </div>
      <div style={{position: 'absolute', left: 72, right: 72, top: 720, height: 420, borderRadius: 30, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.45)', opacity: foto, transform: `translateY(${(1 - foto) * 60}px)`}}>
        <Img src={staticFile('placa/foto_61.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 40%', transform: `scale(${1.08 - 0.06 * foto})`}} />
      </div>
      <div style={{position: 'absolute', left: 72, right: 72, top: 1180, padding: '34px 44px', borderRadius: 28, background: BLANCO, opacity: card, transform: `translateY(${(1 - card) * 50}px)`}}>
        <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 58, color: NAVY, lineHeight: 1.02}}>ESTUDIA MÉDICO CIRUJANO</div>
        <div style={{width: 300, height: 7, borderRadius: 4, background: AMARILLO, margin: '20px 0'}} />
        <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 34, color: '#3A4F6B', lineHeight: 1.3}}>Plan incorporado a la UNAM con Distinción de Excelencia COMAEM.</div>
      </div>
      <div style={{position: 'absolute', left: 110, right: 110, top: 1530, height: 124, borderRadius: 62, background: AMARILLO, boxShadow: '0 14px 34px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', opacity: boton, transform: `translateY(${(1 - boton) * 40}px) scale(${late})`}}>
        <div style={{position: 'absolute', top: 0, bottom: 0, left: `${brillo * 100}%`, width: 120, transform: 'translateX(-50%) skewX(-18deg)', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.6), rgba(255,255,255,0))'}} />
        <span style={{position: 'relative', fontFamily: F.sans, fontWeight: 900, fontSize: 50, color: NAVY, letterSpacing: 1}}>SOLICITA INFORMACIÓN</span>
      </div>
      <Img src={LOGO} style={{position: 'absolute', left: W / 2 - 150, top: 1715, width: 300, opacity: boton}} />
    </AbsoluteFill>
  );
};

export const PlacaComaem: React.FC = () => {
  const musica = (fr: number) => {
    const base = interpolate(fr, [0, 3, PLACA_FRAMES - 20, PLACA_FRAMES], [0, 0.6, 0.6, 0], clamp);
    const voz = interpolate(fr, [384, 392, 506, 516], [1, 0.25, 0.25, 1], clamp);
    return base * voz;
  };
  return (
    <AbsoluteFill style={{background: NAVY2}}>
      {TOMAS.map((t, i) => (
        <Sequence key={i} from={t.at} durationInFrames={t.dur}>
          <Clip t={t} />
        </Sequence>
      ))}
      <Sequence durationInFrames={60}>
        <Gancho />
      </Sequence>
      <Sequence from={60} durationInFrames={90}>
        <Panel dur={90}>
          <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 32, letterSpacing: 2, color: VERDE, marginBottom: 14}}>DISTINCIÓN DE EXCELENCIA COMAEM</div>
          <Linea texto="El *máximo *reconocimiento a la calidad de la educación médica." at={4} size={64} paso={1.5} />
        </Panel>
      </Sequence>
      <Sequence from={150} durationInFrames={60}>
        <Panel dur={60}>
          <Linea texto="Y somos la *única *universidad *privada en recibirlo." at={2} size={66} paso={1.5} />
        </Panel>
      </Sequence>
      <Sequence from={210} durationInFrames={180}>
        <div style={{position: 'absolute', left: 72, right: 72, top: 1050, textShadow: '0 6px 26px rgba(0,0,0,0.7)'}}>
          <Linea texto="¿Qué significa *para *ti?" at={0} size={76} paso={2} />
        </div>
      </Sequence>
      <Sequence from={210} durationInFrames={60}>
        <Tarjeta n="01" titulo="Calidad evaluada" texto="Tu programa cumple criterios académicos de acreditación." dur={60} />
      </Sequence>
      <Sequence from={270} durationInFrames={60}>
        <Tarjeta n="02" titulo="Mejora continua" texto="Lo que aprendes se revisa y se actualiza." dur={60} />
      </Sequence>
      <Sequence from={330} durationInFrames={60}>
        <Tarjeta n="03" titulo="Respaldo externo" texto="Lo avala un organismo acreditador independiente." dur={60} />
      </Sequence>
      <Sequence from={390} durationInFrames={120}>
        <Voz />
        <Audio src={staticFile('placa/asisclo.wav')} />
      </Sequence>
      <Sequence from={510} durationInFrames={90}>
        <Vigencia dur={90} />
      </Sequence>
      <Sequence durationInFrames={600}>
        <Encabezado />
      </Sequence>
      <Sequence from={600}>
        <Cierre />
      </Sequence>
      {/* destellos de corte */}
      {[60, 600].map((at) => (
        <Sequence key={at} from={at} durationInFrames={10}>
          <Flash />
        </Sequence>
      ))}
      <Grain opacity={0.03} />
      <Sfx at={0} name="impact" volume={0.35} />
      <Sfx at={60} name="down_bass" volume={0.9} />
      <Sfx at={60} name="impact" volume={0.4} />
      {[150, 210, 270, 330, 390, 510].map((at) => (
        <Sfx key={at} at={at - 3} name="ref_swoosh_short" volume={0.28} />
      ))}
      {[214, 274, 334].map((at) => (
        <Sfx key={at} at={at} name="pop" volume={0.35} />
      ))}
      <Sfx at={536} name="ding" volume={0.3} />
      <Sfx at={590} name="whoosh_largo" volume={0.35} />
      <Sfx at={600} name="down_bass" volume={0.8} />
      <Sfx at={646} name="pop" volume={0.4} />
      <Audio src={staticFile('placa/musica.wav')} volume={musica} />
    </AbsoluteFill>
  );
};

const Flash: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: '#FFFDF4', opacity: interpolate(f, [0, 1, 9], [0.85, 0.7, 0], clamp)}} />;
};
