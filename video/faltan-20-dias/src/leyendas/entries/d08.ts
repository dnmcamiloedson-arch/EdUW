// Entrada aislada del día 8: solo este episodio (y el kit), para renderizar fotogramas sin depender de los demás.
import {registerRoot} from 'remotion';
import {devRoot} from '../devRoot';
import {EP08_LEN, Ep08} from '../d08_chaneques';
registerRoot(devRoot(Ep08, EP08_LEN, 8));
