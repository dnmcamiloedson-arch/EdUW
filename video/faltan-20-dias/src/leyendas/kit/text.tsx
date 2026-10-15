// Tipografía de la serie de leyendas (solo Rye y Alike). Siempre dentro de la zona segura:
// nada de texto en los 250 px de arriba ni en los 340 px de abajo.
import React from 'react';
import {noise2D} from '@remotion/noise';
import {C, E, FPS, H, W, clamp, hash, lerp, rgba} from '../../lib/util';

export const SAFE_TOP = 262;
export const SAFE_BOTTOM = H - 352;

export type LineMode = 'soft' | 'flicker' | 'type' | 'slam' | 'whisper' | 'burn';
export type LineProps = {
	text: string; // \n corta líneas
	f: number;
	at: number;
	out?: number;
	y: number; // borde superior del bloque
	size?: number;
	font?: 'Alike' | 'Rye';
	color?: string;
	mode?: LineMode;
	accent?: Record<string, string>; // palabra → color
	glow?: string;
	lineHeight?: number;
	tracking?: number;
	scrim?: number; // banda oscura detrás para legibilidad
	beam?: number; // 0..1 intensidad de la linterna que lo ilumina (modo flicker)
	align?: 'center' | 'left';
	maxWidth?: number;
};

const blockH = (lines: number, size: number, lh: number) => lines * size * lh;
export const safeY = (y: number, h: number) => Math.max(SAFE_TOP, Math.min(SAFE_BOTTOM - h, y));

export const Line: React.FC<LineProps> = (p) => {
	const {text, f, at, out, size = 62, font = 'Alike', color = C.marfil, mode = 'soft', accent = {}, glow = C.cempa, lineHeight = 1.28, tracking = 0.01, scrim = 0.45, beam = 1, align = 'center', maxWidth = W - 140} = p;
	if (f < at - 20 || (out !== undefined && f > out + 30)) return null;
	const lines = text.split('\n');
	const hh = blockH(lines.length, size, lineHeight);
	const y = safeY(p.y, hh);
	const t = f / FPS;
	const outK = out !== undefined ? clamp((f - out) / (mode === 'slam' ? 8 : 16)) : 0;
	const inK = clamp((f - at) / (mode === 'slam' ? 5 : mode === 'type' ? 1 : 18));
	const vis = E.out(inK) * (1 - E.in(outK));
	if (vis <= 0.001 && mode !== 'type') return null;
	// parpadeo de foco que falla / linterna
	let flick = 1;
	if (mode === 'flicker') {
		const n = noise2D('lnf' + at, t * 9, 0.3);
		flick = beam * (0.82 + 0.18 * n) * (inK < 1 ? (Math.floor(f) % 3 === 0 ? 0.35 : 1) : 1);
	}
	const slamScale = mode === 'slam' ? lerp(1.35, 1, E.out(clamp((f - at) / 7))) : 1;
	const shakeX = mode === 'slam' ? noise2D('lsx' + at, t * 30, 0) * 10 * Math.max(0, 1 - (f - at) / 12) : 0;
	const words = lines.map((ln) => ln.split(/(\s+)/));
	let k = 0;
	const total = Array.from(text.replace(/\n/g, '')).length;
	return (
		<>
			{scrim > 0 ? (
				<div
					style={{
						position: 'absolute',
						left: 0,
						top: y - size * 0.9,
						width: W,
						height: hh + size * 1.8,
						opacity: scrim * vis,
						background: 'linear-gradient(180deg, transparent, rgba(4,2,1,0.8) 30%, rgba(4,2,1,0.8) 70%, transparent)',
					}}
				/>
			) : null}
			<div
				style={{
					position: 'absolute',
					left: (W - maxWidth) / 2,
					width: maxWidth,
					top: y,
					textAlign: align,
					fontFamily: font,
					fontSize: size,
					lineHeight,
					letterSpacing: `${tracking}em`,
					color,
					opacity: (mode === 'type' ? 1 : vis) * flick,
					transform: `translateX(${shakeX}px) scale(${slamScale})`,
					transformOrigin: '50% 50%',
					filter: outK > 0 ? `blur(${outK * 10}px)` : mode === 'whisper' ? 'blur(0.4px)' : undefined,
					textShadow: `0 0 ${mode === 'burn' ? 26 : 16}px ${rgba(glow, mode === 'burn' ? 0.7 : 0.35)}, 0 2px 12px rgba(0,0,0,0.9)`,
				}}
			>
				{words.map((ws, li) => (
					<div key={li} style={{whiteSpace: 'pre'}}>
						{ws.map((w, wi) => {
							const col = accent[w.replace(/[.,;:¡!¿?«»]/g, '')] ?? color;
							return (
								<span key={wi} style={{color: col}}>
									{Array.from(w).map((ch, ci) => {
										const i = k++;
										let o = 1;
										let ty = 0;
										let bl = 0;
										if (mode === 'type') {
											const shown = (f - at) * 0.9;
											o = i < shown ? 1 : 0;
											if (out !== undefined) o *= 1 - E.in(outK);
										} else if (mode === 'soft' || mode === 'burn') {
											const q = E.out(clamp((f - at - i * 0.9) / 14));
											o = q;
											ty = (1 - q) * 18;
											bl = (1 - q) * 6;
										} else if (mode === 'whisper') {
											const q = E.out(clamp((f - at - i * 1.4) / 20));
											o = q * (0.75 + 0.25 * noise2D('lw' + at, i * 0.7, t * 2));
											ty = Math.sin(t * 1.4 + i * 0.6) * 2.2;
											bl = (1 - q) * 9;
										} else if (mode === 'flicker') {
											o = hash(i, at + Math.floor(f / 2)) < clamp((f - at) / 10) * 1.2 ? 1 : 0.15;
										}
										return (
											<span key={ci} style={{display: 'inline-block', opacity: o, transform: ty ? `translateY(${ty}px)` : undefined, filter: bl > 0.05 ? `blur(${bl}px)` : undefined}}>
												{ch}
											</span>
										);
									})}
								</span>
							);
						})}
					</div>
				))}
			</div>
			{void total}
		</>
	);
};

