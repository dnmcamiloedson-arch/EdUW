// Entrada aislada del día 1: solo este episodio (y el kit), para renderizar fotogramas sin depender de los demás.
import {registerRoot} from 'remotion';
import {devRoot} from '../devRoot';
import {EP01_LEN, Ep01} from '../d01_altares';
registerRoot(devRoot(Ep01, EP01_LEN, 1));
