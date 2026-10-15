// Entrada aislada del día 4: solo este episodio (y el kit), para renderizar fotogramas sin depender de los demás.
import {registerRoot} from 'remotion';
import {devRoot} from '../devRoot';
import {EP04_LEN, Ep04} from '../d04_momias';
registerRoot(devRoot(Ep04, EP04_LEN, 4));
