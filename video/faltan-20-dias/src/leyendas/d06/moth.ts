// Mariposa negra (Ascalapha odorata, «mariposa de la muerte») que se estrella CONTRA EL VIDRIO (capa de pantalla):
// la vemos por debajo (patas abiertas sobre el vidrio), alas de terciopelo #1A0F07 con banda terracota tenue,
// aleteo de 8 Hz, polvo de alas que mancha el vidrio, contraluz naranja que sube desde la repisa.
import {E, clamp, hash, lerp, rgba} from '../../lib/util';
import {cached, glow, makeCanvas, type Ctx} from '../kit/paint';
import {EV, FPS, P} from './timeline';

const VELVET = '#1A0F07';

type MothOpts = {x: number; y: number; s: number; rot: number; flap: number; under: number; a?: number; candle?: number};

const forewing = (g: Ctx) => {
	g.beginPath();
	g.moveTo(6, -30);
	g.bezierCurveTo(58, -98, 176, -152, 286, -140);
	g.bezierCurveTo(296, -112, 266, -42, 230, 8);
	g.bezierCurveTo(172, 22, 84, 20, 10, 8);
	g.closePath();
};
const hindwing = (g: Ctx) => {
	g.beginPath();
	g.moveTo(10, -2);
	g.bezierCurveTo(92, -4, 200, 8, 250, 46);
	// borde festoneado
	const pts: [number, number][] = [
		[238, 84],
		[222, 116],
		[200, 146],
		[176, 172],
		[148, 192],
	];
	let [px, py] = [250, 46];
	for (const [qx, qy] of pts) {
		const mx = (px + qx) / 2 + (qy - py) * 0.22;
		const my = (py + qy) / 2 - (qx - px) * 0.22;
		g.quadraticCurveTo(mx, my, qx, qy);
		[px, py] = [qx, qy];
	}
	g.bezierCurveTo(110, 200, 44, 140, 8, 62);
	g.closePath();
};

const wing = (g: Ctx, o: MothOpts, side: 1 | -1, k: number) => {
	g.save();
	g.scale(side * k, 1);
	// sombra: más oscura cuanto más se despega del vidrio
	const lift = 1 - k;
	for (const [path, hind] of [
		[hindwing, true],
		[forewing, false],
	] as const) {
		g.save();
		path(g);
		const gr = g.createRadialGradient(0, 0, 10, 0, 0, 300);
		gr.addColorStop(0, '#040201');
		gr.addColorStop(0.6, '#0b0603');
		gr.addColorStop(1, VELVET);
		g.fillStyle = gr;
		g.fill();
		g.clip();
		// líneas onduladas del grabado del ala
		g.lineWidth = 2.2;
		for (let L = 0; L < 4; L++) {
			const r = (hind ? 70 : 90) + L * (hind ? 38 : 48);
			g.strokeStyle = rgba(L === 2 ? P.terra : '#2a190d', L === 2 ? (hind ? 0.16 : 0.08) : 0.4);
			g.lineWidth = L === 2 ? 20 : 1.6;
			g.beginPath();
			for (let i = 0; i <= 24; i++) {
				const a = hind ? lerp(-0.1, 1.45, i / 24) : lerp(-0.95, 0.15, i / 24);
				const rr = r + Math.sin(i * (L === 2 ? 0.7 : 1.9) + L) * (L === 2 ? 5 : 4);
				const x = Math.cos(a) * rr;
				const y = Math.sin(a) * rr;
				if (i === 0) g.moveTo(x, y);
				else g.lineTo(x, y);
			}
			g.stroke();
		}
		// ocelo en forma de coma (ala anterior)
		if (!hind) {
			g.fillStyle = '#060302';
			g.beginPath();
			g.ellipse(118, -74, 16, 11, -0.5, 0, Math.PI * 2);
			g.fill();
			g.strokeStyle = rgba('#3a2414', 0.5);
			g.lineWidth = 1.5;
			g.beginPath();
			g.ellipse(118, -74, 19, 13, -0.5, 0, Math.PI * 2);
			g.stroke();
			// motas de escamas claras (terciopelo gastado)
			g.fillStyle = rgba('#5a4430', 0.35);
			for (let i = 0; i < 40; i++) g.fillRect(40 + hash(i, 71) * 220, -130 + hash(i, 72) * 140, 1.5, 1.5);
		}
		// translucidez del margen: la veladora atraviesa las escamas del borde
		g.globalCompositeOperation = 'lighter';
		g.lineWidth = 16;
		g.strokeStyle = rgba('#F5B04A', 0.035 * (o.candle ?? 1) * (1 - lift * 0.5));
		path(g);
		g.stroke();
		// contraluz naranja desde abajo (la bruja bajo la repisa)
		if (o.under > 0) {
			const ug = g.createLinearGradient(0, 220, 0, -60);
			ug.addColorStop(0, rgba(P.cempa, 0.9 * o.under));
			ug.addColorStop(0.45, rgba(P.cempa, 0.25 * o.under));
			ug.addColorStop(1, rgba(P.cempa, 0));
			g.strokeStyle = ug;
			g.lineWidth = 10;
			path(g);
			g.stroke();
			g.fillStyle = ug;
			g.globalAlpha = 0.25;
			path(g);
			g.fill();
			g.globalAlpha = 1;
		}
		g.globalCompositeOperation = 'source-over';
		// el ala que se despega del vidrio se oscurece
		if (lift > 0.05) {
			g.fillStyle = rgba('#000000', 0.35 * lift);
			path(g);
			g.fill();
		}
		g.restore();
		// fleco de pelitos en el borde
		g.strokeStyle = rgba('#2e1d10', 0.7);
		g.lineWidth = 1.2;
		g.beginPath();
		const N = 34;
		for (let i = 0; i < N; i++) {
			const u = i / N;
			const [x, y] = hind ? [lerp(250, 150, u) + Math.sin(u * 9) * 4, lerp(46, 192, u)] : [lerp(286, 230, u), lerp(-140, 8, u)];
			g.moveTo(x, y);
			g.lineTo(x + 5 + hash(i, hind ? 3 : 4) * 4, y + (hash(i, 7) - 0.3) * 5);
		}
		g.stroke();
	}
	g.restore();
};

