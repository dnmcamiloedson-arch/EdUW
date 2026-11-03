// Outro de Westhill aislado (4.5 s), tal como cierra todos los videos de Día de Muertos.
import React from 'react';
import {AbsoluteFill, Composition, continueRender, delayRender, registerRoot} from 'remotion';
import {fontsReady} from './lib/fonts';
import {OUTRO_LEN, Outro} from './scenes/Outro';
import {Grade, Grain, Vignette} from './components/core';

const h = delayRender('fuentes');
fontsReady.then(() => continueRender(h));

const Solo: React.FC = () => (
	<AbsoluteFill style={{background: '#000'}}>
		<Outro />
		<Grade />
		<Vignette />
		<Grain />
	</AbsoluteFill>
);

registerRoot(() => <Composition id="OutroSolo" component={Solo} fps={30} width={1080} height={1920} durationInFrames={OUTRO_LEN} />);
