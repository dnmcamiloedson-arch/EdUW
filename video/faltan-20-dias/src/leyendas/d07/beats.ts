// Día 7 · los beats: cada función llena el Frame (casters de sombra, actores, brillos, post) para su rango de frames.
// Es un plano secuencia, así que los actores persisten entre beats; cada beat llama a los mismos actores con su estado.
import {C, E, clamp, lerp} from '../../lib/util';
import {glow, type Ctx} from '../kit/paint';
import type {Frame} from './frame';
import {drawer} from './layer';
import {card, magAt, projShadow, type Caster} from './light';
import {caneCaster, drawFermin, ferminCaster, ferminPose, STOP_X, STOP_Z} from './fermin';
import {coyoteCaster, coyoteState, dogCaster, drawCaneOnGround, drawCoyote, drawDog, drawHat, drawOwl, drawPile} from './props';
import {BIPED_EYES, BIPED_FRONT, COYOTE4, FRONT_EYES, HUNCHED, humanOutline, morph, resample} from './shapes';
import {G7, SEVEN_REST, glyph7} from './glyph';
import {BULB0, P, WALL_Z, blurFor, seg, wallX, wallY, type V2, type V3} from './world';

export type Beat = {id: string; name: string; f0: number; f1: number; fn: (fr: Frame) => void};

// ---------------------------------------------------------------- actores compartidos
const fermin = (fr: Frame) => {
	const p = ferminPose(fr.f);
	if (p.gone) return;
	fr.actors.push({z: p.z, draw: (g) => drawFermin(g, fr.f, fr.L, fr.I, blurFor(p.z, fr.f), drawer(g))});
};
const dog = (fr: Frame) => {
	const c = dogCaster(fr.f);
	if (c) fr.casters.push(c);
	fr.actors.push({z: 3.95, draw: (g) => drawDog(g, fr.f, fr.L, fr.I, drawer(g))});
};
const owl = (fr: Frame) => fr.alley.push((g: Ctx) => drawOwl(g, fr.f));
const streetLeftovers = (fr: Frame) => {
	fr.actors.push({z: 2.42, draw: (g) => drawPile(g, fr.f, STOP_X, STOP_Z, fr.L, fr.I, blurFor(2.4, fr.f), drawer(g))});
	fr.actors.push({z: 2.36, draw: (g) => drawCaneOnGround(g, fr.f)});
	fr.actors.push({z: 1.5, draw: (g) => drawHat(g, fr.f, fr.L, fr.I, blurFor(1.5, fr.f), drawer(g))});
};
// ojos de una sombra: anclas de la tarjeta proyectadas desde el foco
const shadowEyes = (fr: Frame, pts: V3[], core: number, a: number, color = C.flama) => {
	for (const q of pts) {
		const s = projShadow(fr.L, q);
		if (!s) continue;
		fr.glows.push({x: s[0], y: s[1], r: core * 7, color: C.cempa, a: 0.55 * a, core: 0.12});
		fr.glows.push({x: s[0], y: s[1], r: core * 1.6, color, a: 0.95 * a, core: 0.35});
		fr.glows.push({x: s[0], y: s[1], r: core * 0.7, color: '#FFF4D6', a: a, core: 0.4});
	}
};
// retro-proyección: punto de pantalla en la pared → punto de la tarjeta a profundidad zc (con el foco en reposo)
const backProject = (pt: V2, zc: number, L0: V3 = BULB0): V3 => {
	const w: V3 = [wallX(pt[0]), wallY(pt[1]), WALL_Z];
	const s = (zc - L0[2]) / (WALL_Z - L0[2]);
	return [L0[0] + (w[0] - L0[0]) * s, L0[1] + (w[1] - L0[1]) * s, zc];
};

