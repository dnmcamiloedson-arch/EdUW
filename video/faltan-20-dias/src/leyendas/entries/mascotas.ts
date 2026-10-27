// Entrada aislada del video del 27 de octubre (las mascotas), con el outro estándar de Westhill.
import {registerRoot} from 'remotion';
import {devRoot} from '../devRoot';
import {MASCOTAS_LEN, Mascotas} from '../mascotas';
registerRoot(devRoot(Mascotas, MASCOTAS_LEN, 27, false));
