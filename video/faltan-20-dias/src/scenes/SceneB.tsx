import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, E, FPS, flicker, ramp} from '../lib/util';
import {Cam, Flame, Light, PaperTexture} from '../components/core';
import {Calavera, CutFilter} from '../components/Calavera';
import {Bokeh, PETAL_LAYERS, PetalRain} from '../components/Particles';

// 7.5–10 s: emerge la calavera; luz de borde desde la llama; los ojos se encienden al final.
export const SceneB: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS + 7.5;
	const fl = flicker(t, 1);
	const L = ramp(f, [0, 42], [0.04, 1], E.out) * fl;
	const rim = ramp(f, [4, 34], [0, 1], E.out) * fl;
	const eye = ramp(f, [54, 70], [0, 1], E.out) * (0.9 + 0.1 * fl);
	const s = ramp(f, [0, 75], [1.0, 1.08], E.dolly);
	const r = ramp(f, [0, 75], [-1.6, 0.4], E.inOut);
	const dx = ramp(f, [0, 60], [40, 0], E.out);
	return (
		<AbsoluteFill style={{background: '#040201', overflow: 'hidden'}}>
			<CutFilter />
			<Cam s={s} r={r} ox={560} oy={900}>
				<Light x={160} y={1560} r={1150} color={C.cempa} o={0.3 * L} />
				<Light x={430} y={900} r={620} color={C.terracota} o={0.14 * L} />
				<Bokeh t={t} L={L} n={14} seed={21} area={[300, 300, 800, 1200]} blur={3} />
				<div style={{position: 'absolute', left: 90 + dx, top: 430, width: 940, height: 940}}>
					<Calavera L={L} eye={eye} rim={rim} t={t} />
				</div>
				<Light x={470} y={890} r={170} color={C.flama} o={0.65 * eye} />
			</Cam>
			<PaperTexture o={0.16} />
			{/* flama en primer plano, fuera de foco */}
			<AbsoluteFill style={{filter: 'blur(22px)', opacity: 0.9}}>
				<Flame x={110} y={1880} size={330} t={t} seed={4} grow={1} fl={fl} wick={false} />
			</AbsoluteFill>
			<Light x={110} y={1700} r={600} color={C.flama} o={0.45 * fl} />
			<PetalRain t={t - 4.6} layer={{...PETAL_LAYERS[2], n: 5, seed: 91}} light={{x: 100, y: 1700, sigma: 900, L: L * 0.9}} />
		</AbsoluteFill>
	);
};
