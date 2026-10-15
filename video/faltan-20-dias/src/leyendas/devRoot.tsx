// Raíz de desarrollo para un solo episodio: «Ep» (el episodio solo) y «EpOutro» (con el outro, como en Capitulo).
import React from 'react';
import {AbsoluteFill, Composition, Sequence, continueRender, delayRender} from 'remotion';
import {fontsReady} from '../lib/fonts';
import {OUTRO_LEN, Outro} from '../scenes/Outro';
import {Grade, Grain, Vignette} from '../components/core';

type EpC = React.FC<{dias: number; fecha: string}>;
export const devRoot = (Ep: EpC, len: number, dias: number, ownOutro = dias === 0) => {
	const h = delayRender('fuentes');
	fontsReady.then(() => continueRender(h));
	const WithOutro: React.FC<{dias: number; fecha: string}> = (p) => (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={len}>
				<Ep {...p} />
			</Sequence>
			{ownOutro ? null : (
				<Sequence from={len} durationInFrames={OUTRO_LEN}>
					<Outro />
					<Grade />
					<Vignette />
					<Grain />
				</Sequence>
			)}
		</AbsoluteFill>
	);
	const props = {dias, fecha: '28 · 10'};
	const DevRoot: React.FC = () => (
		<>
			<Composition id="Ep" component={Ep} durationInFrames={len} fps={30} width={1080} height={1920} defaultProps={props} />
			<Composition id="EpOutro" component={WithOutro} durationInFrames={len + (ownOutro ? 0 : OUTRO_LEN)} fps={30} width={1080} height={1920} defaultProps={props} />
		</>
	);
	return DevRoot;
};
