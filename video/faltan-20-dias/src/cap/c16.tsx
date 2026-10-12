import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {C, E, FPS, H, W, clamp, flicker, hash, lerp, mixRGB, ramp, rgba} from '../lib/util';
import {Light, PaperTexture, useCanvasDraw} from '../components/core';
import {Bokeh} from '../components/Particles';
import {Fog, Orb, Ridge, Sky, ridgePath} from './kit/land';
import {Bloom, Hummingbird, Maguey, pyramidPath} from './kit/props';
import {GoldNumber, Kinetic, Lockup} from './kit/type';
import {LightLeak} from './kit/transitions';

// Capítulo 16 · "El sol hecho flor" — la leyenda de Xóchitl y Huitzilin.
// Ella se volvió flor de cempasúchil; él, colibrí, volvió a encontrarla.
export const C16 = {S1: 120, S2: 108, S3: 72, REV: 120, HIT: 50};
export const C16_LEN = C16.S1 + C16.S2 + C16.S3 + C16.REV;

const Amanecer: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const rise = ramp(f, [0, C16.S1], [0, 1], E.inOut);
	const sunY = lerp(1210, 1065, rise);
	const push = lerp(1.0, 1.06, rise);
	const par = (k: number) => ({transform: `translateY(${-rise * 40 * k}px) scale(${1 + (push - 1) * k})`, transformOrigin: '540px 1200px'});
	return (
		<AbsoluteFill>
			<Sky t={t} top="#05030a" mid="#1d0c12" horizon={rgba(mixRGB('#3a160b', C.cempa, 0.25 + 0.35 * rise))} hy={1180} stars={140} starO={1 - rise * 0.8} />
			<Orb x={600} y={sunY} r={82} color={C.flama} halo={6} o={0.4 + 0.6 * rise} />
			<Light x={600} y={sunY} r={1100} color={C.cempa} o={0.35 + 0.3 * rise} />
			<AbsoluteFill style={par(0.3)}>
				<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
					<path d={ridgePath(16, 1190, 60, 0.002)} fill={rgba(mixRGB('#2a120c', C.terracota, 0.35))} />
					<path d={pyramidPath(330, 1172, 330, 150)} fill={rgba(mixRGB('#2a120c', C.terracota, 0.45))} />
					<path d={pyramidPath(330, 1172, 330, 150)} fill="none" stroke={C.flama} strokeWidth={2} opacity={0.35 + 0.4 * rise} />
				</svg>
				<Fog y={1170} color={C.cempa} o={0.3} />
			</AbsoluteFill>
			<AbsoluteFill style={par(0.6)}>
				<Ridge seed={161} y={1360} amp={120} color={rgba(mixRGB('#120806', C.verde, 0.45))} rim={C.flama} rimO={0.25 + 0.35 * rise} />
				<Fog y={1360} color={C.terracota} o={0.18} />
			</AbsoluteFill>
			<AbsoluteFill style={par(1)}>
				<Ridge seed={162} y={1600} amp={70} color="#0a0503" rim={C.cempa} rimO={0.3 * rise} />
				<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
					<Maguey x={150} y={1610} s={1.1} color="#0a0503" />
					<Maguey x={950} y={1640} s={0.8} color="#0a0503" />
				</svg>
			</AbsoluteFill>
			<PaperTexture o={0.22} />
			<Kinetic text={'Dicen que Xóchitl\nse volvió flor…'} f={f} at={14} out={100} y={1430} size={52} />
		</AbsoluteFill>
	);
};

const Flor: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const open = E.inOut(clamp((f - 4) / 86));
	const fl = flicker(t + 9, 16);
	const s = lerp(1.08, 1.0, E.out(clamp(f / C16.S2)));
	return (
		<AbsoluteFill style={{background: '#050201'}}>
			<Light x={260} y={300} r={1300} color={C.cempa} o={0.35} />
			<Bokeh t={t + 4} L={0.9} n={20} seed={161} blur={5} />
			{/* haz de sol diagonal */}
			<div style={{position: 'absolute', left: -300, top: -200, width: 700, height: 2600, transform: 'rotate(-28deg)', background: `linear-gradient(90deg, transparent, ${rgba(C.flama, 0.16 * open)}, transparent)`, mixBlendMode: 'screen', filter: 'blur(20px)'}} />
			<AbsoluteFill style={{transform: `scale(${s})`, transformOrigin: '540px 980px'}}>
				<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
					<path d="M 540 1080 C 530 1300 560 1600 548 2000" stroke={rgba(mixRGB(C.ink, C.verde, 0.9))} strokeWidth={26} fill="none" />
					<path d="M 545 1500 C 420 1440 330 1470 260 1560 C 360 1580 470 1560 545 1500 Z" fill={rgba(mixRGB(C.ink, C.verde, 0.85))} />
					<path d="M 550 1720 C 690 1650 790 1690 850 1780 C 750 1790 640 1780 550 1720 Z" fill={rgba(mixRGB(C.ink, C.verde, 0.75))} />
					<Bloom cx={540} cy={980} R={430} open={open} lit={0.85 + 0.2 * fl} id="c16b" t={t} />
					{/* gota de rocío */}
					<circle cx={720} cy={860} r={13 * open} fill={rgba('#FFF4D6', 0.35)} />
					<circle cx={716} cy={855} r={4 * open} fill="#fff" opacity={0.9} />
				</svg>
			</AbsoluteFill>
			<Light x={720} y={858} r={60} color="#FFF4D6" o={0.5 * open * (0.7 + 0.3 * Math.sin(t * 6))} />
			<PaperTexture o={0.18} />
			<Kinetic text={'para que Huitzilin\npudiera encontrarla.'} f={f} at={10} out={92} y={1430} size={52} />
		</AbsoluteFill>
	);
};

