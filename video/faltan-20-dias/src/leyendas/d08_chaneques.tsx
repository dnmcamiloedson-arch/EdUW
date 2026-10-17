// Día 8 · El listón rojo · Los Chaneques. POV con linterna: el haz es la única luz y el único grabador.
// Cada beat se pinta en su módulo (d08/beats1–3); la sincronía vive en d08/timeline.ts. Textos en DOM (kit Line).
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Scene} from './kit/scene';
import {LeyendaLockup, Line, type LineMode} from './kit/text';
import type {PostOpts} from './kit/post';
import type {Ctx} from './kit/paint';
import {P, torch} from './d08/core';
import {B, EP08_LEN as LEN, EV, type BeatId} from './d08/timeline';
import {paintB1, paintB2, paintB3, paintB4} from './d08/beats1';
import {paintB5, paintB6} from './d08/beats2';
import {paintB7, paintB8, paintB9, paintB10, paintB11, paintB12} from './d08/beats3';

export const EP08_LEN = LEN;

const PAINTERS: [BeatId, (g: Ctx, f: number) => PostOpts][] = [
	['b1', paintB1],
	['b2', paintB2],
	['b3', paintB3],
	['b4', paintB4],
	['b5', paintB5],
	['b6', paintB6],
	['b7', paintB7],
	['b8', paintB8],
	['b9', paintB9],
	['b10', paintB10],
	['b11', paintB11],
	['b12', paintB12],
];

const paint = (g: Ctx, f: number): PostOpts => {
	for (const [id, fn] of PAINTERS) if (f >= B[id][0] && f < B[id][1]) return fn(g, f);
	return paintB12(g, Math.min(f, B.b12[1] - 1));
};

// nivel de la linterna que ilumina los textos «flicker»
const beamLevel = (f: number) => {
	if (f < B.b2[0]) return Math.max(0.25, torch(f, EV.torchOn));
	return 0.9 + 0.1 * Math.sin(f * 1.7) * Math.sin(f * 0.53);
};

type T = {text: string; at: number; out: number; y: number; size: number; font?: 'Rye' | 'Alike'; color: string; mode: LineMode; accent?: Record<string, string>; tracking?: number; scrim?: number; glow?: string};
// T01–T17 (tratamiento): «» para las palabras de la abuela, arena; narración en hueso
const TEXT: T[] = [
	{text: 'Mi abuela decía:', at: 8, out: 70, scrim: 0.3, y: 430, size: 46, font: 'Rye', color: P.arena, mode: 'flicker', tracking: 0.08},
	{text: '«Si el monte te llama,\nno contestes.»', at: 21, out: 70, scrim: 0.3, y: 510, size: 66, color: P.arena, mode: 'flicker'},
	{text: '«No te quites el listón.»', at: 102, out: 141, y: 440, size: 64, color: P.arena, mode: 'soft'},
	{text: '«Los chaneques\nte esconden las cosas\npara que los sigas.»', at: 160, out: 227, y: 420, size: 62, color: P.arena, mode: 'soft', accent: {chaneques: P.cempa}},
	{text: 'Este año bajé al río\npor flores para su altar.', at: 254, out: 327, y: 430, size: 64, color: P.bone, mode: 'soft'},
	{text: 'Las flores ya no estaban.', at: 435, out: 466, y: 440, size: 64, color: P.bone, mode: 'flicker'},
	{text: 'Ni el listón.', at: 483, out: 506, y: 440, size: 72, color: P.bone, mode: 'flicker'},
	{text: 'Algo me llamó\ncon la voz de mi abuela.', at: 528, out: 600, y: 430, size: 64, color: P.bone, mode: 'flicker'},
	{text: 'Mi abuela murió en marzo.', at: 606, out: 660, y: 470, size: 66, color: P.bone, mode: 'soft'},
	{text: 'Y aun así, contesté.', at: 672, out: 712, y: 470, size: 66, color: P.bone, mode: 'flicker'},
	{text: 'Corrí.', at: 741, out: 763, y: 470, size: 84, font: 'Rye', color: P.bone, mode: 'slam'},
	{text: 'Y siempre volvía\na la misma piedra.', at: 767, out: 846, y: 430, size: 64, color: P.bone, mode: 'soft', scrim: 0.45},
	{text: 'LOS', at: EV.slam, out: 1011, y: 760, size: 70, font: 'Rye', color: P.gold, mode: 'slam', scrim: 0, glow: P.cempa, tracking: 0.12},
	{text: 'CHANEQUES', at: EV.slam, out: 1011, y: 840, size: 128, font: 'Rye', color: P.gold, mode: 'slam', scrim: 0, glow: P.cempa, tracking: 0.02},
	{text: 'Desperté a la orilla\ndel camino.', at: 1019, out: 1071, y: 430, size: 62, color: P.bone, mode: 'soft'},
	{text: 'Para mí, fue una noche.', at: 1074, out: 1120, y: 470, size: 62, color: P.bone, mode: 'soft'},
	{text: 'Me buscaron ocho días.', at: 1127, out: 1185, y: 430, size: 66, color: P.bone, mode: 'soft', accent: {ocho: P.gold}},
];

export const Ep08: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const bl = beamLevel(f);
	return (
		<Scene paint={paint} bg={P.ink}>
			{TEXT.map((x, i) => (
				<Line key={i} text={x.text} f={f} at={x.at} out={x.out} y={x.y} size={x.size} font={x.font ?? 'Alike'} color={x.color} mode={x.mode} accent={x.accent} tracking={x.tracking} scrim={x.scrim ?? 0.42} glow={x.glow ?? P.cempa} beam={x.mode === 'flicker' ? bl : 1} maxWidth={940} />
			))}
			{f >= EV.lockup - 2 ? <LeyendaLockup f={f} at={EV.lockup} dias={dias} fecha={fecha} top={470} bottom={1290} /> : null}
		</Scene>
	);
};
