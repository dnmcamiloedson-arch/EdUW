import React from 'react';
import {C, hash, mixRGB, rgba} from '../lib/util';

const col = (c: string, l: number) => rgba(mixRGB(C.ink, c, Math.max(0, Math.min(1.1, l))));

// ---------- Pan de muerto (centrado en 0,0 = base) ----------
export const PanDeMuerto: React.FC<{lit: number; rim?: number; id?: string}> = ({lit, rim = 1, id = 'pan'}) => {
	const crust = col(C.pan, lit);
	const crustD = col(C.terracota, lit * 0.8);
	const crustL = col(C.arena, lit);
	const bone = (d: string, k: string) => (
		<g key={k}>
			<path d={d} stroke={crustD} strokeWidth={40} fill="none" strokeLinecap="round" transform="translate(0 6)" opacity={0.6} />
			<path d={d} stroke={crust} strokeWidth={34} fill="none" strokeLinecap="round" />
			<path d={d} stroke={crustL} strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.45} transform="translate(-4 -8)" />
		</g>
	);
	const knobs = (pts: number[][], k: string) =>
		pts.map(([x, y], i) => (
			<g key={k + i}>
				<circle cx={x} cy={y + 5} r={24} fill={crustD} opacity={0.6} />
				<circle cx={x} cy={y} r={22} fill={crust} />
				<circle cx={x - 6} cy={y - 7} r={8} fill={crustL} opacity={0.5} />
			</g>
		));
	return (
		<g>
			<defs>
				<linearGradient id={id + 'g'} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={col(C.arena, lit * 0.95)} />
					<stop offset="45%" stopColor={col(C.pan, lit)} />
					<stop offset="100%" stopColor={col(C.terracota, lit * 0.55)} />
				</linearGradient>
				<filter id={id + 'b'} x="-30%" y="-30%" width="160%" height="160%">
					<feGaussianBlur stdDeviation={6} />
				</filter>
			</defs>
			<ellipse cx={10} cy={8} rx={330} ry={44} fill="#000" opacity={0.6} filter={`url(#${id}b)`} />
			<path d="M -290 10 C -290 -150 -160 -250 0 -250 C 160 -250 290 -150 290 10 C 200 52 -200 52 -290 10 Z" fill={`url(#${id}g)`} />
			{bone('M -14 -228 C -120 -210 -220 -110 -250 -10', 'b1')}
			{bone('M 14 -228 C 120 -210 220 -110 250 -10', 'b2')}
			{bone('M 0 -232 C 10 -150 6 -60 -6 28', 'b3')}
			{knobs(
				[
					[-120, -186],
					[-205, -98],
					[120, -186],
					[205, -98],
					[4, -130],
					[0, -40],
				],
				'k',
			)}
			<circle cx={0} cy={-250} r={50} fill={crustD} opacity={0.6} transform="translate(0 6)" />
			<circle cx={0} cy={-252} r={46} fill={crust} />
			<circle cx={-14} cy={-268} r={16} fill={crustL} opacity={0.5} />
			{/* azúcar */}
			{Array.from({length: 260}).map((_, i) => {
				const a = hash(i, 5) * Math.PI;
				const rr = Math.sqrt(hash(i, 6));
				const x = -Math.cos(a) * 280 * rr;
				const y = -Math.sin(a) * 250 * rr + 6;
				return <circle key={'s' + i} cx={x} cy={y} r={1.6 + 2.2 * hash(i, 7)} fill={col(C.marfil, lit * 1.05)} opacity={0.85} />;
			})}
			{/* contraluz de la llama en el borde superior */}
			<path d="M -250 -110 C -170 -235 170 -235 250 -110" stroke={C.flama} strokeWidth={10} fill="none" opacity={0.75 * rim} filter={`url(#${id}b)`} style={{mixBlendMode: 'screen'}} />
			<path d="M -30 -296 C -10 -304 10 -304 30 -296" stroke="#FFF2C8" strokeWidth={5} fill="none" opacity={0.9 * rim} />
		</g>
	);
};

