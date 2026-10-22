// Día 5 · «No voltees» · El Charro Negro. Una sola toma en primera persona: los únicos cortes son tus parpadeos.
// La llama del farol es la brújula (se inclina hacia él); la luna siempre detrás proyecta las sombras al frente.
// Cada beat se pinta en d05/beats1–3; la sincronía vive en d05/timeline.ts (copiada en scripts/leyendas/d05.py).
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Scene} from './kit/scene';
import type {PostOpts} from './kit/post';
import type {Ctx} from './kit/paint';
import {B, LEN, ORDER, P, type BeatId} from './d05/timeline';
import {paintArco, paintCamino, paintHook, paintNoParp, paintSilencio, paintSombra} from './d05/beats1';
import {paintColumna, paintRecoge, paintTrato, paintVacio} from './d05/beats2';
import {paintCabalgata, paintCinco, paintJump, paintSinDueno, paintVuelve} from './d05/beats3';
import {Texts05} from './d05/text';

export const EP05_LEN = LEN;

const PAINTERS: Record<BeatId, (g: Ctx, f: number) => PostOpts> = {
	hook: paintHook,
	camino: paintCamino,
	sombra: paintSombra,
	silencio: paintSilencio,
	arco: paintArco,
	noparp: paintNoParp,
	vacio: paintVacio,
	columna: paintColumna,
	trato: paintTrato,
	recoge: paintRecoge,
	jump: paintJump,
	cabalgata: paintCabalgata,
	sindueno: paintSinDueno,
	vuelve: paintVuelve,
	cinco: paintCinco,
};

const paint = (g: Ctx, f: number): PostOpts => {
	for (const id of ORDER) if (f >= B[id][0] && f < B[id][1]) return PAINTERS[id](g, f);
	return paintCinco(g, Math.min(f, LEN - 1));
};

export const Ep05: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	return (
		<Scene paint={paint} bg={P.brown}>
			<Texts05 f={f} dias={dias} fecha={fecha} />
		</Scene>
	);
};