// ---------- Rótulo final de la serie: FALTAN · N · DÍAS · 28 · 10 (el número lo pone cada episodio) ----------
export const LeyendaLockup: React.FC<{f: number; at: number; dias: number; fecha: string; top?: number; bottom?: number; color?: string; dateColor?: string}> = ({f, at, dias, fecha, top = 470, bottom = 1290, color = C.cempa, dateColor = C.arena}) => {
	const t = f / FPS;
	const head = dias === 0 ? 'HOY' : dias === 1 ? 'FALTA' : 'FALTAN';
	const tail = dias === 0 ? '' : dias === 1 ? 'DÍA' : 'DÍAS';
	const word = (txt: string, y: number, size: number, start: number, track: number) => (
		<div style={{position: 'absolute', left: 0, width: W, top: y, textAlign: 'center', fontFamily: 'Rye', fontSize: size, color, letterSpacing: `${track}em`, paddingLeft: `${track}em`}}>
			{Array.from(txt).map((ch, i) => {
				const q = E.out(clamp((f - start - i * 2) / 12));
				const fl = q < 1 ? (hash(i, Math.floor(f / 2) + start) < q ? 1 : 0.25) : 0.92 + 0.08 * noise2D('lkf' + i, t * 3, 0);
				return (
					<span key={i} style={{display: 'inline-block', opacity: q * fl, transform: `translateY(${(1 - q) * 22}px)`, filter: q < 0.98 ? `blur(${(1 - q) * 7}px)` : undefined, textShadow: `0 0 26px ${rgba(color, 0.55)}, 0 3px 12px rgba(0,0,0,0.9)`}}>
						{ch}
					</span>
				);
			})}
		</div>
	);
	const pd = E.out(clamp((f - at - 18) / 18));
	return (
		<>
			{word(head, top, dias === 0 ? 120 : 92, at, 0.22)}
			{tail ? word(tail, bottom, 92, at + 6, 0.16) : null}
			<div style={{position: 'absolute', left: 0, width: W, top: (tail ? bottom : top + 150) + 128, textAlign: 'center', fontFamily: 'Alike', fontSize: 52, letterSpacing: '0.2em', paddingLeft: '0.2em', color: dateColor, opacity: pd, transform: `translateY(${(1 - pd) * 12}px)`, textShadow: '0 2px 12px rgba(0,0,0,0.9)'}}>
				{fecha}
			</div>
		</>
	);
};
