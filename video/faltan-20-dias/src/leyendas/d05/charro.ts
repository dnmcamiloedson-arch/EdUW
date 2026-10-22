// El Charro Negro (2D, nunca 3D): silueta #0B0704 con paintShape, rim frío de luna/niebla, rim cálido del farol
// en los planos cercanos, destellos de plata y ojos de brasa bajo el vacío del ala.
import {noise2D} from '@remotion/noise';
import {E, clamp, lerp, rgba} from '../../lib/util';
import {glow, type Ctx} from '../kit/paint';
import {paintShape, type Mat} from '../kit/shade';
import {P} from './timeline';

// ojos de brasa: almendras con núcleo blanco-oro, halo naranja y glow exterior terracota; on 0..1
export const emberEyes = (g: Ctx, x: number, y: number, sep: number, size: number, on: number, t: number, streak = 0) => {
	if (on <= 0.01) return;
	const fl = 0.85 + 0.15 * (0.5 + 0.5 * noise2D('d5eye', t * 6, 0));
	const s = size * lerp(0.08, 1, E.out(clamp(on)));
	for (const sx of [-1, 1]) {
		const ex = x + sx * sep * 0.5;
		glow(g, ex, y, s * 5.5, P.terra, 0.55 * on * fl, 0.2);
		glow(g, ex, y, s * 2.2, P.cempa, 0.8 * on * fl, 0.3);
		g.save();
		g.globalCompositeOperation = 'lighter';
		g.fillStyle = rgba(P.eyeCore, on * fl);
		g.beginPath();
		g.ellipse(ex, y, s * 0.5, s * 0.2, sx * -0.12, 0, Math.PI * 2);
		g.fill();
		g.restore();
		if (streak > 0) {
			g.save();
			g.globalCompositeOperation = 'lighter';
			const gr = g.createLinearGradient(ex - streak / 2, y, ex + streak / 2, y);
			gr.addColorStop(0, rgba(P.cempa, 0));
			gr.addColorStop(0.5, rgba(P.eyeCore, 0.55 * on));
			gr.addColorStop(1, rgba(P.cempa, 0));
			g.fillStyle = gr;
			g.fillRect(ex - streak / 2, y - s * 0.06 - 1, streak, s * 0.12 + 2);
			g.restore();
		}
	}
};

const MAT = (warm: number, light = -Math.PI / 2): Mat => ({
	fill: P.body,
	light,
	rim: {color: P.moonRim, width: 3, alpha: 0.55, blur: 2},
	shadow: {color: '#000000', width: 10, alpha: 0.5, blur: 6},
	halo: warm > 0.02 ? {color: P.cempa, r: 8, alpha: warm * 0.25} : undefined,
});