const body = (g: Ctx, o: MothOpts, t: number) => {
	// patas abiertas apoyadas en el vidrio (vista ventral)
	g.strokeStyle = '#0d0805';
	g.lineCap = 'round';
	for (const side of [-1, 1]) {
		for (let i = 0; i < 3; i++) {
			const y0 = -22 + i * 16;
			const ang = (-0.9 + i * 0.75) + Math.sin(t * 40 + i + side) * 0.02;
			const L1 = 34 + i * 6;
			const kx = side * Math.cos(ang) * L1;
			const ky = y0 + Math.sin(ang) * L1;
			g.lineWidth = 3;
			g.beginPath();
			g.moveTo(side * 6, y0);
			g.lineTo(kx, ky);
			g.lineWidth = 2;
			g.lineTo(kx + side * 22, ky + (i - 1) * 18 + 10);
			g.stroke();
			// uña
			g.fillStyle = rgba(P.bone, 0.18);
			g.fillRect(kx + side * 22 - 1, ky + (i - 1) * 18 + 9, 2, 2);
		}
	}
	// abdomen y tórax peludos
	const gr = g.createLinearGradient(-14, 0, 14, 0);
	gr.addColorStop(0, '#120a05');
	gr.addColorStop(0.5, '#3a2616');
	gr.addColorStop(1, '#120a05');
	g.fillStyle = gr;
	g.beginPath();
	g.ellipse(0, -18, 15, 26, 0, 0, Math.PI * 2);
	g.fill();
	g.beginPath();
	g.moveTo(-12, 4);
	g.bezierCurveTo(-14, 50, -6, 92, 0, 104);
	g.bezierCurveTo(6, 92, 14, 50, 12, 4);
	g.closePath();
	g.fill();
	// anillos
	g.strokeStyle = rgba('#5a3f28', 0.5);
	g.lineWidth = 1.5;
	for (let i = 0; i < 6; i++) {
		const y = 16 + i * 14;
		const w = 12 - i * 1.5;
		g.beginPath();
		g.moveTo(-w, y);
		g.quadraticCurveTo(0, y + 5, w, y);
		g.stroke();
	}
	// pelusa
	g.strokeStyle = rgba('#4a3220', 0.6);
	g.lineWidth = 1;
	g.beginPath();
	for (let i = 0; i < 40; i++) {
		const a = (i / 40) * Math.PI * 2;
		const x = Math.cos(a) * 15;
		const y = -18 + Math.sin(a) * 26;
		g.moveTo(x, y);
		g.lineTo(x * 1.25 + (hash(i, 11) - 0.5) * 4, y + Math.sin(a) * 6);
	}
	g.stroke();
	// cabeza, ojos y antenas plumosas
	g.fillStyle = '#0d0805';
	g.beginPath();
	g.ellipse(0, -48, 10, 9, 0, 0, Math.PI * 2);
	g.fill();
	g.fillStyle = rgba('#F5B04A', 0.35);
	for (const s of [-1, 1]) {
		g.beginPath();
		g.arc(s * 7, -50, 2.4, 0, Math.PI * 2);
		g.fill();
	}
	g.strokeStyle = '#100905';
	for (const s of [-1, 1]) {
		const tw = Math.sin(t * 6 + s) * 4;
		g.lineWidth = 2;
		g.beginPath();
		g.moveTo(s * 4, -55);
		g.quadraticCurveTo(s * 26, -110, s * (58 + tw), -128);
		g.stroke();
		g.lineWidth = 0.8;
		g.beginPath();
		for (let i = 1; i < 14; i++) {
			const u = i / 14;
			const x = lerp(s * 4, s * (58 + tw), u) + s * Math.sin(u * 3) * 6;
			const y = lerp(-55, -128, u) + 10 * Math.sin(u * Math.PI) * -1;
			g.moveTo(x, y);
			g.lineTo(x + s * 4, y - 3);
			g.moveTo(x, y);
			g.lineTo(x - s * 2, y - 5);
		}
		g.stroke();
	}
	void o;
};

