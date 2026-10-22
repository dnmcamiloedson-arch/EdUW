// Día 7 · los beats: cada función llena el Frame (casters de sombra, actores, brillos, post) para su rango de frames.
// Es un plano secuencia, así que los actores persisten entre beats; cada beat llama a los mismos actores con su estado.
import {C, E, clamp, lerp} from '../../lib/util';
import {glow, type Ctx} from '../kit/paint';
import type {Frame} from './frame';
import {drawer} from './layer';
import {card, magAt, mapCaster, projShadow, type Caster} from './light';
import {drawFermin, ferminPose, ferminShadow, sarapeCaster, spinAt, type ShadowOpts, STOP_X, STOP_Z} from './fermin';
import {drawOwl} from './props';
import {coyoteCaster, coyoteState, drawCoyote} from './coyote';
import {caneShadow, caneZ, drawCane, drawHat, drawHuarache, drawPetals, hatShadow, hatZ, morphShadow} from './g2';
import {dogCaster, drawDog} from './dog';
import {BIPED_EYES, BIPED_FRONT, COYOTE4, FRONT_EYES, HEAD_COYOTE_PROFILE, HEAD_EARS_FRONT, HEAD_HAT_FRONT, HUNCHED, humanOutline, morph, resample} from './shapes';
import {G7, SEVEN_REST, glyph7} from './glyph';
import {BULB0, P, WALL_Z, blurFor, sec, seg, smooth, wallX, wallY, type V2, type V3} from './world';
import {rigAt} from './gait';
import {bipedShadow, hatCaneCaster} from './g3';
import {drawScare, scareEyesScreen} from './scare';
import {drawBuckets} from './set';

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
// la calle después de las vueltas (G2): don Fermín/sarape (cae y queda como montón), pétalos (vórtice → piso), caña,
// sombrero, huarache; con sus sombras. G3 la sigue llamando (los objetos desaparecen solos a 1020).
const streetLeftovers = (fr: Frame) => {
	const f = fr.f;
	const spin = spinAt(f).spin;
	const sc = sarapeCaster(f);
	if (sc) fr.casters.push(sc);
	const cs = caneShadow(f, fr.L);
	if (cs) fr.casters.push(cs);
	const hs = hatShadow(f);
	if (hs) fr.casters.push(hs);
	if (f < 1020) fr.actors.push({z: f >= 606 ? STOP_Z + 0.02 : STOP_Z, draw: (g) => drawFermin(g, f, fr.L, fr.I, blurFor(STOP_Z, f), drawer(g))});
	fr.actors.push({z: STOP_Z + 0.3, draw: (g) => drawPetals(g, f, spin, fr.L, fr.I, 1)});
	fr.actors.push({z: STOP_Z - 0.3, draw: (g) => drawPetals(g, f, spin, fr.L, fr.I, -1)});
	const cz = caneZ(f);
	fr.actors.push({z: cz, draw: (g) => drawCane(g, f, fr.L, fr.I, blurFor(cz, f), drawer(g))});
	const hz = hatZ(f);
	fr.actors.push({z: hz, draw: (g) => drawHat(g, f, fr.L, fr.I, blurFor(hz, f), drawer(g))});
	fr.actors.push({z: STOP_Z - 0.2, draw: (g) => drawHuarache(g, f, fr.L, fr.I, blurFor(STOP_Z - 0.2, f), drawer(g))});
};
const coyote = (fr: Frame) => {
	const f = fr.f;
	const co = coyoteCaster(f);
	if (co) fr.casters.push(co);
	const c = coyoteState(f);
	if (c) fr.actors.push({z: c.z0, draw: (g) => drawCoyote(g, f, fr.L, fr.I, blurFor(c.z, f), drawer(g))});
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

// ---------------------------------------------------------------- su sombra (G1)
// opciones de la sombra por frame: desde 7.2 s se retrasa 3 f y le crece una cola bajo el sarape; 11.6–13 s la cabeza
// voltea de perfil a frente (sobretiro 4°) y el ala se parte en dos orejas (12.1–12.7 s); ojos a 13 s; ladea 12° a
// 13.6 s; parpadea a 14.6 s; respira 1.5 % a 0.4 Hz.
const TURN0 = 348;
const TURN1 = 390;
export const shadowOpts = (f: number): ShadowOpts => {
	const o: ShadowOpts = {lag: 3 * smooth(seg(f, 206, 222)), tail: E.inOut(seg(f, 216, 290))};
	if (f >= 31 && f <= 36) {
		o.head = () => HEAD_COYOTE_PROFILE;
		o.brim = 0;
	}
	if (f >= TURN0) {
		const u = seg(f, TURN0, TURN1);
		const tu = u * u * (3 - 2 * u);
		const ears = E.inOut(seg(f, 362, 382));
		o.head = (auto) => morph(morph(auto, HEAD_HAT_FRONT, tu), HEAD_EARS_FRONT, ears);
		o.headFace = -1;
		o.brim = 1 - ears;
		const over = (4 * Math.PI) / 180;
		const tilt = (12 * Math.PI) / 180;
		o.tilt = over * Math.sin(Math.PI * seg(f, 378, 398)) * -1 + tilt * E.out(seg(f, 408, 420)) + 0.012 * Math.sin(sec(f) * 1.7) * seg(f, 420, 440);
		o.drop = 0.055 * E.inOut(seg(f, 352, 392));
		o.breathe = 1 + 0.015 * Math.sin(2 * Math.PI * 0.4 * sec(f - 390)) * seg(f, 390, 420);
	}
	return o;
};
// gancho: mientras él sigue fuera de cuadro bajo el foco, la sombra se diseña legible (cabeza de perfil gigante con
// el ala en y≈505) y converge a la física real antes del subliminal.
// trayectoria diseñada del punto del ala en el muro (px) y escala de la cabeza; se funde con la física 40→64
const hookDesign = (f: number): {w: V2; s: number} => {
	const u = smooth(seg(f, 9, 40));
	return {w: [lerp(452, 470, u), lerp(505, 515, u)], s: lerp(0.42, 0.5, u)};
};
export const hookMap = (f: number, L: V3) => {
	const blend = smooth(seg(f, 40, 64));
	if (blend >= 1) return null;
	const R = rigAt(Math.max(0, f));
	const b: V3 = [R.head[0], R.head[1] + 0.08, R.head[2]];
	const d = hookDesign(f);
	const W: V3 = [wallX(d.w[0]), wallY(d.w[1]), WALL_Z];
	const k = (b[2] - L[2]) / (WALL_Z - L[2]);
	const c: V3 = [L[0] + (W[0] - L[0]) * k, L[1] + (W[1] - L[1]) * k, b[2]];
	return (p: V3): V3 => {
		const q: V3 = [c[0] + (p[0] - b[0]) * d.s, c[1] + (p[1] - b[1]) * d.s, c[2] + (p[2] - b[2]) * d.s];
		return [lerp(q[0], p[0], blend), lerp(q[1], p[1], blend), lerp(q[2], p[2], blend)];
	};
};
const ferminShadowInto = (fr: Frame, eyesOn = 0) => {
	const sh = ferminShadow(fr.f, fr.L, shadowOpts(fr.f));
	if (!sh) return;
	const hm = hookMap(fr.f, fr.L);
	fr.casters.push(hm ? mapCaster(sh.caster, hm) : sh.caster);
	if (eyesOn > 0) shadowEyes(fr, sh.eyes, 9, eyesOn);
};

// ---------------------------------------------------------------- B01 HOOK · la sombra gigante (0–77)
const B01 = (fr: Frame) => {
	ferminShadowInto(fr);
	fermin(fr);
	dog(fr);
	owl(fr);
};
// ---------------------------------------------------------------- B02 TÍTULO y el lugar (78–197)
const B02 = (fr: Frame) => {
	ferminShadowInto(fr);
	fermin(fr);
	dog(fr);
	owl(fr);
};
// ---------------------------------------------------------------- B03 su paseo; el perro despierta (198–335)
const B03 = (fr: Frame) => {
	ferminShadowInto(fr);
	fermin(fr);
	dog(fr);
	owl(fr);
};
// ---------------------------------------------------------------- B04 silencio · la sombra voltea (336–479)
export const eyesB04 = (f: number) => E.out(seg(f, 390, 394)) * (f >= 438 && f <= 440 ? 0 : 1);
const B04 = (fr: Frame) => {
	ferminShadowInto(fr, eyesB04(fr.f));
	fermin(fr);
	dog(fr);
	owl(fr);
};
// ---------------------------------------------------------------- B05 tres vueltas (480–677)
// él gira (rig girado + sarape que vuela con ω²); su sombra deja de copiarlo: de la sombra real (con orejas) se funde
// 488–508 en el morph de 5 claves (humano → encorvado → arqueado → medio bestia → coyote, cabeza primero). 606 el
// sarape cae vacío; la sombra-coyote se hunde en el montón; 624 respira, huarache; 654 pata y hocico (coyote.ts).
const B05 = (fr: Frame) => {
	const f = fr.f;
	const {spin} = spinAt(f);
	// fundido sin hueco: la clave entra antes de que la sombra real se vaya
	const hand = smooth(seg(f, 486, 500));
	const out = smooth(seg(f, 494, 512));
	if (out < 1) {
		const sh = ferminShadow(f, fr.L, shadowOpts(f));
		if (sh) {
			sh.caster.alpha = 1 - out;
			fr.casters.push(sh.caster);
			const on = eyesB04(f) * (1 - seg(f, 484, 498));
			if (on > 0) shadowEyes(fr, sh.eyes, 9, on);
		}
	}
	if (f >= 488 && f < 626) {
		const m = morphShadow(f, spin);
		m.caster.alpha = (m.caster.alpha ?? 1) * hand;
		fr.casters.push(m.caster);
		if (m.alpha > 0.01) shadowEyes(fr, m.eyes, 8, m.alpha);
	}
	streetLeftovers(fr);
	coyote(fr);
	dog(fr);
	if (f < 560) owl(fr);
};
// ---------------------------------------------------------------- B06 el coyote en la calle (678–779)
// se sacude (678–696), camina hacia el perro, el perro huye (726), mira a la lente con eyeshine (744–762), se
// escabulle al callejón (762→806). Sin texto.
const B06 = (fr: Frame) => {
	coyote(fr);
	dog(fr);
	streetLeftovers(fr);
};
// ---------------------------------------------------------------- B07 la sombra crece, erguida (780–914)
// el «entre formas» camina por nuestra banqueta, siempre fuera de cuadro a la izquierda, hacia el foco: su sombra entra
// por la esquina del muro, crece de M 2 a 7, se endereza (sube) y afila la penumbra; ojos a 882 (g3.ts).
const biped = (fr: Frame) => {
	const b = bipedShadow(fr.f, fr.L);
	if (!b) return;
	fr.casters.push(b.caster);
	if (b.eyeA > 0) shadowEyes(fr, b.eyes, 24, b.eyeA);
};
const B07 = (fr: Frame) => {
	biped(fr);
	coyote(fr);
	streetLeftovers(fr); // continuidad G2→G3: montón, caña, sombrero, pétalos y huarache siguen en la calle
};
// ---------------------------------------------------------------- B08 aliento contenido (915–935)
// cae a cuatro patas: la sombra baja por el muro y sale al piso, fuera de la luz. Muro vacío.
const B08 = (fr: Frame) => {
	biped(fr);
	streetLeftovers(fr);
};
// ---------------------------------------------------------------- B09 SUSTO (936–956)
const B09 = (fr: Frame) => {
	const f = fr.f;
	streetLeftovers(fr);
	fr.actors.push({z: 0.6, draw: (g) => drawScare(g, f)});
	// las cubetas (z 0.95) van DETRÁS de la cabeza (z 0.6)
	fr.buckets = false;
	fr.actors.push({z: 0.95, draw: (g) => drawBuckets(g, fr.t, fr.I)});
	fr.post.flash = f === 936 ? 0.5 : f === 937 ? 0.2 : f === 945 ? 0.08 : 0;
	fr.post.ca = Math.max(lerp(6, 1, seg(f, 936, 946)), f >= 945 && f < 948 ? 3 : 0);
};
// ---------------------------------------------------------------- B10 portazo · negro (957–1019)
const B10 = (fr: Frame) => {
	const f = fr.f;
	if (f < 960) {
		streetLeftovers(fr);
		fr.actors.push({z: 0.6, draw: (g) => drawScare(g, 956 + (f - 956) * 0.5)});
		fr.buckets = false;
		fr.actors.push({z: 0.95, draw: (g) => drawBuckets(g, fr.t, fr.I)});
	}
	// posimagen verde-oro del eyeshine (0.4 s)
	if (f < 970) {
		const k = 1 - seg(f, 957, 969);
		const eyes = scareEyesScreen(956);
		fr.over.push((g) => {
			g.save();
			g.globalCompositeOperation = 'lighter';
			for (const [x, y] of eyes) {
				const gr = g.createRadialGradient(x, y, 0, x, y, 70);
				gr.addColorStop(0, `rgba(200,226,110,${0.6 * k})`);
				gr.addColorStop(0.4, `rgba(150,190,80,${0.25 * k})`);
				gr.addColorStop(1, 'rgba(120,170,70,0)');
				g.fillStyle = gr;
				g.fillRect(x - 70, y - 70, 140, 140);
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
	fr.casters.push(hatCaneCaster(fr.t, gm ? 1 - snap : 1, 1 + snap * 3));
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
	} else fr.casters.push(hatCaneCaster(fr.t, 1, 1));
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
