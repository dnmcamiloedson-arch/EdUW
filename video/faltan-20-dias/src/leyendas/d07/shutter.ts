// Día 7 · la cortina metálica de la tiendita (lado de cámara): lámina corrugada verde, óxido, labio gastado que
// atrapa el filo caliente del foco, y la banda perforada que brilla en el negro con el foco que se mece.
import {C, clamp, hash, rgba} from '../../lib/util';
import {cached, drawTiled, glow, makeCanvas, tinted, type Ctx} from '../kit/paint';
import {tile} from './tiles';
import {bulbPos, BULB0} from './world';

const SW = 1240; // ancho del lienzo (con margen para la cámara en mano)
const SX0 = -80;
export const SH = 2400; // alto: del labio hacia arriba
const RIB = 38;
const LIP = 30;
export const BAND0 = 900; // la banda perforada empieza 900 px arriba del labio…
export const BAND1 = 980; // …y termina a 980 px
const HOLE = 14;

const sheet = () =>
	cached('d07:shutter', () => {
		const c = makeCanvas(SW, SH);
		const g = c.getContext('2d')!;
		// costillas
		for (let y = SH - LIP; y > -RIB; y -= RIB) {
			const gr = g.createLinearGradient(0, y - RIB, 0, y);
			gr.addColorStop(0, '#040B09');
			gr.addColorStop(0.16, '#123328');
			gr.addColorStop(0.3, '#1E4A3B');
			gr.addColorStop(0.55, '#143429');
			gr.addColorStop(0.85, '#0A1C16');
			gr.addColorStop(1, '#030806');
			g.fillStyle = gr;
			g.fillRect(0, y - RIB, SW, RIB);
		}
		// pintura gastada + óxido
		const rust = tinted(tile({period: 4, contrast: 3.2, bias: -0.25, ox: 77, oy: 9}), C.terracota, 'd07rust');
		drawTiled(g, rust, {w: SW, h: SH, scale: 1.4, alpha: 0.28, sy: 0.6});
		const grime = tinted(tile({period: 4, contrast: 1.8, ox: 140, oy: 200}), '#050B09', 'd07grime');
		drawTiled(g, grime, {w: SW, h: SH, scale: 1.0, alpha: 0.5});
		// escurrimientos de óxido
		for (let i = 0; i < 40; i++) {
			const x = hash(i, 151) * SW;
			const y = hash(i, 152) * SH;
			const len = 60 + hash(i, 153) * 260;
			const gr = g.createLinearGradient(0, y, 0, y + len);
			gr.addColorStop(0, rgba(C.terracota, 0.32));
			gr.addColorStop(1, rgba(C.terracota, 0));
			g.fillStyle = gr;
			g.fillRect(x, y, 2 + hash(i, 154) * 4, len);
		}
		// banda perforada (agujeros oscuros; la luz se agrega en el negro)
		for (let y = SH - BAND1; y < SH - BAND0; y += HOLE)
			for (let x = 7; x < SW; x += HOLE) {
				g.fillStyle = '#020403';
				g.beginPath();
				g.arc(x, y, 3, 0, Math.PI * 2);
				g.fill();
			}
		// labio inferior: barra gruesa, arista gastada
		const lg = g.createLinearGradient(0, SH - LIP, 0, SH);
		lg.addColorStop(0, '#0E241C');
		lg.addColorStop(0.35, '#2D5E4C');
		lg.addColorStop(0.7, '#1A3A2F');
		lg.addColorStop(1, '#0A1612');
		g.fillStyle = lg;
		g.fillRect(0, SH - LIP, SW, LIP);
		drawTiled(g, rust, {y: SH - LIP, w: SW, h: LIP, scale: 0.8, alpha: 0.4});
		// jaladera
		const hx = 470 - SX0;
		g.strokeStyle = '#3E4A44';
		g.lineWidth = 9;
		g.lineCap = 'round';
		g.beginPath();
		g.moveTo(hx - 50, SH - LIP + 4);
		g.lineTo(hx - 42, SH - LIP - 34);
		g.lineTo(hx + 42, SH - LIP - 34);
		g.lineTo(hx + 50, SH - LIP + 4);
		g.stroke();
		return c;
	});

