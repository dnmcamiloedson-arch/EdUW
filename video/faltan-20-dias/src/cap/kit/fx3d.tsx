import React, {useMemo} from 'react';
import * as THREE from 'three';
import {hash, mulberry32} from '../../lib/util';

// Efectos 3D con profundidad real: flamas, halos, mar, estrellas, luna, haces de luz y polvo.
// Todo vive dentro de la escena (con prueba de profundidad), así nada "flota" encima de lo que debería taparlo.

export type V3 = [number, number, number];

// Cuaternión para que un plano mire de frente a la cámara
export const faceCam = (pos: V3, cam: V3) => {
	const o = new THREE.Object3D();
	o.position.set(...pos);
	o.lookAt(...cam);
	return o.quaternion.clone();
};

const ADD = {transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation} as const;

const VS_UV = /* glsl */ `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// ---------- Flama (billboard cilíndrico, gota con núcleo blanco y base azul) ----------
const FLAME_FS = /* glsl */ `
uniform float uTime;
uniform float uSeed;
uniform float uGrow;
uniform float uIntensity;
varying vec2 vUv;
float h1(float n) { return fract(sin(n) * 43758.5453123); }
float vn(float x) { float i = floor(x); float f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h1(i), h1(i + 1.0), f); }
void main() {
	float x = vUv.x * 2.0 - 1.0;
	float y = vUv.y;
	float sway = (vn(uTime * 1.3 + uSeed) - 0.5) * 0.5 + (vn(uTime * 6.5 + uSeed * 7.0) - 0.5) * 0.14;
	float hgt = max(0.001, 0.94 * uGrow * (0.86 + 0.18 * vn(uTime * 2.4 + uSeed * 3.0)));
	float yy = y / hgt;
	float xs = x - sway * yy * yy * 0.9;
	float r = yy < 0.24 ? 0.34 * sqrt(max(yy, 0.0) / 0.24) : 0.34 * pow(max(1.0 - (yy - 0.24) / 0.76, 0.0), 0.8);
	float d = abs(xs) / max(r, 1e-4);
	float inside = step(yy, 1.0) * step(0.0, yy);
	float body = (1.0 - smoothstep(0.5, 1.0, d)) * inside;
	float core = (1.0 - smoothstep(0.0, 0.6, d)) * (1.0 - smoothstep(0.1, 0.7, yy)) * inside;
	vec3 outer = mix(vec3(0.98, 0.36, 0.10), vec3(1.0, 0.74, 0.26), clamp(1.0 - yy * 0.9, 0.0, 1.0));
	vec3 col = mix(outer, vec3(1.0, 0.97, 0.88), core);
	float blue = (1.0 - smoothstep(0.0, 0.14, yy)) * (1.0 - smoothstep(0.2, 0.9, d)) * inside;
	col = mix(col, vec3(0.30, 0.42, 0.95), blue * 0.55);
	float a = clamp(body * 0.9 + core * 0.5, 0.0, 1.0);
	gl_FragColor = vec4(col * a * uIntensity, a);
}`;

const GLOW_FS = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uSharp;
varying vec2 vUv;
void main() {
	vec2 p = vUv * 2.0 - 1.0;
	float r = length(p);
	float a = exp(-r * r * uSharp) * (1.0 - smoothstep(0.7, 1.0, r));
	gl_FragColor = vec4(uColor * uIntensity * a, a);
}`;

export const Glow3D: React.FC<{pos: V3; size: number; cam: V3; color?: string; intensity?: number; sharp?: number; fog?: boolean}> = ({pos, size, cam, color = '#ffae55', intensity = 1, sharp = 5, fog = false}) => {
	const mat = useMemo(
		() =>
			new THREE.ShaderMaterial({
				uniforms: {uColor: {value: new THREE.Color()}, uIntensity: {value: 1}, uSharp: {value: 5}},
				vertexShader: VS_UV,
				fragmentShader: GLOW_FS,
				fog,
				...ADD,
			}),
		[fog],
	);
	(mat.uniforms.uColor.value as THREE.Color).set(color);
	mat.uniforms.uIntensity.value = intensity;
	mat.uniforms.uSharp.value = sharp;
	return intensity > 0.001 ? (
		<mesh position={pos} quaternion={faceCam(pos, cam)} material={mat} renderOrder={5}>
			<planeGeometry args={[size, size]} />
		</mesh>
	) : null;
};

