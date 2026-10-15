// Entrada aislada del día 6: solo este episodio (y el kit), para renderizar fotogramas sin depender de los demás.
import {registerRoot} from 'remotion';
import {devRoot} from '../devRoot';
import {EP06_LEN, Ep06} from '../d06_brujas';
registerRoot(devRoot(Ep06, EP06_LEN, 6));
