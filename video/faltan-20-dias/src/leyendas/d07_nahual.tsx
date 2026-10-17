// Día 7 · El Nahual — «La sombra no miente». Un solo plano secuencia agachados detrás de la cortina metálica de la
// tiendita: la cortina le corta la cabeza a don Fermín y la pared de enfrente muestra su sombra. Un foco, una luz
// física, y su péndulo moribundo escribe el número. Pila de capas en d07/frame.ts; beats en d07/beats.ts.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C} from '../lib/util';
import {Scene} from './kit/scene';
import {LeyendaLockup, Line, type LineProps} from './kit/text';
import {paintFrame} from './d07/frame';
import {LEN, bulbI} from './d07/world';

export const EP07_LEN = LEN; // 1230 frames (41.0 s); el outro estándar se agrega después

// Textos con sus tiempos finales: [entra, termina] — el fundido de salida acaba en «termina».
type T = Omit<LineProps, 'f' | 'out'> & {end: number};
const OUTK = 16;
const TEXTS: T[] = [
	{text: 'Mírale la sombra.', at: 9, end: 72, y: 300, size: 64, mode: 'whisper', accent: {sombra: C.cempa}, scrim: 0.35},
	{text: 'Hay quien, de noche,\ndeja de ser gente.', at: 108, end: 200, y: 1436, size: 46, mode: 'soft', scrim: 0.4},
	{text: 'Don Fermín pasa cada noche,\nsiempre a la misma hora.', at: 210, end: 324, y: 284, size: 54, mode: 'soft'},
	{text: 'Él no voltea.', at: 342, end: 471, y: 280, size: 56, mode: 'soft'},
	{text: 'Su sombra, sí.', at: 390, end: 471, y: 354, size: 56, mode: 'soft', accent: {sí: C.cempa}, scrim: 0},
	{text: 'Da tres vueltas…', at: 492, end: 588, y: 296, size: 58, mode: 'soft'},
	{text: '…y ya no es don Fermín.', at: 600, end: 678, y: 296, size: 58, mode: 'soft'},
	{text: 'Si su sombra crece…', at: 810, end: 912, y: 1400, size: 62, mode: 'soft', scrim: 0.4},
	{text: '…es que viene por ti.', at: 842, end: 912, y: 1479, size: 62, mode: 'soft', accent: {por: C.cempa, ti: C.cempa}, scrim: 0},
	{text: 'De día es tu vecino.', at: 1050, end: 1140, y: 280, size: 56, mode: 'soft'},
	{text: 'De noche, quién sabe.', at: 1078, end: 1140, y: 352, size: 56, mode: 'soft', scrim: 0},
];

export const Ep07: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	return (
		<Scene paint={(g, ff, t) => paintFrame(g, ff, t)} bg={C.ink}>
			{TEXTS.map(({end, ...p}, i) => (
				<Line key={i} {...p} f={f} out={end - OUTK} />
			))}
			{/* título: lo ilumina el mismo foco que parpadea */}
			<Line text="EL NAHUAL" f={f} at={87} out={192 - OUTK} y={264} size={112} font="Rye" color={C.flama} glow={C.cempa} mode="flicker" beam={bulbI(f)} tracking={0.06} lineHeight={1.0} scrim={0} />
			{f >= 1146 ? <LeyendaLockup f={f} at={1146} dias={dias} fecha={fecha} top={296} bottom={1140} color={C.flama} /> : null}
		</Scene>
	);
};
