// La moneda de oro (único detalle 2.5D): caras cacheadas de 512 px (anverso: canto perlado, corona de pétalos de
// cempasúchil y un gran «5» Rye en relieve; reverso: sol radiante), proyectadas como elipse según la normal.
// Disolución a carbón desde el canto (el relieve del 5 NO arde: queda metal brillante, nota del crítico #7).
import {clamp, hash, rgba} from '../../lib/util';
import {cached, glow, makeCanvas, noiseTile, type Ctx} from '../kit/paint';
import {P} from './timeline';

const R = 256;

const rimAndWreath = (g: Ctx) => {
	const gr = g.createRadialGradient(R * 0.8, R * 0.7, R * 0.1, R, R, R);
	gr.addColorStop(0, '#FFE7A0');
	gr.addColorStop(0.45, P.gold);
	gr.addColorStop(1, '#B9741E');
	g.fillStyle = gr;
	g.beginPath();
	g.arc(R, R, R - 2, 0, Math.PI * 2);
	g.fill();
	// canto perlado
	for (let i = 0; i < 96; i++) {
		const a = (i / 96) * Math.PI * 2;
		g.fillStyle = i % 2 ? '#FFE9A8' : '#9A5A16';
		g.beginPath();
		g.arc(R + Math.cos(a) * (R - 14), R + Math.sin(a) * (R - 14), 5, 0, Math.PI * 2);
		g.fill();
	}
	// corona grabada de pétalos de cempasúchil
	for (let i = 0; i < 40; i++) {
		const a = (i / 40) * Math.PI * 2;
		const rr = R - 44;
		g.save();
		g.translate(R + Math.cos(a) * rr, R + Math.sin(a) * rr);
		g.rotate(a + Math.PI / 2);
		g.fillStyle = 'rgba(120,60,10,0.55)';
		g.beginPath();
		g.ellipse(2, 2, 7, 15, 0, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = 'rgba(255,236,170,0.55)';
		g.beginPath();
		g.ellipse(-1, -1, 6, 13, 0, 0, Math.PI * 2);
		g.fill();
		g.restore();
	}
	g.strokeStyle = 'rgba(110,55,10,0.6)';
	g.lineWidth = 3;
	g.beginPath();
	g.arc(R, R, R - 68, 0, Math.PI * 2);
	g.stroke();
};

export const faceSun = () =>
	cached('d5coin:sun', () => {
		const c = makeCanvas(R * 2, R * 2);
		const g = c.getContext('2d')!;
		rimAndWreath(g);
		for (let i = 0; i < 24; i++) {
			const a = (i / 24) * Math.PI * 2;
			const L = i % 2 ? 150 : 120;
			g.fillStyle = i % 2 ? 'rgba(255,238,180,0.7)' : 'rgba(140,70,12,0.55)';
			g.beginPath();
			g.moveTo(R + Math.cos(a - 0.07) * 62, R + Math.sin(a - 0.07) * 62);
			g.lineTo(R + Math.cos(a) * L, R + Math.sin(a) * L);
			g.lineTo(R + Math.cos(a + 0.07) * 62, R + Math.sin(a + 0.07) * 62);
			g.closePath();
			g.fill();
		}
		g.fillStyle = 'rgba(120,60,10,0.6)';
		g.beginPath();
		g.arc(R + 3, R + 3, 56, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = '#FFE39A';
		g.beginPath();
		g.arc(R - 2, R - 2, 54, 0, Math.PI * 2);
		g.fill();
		return c;
	});

// el «5» en relieve (glifo Rye): capa aparte para que sobreviva al carbón
export const FIVE_SIZE = 330; // px de fuente en la cara de 512
export const fiveRelief = () =>
	cached('d5coin:five', () => {
		const c = makeCanvas(R * 2, R * 2);
		const g = c.getContext('2d')!;
		g.font = `${FIVE_SIZE}px Rye`;
		g.textAlign = 'center';
		g.textBaseline = 'middle';
		g.fillStyle = 'rgba(90,45,8,0.85)';
		g.fillText('5', R + 6, R + 22);
		const gr = g.createLinearGradient(0, R - 140, 0, R + 160);
		gr.addColorStop(0, '#FFF1C9');
		gr.addColorStop(0.4, P.gold);
		gr.addColorStop(1, '#C47A1C');
		g.fillStyle = gr;
		g.fillText('5', R - 2, R + 14);
		return c;
	});

export const faceFive = () =>
	cached('d5coin:fiveface', () => {
		const c = makeCanvas(R * 2, R * 2);
		const g = c.getContext('2d')!;
		rimAndWreath(g);
		g.drawImage(fiveRelief(), 0, 0);
		return c;
	});

// máscara de carbón: umbral fbm que avanza del canto (k=0) al centro (k=1)
const charMask = (k: number) => {
	const c = cached('d5coin:charmask', () => makeCanvas(R * 2, R * 2));
	const g = c.getContext('2d')!;
	g.setTransform(1, 0, 0, 1, 0, 0);
	g.globalCompositeOperation = 'source-over';
	g.clearRect(0, 0, R * 2, R * 2);
	if (k <= 0) return c;
	const rr = R * (1 - k * 1.15);
	const gr = g.createRadialGradient(R, R, Math.max(0, rr - 30), R, R, Math.max(1, rr + 30));
	gr.addColorStop(0, 'rgba(0,0,0,0)');
	gr.addColorStop(1, 'rgba(0,0,0,1)');
	g.fillStyle = gr;
	g.fillRect(0, 0, R * 2, R * 2);
	return c;
};

export type CoinPose = {x: number; y: number; r: number; squash: number; rot: number; face: 'sun' | 'five'; light?: number; charcoal?: number; crumble?: number};

// pinta la moneda (2.5D): squash = |cos(inclinación)| (1 = de frente, 0 = de canto)
export const paintCoin = (g: Ctx, p: CoinPose) => {
	const {x, y, r, squash, rot, face, light = 1, charcoal = 0} = p;
	const sq = Math.max(0.04, squash);
	const th = r * 0.09; // grosor del canto
	g.save();
	g.translate(x, y);
	g.rotate(rot);
	// sombra de contacto
	g.fillStyle = 'rgba(8,4,2,0.55)';
	g.beginPath();
	g.ellipse(th * 0.6, th * 1.2, r * 1.02, r * sq * 1.02 + th, 0, 0, Math.PI * 2);
	g.fill();
	// canto (cinta metálica)
	const edge = g.createLinearGradient(-r, 0, r, 0);
	edge.addColorStop(0, '#6b3c0e');
	edge.addColorStop(0.5, '#E2A646');
	edge.addColorStop(1, '#5a300a');
	g.fillStyle = edge;
	g.beginPath();
	g.ellipse(0, th * (1 - sq) + th * 0.3, r, r * sq, 0, 0, Math.PI * 2);
	g.fill();
	// cara
	g.save();
	g.scale(1, sq);
	const img = face === 'sun' ? faceSun() : faceFive();
	g.drawImage(img, -r, -r, r * 2, r * 2);
	if (charcoal > 0) {
		const tmp = cached('d5coin:chartmp', () => makeCanvas(R * 2, R * 2));
		const tg = tmp.getContext('2d')!;
		tg.setTransform(1, 0, 0, 1, 0, 0);
		tg.globalCompositeOperation = 'source-over';
		tg.clearRect(0, 0, R * 2, R * 2);
		tg.fillStyle = P.charcoal;
		tg.beginPath();
		tg.arc(R, R, R - 1, 0, Math.PI * 2);
		tg.fill();
		tg.globalCompositeOperation = 'source-atop';
		tg.globalAlpha = 0.5;
		tg.drawImage(noiseTile({seed: 91, period: 6, oct: 4, contrast: 2.4, ridged: true}), 0, 0);
		tg.globalAlpha = 1;
		tg.globalCompositeOperation = 'destination-in';
		tg.drawImage(charMask(charcoal), 0, 0);
		// el relieve del 5 queda fuera del carbón
		if (face === 'five') {
			tg.globalCompositeOperation = 'destination-out';
			tg.drawImage(fiveRelief(), 0, 0);
		}
		g.drawImage(tmp, -r, -r, r * 2, r * 2);
		// banda de brasa en el frente
		const rr = r * (1 - charcoal * 1.15);
		if (rr > 0) {
			g.save();
			g.globalCompositeOperation = 'lighter';
			g.strokeStyle = rgba(P.cempa, 0.55 * clamp(1 - charcoal));
			g.lineWidth = r * 0.05;
			g.filter = `blur(${Math.max(1, r * 0.015)}px)`;
			g.beginPath();
			g.arc(0, 0, rr, 0, Math.PI * 2);
			g.stroke();
			g.restore();
		}
	}
	g.restore();
	// especular del farol
	glow(g, -r * 0.3, -r * sq * 0.35, r * 0.6, '#FFE9B0', 0.25 * light, 0.15);
	g.restore();
	void hash;
};
