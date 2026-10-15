// Entrada aislada del día 5: solo este episodio (y el kit), para renderizar fotogramas sin depender de los demás.
import {registerRoot} from 'remotion';
import {devRoot} from '../devRoot';
import {EP05_LEN, Ep05} from '../d05_charro';
registerRoot(devRoot(Ep05, EP05_LEN, 5));
