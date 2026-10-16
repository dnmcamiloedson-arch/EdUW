// Día 7 · motor de sombras de un solo foco. Cada «caster» es un contorno en metros posado en el mundo; cada vértice
// se proyecta desde el foco L(t) a la pared (z = 4.2) o al piso (y = 0), lo que toque primero, así la sombra se dobla
// sola en la base del muro. Máscara a 1/4 de resolución con penumbra física; luz = ambiente + directa·(1 − máscara).
// El mapa resultante se multiplica sobre el albedo (pared + calle): las sombras solo oscurecen superficies iluminadas.
import {H, W, clamp} from '../../lib/util';
import {cached, makeCanvas, type Ctx} from '../kit/paint';
import {EYE, P, PIVOT, WALL_BASE, WALL_SX0, WALL_Z, groundX, groundZ, irr, pxPerM, wallX, wallY, type V2, type V3} from './world';

export const Q = 4; // reducción del mapa de luz
// el mapa cubre un poco más que la pantalla (paneos, zoom < 1 del susto, cámara en mano)
export const LX0 = -120;
export const LY0 = 0;
export const LW = (W + 240) / Q;
export const LH = (H + 120) / Q;
export const toL = (X: number, Y: number): V2 => [(X - LX0) / Q, (Y - LY0) / Q];

export type Caster = {
	pts: V3[]; // contorno cerrado (metros, mundo)
	dens?: number; // densidad de la sombra (0.88 por defecto)
	soft?: number; // penumbra extra (px de pantalla)
	alpha?: number; // peso (para mezclar contornos)
};
export type MaskLayer = {canvas: HTMLCanvasElement; alpha: number; blur: number; ox?: number; oy?: number}; // en coordenadas 1/4 del mapa; ox/oy en px de pantalla

// contorno 2D (metros, y hacia arriba) en una tarjeta vertical paralela a la pared, en (x, y, z); flip −1 mira a la izq
export const card = (pts: V2[], x: number, y: number, z: number, flip = 1, sc = 1, rot = 0): V3[] => {
	const c = Math.cos(rot);
	const s = Math.sin(rot);
	return pts.map(([u, v]) => {
		const uu = u * flip * sc;
		const vv = v * sc;
		return [x + uu * c - vv * s, y + uu * s + vv * c, z];
	});
};

// punto de sombra en pantalla (o null si el rayo no toca nada visible)
export const projShadow = (L: V3, p: V3): V2 | null => {
	const dz = p[2] - L[2];
	const tW = dz > 1e-4 ? (WALL_Z - L[2]) / dz : Infinity;
	const tG = p[1] < L[1] - 1e-4 ? L[1] / (L[1] - p[1]) : Infinity;
	const t = Math.min(tW, tG);
	if (!isFinite(t) || t < 0) return null;
	const x = L[0] + (p[0] - L[0]) * t;
	if (tG < tW) {
		const z = L[2] + dz * t;
		if (z < 0.2) return null;
		return P(x, 0, z);
	}
	const y = L[1] + (p[1] - L[1]) * t;
	return P(x, y, WALL_Z);
};
// magnificación de la sombra en la pared para un caster en z
export const magAt = (L: V3, z: number) => (WALL_Z - L[2]) / Math.max(1e-3, z - L[2]);
// penumbra física en px de pantalla (radio del foco 3 cm)
export const penumbra = (L: V3, z: number) => clamp(0.03 * ((WALL_Z - z) / Math.max(0.05, z - L[2])) * pxPerM(WALL_Z), 2, 14);

// ---------------------------------------------------------------- geometría por píxel del mapa (en caché)
type Geo = {kind: Uint8Array; px: Float32Array; py: Float32Array; pz: Float32Array};
const geo = (): Geo =>
	cached('d07:lgeo', () => {
		const N = LW * LH;
		const kind = new Uint8Array(N); // 0 pared, 1 calle, 2 callejón
		const px = new Float32Array(N);
		const py = new Float32Array(N);
		const pz = new Float32Array(N);
		for (let j = 0; j < LH; j++)
			for (let i = 0; i < LW; i++) {
				const k = j * LW + i;
				const X = LX0 + i * Q + Q / 2;
				const Y = LY0 + j * Q + Q / 2;
				if (Y >= WALL_BASE) {
					const z = groundZ(Y);
					kind[k] = 1;
					px[k] = groundX(X, z);
					py[k] = 0;
					pz[k] = z;
				} else if (X >= WALL_SX0) {
					kind[k] = 0;
					px[k] = wallX(X);
					py[k] = wallY(Y);
					pz[k] = WALL_Z;
				} else kind[k] = 2;
			}
		return {kind, px, py, pz};
	});

const canvases = () =>
	cached('d07:lcv', () => {
		const D = makeCanvas(LW, LH);
		const S = makeCanvas(LW, LH);
		const T = makeCanvas(LW, LH);
		const M = makeCanvas(LW, LH);
		const img = D.getContext('2d')!.createImageData(LW, LH);
		return {D, S, T, M, img};
	});

