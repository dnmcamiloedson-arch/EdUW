// Recap de los altares de Westhill: portada «Así se vivió…», luego los clips de cada altar; al entrar cada uno, una
// cortina de cempasúchil deja el nombre de la carrera (el PNG con el diseño de su leyenda) y el nombre de la leyenda.
// Cierra con el primer lugar (Derecho), la foto del grupo y un agradecimiento a los alumnos.
// Los clips y la música viven en public/recap/ y se describen en recap.json (ver scripts/render_recap.sh).
import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {E, H, W, clamp, hash, lerp} from '../lib/util';

export type RecapClip = {file: string; start?: number; dur: number; carrera: string; leyenda: string};
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
			{line('Así se vivió', 6, 560, 84, '#efe3c8', 'Alike')}
			{line('el Concurso', 18, 660, 112, '#F5C242', 'Rye')}
			{line('de Ofrendas', 28, 790, 112, '#F5C242', 'Rye')}
			{line('en Westhill', 38, 930, 90, '#F26D3D', 'Rye')}
			{line('Siete altares · siete leyendas · 28 · 10', 50, 1080, 44, '#E0BB8F', 'Alike')}
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
			<div style={{position: 'absolute', top: 1130, width: W, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: k, transform: `translateY(${(1 - inU) * 40}px) scale(${lerp(0.94, 1, inU)})`}}>
				<div style={{fontFamily: 'Rye', fontSize: c.carrera.length > 22 ? 58 : 84, lineHeight: 1.12, maxWidth: 960, textAlign: 'center', color: '#F5C242', textShadow: '0 4px 22px rgba(0,0,0,0.9)', letterSpacing: '0.03em', whiteSpace: 'pre-line'}}>{c.carrera}</div>
				<div style={{width: lerp(0, 360, inU), height: 3, background: '#F26D3D', margin: '18px 0 14px'}} />
				<div style={{fontFamily: 'Alike', fontSize: 52, color: '#efe3c8', textShadow: '0 3px 18px rgba(0,0,0,0.9)', letterSpacing: '0.04em'}}>{c.leyenda}</div>
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
			{c.carrera ? <Rotulo c={c} /> : null}
		</AbsoluteFill>
	);
};

// cierre: anuncio del primer lugar, toma del grupo ganador, foto grupal y agradecimiento
const ANUNCIO = 75;
const GANA = 165;
const FOTO = 150;
const GRACIAS = 240;
const FINAL = ANUNCIO + GANA + FOTO + GRACIAS - 3 * XF;

const fade = (f: number, len: number) => E.inOut(clamp(f / XF)) * (1 - E.inOut(clamp((f - (len - XF)) / XF)));

const Texto: React.FC<{f: number; at: number; y: number; size: number; color: string; font?: string; children: React.ReactNode}> = ({f, at, y, size, color, font = 'Alike', children}) => {
	const u = E.out(clamp((f - at) / 14));
	return (
		<div style={{position: 'absolute', top: y, width: W, textAlign: 'center', fontFamily: font, fontSize: size, lineHeight: 1.18, color, opacity: u, transform: `translateY(${(1 - u) * 30}px)`, textShadow: '0 4px 24px rgba(0,0,0,0.85)', letterSpacing: font === 'Rye' ? '0.03em' : '0.01em', whiteSpace: 'pre-line'}}>
			{children}
		</div>
	);
};

// lluvia continua de pétalos de cempasúchil
const Lluvia: React.FC<{f: number; n?: number}> = ({f, n = 46}) => (
	<AbsoluteFill style={{pointerEvents: 'none'}}>
		{Array.from({length: n}, (_, i) => {
			const sp = 4 + hash(i, 5) * 5;
			const y = ((hash(i, 2) * (H + 300) + f * sp) % (H + 300)) - 150;
			const x = hash(i, 1) * W + Math.sin(f * 0.05 + i) * 30;
			const s = 16 + hash(i, 3) * 26;
			return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s * 0.6, borderRadius: '50%', background: ['#F26D3D', '#F5A23A', '#F5C242'][i % 3], transform: `rotate(${hash(i, 4) * 360 + f * 6}deg)`, opacity: 0.9}} />;
		})}
	</AbsoluteFill>
);

const fondo = 'radial-gradient(ellipse at 50% 45%, #3a1a0a 0%, #120a05 70%)';

const Anuncio: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: fondo, opacity: fade(f, ANUNCIO)}}>
			<Texto f={f} at={4} y={780} size={66} color="#efe3c8">Y el primer lugar</Texto>
			<Texto f={f} at={18} y={870} size={66} color="#efe3c8">es para…</Texto>
		</AbsoluteFill>
	);
};