// ---------------------------------------------------------------- B01 HOOK · la sombra gigante (0–77)
const B01 = (fr: Frame) => {
	const head = fr.f >= 31 && fr.f <= 36 ? 'coyote' : 'hat';
	const c = ferminCaster(fr.f, head);
	if (c) fr.casters.push(c);
	const cc = caneCaster(fr.f);
	if (cc) fr.casters.push(cc);
	fermin(fr);
	dog(fr);
	owl(fr);
};
// ---------------------------------------------------------------- B02 TÍTULO y el lugar (78–197)
const B02 = (fr: Frame) => {
	const c = ferminCaster(fr.f);
	if (c) fr.casters.push(c);
	const cc = caneCaster(fr.f);
	if (cc) fr.casters.push(cc);
	fermin(fr);
	dog(fr);
	owl(fr);
};
// ---------------------------------------------------------------- B03 su paseo; el perro despierta (198–335)
const B03 = (fr: Frame) => {
	// G1: retardo de 3 f de la sombra desde 216 + cola fina bajo el sarape
	const c = ferminCaster(fr.f >= 216 ? fr.f - 3 : fr.f);
	if (c) fr.casters.push(c);
	const cc = caneCaster(fr.f);
	if (cc) fr.casters.push(cc);
	fermin(fr);
	dog(fr);
	owl(fr);
};
// ---------------------------------------------------------------- B04 silencio · la sombra voltea (336–479)
const B04 = (fr: Frame) => {
	const f = fr.f;
	const turn = E.inOut(seg(f, 348, 390));
	const human = ferminCaster(f, 'hat');
	const front = ferminCaster(f, 'front');
	if (human && front) {
		human.alpha = 1 - turn;
		front.alpha = turn;
		fr.casters.push(human, front);
		// ojos 390 (ease-out 4 f), parpadeo 438–440
		const on = E.out(seg(f, 390, 394)) * (f >= 438 && f <= 440 ? 0 : 1);
		if (on > 0) {
			const p = ferminPose(f);
			shadowEyes(fr, card(FRONT_EYES, p.x, 0, p.z, -1), 9, on);
		}
	}
	const cc = caneCaster(f);
	if (cc) fr.casters.push(cc);
	fermin(fr);
	dog(fr);
	owl(fr);
};
// ---------------------------------------------------------------- B05 tres vueltas (480–677)
const KEY_HUMAN = resample(humanOutline(0, 'front'));
const KEY_HUNCH = resample(HUNCHED);
const KEY_COY = resample(COYOTE4);
const B05 = (fr: Frame) => {
	const f = fr.f;
	const p = ferminPose(f);
	// G2: 5 claves escalonadas (orejas primero), una por vuelta; esqueleto: humano → encorvado → coyote
	const u1 = E.inOut(seg(f, 486, 560));
	const u2 = E.inOut(seg(f, 560, 606));
	const shape = u2 > 0 ? morph(KEY_HUNCH, KEY_COY, u2) : morph(KEY_HUMAN, KEY_HUNCH, u1);
	const breathe = 1 + 0.015 * Math.sin(fr.t * Math.PI * 0.8);
	fr.casters.push({pts: card(shape, STOP_X, 0, STOP_Z, -1, breathe)});
	if (f < 606) {
		const on = 1 - seg(f, 486, 500);
		if (on > 0) shadowEyes(fr, card(FRONT_EYES, p.x, 0, p.z, -1), 9, on);
	}
	const cc = caneCaster(f);
	if (cc) fr.casters.push(cc);
	const co = coyoteCaster(f);
	if (co) fr.casters.push(co);
	fermin(fr);
	dog(fr);
	if (f < 540) owl(fr);
	streetLeftovers(fr);
	if (coyoteState(f)) fr.actors.push({z: 2.38, draw: (g) => drawCoyote(g, f, fr.L, fr.I, blurFor(2.4, f), drawer(g))});
};
// ---------------------------------------------------------------- B06 el coyote en la calle (678–779)
const B06 = (fr: Frame) => {
	const f = fr.f;
	const co = coyoteCaster(f);
	if (co) fr.casters.push(co);
	const c = coyoteState(f);
	if (c) fr.actors.push({z: c.z, draw: (g) => drawCoyote(g, f, fr.L, fr.I, blurFor(c.z, f), drawer(g))});
	dog(fr);
	streetLeftovers(fr);
};
// ---------------------------------------------------------------- B07 la sombra crece, erguida (780–914)
// camina por nuestra banqueta, siempre fuera de cuadro a la izquierda, hasta quedar bajo el foco (donde salió don
// Fermín): M ≈ 2.5 → 9.7; su sombra entra por la esquina del muro a 798 y su cabeza llena la franja al final.
const bipedPos = (f: number): {x: number; z: number; bob: number} => {
	const u = seg(f, 798, 915);
	const e = u * (1.12 - 0.12 * u); // paso pesado, apenas más lento al final (G3: ciclo de 1.0 s)
	const z = lerp(2.05, 0.88, e);
	const x = -0.65 - (1.05 * (z - 0.88)) / 2.75;
	const bob = Math.abs(Math.sin(((f - 798) / 30) * Math.PI)) * 0.03;
	return {x, z, bob};
};
const BIPED = resample(BIPED_FRONT);
const B07 = (fr: Frame) => {
	const f = fr.f;
	if (f >= 798) {
		const b = bipedPos(f);
		fr.casters.push({pts: card(BIPED, b.x, b.bob, b.z), soft: 2});
		const on = E.out(seg(f, 882, 886));
		if (on > 0) shadowEyes(fr, card(BIPED_EYES, b.x, b.bob, b.z), 24, on);
	}
	const co = coyoteCaster(f);
	if (co) fr.casters.push(co);
	const c = coyoteState(f);
	if (c) fr.actors.push({z: c.z, draw: (g) => drawCoyote(g, f, fr.L, fr.I, blurFor(c.z, f), drawer(g))});
	if (f >= 786 && f <= 800) {
		const k = Math.sin(seg(f, 786, 800) * Math.PI);
		fr.alley.push((g) => {
			const [ex, ey] = P(-1.75, 0.55, 4.6);
			g.save();
			g.globalCompositeOperation = 'lighter';
			g.fillStyle = `rgba(214,227,106,${0.8 * k})`;
			g.beginPath();
			g.arc(ex - 5, ey, 3, 0, Math.PI * 2);
			g.arc(ex + 5, ey, 3, 0, Math.PI * 2);
			g.fill();
			g.restore();
		});
	}
	streetLeftovers(fr);
};
// ---------------------------------------------------------------- B08 aliento contenido (915–935)
const B08 = (fr: Frame) => {
	const f = fr.f;
	const u = E.inOut(seg(f, 915, 927));
	// cae a cuatro patas: la sombra baja por el muro y sale al piso
	const shape = morph(BIPED, resample(COYOTE4.map(([x, y]) => [x * 0.6, y] as V2)), u);
	fr.casters.push({pts: card(shape, lerp(-0.65, -0.56, u), -0.6 * u, lerp(0.88, 0.8, u)), alpha: 1 - seg(f, 924, 932)});
	streetLeftovers(fr);
};
// ---------------------------------------------------------------- B09 SUSTO (936–956)
const B09 = (fr: Frame) => {
	const f = fr.f;
	streetLeftovers(fr);
	// G3: cabeza pintada (scare.ts). Esqueleto: silueta con rim y ojos que irrumpe desde abajo a la derecha.
	const u = E.out(seg(f, 936, 940));
	const over = 1 + 0.06 * Math.sin(seg(f, 939, 945) * Math.PI);
	fr.actors.push({
		z: 0.6,
		draw: (g) => {
			const cx = lerp(980, 640, u);
			const cy = lerp(1500, 960, u);
			const s = 1.25 * over;
			g.save();
			g.translate(cx, cy);
			g.scale(s, s);
			g.fillStyle = '#120B07';
			g.beginPath();
			g.moveTo(-260, 260);
			g.quadraticCurveTo(-300, 40, -200, -60);
			g.lineTo(-250, -300);
			g.lineTo(-90, -130);
			g.quadraticCurveTo(0, -160, 90, -130);
			g.lineTo(250, -300);
			g.lineTo(200, -60);
			g.quadraticCurveTo(300, 40, 260, 260);
			g.quadraticCurveTo(0, 360, -260, 260);
			g.fill();
			g.strokeStyle = 'rgba(242,109,61,0.9)';
			g.lineWidth = 10;
			g.beginPath();
			g.moveTo(-250, -300);
			g.lineTo(-200, -60);
			g.quadraticCurveTo(-300, 40, -260, 260);
			g.stroke();
			g.restore();
			const eu = clamp(u * 1.2);
			glow(g, lerp(900, 545, u), lerp(1450, 890, u), 70, C.flama, eu, 0.25);
			glow(g, lerp(1060, 745, u), lerp(1450, 890, u), 70, C.flama, eu, 0.25);
		},
	});
	fr.buckets = true;
	fr.post.flash = f === 936 ? 0.5 : f === 937 ? 0.18 : 0;
	fr.post.ca = lerp(6, 1, seg(f, 936, 946));
};
// ---------------------------------------------------------------- B10 portazo · negro (957–1019)
const B10 = (fr: Frame) => {
	const f = fr.f;
	if (f < 960) streetLeftovers(fr);
	if (f < 970) {
		const k = 1 - seg(f, 957, 969);
		fr.over.push((g) => {
			g.save();
			g.globalCompositeOperation = 'lighter';
			for (const [x, y] of [
				[545, 890],
				[745, 890],
			]) {
				const gr = g.createRadialGradient(x, y, 0, x, y, 60);
				gr.addColorStop(0, `rgba(190,220,90,${0.55 * k})`);
				gr.addColorStop(1, 'rgba(190,220,90,0)');
				g.fillStyle = gr;
				g.fillRect(x - 60, y - 60, 120, 120);
			}
			g.restore();
		});
	}
};
// ---------------------------------------------------------------- B11 secuela · nace el 7 (1020–1145)
const HAT_Z = 1.2;
const HATCANE: V3[] = resample(SEVEN_REST).map((p) => backProject(p, HAT_Z));
const sevenOffset = (fr: Frame): V2 => {
	// desplazamiento de la sombra del 7 respecto al reposo (para que el glifo siga el vaivén residual)
	const ref = backProject([G7.cx, (G7.top + G7.bottom) / 2], HAT_Z);
	const a = projShadow(fr.L, ref);
	const b = projShadow(BULB0, ref);
	return a && b ? [a[0] - b[0], a[1] - b[1]] : [0, 0];
};
const B11 = (fr: Frame) => {
	const f = fr.f;
	const snap = E.inOut(seg(f, 1128, 1140));
	const gm = glyph7();
	fr.casters.push({pts: HATCANE, alpha: gm ? 1 - snap : 1, soft: snap * 3});
	if (gm && snap > 0) {
		const [ox, oy] = sevenOffset(fr);
		fr.masks.push({canvas: gm.canvas, alpha: 0.88 * snap, blur: 4 + snap * 3, ox, oy});
	}
	void magAt;
};
// ---------------------------------------------------------------- B12 lockup + aguijón (1146–1229)
const B12 = (fr: Frame) => {
	const f = fr.f;
	const gm = glyph7();
	if (gm) {
		const [ox, oy] = sevenOffset(fr);
		fr.masks.push({canvas: gm.canvas, alpha: 0.88, blur: 7, ox, oy});
	} else fr.casters.push({pts: HATCANE});
	if (f >= 1188 && f <= 1203) {
		const blink = f >= 1194 && f <= 1196 ? 0 : 1;
		const k = Math.sin(seg(f, 1188, 1203) * Math.PI) * blink;
		fr.alley.push((g) => {
			const [ex, ey] = P(-1.9, 0.45, 7.5);
			g.save();
			g.globalCompositeOperation = 'lighter';
			g.fillStyle = `rgba(214,227,106,${0.85 * k})`;
			g.beginPath();
			g.arc(ex - 4, ey, 2.4, 0, Math.PI * 2);
			g.arc(ex + 4, ey, 2.4, 0, Math.PI * 2);
			g.fill();
			g.restore();
		});
	}
	fr.post.fade = E.in(seg(f, 1224, 1230));
};

