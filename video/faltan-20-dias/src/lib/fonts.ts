import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Fuentes servidas desde /public: nada de CDN durante el render.
export const fontsReady = Promise.all([
	loadFont({family: 'Rye', url: staticFile('fonts/Rye-Regular.woff2'), weight: '400'}),
	loadFont({family: 'Alike', url: staticFile('fonts/Alike-Regular.woff2'), weight: '400'}),
	loadFont({family: 'Domine', url: staticFile('fonts/Domine-Regular.woff2'), weight: '400'}),
]);