const AMB: [number, number, number] = [20, 32, 36]; // ambiente teal (#16303A levantado)
const EXPO = 1.5;
// pantalla de lámina del foco: más luz hacia el eje (abajo y hacia la pared), cae a los lados; se mece con el cable
export const spot = (L: V3, p: V3) => {
	const th = Math.atan2(L[0] - PIVOT[0], PIVOT[1] - L[1]);
	const ax = Math.sin(th * 1.6) * 0.6 + 0.2;
	const ay = -0.32;
	const az = 0.93;
	const dx = p[0] - L[0];
	const dy = p[1] - L[1];
	const dz = p[2] - L[2];
	const c = Math.max(0, (dx * ax + dy * ay + dz * az) / Math.sqrt((dx * dx + dy * dy + dz * dz) * (ax * ax + ay * ay + az * az)));
	return 0.3 + 0.7 * Math.pow(c, 7);
};
const NW: V3 = [0, 0, -1];
const NG: V3 = [0, 1, 0];

// mapa de luz del frame: devuelve el lienzo 1/4 que se multiplica sobre el albedo
export const lightMap = (L: V3, I: number, casters: Caster[], masks: MaskLayer[] = []) => {
	const {D, S, T, M, img} = canvases();
	const G = geo();
	const d = img.data;
	const N = LW * LH;
	const p: V3 = [0, 0, 0];
	for (let k = 0; k < N; k++) {
		const kd = G.kind[k];
		const o = k * 4;
		if (kd === 2) {
			d[o] = d[o + 1] = d[o + 2] = 0;
			d[o + 3] = 255;
			continue;
		}
		p[0] = G.px[k];
		p[1] = G.py[k];
		p[2] = G.pz[k];
		const e = irr(L, p, kd === 0 ? NW : NG) * I * spot(L, p);
		const v = 1 - Math.exp(-EXPO * e);
		// cálido: núcleo oro → caída cempasúchil
		d[o] = Math.min(255, v * 258);
		d[o + 1] = Math.min(255, v * (172 + 62 * v));
		d[o + 2] = Math.min(255, v * (100 + 85 * v * v));
		d[o + 3] = 255;
	}
	const dg = D.getContext('2d')!;
	dg.putImageData(img, 0, 0);
	// máscara de sombras
	const sg = S.getContext('2d')!;
	sg.setTransform(1, 0, 0, 1, 0, 0);
	sg.globalCompositeOperation = 'source-over';
	sg.filter = 'none';
	sg.clearRect(0, 0, LW, LH);
	const tg = T.getContext('2d')!;
	for (const c of casters) {
		if (c.pts.length < 3 || (c.alpha ?? 1) <= 0.001) continue;
		let zsum = 0;
		for (const q of c.pts) zsum += q[2];
		const zc = zsum / c.pts.length;
		const pen = penumbra(L, zc) + (c.soft ?? 0);
		tg.setTransform(1, 0, 0, 1, 0, 0);
		tg.clearRect(0, 0, LW, LH);
		tg.fillStyle = '#000';
		tg.beginPath();
		let started = false;
		for (const q of c.pts) {
			const s = projShadow(L, q);
			if (!s) continue;
			const X = (Math.max(-4000, Math.min(5000, s[0])) - LX0) / Q;
			const Y = (Math.max(-4000, Math.min(6000, s[1])) - LY0) / Q;
			if (!started) {
				tg.moveTo(X, Y);
				started = true;
			} else tg.lineTo(X, Y);
		}
		tg.closePath();
		tg.fill();
		sg.globalAlpha = (c.dens ?? 0.88) * (c.alpha ?? 1);
		sg.filter = `blur(${(pen / Q).toFixed(2)}px)`;
		sg.drawImage(T, 0, 0);
		sg.filter = 'none';
	}
	for (const m of masks) {
		if (m.alpha <= 0.001) continue;
		sg.globalAlpha = m.alpha;
		sg.filter = m.blur > 0.05 ? `blur(${(m.blur / Q).toFixed(2)}px)` : 'none';
		sg.drawImage(m.canvas, (m.ox ?? 0) / Q, (m.oy ?? 0) / Q);
		sg.filter = 'none';
	}
	sg.globalAlpha = 1;
	dg.globalCompositeOperation = 'destination-out';
	dg.drawImage(S, 0, 0);
	dg.globalCompositeOperation = 'source-over';
	// ambiente + directa
	const mg = M.getContext('2d')!;
	mg.setTransform(1, 0, 0, 1, 0, 0);
	mg.globalCompositeOperation = 'source-over';
	mg.fillStyle = `rgb(${AMB[0]},${AMB[1]},${AMB[2]})`;
	mg.fillRect(0, 0, LW, LH);
	mg.globalCompositeOperation = 'lighter';
	mg.drawImage(D, 0, 0);
	mg.globalCompositeOperation = 'source-over';
	// el callejón tiene su propio farol: luz neutra
	mg.fillStyle = '#ffffff';
	mg.fillRect(0, 0, Math.ceil((WALL_SX0 - LX0) / Q), Math.floor((WALL_BASE - LY0) / Q));
	return M;
};

// multiplica el mapa de luz sobre lo ya pintado (con la transformación actual del mundo)
export const applyLight = (g: Ctx, lm: HTMLCanvasElement) => {
	g.save();
	g.globalCompositeOperation = 'multiply';
	g.imageSmoothingEnabled = true;
	g.drawImage(lm, LX0, LY0, LW * Q, LH * Q);
	g.restore();
};

// luz que recibe un punto (para pintar actores con la luz correcta): 0..~1.3
export const lightAt = (L: V3, I: number, p: V3, n: V3 = [0, 0, -1]) => 1 - Math.exp(-EXPO * irr(L, p, n) * I * spot(L, p));
export {EYE};
