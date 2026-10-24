import React from 'react';
import {Composition} from 'remotion';
import {Intro, INTRO_FRAMES} from './Intro';
import {Reel, REEL_FRAMES} from './Reel';
import {ReelVisita2, REEL2_FRAMES} from './Visita2';
import {FlyOverStory, FLYOVER_FRAMES} from './FlyOver';
import {VotoMujer, VOTO_FRAMES} from './VotoMujer';
import {DiaMedico, MEDICO_FRAMES} from './DiaMedico';
import {Medico3Palabras, M3P_FRAMES} from './Medico3Palabras';
import {Titanic, TITANIC_FRAMES} from './Titanic';
import {Chapter, chapterDur, CHAPTERS, CORNHOLE_FRAMES, CornholeStory} from './Stories';
import {FPS, H, W, loadFonts} from './theme';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="Reel" component={Reel} durationInFrames={REEL_FRAMES} fps={FPS} width={W} height={H} defaultProps={{music: 'original' as const}} />
    <Composition id="ReelSinMusica" component={Reel} durationInFrames={REEL_FRAMES} fps={FPS} width={W} height={H} defaultProps={{music: 'ninguna' as const}} />
    <Composition id="ReelCancion" component={Reel} durationInFrames={REEL_FRAMES} fps={FPS} width={W} height={H} defaultProps={{music: 'cancion' as const}} />
    <Composition id="Visita2" component={ReelVisita2} durationInFrames={REEL2_FRAMES} fps={FPS} width={W} height={H} defaultProps={{music: 'fondo' as const}} />
    <Composition id="Visita2MusicaOriginal" component={ReelVisita2} durationInFrames={REEL2_FRAMES} fps={FPS} width={W} height={H} defaultProps={{music: 'original' as const}} />
    <Composition id="Visita2SinMusica" component={ReelVisita2} durationInFrames={REEL2_FRAMES} fps={FPS} width={W} height={H} defaultProps={{music: 'ninguna' as const}} />
    <Composition id="FlyOver" component={FlyOverStory} durationInFrames={FLYOVER_FRAMES} fps={FPS} width={W} height={H} defaultProps={{music: true}} />
    <Composition id="FlyOverSinMusica" component={FlyOverStory} durationInFrames={FLYOVER_FRAMES} fps={FPS} width={W} height={H} defaultProps={{music: false}} />
    <Composition id="VotoMujer" component={VotoMujer} durationInFrames={VOTO_FRAMES} fps={FPS} width={W} height={H} defaultProps={{music: true}} />
    <Composition id="VotoMujerSinMusica" component={VotoMujer} durationInFrames={VOTO_FRAMES} fps={FPS} width={W} height={H} defaultProps={{music: false}} />
    <Composition id="DiaMedico" component={DiaMedico} durationInFrames={MEDICO_FRAMES} fps={FPS} width={W} height={H} defaultProps={{music: true}} />
    <Composition id="DiaMedicoSinMusica" component={DiaMedico} durationInFrames={MEDICO_FRAMES} fps={FPS} width={W} height={H} defaultProps={{music: false}} />
    <Composition id="Medico3Palabras" component={Medico3Palabras} durationInFrames={M3P_FRAMES} fps={FPS} width={W} height={H} defaultProps={{music: true}} />
    <Composition id="Medico3PalabrasSinMusica" component={Medico3Palabras} durationInFrames={M3P_FRAMES} fps={FPS} width={W} height={H} defaultProps={{music: false}} />
    <Composition id="Titanic" component={Titanic} durationInFrames={TITANIC_FRAMES} fps={FPS} width={W} height={H} defaultProps={{music: true}} />
    <Composition id="TitanicSinMusica" component={Titanic} durationInFrames={TITANIC_FRAMES} fps={FPS} width={W} height={H} defaultProps={{music: false}} />
    <Composition id="Historia3-Cornhole" component={CornholeStory} durationInFrames={CORNHOLE_FRAMES} fps={FPS} width={W} height={H} />
    {CHAPTERS.map((c) => (
      <Composition
        key={c.id}
        id={c.id}
        component={Chapter}
        durationInFrames={chapterDur(c.sections)}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{title: c.title, sections: c.sections}}
      />
    ))}
    <Composition id="Intro" component={Intro} durationInFrames={INTRO_FRAMES} fps={FPS} width={W} height={H} />
  </>
);
