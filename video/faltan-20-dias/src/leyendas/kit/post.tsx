// Postproducción en WebGL sobre el lienzo de la escena: halo (bloom), aberración cromática, etalonaje,
// viñeta, grano de película, parpadeo, destello y fallas de cámara. Lee el lienzo 2D en el mismo frame.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ThreeCanvas} from '@remotion/three';
import {H, W} from '../../lib/util';
import {makeCanvas} from './paint';

export type PostOpts = {
	exposure?: number;
	contrast?: number;
	saturation?: number;
	shadows?: [number, number, number]; // tinte de sombras (se suma)
	highlights?: [number, number, number]; // tinte de luces
	bloom?: number;
	bloomThr?: number;
	halation?: number; // halo rojizo amplio alrededor de las luces (película)
	ca?: number; // aberración cromática en px en el borde
	vignette?: number;
	grain?: number;
	fade?: number; // 0..1 a negro
	flash?: number; // 0..1 a blanco
	glitch?: number; // 0..1 desplazamiento de líneas (cámara que falla)
	scan?: number; // 0..1 líneas de barrido (video viejo / cámara de seguridad)
	mono?: number; // 0..1 a monocromo verdoso (visión nocturna)
	hatch?: number; // 0..1 achurado de grabado guiado por la luminancia (las líneas viven en las sombras)
	hatchScale?: number; // separación de líneas en px
	hatchAngle?: number; // radianes
	hatchInk?: [number, number, number]; // color de la tinta
};

