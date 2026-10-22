// Sombras lunares: la luna está DETRÁS (azimut 180°, elevación 28°), así que todo proyecta hacia adelante (+z).
// Cada figura es un conjunto de contornos 3D (m) que se proyectan al suelo (z + y/tan 28°) y luego a pantalla.
// Se rellenan en un lienzo a media resolución, se desenfocan y se multiplican sobre la tierra.
import {H, W} from '../../lib/util';
import {cached, makeCanvas, type Ctx} from '../kit/paint';
import {proj, type Pov} from './pov';

export const MOON_EL = (28 * Math.PI) / 180;
const K = 1 / Math.tan(MOON_EL); // ≈ 1.88 m de sombra por metro de altura

export type V3 = [number, number, number];
export type Contour = V3[];

// elipse vertical (plano x-y) a una z
export const ringXY = (cx: number, cy: number, z: number, rx: number, ry: number, n = 14): Contour =>
	Array.from({length: n}, (_, i) => {
		const a = (i / n) * Math.PI * 2;
		return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, z] as V3;
	});
// disco horizontal (ala de sombrero) a una altura y
export const discXZ = (cx: number, y: number, cz: number, r: number, n = 16): Contour =>
	Array.from({length: n}, (_, i) => {
		const a = (i / n) * Math.PI * 2;
		return [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r] as V3;
	});
export const boxXY = (x0: number, x1: number, y0: number, y1: number, z: number): Contour => [
	[x0, y0, z],
	[x1, y0, z],
	[x1, y1, z],
	[x0, y1, z],
];

const layer = () => cached('d5shadow', () => makeCanvas(W / 2, H / 2));
const layer2 = () => cached('d5shadow2', () => makeCanvas(W / 2, H / 2));

// rellena las sombras de varias figuras; alpha = opacidad del multiplicado; blurPx a resolución completa
export const castShadows = (g: Ctx, c: Pov, figures: Contour[][], o: {alpha?: number; blur?: number; color?: string; nearFade?: number} = {}) => {
	const {alpha = 0.55, blur = 6, color = '#0D1A1F', nearFade = 0} = o;
	const L = layer();
	const lg = L.getContext('2d')!;
	lg.setTransform(1, 0, 0, 1, 0, 0);
	lg.globalCompositeOperation = 'source-over';
	lg.filter = 'none';
	lg.clearRect(0, 0, L.width, L.height);
	lg.setTransform(0.5, 0, 0, 0.5, 0, 0);
	lg.fillStyle = color;
	for (const fig of figures)
		for (const ct of fig) {
			lg.beginPath();
			let ok = 0;
			for (let i = 0; i < ct.length; i++) {
				const [x, y, z] = ct[i];
				const gz = z + y * K;
				const [sx, sy, d] = proj(c, x, 0, gz);
				if (d <= 0.05) continue;
				if (ok++ === 0) lg.moveTo(sx, sy);
				else lg.lineTo(sx, sy);
			}
			if (ok > 2) {
				lg.closePath();
				lg.fill();
			}
		}
	// desenfoque a media resolución (4× más barato) y luego multiplicado a tamaño completo
	const L2 = layer2();
	const l2 = L2.getContext('2d')!;
	l2.setTransform(1, 0, 0, 1, 0, 0);
	l2.globalCompositeOperation = 'source-over';
	l2.clearRect(0, 0, L2.width, L2.height);
	l2.filter = `blur(${blur / 4}px)`;
	l2.drawImage(L, 0, 0);
	l2.filter = 'none';
	// cerca de los pies el farol rellena la sombra: se desvanece hacia el borde inferior
	if (nearFade > 0) {
	l2.globalCompositeOperation = 'destination-out';
	const fd = l2.createLinearGradient(0, L2.height * 0.72, 0, L2.height);
	fd.addColorStop(0, 'rgba(0,0,0,0)');
	fd.addColorStop(1, `rgba(0,0,0,${nearFade})`);
	l2.fillStyle = fd;
	l2.fillRect(0, L2.height * 0.72, L2.width, L2.height * 0.28);
	l2.globalCompositeOperation = 'source-over';
	}
	g.save();
	g.globalCompositeOperation = 'multiply';
	g.globalAlpha = alpha;
	g.drawImage(L2, 0, 0, W, H);
	g.restore();
};

