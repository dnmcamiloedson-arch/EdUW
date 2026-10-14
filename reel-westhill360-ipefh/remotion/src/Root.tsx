import React from 'react';
import {Composition} from 'remotion';
import {Intro, INTRO_FRAMES} from './Intro';
import {FPS, H, W, loadFonts} from './theme';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="Intro" component={Intro} durationInFrames={INTRO_FRAMES} fps={FPS} width={W} height={H} />
  </>
);
