// Escena de un episodio: un lienzo 2D que se pinta en cada frame + la postproducción WebGL encima
// + los textos (DOM) arriba de todo. paint() puede devolver ajustes de post por frame (destellos, fallas…).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FPS, H, W} from '../../lib/util';
import {useFrameCanvas, type Ctx} from './paint';
import {Post, type PostOpts} from './post';

export const resetCtx = (g: Ctx) => {
	g.setTransform(1, 0, 0, 1, 0, 0);
	g.globalAlpha = 1;
	g.globalCompositeOperation = 'source-over';
	g.filter = 'none';
	g.clearRect(0, 0, W, H);
};

export const Scene: React.FC<{paint: (g: Ctx, f: number, t: number) => PostOpts | void; post?: PostOpts; children?: React.ReactNode; bg?: string}> = ({paint, post = {}, children, bg = '#000'}) => {
	const f = useCurrentFrame();
	const cv = useFrameCanvas();
	const g = cv.getContext('2d')!;
	resetCtx(g);
	const extra = paint(g, f, f / FPS) ?? {};
	return (
		<AbsoluteFill style={{background: bg}}>
			<Post src={cv} t={f / FPS} o={{...post, ...extra}} />
			{children}
		</AbsoluteFill>
	);
};
