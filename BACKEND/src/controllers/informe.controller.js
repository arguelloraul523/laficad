import crudFactory from '../utils/crudFactory.js';
import Informe from '../models/Informe.js';

// Informes de resultados
const informes = crudFactory(Informe, ['muestra', 'revisadoPor']);

export { informes };
