// Día 8 · mapa de frames (30 fps). Toda la sincronía del episodio vive aquí: beats, eventos y presets de post.
import type {PostOpts} from '../kit/post';

export const EP08_LEN = 1335; // 44.5 s; el outro estándar de 4.5 s se agrega después

// beats [inicio, fin) en frames
export const B = {
	b1: [0, 90],
	b2: [90, 246],
	b3: [246, 348],
	b4: [348, 522],
	b5: [522, 738],
	b6: [738, 849],
	b7: [849, 948],
	b8: [948, 1014],
	b9: [1014, 1122],
	b10: [1122, 1188],
	b11: [1188, 1227],
	b12: [1227, 1335],
} as const;
export type BeatId = keyof typeof B;
export const inB = (f: number, id: BeatId) => f >= B[id][0] && f < B[id][1];

// eventos (frame absoluto)
export const EV = {
	// B1
	torchOn: 5,
	giggle1: 42,
	whip1: 44,
	eyes1: 69,
	bloom: 84,
	// B2
	wrap0: 90,
	wrap1: 138,
	knot1: 165,
	thumb1: 198,
	pat1: 184,
	pat2: 193,
	leak0: 150,
	leak1: 210,
	lift0: 231,
	smoke0: 231,
	smoke1: 264,
	// B3
	owlHoot: 275,
	owlTurn: 282,
	tiltDown: 306,
	pick0: 306,
	snap: 330,
	pick1: 345,
	// B4
	cup0: 354,
	cup1: 381,
	refl0: 384,
	reflTilt: 400,
	whipTurn: 412,
	whipBack: 429,
	silence: 434,
	petalPop: 465,
	wrist0: 480,
	wrist1: 519,
	// B5
	hum: 525,
	search0: 549,
	search1: 588,
	dart0: 567,
	dart1: 575,
	still0: 606,
	whipL: 660,
	sink0: 675,
	sink1: 711,
	zero: 712,
	erupt: 720,
	tiltAll: 727,
	blinkAll: 733,
	// B6
	cut2: 765,
	run2: 775,
	parallel: 783,
	cut3: 792,
	run3: 802,
	cut4: 819,
	// B7
	reach0: 912,
	jump: 930,
	jumpEnd: 943,
	torchDie: 944,
	// B8
	slam: 960,
	altar: 971,
	sweep: 987,
	sink: 1008,
	// B9
	dawnIn1: 1044,
	rack1: 1068,
	rise0: 1077,
	// B10
	petalFall: 1146,
	// B11
	fuse0: 1188,
	fuse1: 1218,
	swell0: 1216,
	swell1: 1226,
	// B12
	lockup: 1228,
	prints0: 1281,
	prints1: 1308,
	eyes2: 1311,
	giggle2: 1317,
	slap: 1321,
} as const;

const INK: [number, number, number] = [0.043, 0.027, 0.012];
const SEPIA: [number, number, number] = [0.14, 0.075, 0.02];

export const POST_NIGHT: PostOpts = {
	contrast: 1.08,
	saturation: 0.88,
	shadows: [0, 0.01, 0.022],
	highlights: [0.015, 0.008, 0],
	bloom: 0.5,
	bloomThr: 0.72,
	halation: 0.22,
	ca: 1.6,
	vignette: 0.9,
	grain: 0.075,
	hatch: 0.55,
	hatchScale: 5,
	hatchAngle: 0.6,
	hatchInk: INK,
};
export const POST_MEMORY: PostOpts = {
	contrast: 1.06,
	saturation: 0.82,
	shadows: [0.02, 0.008, 0],
	highlights: [0.035, 0.018, -0.01],
	bloom: 0.6,
	bloomThr: 0.7,
	halation: 0.35,
	ca: 1.2,
	vignette: 0.95,
	grain: 0.07,
	hatch: 0.45,
	hatchScale: 5,
	hatchAngle: 0.75,
	hatchInk: SEPIA,
};
export const POST_DAWN: PostOpts = {
	contrast: 1.03,
	saturation: 0.9,
	shadows: [0.01, 0.012, 0.02],
	highlights: [0.04, 0.025, 0],
	bloom: 0.45,
	bloomThr: 0.75,
	halation: 0.3,
	ca: 1.2,
	vignette: 0.8,
	grain: 0.065,
	hatch: 0.5,
	hatchScale: 5,
	hatchAngle: 0.6,
	hatchInk: INK,
};
export const POST_TITLE: PostOpts = {
	contrast: 1.06,
	saturation: 0.95,
	bloom: 0.7,
	bloomThr: 0.6,
	halation: 0.3,
	ca: 1.2,
	vignette: 0.9,
	grain: 0.07,
	hatch: 0.3,
	hatchScale: 4.5,
	hatchAngle: 0.6,
	hatchInk: INK,
};
