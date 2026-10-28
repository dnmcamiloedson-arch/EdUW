// Entrada aislada de la historia del 28 de octubre (cuenta regresiva a HOY), con el outro estándar de Westhill.
import {registerRoot} from 'remotion';
import {devRoot} from '../devRoot';
import {HOYALT_LEN, HoyAltares} from '../hoyAltares';
registerRoot(devRoot(HoyAltares, HOYALT_LEN, 28, false));
