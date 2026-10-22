// Tecolote (susto falso): silueta 2D de 380 px de envergadura, contorno de luna, ojos ámbar.
// STUB de etapa 1 (pose única con aleteo simple); G2 hace las cuatro poses, plumas en cadena y el giro de cabeza.
import {rgba} from '../../lib/util';
import {glow, type Ctx} from '../kit/paint';
import {P} from './timeline';

export const paintOwl = (g: Ctx, o: {x: number; y: number; wing: number; head: number; s?: number; under?: number}) => {
	const {x, y, wing, head, s = 1, under = 0} = o;
	g.save();
	g.translate(x, y);
	g.scale(s, s);
	g.fillStyle = '#0c0a08';
	// alas: wing 1 = extendidas, 0 = plegadas
	for (const sx of [-1, 1]) {
		g.beginPath();
		g.moveTo(0, -60);
		g.quadraticCurveTo(sx * 90 * (0.4 + wing), -110 * wing - 40, sx * 190 * (0.25 + 0.75 * wing), -40 + 30 * (1 - wing));
		g.quadraticCurveTo(sx * 110 * (0.3 + wing), 10, 0, 10);
		g.fill();
	}
	// cuerpo
	g.beginPath();
	g.ellipse(0, -40, 46, 70, 0, 0, Math.PI * 2);
	g.fill();
	// cabeza con penachos
	g.save();
	g.translate(0, -118);
	g.rotate(head);
	g.beginPath();
	g.ellipse(0, 0, 40, 34, 0, 0, Math.PI * 2);
	g.moveTo(-34, -14);
	g.lineTo(-30, -48);
	g.lineTo(-16, -26);
	g.moveTo(34, -14);
	g.lineTo(30, -48);
	g.lineTo(16, -26);
	g.fill();
	for (const sx of [-1, 1]) {
		g.fillStyle = P.gold;
		g.beginPath();
		g.arc(sx * 15, -2, 8, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = '#000';
		g.beginPath();
		g.arc(sx * 15, -2, 3.5, 0, Math.PI * 2);
		g.fill();
		glow(g, sx * 15, -2, 18, P.gold, 0.5);
	}
	g.restore();
	// contorno de luna
	g.strokeStyle = rgba(P.moonRim, 0.5);
	g.lineWidth = 2;
	g.beginPath();
	g.ellipse(0, -40, 46, 70, 0, -Math.PI * 0.9, -Math.PI * 0.3);
	g.stroke();
	if (under > 0) glow(g, 0, 0, 160, P.cempa, 0.5 * under);
	g.restore();
};