// ---------- figuras ----------
// contorno en el plano x-y a una z, con puntos [x, y]
const polyXY = (pts: [number, number][], z: number, dx = 0): Contour => pts.map(([x, y]) => [x + dx, y, z] as V3);

// nosotros (viajero con sombrero de palma y farol a la derecha); x0/z0 = posición de los pies
export const travellerFig = (x0: number, z0: number, o: {crouch?: number; phase?: number} = {}): Contour[] => {
	const cr = o.crouch ?? 0;
	const ph = o.phase ?? 0;
	const hs = 1 - cr * 0.55;
	const leg = Math.sin(ph * Math.PI) * 0.18;
	const sw = Math.sin(ph * Math.PI * 0.5) * 0.03;
	return [
		polyXY([[-0.17, 0], [-0.05, 0], [-0.04, 0.9 * hs], [-0.18, 0.92 * hs]], z0 + leg, x0),
		polyXY([[0.05, 0], [0.17, 0], [0.18, 0.92 * hs], [0.04, 0.9 * hs]], z0 - leg, x0),
		// torso con hombros redondeados
		polyXY([[-0.19, 0.88 * hs], [-0.22, 1.2 * hs], [-0.2, 1.42 * hs], [-0.1, 1.5 * hs], [0, 1.5 * hs], [0.1, 1.5 * hs], [0.2, 1.42 * hs], [0.22, 1.2 * hs], [0.19, 0.88 * hs]], z0, x0 + sw),
		ringXY(x0 + sw, 1.56 * hs, z0, 0.1, 0.12),
		discXZ(x0 + sw, 1.69 * hs, z0, 0.27, 20),
		polyXY([[-0.11, 1.68 * hs], [-0.09, 1.8 * hs], [0, 1.84 * hs], [0.09, 1.8 * hs], [0.11, 1.68 * hs]], z0, x0 + sw),
		// brazo derecho caído con el farol
		polyXY([[0.18, 1.42 * hs], [0.26, 1.38 * hs], [0.31, 0.8 * hs], [0.25, 0.78 * hs]], z0 + 0.05, x0),
		polyXY([[0.24, 0.72 * hs], [0.36, 0.72 * hs], [0.37, 0.42 * hs], [0.23, 0.42 * hs]], z0 + 0.15, x0),
		polyXY([[-0.18, 1.42 * hs], [-0.25, 1.36 * hs], [-0.27, 0.86 * hs], [-0.2, 0.86 * hs]], z0 - 0.05, x0),
	];
};

