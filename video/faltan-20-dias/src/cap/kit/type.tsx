import React from 'react';
import {spring} from 'remotion';
import {C, E, FPS, W, clamp, lerp, ramp, rgba} from '../../lib/util';

// ---------- Texto cinético: entra letra por letra (sube, se enfoca, aparece) ----------
export const Kinetic: React.FC<{
	text: string; // usa \n para cortar líneas
	f: number; // frame local
	at: number; // inicio de la entrada
	out?: number; // inicio de la salida (opcional)
	y: number;
	size?: number;
	font?: string;
	color?: string;
	stagger?: number;
	spacing?: string;
	lineHeight?: number;
	glow?: string;
	weight?: number;
	scrim?: number;
}> = ({text, f, at, out, y, size = 46, font = 'Alike', color = C.marfil, stagger = 1.1, spacing = '0.02em', lineHeight = 1.3, glow = C.cempa, weight = 400, scrim = 0}) => {
	const lines = text.split('\n');
	let k = 0;
	const exit = out !== undefined ? ramp(f, [out, out + 14], [0, 1], E.in) : 0;
	const sIn = ramp(f, [at - 4, at + 10], [0, 1], E.out) * (1 - exit);
	const hh = lines.length * size * lineHeight;
	return (
		<>
		{scrim > 0 ? <div style={{position: 'absolute', left: 0, top: y - hh * 0.6, width: W, height: hh * 2.2, opacity: scrim * sIn, background: 'linear-gradient(180deg, transparent, rgba(6,2,1,0.82) 35%, rgba(6,2,1,0.82) 65%, transparent)'}} /> : null}
		<div
			style={{
				position: 'absolute',
				left: 60,
				width: W - 120,
				top: y,
				textAlign: 'center',
				fontFamily: font,
				fontSize: size,
				fontWeight: weight,
				lineHeight,
				letterSpacing: spacing,
				color,
				opacity: 1 - exit,
				filter: exit > 0 ? `blur(${exit * 8}px)` : undefined,
				transform: `translateY(${-exit * 20}px)`,
				textShadow: `0 0 18px ${rgba(glow, 0.45)}, 0 2px 10px rgba(0,0,0,0.85)`,
			}}
		>
			{lines.map((ln, li) => (
				<div key={li}>
					{Array.from(ln).map((ch, ci) => {
						const p = E.out(clamp((f - at - k++ * stagger) / 16));
						return (
							<span
								key={ci}
								style={{
									display: 'inline-block',
									whiteSpace: 'pre',
									opacity: p,
									transform: `translateY(${(1 - p) * 22}px)`,
									filter: p < 1 ? `blur(${(1 - p) * 7}px)` : undefined,
								}}
							>
								{ch}
							</span>
						);
					})}
				</div>
			))}
		</div>
		</>
	);
};

// ---------- Rótulo del número: FALTAN · N · DÍAS · fecha ----------
export const NUM_Y = 860;
export const numSize = (txt: string) => (txt.length > 1 ? 560 : 660);

export const GoldNumber: React.FC<{txt: string; o?: number; blur?: number; glow?: number; scale?: number; style?: React.CSSProperties}> = ({txt, o = 1, blur = 0, glow = 0.8, scale = 1, style}) => (
	<div style={{position: 'absolute', left: 0, width: W, top: NUM_Y - numSize(txt) * 0.5, height: numSize(txt), opacity: o, transform: `scale(${scale})`, transformOrigin: `50% 50%`, ...style}}>
		<div
			style={{
				position: 'absolute',
				inset: 0,
				lineHeight: `${numSize(txt)}px`,
				textAlign: 'center',
				fontFamily: 'Rye',
				fontSize: numSize(txt),
				color: C.cempa,
				filter: 'blur(28px)',
				opacity: glow,
			}}
		>
			{txt}
		</div>
		<div
			style={{
				position: 'absolute',
				inset: 0,
				lineHeight: `${numSize(txt)}px`,
				textAlign: 'center',
				fontFamily: 'Rye',
				fontSize: numSize(txt),
				backgroundImage: `linear-gradient(180deg, #FFF0B8 0%, ${C.flama} 30%, ${C.cempa} 66%, ${C.terracota} 100%)`,
				WebkitBackgroundClip: 'text',
				backgroundClip: 'text',
				color: 'transparent',
				filter: blur ? `blur(${blur}px)` : undefined,
			}}
		>
			{txt}
		</div>
	</div>
);