export const paintMoth = (g: Ctx, o: MothOpts, t: number) => {
	if ((o.a ?? 1) <= 0) return;
	g.save();
	g.globalAlpha = o.a ?? 1;
	g.translate(o.x, o.y);
	g.rotate(o.rot);
	g.scale(o.s, o.s);
	// sombra de contacto sobre el vidrio (la luz del cuarto viene de atrás)
	glow(g, 0, 20, 330, '#000000', 0.25);
	const k = clamp(o.flap, 0.18, 1);
	wing(g, o, 1, k);
	wing(g, o, -1, k);
	body(g, o, t);
	g.restore();
};

// ---------- coreografía 657–702 ----------
const A0: [number, number] = [575, 770];
const A1: [number, number] = [606, 802];
export const mothState = (f: number): (MothOpts & {blur: number}) | null => {
	const t = f / FPS;
	const L = EV.owlLand;
	if (f < L - 3 || f > EV.owlLaunch + 13) return null;
	const flap8 = 0.5 + 0.5 * Math.cos(2 * Math.PI * 8 * t); // 8 Hz
	// acercamiento (3 cuadros, borroso, desde el cuarto)
	if (f < L) {
		const u = (f - (L - 3)) / 3;
		return {x: lerp(880, A0[0] + 40, u), y: lerp(1180, A0[1] + 30, u), s: lerp(0.5, 1.0, u), rot: 0.6 - 0.5 * u, flap: flap8, under: 0, a: 0.75 + 0.25 * u, blur: lerp(14, 6, u)};
	}
	const hit = E.out(clamp((f - L) / 3));
	const hop = E.inOut(clamp((f - (L + 6)) / 5)); // segundo golpe seco en 666
	const over = 1 + 0.07 * Math.exp(-(f - L) / 2.5) * Math.cos((f - L) * 1.4);
	let x = lerp(A0[0], A1[0], hop);
	let y = lerp(A0[1], A1[1], hop);
	let rot = lerp(-0.14, 0.06, hop);
	let s = 1.22 * over * (1 + 0.03 * Math.exp(-Math.max(0, f - L - 6) / 2) * (f >= L + 6 ? 1 : 0));
	// ráfagas de aleteo: 660–672 fuerte, 672–681 quieta (temblor), 681–690 ráfaga
	const burst = f < L + 12 ? 1 : f < L + 21 ? 0.08 : 0.85;
	let flap = lerp(1, 0.25 + 0.75 * flap8, burst);
	const under = clamp((f - EV.underlight) / 4);
	let a = 1;
	let blur = 0;
	// se arranca hacia arriba-izquierda y se aleja del vidrio
	const lu = clamp((f - EV.owlLaunch) / 12);
	if (lu > 0) {
		const e = E.in(lu);
		x = lerp(A1[0], -260, e);
		y = lerp(A1[1], 120, e) - 60 * Math.sin(lu * Math.PI);
		rot = lerp(0.06, -0.9, e);
		s = lerp(1.22, 0.7, e);
		flap = 0.2 + 0.8 * (0.5 + 0.5 * Math.cos(2 * Math.PI * 11 * t));
		blur = 8 * e;
	}
	void hit;
	return {x, y, s, rot, flap, under, a, blur};
};

