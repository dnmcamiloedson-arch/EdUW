// Entrada aislada del día 7: solo este episodio (y el kit), para renderizar fotogramas sin depender de los demás.
import {registerRoot} from 'remotion';
import {devRoot} from '../devRoot';
import {EP07_LEN, Ep07} from '../d07_nahual';
registerRoot(devRoot(Ep07, EP07_LEN, 7));
