// Prueba de efectos compartidos: velas, cempasúchil, papel picado, copal, pétalos y polvo.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FPS, H, W, hash} from '../lib/util';
import {Scene} from './kit/scene';
import {candle2D, marigold, papelPicado, particles, smoke} from './kit/fx';
import {glow} from './kit/paint';

export const LAB2_LEN = 150;
export const Laboratorio2: React.FC = () => {
	useCurrentFrame();
	return (
		<Scene
			post={{bloom: 0.8, halation: 0.3, grain: 0.06, vignette: 0.9, contrast: 1.06}}
			paint={(g, f, t) => {
				const bg = g.createLinearGradient(0, 0, 0, H);
				bg.addColorStop(0, '#0d0704');
				bg.addColorStop(1, '#231305');
				g.fillStyle = bg;
				g.fillRect(0, 0, W, H);
				glow(g, 540, 1100, 900, '#ff9a40', 0.25);
				papelPicado(g, {x0: -40, x1: 1120, y: 360, t, n: 7, sag: 60});
				papelPicado(g, {x0: -60, x1: 1140, y: 560, t: t + 3, n: 6, sag: 50, seed: 3, size: 1.1});
				// mesa
				g.fillStyle = '#3a1d0c';
				g.fillRect(0, 1380, W, 600);
				g.fillStyle = C.marfil;
				g.fillRect(0, 1360, W, 30);
				for (let i = 0; i < 26; i++) marigold(g, 40 + i * 40 + hash(i, 2) * 20, 1370 + hash(i, 3) * 20, 26 + hash(i, 4) * 10, hash(i, 5) * 6, i);
				candle2D(g, {x: 300, y: 1360, w: 70, h: 260, t, seed: 1});
				candle2D(g, {x: 540, y: 1360, w: 90, h: 360, t, seed: 2});
				candle2D(g, {x: 780, y: 1360, w: 70, h: 220, t, seed: 3});
				smoke(g, {x: 540, y: 950, h: 700, w: 420, t, alpha: 0.3});
				particles(g, {kind: 'dust', n: 120, t, seed: 4});
				particles(g, {kind: 'petals', n: 18, t, seed: 5});
				void f;
			}}
		/>
	);
};
void FPS;
