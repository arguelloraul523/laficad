import crudFactory from '../utils/crudFactory.js';
import Notificacion from '../models/Notificacion.js';

// Notificaciones enviadas a los usuarios
const notificaciones = crudFactory(Notificacion, ['usuario', 'plantilla', 'solicitud']);

export { notificaciones };
