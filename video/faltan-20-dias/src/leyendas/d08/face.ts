// Día 8 · RIG-07 · la cara del susto (B7, f930–943): rostro grabado de un chaneque VIEJO (adulto: arco ciliar pesado,
// surcos nasogenianos hondos, orejas anchas, sombra rayada del ala del sombrero de palma, sonrisa de labios cerrados),
// iluminado desde abajo por la linterna. Capa estática en caché (cabeza, orejas, sombrero, arrugas, grabado) +
// por cuadro: ojos (pupilas que se contraen), boca (la sonrisa se ensancha), surcos y flecos del ala con inercia.
import {noise2D} from '@remotion/noise';
import {clamp, hash, lerp, rgba} from '../../lib/util';
import {cached, makeCanvas, type Ctx} from '../kit/paint';
import {smoothPath} from '../kit/rig';
import {P, type V2} from './core';

const CW = 1800;
const CH = 2100;
const OX = 900; // origen = centro de la cara
const OY = 1150;

const HEAD: V2[] = [
	[0, -505], [210, -495], [350, -420], [405, -270], [428, -95], [418, 85], [376, 245], [300, 385], [178, 492], [0, 538],
	[-178, 492], [-300, 385], [-376, 245], [-418, 85], [-428, -95], [-405, -270], [-350, -420], [-210, -495],
];
const EAR_R: V2[] = [[392, -210], [468, -330], [600, -440], [676, -350], [700, -170], [640, 20], [530, 140], [430, 168], [392, 120]];
const EAR_IN: V2[] = [[425, -190], [510, -290], [610, -360], [650, -170], [600, -10], [500, 90], [440, 100]];
export const EYE_L: V2 = [-168, -112];
export const EYE_R: V2 = [168, -112];

const mir = (pts: V2[]): V2[] => pts.map(([x, y]) => [-x, y] as V2);
const path = (g: Ctx, pts: V2[], close = true) => {
	g.beginPath();
	smoothPath(g, pts, close);
};

// arruga grabada: surco oscuro + filo iluminado debajo (la luz viene de abajo)
const crease = (g: Ctx, pts: V2[], w: number, a = 0.6, lit = 0.35) => {
	g.lineCap = 'round';
	g.lineJoin = 'round';
	g.strokeStyle = rgba('#140a04', a);
	g.lineWidth = w;
	path(g, pts, false);
	g.stroke();
	g.strokeStyle = rgba('#e0a46a', lit);
	g.lineWidth = Math.max(1.2, w * 0.45);
	path(g, pts.map(([x, y]) => [x, y + w * 0.9] as V2), false);
	g.stroke();
};

const skinGrad = (g: Ctx) => {
	const gr = g.createLinearGradient(0, -560, 0, 560);
	gr.addColorStop(0, '#0a0603');
	gr.addColorStop(0.36, '#22150b');
	gr.addColorStop(0.62, '#58381f');
	gr.addColorStop(0.86, '#93643c');
	gr.addColorStop(1, '#a87445');
	return gr;
};