// ---------- Vaso de agua (base centrada en 0,0) ----------
export const VasoAgua: React.FC<{lit: number; w?: number; h?: number; flameX?: number; id?: string}> = ({lit, w = 250, h = 520, flameX = 70, id = 'vaso'}) => {
	const tw = w / 2;
	const bw = w * 0.42;
	const waterTop = -h * 0.78;
	const wAt = (y: number) => bw + (tw - bw) * (-y / h);
	return (
		<g>
			<defs>
				<linearGradient id={id + 'w'} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={col('#7a5a3a', lit * 0.45)} stopOpacity={0.55} />
					<stop offset="100%" stopColor={col('#2a1608', lit)} stopOpacity={0.7} />
				</linearGradient>
				<linearGradient id={id + 'refl'} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#FFF4D6" stopOpacity={0} />
					<stop offset="35%" stopColor={C.flama} stopOpacity={0.9} />
					<stop offset="100%" stopColor={C.cempa} stopOpacity={0} />
				</linearGradient>
				<filter id={id + 'b'} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation={5} />
				</filter>
			</defs>
			{/* cáustica en la mesa */}
			<ellipse cx={-30} cy={14} rx={150} ry={26} fill={C.flama} opacity={0.4 * lit} filter={`url(#${id}b)`} style={{mixBlendMode: 'screen'}} />
			<ellipse cx={0} cy={4} rx={bw + 18} ry={16} fill="#000" opacity={0.5} filter={`url(#${id}b)`} />
			{/* agua */}
			<path d={`M ${-wAt(waterTop)} ${waterTop} L ${-bw} -24 Q 0 0 ${bw} -24 L ${wAt(waterTop)} ${waterTop} Z`} fill={`url(#${id}w)`} />
			{/* reflejo refractado de la llama (estirado) */}
			<ellipse cx={-flameX * 0.6} cy={waterTop + 150} rx={20} ry={120} fill={`url(#${id}refl)`} opacity={lit} style={{mixBlendMode: 'screen'}} filter={`url(#${id}b)`} />
			<ellipse cx={-flameX * 0.6} cy={waterTop + 150} rx={6} ry={70} fill="#FFF4D6" opacity={0.7 * lit} style={{mixBlendMode: 'screen'}} />
			{/* menisco */}
			<ellipse cx={0} cy={waterTop} rx={wAt(waterTop)} ry={14} fill={col('#3a2412', lit)} opacity={0.6} />
			<ellipse cx={0} cy={waterTop} rx={wAt(waterTop)} ry={14} fill="none" stroke={col('#FFF2C8', lit)} strokeWidth={2.5} opacity={0.75} />
			{/* vidrio */}
			<path d={`M ${-tw} ${-h} L ${-bw} -10 Q 0 8 ${bw} -10 L ${tw} ${-h}`} fill="none" stroke={col(C.marfil, lit)} strokeWidth={3} opacity={0.55} />
			<ellipse cx={0} cy={-h} rx={tw} ry={16} fill="none" stroke={col('#FFF2C8', lit)} strokeWidth={3} opacity={0.7} />
			<path d={`M ${-bw + 4} -16 Q 0 4 ${bw - 4} -16 L ${bw - 2} -40 Q 0 -22 ${-bw + 2} -40 Z`} fill={col(C.marfil, lit * 0.6)} opacity={0.35} />
			<path d={`M ${-tw * 0.72} ${-h * 0.92} L ${-bw * 0.72} -50`} stroke="#FFF8E6" strokeWidth={12} opacity={0.18 * lit + 0.04} strokeLinecap="round" />
			<path d={`M ${tw * 0.8} ${-h * 0.9} L ${bw * 0.82} -60`} stroke={C.flama} strokeWidth={5} opacity={0.5 * lit} strokeLinecap="round" />
		</g>
	);
};