const Gana: React.FC = () => {
	const f = useCurrentFrame();
	const pop = f < 8 ? lerp(2.2, 0.94, E.out(f / 8)) : f < 14 ? lerp(0.94, 1, (f - 8) / 6) : 1;
	return (
		<AbsoluteFill style={{opacity: fade(f, GANA)}}>
			<AbsoluteFill style={{transform: `scale(${lerp(1, 1.06, f / GANA)})`}}>
				<OffthreadVideo src={staticFile('recap/altar_2007.mp4')} muted style={{width: W, height: H, objectFit: 'cover'}} />
			</AbsoluteFill>
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(18,10,5,0) 45%, rgba(18,10,5,0.78) 62%, rgba(18,10,5,0.78) 88%, rgba(18,10,5,0) 100%)'}} />
			<div style={{position: 'absolute', top: 1090, width: W, textAlign: 'center', fontFamily: 'Rye', fontSize: 130, color: '#F5C242', transform: `scale(${pop})`, opacity: clamp(f / 3), textShadow: '0 0 40px rgba(245,176,74,0.7), 0 4px 22px rgba(0,0,0,0.9)', WebkitTextStroke: '3px #231305'}}>1er lugar</div>
			<Texto f={f} at={14} y={1260} size={58} color="#efe3c8" font="Rye">{'Derecho y Relaciones\nInternacionales'}</Texto>
			<Texto f={f} at={26} y={1420} size={52} color="#F26D3D">La Llorona</Texto>
			<Lluvia f={f} />
		</AbsoluteFill>
	);
};

const Foto: React.FC = () => {
	const f = useCurrentFrame();
	const z = lerp(1, 1.08, f / FOTO);
	return (
		<AbsoluteFill style={{opacity: fade(f, FOTO), background: '#120a05'}}>
			<Img src={staticFile('recap/ganador.jpg')} style={{position: 'absolute', width: W, height: H, objectFit: 'cover', filter: 'blur(40px) brightness(0.45)', transform: 'scale(1.2)'}} />
			<div style={{position: 'absolute', top: 560, left: 0, width: W, height: 608, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.7)', borderTop: '4px solid #F5C242', borderBottom: '4px solid #F5C242'}}>
				<Img src={staticFile('recap/ganador.jpg')} style={{width: W, height: 608, objectFit: 'cover', transform: `scale(${z})`}} />
			</div>
			<Texto f={f} at={10} y={1260} size={84} color="#F5C242" font="Rye">¡Felicidades,</Texto>
			<Texto f={f} at={22} y={1365} size={84} color="#F5C242" font="Rye">Derecho!</Texto>
			<Lluvia f={f + 200} n={30} />
		</AbsoluteFill>
	);
};

const Gracias: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: fondo, opacity: fade(f, GRACIAS)}}>
			<Lluvia f={f + 400} n={22} />
			<Texto f={f} at={6} y={470} size={170} color="#F5C242" font="Rye">¡Gracias!</Texto>
			<Texto f={f} at={30} y={760} size={54} color="#efe3c8">{'A todos los alumnos que ayudaron\na que esto fuera posible.'}</Texto>
			<Texto f={f} at={60} y={940} size={54} color="#efe3c8">{'Gracias por su arduo trabajo\ny dedicación.'}</Texto>
			<Texto f={f} at={100} y={1170} size={56} color="#E0BB8F">Con mucho cariño,</Texto>
			<Texto f={f} at={114} y={1250} size={76} color="#F26D3D" font="Rye">Universidad</Texto>
			<Texto f={f} at={124} y={1340} size={110} color="#F26D3D" font="Rye">Westhill</Texto>
		</AbsoluteFill>
	);
};

const Final: React.FC = () => (
	<AbsoluteFill>
		<Sequence durationInFrames={ANUNCIO}><Anuncio /></Sequence>
		<Sequence from={ANUNCIO - XF} durationInFrames={GANA}><Gana /></Sequence>
		<Sequence from={ANUNCIO + GANA - 2 * XF} durationInFrames={FOTO}><Foto /></Sequence>
		<Sequence from={ANUNCIO + GANA + FOTO - 3 * XF} durationInFrames={GRACIAS}><Gracias /></Sequence>
	</AbsoluteFill>
);

// banderín de la universidad en la esquina mientras corren las tomas (desaparece al llegar el agradecimiento)
const Banderin: React.FC<{len: number}> = ({len}) => {
	const f = useCurrentFrame();
	return <Img src={staticFile('brand/banderin-naranja.png')} style={{position: 'absolute', top: 250, right: 56, width: 170, opacity: fade(f, len) * 0.95, filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.5))'}} />;
};

const clipsEnd = (p: RecapProps) => (p.intro ?? 105) + p.clips.reduce((s, c) => s + Math.round(c.dur * FPS) - XF, 0) + XF;
export const recapLength = (p: RecapProps) => clipsEnd(p) - XF + FINAL;

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
			<Sequence from={clipsEnd(p) - XF} durationInFrames={FINAL}>
				<Final />
			</Sequence>
			<Sequence from={intro - XF} durationInFrames={clipsEnd(p) - intro + ANUNCIO + GANA + FOTO - 3 * XF}>
				<Banderin len={clipsEnd(p) - intro + ANUNCIO + GANA + FOTO - 3 * XF} />
			</Sequence>
			{p.musica ? <Audio src={staticFile(p.musica)} /> : null}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 65% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none'}} />
		</AbsoluteFill>
	);
};
