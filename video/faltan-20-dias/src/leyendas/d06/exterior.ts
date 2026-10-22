// Lo que se ve por la ventana: noche teal (cielo, luna, tres cerros, choza del fogón, pueblo) y su variante de amanecer.
// Coordenadas del reflejo en reposo (= pantalla con θ = 0). La ventana es x 300–1000, y 330–1030.
import {clamp, hash, lerp, mixRGB, rgba} from '../../lib/util';
import {cached, drawTiled, fogBand, glow, makeCanvas, noiseTile, tinted, blurred, type Ctx} from '../kit/paint';
import {smoke} from '../kit/fx';
import {P} from './timeline';

export const WIN = {x0: 300, y0: 330, x1: 1000, y1: 1030};
// área del lienzo exterior (un poco más grande que el hueco, por la rotación del espejo no hace falta: el muro tapa)
const EX = {x: 250, y: 300, w: 800, h: 780};

// perfiles de cerros (y de la cresta en x del mundo)
export const ridgeFar = (x: number) => 760 - 26 * Math.sin(x * 0.006 + 1.2) - 14 * Math.sin(x * 0.017 + 0.4);
export const ridgeMid = (x: number) => 866 - 40 * Math.exp(-(((x - 640) / 170) ** 2)) - 10 * Math.sin(x * 0.011 + 2.1);
export const ridgeNear = (x: number) => 958 - 22 * Math.sin(x * 0.008 + 0.3) - 8 * Math.sin(x * 0.03);

export const HUT = {x: 640, y: ridgeMid(640) + 6, w: 120, h: 80};

// casas del pueblo sobre el cerro cercano
export type House = {x: number; w: number; h: number; y: number; win: number; off: number};
export const HOUSES: House[] = cached('d06:houses', () => {
	const out: House[] = [];
	let x = 290;
	let i = 0;
	while (x < 1010) {
		const w = 52 + hash(i, 61) * 40;
		const y = ridgeNear(x + w / 2) + 10 + hash(i, 62) * 18;
		out.push({x, w, h: 30 + hash(i, 63) * 16, y, win: hash(i, 64) < 0.5 ? 1 : 0, off: hash(i, 65)});
		x += w + 8 + hash(i, 66) * 30;
		i++;
	}
	return out;
});

const hill = (g: Ctx, fn: (x: number) => number, color: string, bottom = 1100) => {
	g.fillStyle = color;
	g.beginPath();
	g.moveTo(EX.x - 10, bottom);
	for (let x = EX.x - 10; x <= EX.x + EX.w + 10; x += 8) g.lineTo(x, fn(x));
	g.lineTo(EX.x + EX.w + 10, bottom);
	g.closePath();
	g.fill();
};