// ---------- Marco de hojalata vacío (centrado en 0,0) ----------
export const MarcoFoto: React.FC<{lit: number; w?: number; h?: number; id?: string; children?: React.ReactNode}> = ({lit, w = 520, h = 660, id = 'marco', children}) => {
	const x0 = -w / 2;
	const y0 = -h / 2;
	const band = 64;
	const scal = (n: number, len: number, horiz: boolean, fixed: number, sgn: number) =>
		Array.from({length: n}).map((_, i) => {
			const p = -len / 2 + (i + 0.5) * (len / n);
			return horiz ? (
				<circle key={`${horiz}${fixed}${i}`} cx={p} cy={fixed + sgn * 2} r={len / n / 2 + 1} fill={col(C.arena, lit * 0.85)} />
			) : (
				<circle key={`${horiz}${fixed}${i}`} cx={fixed + sgn * 2} cy={p} r={len / n / 2 + 1} fill={col(C.arena, lit * 0.85)} />
			);
		});
	return (
		<g>
			<defs>
				<linearGradient id={id + 'gl'} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor="#fff" stopOpacity={0} />
					<stop offset="42%" stopColor="#fff" stopOpacity={0} />
					<stop offset="50%" stopColor="#FFF2D0" stopOpacity={0.09 * lit + 0.02} />
					<stop offset="60%" stopColor="#fff" stopOpacity={0} />
				</linearGradient>
				<radialGradient id={id + 'in'} cx="50%" cy="35%" r="75%">
					<stop offset="0%" stopColor="#24120a" />
					<stop offset="100%" stopColor="#070302" />
				</radialGradient>
				<filter id={id + 'b'} x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation={8} />
				</filter>
			</defs>
			<rect x={x0 + 14} y={y0 + 22} width={w} height={h} fill="#000" opacity={0.55} filter={`url(#${id}b)`} />
			{/* borde festoneado */}
			{scal(13, w, true, y0, -1)}
			{scal(13, w, true, -y0, 1)}
			{scal(16, h, false, x0, -1)}
			{scal(16, h, false, -x0, 1)}
			<rect x={x0} y={y0} width={w} height={h} fill={col(C.arena, lit * 0.95)} />
			<rect x={x0 + 10} y={y0 + 10} width={w - 20} height={h - 20} fill="none" stroke={col(C.terracota, lit)} strokeWidth={4} strokeDasharray="2 9" strokeLinecap="round" />
			{/* repujado: perlas */}
			{Array.from({length: 22}).map((_, i) => {
				const u = i / 22;
				const per = 2 * (w + h) - 8 * band;
				const d = u * per;
				const iw = w - band;
				const ih = h - band;
				let x = 0;
				let y = 0;
				if (d < iw) [x, y] = [x0 + band / 2 + d, y0 + band / 2];
				else if (d < iw + ih) [x, y] = [-x0 - band / 2, y0 + band / 2 + (d - iw)];
				else if (d < 2 * iw + ih) [x, y] = [-x0 - band / 2 - (d - iw - ih), -y0 - band / 2];
				else [x, y] = [x0 + band / 2, -y0 - band / 2 - (d - 2 * iw - ih)];
				return <circle key={'p' + i} cx={x} cy={y} r={7} fill={col(C.marfil, lit * 1.05)} />;
			})}
			{/* flores pintadas en esquinas */}
			{[
				[x0 + band / 2, y0 + band / 2],
				[-x0 - band / 2, y0 + band / 2],
				[x0 + band / 2, -y0 - band / 2],
				[-x0 - band / 2, -y0 - band / 2],
			].map(([x, y], i) => (
				<g key={'f' + i} transform={`translate(${x} ${y})`}>
					{Array.from({length: 8}).map((_, k) => (
						<ellipse key={k} cx={0} cy={-15} rx={7} ry={14} transform={`rotate(${k * 45})`} fill={col(i % 2 ? C.cempa : C.terracota, lit)} />
					))}
					<circle r={8} fill={col(C.flama, lit)} />
				</g>
			))}
			{/* hojas verdes a media banda */}
			{[
				[0, y0 + band / 2, 0],
				[0, -y0 - band / 2, 0],
				[x0 + band / 2, 0, 90],
				[-x0 - band / 2, 0, 90],
			].map(([x, y, r], i) => (
				<g key={'h' + i} transform={`translate(${x} ${y}) rotate(${r})`}>
					<path d="M -46 0 C -30 -16 -10 -16 0 0 C -10 16 -30 16 -46 0 Z" fill={col(C.verde, lit * 1.1)} />
					<path d="M 46 0 C 30 -16 10 -16 0 0 C 10 16 30 16 46 0 Z" fill={col(C.verde, lit * 1.1)} />
					<circle r={7} fill={col(C.cempa, lit)} />
				</g>
			))}
			{/* copete superior */}
			<g transform={`translate(0 ${y0 - 18})`}>
				{Array.from({length: 9}).map((_, k) => (
					<path key={k} d="M 0 0 L -9 -54 L 9 -54 Z" transform={`rotate(${-64 + k * 16})`} fill={col(C.arena, lit * (k % 2 ? 0.8 : 1))} />
				))}
				<circle r={30} fill={col(C.arena, lit)} />
				<path d="M 0 16 C -24 0 -22 -20 -8 -20 C -2 -20 0 -14 0 -10 C 0 -14 2 -20 8 -20 C 22 -20 24 0 0 16 Z" fill={col(C.terracota, lit)} />
			</g>
			{/* interior vacío con cristal */}
			<rect x={x0 + band} y={y0 + band} width={w - band * 2} height={h - band * 2} fill={`url(#${id}in)`} />
			{children}
			<rect x={x0 + band} y={y0 + band} width={w - band * 2} height={h - band * 2} fill={`url(#${id}gl)`} />
			<rect x={x0 + band} y={y0 + band} width={w - band * 2} height={h - band * 2} fill="none" stroke="#000" strokeOpacity={0.5} strokeWidth={6} />
		</g>
	);
};

