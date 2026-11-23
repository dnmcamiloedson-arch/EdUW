import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Sfx} from './shots';
import {F, ease, tw} from './theme';

// ---------------------------------------------------------------------------
// PREVIEW (base) del video "grabación de pantalla" de la Distinción de Excelencia COMAEM (9:16, 19 s).
//  0.0  el sitio de Westhill con la noticia recién publicada (etiqueta NUEVO, scroll, resaltado del título)
//  4.5  cambio a una pestaña nueva
//  5.5  buscador genérico: se escribe "westhill" letra por letra y se busca
//  9.0  resultados: las notas de los diarios. AQUÍ VAN CAPTURAS REALES; mientras, recuadros de marcador de
//       posición (no se inventa ninguna nota de un medio real)
// 12.5  se abre la nota: zoom al titular y subrayado amarillo (también marcador de posición)
// 16.0  cierre: logo + "Tu vocación merece EXCELENCIA" + Solicita información
// Todo dentro de un teléfono con indicador de grabación (REC) y un dedo/cursor que toca.
// ---------------------------------------------------------------------------
const W = 1080;
const H = 1920;
export const GRAB_FRAMES = 570;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const NAVY = '#0E2C52';
const NAVY2 = '#0A2141';
const AMARILLO = '#F2C94C';
const VERDE = '#2BAE66';
const GRIS = '#E9EDF2';
const LOGO = staticFile('logos/logo_westhill_blanco_total.png');

// área de la pantalla del teléfono
const PX = 70;
const PY = 150;
const PW = W - 2 * PX;
const PH = H - 2 * PY;

const T_WEB = 0;
const T_TAB = 135;
const T_BUSCA = 165;
const T_RES = 270;
const T_NOTA = 375;
const T_FIN = 480;
const TEXTO = 'westhill';
const TECLA0 = T_BUSCA + 22;
const PASO_TECLA = 5;

/** Dedo (círculo) que se mueve y toca */
type Toque = {at: number; x: number; y: number};
const TOQUES: Toque[] = [
  {at: 60, x: 520, y: 760},
  {at: T_TAB - 8, x: 870, y: 60},
  {at: TECLA0 - 10, x: 470, y: 380},
  {at: TECLA0 + TEXTO.length * PASO_TECLA + 6, x: 860, y: 380},
  {at: T_RES + 52, x: 470, y: 560},
];
const Dedo: React.FC = () => {
  const f = useCurrentFrame();
  let x = TOQUES[0].x;
  let y = TOQUES[0].y + 300;
  for (let i = 0; i < TOQUES.length; i++) {
    const t = TOQUES[i];
    const prev = i ? TOQUES[i - 1] : {x: t.x, y: t.y + 300, at: t.at - 30};
    const k = tw(f, [t.at - 14, t.at], [0, 1], ease.inOut);
    if (f >= t.at - 14) {
      x = prev.x + (t.x - prev.x) * k;
      y = prev.y + (t.y - prev.y) * k;
    }
  }
  const toque = TOQUES.map((t) => interpolate(f - t.at, [0, 3, 14], [0, 1, 0], clamp)).reduce((a, b) => Math.max(a, b), 0);
  const visible = f < T_FIN - 4 && (f < T_TAB + 6 || f > T_BUSCA - 20);
  if (!visible) return null;
  return (
    <div style={{position: 'absolute', left: PX + x - 34, top: PY + y - 34, width: 68, height: 68, borderRadius: 34, background: 'rgba(255,255,255,0.55)', border: '3px solid rgba(30,30,30,0.35)', boxShadow: `0 0 0 ${toque * 26}px rgba(255,255,255,${0.35 * toque})`, transform: `scale(${1 - 0.15 * toque})`}} />
  );
};