// dibuja la cortina con su labio en `edge` (px de pantalla); I = intensidad del foco
export const drawShutter = (g: Ctx, edge: number, I: number, t: number) => {
	const top = edge - SH;
	g.drawImage(sheet(), SX0, top);
	// filo caliente del foco en el labio (arriba a la izquierda del hueco) + halación
	const L = bulbPos(t);
	const dx = (L[0] - BULB0[0]) * 900; // el chorro se desliza con el vaivén
	g.save();
	g.globalCompositeOperation = 'lighter';
	const rim = g.createLinearGradient(-60 + dx, 0, 760 + dx, 0);
	rim.addColorStop(0, rgba('#FFE7A8', 0.95 * I));
	rim.addColorStop(0.35, rgba(C.flama, 0.55 * I));
	rim.addColorStop(1, rgba(C.cempa, 0));
	g.fillStyle = rim;
	g.fillRect(SX0, edge - 4, SW, 4);
	g.globalAlpha = 0.5;
	g.fillRect(SX0, edge - 10, SW, 6);
	g.globalAlpha = 1;
	// rebote cálido de la calle en las últimas costillas
	const bounce = g.createLinearGradient(0, edge - 160, 0, edge);
	bounce.addColorStop(0, 'rgba(0,0,0,0)');
	bounce.addColorStop(1, rgba(C.cempa, 0.12 * I));
	g.fillStyle = bounce;
	g.fillRect(SX0, edge - 160, SW, 160);
	g.restore();
	glow(g, 40 + dx * 0.6, edge + 6, 340, C.flama, 0.22 * I, 0.12);
	glow(g, 10 + dx * 0.6, edge, 120, '#FFE7A8', 0.35 * I, 0.2);
};

// el negro tras el portazo: la banda perforada brilla con el foco que se mece; eclipse y ojos
export const drawBlackBand = (g: Ctx, edge: number, f: number, t: number) => {
	// cuarto oscuro: la cortina apenas se adivina
	g.fillStyle = 'rgba(6,4,2,0.86)';
	g.fillRect(-100, -100, 1300, 2200);
	const L = bulbPos(t);
	const cx = 540 + (L[0] - BULB0[0]) * 2600;
	const yA = edge - BAND1;
	const yB = edge - BAND0;
	const ecl = f >= 978 && f <= 1002 ? -320 + ((f - 978) / 24) * 1760 : -9999;
	const dot = cached('d07:holeGlow', () => {
		const c = makeCanvas(24, 24);
		const q = c.getContext('2d')!;
		const gr = q.createRadialGradient(12, 12, 0, 12, 12, 12);
		gr.addColorStop(0, 'rgba(255,214,140,1)');
		gr.addColorStop(0.25, 'rgba(245,170,80,0.55)');
		gr.addColorStop(1, 'rgba(242,109,61,0)');
		q.fillStyle = gr;
		q.fillRect(0, 0, 24, 24);
		return c;
	});
	g.save();
	g.globalCompositeOperation = 'lighter';
	for (let y = yA; y < yB; y += HOLE)
		for (let x = SX0 + 7; x < SX0 + SW; x += HOLE) {
			let b = clamp(1 - Math.abs(x - cx) / 900) ** 1.6 * 0.85 + 0.12;
			b *= 0.85 + 0.15 * hash(Math.round(x * 3 + y), 7);
			// eclipse: algo pasa por fuera, de izquierda a derecha
			const ex = (x - ecl) / 260;
			const ey = (y - (yA + yB) / 2) / 70;
			if (ex * ex + ey * ey < 1) b *= 0.04;
			if (b < 0.03) continue;
			g.globalAlpha = clamp(b);
			g.drawImage(dot, x - 12, y - 12);
		}
	g.globalAlpha = 1;
	// dos agujeros centrales destellan oro: ojos que miran hacia adentro
	if (f >= 986 && f <= 998) {
		const k = Math.sin(((f - 986) / 12) * Math.PI);
		const ey = yA + Math.round((yB - yA) / 2 / HOLE) * HOLE;
		for (const ex of [533 - 21, 533 + 21]) {
			glow(g, ex, ey, 70, C.flama, 0.8 * k, 0.15);
			glow(g, ex, ey, 14, '#FFF4D6', 1.0 * k, 0.3);
		}
	}
	g.restore();
};
