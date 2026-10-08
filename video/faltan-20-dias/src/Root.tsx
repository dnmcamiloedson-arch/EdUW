import React from 'react';
import {Composition, continueRender, delayRender} from 'remotion';
import {TOTAL, Teaser, teaserSchemaDefaults} from './Teaser';
import {fontsReady} from './lib/fonts';

const h = delayRender('fuentes');
fontsReady.then(() => continueRender(h));

export const Root: React.FC = () => (
	<Composition id="FaltanDias" component={Teaser} durationInFrames={TOTAL} fps={30} width={1080} height={1920} defaultProps={teaserSchemaDefaults} />
);
