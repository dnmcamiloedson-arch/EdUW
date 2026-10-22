// Textos del día 6 (DOM, encima de la post). Narración en la banda C (bloque arriba en y 1410), título en burn,
// sello ornamental (SVG, no es texto) y lockup del 6 fijado por el dispositivo (top 380 / bottom 1170).
// SIN créditos de altar ni de facultad (decisión del cliente).
import React from 'react';
import {E, clamp} from '../../lib/util';
import {LeyendaLockup, Line, type LineMode} from '../kit/text';
import {EV, LEN, P} from './timeline';

type T = {text: string; at: number; out: number; y: number; size: number; mode?: LineMode; accent?: Record<string, string>};
export const TEXT: T[] = [
	{text: 'Soy el espejo de la casa.', at: 9, out: 56, y: 1410, size: 64},
	{text: 'La madre me colgó frente a la cuna\nla noche que nació la niña.', at: 78, out: 160, y: 1410, size: 52},
	{text: 'Abrió unas tijeras en cruz\ny las puso en la ventana.', at: 180, out: 256, y: 1410, size: 56},
	{text: 'Cuentan que, al caer la noche,\ndejan sus piernas junto al fogón…', at: 273, out: 346, y: 1410, size: 54},
	{text: 'Vuelan sobre los techos\nbuscando recién nacidos.', at: 440, out: 500, y: 1410, size: 56, mode: 'whisper'},
	{text: 'Pero ninguna soporta\nver su propio reflejo.', at: 519, out: 584, y: 1410, size: 58, accent: {reflejo: P.gold}},
	{text: 'Yo no puedo cerrar los ojos.', at: 602, out: 640, y: 1410, size: 60},
	{text: 'Ella también está contando.', at: 1192, out: 1232, y: 1240, size: 56},
];

// título: LAS / BRUJAS / DE FUEGO (Rye, burn), bloque arriba en y 1090
export const TITLE = {at: 363, out: 420, y: 1090};
const TL = [
	{text: 'LAS', size: 64, color: P.bone, tracking: 0.3},
	{text: 'BRUJAS', size: 128, color: P.gold, tracking: 0.04},
	{text: 'DE FUEGO', size: 96, color: P.gold, tracking: 0.04},
];

// sello: dos filetes dorados de 70 px alrededor de una roseta de cempasúchil de ocho pétalos (se abre desde el centro)
const Seal: React.FC<{f: number; at: number; out: number; y: number}> = ({f, at, out, y}) => {
	const k = E.out(clamp((f - at) / 12));
	const o = 1 - E.in(clamp((f - out) / 16));
	if (k <= 0 || o <= 0) return null;
	const petals = Array.from({length: 8}, (_, i) => {
		const a = (i / 8) * Math.PI * 2;
		return <ellipse key={i} cx={100 + Math.cos(a) * 3.6} cy={13 + Math.sin(a) * 3.6} rx={3.4} ry={1.8} transform={`rotate(${(a * 180) / Math.PI} ${100 + Math.cos(a) * 3.6} ${13 + Math.sin(a) * 3.6})`} fill={P.cempa} />;
	});
	return (
		<svg width={200} height={26} viewBox="0 0 200 26" style={{position: 'absolute', left: 440, top: y - 13, opacity: o, transform: `scaleX(${k})`, transformOrigin: '50% 50%', overflow: 'visible'}}>
			<line x1={4} y1={13} x2={74} y2={13} stroke={P.gold} strokeWidth={1.5} strokeOpacity={0.7} />
			<line x1={126} y1={13} x2={196} y2={13} stroke={P.gold} strokeWidth={1.5} strokeOpacity={0.7} />
			{petals}
			<circle cx={100} cy={13} r={2.4} fill={P.gold} />
		</svg>
	);
};

export const Texts06: React.FC<{f: number; dias: number; fecha: string}> = ({f, dias, fecha}) => {
	let y = TITLE.y;
	const title = TL.map((l, i) => {
		const top = y;
		y += l.size * 1.05;
		return <Line key={'t' + i} text={l.text} f={f} at={TITLE.at + i * 3} out={TITLE.out} y={top} size={l.size} font="Rye" color={l.color} mode="burn" glow={P.cempa} lineHeight={1.05} tracking={l.tracking} scrim={0} maxWidth={940} />;
	});
	const dip = 1 - clamp((f - EV.endDip) / 8);
	return (
		<>
			{TEXT.map((x, i) => (
				<Line key={i} text={x.text} f={f} at={x.at} out={x.out} y={x.y} size={x.size} font="Alike" color={P.bone} mode={x.mode ?? 'soft'} accent={x.accent} scrim={0.4} maxWidth={860} />
			))}
			{title}
			<Seal f={f} at={TITLE.at + 6} out={TITLE.out} y={y + 26} />
			{f >= EV.lockup - 2 ? (
				<div style={{position: 'absolute', inset: 0, opacity: dip}}>
					<LeyendaLockup f={f} at={EV.lockup} dias={dias} fecha={fecha} top={380} bottom={1170} />
				</div>
			) : null}
			{void LEN}
		</>
	);
};
