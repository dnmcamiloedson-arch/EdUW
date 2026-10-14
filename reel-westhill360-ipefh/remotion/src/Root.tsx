import React from 'react';
import {Composition} from 'remotion';
import {Intro, INTRO_FRAMES} from './Intro';
import {Reel, REEL_FRAMES} from './Reel';
import {Chapter, chapterDur, CHAPTERS, CORNHOLE_FRAMES, CornholeStory} from './Stories';
import {FPS, H, W, loadFonts} from './theme';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="Reel" component={Reel} durationInFrames={REEL_FRAMES} fps={FPS} width={W} height={H} defaultProps={{music: true}} />
    <Composition id="ReelSinMusica" component={Reel} durationInFrames={REEL_FRAMES} fps={FPS} width={W} height={H} defaultProps={{music: false}} />
    <Composition id="Historia4-Cornhole" component={CornholeStory} durationInFrames={CORNHOLE_FRAMES} fps={FPS} width={W} height={H} />
    {CHAPTERS.map((c) => (
      <Composition
        key={c.id}
        id={c.id}
        component={Chapter}
        durationInFrames={chapterDur(c.sections)}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{n: c.n, title: c.title, sections: c.sections}}
      />
    ))}
    <Composition id="Intro" component={Intro} durationInFrames={INTRO_FRAMES} fps={FPS} width={W} height={H} />
  </>
);
