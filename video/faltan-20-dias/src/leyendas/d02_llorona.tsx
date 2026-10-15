// Día 2 · La Llorona — episodio de la serie de leyendas (en producción).
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, H, W} from '../lib/util';
import {Scene} from './kit/scene';
import {Line} from './kit/text';

export const EP02_LEN = 1200;
export const Ep02: React.FC<{dias: number; fecha: string}> = () => {
	const f = useCurrentFrame();
	return (
		<Scene
			paint={(g) => {
				g.fillStyle = C.bg;
				g.fillRect(0, 0, W, H);
			}}
		>
			<Line text={'La Llorona'} f={f} at={10} y={860} size={80} font="Rye" />
		</Scene>
	);
};