const buildStatic = (dawn: boolean) => {
	const c = makeCanvas(EX.w, EX.h);
	const g = c.getContext('2d')!;
	g.translate(-EX.x, -EX.y);
	// cielo
	const sk = g.createLinearGradient(0, EX.y, 0, 900);
	if (dawn) {
		sk.addColorStop(0, '#3a3552');
		sk.addColorStop(0.35, '#7a5a6a');
		sk.addColorStop(0.7, '#E0A86A');
		sk.addColorStop(1, '#F5C88A');
	} else {
		sk.addColorStop(0, P.sky0);
		sk.addColorStop(1, P.sky1);
	}
	g.fillStyle = sk;
	g.fillRect(EX.x, EX.y, EX.w, EX.h);
	if (!dawn) {
		// estrellas
		for (let i = 0; i < 90; i++) {
			const x = EX.x + hash(i, 11) * EX.w;
			const y = EX.y + hash(i, 12) * 420;
			const a = 0.25 + hash(i, 13) * 0.6;
			g.fillStyle = rgba(P.bone, a);
			g.fillRect(x, y, hash(i, 14) < 0.15 ? 2 : 1.2, hash(i, 14) < 0.15 ? 2 : 1.2);
		}
		// media luna hueso
		glow(g, 450, 470, 150, '#9FC3C4', 0.22);
		g.fillStyle = P.bone;
		g.beginPath();
		g.arc(450, 470, 30, -Math.PI / 2, Math.PI / 2);
		g.closePath();
		g.fill();
		g.fillStyle = rgba(P.bone, 0.12);
		g.beginPath();
		g.arc(450, 470, 30, Math.PI / 2, (Math.PI * 3) / 2);
		g.fill();
	} else {
		glow(g, 760, 830, 420, '#FFE2A8', 0.5);
	}
	const tone = (c0: string, k: number): string => (dawn ? rgba(mixRGB(c0, '#6a4a3a', k)) : c0);
	hill(g, ridgeFar, tone(P.hillFar, 0.55));
	hill(g, ridgeMid, tone(P.hillMid, 0.45));
	// choza del fogón: muros de adobe bajos, techo de zacate cónico con orilla deshilachada, tiro de humo arriba
	{
		const wallC = tone('#0a1d20', 0.4);
		const roofC = tone('#071619', 0.4);
		const x0 = HUT.x - HUT.w / 2;
		const x1 = HUT.x + HUT.w / 2;
		const wy = HUT.y - HUT.h * 0.45;
		g.fillStyle = wallC;
		g.fillRect(x0 + 6, wy, HUT.w - 12, HUT.h * 0.45 + 4);
		// techo: cono de zacate
		g.fillStyle = roofC;
		g.beginPath();
		g.moveTo(x0 - 8, wy + 6);
		for (let i = 0; i <= 14; i++) g.lineTo(lerp(x0 - 8, x1 + 8, i / 14), wy + 6 + (i % 2 ? 5 : 0) + hash(i, 71) * 3);
		g.lineTo(HUT.x + 7, HUT.y - HUT.h + 2);
		g.lineTo(HUT.x - 7, HUT.y - HUT.h + 2);
		g.closePath();
		g.fill();
		// pajas (filo de luna)
		g.strokeStyle = dawn ? 'rgba(255,220,170,0.25)' : 'rgba(159,195,196,0.22)';
		g.lineWidth = 1;
		for (let i = 0; i < 26; i++) {
			const u = i / 25;
			g.beginPath();
			g.moveTo(lerp(HUT.x - 6, HUT.x + 6, u), HUT.y - HUT.h + 4);
			g.lineTo(lerp(x0 - 6, x1 + 6, u) + (hash(i, 72) - 0.5) * 4, wy + 8);
			g.stroke();
		}
		// remate del tiro de humo
		g.fillStyle = roofC;
		g.fillRect(HUT.x - 8, HUT.y - HUT.h - 4, 16, 8);
		// tronco y nopal junto a la choza
		g.fillStyle = tone('#081a1c', 0.4);
		g.beginPath();
		g.ellipse(x1 + 26, HUT.y - 10, 9, 13, 0.3, 0, Math.PI * 2);
		g.ellipse(x1 + 38, HUT.y - 24, 8, 11, -0.4, 0, Math.PI * 2);
		g.fill();
	}
	// magueyes en el cerro medio
	for (let i = 0; i < 9; i++) {
		const x = EX.x + 40 + hash(i, 21) * (EX.w - 80);
		const y = ridgeMid(x) + 14;
		g.strokeStyle = tone('#0a2024', 0.4);
		g.lineWidth = 3;
		for (let k = 0; k < 6; k++) {
			const a = -Math.PI / 2 + (k - 2.5) * 0.32;
			g.beginPath();
			g.moveTo(x, y);
			g.quadraticCurveTo(x + Math.cos(a) * 10, y + Math.sin(a) * 14, x + Math.cos(a) * 18, y + Math.sin(a) * 22);
			g.stroke();
		}
	}
	hill(g, ridgeNear, tone(P.hillNear, 0.4));
	// pueblo: casas de adobe con techos de teja
	for (const h of HOUSES) {
		g.fillStyle = tone('#1a2f2c', 0.35);
		g.fillRect(h.x, h.y - h.h, h.w, h.h + 40);
		g.fillStyle = tone('#0c1c1c', 0.35);
		g.beginPath();
		g.moveTo(h.x - 6, h.y - h.h);
		g.lineTo(h.x + h.w * 0.5, h.y - h.h - 16);
		g.lineTo(h.x + h.w + 6, h.y - h.h);
		g.closePath();
		g.fill();
		g.strokeStyle = rgba('#000', 0.25);
		g.lineWidth = 1;
		for (let k = 0; k < h.w; k += 6) {
			g.beginPath();
			g.moveTo(h.x + k, h.y - h.h - 1);
			g.lineTo(h.x + h.w * 0.5, h.y - h.h - 15);
			g.stroke();
		}
	}
	return c;
};