const faceLayer = () =>
	cached('d8face:v4', () => {
		const c = makeCanvas(CW, CH);
		const g = c.getContext('2d')!;
		g.translate(OX, OY);
		// cuello y hombros (silueta oscura con poncho de fibra, filo cálido arriba)
		g.fillStyle = '#0d0805';
		g.beginPath();
		g.moveTo(-250, 380);
		g.bezierCurveTo(-260, 560, -330, 640, -760, 760);
		g.lineTo(-780, 950);
		g.lineTo(780, 950);
		g.lineTo(760, 760);
		g.bezierCurveTo(330, 640, 260, 560, 250, 380);
		g.closePath();
		g.fill();
		const ng = g.createLinearGradient(0, 420, 0, 700);
		ng.addColorStop(0, 'rgba(150,96,56,0.55)');
		ng.addColorStop(1, 'rgba(150,96,56,0)');
		g.fillStyle = ng;
		g.fillRect(-250, 420, 500, 300);
		for (let i = 0; i < 46; i++) {
			const x0 = -720 + i * 32 + hash(i, 1) * 14;
			const y0 = 700 + Math.abs(x0) * 0.06 - (Math.abs(x0) < 300 ? (300 - Math.abs(x0)) * 0.4 : 0);
			g.strokeStyle = rgba(i % 3 ? '#3a2814' : '#5a3e20', 0.7);
			g.lineWidth = 3;
			g.beginPath();
			g.moveTo(x0, y0);
			g.quadraticCurveTo(x0 + 6, y0 + 60, x0 - 4 + hash(i, 2) * 8, y0 + 120 + hash(i, 3) * 80);
			g.stroke();
		}
		// orejas anchas (detrás de la cabeza)
		for (const s of [1, -1]) {
			const E = s > 0 ? EAR_R : mir(EAR_R);
			const I = s > 0 ? EAR_IN : mir(EAR_IN);
			const eg = g.createLinearGradient(0, -330, 0, 170);
			eg.addColorStop(0, '#080503');
			eg.addColorStop(1, '#4e311b');
			g.fillStyle = eg;
			path(g, E);
			g.fill();
			g.fillStyle = 'rgba(30,14,6,0.6)';
			path(g, I);
			g.fill();
			crease(g, I.slice(1, 6), 7, 0.55, 0.3);
			g.strokeStyle = 'rgba(232,170,110,0.3)';
			g.lineWidth = 4;
			path(g, E.slice(5, 8), false);
			g.stroke();
		}
		// cabeza
		g.fillStyle = skinGrad(g);
		path(g, HEAD);
		g.fill();
		g.save();
		path(g, HEAD);
		g.clip();
		// moteado de piel vieja
		for (let i = 0; i < 260; i++) {
			const x = (hash(i, 11) - 0.5) * 860;
			const y = (hash(i, 12) - 0.5) * 1060;
			const r = 6 + hash(i, 13) * 26;
			g.fillStyle = rgba(hash(i, 14) > 0.5 ? '#2a170b' : '#c89260', 0.06 + hash(i, 15) * 0.06);
			g.beginPath();
			g.ellipse(x, y, r, r * 0.7, hash(i, 16) * 3, 0, Math.PI * 2);
			g.fill();
		}
		// pómulos: el borde inferior recibe la luz
		for (const s of [1, -1]) {
			const cg = g.createRadialGradient(s * 270, 60, 10, s * 270, 60, 170);
			cg.addColorStop(0, 'rgba(214,150,92,0.38)');
			cg.addColorStop(1, 'rgba(214,150,92,0)');
			g.fillStyle = cg;
			g.fillRect(s * 270 - 170, -110, 340, 340);
			const hg = g.createRadialGradient(s * 300, -60, 10, s * 300, -60, 150);
			hg.addColorStop(0, 'rgba(20,10,4,0.35)');
			hg.addColorStop(1, 'rgba(20,10,4,0)');
			g.fillStyle = hg;
			g.fillRect(s * 300 - 150, -210, 300, 300);
		}
		// cuencas hondas
		for (const [ex, ey] of [EYE_L, EYE_R]) {
			const sg = g.createRadialGradient(ex, ey - 10, 20, ex, ey, 150);
			sg.addColorStop(0, 'rgba(8,4,2,0.95)');
			sg.addColorStop(0.6, 'rgba(14,7,3,0.6)');
			sg.addColorStop(1, 'rgba(14,7,3,0)');
			g.fillStyle = sg;
			g.beginPath();
			g.ellipse(ex, ey, 150, 105, 0, 0, Math.PI * 2);
			g.fill();
			// bolsas bajo los ojos (iluminadas por abajo)
			const s = Math.sign(ex);
			crease(g, [[ex - s * 70, ey + 50], [ex, ey + 78], [ex + s * 85, ey + 52]], 6, 0.5, 0.4);
			crease(g, [[ex - s * 55, ey + 92], [ex + s * 5, ey + 118], [ex + s * 95, ey + 92]], 5, 0.4, 0.3);
			// patas de gallo
			for (let k = 0; k < 4; k++) {
				const a = -0.5 + k * 0.32;
				crease(g, [[ex + s * 120, ey + 5 + k * 10], [ex + s * (165 + k * 6), ey + Math.sin(a) * 60 + 10], [ex + s * (205 + k * 8), ey + Math.sin(a) * 95 + 10]], 4, 0.45, 0.22);
			}
		}
		// sombra que sube desde la nariz entre las cejas (luz desde abajo)
		const wg = g.createLinearGradient(0, -120, 0, -470);
		wg.addColorStop(0, 'rgba(10,5,2,0.75)');
		wg.addColorStop(1, 'rgba(10,5,2,0.2)');
		g.fillStyle = wg;
		g.beginPath();
		g.moveTo(-60, -110);
		g.bezierCurveTo(-90, -250, -150, -380, -170, -500);
		g.lineTo(170, -500);
		g.bezierCurveTo(150, -380, 90, -250, 60, -110);
		g.closePath();
		g.fill();
		// arco ciliar pesado: masa media, filo inferior iluminado, sombra arriba
		for (const s of [1, -1]) {
			const R: V2[] = [[s * 30, -200], [s * 110, -232], [s * 230, -238], [s * 330, -200], [s * 350, -170], [s * 240, -186], [s * 110, -180], [s * 40, -160]];
			g.fillStyle = '#4a301b';
			path(g, R);
			g.fill();
			g.strokeStyle = 'rgba(236,176,112,0.6)';
			g.lineWidth = 7;
			path(g, [[s * 45, -158], [s * 120, -178], [s * 240, -182], [s * 345, -166]], false);
			g.stroke();
			const bg = g.createLinearGradient(0, -330, 0, -220);
			bg.addColorStop(0, 'rgba(10,5,2,0)');
			bg.addColorStop(1, 'rgba(10,5,2,0.6)');
			g.fillStyle = bg;
			g.fillRect(s > 0 ? 20 : -380, -330, 360, 105);
			// cejas canosas, pelos tiesos iluminados por abajo
			for (let i = 0; i < 34; i++) {
				const u = i / 33;
				const x = s * lerp(50, 330, u);
				const y = -205 - Math.sin(u * Math.PI) * 30 + hash(i, 40 + s) * 12;
				const L = 30 + hash(i, 42) * 50;
				const a = -Math.PI / 2 - s * (0.4 + u * 0.9) + (hash(i, 43) - 0.5) * 0.6;
				g.strokeStyle = rgba(i % 3 ? '#b8a890' : '#efe4cf', 0.7);
				g.lineWidth = 2.4;
				g.beginPath();
				g.moveTo(x, y);
				g.quadraticCurveTo(x + Math.cos(a) * L * 0.6, y + Math.sin(a) * L * 0.4, x + Math.cos(a) * L, y + Math.sin(a) * L + 6);
				g.stroke();
			}
		}
		// ceño: pliegues verticales
		crease(g, [[-26, -150], [-34, -205], [-30, -262]], 7, 0.6, 0.25);
		crease(g, [[26, -150], [34, -205], [30, -262]], 7, 0.6, 0.25);
		// frente: arrugas onduladas
		for (let k = 0; k < 5; k++) {
			const y = -285 - k * 34;
			const pts: V2[] = [];
			for (let j = 0; j <= 8; j++) {
				const x = lerp(-300 + k * 12, 300 - k * 12, j / 8);
				pts.push([x, y + Math.sin(j * 0.9 + k) * 7 + Math.abs(x) * 0.08]);
			}
			crease(g, pts, 5, 0.42, 0.18);
		}
		// nariz ancha y bulbosa
		const ns = g.createLinearGradient(0, -170, 0, 150);
		ns.addColorStop(0, '#2c1b0f');
		ns.addColorStop(0.7, '#7c5332');
		ns.addColorStop(1, '#c48f5b');
		g.fillStyle = ns;
		g.beginPath();
		g.moveTo(-42, -160);
		g.bezierCurveTo(-60, -40, -90, 20, -120, 70);
		g.bezierCurveTo(-150, 120, -110, 150, -60, 140);
		g.bezierCurveTo(-30, 162, 30, 162, 60, 140);
		g.bezierCurveTo(110, 150, 150, 120, 120, 70);
		g.bezierCurveTo(90, 20, 60, -40, 42, -160);
		g.closePath();
		g.fill();
		// punta y aletas: brillo inferior
		for (const [x, y, r] of [[0, 92, 74], [-104, 104, 48], [104, 104, 48]] as const) {
			const tg = g.createRadialGradient(x, y + r * 0.5, 4, x, y, r);
			tg.addColorStop(0, 'rgba(240,184,120,0.55)');
			tg.addColorStop(1, 'rgba(240,184,120,0)');
			g.fillStyle = tg;
			g.beginPath();
			g.arc(x, y, r, 0, Math.PI * 2);
			g.fill();
		}
		crease(g, [[-128, 56], [-150, 100], [-126, 136], [-80, 146]], 6, 0.6, 0.35);
		crease(g, [[128, 56], [150, 100], [126, 136], [80, 146]], 6, 0.6, 0.35);
		// fosas nasales (oscuras, la luz entra por debajo)
		for (const s of [1, -1]) {
			g.fillStyle = 'rgba(12,6,2,0.92)';
			g.beginPath();
			g.ellipse(s * 52, 138, 30, 13, s * 0.25, 0, Math.PI * 2);
			g.fill();
		}
		g.strokeStyle = 'rgba(246,196,134,0.6)';
		g.lineWidth = 5;
		g.beginPath();
		g.moveTo(-70, 158);
		g.quadraticCurveTo(0, 176, 70, 158);
		g.stroke();
		// filtrum + mentón con hoyuelo y papada
		crease(g, [[-20, 175], [-24, 228]], 4, 0.4, 0.2);
		crease(g, [[20, 175], [24, 228]], 4, 0.4, 0.2);
		crease(g, [[-110, 372], [0, 392], [110, 372]], 7, 0.55, 0.4);
		crease(g, [[-300, 300], [-250, 400], [-170, 460]], 6, 0.5, 0.3);
		crease(g, [[300, 300], [250, 400], [170, 460]], 6, 0.5, 0.3);
		const chin = g.createRadialGradient(0, 520, 10, 0, 470, 190);
		chin.addColorStop(0, 'rgba(246,194,130,0.5)');
		chin.addColorStop(1, 'rgba(246,194,130,0)');
		g.fillStyle = chin;
		g.fillRect(-200, 300, 400, 300);
		// barba rala canosa
		for (let i = 0; i < 160; i++) {
			const a = Math.PI * (0.12 + hash(i, 60) * 0.76);
			const rr = 0.72 + hash(i, 61) * 0.26;
			const x = Math.cos(a) * 380 * rr;
			const y = 140 + Math.sin(a) * 390 * rr;
			g.fillStyle = rgba('#d9cdb6', 0.25 + hash(i, 62) * 0.3);
			g.fillRect(x, y, 2.2, 5);
		}
		// grabado: rayado diagonal en la mitad alta + contra-rayado en la sombra del ala
		const hc = makeCanvas(CW, CH);
		const hg2 = hc.getContext('2d')!;
		hg2.translate(OX, OY);
		hg2.strokeStyle = '#0b0603';
		hg2.lineWidth = 2.2;
		hg2.beginPath();
		for (let x = -1200; x < 1200; x += 11) {
			hg2.moveTo(x, -600);
			hg2.lineTo(x + 700, 600);
		}
		hg2.stroke();
		hg2.lineWidth = 1.8;
		hg2.beginPath();
		for (let x = -1200; x < 1200; x += 13) {
			hg2.moveTo(x, -600);
			hg2.lineTo(x - 300, -200);
		}
		hg2.stroke();
		hg2.globalCompositeOperation = 'destination-in';
		const hm = hg2.createLinearGradient(0, -520, 0, 240);
		hm.addColorStop(0, 'rgba(0,0,0,0.85)');
		hm.addColorStop(0.35, 'rgba(0,0,0,0.45)');
		hm.addColorStop(1, 'rgba(0,0,0,0)');
		hg2.fillStyle = hm;
		hg2.fillRect(-900, -1150, 1800, 2100);
		g.drawImage(hc, -OX, -OY);
		// caída de luz hacia los lados y arriba (la linterna está abajo, al centro)
		const vg = g.createRadialGradient(0, 430, 120, 0, 300, 760);
		vg.addColorStop(0, 'rgba(5,3,1,0)');
		vg.addColorStop(0.55, 'rgba(5,3,1,0.25)');
		vg.addColorStop(1, 'rgba(5,3,1,0.8)');
		g.fillStyle = vg;
		g.fillRect(-460, -560, 920, 1120);
		// sombra del ala sobre la frente
		const brim = g.createLinearGradient(0, -520, 0, -360);
		brim.addColorStop(0, 'rgba(6,3,1,0.95)');
		brim.addColorStop(1, 'rgba(6,3,1,0)');
		g.fillStyle = brim;
		g.fillRect(-460, -540, 920, 190);
		g.restore();
		// contorno con filo cálido abajo (luz rasante)
		g.strokeStyle = 'rgba(226,160,96,0.5)';
		g.lineWidth = 6;
		path(g, HEAD.slice(4, 15), false);
		g.stroke();
		// sombrero de palma: copa oscura + ala vista desde abajo, iluminada por la linterna, tejido de palma
		g.fillStyle = '#0e0905';
		g.beginPath();
		g.ellipse(0, -700, 360, 240, 0, Math.PI, 0);
		g.lineTo(360, -560);
		g.lineTo(-360, -560);
		g.fill();
		const brimPath = () => {
			const q = new Path2D();
			for (let i = 0; i <= 180; i++) {
				const a = (i / 180) * Math.PI * 2;
				const rag = 1 + noise2D('brim', Math.cos(a) * 3, Math.sin(a) * 3) * 0.05 + (hash(i, 77) - 0.5) * 0.025;
				const x = Math.cos(a) * 800 * rag;
				const y = -560 + Math.sin(a) * 165 * rag - Math.cos(a) * 28;
				if (i) q.lineTo(x, y);
				else q.moveTo(x, y);
			}
			q.closePath();
			return q;
		};
		const bp = brimPath();
		g.save();
		g.clip(bp);
		const bgd = g.createLinearGradient(0, -735, 0, -385);
		bgd.addColorStop(0, '#120c06');
		bgd.addColorStop(0.55, '#4e3a1c');
		bgd.addColorStop(1, '#a88346');
		g.fillStyle = bgd;
		g.fillRect(-900, -760, 1800, 400);
		// tejido de palma: trenzas concéntricas + radios
		for (let k = 2; k < 15; k++) {
			g.strokeStyle = rgba(k % 2 ? '#20150a' : '#d9b46e', k % 2 ? 0.32 + hash(k, 78) * 0.2 : 0.12);
			g.lineWidth = k % 2 ? 4 : 2.5;
			g.beginPath();
			for (let j = 0; j <= 90; j++) {
				const a = (j / 90) * Math.PI * 2;
				const x = Math.cos(a) * 800 * (k / 14);
				const y = -560 + Math.sin(a) * 165 * (k / 14) - Math.cos(a) * 28 * (k / 14) + ((j + k) % 2 ? 2.5 : -2.5);
				if (j) g.lineTo(x, y);
				else g.moveTo(x, y);
			}
			g.stroke();
		}
		for (let k = 0; k < 140; k++) {
			const a = (k / 140) * Math.PI * 2;
			g.strokeStyle = rgba('#1a1008', 0.3);
			g.lineWidth = 1.6;
			g.beginPath();
			g.moveTo(Math.cos(a) * 260, -560 + Math.sin(a) * 52);
			g.lineTo(Math.cos(a) * 820, -560 + Math.sin(a) * 170 - Math.cos(a) * 28);
			g.stroke();
		}
		// el interior hacia la copa se hunde en sombra (sin borde duro)
		const cg = g.createRadialGradient(0, -560, 60, 0, -560, 560);
		cg.addColorStop(0, 'rgba(6,3,1,0.9)');
		cg.addColorStop(0.5, 'rgba(6,3,1,0.55)');
		cg.addColorStop(1, 'rgba(6,3,1,0)');
		g.save();
		g.scale(1, 0.3);
		g.fillStyle = cg;
		g.fillRect(-900, -560 / 0.3 - 600, 1800, 1200);
		g.restore();
		g.restore();
		g.strokeStyle = 'rgba(222,180,112,0.5)';
		g.lineWidth = 4;
		g.stroke(bp);
		return c;
	});

