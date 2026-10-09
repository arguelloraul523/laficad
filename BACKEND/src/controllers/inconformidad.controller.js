import crudFactory from '../utils/crudFactory.js';
import Inconformidad from '../models/Inconformidad.js';

// Peticiones, quejas y reclamos (PQR)
const inconformidades = crudFactory(Inconformidad, ['usuario', 'solicitud']);

export { inconformidades };
