import React from 'react';
import {spring} from 'remotion';
import {C, FPS, W, clamp, fbm, mixRGB, rgba} from '../lib/util';

export const FW = 190;
export const FH = 250;
const BODY = 218;

const outline = (() => {
	let d = `M 0 0 H ${FW} V ${BODY}`;
	const n = 10;
	const st = FW / n;
	for (let k = 0; k < n; k++) {
		const x0 = FW - k * st;
		d += ` L ${x0 - st / 2} ${FH - 4} L ${x0 - st} ${BODY}`;
	}
	return d + ' Z';
})();

const heart = (cx: number, cy: number, s: number) =>
	`M ${cx} ${cy + s * 0.9} C ${cx - s * 1.25} ${cy + s * 0.1} ${cx - s * 0.95} ${cy - s * 0.85} ${cx} ${cy - s * 0.35} C ${cx + s * 0.95} ${cy - s * 0.85} ${cx + s * 1.25} ${cy + s * 0.1} ${cx} ${cy + s * 0.9} Z`;
const diamond = (cx: number, cy: number, s: number) => `M ${cx} ${cy - s} L ${cx + s * 0.7} ${cy} L ${cx} ${cy + s} L ${cx - s * 0.7} ${cy} Z`;
const skull = 'M 95 62 C 136 62 152 92 150 122 C 149 142 138 150 132 156 L 130 176 C 130 184 122 188 114 188 L 76 188 C 68 188 60 184 60 176 L 58 156 C 52 150 41 142 40 122 C 38 92 54 62 95 62 Z';

// Calados (negro = hueco). Puentes reales: el marco va punteado para que el papel no se desprenda.
const Holes: React.FC<{type: number}> = ({type}) => {
	const common = (
		<>
			{Array.from({length: 9}).map((_, i) => (
				<circle key={'t' + i} cx={19 + i * 19} cy={26} r={3.4} fill="#000" />
			))}
			<rect x={11} y={38} width={FW - 22} height={BODY - 50} rx={3} fill="none" stroke="#000" strokeWidth={3.2} strokeDasharray="15 6" />
			{Array.from({length: 9}).map((_, i) => (
				<path key={'b' + i} d={diamond(19 + i * 19, BODY - 2, 5)} fill="#000" />
			))}
		</>
	);
	let body: React.ReactNode = null;
	if (type === 0) {
		body = (
			<>
				<path d={heart(95, 118, 46)} fill="#000" />
				<path d={heart(95, 118, 26)} fill="#fff" />
				<path d={heart(95, 118, 12)} fill="#000" />
				{[
					[40, 62],
					[150, 62],
					[40, 172],
					[150, 172],
				].map(([x, y], i) => (
					<path key={i} d={diamond(x, y, 12)} fill="#000" />
				))}
				{Array.from({length: 7}).map((_, i) => (
					<circle key={'c' + i} cx={50 + i * 15} cy={186} r={4} fill="#000" />
				))}
			</>
		);
	} else if (type === 1) {
		body = (
			<>
				{Array.from({length: 8}).map((_, i) => (
					<ellipse key={i} cx={95} cy={88} rx={10} ry={24} transform={`rotate(${i * 45} 95 118)`} fill="#000" />
				))}
				<circle cx={95} cy={118} r={7} fill="#000" />
				{Array.from({length: 16}).map((_, i) => (
					<circle key={'r' + i} cx={95 + Math.cos((i / 16) * 6.283) * 66} cy={118 + Math.sin((i / 16) * 6.283) * 66} r={3.6} fill="#000" />
				))}
				<path d="M 30 190 Q 50 170 70 190 Q 50 200 30 190 Z" fill="#000" />
				<path d="M 160 190 Q 140 170 120 190 Q 140 200 160 190 Z" fill="#000" />
			</>
		);
	} else if (type === 2) {
		body = (
			<>
				<path d={skull} fill="none" stroke="#000" strokeWidth={4.5} strokeDasharray="22 5" />
				<ellipse cx={75} cy={118} rx={15} ry={16} fill="#000" />
				<ellipse cx={115} cy={118} rx={15} ry={16} fill="#000" />
				<path d={heart(95, 145, 9)} transform="rotate(180 95 145)" fill="#000" />
				{Array.from({length: 6}).map((_, i) => (
					<rect key={i} x={70 + i * 9} y={165} width={5} height={14} rx={2} fill="#000" />
				))}
				{Array.from({length: 5}).map((_, i) => (
					<circle key={'f' + i} cx={95 + Math.cos(i * 1.2566) * 11} cy={84 + Math.sin(i * 1.2566) * 11} r={4.2} fill="#000" />
				))}
				<circle cx={60} cy={96} r={3} fill="#000" />
				<circle cx={130} cy={96} r={3} fill="#000" />
			</>
		);
	} else {
		const items: React.ReactNode[] = [];
		for (let r = 0; r < 6; r++)
			for (let c = 0; c < 5; c++) {
				const x = 35 + c * 30 + (r % 2 ? 15 : 0);
				if (x > 160) continue;
				items.push(<path key={`${r}-${c}`} d={diamond(x, 60 + r * 25, 10)} fill="#000" />);
			}
		body = <>{items}</>;
	}
	return (
		<>
			{common}
			{body}
		</>
	);
};

