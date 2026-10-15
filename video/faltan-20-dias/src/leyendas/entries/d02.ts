// Entrada aislada del día 2: solo este episodio (y el kit), para renderizar fotogramas sin depender de los demás.
import {registerRoot} from 'remotion';
import {devRoot} from '../devRoot';
import {EP02_LEN, Ep02} from '../d02_llorona';
registerRoot(devRoot(Ep02, EP02_LEN, 2));
