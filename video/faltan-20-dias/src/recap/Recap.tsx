// Recap de los altares de Westhill: portada «Así se vivió…», luego los clips de cada altar; al entrar cada uno, una
// cortina de cempasúchil deja el nombre de la carrera (el PNG con el diseño de su leyenda) y el nombre de la leyenda.
// Los clips y la música viven en public/recap/ y se describen en recap.json (ver scripts/render_recap.sh).
import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {E, H, W, clamp, hash, lerp} from '../lib/util';

export type RecapClip = {file: string; start?: number; dur: number; carrera: string; leyenda: string; png: string};
export type RecapProps = {clips: RecapClip[]; musica?: string; intro?: number};

const FPS = 30;
const CARD = 54; // cuadros que dura el rótulo de cada altar
const XF = 10; // cruce entre clips

// portada
const Portada: React.FC<{len: number}> = ({len}) => {
	const f = useCurrentFrame();
	const a = E.out(clamp(f / 14));
	const out = 1 - E.inOut(clamp((f - (len - 12)) / 12));
	const line = (txt: string, at: number, y: number, size: number, color: string, font: string) => {
		const u = E.out(clamp((f - at) / 14));
		return (
			<div style={{position: 'absolute', top: y, width: W, textAlign: 'center', fontFamily: font, fontSize: size, color, opacity: u, transform: `translateY(${(1 - u) * 30}px)`, textShadow: '0 4px 24px rgba(0,0,0,0.8)', letterSpacing: font === 'Rye' ? '0.03em' : 0}}>
				{txt}
			</div>
		);
	};
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #3a1a0a 0%, #120a05 70%)', opacity: a * out}}>
			{line('Así se vivió', 6, 620, 84, '#efe3c8', 'Alike')}
			{line('Día de Muertos', 18, 730, 120, '#F5C242', 'Rye')}
			{line('en Westhill', 30, 880, 96, '#F26D3D', 'Rye')}
			{line('Siete altares · siete leyendas · 28 · 10', 46, 1040, 46, '#E0BB8F', 'Alike')}
		</AbsoluteFill>
	);
};

// cortina de pétalos que barre de abajo hacia arriba al entrar el rótulo
const Petalos: React.FC<{f: number}> = ({f}) => {
	const u = clamp(f / 22);
	if (u >= 1) return null;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{Array.from({length: 70}, (_, i) => {
				const x = hash(i, 1) * W;
				const y = lerp(H + 100, -200, E.inOut(clamp(u * 1.4 - hash(i, 2) * 0.4)));
				const s = 18 + hash(i, 3) * 30;
				return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s * 0.6, borderRadius: '50%', background: ['#F26D3D', '#F5A23A', '#F5C242'][i % 3], transform: `rotate(${hash(i, 4) * 360 + f * 12}deg)`, opacity: 0.95}} />;
			})}
		</AbsoluteFill>
	);
};

const Rotulo: React.FC<{c: RecapClip}> = ({c}) => {
	const f = useCurrentFrame();
	if (f > CARD) return null;
	const inU = E.out(clamp((f - 6) / 12));
	const outU = 1 - E.inOut(clamp((f - (CARD - 12)) / 12));
	const k = inU * outU;
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{background: `linear-gradient(180deg, rgba(18,10,5,0) 35%, rgba(18,10,5,${0.75 * k}) 60%, rgba(18,10,5,${0.75 * k}) 85%, rgba(18,10,5,0) 100%)`}} />
			<div style={{position: 'absolute', top: 1180, width: W, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: k, transform: `translateY(${(1 - inU) * 40}px) scale(${lerp(0.94, 1, inU)})`}}>
				<Img src={staticFile(c.png)} style={{maxWidth: 940, maxHeight: 300, objectFit: 'contain'}} />
				<div style={{fontFamily: 'Alike', fontSize: 50, color: '#efe3c8', marginTop: 10, textShadow: '0 3px 18px rgba(0,0,0,0.9)', letterSpacing: '0.04em'}}>{c.leyenda}</div>
			</div>
			<Petalos f={f} />
		</AbsoluteFill>
	);
};

const Clip: React.FC<{c: RecapClip; len: number}> = ({c, len}) => {
	const f = useCurrentFrame();
	const a = E.inOut(clamp(f / XF)) * (1 - E.inOut(clamp((f - (len - XF)) / XF)));
	// leve acercamiento continuo para dar vida a cada toma
	const z = lerp(1.0, 1.06, f / len);
	return (
		<AbsoluteFill style={{opacity: a}}>
			<AbsoluteFill style={{transform: `scale(${z})`}}>
				<OffthreadVideo src={staticFile(c.file)} startFrom={Math.round((c.start ?? 0) * FPS)} muted style={{width: W, height: H, objectFit: 'cover'}} />
			</AbsoluteFill>
			<Rotulo c={c} />
		</AbsoluteFill>
	);
};

export const recapLength = (p: RecapProps) => (p.intro ?? 105) + p.clips.reduce((s, c) => s + Math.round(c.dur * FPS) - XF, 0) + XF;

export const Recap: React.FC<RecapProps> = (p) => {
	const intro = p.intro ?? 105;
	let at = intro - XF;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			{p.clips.map((c, i) => {
				const len = Math.round(c.dur * FPS);
				const from = at;
				at += len - XF;
				return (
					<Sequence key={i} from={from} durationInFrames={len}>
						<Clip c={c} len={len} />
					</Sequence>
				);
			})}
			<Sequence durationInFrames={intro}>
				<Portada len={intro} />
			</Sequence>
			{p.musica ? <Audio src={staticFile(p.musica)} /> : null}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 65% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none'}} />
		</AbsoluteFill>
	);
};
