import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile} from 'remotion';
import {Grain} from './components';
import {Intro, INTRO_FRAMES} from './Intro';
import {
  Cierre,
  CIERRE_FRAMES,
  CornholeText,
  GanadoresRibbon,
  Item,
  LlegadaText,
  Logrado,
  Musica,
  MUSICAS,
  P,
  ReglasCard,
  S,
  Section,
  sectionDur,
  SectionsPlayer,
  TitleCard,
  WinnerPhoto,
} from './Reel';
import {Banner, BehindShot, SectionLabel, VideoShot} from './shots';

// ---------------------------------------------------------------------------
// Visita 2 de IPEFH: charlas (sin nombrar carreras), Medicina con práctica de
// vendaje y hospital de simulación, gimnasio, break, reto del cornhole y despedida.
// No se menciona el nombre de ningún plantel.
// ---------------------------------------------------------------------------
const v = (n: string) => `v2/IMG_${n}`; // clips en public/proxies/v2
const f = (n: string) => `v2/${n}`; // fotos en public/photos/v2

const Winner = (name: string, photo: string, tilt: number): Item => ({
  dur: 36,
  el: <WinnerPhoto src={f(photo)} tilt={tilt} dur={36} name={name} />,
  overlay: <GanadoresRibbon />,
});

export const SECTIONS_V2: Section[] = [
  {
    name: 'llegada',
    items: [
      {dur: 66, el: <VideoShot src={v('0909')} from={0.5} dur={66} enter="zoom" push={0.1} />, overlay: <LlegadaText title="¡Llegó IPEFH!" script="a vivir Westhill" />},
      S(v('0910'), 0.6, 24 / 30, 'whipL'),
    ],
  },
  {name: 'charlas', items: [{dur: 45, el: <TitleCard small="Conocieron de cerca" big="su futura carrera" bg="clean" />}]},
  {
    name: 'charlas-montaje',
    items: [
      S(v('0850'), 1.0, 1.2, 'whipL'),
      // Derecho (maestra en la sala de juicios orales) y Psicología (maestro) con más tiempo en pantalla
      S(v('0899'), 1.0, 1.8, 'zoom'),
      S(v('0907'), 2.0, 1.4, 'whipR'),
      S(v('0884'), 2.0, 1.6, 'whipL'),
      S(v('0894'), 1.0, 1.3, 'zoom'),
      S(v('0873'), 1.5, 1.1, 'whipL'),
      S(v('1022'), 3.0, 1.2, 'zoom'),
      P(f('charla_auditorio'), 0.9),
      S(v('1031'), 1.0, 1.1, 'whipR'),
      S(v('1026'), 1.5, 1.0, 'zoom'),
      S(v('0865'), 0.5, 1.0, 'whipL'),
    ],
  },
  {
    name: 'medicina',
    shade: true,
    overlay: <SectionLabel name="Medicina" sub="práctica de vendaje" />,
    items: [S(v('1040'), 1.0, 1.4, 'card'), S(v('1043'), 1.0, 1.1, 'whipL'), P(f('vendaje1'), 0.9), S(v('1045'), 0.5, 1.1, 'whipR'), S(v('1035'), 2.0, 1.1, 'zoom')],
  },
  {
    name: 'hospital',
    shade: true,
    overlay: <SectionLabel name="Hospital" sub="de simulación" />,
    items: [S(v('1057'), 1.5, 1.6, 'card'), S(v('1059'), 1.0, 1.2, 'whipL'), S(v('1064'), 3.0, 1.4, 'zoom'), S(v('1068'), 1.0, 1.2, 'whipR')],
  },
  {
    name: 'biblioteca',
    shade: true,
    overlay: <SectionLabel name="Biblioteca" sub="Westhill" />,
    items: [S(v('1011'), 0.5, 1.6, 'card'), S(v('1010'), 1.0, 1.2, 'whipL')],
  },
  {name: 'alberca', items: [S(v('0911'), 3.5, 1.3, 'zoom')]},
  {
    name: 'gimnasio',
    shade: true,
    overlay: <SectionLabel name="Gimnasio" sub="retos en equipo" />,
    items: [
      S(v('0913'), 2.0, 1.1, 'card'),
      S(v('0933'), 1.5, 1.3, 'whipL'),
      P(f('gim_jenga'), 0.8),
      S(v('0936'), 0.5, 1.0, 'whipR'),
      S(v('0937'), 1.0, 0.8, 'zoom'),
      S(v('0953'), 0.3, 1.0, 'whipL'),
      P(f('gim_voleibol'), 0.9),
    ],
  },
  {
    name: 'break',
    shade: true,
    overlay: <SectionLabel name="Break" sub="al aire libre" />,
    items: [S(v('0960'), 0.5, 1.2, 'card'), S(v('0964'), 0.5, 1.1, 'whipL'), S(v('0966'), 0.2, 0.9, 'whipR')],
  },
  {
    name: 'cornhole',
    items: [
      {
        dur: 90,
        el: (
          <BehindShot seg="cornhole2" frames={90} dur={90}>
            <CornholeText estreno={false} top={305} />
          </BehindShot>
        ),
      },
      {dur: 60, el: <ReglasCard />},
      S(v('0973'), 0.0, 1.5, 'whipL'),
      P(f('cornhole_lanzando'), 1.0),
      {dur: 45, el: <VideoShot src={v('0980')} from={3.0} dur={45} enter="zoom" />, overlay: <Logrado />},
      Winner('Luis', 'ganador_luis', -3),
      Winner('Valeria', 'ganador_valeria', 2.5),
      Winner('Ramsés', 'ganador_ramses', -2),
      Winner('Jennifer', 'ganador_jennifer', 3),
    ],
  },
  {name: 'cierre', items: [{dur: CIERRE_FRAMES, el: <Cierre seg="final2" pw={2576} ph={1449} />}]},
];

