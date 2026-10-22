// Sombra de la cruz: el contorno real de las tijeras abiertas (mismas hojas y ojos que paintScissors), proyectado
// desde la luz del orbe. Se pinta a 1/4 de resolución en un lienzo aparte, con penumbra que crece con la escala,
// y se aplica con multiply (una sola operación de pantalla completa).
import {cached, makeCanvas, type Ctx} from '../kit/paint';

// forma de las tijeras en coordenadas locales (pivote en 0,0; hojas hacia arriba), abiertas `open` (0..1 → 90°)
const scissorsShape = (q: Ctx, open: number, thick: number) => {
	const ang = (open * Math.PI) / 2;
	for (const [a, big] of [
		[-ang / 2, true],
		[ang / 2, false],
	] as const) {
		q.save();
		q.rotate(a);
		q.beginPath();
		q.moveTo(-5, 4);
		q.lineTo(-4.5, -40);
		q.quadraticCurveTo(-3, -96, 0, -118);
		q.quadraticCurveTo(7, -70, 7.5, -10);
		q.lineTo(6, 6);
		q.closePath();
		q.fill();
		q.lineWidth = thick;
		q.stroke();
		q.lineWidth = (big ? 7.5 : 6.5) + thick * 0.6;
		q.beginPath();
		q.moveTo(0, 4);
		q.quadraticCurveTo(big ? -4 : 4, 18, big ? -3 : 3, 26);
		q.stroke();
		q.beginPath();
		if (big) q.ellipse(-4, 44, 17, 21, -0.15, 0, Math.PI * 2);
		else q.ellipse(3, 41, 12, 16, 0.1, 0, Math.PI * 2);
		q.stroke();
		q.restore();
	}
	q.beginPath();
	q.arc(0, 0, 6, 0, Math.PI * 2);
	q.fill();
};

export type CrossShadow = {
	cx: number; // centro (pivote proyectado) en coordenadas del contexto destino
	cy: number;
	k: number; // escala de la proyección
	squash: number; // 0..1 escorzo vertical (1 = sobre el piso, 0 = de frente sobre el vidrio)
	rot: number;
	a: number; // oscuridad 0..1 (0.35 = 35 % más oscuro)
	soft: number; // penumbra en px de pantalla
	thick?: number; // engrosado de la silueta (unidades locales) para que la cruz se lea a escala grande
};

// pinta la sombra con la transformación ACTUAL de g (sirve en el mundo o en pantalla)
export const paintCrossShadow = (g: Ctx, o: CrossShadow) => {
	if (o.a <= 0.002) return;
	const c = cached('d06:crossC', () => makeCanvas(270, 480));
	const q = c.getContext('2d')!;
	const m = g.getTransform();
	q.setTransform(1, 0, 0, 1, 0, 0);
	q.clearRect(0, 0, 270, 480);
	q.setTransform(m.a / 4, m.b / 4, m.c / 4, m.d / 4, m.e / 4, m.f / 4);
	q.translate(o.cx, o.cy);
	q.rotate(o.rot);
	q.scale(o.k, o.k * (1 - 0.55 * o.squash));
	q.filter = `blur(${Math.max(0.5, o.soft / 4).toFixed(1)}px)`;
	q.fillStyle = '#000';
	q.strokeStyle = '#000';
	q.lineJoin = 'round';
	// las hojas se ensanchan un poco en la penumbra para que la cruz se lea a escala grande
	q.save();
	scissorsShape(q, 1, o.thick ?? 5);
	q.restore();
	q.filter = 'none';
	g.save();
	g.setTransform(1, 0, 0, 1, 0, 0);
	// alfa → mezcla con un café muy oscuro: dst·(1 − a) + dst·ink·a
	q.setTransform(1, 0, 0, 1, 0, 0);
	q.globalCompositeOperation = 'source-in';
	q.fillStyle = `rgba(40,22,10,${Math.min(1, o.a * 1.25).toFixed(3)})`;
	q.fillRect(0, 0, 270, 480);
	q.globalCompositeOperation = 'source-over';
	g.globalCompositeOperation = 'multiply';
	g.drawImage(c, 0, 0, 1080, 1920);
	g.restore();
};
