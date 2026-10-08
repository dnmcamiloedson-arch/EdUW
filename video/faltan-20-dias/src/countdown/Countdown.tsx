import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import recipes from './recipes.json';
import {ShotView, Shot} from './shots';
import {Reveal} from './reveals';
import {OUTRO_LEN, Outro} from '../scenes/Outro';
import {Grade, Grain, Vignette} from '../components/core';
import {C, rgba} from '../lib/util';

export type Recipe = {
	formato: 'reel' | 'historia';
	grade: string;
	shots: Shot[];
	revelacion: {estilo: string; dur: number; variante?: string};
};
export type CountdownProps = {dias: number; fecha: string};

export const recipeFor = (dias: number): Recipe => {
	const r = (recipes as unknown as Record<string, Recipe>)[String(dias)];
	if (!r) throw new Error(`No hay receta para el día ${dias}`);
	return r;
};
export const countdownLength = (dias: number) => {
	const r = recipeFor(dias);
	return r.shots.reduce((a, s) => a + s.dur, 0) + r.revelacion.dur + OUTRO_LEN;
};

// Variaciones de etalonaje por día (siempre dentro de la paleta).
const Tint: React.FC<{grade: string}> = ({grade}) => {
	if (grade === 'rosa') return <AbsoluteFill style={{background: rgba(C.terracota, 0.16), mixBlendMode: 'soft-light'}} />;
	if (grade === 'oro') return <AbsoluteFill style={{background: rgba(C.flama, 0.14), mixBlendMode: 'soft-light'}} />;
	if (grade === 'verde') return <AbsoluteFill style={{background: rgba(C.verde, 0.2), mixBlendMode: 'soft-light'}} />;
	if (grade === 'noche')
		return (
			<>
				<AbsoluteFill style={{background: rgba('#000', 0.18), mixBlendMode: 'multiply'}} />
				<AbsoluteFill style={{background: rgba(C.verde, 0.1), mixBlendMode: 'soft-light'}} />
			</>
		);
	return null;
};

export const Countdown: React.FC<CountdownProps> = ({dias, fecha}) => {
	const r = recipeFor(dias);
	let acc = 0;
	const seqs = r.shots.map((s, i) => {
		const from = acc;
		acc += s.dur;
		return (
			<Sequence key={i} from={from} durationInFrames={s.dur} name={`${i + 1}. ${s.tipo}`}>
				<ShotView shot={s} />
			</Sequence>
		);
	});
	const revAt = acc;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			{seqs}
			<Sequence from={revAt} durationInFrames={r.revelacion.dur} name={`Revelación · ${r.revelacion.estilo}`}>
				<Reveal estilo={r.revelacion.estilo} variante={r.revelacion.variante} dias={dias} fecha={fecha} dur={r.revelacion.dur} />
			</Sequence>
			<Sequence durationInFrames={revAt + r.revelacion.dur} name="Etalonaje del día">
				<Tint grade={r.grade} />
			</Sequence>
			<Sequence from={revAt + r.revelacion.dur} durationInFrames={OUTRO_LEN} name="Outro · logo">
				<Outro />
			</Sequence>
			<Grade />
			<Vignette />
			<Grain />
		</AbsoluteFill>
	);
};