const VS = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const FS = /* glsl */ `
uniform sampler2D tSrc;
uniform sampler2D tBloom;
uniform sampler2D tWide;
uniform vec2 uRes;
uniform float uTime;
uniform float uExposure, uContrast, uSat, uBloom, uThr, uHal, uCA, uVig, uGrain, uFade, uFlash, uGlitch, uScan, uMono, uHatch, uHatchScale, uHatchAngle;
uniform vec3 uShadows, uHighlights, uInk;
varying vec2 vUv;
float hash(vec2 p) { p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
void main() {
	vec2 uv = vUv;
	// fallas: bandas horizontales desplazadas
	if (uGlitch > 0.0) {
		float band = floor(uv.y * 48.0 + floor(uTime * 24.0) * 7.0);
		float h = hash(vec2(band, floor(uTime * 24.0)));
		if (h > 1.0 - uGlitch * 0.35) uv.x += (hash(vec2(band, 3.1)) - 0.5) * 0.08 * uGlitch;
	}
	vec2 d = uv - 0.5;
	float r2 = dot(d * vec2(uRes.x / uRes.y, 1.0), d * vec2(uRes.x / uRes.y, 1.0));
	vec2 off = d * uCA / uRes.x * (0.4 + r2 * 3.0);
	vec3 c;
	c.r = texture2D(tSrc, uv + off).r;
	c.g = texture2D(tSrc, uv).g;
	c.b = texture2D(tSrc, uv - off).b;
	vec3 b = texture2D(tBloom, uv).rgb;
	vec3 w = texture2D(tWide, uv).rgb;
	c += max(b - uThr, 0.0) * uBloom + max(w - uThr * 0.8, 0.0) * uBloom * 0.6;
	c += max(w - 0.35, 0.0) * vec3(1.0, 0.35, 0.18) * uHal;
	c *= uExposure;
	c = (c - 0.5) * uContrast + 0.5;
	float l = dot(c, vec3(0.299, 0.587, 0.114));
	c += uShadows * pow(1.0 - clamp(l, 0.0, 1.0), 2.0) + uHighlights * pow(clamp(l, 0.0, 1.0), 2.0);
	c = mix(vec3(l), c, uSat);
	if (uMono > 0.0) c = mix(c, vec3(0.55, 1.0, 0.6) * (l * 1.25), uMono);
	if (uHatch > 0.0) {
		vec2 p = vUv * uRes;
		float wob = sin(p.y * 0.031 + p.x * 0.007) * 0.9 + sin(p.x * 0.017) * 0.6;
		float a1 = (p.x * cos(uHatchAngle) + p.y * sin(uHatchAngle) + wob) / uHatchScale;
		float a2 = (p.x * cos(uHatchAngle + 1.15) + p.y * sin(uHatchAngle + 1.15) - wob) / (uHatchScale * 1.1);
		float q1 = abs(fract(a1) - 0.5) * 2.0;
		float q2 = abs(fract(a2) - 0.5) * 2.0;
		float lh = clamp(l, 0.0, 1.0);
		float th1 = clamp((0.62 - lh) * 1.5, 0.0, 1.0) * 0.6;
		float th2 = clamp((0.34 - lh) * 2.2, 0.0, 1.0) * 0.55;
		float ink = (1.0 - smoothstep(th1 - 0.07, th1 + 0.07, q1)) * step(0.001, th1) * 0.6 + (1.0 - smoothstep(th2 - 0.07, th2 + 0.07, q2)) * step(0.001, th2) * 0.6;
		c = mix(c, uInk, clamp(ink, 0.0, 1.0) * uHatch);
	}
	if (uScan > 0.0) c *= 1.0 - uScan * 0.18 * (0.5 + 0.5 * sin(vUv.y * uRes.y * 1.5708));
	float v = smoothstep(1.15, 0.25, length(d * vec2(1.0, 0.82)) * 1.35);
	c *= mix(1.0, v, uVig);
	float g = hash(vUv * uRes + fract(uTime * 13.37) * 311.0) - 0.5;
	c += g * uGrain * (0.35 + 0.65 * (1.0 - abs(l - 0.45) * 1.6));
	c = mix(c, vec3(0.0), uFade);
	c = mix(c, vec3(1.0, 0.97, 0.92), uFlash);
	gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

const Quad: React.FC<{src: HTMLCanvasElement; t: number; o: PostOpts}> = ({src, t, o}) => {
	const bloomC = useMemo(() => makeCanvas(W / 4, H / 4), []);
	const wideC = useMemo(() => makeCanvas(W / 8, H / 8), []);
	const tex = useMemo(() => {
		const mk = (c: HTMLCanvasElement) => {
			const x = new THREE.CanvasTexture(c);
			x.minFilter = THREE.LinearFilter;
			x.magFilter = THREE.LinearFilter;
			x.generateMipmaps = false;
			return x;
		};
		return {src: mk(src), bloom: mk(bloomC), wide: mk(wideC)};
	}, [src, bloomC, wideC]);
	const mat = useMemo(
		() =>
			new THREE.ShaderMaterial({
				vertexShader: VS,
				fragmentShader: FS,
				depthTest: false,
				depthWrite: false,
				uniforms: {
					tSrc: {value: tex.src},
					tBloom: {value: tex.bloom},
					tWide: {value: tex.wide},
					uRes: {value: new THREE.Vector2(W, H)},
					uTime: {value: 0},
					uExposure: {value: 1},
					uContrast: {value: 1},
					uSat: {value: 1},
					uBloom: {value: 0},
					uThr: {value: 0.6},
					uHal: {value: 0},
					uCA: {value: 0},
					uVig: {value: 0},
					uGrain: {value: 0},
					uFade: {value: 0},
					uFlash: {value: 0},
					uGlitch: {value: 0},
					uScan: {value: 0},
					uMono: {value: 0},
					uHatch: {value: 0},
					uHatchScale: {value: 7},
					uHatchAngle: {value: 0.9},
					uInk: {value: new THREE.Vector3(0.03, 0.02, 0.01)},
					uShadows: {value: new THREE.Vector3()},
					uHighlights: {value: new THREE.Vector3()},
				},
			}),
		[tex],
	);
	// halo: copias reducidas y desenfocadas del cuadro (baratas en CPU)
	const bg = bloomC.getContext('2d')!;
	bg.filter = 'blur(3px)';
	bg.clearRect(0, 0, bloomC.width, bloomC.height);
	bg.drawImage(src, 0, 0, bloomC.width, bloomC.height);
	const wg = wideC.getContext('2d')!;
	wg.filter = 'blur(6px)';
	wg.clearRect(0, 0, wideC.width, wideC.height);
	wg.drawImage(bloomC, 0, 0, wideC.width, wideC.height);
	tex.src.needsUpdate = true;
	tex.bloom.needsUpdate = true;
	tex.wide.needsUpdate = true;
	const u = mat.uniforms;
	u.uTime.value = t;
	u.uExposure.value = o.exposure ?? 1;
	u.uContrast.value = o.contrast ?? 1.05;
	u.uSat.value = o.saturation ?? 1;
	u.uBloom.value = o.bloom ?? 0.6;
	u.uThr.value = o.bloomThr ?? 0.68;
	u.uHal.value = o.halation ?? 0.25;
	u.uCA.value = o.ca ?? 1.5;
	u.uVig.value = o.vignette ?? 0.85;
	u.uGrain.value = o.grain ?? 0.07;
	u.uFade.value = o.fade ?? 0;
	u.uFlash.value = o.flash ?? 0;
	u.uGlitch.value = o.glitch ?? 0;
	u.uScan.value = o.scan ?? 0;
	u.uMono.value = o.mono ?? 0;
	u.uHatch.value = o.hatch ?? 0;
	u.uHatchScale.value = o.hatchScale ?? 7;
	u.uHatchAngle.value = o.hatchAngle ?? 0.9;
	(u.uInk.value as THREE.Vector3).set(...(o.hatchInk ?? [0.03, 0.02, 0.01]));
	(u.uShadows.value as THREE.Vector3).set(...(o.shadows ?? [0, 0.012, 0.02]));
	(u.uHighlights.value as THREE.Vector3).set(...(o.highlights ?? [0.03, 0.012, -0.01]));
	return (
		<mesh material={mat} frustumCulled={false}>
			<planeGeometry args={[2, 2]} />
		</mesh>
	);
};

export const Post: React.FC<{src: HTMLCanvasElement; t: number; o?: PostOpts}> = ({src, t, o = {}}) => (
	<ThreeCanvas width={W} height={H} style={{position: 'absolute', inset: 0}} gl={{alpha: false, antialias: false, preserveDrawingBuffer: true}} orthographic camera={{position: [0, 0, 1], near: 0.1, far: 10}}>
		<Quad src={src} t={t} o={o} />
	</ThreeCanvas>
);
