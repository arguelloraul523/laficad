import crudFactory from '../utils/crudFactory.js';
import Rol from '../models/Rol.js';
import Modulo from '../models/Modulo.js';

// Roles (con los módulos asociados) y Módulos del sistema
const roles = crudFactory(Rol, ['modulos']);
const modulos = crudFactory(Modulo);

export { roles, modulos };
