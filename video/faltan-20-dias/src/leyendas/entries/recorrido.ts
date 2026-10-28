// Entrada aislada del anuncio del recorrido de altares (28 de octubre, 12:00 PM), con el outro estándar.
import {registerRoot} from 'remotion';
import {devRoot} from '../devRoot';
import {RECORRIDO_LEN, Recorrido} from '../recorrido';
registerRoot(devRoot(Recorrido, RECORRIDO_LEN, 28, false));
