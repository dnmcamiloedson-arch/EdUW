import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {OUTRO_LEN, Outro} from '../scenes/Outro';
import {Grade, Grain, Vignette} from '../components/core';
import {C16_LEN, Cap16} from './c16';
import {C15_LEN, Cap15} from './c15';
import {C14_LEN, Cap14} from './c14';
import {C13_LEN, Cap13} from './c13';
import {C12_LEN, Cap12} from './c12';
import {C11_LEN, Cap11} from './c11';
import {C10_LEN, Cap10} from './c10';
import {C09_LEN, Cap09} from './c09';
// Días 8 → 0: la serie de leyendas (src/leyendas), con su propio motor 2D y postproducción
import {EP08_LEN, Ep08} from '../leyendas/d08_chaneques';
import {EP07_LEN, Ep07} from '../leyendas/d07_nahual';
import {EP06_LEN, Ep06} from '../leyendas/d06_brujas';
import {EP05_LEN, Ep05} from '../leyendas/d05_charro';
import {EP04_LEN, Ep04} from '../leyendas/d04_momias';
import {EP03_LEN, Ep03} from '../leyendas/d03_km31';
import {EP02_LEN, Ep02} from '../leyendas/d02_llorona';
import {EP01_LEN, Ep01} from '../leyendas/d01_altares';
import {EP00_LEN, Ep00} from '../leyendas/d00_hoy';

// Cada día de la cuenta regresiva es un capítulo con escenas, música y revelación propias.
// own: el capítulo trae su propia postproducción (serie de leyendas) → sin etalonaje/grano globales encima.
// outro: false cuando el capítulo cierra con su propio outro (día 0).
type Cap = {len: number; Comp: React.FC<{dias: number; fecha: string}>; own?: boolean; outro?: boolean};
export const CAPS: Record<number, Cap> = {
	16: {len: C16_LEN, Comp: Cap16},
	15: {len: C15_LEN, Comp: Cap15},
	14: {len: C14_LEN, Comp: Cap14},
	13: {len: C13_LEN, Comp: Cap13},
	12: {len: C12_LEN, Comp: Cap12},
	11: {len: C11_LEN, Comp: Cap11},
	10: {len: C10_LEN, Comp: Cap10},
	9: {len: C09_LEN, Comp: Cap09},
	8: {len: EP08_LEN, Comp: Ep08, own: true},
	7: {len: EP07_LEN, Comp: Ep07, own: true},
	6: {len: EP06_LEN, Comp: Ep06, own: true},
	5: {len: EP05_LEN, Comp: Ep05, own: true},
	4: {len: EP04_LEN, Comp: Ep04, own: true},
	3: {len: EP03_LEN, Comp: Ep03, own: true},
	2: {len: EP02_LEN, Comp: Ep02, own: true},
	1: {len: EP01_LEN, Comp: Ep01, own: true},
	0: {len: EP00_LEN, Comp: Ep00, own: true},
};
export type CapProps = {dias: number; fecha: string};
export const capLength = (dias: number) => (CAPS[dias]?.len ?? 300) + (CAPS[dias]?.outro === false ? 0 : OUTRO_LEN);

export const Capitulo: React.FC<CapProps> = ({dias, fecha}) => {
	const cap = CAPS[dias];
	if (!cap) throw new Error(`Capítulo ${dias} aún no existe`);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={cap.len} name={`Capítulo ${dias}`}>
				<cap.Comp dias={dias} fecha={fecha} />
			</Sequence>
			{cap.outro === false ? null : (
				<Sequence from={cap.len} durationInFrames={OUTRO_LEN} name="Outro · logo">
					<Outro />
					{cap.own ? (
						<>
							<Grade />
							<Vignette />
							<Grain />
						</>
					) : null}
				</Sequence>
			)}
			{cap.own ? null : (
				<>
					<Grade />
					<Vignette />
					<Grain />
				</>
			)}
		</AbsoluteFill>
	);
};
