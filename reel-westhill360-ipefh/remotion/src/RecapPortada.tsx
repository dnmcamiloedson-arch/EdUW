import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Grain} from './components';
import {C, F} from './theme';

// ---------------------------------------------------------------------------
// Portada (miniatura) del reel "Recap Octubre": collage de fotos del mes alrededor del título.
// Lo importante queda dentro del recorte 3:4 del perfil de Instagram (y ≈ 240–1680).
// Fotos en public/photos/portada (cuadros de los clips del recap).
// ---------------------------------------------------------------------------
const FOTOS: {n: string; x: number; y: number; w: number; r: number}[] = [
  {n: 'p1', x: -40, y: 60, w: 470, r: -8},
  {n: 'p3', x: 620, y: 40, w: 480, r: 7},
  {n: 'p4', x: 330, y: 180, w: 420, r: -2},
  {n: 'p7', x: -60, y: 1180, w: 480, r: 6},
  {n: 'p9', x: 640, y: 1160, w: 470, r: -7},
  {n: 'p5', x: 320, y: 1300, w: 440, r: 3},
];
const ETIQUETAS = ['Experiencia Westhill 360', 'FlyOver México', 'Día del Médico', 'Feria de la Salud', 'Titanic', 'Día de Muertos'];

export const RecapPortada: React.FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(180deg, #0E2A4C 0%, #14233C 45%, #1A0D08 75%, #080405 100%)', overflow: 'hidden'}}>
    {FOTOS.map(({n, x, y, w, r}) => (
      <div key={n} style={{position: 'absolute', left: x, top: y, width: w, padding: '16px 16px 60px', background: '#F7F2E8', boxShadow: '0 26px 60px rgba(0,0,0,0.6)', transform: `rotate(${r}deg)`}}>
        <Img src={staticFile(`photos/portada/${n}.jpg`)} style={{width: '100%', height: w * 1.25, objectFit: 'cover', display: 'block'}} />
      </div>
    ))}
    {/* franja oscura central para que el título se lea */}
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,6,10,0) 26%, rgba(8,6,10,0.92) 40%, rgba(8,6,10,0.92) 62%, rgba(8,6,10,0) 74%)'}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(244,169,60,0.28) 0%, rgba(0,0,0,0) 45%)'}} />
    <div style={{position: 'absolute', top: 780, width: '100%', textAlign: 'center'}}>
      <div style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 170, lineHeight: 1, color: '#fff', textShadow: '0 0 30px rgba(255,255,255,0.55)'}}>Recap</div>
      <div style={{fontFamily: F.display, fontSize: 250, lineHeight: 1, letterSpacing: 8, color: '#fff', textShadow: `0 0 40px rgba(242,194,48,0.85), 0 0 10px rgba(255,255,255,0.9)`}}>OCTUBRE</div>
      <div style={{marginTop: 26, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px 14px', padding: '0 90px'}}>
        {ETIQUETAS.map((e, i) => (
          <span key={e} style={{fontFamily: F.sans, fontWeight: 800, fontSize: 28, color: i === ETIQUETAS.length - 1 ? '#F4A93C' : C.amarillo, letterSpacing: 1}}>
            {e}
            {i < ETIQUETAS.length - 1 ? '  ·' : ''}
          </span>
        ))}
      </div>
    </div>
    <div style={{position: 'absolute', right: 96, top: 150, width: 150, filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.4))'}}>
      <Img src={staticFile('logos/banderin_uw_recortado.png')} style={{width: '100%'}} />
    </div>
    <Grain opacity={0.05} />
  </AbsoluteFill>
);
