import React from 'react';
import {Composition, continueRender, delayRender} from 'remotion';
import {TOTAL, Teaser, teaserSchemaDefaults} from './Teaser';
import {fontsReady} from './lib/fonts';
import {Countdown, CountdownProps, countdownLength} from './countdown/Countdown';
import {CapProps, Capitulo, capLength} from './cap/Capitulo';
import {LAB_LEN, Laboratorio} from './leyendas/Laboratorio';
import {LAB2_LEN, Laboratorio2} from './leyendas/Laboratorio2';

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
		{/* Segunda temporada: cada día es un capítulo de la historia (src/cap) */}
		<Composition
			id="Capitulo"
			component={Capitulo}
			durationInFrames={capLength(16)}
			fps={30}
			width={1080}
			height={1920}
			defaultProps={{dias: 16, fecha: '28 · 10'} as CapProps}
			calculateMetadata={({props}) => ({durationInFrames: capLength(props.dias)})}
		/>
		{/* Laboratorio del motor 2D de la serie de leyendas */}
		<Composition id="Laboratorio" component={Laboratorio} durationInFrames={LAB_LEN} fps={30} width={1080} height={1920} />
		<Composition id="Laboratorio2" component={Laboratorio2} durationInFrames={LAB2_LEN} fps={30} width={1080} height={1920} />
	</>
);
