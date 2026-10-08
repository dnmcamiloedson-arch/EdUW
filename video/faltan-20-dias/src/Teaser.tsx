import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {SceneA} from './scenes/SceneA';
import {SceneB} from './scenes/SceneB';
import {SceneC} from './scenes/SceneC';
import {SceneD} from './scenes/SceneD';
import {SceneE} from './scenes/SceneE';
import {OUTRO_LEN, Outro} from './scenes/Outro';
import {Grade, Grain, Vignette} from './components/core';

export type TeaserProps = {dias: number; fecha: string; mostrarFecha: boolean};
export const teaserSchemaDefaults: TeaserProps = {dias: 20, fecha: '28 · 10', mostrarFecha: true};

// Mapa de tiempos (30 fps): cada corte cae en un latido / beat del diseño sonoro.
export const CUTS = {B: 225, C: 300, D: 375, E: 450, END: 600};
export const TOTAL = CUTS.END + OUTRO_LEN; // 735 frames = 24.5 s

export const Teaser: React.FC<TeaserProps> = ({dias, fecha, mostrarFecha}) => (
	<AbsoluteFill style={{background: '#000'}}>
		<Sequence durationInFrames={CUTS.B} name="Ignición · pétalos · papel picado">
			<SceneA />
		</Sequence>
		<Sequence from={CUTS.B} durationInFrames={CUTS.C - CUTS.B} name="Calavera">
			<SceneB />
		</Sequence>
		<Sequence from={CUTS.C} durationInFrames={CUTS.D - CUTS.C} name="Camino y copal">
			<SceneC />
		</Sequence>
		<Sequence from={CUTS.D} durationInFrames={CUTS.E - CUTS.D} name="Montaje">
			<SceneD />
		</Sequence>
		<Sequence from={CUTS.E} durationInFrames={CUTS.END - CUTS.E} name="Altar y título">
			<SceneE dias={dias} fecha={fecha} mostrarFecha={mostrarFecha} />
		</Sequence>
		<Sequence from={CUTS.END} durationInFrames={OUTRO_LEN} name="Outro · logo">
			<Outro />
		</Sequence>
		<Grade />
		<Vignette />
		<Grain />
	</AbsoluteFill>
);