// orilla frontal del ala: puntos donde cuelgan los flecos de palma
const FRINGE = Array.from({length: 46}, (_, i) => {
	const a = 0.08 + ((i + hash(i, 74) * 0.6) / 46) * (Math.PI - 0.16);
	const edge = Math.abs(Math.cos(a));
	return {x: Math.cos(a) * 790, y: -560 + Math.sin(a) * 162 - Math.cos(a) * 28, L: 26 + hash(i, 70) * 70 + edge * 40, w: 3 + hash(i, 71) * 4, tone: hash(i, 72)};
});

export type FaceState = {lf: number; grin: number; pupil: number; flare: number; sway: number};

const eye = (g: Ctx, [ex, ey]: V2, s: number, st: FaceState) => {
	g.save();
	g.translate(ex, ey);
	// párpado superior pesado que baja hacia la nariz (mirada torva)
	const open = new Path2D();
	open.moveTo(-s * 78, 6);
	open.bezierCurveTo(-s * 40, -34 + s * 14, s * 30, -40 - s * 10, s * 82, -4);
	open.bezierCurveTo(s * 40, 38, -s * 30, 40, -s * 78, 6);
	g.save();
	g.clip(open);
	g.fillStyle = '#3a2410';
	g.fillRect(-90, -50, 180, 100);
	const ix = s * -6;
	const iy = 4;
	const ig = g.createRadialGradient(ix, iy, 2, ix, iy, 46);
	ig.addColorStop(0, '#FFF2C0');
	ig.addColorStop(0.35, P.gold);
	ig.addColorStop(0.8, P.cempa);
	ig.addColorStop(1, '#5a1c08');
	g.fillStyle = ig;
	g.beginPath();
	g.arc(ix, iy, 46, 0, Math.PI * 2);
	g.fill();
	g.fillStyle = '#100703';
	g.beginPath();
	g.ellipse(ix, iy, st.pupil, st.pupil * 1.15, 0, 0, Math.PI * 2);
	g.fill();
	g.fillStyle = 'rgba(255,250,230,0.9)';
	g.beginPath();
	g.arc(ix + 12, iy + 14, 5, 0, Math.PI * 2); // reflejo de la linterna (desde abajo)
	g.fill();
	// sombra del párpado sobre el ojo
	const lg = g.createLinearGradient(0, -40, 0, 10);
	lg.addColorStop(0, 'rgba(10,5,2,0.85)');
	lg.addColorStop(1, 'rgba(10,5,2,0)');
	g.fillStyle = lg;
	g.fillRect(-90, -50, 180, 60);
	g.restore();
	g.lineCap = 'round';
	g.strokeStyle = '#120803';
	g.lineWidth = 9;
	g.beginPath();
	g.moveTo(-s * 84, 8);
	g.bezierCurveTo(-s * 40, -34 + s * 14, s * 30, -40 - s * 10, s * 88, -4);
	g.stroke();
	g.strokeStyle = 'rgba(230,166,104,0.5)';
	g.lineWidth = 4;
	g.beginPath();
	g.moveTo(-s * 70, 26);
	g.bezierCurveTo(-s * 30, 44, s * 40, 42, s * 80, 10);
	g.stroke();
	// brillo: los ojos se encienden
	g.globalCompositeOperation = 'lighter';
	const R = 190 + 120 * st.flare;
	const hg = g.createRadialGradient(ix, iy, 0, ix, iy, R);
	hg.addColorStop(0, rgba(P.gold, 0.6 * st.flare + 0.25));
	hg.addColorStop(0.3, rgba(P.cempa, 0.22 * st.flare + 0.06));
	hg.addColorStop(1, rgba(P.cempa, 0));
	g.fillStyle = hg;
	g.fillRect(ix - R, iy - R, 2 * R, 2 * R);
	g.restore();
};