export const PapelDefs: React.FC = () => (
	<svg width={0} height={0} style={{position: 'absolute'}}>
		<defs>
			{[0, 1, 2, 3].map((t) => (
				<mask key={t} id={`pp${t}`} maskUnits="userSpaceOnUse" x={0} y={0} width={FW} height={FH}>
					<path d={outline} fill="#fff" />
					<Holes type={t} />
				</mask>
			))}
		</defs>
	</svg>
);

const COLORS = [C.verde, C.cempa, C.flama, C.terracota, C.verde, C.flama, C.cempa];

export type StringCfg = {
	y: number; // altura de amarre
	sag: number;
	count: number;
	spacing: number;
	x0: number;
	scale: number;
	seed: number;
	types?: number[];
	colorOffset?: number;
};

// Una guirnalda: cae con spring críticamente amortiguado, las banderas se despliegan
// en cascada desde el centro y ondean con un frente de viento (ruido, no seno).
export const PapelString: React.FC<{
	cfg: StringCfg;
	frame: number; // frames desde el inicio del despliegue
	t: number;
	light: number;
	lightPos?: [number, number];
	shadow?: boolean;
	gust?: number;
}> = ({cfg, frame, t, light, lightPos = [W / 2, 1300], shadow = false, gust = 1}) => {
	const drop = spring({frame, fps: FPS, config: {stiffness: 70, damping: 19, mass: 1}});
	const dy = (1 - drop) * -620;
	const flags = Array.from({length: cfg.count});
	const mid = (cfg.count - 1) / 2;
	const span = cfg.spacing * (cfg.count - 1);
	const cordY = (x: number) => {
		const u = (x - cfg.x0) / span;
		return cfg.y + dy + cfg.sag * 4 * u * (1 - u) + 6 * fbm('cord' + cfg.seed, t * 0.5, 0, 2) * gust;
	};
	return (
		<div style={{position: 'absolute', inset: 0}}>
			{!shadow ? (
				<svg width={W} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					<path
						d={`M ${cfg.x0 - cfg.spacing} ${cordY(cfg.x0 - cfg.spacing) - 10} ${Array.from({length: 24})
							.map((_, i) => {
								const x = cfg.x0 - cfg.spacing + (i / 23) * (span + cfg.spacing * 2);
								return `L ${x} ${cordY(x)}`;
							})
							.join(' ')}`}
						stroke={rgba(mixRGB(C.ink, C.marfil, 0.25 + 0.5 * light), 0.9)}
						strokeWidth={2.2 * cfg.scale}
						fill="none"
					/>
				</svg>
			) : null}
			{flags.map((_, i) => {
				const x = cfg.x0 + i * cfg.spacing;
				const y = cordY(x);
				const order = Math.abs(i - mid);
				const unfold = spring({frame: frame - 8 - order * 4, fps: FPS, config: {stiffness: 120, damping: 11, mass: 0.8}});
				const ph = t * 0.85 - x * 0.0016;
				const rx = (14 + 10 * gust) * fbm('fx' + cfg.seed, ph, i * 0.31, 3);
				const ry = 10 * fbm('fy' + cfg.seed, ph * 1.3, i * 0.7 + 4, 2) * gust;
				const sk = 5 * fbm('fk' + cfg.seed, ph * 1.1, i * 0.5 + 9, 2) * gust;
				const slope = Math.atan2(cordY(x + 5) - cordY(x - 5), 10) * (180 / Math.PI);
				const type = cfg.types ? cfg.types[i % cfg.types.length] : i % 4;
				const color = COLORS[(i + (cfg.colorOffset ?? 0)) % COLORS.length];
				// luz: más cerca de la llama = más brillo; papel de china translúcido
				const d = Math.hypot(x - lightPos[0], y + 120 - lightPos[1]);
				const lit = clamp(light * (0.32 + 0.9 * Math.exp(-(d * d) / (2 * 760 * 760))) * (0.82 + 0.18 * Math.cos((rx * Math.PI) / 180)), 0, 1.15);
				const fill = shadow ? '#000' : rgba(mixRGB(C.ink, color, lit));
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x - (FW * cfg.scale) / 2,
							top: y - 6 * cfg.scale,
							width: FW * cfg.scale,
							height: FH * cfg.scale,
							transformOrigin: '50% 0%',
							transform: `perspective(900px) rotate(${slope}deg) rotateX(${rx}deg) rotateY(${ry}deg) skewX(${sk}deg) scaleY(${Math.max(0.02, unfold)})`,
							opacity: clamp(unfold * 4),
						}}
					>
						<svg width={FW * cfg.scale} height={FH * cfg.scale} viewBox={`0 0 ${FW} ${FH}`} style={{overflow: 'visible'}}>
							<g mask={`url(#pp${type})`}>
								<rect width={FW} height={FH} fill={fill} />
								{!shadow ? (
									<>
										<rect width={FW} height={14} fill="#000" opacity={0.28} />
										<rect width={FW} height={FH} fill={`url(#ppSheen)`} opacity={0.5} />
									</>
								) : null}
							</g>
						</svg>
					</div>
				);
			})}
		</div>
	);
};

export const PapelSheen: React.FC = () => (
	<svg width={0} height={0} style={{position: 'absolute'}}>
		<defs>
			<linearGradient id="ppSheen" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stopColor="#000" stopOpacity={0.35} />
				<stop offset="55%" stopColor="#fff" stopOpacity={0} />
				<stop offset="100%" stopColor="#FFE6A8" stopOpacity={0.35} />
			</linearGradient>
		</defs>
	</svg>
);
