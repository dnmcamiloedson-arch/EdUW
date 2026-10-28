// Raíz del recap: «RecapOutro» = recap (clips de public/recap/ según las props) + outro estándar de Westhill.
import React from 'react';
import {AbsoluteFill, Composition, Sequence, continueRender, delayRender, registerRoot} from 'remotion';
import {fontsReady} from '../lib/fonts';
import {OUTRO_LEN, Outro} from '../scenes/Outro';
import {Grade, Grain, Vignette} from '../components/core';
import {Recap, recapLength, type RecapProps} from './Recap';

const h = delayRender('fuentes');
fontsReady.then(() => continueRender(h));

const ConOutro: React.FC<RecapProps> = (p) => {
	const len = recapLength(p);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={len}>
				<Recap {...p} />
			</Sequence>
			<Sequence from={len} durationInFrames={OUTRO_LEN}>
				<Outro />
				<Grade />
				<Vignette />
				<Grain />
			</Sequence>
		</AbsoluteFill>
	);
};

const vacio: RecapProps = {clips: []};
const Root: React.FC = () => (
	<Composition
		id="RecapOutro"
		component={ConOutro}
		fps={30}
		width={1080}
		height={1920}
		durationInFrames={300}
		defaultProps={vacio}
		calculateMetadata={({props}) => ({durationInFrames: recapLength(props) + OUTRO_LEN})}
	/>
);
registerRoot(Root);
