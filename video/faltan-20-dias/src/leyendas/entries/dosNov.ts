// Entrada aislada de la historia del 2 de noviembre (veladoras · «Hoy vuelven a casa.»), con el outro estándar de Westhill.
import {registerRoot} from 'remotion';
import {devRoot} from '../devRoot';
import {DOSNOV_LEN, DosNov} from '../dosNov';
registerRoot(devRoot(DosNov, DOSNOV_LEN, 0, false));