/** Barra de navegador */
const Barra: React.FC<{url: string; escribiendo?: boolean}> = ({url, escribiendo}) => (
  <div style={{height: 120, background: '#F6F7F9', borderBottom: '1px solid #DADDE2', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 18}}>
    <div style={{flex: 1, height: 70, borderRadius: 35, background: BLANCO, border: '1px solid #D5D9DF', display: 'flex', alignItems: 'center', padding: '0 26px', fontFamily: F.sans, fontWeight: 500, fontSize: 30, color: '#4A5565', gap: 14}}>
      <span style={{fontSize: 26}}>🔒</span>
      {url}
      {escribiendo && <span style={{width: 3, height: 34, background: '#2A6FDB'}} />}
    </div>
    <div style={{width: 54, height: 54, borderRadius: 12, border: '3px solid #8A94A3', fontFamily: F.sans, fontWeight: 700, fontSize: 26, color: '#4A5565', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>2</div>
  </div>
);
const BLANCO = '#FFFFFF';

/** Sitio de Westhill (maqueta con la noticia real de la universidad) */
const SitioWesthill: React.FC = () => {
  const f = useCurrentFrame();
  const scroll = interpolate(f, [62, 100], [0, 520], {...clamp, easing: ease.inOut});
  const nuevo = 0.85 + 0.15 * Math.abs(Math.sin(f / 7));
  const marca = tw(f, [24, 44], [0, 1], ease.out);
  return (
    <AbsoluteFill style={{background: BLANCO}}>
      <Barra url="westhill.edu.mx/noticias" />
      <div style={{position: 'absolute', top: 120, left: 0, right: 0, bottom: 0, overflow: 'hidden'}}>
        <div style={{transform: `translateY(${-scroll}px)`}}>
          <div style={{height: 130, background: NAVY, display: 'flex', alignItems: 'center', padding: '0 36px'}}>
            <Img src={LOGO} style={{height: 80}} />
          </div>
          <div style={{padding: '36px 40px 0'}}>
            <div style={{display: 'flex', gap: 14, alignItems: 'center'}}>
              <div style={{padding: '8px 18px', borderRadius: 10, background: '#E53935', color: BLANCO, fontFamily: F.sans, fontWeight: 900, fontSize: 26, transform: `scale(${nuevo})`}}>NUEVO</div>
              <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 26, color: '#6B7685'}}>Hace unos minutos · Noticias</div>
            </div>
            <div style={{position: 'relative', marginTop: 24, fontFamily: F.sans, fontWeight: 900, fontSize: 58, lineHeight: 1.12, color: NAVY}}>
              <span style={{backgroundImage: `linear-gradient(${AMARILLO}, ${AMARILLO})`, backgroundSize: `${marca * 100}% 38%`, backgroundPosition: '0 88%', backgroundRepeat: 'no-repeat'}}>Universidad Westhill alcanza la Distinción de Excelencia en Medicina</span>
            </div>
            <div style={{marginTop: 22, fontFamily: F.sans, fontWeight: 700, fontSize: 32, color: '#3A4F6B', lineHeight: 1.35}}>La Facultad de Medicina se convierte en la primera universidad particular en recibir el máximo reconocimiento del COMAEM.</div>
            <div style={{marginTop: 30, height: 520, borderRadius: 22, overflow: 'hidden'}}>
              <Img src={staticFile('placa/foto_61.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </div>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{marginTop: i ? 16 : 34, height: 24, borderRadius: 12, background: GRIS, width: `${[100, 96, 100, 88, 100, 70][i]}%`}} />
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Buscador genérico (diseño propio, sin marcas de terceros) */
const Buscador: React.FC = () => {
  const f = useCurrentFrame(); // reloj global (Pantalla no está dentro de una Sequence)
  const n = Math.max(0, Math.min(TEXTO.length, Math.floor((f - TECLA0) / PASO_TECLA) + 1));
  const escrito = f >= TECLA0 ? TEXTO.slice(0, n) : '';
  const cursor = Math.floor(f / 8) % 2 === 0;
  const sugiere = tw(f, [TECLA0 + 12, TECLA0 + 20], [0, 1]);
  return (
    <AbsoluteFill style={{background: BLANCO}}>
      <Barra url="buscar" />
      <div style={{position: 'absolute', top: 260, left: 0, right: 0, textAlign: 'center', fontFamily: F.sans, fontWeight: 900, fontSize: 92, letterSpacing: -2}}>
        <span style={{color: NAVY}}>Buscar</span>
      </div>
      <div style={{position: 'absolute', top: 410 - 100, left: 50, right: 50, height: 110, borderRadius: 55, border: '2px solid #D5D9DF', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', padding: '0 40px', gap: 20, transform: 'translateY(100px)'}}>
        <svg viewBox="0 0 24 24" style={{width: 40, height: 40}}>
          <circle cx="10" cy="10" r="6.5" fill="none" stroke="#7A8594" strokeWidth="2.4" />
          <path d="M15 15 L21 21" stroke="#7A8594" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
        <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 46, color: '#1F2937'}}>
          {escrito}
          {cursor && <span style={{display: 'inline-block', width: 3, height: 48, background: '#2A6FDB', marginLeft: 4, verticalAlign: 'middle'}} />}
        </div>
      </div>
      <div style={{position: 'absolute', top: 540, left: 50, right: 50, opacity: sugiere}}>
        {['westhill medicina comaem', 'westhill distinción de excelencia', 'universidad westhill noticias'].map((s) => (
          <div key={s} style={{padding: '22px 30px', fontFamily: F.sans, fontWeight: 500, fontSize: 34, color: '#4A5565', borderBottom: '1px solid #EEF0F3'}}>🔍 {s}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** Marcador de posición de una nota real (se sustituye por la captura del medio) */
const Pendiente: React.FC<{medio: string; nota: string; alto: number; destacado?: boolean}> = ({medio, nota, alto, destacado}) => (
  <div style={{height: alto, borderRadius: 18, border: `4px dashed ${destacado ? '#2A6FDB' : '#AEB7C4'}`, background: '#F3F6FA', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, textAlign: 'center', padding: 20}}>
    <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 40, color: '#2A3A52'}}>{medio}</div>
    <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 28, color: '#6B7685'}}>{nota}</div>
  </div>
);

const Resultados: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: BLANCO}}>
      <Barra url="buscar: westhill" />
      <div style={{position: 'absolute', top: 160, left: 40, right: 40}}>
        <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 28, color: '#6B7685', marginBottom: 24}}>Noticias principales</div>
        {[
          {medio: 'EXCÉLSIOR', nota: 'Aquí va la captura real de la nota', d: 6},
          {medio: 'MILENIO', nota: 'Se agrega cuando publiquen la nota', d: 14},
        ].map((r, i) => {
          const p = tw(f, [r.d, r.d + 12], [0, 1], ease.out);
          return (
            <div key={r.medio} style={{marginBottom: 30, opacity: p, transform: `translateY(${(1 - p) * 40}px)`}}>
              <Pendiente medio={r.medio} nota={r.nota} alto={340} destacado={i === 0 && f > 46} />
            </div>
          );
        })}
        <div style={{opacity: tw(f, [22, 34], [0, 1])}}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{marginTop: 26}}>
              <div style={{height: 26, width: '60%', borderRadius: 13, background: '#C9D6EA'}} />
              <div style={{height: 20, width: '92%', borderRadius: 10, background: GRIS, marginTop: 12}} />
              <div style={{height: 20, width: '80%', borderRadius: 10, background: GRIS, marginTop: 10}} />
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Nota: React.FC = () => {
  const f = useCurrentFrame();
  const zoom = interpolate(f, [16, 50], [1, 1.45], {...clamp, easing: ease.inOut});
  const sub = tw(f, [50, 70], [0, 1], ease.out);
  return (
    <AbsoluteFill style={{background: BLANCO}}>
      <Barra url="excelsior.com.mx/…" />
      <div style={{position: 'absolute', top: 120, left: 0, right: 0, bottom: 0, overflow: 'hidden'}}>
        <div style={{transform: `scale(${zoom})`, transformOrigin: '50% 18%', padding: '40px 40px'}}>
          <div style={{position: 'relative'}}>
            <Pendiente medio="NOTA DE EXCÉLSIOR" nota="Captura real: titular, foto y primeros párrafos" alto={420} />
            <div style={{position: 'absolute', left: 60, right: 60, bottom: 110, height: 14, borderRadius: 7, background: AMARILLO, transform: `scaleX(${sub})`, transformOrigin: '0 50%', opacity: 0.9}} />
          </div>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{marginTop: i ? 16 : 34, height: 24, borderRadius: 12, background: GRIS, width: `${[100, 94, 100, 86, 100, 97, 60][i]}%`}} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Cambio de pestaña: la página se encoge y se desliza */
const Pantalla: React.FC = () => {
  const f = useCurrentFrame();
  const sale = tw(f, [T_TAB, T_TAB + 16], [0, 1], ease.inOut);
  const entra = tw(f, [T_TAB + 14, T_BUSCA], [0, 1], ease.out);
  return (
    <AbsoluteFill style={{overflow: 'hidden', borderRadius: 48, background: '#20242B'}}>
      {f < T_BUSCA && (
        <AbsoluteFill style={{transform: `scale(${1 - 0.2 * sale}) translateX(${-sale * 900}px)`, borderRadius: 40 * sale, overflow: 'hidden'}}>
          <SitioWesthill />
        </AbsoluteFill>
      )}
      {f >= T_TAB + 14 && f < T_RES && (
        <AbsoluteFill style={{transform: `translateX(${(1 - entra) * 900}px) scale(${0.8 + 0.2 * entra})`, borderRadius: 40 * (1 - entra), overflow: 'hidden'}}>
          <Buscador />
        </AbsoluteFill>
      )}
      <Sequence from={T_RES} durationInFrames={T_NOTA - T_RES}>
        <Resultados />
      </Sequence>
      <Sequence from={T_NOTA} durationInFrames={T_FIN - T_NOTA}>
        <Nota />
      </Sequence>
    </AbsoluteFill>
  );
};

/** Indicador de grabación de pantalla */
const Rec: React.FC = () => {
  const f = useCurrentFrame();
  const s = Math.floor(f / 30);
  return (
    <div style={{position: 'absolute', top: 64, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '10px 24px', borderRadius: 30, background: 'rgba(0,0,0,0.55)', fontFamily: F.sans, fontWeight: 700, fontSize: 28, color: BLANCO}}>
        <div style={{width: 18, height: 18, borderRadius: 9, background: '#FF3B30', opacity: Math.floor(f / 15) % 2 ? 0.35 : 1}} />
        REC 00:{String(s).padStart(2, '0')}
      </div>
    </div>
  );
};

const Cierre: React.FC = () => {
  const f = useCurrentFrame();
  const a = tw(f, [0, 14], [0, 1], ease.out);
  const b = tw(f, [10, 24], [0, 1], ease.out);
  const c = tw(f, [26, 38], [0, 1], ease.out);
  return (
    <AbsoluteFill style={{background: `linear-gradient(170deg, ${NAVY} 0%, #1F5A96 100%)`}}>
      <Img src={LOGO} style={{position: 'absolute', left: W / 2 - 230, top: 260, width: 460, opacity: a, transform: `translateY(${(1 - a) * -30}px)`}} />
      <div style={{position: 'absolute', top: 640, left: 0, right: 0, textAlign: 'center', opacity: b, transform: `translateY(${(1 - b) * 40}px)`}}>
        <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 72, color: BLANCO}}>Tu vocación merece</div>
        <div style={{fontFamily: F.sans, fontWeight: 900, fontSize: 136, color: AMARILLO, lineHeight: 1.05}}>EXCELENCIA.</div>
      </div>
      <div style={{position: 'absolute', left: 130, right: 130, top: 1120, height: 120, borderRadius: 60, background: AMARILLO, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.sans, fontWeight: 900, fontSize: 48, color: NAVY, opacity: c, transform: `scale(${0.85 + 0.15 * c})`}}>SOLICITA INFORMACIÓN →</div>
    </AbsoluteFill>
  );
};