// Rastro de luz del colibrí (partículas doradas)
const Trail: React.FC<{pts: [number, number, number][]; f: number}> = ({pts, f}) => {
	const ref = useCanvasDraw(
		(ctx) => {
			ctx.globalCompositeOperation = 'lighter';
			pts.forEach(([x, y, age], i) => {
				if (age < 0 || age > 1) return;
				const a = (1 - age) ** 1.5;
				for (let k = 0; k < 3; k++) {
					const jx = (hash(i * 3 + k, 5) - 0.5) * 30 * age;
					const jy = (hash(i * 3 + k, 6) - 0.5) * 30 * age + age * 40;
					const r = 2 + 4 * (1 - age);
					const g = ctx.createRadialGradient(x + jx, y + jy, 0, x + jx, y + jy, r * 4);
					g.addColorStop(0, rgba('#FFF6D6', a));
					g.addColorStop(0.3, rgba(C.flama, a * 0.7));
					g.addColorStop(1, rgba(C.cempa, 0));
					ctx.fillStyle = g;
					ctx.fillRect(x + jx - r * 4, y + jy - r * 4, r * 8, r * 8);
				}
			});
		},
		[f],
	);
	return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}} />;
};

const Llegada: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	// el colibrí entra por la derecha y se detiene frente a la flor
	const p = E.out(clamp(f / 40));
	const bx = lerp(1250, 600, p);
	const by = lerp(560, 720, p) + Math.sin(t * 3) * 6;
	const path: [number, number, number][] = [];
	for (let k = 0; k < 40; k++) {
		const ff = f - k * 0.8;
		if (ff < 0) continue;
		const pp = E.out(clamp(ff / 40));
		path.push([lerp(1250, 600, pp) + 70, lerp(560, 720, pp) + Math.sin((ff / FPS) * 3) * 6, k / 40]);
	}
	return (
		<AbsoluteFill style={{background: '#060201'}}>
			<Light x={420} y={1000} r={1000} color={C.cempa} o={0.4} />
			<Bokeh t={t + 7} L={0.8} n={16} seed={162} blur={6} />
			<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
				<Bloom cx={330} cy={1050} R={300} open={1} lit={0.9} id="c16c" t={t + 3} />
			</svg>
			<Trail pts={path} f={f} />
			<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
				<Hummingbird x={bx} y={by} s={1.6} t={t} tilt={lerp(-12, 6, p)} glow={0.6} />
			</svg>
			<PaperTexture o={0.18} />
		</AbsoluteFill>
	);
};

const Revelacion: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const H16 = C16.HIT;
	// vuelo en S que "escribe" el número de izquierda a derecha
	const u = E.inOut(clamp(f / H16));
	const bx = lerp(-160, 1240, u);
	const by = 1060 - Math.sin(u * Math.PI * 2) * 220 - u * 300;
	const reveal = bx + 40;
	const path: [number, number, number][] = [];
	for (let k = 0; k < 46; k++) {
		const ff = f - k * 0.7;
		if (ff < 0 || ff > H16 + 6) continue;
		const uu = E.inOut(clamp(ff / H16));
		path.push([lerp(-160, 1240, uu), 1060 - Math.sin(uu * Math.PI * 2) * 220 - uu * 300, k / 46]);
	}
	const txt = String(dias);
	const settle = E.out(clamp((f - H16) / 30));
	return (
		<AbsoluteFill style={{background: '#050201'}}>
			<Light x={540} y={860} r={1000} color={C.cempa} o={0.32 + 0.12 * settle} />
			<Bokeh t={t + 11} L={0.6} n={16} seed={163} blur={5} />
			<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible', filter: 'blur(8px)', opacity: 0.55}}>
				<Bloom cx={540} cy={1780} R={360} open={1} lit={0.75} id="c16d" t={t} />
			</svg>
			{/* el número se descubre detrás del vuelo */}
			<div style={{position: 'absolute', inset: 0, clipPath: `inset(0 ${Math.max(0, W - reveal)}px 0 0)`}}>
				<GoldNumber txt={txt} glow={0.6 + 0.3 * settle} />
			</div>
			<Trail pts={path} f={f} />
			{f < H16 + 8 ? (
				<svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
					<Hummingbird x={bx} y={by} s={1.25} t={t} tilt={-14 + Math.cos(u * Math.PI * 2) * 18} flip glow={0.7} />
				</svg>
			) : null}
			<Lockup f={f} at={H16 + 4} dias={dias} fecha={fecha} />
			<PaperTexture o={0.16} />
			<AbsoluteFill style={{background: '#000', opacity: ramp(f, [C16.REV - 8, C16.REV - 1], [0, 1], E.inOut)}} />
		</AbsoluteFill>
	);
};

export const Cap16: React.FC<{dias: number; fecha: string}> = ({dias, fecha}) => {
	const f = useCurrentFrame();
	const a = C16.S1;
	const b = a + C16.S2;
	const c = b + C16.S3;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={a}>
				<Amanecer />
			</Sequence>
			<Sequence from={a} durationInFrames={C16.S2}>
				<Flor />
			</Sequence>
			<Sequence from={b} durationInFrames={C16.S3}>
				<Llegada />
			</Sequence>
			<Sequence from={c} durationInFrames={C16.REV}>
				<Revelacion dias={dias} fecha={fecha} />
			</Sequence>
			<LightLeak f={f} at={a} dur={18} />
			<LightLeak f={f} at={c} dur={14} color={C.cempa} />
		</AbsoluteFill>
	);
};