export const BEATS: Beat[] = [
	{id: 'B01', name: 'hook · la sombra gigante', f0: 0, f1: 78, fn: B01},
	{id: 'B02', name: 'título y el lugar', f0: 78, f1: 198, fn: B02},
	{id: 'B03', name: 'su paseo; el perro despierta', f0: 198, f1: 336, fn: B03},
	{id: 'B04', name: 'silencio · la sombra voltea', f0: 336, f1: 480, fn: B04},
	{id: 'B05', name: 'tres vueltas', f0: 480, f1: 678, fn: B05},
	{id: 'B06', name: 'el coyote en la calle', f0: 678, f1: 780, fn: B06},
	{id: 'B07', name: 'la sombra crece', f0: 780, f1: 915, fn: B07},
	{id: 'B08', name: 'aliento contenido', f0: 915, f1: 936, fn: B08},
	{id: 'B09', name: 'susto principal', f0: 936, f1: 957, fn: B09},
	{id: 'B10', name: 'portazo · negro', f0: 957, f1: 1020, fn: B10},
	{id: 'B11', name: 'secuela · nace el 7', f0: 1020, f1: 1146, fn: B11},
	{id: 'B12', name: 'lockup + aguijón', f0: 1146, f1: 1230, fn: B12},
];
export type {Caster};
