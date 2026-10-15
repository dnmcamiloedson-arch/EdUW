// Entrada aislada del día 0: solo este episodio (y el kit), para renderizar fotogramas sin depender de los demás.
import {registerRoot} from 'remotion';
import {devRoot} from '../devRoot';
import {EP00_LEN, Ep00} from '../d00_hoy';
registerRoot(devRoot(Ep00, EP00_LEN, 0));
