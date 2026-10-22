// La sombra de la bruja en el abanico de luz del fogón (9.0–12.2 s): mujer arrodillada de perfil (~260 px, la
// sombra proyectada 3×), brazos que suben 20°→150°, cabello que se levanta en la corriente caliente (simChain) y
// piernas que se deshilachan desde el suelo con un umbral de fbm de borde dorado. La sombra es un HUECO en la luz:
// se recorta del abanico (destination-out) y lo que queda se suma a la escena.
import {noise2D} from '@remotion/noise';
import {E, clamp, lerp, ramp, rgba} from '../../lib/util';
import {cached, drawTiled, makeCanvas, noiseTile, tinted, type Ctx} from '../kit/paint';
import {chainAt, simChain, smoothPath, type V2} from '../kit/rig';
import {fbmTile} from '../kit/paint';
import {HUT} from './exterior';
import {EV, FPS, P} from './timeline';

const CW = 560;
const CH = 420;
// origen de la sombra en el lienzo del abanico (la puerta)
const OX = CW / 2;
const OY = CH - 30;
export const DOOR: V2 = [HUT.x + 14, HUT.y - 14];
const Hs = 270; // alto de la sombra

const armsK = (f: number) => E.inOut(ramp(f, EV.shadowArms, [0, 1], (x) => x));
const frayK = (f: number) => ramp(f, EV.fray, [0, 1], (x) => x);

// cabello: 7 mechones colgados de la nuca; la corriente caliente los levanta conforme suben los brazos
const hair = (f: number): V2[][] => {
	const out: V2[][] = [];
	for (let i = 0; i < 7; i++) {
		const data = simChain({
			key: `d06hair${i}`,
			frames: 372,
			n: 8,
			seg: 11,
			gravity: 0.3,
			damping: 0.93,
			dir: [-0.4, 1],
			anchor: (ff) => {
				const k = armsK(ff);
				return [-10 - i * 2.2 + k * 3, -Hs * 0.84 - k * 4];
			},
			wind: (ff, j) => {
				const k = armsK(ff);
				const up = 0.25 + 0.55 * k;
				return [-0.05 + noise2D('d6hw' + i, ff * 0.06, j * 0.3) * 0.18 * (0.4 + k), -up * (0.4 + j / 8)];
			},
		});
		out.push(chainAt(data, 8, f));
	}
	return out;
};

// silueta arrodillada (coordenadas locales: base en la puerta, arriba negativo)
const body = (g: Ctx, f: number) => {
	const k = armsK(f);
	const H = Hs;
	const breath = Math.sin((f / FPS) * 2.4) * 1.5;
	// cuerpo: rodillas, falda sobre los talones, torso erguido que se arquea al subir los brazos
	const arch = k * 10;
	const pts: V2[] = [
		[-74, 0],
		[-82, -H * 0.12],
		[-58, -H * 0.3],
		[-34 - arch * 0.3, -H * 0.46],
		[-30 - arch, -H * 0.62],
		[-22 - arch, -H * 0.7 + breath],
		[-8, -H * 0.76],
		[8, -H * 0.74],
		[18, -H * 0.66 + breath],
		[16, -H * 0.5],
		[30, -H * 0.36],
		[78, -H * 0.2],
		[96, -H * 0.06],
		[90, 0],
	];
	g.beginPath();
	smoothPath(g, pts, true, 0.5);
	g.fill();
	// cuello y cabeza (levanta la barbilla al final)
	const hx = 2 - arch * 0.5;
	const hy = -H * 0.84;
	g.beginPath();
	g.ellipse(hx, hy, 15, 19, 0.2 - k * 0.35, 0, Math.PI * 2);
	g.fill();
	g.beginPath();
	g.moveTo(-8, -H * 0.75);
	g.lineTo(hx - 6, hy + 10);
	g.lineTo(hx + 8, hy + 12);
	g.lineTo(10, -H * 0.73);
	g.closePath();
	g.fill();
	// brazos: hombro → codo → mano, de 20° a 150°
	g.lineCap = 'round';
	g.lineJoin = 'round';
	for (const [side, off] of [
		[1, 0],
		[-1, 0.12],
	] as const) {
		const kk = clamp(k * (1 + off) - off * 0.5);
		const a = lerp(20, 150, kk) * (Math.PI / 180);
		const sh: V2 = [side > 0 ? 6 : -14, -H * 0.71];
		const dir = side > 0 ? 1 : 0.85;
		const el: V2 = [sh[0] + Math.sin(a) * 62 * dir, sh[1] + Math.cos(a) * 62];
		const a2 = a + (0.25 - 0.2 * kk) * side;
		const hd: V2 = [el[0] + Math.sin(a2) * 58 * dir, el[1] + Math.cos(a2) * 58];
		g.lineWidth = 15;
		g.beginPath();
		g.moveTo(sh[0], sh[1]);
		g.lineTo(el[0], el[1]);
		g.lineTo(hd[0], hd[1]);
		g.stroke();
		// mano con dedos abiertos
		g.lineWidth = 4;
		for (let d = -2; d <= 2; d++) {
			const fa = a2 + d * 0.18;
			g.beginPath();
			g.moveTo(hd[0], hd[1]);
			g.lineTo(hd[0] + Math.sin(fa) * 18 * dir, hd[1] + Math.cos(fa) * 18);
			g.stroke();
		}
	}
	// cabello
	g.lineWidth = 6;
	for (const ch of hair(f)) {
		g.beginPath();
		smoothPath(g, ch, false);
		g.stroke();
	}
};