export const GrabacionNoticia: React.FC = () => {
  const f = useCurrentFrame();
  const sale = tw(f, [T_FIN - 10, T_FIN], [0, 1], ease.in);
  return (
    <AbsoluteFill style={{background: NAVY2}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%, #17406F 0%, ${NAVY2} 70%)`}} />
      {f < T_FIN && (
        <div style={{position: 'absolute', left: PX - 18, top: PY - 18, width: PW + 36, height: PH + 36, borderRadius: 66, background: '#0D0F13', boxShadow: '0 40px 90px rgba(0,0,0,0.55)', opacity: 1 - sale, transform: `scale(${1 - 0.06 * sale})`}}>
          <div style={{position: 'absolute', left: 18, top: 18, width: PW, height: PH}}>
            <Pantalla />
          </div>
        </div>
      )}
      <Dedo />
      {f < T_FIN && <Rec />}
      <Sequence from={T_FIN}>
        <Cierre />
      </Sequence>
      {/* sonidos de la "grabación" */}
      {TOQUES.map((t) => (
        <Sfx key={t.at} at={t.at} name="ref_tap" volume={0.45} />
      ))}
      {Array.from({length: TEXTO.length}, (_, i) => (
        <Sfx key={i} at={TECLA0 + i * PASO_TECLA} name="ref_click" volume={0.35} />
      ))}
      <Sfx at={T_TAB} name="swipe" volume={0.35} />
      <Sfx at={T_RES} name="ref_digital" volume={0.3} />
      <Sfx at={T_NOTA} name="ref_swoosh" volume={0.3} />
      <Sfx at={T_FIN} name="down_bass" volume={0.7} />
      <Audio src={staticFile('placa/musica.wav')} volume={(fr) => interpolate(fr, [0, 20, GRAB_FRAMES - 20, GRAB_FRAMES], [0, 0.45, 0.45, 0], clamp)} />
    </AbsoluteFill>
  );
};
