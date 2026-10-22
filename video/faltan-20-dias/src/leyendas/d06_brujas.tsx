// Día 6 · «Lo que vio el espejo» · Las Brujas de Fuego. Todo el episodio se ve DESDE el espejo de hojalata de la abuela:
// el reflejo gira con el péndulo del clavo, el vidrio (vaho, rayones, hollín, grieta) va fijo a la pantalla.
// Cada beat se pinta en d06/beats1–3; la sincronía vive en d06/timeline.ts (copiada en scripts/leyendas/d06.py).
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Scene} from './kit/scene';
import type {PostOpts} from './kit/post';
import type {Ctx} from './kit/paint';
import {B, LEN, ORDER, type BeatId} from './d06/timeline';
import {paintFogon, paintHook, paintRoom, paintScissorsBeat, paintTitleBeat} from './d06/beats1';
import {paintDoze, paintOwlBeat, paintRoofBeat, paintRoofs, paintStill, paintWindowBeat} from './d06/beats2';
import {paintBreath, paintDawn, paintFace, paintFeed, paintLockup, paintSlam, paintWake} from './d06/beats3';
import {Texts06} from './d06/text';
import {P} from './d06/timeline';

export const EP06_LEN = LEN;

const PAINTERS: Record<BeatId, (g: Ctx, f: number) => PostOpts> = {
	hook: paintHook,
	room: paintRoom,
	scissors: paintScissorsBeat,
	fogon: paintFogon,
	title: paintTitleBeat,
	roofs: paintRoofs,
	doze: paintDoze,
	still: paintStill,
	owl: paintOwlBeat,
	window: paintWindowBeat,
	roof: paintRoofBeat,
	feed: paintFeed,
	wake: paintWake,
	face: paintFace,
	slam: paintSlam,
	dawn: paintDawn,
	breath: paintBreath,
	lockup: paintLockup,
};

const paint = (g: Ctx, f: number): PostOpts => {
	for (const id of ORDER) if (f >= B[id][0] && f < B[id][1]) return PAINTERS[id](g, f);
	return paintLockup(g, Math.min(f, LEN - 1));
};

export const Ep06: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	return (
		<Scene paint={paint} bg={P.floor}>
			<Texts06 f={f} dias={dias} fecha={fecha} />
		</Scene>
	);
};