export const REEL2_FRAMES = INTRO_FRAMES + SECTIONS_V2.reduce((a, s) => a + sectionDur(s), 0);
/** Segundo en que empieza cada sección (para alinear la música) */
export const startOf = (name: string) => {
  let t = INTRO_FRAMES;
  for (const s of SECTIONS_V2) {
    if (s.name === name) return t / 30;
    t += sectionDur(s);
  }
  return -1;
};

const MUSIC_V2 = {src: 'music/beat_visita2.mp3', dropAt: 180};

/**
 * "Música de fondo alegre" (sin copyright), elegida por el cliente. Se arma con dos tramos de la
 * canción para que sus dos "drops" caigan en cortes del montaje:
 *  - Tramo A: el drop 1 (33.565 s de la canción) cae justo al terminar la intro (reel 6 s).
 *  - Tramo B: el drop 2 (102.445 s) entra en seco al empezar el gimnasio; su respiro (~116–119 s)
 *    cae en la tarjeta del reto del cornhole y su final (~134 s) en la tarjeta de cierre.
 */
const FONDO = 'music/fondo_alegre.mp3';
const DROP1 = 33.565;
const DROP2 = 102.445;
const FondoAlegre: React.FC = () => {
  const cut = Math.round(startOf('gimnasio') * 30); // inicio del gimnasio
  const fade = (fr: number, total: number) =>
    interpolate(fr, [total - 75, total], [0.6, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <>
      <Sequence durationInFrames={cut + 3}>
        <Audio
          src={staticFile(FONDO)}
          startFrom={Math.round((DROP1 - INTRO_FRAMES / 30) * 30)}
          volume={(fr) => 0.6 * interpolate(fr, [cut - 1, cut + 3], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
        />
      </Sequence>
      <Sequence from={cut}>
        <Audio src={staticFile(FONDO)} startFrom={Math.round(DROP2 * 30)} volume={(fr) => fade(fr + cut, REEL2_FRAMES)} />
      </Sequence>
    </>
  );
};

export const ReelVisita2: React.FC<{music?: Musica | 'fondo'}> = ({music = 'fondo'}) => {
  const track = music === 'original' ? MUSIC_V2 : music === 'cancion' ? MUSICAS.cancion : null;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence durationInFrames={INTRO_FRAMES + 8}>
        <Intro subtitle="IPEFH" />
      </Sequence>
      <Sequence from={INTRO_FRAMES}>
        <SectionsPlayer sections={SECTIONS_V2} />
      </Sequence>
      <Sequence from={INTRO_FRAMES} durationInFrames={REEL2_FRAMES - CIERRE_FRAMES - INTRO_FRAMES}>
        <Banner />
      </Sequence>
      <Grain opacity={0.05} />
      {music === 'fondo' && <FondoAlegre />}
      {track && (
        <Audio
          src={staticFile(track.src)}
          startFrom={track.dropAt - INTRO_FRAMES}
          volume={(fr) => interpolate(fr, [REEL2_FRAMES - 75, REEL2_FRAMES], [0.6, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
        />
      )}
    </AbsoluteFill>
  );
};