const staticExt = (dawn: boolean) => cached(`d06:ext:${dawn ? 'dawn' : 'night'}`, () => buildStatic(dawn));

export type ExtOpts = {
	t: number;
	focus: number; // 1 = cerros nítidos, 0 = desenfocados (foco en el cuarto)
	dawn?: number; // 0 noche → 1 amanecer
	hut?: number; // brillo de la puerta del fogón 0..1 (+ flare >1)
	windowsLit?: (i: number) => number; // 0..1 por casa
	fog?: number; // espesor de la niebla del valle
};

export const paintExterior = (g: Ctx, o: ExtOpts) => {
	const {t, focus, dawn = 0, hut = 0, fog = 0.5} = o;
	const night = staticExt(false);
	const blurAmt = (1 - focus) * 5;
	const drawStatic = (cv: HTMLCanvasElement, key: string, a: number) => {
		if (a <= 0) return;
		g.save();
		g.globalAlpha = a;
		if (blurAmt > 0.4) {
			const b = blurred(cv, 5, key);
			g.globalAlpha = a * clamp(blurAmt / 5);
			g.drawImage(b.canvas, EX.x - b.pad, EX.y - b.pad);
			g.globalAlpha = a * (1 - clamp(blurAmt / 5));
		}
		if (g.globalAlpha > 0.001) g.drawImage(cv, EX.x, EX.y);
		g.restore();
	};
	drawStatic(night, 'd06:extN', 1);
	if (dawn > 0) drawStatic(staticExt(true), 'd06:extD', dawn);
	// nubes sobre la luna
	const cloud = tinted(noiseTile({seed: 23, period: 3, oct: 5, contrast: 2.0, bias: -0.1}), dawn > 0.5 ? '#c99a7a' : '#1d3a42', `d06cloud${dawn > 0.5 ? 'd' : 'n'}`);
	g.save();
	g.beginPath();
	g.rect(EX.x, EX.y, EX.w, 300);
	g.clip();
	drawTiled(g, cloud, {x: EX.x, y: 400, w: EX.w, h: 160, scale: 2.2, ox: t * 6, alpha: 0.75, sy: 0.35});
	g.restore();
	// ventanas del pueblo
	const lit = o.windowsLit ?? (() => 1);
	HOUSES.forEach((h, i) => {
		if (!h.win) return;
		const a = lit(i) * (1 - dawn);
		if (a <= 0.01) return;
		const x = h.x + h.w * 0.3;
		const y = h.y - h.h * 0.6;
		g.fillStyle = rgba('#F5B85A', 0.85 * a);
		g.fillRect(x, y, 7, 9);
		glow(g, x + 3, y + 4, 22, '#F2A04D', 0.35 * a);
	});
	// humo del tiro (columna que el viento dobla)
	smoke(g, {x: HUT.x + 4, y: HUT.y - HUT.h, h: 260, w: 90, t, seed: 6, color: dawn > 0.5 ? '#c8b8a8' : '#3c5a5c', alpha: 0.45 * (1 - dawn * 0.5)});
	// puerta del fogón
	if (hut > 0) {
		const dx = HUT.x + 14;
		const dy = HUT.y;
		const flick = 0.85 + 0.15 * Math.sin(t * 17) * Math.sin(t * 7.3);
		g.fillStyle = rgba(mixRGB('#F26D3D', '#FFF3D6', clamp(hut - 1)), clamp(hut) * flick);
		g.beginPath();
		g.moveTo(dx - 9, dy);
		g.lineTo(dx - 9, dy - 24);
		g.quadraticCurveTo(dx, dy - 34, dx + 9, dy - 24);
		g.lineTo(dx + 9, dy);
		g.closePath();
		g.fill();
		glow(g, dx, dy - 14, 60 + 60 * clamp(hut - 1), '#F28A3D', 0.5 * Math.min(1.6, hut) * flick);
	}
	// niebla del valle (dos bandas en sentidos opuestos)
	if (fog > 0) {
		fogBand(g, {y0: 800, y1: 960, color: '#2c6a5a', t, seed: 31, alpha: 0.35 * fog * (1 - dawn * 0.5), speed: 8, x: EX.x, w: EX.w, scale: 1.2});
		fogBand(g, {y0: 880, y1: 1040, color: '#3b7a68', t, seed: 37, alpha: 0.3 * fog * (1 - dawn * 0.5), speed: -11, x: EX.x, w: EX.w, scale: 1.0});
	}
	void lerp;
};