const mouth = (g: Ctx, st: FaceState) => {
	const k = st.grin; // 0 → 1: +10 % de ancho y comisuras arriba
	const w = 185 * (1 + 0.1 * k);
	const lift = 30 + 22 * k;
	// surcos nasogenianos (se ahondan con la sonrisa)
	for (const s of [1, -1]) {
		const pts: V2[] = [[s * 135, 92], [s * (205 + 10 * k), 190], [s * (w + 50), 300 - 8 * k], [s * (w + 40), 370]];
		crease(g, pts, 13 + 4 * k, 0.75, 0.5);
		crease(g, [[s * (w + 6), 250 - lift], [s * (w + 26), 268 - lift * 0.6], [s * (w + 18), 300 - lift * 0.3]], 6, 0.55, 0.3);
	}
	// labios cerrados: línea larga y fina, comisuras hacia arriba
	g.fillStyle = 'rgba(60,30,16,0.9)';
	g.beginPath();
	g.moveTo(-w, 262 - lift);
	g.bezierCurveTo(-w * 0.55, 270, -w * 0.25, 252, 0, 256);
	g.bezierCurveTo(w * 0.25, 252, w * 0.55, 270, w, 262 - lift);
	g.bezierCurveTo(w * 0.5, 312, -w * 0.5, 312, -w, 262 - lift);
	g.fill();
	g.strokeStyle = '#0e0603';
	g.lineWidth = 8;
	g.lineCap = 'round';
	g.beginPath();
	g.moveTo(-w, 262 - lift);
	g.bezierCurveTo(-w * 0.5, 292, w * 0.5, 292, w, 262 - lift);
	g.stroke();
	g.strokeStyle = 'rgba(244,190,128,0.55)';
	g.lineWidth = 5;
	g.beginPath();
	g.moveTo(-w * 0.62, 304);
	g.quadraticCurveTo(0, 326, w * 0.62, 304);
	g.stroke();
};

