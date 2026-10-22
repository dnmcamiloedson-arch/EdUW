// Compositor del episodio: (1) el reflejo (cuarto + ventana) pintado con la transformación del espejo,
// (2) dobles fantasma, plata y rayones del vidrio, (3) vaho, (4) hollín/grieta/mano en el vidrio, (5) dedos encima.
import {noise2D} from '@remotion/noise';
import {clamp, rgba} from '../../lib/util';
import {blurred, cached, glow, makeCanvas, type Ctx} from '../kit/paint';
import {paintAbuela, type AbuelaPose} from './abuela';
import {paintCradle, type CradleOpts} from './cradle';
import {paintExterior, WIN, type ExtOpts} from './exterior';
import {paintFog, paintGlass, type FogOpts, type GlassOpts} from './glass';
import type {Light} from './light';
import {mirrorXf, toScreen, withWorld, type MirrorXf} from './mirror';
import {CANDLE, RW, paintRoomBack, paintScissors, paintVeladora, roomCanvas, SILL} from './room';
import {FPS, P} from './timeline';

export const SCISSORS_X = 820;

// parpadeo vivo de la veladora
export const candleK = (f: number, still = 0) => {
	const t = f / FPS;
	const n = noise2D('d6cand', t * 3.1, 0) * 0.05 + noise2D('d6cand2', t * 9, 1) * 0.025;
	return 1 + n * (1 - still);
};
export const candleLight = (k: number, stub = 0): Light => ({x: CANDLE.x, y: CANDLE.y - 110 + stub * 120, r: 170, color: '#F5B04A', a: k, kind: 'candle'});

export type RoomScene = {
	f: number;
	focus?: number; // 0 foco en el cuarto, 1 foco en la ventana
	ext?: Partial<ExtOpts>;
	outside?: (g: Ctx) => void; // entre el exterior y el muro (orbes de afuera, sombra del fogón)
	scissors?: {x?: number; open: number; flash?: number; held?: [number, number] | null} | null;
	cradle?: Partial<CradleOpts> | null;
	abuela?: AbuelaPose | null;
	behindCradle?: boolean; // la abuela queda detrás de la cuna
	extra?: (g: Ctx) => void; // después de la abuela, antes de la veladora
	candle?: {k?: number; lean?: number; stub?: number; flame?: number};
	orbPools?: {x: number; y: number; r: number; a: number}[]; // luz de orbes sobre el cuarto (aditiva)
	darken?: number; // 0..1 oscurece el cuarto (noche que vuelve)
	veladora?: boolean;
};

// pinta el cuarto completo en coordenadas del reflejo
export const paintRoomScene = (g: Ctx, sc: RoomScene) => {
	const {f, focus = 0} = sc;
	const t = f / FPS;
	const ck = sc.candle?.k ?? candleK(f);
	// fondo oscuro sobredimensionado
	g.fillStyle = P.floor;
	g.fillRect(RW.x, RW.y, RW.w, RW.h);
	// exterior por la ventana
	g.save();
	g.beginPath();
	g.rect(WIN.x0 - 4, WIN.y0 - 4, WIN.x1 - WIN.x0 + 8, WIN.y1 - WIN.y0 + 8);
	g.clip();
	paintExterior(g, {t, focus, ...sc.ext});
	if (sc.outside) sc.outside(g);
	g.restore();
	// muro (desenfocado cuando el foco está en la ventana)
	if (focus > 0.05) {
		const b = blurred(roomCanvas(), 4, 'd06:room');
		g.save();
		g.globalAlpha = clamp(focus);
		g.drawImage(b.canvas, RW.x - b.pad, RW.y - b.pad);
		g.restore();
		if (focus < 0.95) {
			g.save();
			g.globalAlpha = 1 - focus;
			paintRoomBack(g, {candle: ck});
			g.restore();
		}
	} else paintRoomBack(g, {candle: ck});
	// tijeras en la repisa
	if (sc.scissors) {
		const s = sc.scissors;
		const [sx, sy] = s.held ?? [s.x ?? SCISSORS_X, SILL.y];
		paintScissors(g, sx, sy, s.open, 0.7, s.flash ?? 0);
	}
	const ab = sc.abuela;
	const near = (q: Ctx) => {
		if (ab && sc.behindCradle) paintAbuela(q, ab, f);
		if (sc.cradle !== null) paintCradle(q, {f, light: ck, ...sc.cradle});
		if (ab && !sc.behindCradle) paintAbuela(q, ab, f);
	};
	// foco en la ventana: la cuna y la madre (más cerca del espejo) se desenfocan con el muro
	const nb = focus * 3.5;
	if (nb > 0.4) {
		const L = cached('d06:nearL', () => makeCanvas(1080, 1920));
		const q = L.getContext('2d')!;
		q.setTransform(1, 0, 0, 1, 0, 0);
		q.clearRect(0, 0, 1080, 1920);
		q.setTransform(g.getTransform());
		near(q);
		g.save();
		g.setTransform(1, 0, 0, 1, 0, 0);
		g.filter = `blur(${nb.toFixed(1)}px)`;
		g.drawImage(L, 0, 0);
		g.restore();
	} else near(g);
	if (sc.extra) sc.extra(g);
	// luz de los orbes sobre el cuarto
	for (const p of sc.orbPools ?? []) glow(g, p.x, p.y, p.r, P.cempa, p.a, 0.25);
	if (sc.darken && sc.darken > 0) {
		g.save();
		g.globalCompositeOperation = 'multiply';
		g.fillStyle = rgba('#2a1606', clamp(sc.darken));
		g.fillRect(RW.x, RW.y, RW.w, RW.h);
		g.restore();
	}
	if (sc.veladora !== false) paintVeladora(g, t, {lean: sc.candle?.lean ?? 0, flame: sc.candle?.flame ?? ck, stub: sc.candle?.stub ?? 0});
};

export type ComposeOpts = {
	xf?: MirrorXf;
	world: (g: Ctx) => void; // pinta el reflejo (coordenadas del mundo)
	lights: Light[]; // en coordenadas del mundo
	glass?: Partial<GlassOpts>;
	fog?: FogOpts | null;
	onGlass?: (g: Ctx) => void; // hollín, mano, grieta (pantalla)
	above?: (g: Ctx) => void; // dedos de la abuela (pantalla, encima de todo)
};

// un cuadro completo; regresa las luces en pantalla (para la post)
export const compose = (g: Ctx, f: number, o: ComposeOpts) => {
	const t = f / FPS;
	const xf = o.xf ?? mirrorXf(f);
	g.fillStyle = P.floor;
	g.fillRect(0, 0, 1080, 1920);
	withWorld(g, xf, () => o.world(g));
	const screenLights = o.lights.map((l) => {
		const [x, y] = toScreen(xf, l.x, l.y);
		return {...l, x, y};
	});
	paintGlass(g, {t, lights: screenLights, ...o.glass});
	if (o.fog) paintFog(g, o.fog);
	if (o.onGlass) {
		g.save();
		g.setTransform(1, 0, 0, 1, 0, 0);
		o.onGlass(g);
		g.restore();
	}
	if (o.above) {
		g.save();
		g.setTransform(1, 0, 0, 1, 0, 0);
		o.above(g);
		g.restore();
	}
	return screenLights;
};
