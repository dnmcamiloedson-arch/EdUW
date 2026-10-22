// Textos del día 5 (DOM, encima de la post). Banda propia: A (cielo, y 380–680) y C (1120–1360).
// SIN créditos de altar ni de facultad (regla del cliente). Ningún texto dentro de una ventana de parpadeo.
import React from 'react';
import {E, clamp} from '../../lib/util';
import {LeyendaLockup, Line, type LineMode} from '../kit/text';
import {EV, P} from './timeline';

type T = {text: string; at: number; out: number; y: number; size: number; font?: 'Alike' | 'Rye'; color?: string; glow?: string; mode?: LineMode; accent?: Record<string, string>; scrim?: number; tracking?: number; maxWidth?: number};

export const TEXT: T[] = [
	{text: 'Si oyes cascos a tu espalda,', at: 12, out: 70, y: 400, size: 58},
	{text: 'NO VOLTEES.', at: 39, out: 70, y: 480, size: 96, font: 'Rye', color: P.gold, glow: P.cempa, mode: 'flicker', scrim: 0, tracking: 0.04},
	{text: 'Eso dicen los arrieros.', at: 88, out: 144, y: 410, size: 56},
	{text: 'Lo tenías detrás.', at: 303, out: 352, y: 400, size: 60},
	{text: 'Ahora te espera enfrente.', at: 316, out: 352, y: 480, size: 60},
	{text: 'NO PARPADEES.', at: 377, out: 403, y: 420, size: 88, font: 'Rye', color: P.gold, glow: P.cempa, mode: 'slam', scrim: 0, tracking: 0.04},
	{text: '—¿Tan solito, compadre?', at: 672, out: 742, y: 1180, size: 54, font: 'Rye', color: P.bone, glow: P.moonRim, scrim: 0, maxWidth: 860},
	{text: '—Súbase… o llévese esto.', at: 699, out: 742, y: 1260, size: 54, font: 'Rye', color: P.bone, glow: P.moonRim, scrim: 0, maxWidth: 860},
	{text: 'No recojas su oro.', at: 792, out: 834, y: 380, size: 64, mode: 'whisper'},
	{text: 'Quien acepta su oro…', at: 927, out: 988, y: 1200, size: 58, scrim: 0.55},
	{text: '…lo paga con el alma.', at: 957, out: 988, y: 1280, size: 58, scrim: 0.55, accent: {alma: P.cempa}},
	{text: 'Yo no les hice caso.', at: 1047, out: 1088, y: 640, size: 64},
	{text: 'Su oro siempre vuelve al camino,', at: 1108, out: 1173, y: 600, size: 56},
	{text: 'esperando al que sigue.', at: 1131, out: 1173, y: 680, size: 56, color: P.sand},
];

// título: EL / CHARRO / NEGRO (Rye, burn), bloque arriba en y 1010, sello debajo
export const TITLE = {at: EV.title[0], out: EV.title[1], y: 1010};
const TL = [
	{text: 'EL', size: 64, color: P.bone, tracking: 0.3},
	{text: 'CHARRO', size: 140, color: P.gold, tracking: 0.04},
	{text: 'NEGRO', size: 116, color: P.gold, tracking: 0.04},
];
export const titleBottom = () => TL.reduce((y, l) => y + l.size * 1.05, TITLE.y);

// sello: dos filetes dorados de 70 px alrededor de una roseta de cempasúchil de ocho pétalos (se abre desde el centro)
const Seal: React.FC<{f: number; at: number; out: number; y: number}> = ({f, at, out, y}) => {
	const k = E.out(clamp((f - at) / 12));
	const o = 1 - E.in(clamp((f - out) / 16));
	if (k <= 0 || o <= 0) return null;
	const petals = Array.from({length: 8}, (_, i) => {
		const a = (i / 8) * Math.PI * 2;
		const px = 100 + Math.cos(a) * 3.6;
		const py = 13 + Math.sin(a) * 3.6;
		return <ellipse key={i} cx={px} cy={py} rx={3.4} ry={1.8} transform={`rotate(${(a * 180) / Math.PI} ${px} ${py})`} fill={P.cempa} />;
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

export const Texts05: React.FC<{f: number; dias: number; fecha: string}> = ({f, dias, fecha}) => {
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
				<Line
					key={i}
					text={x.text}
					f={f}
					at={x.at}
					out={x.out}
					y={x.y}
					size={x.size}
					font={x.font ?? 'Alike'}
					color={x.color ?? P.bone}
					glow={x.glow ?? P.cempa}
					mode={x.mode ?? 'soft'}
					accent={x.accent}
					scrim={x.scrim ?? 0.4}
					tracking={x.tracking ?? 0.01}
					maxWidth={x.maxWidth ?? 940}
				/>
			))}
			{title}
			<Seal f={f} at={TITLE.at + 6} out={TITLE.out} y={y + 26} />
			{f >= EV.lockup - 2 ? (
				<div style={{position: 'absolute', inset: 0, opacity: dip}}>
					<LeyendaLockup f={f} at={EV.lockup} dias={dias} fecha={fecha} />
				</div>
			) : null}
		</>
	);
};
