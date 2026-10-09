import crudFactory from '../utils/crudFactory.js';
import MotivoRechazo from '../models/MotivoRechazo.js';
import Rechazo from '../models/Rechazo.js';

// Motivos de rechazo y rechazos de muestras
const motivos = crudFactory(MotivoRechazo);
const rechazos = crudFactory(Rechazo, ['muestra', 'motivo', 'registradoPor']);

export { motivos, rechazos };