// ---------- Cirio (vela alta de cera) — base en 0,0 ----------
export const Cirio: React.FC<{lit: number; h?: number; w?: number}> = ({lit, h = 200, w = 46}) => (
	<g>
		<ellipse cx={4} cy={2} rx={w * 0.9} ry={8} fill="#000" opacity={0.5} />
		<rect x={-w / 2} y={-h} width={w} height={h} rx={4} fill={col(C.marfil, lit)} />
		<rect x={w * 0.1} y={-h} width={w * 0.4} height={h} fill="#000" opacity={0.22} />
		<rect x={-w * 0.36} y={-h + 6} width={w * 0.14} height={h - 12} fill="#fff" opacity={0.12 * lit} />
		<path d={`M ${-w / 2} ${-h + 4} Q ${-w / 2 + 6} ${-h + 34} ${-w / 2 + 10} ${-h + 10} Q ${-w / 2 + 18} ${-h + 50} ${-w / 2 + 22} ${-h + 6}`} fill={col(C.marfil, lit * 1.1)} />
		<ellipse cx={0} cy={-h} rx={w / 2} ry={6} fill={col('#FFF0C8', lit * 1.05)} />
		{/* listón de papel */}
		<rect x={-w / 2} y={-h * 0.45} width={w} height={14} fill={col(C.cempa, lit)} />
		<rect x={-w / 2} y={-h * 0.45 + 16} width={w} height={5} fill={col(C.verde, lit)} />
	</g>
);

// ---------- Veladora pequeña de altar (base en 0,0) ----------
export const MiniVeladora: React.FC<{lit: number; glow: number; w?: number; h?: number; glass?: string}> = ({lit, glow, w = 54, h = 78, glass = C.cempa}) => (
	<g>
		<ellipse cx={3} cy={2} rx={w * 0.7} ry={7} fill="#000" opacity={0.5} />
		<rect x={-w / 2} y={-h} width={w} height={h} rx={5} fill={col(glass, Math.max(lit * 0.55, glow * 0.95))} />
		<rect x={-w / 2} y={-h} width={w} height={h * 0.5} rx={5} fill={C.flama} opacity={0.55 * glow} style={{mixBlendMode: 'screen'}} />
		<rect x={w * 0.12} y={-h} width={w * 0.38} height={h} fill="#000" opacity={0.25} />
		<rect x={-w * 0.36} y={-h + 6} width={w * 0.1} height={h - 14} fill="#fff" opacity={0.15 + 0.2 * glow} />
		<ellipse cx={0} cy={-h} rx={w / 2} ry={6} fill={col('#FFF0C8', Math.max(lit * 0.6, glow))} />
	</g>
);

