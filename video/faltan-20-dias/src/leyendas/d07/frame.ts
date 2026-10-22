// Día 7 · la pila de capas de cada cuadro (un solo plano secuencia). Los beats (beats.ts) llenan el Frame con
// casters de sombra, actores, brillos y ajustes de post; aquí se pinta en orden lejos → cerca.
import {C, clamp} from '../../lib/util';
import {glow, type Ctx} from '../kit/paint';
import type {PostOpts} from '../kit/post';
import {resetLayers} from './layer';
import {applyLight, lightMap, type Caster, type MaskLayer} from './light';

import {drawAlley, drawBuckets, drawDust, drawSet} from './set';
import {drawBlackBand, drawShutter} from './shutter';
import {WALL_BASE, WALL_SX0, bulbI, bulbPos, camAt, focusZ, shutterEdge, shutterT, worldT, type CamT, type V3} from './world';
import {BEATS} from './beats';

export type Actor = {z: number; draw: (g: Ctx, fr: Frame) => void};
export type Glow = {x: number; y: number; r: number; color: string; a: number; core?: number};
export type Frame = {
	f: number;
	t: number;
	L: V3;
	I: number;
	cam: CamT;
	edge: number;
	focus: number;
	casters: Caster[];
	masks: MaskLayer[];
	actors: Actor[];
	glows: Glow[]; // brillos aditivos en el mundo después del mapa de luz (ojos dentro de las sombras)
	alley: ((g: Ctx) => void)[]; // cosas dentro del callejón (tecolote, ojos en la niebla)
	over: ((g: Ctx) => void)[]; // encima de la cortina, en pantalla (posimagen)
	post: PostOpts;
	buckets: boolean;
};

export const POST_BASE: PostOpts = {
	contrast: 1.06,
	saturation: 0.9,
	shadows: [0, 0.014, 0.03],
	highlights: [0.03, 0.016, -0.005],
	hatch: 0.22,
	hatchScale: 5,
	hatchAngle: -0.6,
	hatchInk: [0.137, 0.075, 0.02],
	halation: 0.25,
	bloom: 0.5,
	bloomThr: 0.72,
	grain: 0.07,
	vignette: 0.4,
	ca: 1,
};

export const paintFrame = (g: Ctx, f: number, t: number): PostOpts => {
	resetLayers();
	const fr: Frame = {
		f,
		t,
		L: bulbPos(t),
		I: bulbI(f),
		cam: camAt(f),
		edge: shutterEdge(f),
		focus: focusZ(f),
		casters: [],
		masks: [],
		actors: [],
		glows: [],
		alley: [],
		over: [],
		post: {...POST_BASE},
		buckets: true,
	};
	for (const b of BEATS) if (f >= b.f0 && f < b.f1) b.fn(fr);
	const closed = fr.edge >= 1935;
	g.fillStyle = C.ink;
	g.fillRect(0, 0, 1080, 1920);
	if (!closed) {
		worldT(g, fr.cam);
		drawAlley(g, t, f, (q) => fr.alley.forEach((fn) => fn(q)));
		drawSet(g);
		applyLight(g, lightMap(fr.L, fr.I, fr.casters, fr.masks));
		// brillos dentro de las sombras: solo donde hay pared o calle (el callejón no recibe sombras del foco)
		g.save();
		g.beginPath();
		g.rect(WALL_SX0, -200, 1600, 2400);
		g.rect(-400, WALL_BASE, 2000, 1200);
		g.clip();
		for (const e of fr.glows) glow(g, e.x, e.y, e.r, e.color, e.a, e.core);
		g.restore();
		fr.actors.sort((a, b) => b.z - a.z).forEach((a) => a.draw(g, fr));
		if (fr.buckets) drawBuckets(g, t, fr.I);
		drawDust(g, t, fr.I, 430);
	}
	shutterT(g, fr.cam, f);
	// portazo: copias desplazadas (desenfoque de movimiento vertical)
	if (f >= 957 && f <= 960) {
		const prev = shutterEdge(f - 1);
		for (let k = 5; k >= 1; k--) {
			g.save();
			g.globalAlpha = 0.18 * (1 - k / 6);
			drawShutter(g, fr.edge + (prev - fr.edge) * (k / 6), fr.I, t);
			g.restore();
		}
	}
	drawShutter(g, fr.edge, fr.I, t);
	if (closed) drawBlackBand(g, fr.edge, f, t);
	g.setTransform(1, 0, 0, 1, 0, 0);
	fr.over.forEach((fn) => fn(g));
	void clamp;
	return fr.post;
};