// polvo de escamas embarrado en el vidrio (persiste y se desvanece hasta ~26 s)
type Smudge = {x: number; y: number; rx: number; ry: number; r: number; born: number; a: number};
const SMUDGES: Smudge[] = (() => {
	const out: Smudge[] = [];
	for (let i = 0; i < 26; i++) {
		const side = i % 2 ? 1 : -1;
		const ang = lerp(-0.9, 0.9, hash(i, 51));
		const d = 110 + hash(i, 52) * 190;
		const anchor = i < 12 ? A0 : A1;
		out.push({
			x: anchor[0] + side * Math.cos(ang) * d,
			y: anchor[1] + Math.sin(ang) * d * 0.8,
			rx: 26 + hash(i, 53) * 50,
			ry: 6 + hash(i, 54) * 10,
			r: ang * side + (hash(i, 55) - 0.5) * 0.6,
			born: EV.owlLand + (i < 12 ? hash(i, 56) * 10 : 6 + hash(i, 56) * 24),
			a: 0.1 + hash(i, 57) * 0.12,
		});
	}
	return out;
})();

export const paintMothPowder = (g: Ctx, f: number) => {
	const fade = 1 - clamp((f - 740) / 60);
	if (f < EV.owlLand || fade <= 0) return;
	g.save();
	for (const m of SMUDGES) {
		if (f < m.born) continue;
		const k = clamp((f - m.born) / 3) * fade * m.a;
		g.save();
		g.translate(m.x, m.y);
		g.rotate(m.r);
		g.scale(1, m.ry / m.rx);
		const gr = g.createRadialGradient(0, 0, 0, 0, 0, m.rx);
		gr.addColorStop(0, rgba('#8f7d66', k));
		gr.addColorStop(0.6, rgba('#6e5c49', k * 0.5));
		gr.addColorStop(1, rgba('#6e5c49', 0));
		g.fillStyle = gr;
		g.fillRect(-m.rx, -m.rx, m.rx * 2, m.rx * 2);
		g.restore();
	}
	g.restore();
};

// pinta la mariposa (y estela de movimiento) en pantalla
export const paintMothOnGlass = (g: Ctx, f: number) => {
	const st = mothState(f);
	if (!st) return;
	const t = f / FPS;
	if (st.blur > 0.5) {
		// estela: dos copias previas más tenues (sin filtros de pantalla completa)
		for (const back of [2, 1]) {
			const p = mothState(f - back * 0.5);
			if (p) paintMoth(g, {...p, a: (p.a ?? 1) * 0.22}, t);
		}
		// borroso: se pinta a media resolución en un lienzo aparte y se desenfoca una sola vez
		const c = cached('d06:mothC', () => makeCanvas(540, 960));
		const q = c.getContext('2d')!;
		q.setTransform(1, 0, 0, 1, 0, 0);
		q.clearRect(0, 0, 540, 960);
		q.setTransform(0.5, 0, 0, 0.5, 0, 0);
		paintMoth(q, st, t);
		g.save();
		g.filter = `blur(${Math.min(st.blur, 14).toFixed(1)}px)`;
		g.drawImage(c, 0, 0, 1080, 1920);
		g.restore();
	} else paintMoth(g, st, t);
};
