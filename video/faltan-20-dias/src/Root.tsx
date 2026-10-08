import React from 'react';
import {Composition, continueRender, delayRender} from 'remotion';
import {TOTAL, Teaser, teaserSchemaDefaults} from './Teaser';
import {fontsReady} from './lib/fonts';
import {Countdown, CountdownProps, countdownLength} from './countdown/Countdown';

const h = delayRender('fuentes');
fontsReady.then(() => continueRender(h));

const cuentaDefaults: CountdownProps = {dias: 19, fecha: '28 · 10'};

export const Root: React.FC = () => (
	<>
		<Composition id="FaltanDias" component={Teaser} durationInFrames={TOTAL} fps={30} width={1080} height={1920} defaultProps={teaserSchemaDefaults} />
		{/* Días 19 → 1: cada día tiene su receta de tomas y revelación (src/countdown/recipes.json) */}
		<Composition
			id="CuentaRegresiva"
			component={Countdown}
			durationInFrames={countdownLength(19)}
			fps={30}
			width={1080}
			height={1920}
			defaultProps={cuentaDefaults}
			calculateMetadata={({props}) => ({durationInFrames: countdownLength(props.dias)})}
		/>
	</>
);