export const Flame3D: React.FC<{pos: V3; size: number; t: number; cam: V3; seed?: number; grow?: number; intensity?: number; glow?: number}> = ({pos, size, t, cam, seed = 0, grow = 1, intensity = 1, glow = 1}) => {
	const mat = useMemo(
		() =>
			new THREE.ShaderMaterial({
				uniforms: {uTime: {value: 0}, uSeed: {value: seed}, uGrow: {value: 1}, uIntensity: {value: 1}},
				vertexShader: VS_UV,
				fragmentShader: FLAME_FS,
				...ADD,
			}),
		[seed],
	);
	mat.uniforms.uTime.value = t;
	mat.uniforms.uGrow.value = grow;
	mat.uniforms.uIntensity.value = intensity;
	if (grow <= 0.001) return null;
	const ry = Math.atan2(cam[0] - pos[0], cam[2] - pos[2]);
	return (
		<>
			<group position={pos} rotation={[0, ry, 0]}>
				<mesh position={[0, size * 0.5, 0]} material={mat} renderOrder={6}>
					<planeGeometry args={[size * 0.62, size]} />
				</mesh>
			</group>
			<Glow3D pos={[pos[0], pos[1] + size * 0.4, pos[2]]} size={size * 2.6} cam={cam} intensity={0.32 * glow * grow * intensity} sharp={4.5} />
		</>
	);
};

// ---------- Mar nocturno: olas por normales (sin desplazar vértices), reflejo del cielo y estela de luna ----------
const SEA_VS = /* glsl */ `
varying vec3 vWorld;
void main() {
	vec4 w = modelMatrix * vec4(position, 1.0);
	vWorld = w.xyz;
	gl_Position = projectionMatrix * viewMatrix * w;
}`;
const SEA_FS = /* glsl */ `
uniform float uTime;
uniform float uScale;
uniform float uCalm;
uniform vec3 uMoonDir;
uniform vec3 uDeep;
uniform vec3 uSky;
uniform vec3 uMoonCol;
uniform vec3 uFog;
uniform float uFogFar;
uniform vec3 uWarmPos;
uniform vec3 uWarmCol;
uniform float uWarm;
varying vec3 vWorld;
void main() {
	vec2 p = vWorld.xz / uScale;
	float dist = length(cameraPosition - vWorld) / uScale;
	// olas por octavas: la pendiente crece suave con la frecuencia (destellos chicos, no manchas);
	// lo que la distancia ya no deja ver se suma como rugosidad para que la estela de luna siga siendo continua
	vec2 g = vec2(0.0);
	float lost = 0.0;
	for (int i = 0; i < 11; i++) {
		float fi = float(i);
		float ang = 0.55 + fi * 1.93;
		vec2 dir = vec2(cos(ang), sin(ang));
		float freq = 0.3 * pow(1.75, fi);
		float slope = 0.055 * pow(1.1, fi);
		float sp = sqrt(9.8 * freq) * 0.55;
		float fade = exp(-dist * freq * 0.006);
		float ph = dot(dir, p) * freq + uTime * sp + fi * 1.7;
		g += dir * slope * cos(ph) * fade;
		lost += 0.5 * slope * slope * (1.0 - fade * fade);
	}
	g *= uCalm;
	lost *= uCalm * uCalm;
	vec3 n = normalize(vec3(-g.x, 1.0, -g.y));
	vec3 V = normalize(cameraPosition - vWorld);
	float ndv = max(dot(n, V), 0.0);
	float fres = 0.03 + 0.97 * pow(1.0 - ndv, 5.0);
	vec3 col = mix(uDeep, uSky, fres);
	// lóbulo de Beckmann: angosto y brillante cerca, ancho y suave a lo lejos
	float m2 = 0.0005 + 2.0 * lost;
	vec3 Hm = normalize(uMoonDir + V);
	float hm = max(dot(n, Hm), 1e-3);
	float hm2 = hm * hm;
	float Dm = exp(-(1.0 - hm2) / (hm2 * m2)) / (3.14159 * m2 * hm2 * hm2);
	col += uMoonCol * (Dm * 0.011 + pow(hm, 40.0) * 0.015);
	vec3 L = uWarmPos - vWorld;
	float dl = length(L) / uScale;
	L = normalize(L);
	float hw = max(dot(n, normalize(L + V)), 1e-3);
	float hw2 = hw * hw;
	float mw = m2 + 0.002;
	float Dw = exp(-(1.0 - hw2) / (hw2 * mw)) / (3.14159 * mw * hw2 * hw2);
	col += uWarmCol * uWarm * (Dw * 0.008 + pow(hw, 30.0) * 0.06) / (1.0 + dl * dl * 0.004);
	float fog = clamp(dist * uScale / uFogFar, 0.0, 1.0);
	fog = fog * fog * (3.0 - 2.0 * fog);
	col = mix(col, uFog, fog);
	gl_FragColor = vec4(col, 1.0);
}`;