// caballo + jinete (vistos desde la luna, de espaldas); gait = fase de la marcha (pasos), ear = giro de oreja 0..1
// La cabeza del caballo va un poco a la derecha (mira hacia nosotros) para que sus orejas se lean junto al ala.
export const riderFig = (x0: number, z0: number, o: {gait?: number; nod?: number; ear?: number; lean?: number} = {}): Contour[] => {
	const g = o.gait ?? 0;
	const nod = o.nod ?? 0;
	const ear = o.ear ?? 0;
	const lean = o.lean ?? 0;
	const legA = Math.sin(g * Math.PI) * 0.32;
	const out: Contour[] = [];
	const leg = (x: number, z: number, lift: number) =>
		polyXY([[x - 0.07, 1.1], [x + 0.07, 1.1], [x + 0.05, 0.55 + lift], [x + 0.045, 0.05 + lift], [x + 0.06, lift], [x - 0.06, lift], [x - 0.045, 0.05 + lift], [x - 0.05, 0.55 + lift]], z, x0);
	out.push(leg(-0.16, z0 - 0.75 + legA, Math.max(0, Math.sin(g * Math.PI)) * 0.12));
	out.push(leg(0.16, z0 - 0.75 - legA, Math.max(0, -Math.sin(g * Math.PI)) * 0.12));
	out.push(leg(-0.15, z0 + 0.85 - legA, Math.max(0, -Math.sin(g * Math.PI)) * 0.12));
	out.push(leg(0.15, z0 + 0.85 + legA, Math.max(0, Math.sin(g * Math.PI)) * 0.12));
	// grupa (de espaldas) y barril
	out.push(polyXY([[-0.3, 1.1], [-0.36, 1.35], [-0.32, 1.58], [-0.16, 1.7], [0, 1.66], [0.16, 1.7], [0.32, 1.58], [0.36, 1.35], [0.3, 1.1], [0, 1.02]], z0 - 0.9, x0));
	for (let i = 1; i < 5; i++) out.push(ringXY(x0, 1.45, z0 - 0.9 + i * 0.45, 0.35, 0.36, 18));
	// cola que se mece
	const tw = Math.sin(g * Math.PI * 0.5) * 0.06;
	out.push(polyXY([[-0.05, 1.6], [0.05, 1.6], [0.08 + tw, 1.1], [0.06 + tw * 1.6, 0.75], [-0.04 + tw * 1.6, 0.72], [-0.06 + tw, 1.1]], z0 - 1.0, x0));
	// cuello y cabeza (cabeceo), algo a la derecha
	const hx = 0.46;
	const hz = z0 + 1.35 + nod * 0.08;
	const hy = 2.08 - nod * 0.12;
	out.push(polyXY([[-0.06, 1.55], [0.02, 1.9], [hx - 0.12, hy - 0.05], [hx + 0.1, hy - 0.02], [0.26, 1.72], [0.2, 1.5]], z0 + 1.0, x0));
	out.push(polyXY([[hx - 0.1, hy + 0.2], [hx - 0.13, hy], [hx - 0.09, hy - 0.4], [hx - 0.06, hy - 0.55], [hx + 0.06, hy - 0.55], [hx + 0.09, hy - 0.4], [hx + 0.13, hy], [hx + 0.1, hy + 0.2]], hz, x0));
	// orejas al frente, puntiagudas (una gira)
	out.push(polyXY([[hx - 0.11, hy + 0.15], [hx - 0.03, hy + 0.17], [hx - 0.1, hy + 0.5]], hz, x0));
	out.push(polyXY([[hx + 0.03, hy + 0.17], [hx + 0.11, hy + 0.15], [hx + 0.13 + ear * 0.1, hy + 0.46 - ear * 0.08]], hz - ear * 0.1, x0));
	// jinete: piernas al estribo, torso, cabeza, ala ancha y copa con pilón
	out.push(polyXY([[-0.26, 1.75], [-0.4, 1.62], [-0.42, 1.05], [-0.32, 1.02], [-0.3, 1.5], [-0.18, 1.6]], z0 - 0.1, x0));
	out.push(polyXY([[0.26, 1.75], [0.4, 1.62], [0.42, 1.05], [0.32, 1.02], [0.3, 1.5], [0.18, 1.6]], z0 - 0.1, x0));
	out.push(polyXY([[-0.22, 1.65], [-0.26, 2.05], [-0.27, 2.38], [-0.14, 2.5], [0, 2.52], [0.14, 2.5], [0.27, 2.38], [0.26, 2.05], [0.22, 1.65]], z0 - 0.15 + lean, x0));
	out.push(ringXY(x0, 2.63, z0 - 0.1 + lean, 0.11, 0.13));
	out.push(discXZ(x0, 2.78, z0 - 0.1 + lean * 1.2, 0.46, 24)); // ala ancha
	out.push(polyXY([[-0.15, 2.76], [-0.14, 2.92], [-0.08, 3.02], [0, 3.06], [0.08, 3.02], [0.14, 2.92], [0.15, 2.76]], z0 - 0.1 + lean * 1.2, x0)); // copa con pilón
	// sarape colgando del hombro izquierdo
	out.push(polyXY([[0.16, 2.48], [0.34, 2.38], [0.44, 1.95], [0.4, 1.55], [0.28, 1.6], [0.24, 2.0]], z0 - 0.2, x0));
	return out;
};
