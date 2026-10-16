// Día 8 · G2 (frames 522–849): B5 la voz (silueta que cruza, 40 pares de ojos) · B6 corrí (carrera + la misma piedra).
// ESQUELETO (etapa 1): bosque por planos, linterna, cámara y ojos por hueco de profundidad ya bloqueados.
import {noise2D} from '@remotion/noise';
import {H, W, clamp, hash, lerp} from '../../lib/util';
import {cached, fogBand, type Ctx} from '../kit/paint';
import type {PostOpts} from '../kit/post';
import type {Cam} from '../kit/stage';
import {P, beamCone, beamWarm, blink, darkMap, eyeOpen, eyePair, fillBg, litPlane, ring, seg, smooth, spr, type Beam} from './core';
import {EYE_H, forestLayout, forestScene, planeXf, viewPt, type FPlane, type View} from './forest';
import {stoneShot} from './beats1';
import {B, EV, POST_NIGHT} from './timeline';

const sec = (f: number) => f / 30;

// ---------------------------------------------------------------- B5 · la voz (522–738)
const B5_Z = [15000, 11000, 8000, 5500, 3200, 1700];
const B5_LAYOUT = () => forestLayout('b5', 5, B5_Z, {ferns: 7});
// 40 pares de ojos repartidos en los huecos de profundidad (a la altura de la rodilla: ~0.5 m sobre el suelo)
export type EyeSlot = {plane: number; x: number; y: number; s: number; tilt0: number};
export const B5_EYES = () =>
	cached('d8b5eyes', () => {
		const out: EyeSlot[] = [];
		const per = [5, 6, 7, 8, 8, 5]; // más cerca = menos
		B5_Z.forEach((z, i) => {
			for (let k = 0; k < per[i]; k++) {
				const span = 1.25 * z;
				out.push({plane: i, x: (hash(k, 500 + i) * 2 - 1) * span, y: EYE_H - 430 - hash(k, 520 + i) * 160, s: 60 + hash(k, 540 + i) * 20, tilt0: (hash(k, 560 + i) - 0.5) * 0.3});
			}
		});
		return out;
	});

export const paintB5 = (g: Ctx, f: number): PostOpts => {
	const t = sec(f);
	const lt = t - sec(B.b5[0]);
	// cabeza: búsqueda 0.4 Hz ±10°, látigo 30° a la izquierda, caída 12°, temblor
	const search = f >= EV.search0 && f < EV.still0 ? Math.sin((t - sec(EV.search0)) * 0.4 * Math.PI * 2) * 176 * smooth(seg(f, EV.search0, EV.search0 + 10)) * (1 - smooth(seg(f, EV.search1, EV.still0))) : 0;
	const whipL = 577 * spr(t - sec(EV.whipL), 220, 18);
	const sink = -213 * smooth(seg(f, EV.sink0, EV.sink1));
	const trem = f >= EV.zero ? noise2D('b5tr', t * 8, 0) * 2 : 0;
	const push = 1 + 0.04 * smooth(seg(f, EV.erupt, B.b5[1]));
	const view: View = {yaw: search + whipL + noise2D('b5h', lt * 0.3, 0) * 8 + trem, pitch: 60 + sink + noise2D('b5v', 0, lt * 0.25) * 6, roll: noise2D('b5r', lt * 0.3, 1) * 0.006};
	const cam: Cam = {x: 0, y: 0, z: 0, zoom: push};
	// la linterna apunta adonde mira la cabeza, con temblor de miedo
	const aimTrem = noise2D('b5aim', t * 8, 2) * (f >= EV.still0 ? 14 : 5);
	const beam: Beam = {x: 540 + aimTrem, y: 1160 + noise2D('b5aimy', t * 1.2, 0) * 10, r: 470, squash: 0.85, power: 0.95 + 0.05 * noise2D('b5fl', t * 6, 0)};
	fillBg(g, '#050a0b');
	const dark = darkMap(beam, 0.95);
	const eyes = B5_EYES();
	const open = eyeOpen(f, EV.erupt);
	const tiltAll = 0.26 * spr(t - sec(EV.tiltAll), 900, 30);
	const blinkAll = blink(f, EV.blinkAll);
	forestScene(g, {
		cam,
		view,
		t,
		layout: B5_LAYOUT(),
		dark,
		fogColor: '#1b3335',
		moon: 0.8,
		fogBands: 0.3,
		after: (i, z) => {
			// silueta que cruza ENTRE el tronco medio (3200) y el cercano (1700)
			if (i === 4 && f >= EV.dart0 - 2 && f <= EV.dart1 + 2) {
				const u = smooth(seg(f, EV.dart0, EV.dart1));
				litPlane(g, dark, (q) =>
					planeXf(q, cam, view, 2600, () => {
						const x = lerp(-900, -250, u);
						q.fillStyle = '#0c0907';
						q.beginPath();
						q.ellipse(x, EYE_H - 330, 120, 140, 0, 0, Math.PI * 2);
						q.ellipse(x, EYE_H - 470, 260, 40, 0, 0, Math.PI * 2);
						q.ellipse(x, EYE_H - 130, 90, 140, 0, 0, Math.PI * 2);
						q.fill();
					}),
				);
			}
			// ojos de ESTE hueco (los planos más cercanos los tapan después)
			if (f >= EV.whipL && f < EV.whipL + 8 && i === 3) {
				const [x, y, s] = viewPt(cam, view, -1800, EYE_H - 480, z);
				eyePair(g, x, y, 70 * s, {open: blink(f, EV.whipL + 1) * clamp((f - EV.whipL) / 2)});
			}
			if (open > 0) {
				for (const e of eyes) {
					if (e.plane !== i) continue;
					const [x, y, s] = viewPt(cam, view, e.x, e.y, z);
					if (x < -60 || x > W + 60 || y < -60 || y > H + 60) continue;
					eyePair(g, x, y, e.s * s, {open: open * blinkAll, tilt: e.tilt0 + tiltAll, alpha: 0.95});
				}
			}
		},
	});
	beamWarm(g, beam);
	beamCone(g, 760, 2050, beam, t, 0.08, 5);
	fogBand(g, {y0: 980, y1: 1400, color: P.bone, t, seed: 27, alpha: 0.1, speed: 12});
	// cero digital antes de la erupción: imagen congelada en oscuridad casi total
	return {...POST_NIGHT, bloom: open > 0 ? 0.65 : 0.5};
};

