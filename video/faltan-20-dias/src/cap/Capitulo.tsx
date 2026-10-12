import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {OUTRO_LEN, Outro} from '../scenes/Outro';
import {Grade, Grain, Vignette} from '../components/core';
import {C16_LEN, Cap16} from './c16';
import {C15_LEN, Cap15} from './c15';
import {C14_LEN, Cap14} from './c14';
import {C13_LEN, Cap13} from './c13';
import {C12_LEN, Cap12} from './c12';
import {C11_LEN, Cap11} from './c11';

// Cada día de la cuenta regresiva es un capítulo con escenas, música y revelación propias.
type Cap = {len: number; Comp: React.FC<{dias: number; fecha: string}>};
export const CAPS: Record<number, Cap> = {
	16: {len: C16_LEN, Comp: Cap16},
	15: {len: C15_LEN, Comp: Cap15},
	14: {len: C14_LEN, Comp: Cap14},
	13: {len: C13_LEN, Comp: Cap13},
	12: {len: C12_LEN, Comp: Cap12},
	11: {len: C11_LEN, Comp: Cap11},
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