// Entrada del número sólo (cuando el capítulo no lo construye con su propio medio)
export const NumberRise: React.FC<{f: number; at: number; dias: number}> = ({f, at, dias}) => {
	const p = spring({frame: f - at, fps: FPS, config: {stiffness: 75, damping: 15.2}});
	return <GoldNumber txt={String(dias)} o={clamp(p * 1.4)} blur={(1 - clamp(p)) * 14} scale={lerp(0.86, 1, p)} style={{transform: `translateY(${(1 - p) * 40}px) scale(${lerp(0.86, 1, p)})`}} />;
};

export const Lockup: React.FC<{f: number; at: number; dias: number; fecha: string; top?: number; bottom?: number; tone?: 'light' | 'dark'}> = ({f, at, dias, fecha, top = 400, bottom = 1150, tone = 'light'}) => {
	const dark = tone === 'dark';
	const word = (txt: string, y: number, size: number, start: number, color: string, track: number) => (
		<div style={{position: 'absolute', left: 0, width: W, top: y, textAlign: 'center', fontFamily: 'Rye', fontSize: size, color, letterSpacing: `${track}em`, paddingLeft: `${track}em`}}>
			{Array.from(txt).map((ch, i) => {
				const p = spring({frame: f - start - i * 2.2, fps: FPS, config: {stiffness: 120, damping: 17}});
				return (
					<span
						key={i}
						style={{
							display: 'inline-block',
							opacity: clamp(p * 1.3),
							transform: `translateY(${(1 - p) * 30}px) rotate(${(1 - p) * (i % 2 ? 8 : -8)}deg)`,
							filter: p < 0.98 ? `blur(${(1 - clamp(p)) * 8}px)` : undefined,
							textShadow: dark ? `0 1px 0 ${rgba('#FFF6E6', 0.6)}` : `0 0 20px ${rgba(C.cempa, 0.5)}, 0 2px 8px rgba(0,0,0,0.85)`,
						}}
					>
						{ch}
					</span>
				);
			})}
		</div>
	);
	const pl = E.out(clamp((f - at - 16) / 24));
	const pd = E.out(clamp((f - at - 22) / 20));
	return (
		<>
			{word(dias === 1 ? 'FALTA' : 'FALTAN', top, 66, at - 4, dark ? '#6a3014' : C.arena, 0.26)}
			{word(dias === 1 ? 'DÍA' : 'DÍAS', bottom, 100, at + 2, dark ? '#3a1a0c' : C.marfil, 0.12)}
			<div style={{position: 'absolute', left: 0, width: W, top: bottom + 132, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22}}>
				<div style={{width: 110 * pl, height: 1.5, background: `linear-gradient(90deg, transparent, ${rgba(dark ? '#6a3014' : C.arena, 0.8)})`}} />
				<div style={{fontFamily: 'Alike', fontSize: 42, letterSpacing: '0.18em', color: dark ? '#6a3014' : C.arena, opacity: pd, transform: `translateY(${(1 - pd) * 10}px)`, textShadow: dark ? 'none' : '0 2px 10px rgba(0,0,0,0.9)'}}>{fecha}</div>
				<div style={{width: 110 * pl, height: 1.5, background: `linear-gradient(270deg, transparent, ${rgba(dark ? '#6a3014' : C.arena, 0.8)})`}} />
			</div>
		</>
	);
};