export const Sea3D: React.FC<{
	y: number;
	t: number;
	size?: number;
	center?: [number, number];
	scale?: number; // unidades de mundo por metro (decímetros = 10)
	calm?: number;
	moonDir: V3;
	deep?: string;
	sky?: string;
	moonCol?: string;
	fog?: string;
	fogFar?: number;
	warmPos?: V3;
	warmCol?: string;
	warm?: number;
}> = ({y, t, size = 80000, center = [0, 0], scale = 1, calm = 0.5, moonDir, deep = '#061019', sky = '#24304a', moonCol = '#f4ecd8', fog = '#1a2238', fogFar = 20000, warmPos = [0, 0, 0], warmCol = '#ffb060', warm = 0}) => {
	const mat = useMemo(
		() =>
			new THREE.ShaderMaterial({
				uniforms: {
					uTime: {value: 0},
					uScale: {value: 1},
					uCalm: {value: 0.5},
					uMoonDir: {value: new THREE.Vector3()},
					uDeep: {value: new THREE.Color()},
					uSky: {value: new THREE.Color()},
					uMoonCol: {value: new THREE.Color()},
					uFog: {value: new THREE.Color()},
					uFogFar: {value: 1},
					uWarmPos: {value: new THREE.Vector3()},
					uWarmCol: {value: new THREE.Color()},
					uWarm: {value: 0},
				},
				vertexShader: SEA_VS,
				fragmentShader: SEA_FS,
			}),
		[],
	);
	const u = mat.uniforms;
	u.uTime.value = t;
	u.uScale.value = scale;
	u.uCalm.value = calm;
	(u.uMoonDir.value as THREE.Vector3).set(...moonDir).normalize();
	// los colores se escriben tal cual (sRGB) porque este shader no pasa por el tonemapping
	(u.uDeep.value as THREE.Color).setStyle(deep, THREE.SRGBColorSpace).convertLinearToSRGB();
	(u.uSky.value as THREE.Color).setStyle(sky, THREE.SRGBColorSpace).convertLinearToSRGB();
	(u.uMoonCol.value as THREE.Color).setStyle(moonCol, THREE.SRGBColorSpace).convertLinearToSRGB();
	(u.uFog.value as THREE.Color).setStyle(fog, THREE.SRGBColorSpace).convertLinearToSRGB();
	u.uFogFar.value = fogFar;
	(u.uWarmPos.value as THREE.Vector3).set(...warmPos);
	(u.uWarmCol.value as THREE.Color).setStyle(warmCol, THREE.SRGBColorSpace).convertLinearToSRGB();
	u.uWarm.value = warm;
	return (
		<mesh position={[center[0], y, center[1]]} rotation={[-Math.PI / 2, 0, 0]} material={mat}>
			<planeGeometry args={[size, size]} />
		</mesh>
	);
};

// ---------- Cúpula de cielo (degradado que sigue al horizonte 3D) ----------
const DOME_VS = /* glsl */ `
varying vec3 vDir;
uniform vec3 uCenter;
void main() {
	vec4 w = modelMatrix * vec4(position, 1.0);
	vDir = normalize(w.xyz - uCenter);
	gl_Position = projectionMatrix * viewMatrix * w;
}`;
const DOME_FS = /* glsl */ `
varying vec3 vDir;
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uGlowDir;
uniform vec3 uGlowCol;
void main() {
	float h = vDir.y;
	vec3 col = mix(uHorizon, uZenith, smoothstep(-0.02, 0.42, h));
	float g = max(dot(vDir, normalize(uGlowDir)), 0.0);
	col += uGlowCol * (pow(g, 24.0) * 0.35 + pow(g, 4.0) * 0.08) * smoothstep(-0.05, 0.1, h);
	gl_FragColor = vec4(col, 1.0);
}`;
export const SkyDome: React.FC<{radius: number; center: V3; zenith: string; horizon: string; glowDir: V3; glowCol?: string}> = ({radius, center, zenith, horizon, glowDir, glowCol = '#5a6a96'}) => {
	const mat = useMemo(
		() =>
			new THREE.ShaderMaterial({
				uniforms: {uCenter: {value: new THREE.Vector3()}, uZenith: {value: new THREE.Color()}, uHorizon: {value: new THREE.Color()}, uGlowDir: {value: new THREE.Vector3()}, uGlowCol: {value: new THREE.Color()}},
				vertexShader: DOME_VS,
				fragmentShader: DOME_FS,
				side: THREE.BackSide,
				depthWrite: false,
			}),
		[],
	);
	const u = mat.uniforms;
	(u.uCenter.value as THREE.Vector3).set(...center);
	(u.uZenith.value as THREE.Color).setStyle(zenith, THREE.SRGBColorSpace).convertLinearToSRGB();
	(u.uHorizon.value as THREE.Color).setStyle(horizon, THREE.SRGBColorSpace).convertLinearToSRGB();
	(u.uGlowDir.value as THREE.Vector3).set(...glowDir);
	(u.uGlowCol.value as THREE.Color).setStyle(glowCol, THREE.SRGBColorSpace).convertLinearToSRGB();
	return (
		<mesh position={center} material={mat} renderOrder={-10} frustumCulled={false}>
			<sphereGeometry args={[radius, 32, 16]} />
		</mesh>
	);
};

