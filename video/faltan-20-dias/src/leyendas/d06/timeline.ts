// Día 6 · «Lo que vio el espejo» — mapa de frames (30 fps). Toda la sincronía vive aquí y se copia en scripts/leyendas/d06.py.
export const FPS = 30;
export const LEN = 1350; // 45.0 s (el lockup necesita la fecha completa ≥ 2 s antes del dip)
export const s2f = (s: number) => Math.round(s * FPS);

export type BeatId = 'hook' | 'room' | 'scissors' | 'fogon' | 'title' | 'roofs' | 'doze' | 'still' | 'owl' | 'window' | 'roof' | 'feed' | 'wake' | 'face' | 'slam' | 'dawn' | 'breath' | 'lockup';

export const B: Record<BeatId, [number, number]> = {
	hook: [0, 66],
	room: [66, 177],
	scissors: [177, 270],
	fogon: [270, 360],
	title: [360, 435],
	roofs: [435, 516],
	doze: [516, 600],
	still: [600, 660],
	owl: [660, 702],
	window: [702, 786],
	roof: [786, 864],
	feed: [864, 936],
	wake: [936, 978],
	face: [978, 1026],
	slam: [1026, 1086],
	dawn: [1086, 1152],
	breath: [1152, 1244],
	lockup: [1244, LEN],
};

export const ORDER: BeatId[] = ['hook', 'room', 'scissors', 'fogon', 'title', 'roofs', 'doze', 'still', 'owl', 'window', 'roof', 'feed', 'wake', 'face', 'slam', 'dawn', 'breath', 'lockup'];
export const beatOf = (f: number): BeatId => {
	for (const id of ORDER) if (f < B[id][1]) return id;
	return 'lockup';
};

// momentos clave (frames)
export const EV = {
	breathHook: 3,
	wipe1: [18, 38] as [number, number],
	star: [40, 60] as [number, number],
	blink: 51,
	touch: 69,
	walk: [84, 132] as [number, number],
	push: 138,
	scissorsLift: 192,
	scissorsOpen: 207,
	tock: 228,
	sit: [236, 262] as [number, number],
	rockStart: 270,
	shadowArms: [288, 324] as [number, number],
	fray: [324, 357] as [number, number],
	collapse: 360,
	ignite: 366,
	orb2: 438,
	orb3: 453,
	windowsDark: [444, 504] as [number, number],
	dip: 507,
	nods: [528, 552, 570],
	handSlide: [570, 594] as [number, number],
	humBreak: 582,
	cricketsStop: 609,
	owlLand: 660,
	owlSnap: 676,
	underlight: 687,
	owlLaunch: 690,
	orbRise: [702, 732] as [number, number],
	crossFull: [714, 722] as [number, number],
	flinch: 747,
	orbDrop: [762, 777] as [number, number],
	knocks: [798, 816],
	selfSwing: 810,
	whimper: 849,
	feed: [864, 930] as [number, number],
	whimper2: 912,
	gasp: 936,
	fill: [942, 954] as [number, number],
	tearOff: 952,
	whip: [958, 968] as [number, number],
	faceOpen: [978, 990] as [number, number],
	morph: [990, 1011] as [number, number],
	freeze: 1014,
	zero: [1014, 1023] as [number, number],
	lunge: [1021, 1026] as [number, number],
	slam: 1026,
	drag: [1032, 1050] as [number, number],
	exit: [1050, 1077] as [number, number],
	rehang: 1086,
	fingersOut: [1089, 1098] as [number, number],
	grasp: 1110,
	lapse: [1122, 1152] as [number, number],
	straighten: [1155, 1167] as [number, number],
	wipe2: [1155, 1170] as [number, number],
	breath2: 1173,
	ember6: 1206,
	fogGone: [1244, 1259] as [number, number],
	night: [1244, 1268] as [number, number],
	lockup: 1246,
	sixOn: 1281,
	sixOff: 1319,
	endDip: LEN - 8,
};

// paleta del episodio
export const P = {
	ink: '#231305',
	floor: '#0B0703',
	cempa: '#F26D3D',
	gold: '#F5C242',
	sand: '#E0BB8F',
	green: '#1F5C48',
	terra: '#A83A25',
	bone: '#D9CDB6',
	core: '#FFF3D6',
	moonRim: '#9FC3C4',
	sky0: '#071A22',
	sky1: '#12343C',
	hillFar: '#0B2228',
	hillMid: '#0F2D31',
	hillNear: '#13383A',
	foxing: '#1A0F07',
	silver: '#EFE7D7',
	soot: '#1A120C',
};

export const INK: [number, number, number] = [0.137, 0.075, 0.02];
export const INK_LUMBRE: [number, number, number] = [0.478, 0.29, 0.086];