// Jinete de frente sobre el caballo (LEJOS / MEDIO / CERCA / SUBLIMINAL): cx, gy = pie en el suelo; h = alto en px
export const riderFront = (g: Ctx, cx: number, gy: number, h: number, o: {t: number; eyes: number; tilt?: number; warm?: number; sarape?: number; breath?: number}) => {
	const {t, eyes, tilt = 0, warm = 0, sarape = 0} = o;
	const u = h;
	const chest = Math.sin(t * Math.PI * 2 * 0.28) * 0.004 * u;
	const path = (g2: Ctx) => {
		// patas
		for (const [x, w] of [[-0.13, 0.035], [-0.05, 0.03], [0.05, 0.03], [0.13, 0.035]] as const) {
			g2.rect(cx + x * u - (w * u) / 2, gy - 0.36 * u, w * u, 0.36 * u);
		}
		// pecho / cuerpo del caballo
		g2.ellipse(cx, gy - 0.47 * u, 0.2 * u, 0.15 * u, 0, 0, Math.PI * 2);
		// cabeza del caballo de frente (baja)
		g2.moveTo(cx - 0.055 * u, gy - 0.62 * u);
		g2.quadraticCurveTo(cx - 0.07 * u, gy - 0.42 * u, cx - 0.03 * u, gy - 0.34 * u);
		g2.lineTo(cx + 0.03 * u, gy - 0.34 * u);
		g2.quadraticCurveTo(cx + 0.07 * u, gy - 0.42 * u, cx + 0.055 * u, gy - 0.62 * u);
		g2.closePath();
		// orejas
		g2.moveTo(cx - 0.05 * u, gy - 0.6 * u);
		g2.lineTo(cx - 0.065 * u, gy - 0.69 * u);
		g2.lineTo(cx - 0.025 * u, gy - 0.62 * u);
		g2.moveTo(cx + 0.05 * u, gy - 0.6 * u);
		g2.lineTo(cx + 0.065 * u, gy - 0.69 * u);
		g2.lineTo(cx + 0.025 * u, gy - 0.62 * u);
		// torso del jinete y brazos
		g2.moveTo(cx - 0.12 * u, gy - 0.56 * u);
		g2.quadraticCurveTo(cx - 0.13 * u, gy - 0.78 * u - chest, cx - 0.06 * u, gy - 0.84 * u - chest);
		g2.lineTo(cx + 0.06 * u, gy - 0.84 * u - chest);
		g2.quadraticCurveTo(cx + 0.13 * u, gy - 0.78 * u - chest, cx + 0.12 * u, gy - 0.56 * u);
		g2.closePath();
		// sarape al hombro izquierdo (lado derecho de pantalla), levantado por ráfaga
		g2.moveTo(cx + 0.08 * u, gy - 0.83 * u);
		g2.quadraticCurveTo(cx + (0.2 + sarape * 0.08) * u, gy - (0.72 + sarape * 0.06) * u, cx + (0.17 + sarape * 0.12) * u, gy - 0.55 * u);
		g2.lineTo(cx + 0.1 * u, gy - 0.58 * u);
		g2.closePath();
	};
	paintShape(g, path, [cx - 0.32 * u, gy - 0.9 * u, 0.64 * u, 0.9 * u], MAT(warm), Math.min(1, 900 / u));
	// cabeza + sombrero (con ladeo)
	g.save();
	g.translate(cx, gy - 0.86 * u - chest);
	g.rotate(tilt);
	const hat = (g2: Ctx) => {
		g2.ellipse(0, -0.03 * u, 0.27 * u, 0.045 * u, 0, 0, Math.PI * 2);
		g2.moveTo(-0.085 * u, -0.04 * u);
		g2.quadraticCurveTo(-0.09 * u, -0.17 * u, 0, -0.18 * u);
		g2.quadraticCurveTo(0.09 * u, -0.17 * u, 0.085 * u, -0.04 * u);
		g2.closePath();
		g2.rect(-0.05 * u, -0.03 * u, 0.1 * u, 0.06 * u);
	};
	paintShape(g, hat, [-0.3 * u, -0.2 * u, 0.6 * u, 0.25 * u], MAT(warm), Math.min(1, 900 / u));
	// galón de plata en el ala: destellos de guion que viajan
	g.save();
	g.globalCompositeOperation = 'lighter';
	g.strokeStyle = rgba(P.silver, 0.35);
	g.lineWidth = Math.max(0.8, 0.004 * u);
	g.setLineDash([0.02 * u, 0.05 * u]);
	g.lineDashOffset = -t * 0.08 * u;
	g.beginPath();
	g.ellipse(0, -0.03 * u, 0.26 * u, 0.04 * u, 0, 0.1, Math.PI - 0.1);
	g.stroke();
	g.restore();
	emberEyes(g, 0, 0.01 * u, 0.045 * u, 0.03 * u, eyes, t);
	g.restore();
	// ojos del caballo (rojo apagado, más chicos)
	glow(g, cx - 0.04 * u, gy - 0.56 * u, 0.02 * u, P.terra, 0.6 * Math.min(1, eyes + 0.4));
	glow(g, cx + 0.04 * u, gy - 0.56 * u, 0.02 * u, P.terra, 0.6 * Math.min(1, eyes + 0.4));
	// botonadura de plata (destellos mínimos)
	g.save();
	g.globalCompositeOperation = 'lighter';
	for (let i = 0; i < 5; i++) {
		const a = 0.5 + 0.5 * Math.sin(t * 2 + i * 1.7);
		g.fillStyle = rgba(P.silver, 0.25 + 0.4 * a * a);
		g.beginPath();
		g.arc(cx - 0.11 * u, gy - (0.5 - i * 0.03) * u, Math.max(0.6, 0.004 * u), 0, Math.PI * 2);
		g.arc(cx + 0.11 * u, gy - (0.5 - i * 0.03) * u, Math.max(0.6, 0.004 * u), 0, Math.PI * 2);
		g.fill();
	}
	g.restore();
};