// dibuja la cara con el centro en (0,0) del ctx actual
export const scareFace = (g: Ctx, st: FaceState) => {
	g.drawImage(faceLayer(), -OX, -OY);
	eye(g, EYE_L, -1, st);
	g.save();
	g.translate(EYE_R[0], EYE_R[1] - 8);
	g.scale(1.12, 1.12);
	g.translate(-EYE_R[0], -EYE_R[1]);
	eye(g, EYE_R, 1, st);
	g.restore();
	mouth(g, st);
	// flecos de palma colgando del ala, con inercia del embiste
	g.lineCap = 'round';
	for (let i = 0; i < FRINGE.length; i++) {
		const q = FRINGE[i];
		const sw = st.sway * (0.6 + hash(i, 73) * 0.6) + noise2D('fr', i * 0.3, st.lf * 0.15) * 8;
		// tira de palma deshilachada: ancha arriba, punta fina, con un quiebre
		const kx = q.x + sw * 0.35 + (hash(i, 75) - 0.5) * 14;
		const ky = q.y + q.L * 0.5;
		g.fillStyle = rgba(q.tone > 0.6 ? '#b8924f' : q.tone > 0.25 ? '#76582c' : '#2e2010', 0.95);
		g.beginPath();
		g.moveTo(q.x - q.w, q.y - 8);
		g.quadraticCurveTo(kx - q.w * 0.6, ky, q.x + sw, q.y + q.L);
		g.quadraticCurveTo(kx + q.w * 0.6, ky, q.x + q.w, q.y - 8);
		g.closePath();
		g.fill();
	}
};

export const faceState = (lf: number): FaceState => ({
	lf,
	grin: clamp((lf - 3) / 6),
	pupil: lf >= 3 ? 8 : 17,
	flare: lf < 2 ? 0.6 : 1 - 0.25 * clamp((lf - 6) / 6),
	sway: lf < 4 ? -40 * (1 - lf / 4) : 26 * Math.sin((lf - 4) * 0.9) * Math.exp(-(lf - 4) / 5),
});
void lerp;