// ---------- Sahumerio de barro (base en 0,0) ----------
export const Sahumerio: React.FC<{lit: number; ember: number}> = ({lit, ember}) => (
	<g>
		<ellipse cx={4} cy={4} rx={80} ry={14} fill="#000" opacity={0.55} />
		<path d="M -30 0 L -22 -40 L 22 -40 L 30 0 Z" fill={col(C.terracota, lit * 0.8)} />
		<path d="M -70 -60 C -70 -30 -40 -36 0 -36 C 40 -36 70 -30 70 -60 Z" fill={col(C.terracota, lit)} />
		<path d="M -60 -50 L 60 -50" stroke={col(C.arena, lit * 0.8)} strokeWidth={4} strokeDasharray="6 7" />
		<ellipse cx={0} cy={-60} rx={70} ry={14} fill={col('#3a1a0c', lit)} />
		<ellipse cx={0} cy={-62} rx={44} ry={8} fill={C.cempa} opacity={0.85 * ember} />
		<ellipse cx={0} cy={-63} rx={24} ry={4} fill={C.flama} opacity={ember} />
		<path d="M 70 -55 L 140 -78" stroke={col(C.terracota, lit * 0.7)} strokeWidth={14} strokeLinecap="round" />
	</g>
);

// ---------- Ramo de cempasúchil en jarro (base en 0,0) ----------
export const Ramo: React.FC<{lit: number; seed?: number; flip?: boolean}> = ({lit, seed = 1, flip = false}) => {
	const heads = Array.from({length: 13}).map((_, i) => {
		const a = -Math.PI / 2 + (hash(i, seed) - 0.5) * 2.1;
		const r = 90 + 120 * hash(i, seed + 1);
		return [Math.cos(a) * r * 0.75, -150 + Math.sin(a) * r, 26 + 14 * hash(i, seed + 2)] as const;
	});
	return (
		<g transform={flip ? 'scale(-1 1)' : undefined}>
			{heads.map(([x, y], i) => (
				<path key={'t' + i} d={`M 0 -120 Q ${x * 0.3} ${(y - 120) / 2} ${x} ${y}`} stroke={col(C.verde, lit * 0.8)} strokeWidth={5} fill="none" />
			))}
			{heads.map(([x, y], i) => (
				<path key={'l' + i} d={`M ${x * 0.5} ${y * 0.6} c -26 -6 -40 6 -44 18 c 18 4 34 0 44 -18 Z`} fill={col(C.verde, lit * 0.9)} />
			))}
			{heads.map(([x, y, r], i) => (
				<Pompon key={'h' + i} x={x} y={y} r={r} lit={lit * (0.8 + 0.3 * hash(i, seed + 3))} seed={i + seed * 31} />
			))}
			<path d="M -70 -130 C -90 -60 -60 0 -40 0 L 40 0 C 60 0 90 -60 70 -130 Z" fill={col(C.terracota, lit)} />
			<path d="M -78 -132 L 78 -132" stroke={col(C.terracota, lit * 0.8)} strokeWidth={14} strokeLinecap="round" />
			<path d="M -60 -80 L 60 -80" stroke={col(C.arena, lit * 0.8)} strokeWidth={5} strokeDasharray="10 8" />
			<path d="M -50 -60 L 50 -60" stroke={col(C.verde, lit)} strokeWidth={4} />
		</g>
	);
};

// Pompón de cempasúchil (ligero: pocas primitivas)
export const Pompon: React.FC<{x: number; y: number; r: number; lit: number; seed?: number}> = ({x, y, r, lit, seed = 0}) => {
	const n = 9;
	const rot = hash(seed, 3) * 40;
	return (
		<g transform={`translate(${x} ${y}) rotate(${rot})`}>
			<circle r={r} fill={col(C.terracota, lit * 0.9)} />
			{Array.from({length: n}).map((_, i) => (
				<circle key={i} cx={Math.cos((i / n) * 6.283) * r * 0.72} cy={Math.sin((i / n) * 6.283) * r * 0.72} r={r * 0.38} fill={col(i % 2 ? C.cempa : '#f0804a', lit)} />
			))}
			<circle r={r * 0.62} fill={col(C.cempa, lit)} />
			{Array.from({length: 6}).map((_, i) => (
				<circle key={'i' + i} cx={Math.cos((i / 6) * 6.283 + 0.4) * r * 0.36} cy={Math.sin((i / 6) * 6.283 + 0.4) * r * 0.36} r={r * 0.22} fill={col(C.flama, lit)} />
			))}
			<circle r={r * 0.2} fill={col('#f7a94a', lit)} />
			<circle cx={-r * 0.3} cy={-r * 0.35} r={r * 0.22} fill="#FFF4D6" opacity={0.18 * lit} />
		</g>
	);
};
