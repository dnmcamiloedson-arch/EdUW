import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {OUTRO_LEN, Outro} from '../scenes/Outro';
import {Grade, Grain, Vignette} from '../components/core';
import {C16_LEN, Cap16} from './c16';

// Cada día de la cuenta regresiva es un capítulo con escenas, música y revelación propias.
type Cap = {len: number; Comp: React.FC<{dias: number; fecha: string}>};
export const CAPS: Record<number, Cap> = {
	16: {len: C16_LEN, Comp: Cap16},
};
export type CapProps = {dias: number; fecha: string};
export const capLength = (dias: number) => (CAPS[dias]?.len ?? 300) + OUTRO_LEN;

export const Capitulo: React.FC<CapProps> = ({dias, fecha}) => {
	const cap = CAPS[dias];
	if (!cap) throw new Error(`Capítulo ${dias} aún no existe`);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={cap.len} name={`Capítulo ${dias}`}>
				<cap.Comp dias={dias} fecha={fecha} />
			</Sequence>
			<Sequence from={cap.len} durationInFrames={OUTRO_LEN} name="Outro · logo">
				<Outro />
			</Sequence>
			<Grade />
			<Vignette />
			<Grain />
		</AbsoluteFill>
	);
};
