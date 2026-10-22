// Lista de luces del cuadro: la veladora y cada orbe. Sirve para dobles fantasma del vidrio, destello de rayones,
// charcos de luz y para teñir la tinta del grabado (GRABADO DE LUMBRE).
import {clamp} from '../../lib/util';
import {INK, INK_LUMBRE} from './timeline';

export type Light = {x: number; y: number; r: number; color: string; a: number; kind: 'candle' | 'orb' | 'moon' | 'spark' | 'dawn'};

// cuánto de la luz del cuadro viene de las brujas (0..1)
export const orbShare = (L: Light[]) => {
	let o = 0;
	let all = 0;
	for (const l of L) {
		const e = l.a * l.r;
		all += e;
		if (l.kind === 'orb' || l.kind === 'spark') o += e;
	}
	return all > 0 ? clamp(o / all) : 0;
};

export const lumbreInk = (k: number): [number, number, number] => [INK[0] + (INK_LUMBRE[0] - INK[0]) * k, INK[1] + (INK_LUMBRE[1] - INK[1]) * k, INK[2] + (INK_LUMBRE[2] - INK[2]) * k];
