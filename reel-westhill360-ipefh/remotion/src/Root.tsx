import React from 'react';
import {Composition} from 'remotion';
import {Intro, INTRO_FRAMES} from './Intro';
import {Reel, REEL_FRAMES} from './Reel';
import {Chapter, chapterDur, CHAPTERS, CORNHOLE_FRAMES, CornholeStory} from './Stories';
import {FPS, H, W, loadFonts} from './theme';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="Reel" component={Reel} durationInFrames={REEL_FRAMES} fps={FPS} width={W} height={H} defaultProps={{music: 'original' as const}} />
    <Composition id="ReelSinMusica" component={Reel} durationInFrames={REEL_FRAMES} fps={FPS} width={W} height={H} defaultProps={{music: 'ninguna' as const}} />
    <Composition id="ReelCancion" component={Reel} durationInFrames={REEL_FRAMES} fps={FPS} width={W} height={H} defaultProps={{music: 'cancion' as const}} />
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