// ruido del deshilachado (cacheado)
const frayNoise = () =>
	cached('d06:frayN', () => {
		const a = new Float32Array(CW * CH);
		for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) a[y * CW + x] = fbmTile(x / CW, y / CH, 9, 4, 77);
		return a;
	});

export const paintShadowPuppet = (g: Ctx, f: number, o: {collapse?: number} = {}) => {
	const t = f / FPS;
	const k = armsK(f);
	const collapse = o.collapse ?? 0; // 0..1 la mitad que queda se encoge a un punto
	const pulse = (1 + 0.45 * k) * (0.9 + 0.1 * Math.sin(t * 13) * Math.sin(t * 5.1));
	const cv = cached('d06:fanC', () => makeCanvas(CW, CH));
	const q = cv.getContext('2d')!;
	q.setTransform(1, 0, 0, 1, 0, 0);
	q.globalCompositeOperation = 'source-over';
	q.globalAlpha = 1;
	q.clearRect(0, 0, CW, CH);
	// abanico de luz sobre la niebla: cono que se abre hacia arriba desde la puerta, con textura de niebla
	const gr = q.createRadialGradient(OX, OY, 6, OX, OY - 120, 330);
	gr.addColorStop(0, rgba('#FFB060', 0.75));
	gr.addColorStop(0.35, rgba('#F28A3D', 0.42));
	gr.addColorStop(1, rgba('#F26D3D', 0));
	q.fillStyle = gr;
	q.beginPath();
	q.moveTo(OX - 8, OY + 6);
	q.lineTo(OX - 260, OY - 360);
	q.quadraticCurveTo(OX, OY - 430, OX + 260, OY - 360);
	q.lineTo(OX + 8, OY + 6);
	q.closePath();
	q.fill();
	q.globalCompositeOperation = 'destination-out';
	drawTiled(q, noiseTile({seed: 34, period: 4, oct: 5, contrast: 1.8}), {w: CW, h: CH, scale: 0.8, ox: t * 14, oy: -t * 22, alpha: 0.55, op: 'destination-out'});
	// la sombra: hueco en la luz
	const shadowOn = f >= EV.shadowArms[0] - 18 && collapse < 1;
	if (shadowOn) {
		const sc = cached('d06:shC', () => makeCanvas(CW, CH));
		const s = sc.getContext('2d')!;
		s.setTransform(1, 0, 0, 1, 0, 0);
		s.globalCompositeOperation = 'source-over';
		s.clearRect(0, 0, CW, CH);
		const cs = 1 - E.in(collapse);
		s.translate(OX, OY - 6);
		// la sombra crece al aparecer (la mujer se acerca al fuego)
		const grow = E.out(clamp((f - (EV.shadowArms[0] - 18)) / 14));
		s.scale(cs * grow, cs * grow);
		s.translate(0, -collapse * Hs * 0.6);
		s.fillStyle = '#000';
		s.strokeStyle = '#000';
		body(s, f);
		// deshilachado desde el suelo
		const fr = frayK(f);
		const edge: number[] = [];
		if (fr > 0 && collapse <= 0) {
			const img = s.getImageData(0, 0, CW, CH);
			const d = img.data;
			const N = frayNoise();
			const L = lerp(-0.15, 0.6, fr);
			const top = OY - 6 - Hs;
			for (let y = 0; y < CH; y++) {
				const hf = (OY - 6 - y) / Hs;
				if (y < top - 10) continue;
				for (let x = 0; x < CW; x++) {
					const i = (y * CW + x) * 4;
					if (d[i + 3] === 0) continue;
					const v = hf + (N[y * CW + x] - 0.5) * 0.55;
					if (v < L) d[i + 3] = 0;
					else if (v < L + 0.05) {
						d[i + 3] = Math.round(d[i + 3] * ((v - L) / 0.05));
						if ((x * 7 + y * 13 + f * 3) % 11 === 0) edge.push(x, y);
					}
				}
			}
			s.putImageData(img, 0, 0);
		}
		q.globalCompositeOperation = 'destination-out';
		q.globalAlpha = 0.92;
		q.drawImage(sc, 0, 0);
		q.globalAlpha = 1;
		// borde dorado que chispea donde se deshace
		if (fr > 0 && fr < 1 && collapse <= 0) {
			const L = lerp(-0.15, 0.6, fr);
			q.globalCompositeOperation = 'lighter';
			for (let i = 0; i < edge.length; i += 2) {
				const tw = 0.5 + 0.5 * Math.sin(t * 40 + i * 2.3);
				q.fillStyle = rgba((i / 2) % 3 ? P.gold : P.core, 0.95 * tw);
				q.fillRect(edge[i] - 1, edge[i + 1] - 1, 2.5, 2.5);
			}
			// chispas que suben desde el borde
			for (let i = 0; i < 18; i++) {
				const life = ((t * 1.3 + i * 0.137) % 1 + 1) % 1;
				const x = OX - 70 + ((i * 53) % 150) + Math.sin(t * 3 + i) * 6;
				const y = OY - 6 - Hs * L - life * 90;
				q.fillStyle = rgba(P.gold, 0.8 * (1 - life));
				q.fillRect(x, y, 2, 2);
			}
		}
	}
	// al escenario: luz sumada + un oscurecido suave donde está la sombra
	g.save();
	g.globalCompositeOperation = 'lighter';
	g.globalAlpha = clamp(pulse * 0.85);
	g.drawImage(cv, DOOR[0] - OX, DOOR[1] - OY);
	g.restore();
	void tinted;
};