// ---------- Estrellas en una cúpula (se mueven con la cámara de verdad) ----------
export const Stars3D: React.FC<{n?: number; radius: number; center?: V3; t: number; seed?: number; minElev?: number; size?: number; opacity?: number}> = ({n = 900, radius, center = [0, 0, 0], t, seed = 7, minElev = 0.02, size = 2.2, opacity = 1}) => {
	const geos = useMemo(() => {
		const r = mulberry32(seed);
		return [0, 1, 2].map((k) => {
			const pos: number[] = [];
			for (let i = 0; i < n / 3; i++) {
				const az = r() * Math.PI * 2;
				const el = Math.asin(minElev + (1 - minElev) * Math.pow(r(), 1.6));
				pos.push(center[0] + Math.cos(el) * Math.cos(az) * radius, center[1] + Math.sin(el) * radius, center[2] + Math.cos(el) * Math.sin(az) * radius);
			}
			const g = new THREE.BufferGeometry();
			g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
			return g;
		});
	}, [n, radius, seed, minElev, center[0], center[1], center[2]]);
	return (
		<>
			{geos.map((g, k) => (
				<points key={k} geometry={g}>
					<pointsMaterial size={size * (0.6 + 0.45 * k)} sizeAttenuation={false} color={k === 2 ? '#ffe2b0' : '#f4f2ff'} transparent opacity={opacity * (0.55 + 0.45 * Math.abs(Math.sin(t * (0.9 + k * 0.7) + k)))} depthWrite={false} fog={false} toneMapped={false} />
				</points>
			))}
		</>
	);
};

// ---------- Luna (disco con mares y cráteres) ----------
let moonTex: THREE.CanvasTexture | null = null;
const getMoonTex = () => {
	if (moonTex) return moonTex;
	const S = 512;
	const cv = document.createElement('canvas');
	cv.width = S;
	cv.height = S;
	const g = cv.getContext('2d')!;
	const R = S * 0.46;
	const gr = g.createRadialGradient(S * 0.42, S * 0.4, R * 0.1, S / 2, S / 2, R);
	gr.addColorStop(0, '#fffaf0');
	gr.addColorStop(0.7, '#efe6d2');
	gr.addColorStop(1, '#cfc4ac');
	g.fillStyle = gr;
	g.beginPath();
	g.arc(S / 2, S / 2, R, 0, Math.PI * 2);
	g.fill();
	g.save();
	g.clip();
	const r = mulberry32(31);
	// mares
	for (let i = 0; i < 9; i++) {
		g.fillStyle = `rgba(150,140,128,${0.18 + 0.15 * r()})`;
		g.beginPath();
		g.ellipse(S * (0.3 + 0.45 * r()), S * (0.3 + 0.4 * r()), R * (0.12 + 0.2 * r()), R * (0.08 + 0.16 * r()), r() * 3, 0, Math.PI * 2);
		g.fill();
	}
	// cráteres
	for (let i = 0; i < 60; i++) {
		const x = S * (0.1 + 0.8 * r());
		const y = S * (0.1 + 0.8 * r());
		const rr = 2 + 10 * r() ** 2;
		g.fillStyle = 'rgba(120,110,100,0.25)';
		g.beginPath();
		g.arc(x, y, rr, 0, Math.PI * 2);
		g.fill();
		g.strokeStyle = 'rgba(255,250,240,0.25)';
		g.lineWidth = 1;
		g.beginPath();
		g.arc(x - 0.6, y - 0.6, rr, Math.PI * 0.9, Math.PI * 1.7);
		g.stroke();
	}
	g.restore();
	moonTex = new THREE.CanvasTexture(cv);
	moonTex.colorSpace = THREE.SRGBColorSpace;
	return moonTex;
};

export const Moon3D: React.FC<{pos: V3; radius: number; cam: V3; halo?: number}> = ({pos, radius, cam, halo = 1}) => (
	<>
		<mesh position={pos} quaternion={faceCam(pos, cam)} renderOrder={1}>
			<planeGeometry args={[radius * 2.17, radius * 2.17]} />
			<meshBasicMaterial map={getMoonTex()} transparent depthWrite={false} fog={false} toneMapped={false} />
		</mesh>
		<Glow3D pos={pos} size={radius * 9} cam={cam} color="#c9d4f0" intensity={0.35 * halo} sharp={3.2} />
		<Glow3D pos={pos} size={radius * 3.2} cam={cam} color="#fff4dc" intensity={0.35 * halo} sharp={4} />
	</>
);