// ---------------------------------------------------------------- B6 · corrí (738–849)
const B6_LAYOUT = () => forestLayout('b6', 6, [2000, 4000, 6000, 8000, 10000, 12000, 14000, 16000, 18000, 20000], {ferns: 6});
const wrapLayout = (lay: FPlane[], camZ: number, period = 20000): FPlane[] =>
	lay.map((p) => ({...p, z: 1200 + ((((p.z - camZ - 1200) % period) + period) % period)}));

const runShot = (g: Ctx, f: number, f0: number) => {
	const t = sec(f);
	const lt = t - sec(f0);
	const bob = Math.abs(Math.sin(t * 3 * Math.PI)) * 18;
	const roll = Math.sin(t * 3 * Math.PI) * 0.035;
	const camZ = (f - B.b6[0]) * 140;
	const cam: Cam = {x: Math.sin(lt * 1.3) * 60, y: -bob, z: 0, zoom: 1};
	const view: View = {yaw: noise2D('b6y', t * 0.8, 0) * 30, pitch: 40, roll};
	const beam: Beam = {x: 540 + noise2D('b6bx', t * 3, 0) * 90, y: 1150 + noise2D('b6by', 0, t * 3) * 70, r: 460, squash: 0.85, power: 0.95};
	fillBg(g, '#050a0b');
	const dark = darkMap(beam, 0.95);
	forestScene(g, {
		cam,
		view,
		t,
		layout: wrapLayout(B6_LAYOUT(), camZ),
		dark,
		fogColor: '#1b3335',
		moon: 0.8,
		fogBands: 0.25,
		after: (i, z) => {
			// tres siluetas corriendo en paralelo entre troncos del fondo
			if (f >= EV.parallel && f < EV.cut3 && z > 5000 && z < 7500) {
				litPlane(g, dark, (q) =>
					planeXf(q, cam, view, z - 300, () => {
						for (let k = 0; k < 3; k++) {
							const x = -2600 + k * 1300 + (f - EV.parallel) * 90;
							const hop = Math.abs(Math.sin((t * 2.5 + k * 0.3) * Math.PI)) * 60;
							q.fillStyle = '#0c0907';
							q.beginPath();
							q.ellipse(x, EYE_H - 300 - hop, 120, 120, 0, 0, Math.PI * 2);
							q.ellipse(x, EYE_H - 420 - hop, 250, 36, 0, 0, Math.PI * 2);
							q.fill();
						}
					}),
				);
			}
			// ojos que corren al borde del cuadro
			if (i === 2) {
				for (let k = 0; k < 3; k++) {
					const side = k % 2 ? 1 : -1;
					const [x, y, s] = viewPt(cam, view, side * (1500 + k * 300), EYE_H - 480, z);
					eyePair(g, x, y, 70 * s, {open: 1, alpha: 0.85});
				}
			}
		},
	});
	beamWarm(g, beam);
	beamCone(g, 760, 2050, beam, t, 0.06, 6);
};

export const paintB6 = (g: Ctx, f: number): PostOpts => {
	const t = sec(f);
	const cuts: [number, number, 2 | 3 | 4][] = [
		[EV.cut2, EV.run2, 2],
		[EV.cut3, EV.run3, 3],
		[EV.cut4, B.b6[1], 4],
	];
	for (const [a, b, pr] of cuts) {
		if (f >= a && f < b) {
			const decay = pr === 4 ? 1 - smooth(seg(f, a, b)) : 1;
			const k = 14 * decay;
			const cam = {x: noise2D('b6sx', t * 3, 0) * k, y: noise2D('b6sy', 0, t * 3) * k, zoom: 1, roll: noise2D('b6sr', t * 2, 0) * 0.01 * decay};
			const beam: Beam = {x: 540 + cam.x * 2, y: 1130 + cam.y * 2, r: 640, squash: 0.8, power: 0.97};
			stoneShot(g, f, {prints: pr, cam, beam});
			return {...POST_NIGHT};
		}
	}
	runShot(g, f, B.b6[0]);
	return {...POST_NIGHT, ca: 2.4};
};

void H;
void ring;
