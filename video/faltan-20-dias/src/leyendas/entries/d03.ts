// Entrada aislada del día 3: solo este episodio (y el kit), para renderizar fotogramas sin depender de los demás.
import {registerRoot} from 'remotion';
import {devRoot} from '../devRoot';
import {EP03_LEN, Ep03} from '../d03_km31';
registerRoot(devRoot(Ep03, EP03_LEN, 3));