// ---------- Haz de luz volumétrico (plano que gira sobre su eje para mirar a la cámara) ----------
let shaftTex: THREE.CanvasTexture | null = null;
const getShaftTex = (bars: number) => {
	if (shaftTex) return shaftTex;
	const cv = document.createElement('canvas');
	cv.width = 128;
	cv.height = 256;
	const g = cv.getContext('2d')!;
	const img = g.createImageData(128, 256);
	for (let y = 0; y < 256; y++) {
		const along = y / 255; // 0 = ventana (arriba), 1 = piso
		const fall = Math.pow(1 - along, 0.6) * (1 - Math.pow(along, 6));
		for (let x = 0; x < 128; x++) {
			const across = x / 127;
			const edge = Math.sin(Math.PI * across) ** 0.7;
			const bar = 0.55 + 0.45 * Math.cos(across * Math.PI * 2 * bars) ** 2;
			const v = Math.max(0, Math.min(1, fall * edge * bar));
			const i = (y * 128 + x) * 4;
			img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.round(v * 255);
			img.data[i + 3] = 255;
		}
	}
	g.putImageData(img, 0, 0);
	shaftTex = new THREE.CanvasTexture(cv);
	return shaftTex;
};
const SHAFT_FS = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uColor;
uniform float uIntensity;
varying vec2 vUv;
void main() {
	float v = texture2D(uMap, vUv).r;
	gl_FragColor = vec4(uColor * v * uIntensity, v);
}`;
export const LightShaft: React.FC<{from: V3; to: V3; width: number; cam: V3; color?: string; intensity?: number; bars?: number}> = ({from, to, width, cam, color = '#9fb6e6', intensity = 0.25, bars = 3}) => {
	const mat = useMemo(
		() =>
			new THREE.ShaderMaterial({
				uniforms: {uMap: {value: getShaftTex(bars)}, uColor: {value: new THREE.Color()}, uIntensity: {value: 1}},
				vertexShader: VS_UV,
				fragmentShader: SHAFT_FS,
				side: THREE.DoubleSide,
				...ADD,
			}),
		[bars],
	);
	(mat.uniforms.uColor.value as THREE.Color).set(color);
	mat.uniforms.uIntensity.value = intensity;
	const a = new THREE.Vector3(...to).sub(new THREE.Vector3(...from));
	const len = a.length();
	a.normalize();
	const mid = new THREE.Vector3(...from).add(new THREE.Vector3(...to)).multiplyScalar(0.5);
	// base derecha: Y apunta hacia la ventana, Z hacia la cámara (perpendicular al eje), X = Y × Z
	const Y = a.clone().multiplyScalar(-1);
	const v = new THREE.Vector3(...cam).sub(mid);
	const Z = v.sub(Y.clone().multiplyScalar(v.dot(Y))).normalize();
	const X = new THREE.Vector3().crossVectors(Y, Z).normalize();
	const m = new THREE.Matrix4().makeBasis(X, Y, Z);
	const q = new THREE.Quaternion().setFromRotationMatrix(m);
	return (
		<mesh position={mid.toArray() as V3} quaternion={q} material={mat} renderOrder={4}>
			<planeGeometry args={[width, len]} />
		</mesh>
	);
};

// ---------- Polvo suspendido dentro de un haz ----------
export const Dust3D: React.FC<{from: V3; to: V3; radius: number; t: number; n?: number; seed?: number; color?: string; size?: number; opacity?: number}> = ({from, to, radius, t, n = 160, seed = 3, color = '#dfe6ff', size = 2.4, opacity = 0.8}) => {
	const geo = useMemo(() => {
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
		return g;
	}, [n]);
	const A = new THREE.Vector3(...from);
	const B = new THREE.Vector3(...to);
	const ax = B.clone().sub(A);
	const side1 = new THREE.Vector3().crossVectors(ax, new THREE.Vector3(0, 1, 0)).normalize();
	const side2 = new THREE.Vector3().crossVectors(ax, side1).normalize();
	const arr = geo.attributes.position.array as Float32Array;
	for (let i = 0; i < n; i++) {
		const s = (hash(i, seed) + t * 0.012 * (0.5 + hash(i, seed + 1))) % 1;
		const r1 = (hash(i, seed + 2) - 0.5) * 2 * radius + Math.sin(t * 0.7 + i) * radius * 0.15;
		const r2 = (hash(i, seed + 3) - 0.5) * 2 * radius + Math.cos(t * 0.5 + i * 1.3) * radius * 0.15;
		const p = A.clone().addScaledVector(ax, s).addScaledVector(side1, r1).addScaledVector(side2, r2);
		arr[i * 3] = p.x;
		arr[i * 3 + 1] = p.y;
		arr[i * 3 + 2] = p.z;
	}
	geo.attributes.position.needsUpdate = true;
	return (
		<points geometry={geo}>
			<pointsMaterial size={size} sizeAttenuation={false} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
		</points>
	);
};

// ---------- Textura de piedra de cantera / múcar (bloques, juntas y poros) con su mapa de relieve ----------
const stoneCache = new Map<string, {map: THREE.CanvasTexture; bump: THREE.CanvasTexture}>();
export const stoneTex = (key: string, o: {rows?: number; base: string; mortar?: string; vari?: number; seed: number; pores?: number; damp?: number; slab?: boolean}) => {
	const hit = stoneCache.get(key);
	if (hit) return hit;
	const S = 1024;
	const mk = () => {
		const c = document.createElement('canvas');
		c.width = S;
		c.height = S;
		return c;
	};
	const cm = mk();
	const cb = mk();
	const g = cm.getContext('2d')!;
	const b = cb.getContext('2d')!;
	const r = mulberry32(o.seed);
	const rows = o.rows ?? 10;
	const bh = S / rows;
	const base = new THREE.Color(o.base);
	g.fillStyle = o.mortar ?? '#2e2820';
	g.fillRect(0, 0, S, S);
	b.fillStyle = '#303030';
	b.fillRect(0, 0, S, S);
	const vari = o.vari ?? 0.12;
	for (let row = 0; row < rows; row++) {
		let x = -r() * bh * 2;
		while (x < S) {
			const w = bh * (o.slab ? 1.6 + r() * 1.6 : 1.3 + r() * 1.5);
			const gap = o.slab ? 5 : 4;
			const k = 1 + (r() - 0.5) * 2 * vari;
			const c = base.clone().multiplyScalar(k);
			const hsl = {h: 0, s: 0, l: 0};
			c.getHSL(hsl);
			c.setHSL(hsl.h + (r() - 0.5) * 0.02, hsl.s * (0.8 + r() * 0.4), hsl.l);
			const y0 = row * bh;
			// bloque con esquinas gastadas
			const draw = (ctx: CanvasRenderingContext2D, fill: string) => {
				ctx.fillStyle = fill;
				ctx.beginPath();
				const rad = 6 + r() * 6;
				const xx = x + gap;
				const yy = y0 + gap;
				const ww = w - gap * 2;
				const hh = bh - gap * 2;
				ctx.moveTo(xx + rad, yy);
				ctx.lineTo(xx + ww - rad, yy);
				ctx.quadraticCurveTo(xx + ww, yy, xx + ww, yy + rad);
				ctx.lineTo(xx + ww, yy + hh - rad);
				ctx.quadraticCurveTo(xx + ww, yy + hh, xx + ww - rad, yy + hh);
				ctx.lineTo(xx + rad, yy + hh);
				ctx.quadraticCurveTo(xx, yy + hh, xx, yy + hh - rad);
				ctx.lineTo(xx, yy + rad);
				ctx.quadraticCurveTo(xx, yy, xx + rad, yy);
				ctx.fill();
			};
			const lum = Math.round(170 + (k - 1) * 200);
			draw(g, '#' + c.getHexString());
			draw(b, `rgb(${lum},${lum},${lum})`);
			// sombreado interior: luz arriba-izquierda
			const gr = g.createLinearGradient(x, y0, x + w * 0.3, y0 + bh);
			gr.addColorStop(0, 'rgba(255,245,225,0.10)');
			gr.addColorStop(1, 'rgba(0,0,0,0.16)');
			g.fillStyle = gr;
			g.fillRect(x + gap, y0 + gap, w - gap * 2, bh - gap * 2);
			// poros del coral y vetas
			const np = Math.round((o.pores ?? 70) * (w / bh));
			for (let i = 0; i < np; i++) {
				const px = x + gap + r() * (w - gap * 2);
				const py = y0 + gap + r() * (bh - gap * 2);
				const pr = 0.6 + r() ** 3 * 4.5;
				g.fillStyle = `rgba(20,14,8,${0.25 + r() * 0.35})`;
				g.beginPath();
				g.ellipse(px, py, pr, pr * (0.6 + r() * 0.5), r() * 3, 0, Math.PI * 2);
				g.fill();
				b.fillStyle = 'rgba(40,40,40,0.8)';
				b.beginPath();
				b.ellipse(px, py, pr, pr * 0.8, 0, 0, Math.PI * 2);
				b.fill();
			}
			for (let i = 0; i < 260 * (w / bh); i++) {
				const px = x + gap + r() * (w - gap * 2);
				const py = y0 + gap + r() * (bh - gap * 2);
				const v = r();
				g.fillStyle = v > 0.5 ? 'rgba(255,248,230,0.07)' : 'rgba(0,0,0,0.08)';
				g.fillRect(px, py, 1.5, 1.5);
			}
			x += w;
		}
	}
	if (o.damp) {
		const gr = g.createLinearGradient(0, S * 0.55, 0, S);
		gr.addColorStop(0, 'rgba(10,20,14,0)');
		gr.addColorStop(1, `rgba(10,22,16,${o.damp})`);
		g.fillStyle = gr;
		g.fillRect(0, 0, S, S);
	}
	const map = new THREE.CanvasTexture(cm);
	map.colorSpace = THREE.SRGBColorSpace;
	map.wrapS = map.wrapT = THREE.RepeatWrapping;
	map.anisotropy = 8;
	const bump = new THREE.CanvasTexture(cb);
	bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
	const out = {map, bump};
	stoneCache.set(key, out);
	return out;
};

// copia con su propia repetición/desfase (comparte la imagen)
export const withRepeat = (t: THREE.Texture, rx: number, ry: number, ox = 0, oy = 0) => {
	const c = t.clone();
	c.repeat.set(rx, ry);
	c.offset.set(ox, oy);
	c.needsUpdate = true;
	return c;
};

// ---------- Muro encalado (cal vieja): manchas, humedad, grietas, desconchones y marcas de días rayadas ----------
// El lienzo cubre `spanX` × `spanY` unidades del muro con densidad uniforme (`ppu` píxeles por unidad).
const plasterCache = new Map<string, {map: THREE.CanvasTexture; bump: THREE.CanvasTexture}>();
export const plasterTex = (
	key: string,
	o: {seed: number; spanX: number; spanY: number; ppu: number; base?: string; chips?: [number, number, number][]; tallies?: [number, number, number][]; damp?: number; soot?: number; cracks?: number},
) => {
	const hit = plasterCache.get(key);
	if (hit) return hit;
	const Wc = Math.round(o.spanX * o.ppu);
	const Hc = Math.round(o.spanY * o.ppu);
	const mk = () => {
		const c = document.createElement('canvas');
		c.width = Wc;
		c.height = Hc;
		return c;
	};
	const cm = mk();
	const cb = mk();
	const g = cm.getContext('2d')!;
	const b = cb.getContext('2d')!;
	const r = mulberry32(o.seed);
	const X = (x: number) => (x / o.spanX + 0.5) * Wc; // x centrado en 0
	const Y = (y: number) => (1 - y / o.spanY) * Hc; // y desde el piso
	g.fillStyle = o.base ?? '#c9b28c';
	g.fillRect(0, 0, Wc, Hc);
	b.fillStyle = '#a0a0a0';
	b.fillRect(0, 0, Wc, Hc);
	// manchado suave (con copia envolvente horizontal para que la repetición no tenga costura)
	const blob = (ctx: CanvasRenderingContext2D, x: number, y: number, rad: number, col: string) => {
		for (const dx of [-Wc, 0, Wc]) {
			if (x + dx + rad < 0 || x + dx - rad > Wc) continue;
			const gr = ctx.createRadialGradient(x + dx, y, 0, x + dx, y, rad);
			gr.addColorStop(0, col);
			gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
			ctx.fillStyle = gr;
			ctx.fillRect(x + dx - rad, y - rad, rad * 2, rad * 2);
		}
	};
	for (let i = 0; i < 2600; i++) {
		const light = r() > 0.5;
		blob(g, r() * Wc, r() * Hc, 8 + r() ** 2 * 150, light ? `rgba(236,224,198,${0.03 + r() * 0.06})` : `rgba(120,98,66,${0.03 + r() * 0.07})`);
	}
	for (let i = 0; i < 1600; i++) blob(b, r() * Wc, r() * Hc, 4 + r() * 40, r() > 0.5 ? 'rgba(200,200,200,0.25)' : 'rgba(110,110,110,0.25)');
	for (let i = 0; i < (Wc * Hc) / 40; i++) {
		g.fillStyle = r() > 0.5 ? 'rgba(255,250,235,0.06)' : 'rgba(40,28,14,0.07)';
		g.fillRect(r() * Wc, r() * Hc, 1.2, 1.2);
	}
	// escurrimientos desde arriba
	for (let i = 0; i < 26; i++) {
		const x = r() * Wc;
		const w = 6 + r() * 34;
		const h = Hc * (0.1 + r() * 0.35);
		const gr = g.createLinearGradient(0, 0, 0, h);
		gr.addColorStop(0, `rgba(96,72,44,${0.08 + r() * 0.1})`);
		gr.addColorStop(1, 'rgba(96,72,44,0)');
		g.fillStyle = gr;
		g.fillRect(x, 0, w, h);
	}
	// humedad al pie y hollín arriba
	if (o.damp) {
		const gr = g.createLinearGradient(0, Y(5), 0, Hc);
		gr.addColorStop(0, 'rgba(46,52,34,0)');
		gr.addColorStop(1, `rgba(46,52,34,${o.damp})`);
		g.fillStyle = gr;
		g.fillRect(0, 0, Wc, Hc);
	}
	if (o.soot) {
		const gr = g.createLinearGradient(0, 0, 0, Hc * 0.3);
		gr.addColorStop(0, `rgba(24,16,10,${o.soot})`);
		gr.addColorStop(1, 'rgba(24,16,10,0)');
		g.fillStyle = gr;
		g.fillRect(0, 0, Wc, Hc);
	}
	// desconchones: se cae la cal y asoma la piedra
	for (const [cx, cy, rad] of o.chips ?? []) {
		const n = 14;
		const pts: [number, number][] = [];
		for (let k = 0; k < n; k++) {
			const a = (k / n) * Math.PI * 2;
			const rr = rad * o.ppu * (0.6 + 0.6 * r());
			pts.push([X(cx) + Math.cos(a) * rr, Y(cy) + Math.sin(a) * rr * 0.8]);
		}
		const path = (ctx: CanvasRenderingContext2D) => {
			ctx.beginPath();
			pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
			ctx.closePath();
		};
		g.save();
		path(g);
		g.clip();
		g.fillStyle = '#7a6a54';
		g.fillRect(0, 0, Wc, Hc);
		const bh = 0.32 * o.ppu;
		for (let yy = Y(cy) - rad * o.ppu * 2; yy < Y(cy) + rad * o.ppu * 2; yy += bh) {
			const off = r() * bh;
			for (let xx = X(cx) - rad * o.ppu * 2 - off; xx < X(cx) + rad * o.ppu * 2; xx += bh * (1.4 + r())) {
				g.fillStyle = `rgba(${90 + r() * 30},${76 + r() * 24},${58 + r() * 20},1)`;
				g.fillRect(xx + 3, yy + 3, bh * 1.3, bh - 6);
				for (let p = 0; p < 30; p++) {
					g.fillStyle = 'rgba(30,20,10,0.5)';
					g.beginPath();
					g.arc(xx + r() * bh * 1.3, yy + r() * bh, 0.8 + r() * 2.2, 0, Math.PI * 2);
					g.fill();
				}
			}
		}
		g.restore();
		g.strokeStyle = 'rgba(70,50,30,0.7)';
		g.lineWidth = 3;
		path(g);
		g.stroke();
		g.strokeStyle = 'rgba(245,236,214,0.5)';
		g.lineWidth = 2;
		g.save();
		g.translate(-1.5, -1.5);
		path(g);
		g.stroke();
		g.restore();
		b.fillStyle = '#505050';
		path(b);
		b.fill();
	}
	// grietas finas (caminatas aleatorias ramificadas)
	const crack = (x: number, y: number, ang: number, len: number, w: number, depth: number) => {
		let cx = x;
		let cy = y;
		g.strokeStyle = `rgba(60,42,24,${0.35 + 0.2 * w})`;
		b.strokeStyle = 'rgba(40,40,40,0.9)';
		g.lineWidth = w;
		b.lineWidth = w + 0.5;
		g.beginPath();
		b.beginPath();
		g.moveTo(cx, cy);
		b.moveTo(cx, cy);
		for (let s = 0; s < len; s += 6) {
			ang += (r() - 0.5) * 0.7;
			cx += Math.cos(ang) * 6;
			cy += Math.sin(ang) * 6;
			g.lineTo(cx, cy);
			b.lineTo(cx, cy);
			if (depth < 2 && r() < 0.02) crack(cx, cy, ang + (r() - 0.5) * 1.6, len * 0.4, w * 0.6, depth + 1);
		}
		g.stroke();
		b.stroke();
	};
	for (let i = 0; i < (o.cracks ?? 10); i++) crack(r() * Wc, r() * Hc, r() * Math.PI * 2, 80 + r() * 260, 1 + r() * 1.2, 0);
	// marcas de días rayadas en la cal (grupos de cinco)
	for (const [tx, ty, groups] of o.tallies ?? []) {
		for (let gi = 0; gi < groups; gi++) {
			const x0 = X(tx) + gi * 0.62 * o.ppu;
			const y0 = Y(ty);
			const hgt = 0.42 * o.ppu;
			const scratch = (ax: number, ay: number, bx: number, by: number) => {
				g.strokeStyle = 'rgba(60,42,24,0.55)';
				g.lineWidth = 2.6;
				g.beginPath();
				g.moveTo(ax + 1.2, ay + 1.2);
				g.lineTo(bx + 1.2, by + 1.2);
				g.stroke();
				g.strokeStyle = 'rgba(240,230,206,0.55)';
				g.lineWidth = 1.6;
				g.beginPath();
				g.moveTo(ax, ay);
				g.lineTo(bx, by);
				g.stroke();
				b.strokeStyle = 'rgba(50,50,50,1)';
				b.lineWidth = 2.6;
				b.beginPath();
				b.moveTo(ax, ay);
				b.lineTo(bx, by);
				b.stroke();
			};
			for (let k = 0; k < 4; k++) {
				const x = x0 + k * 0.1 * o.ppu + (r() - 0.5) * 3;
				scratch(x, y0 + (r() - 0.5) * 4, x + (r() - 0.5) * 5, y0 - hgt + (r() - 0.5) * 4);
			}
			scratch(x0 - 0.06 * o.ppu, y0 - hgt * 0.2, x0 + 0.38 * o.ppu, y0 - hgt * 0.8);
		}
	}
	const map = new THREE.CanvasTexture(cm);
	map.colorSpace = THREE.SRGBColorSpace;
	map.wrapS = map.wrapT = THREE.RepeatWrapping;
	map.anisotropy = 8;
	const bump = new THREE.CanvasTexture(cb);
	bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
	const out = {map, bump};
	plasterCache.set(key, out);
	return out;
};
