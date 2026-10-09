import crudFactory from '../utils/crudFactory.js';
import PlantillaMensaje from '../models/PlantillaMensaje.js';
import OpcionAsistenteIA from '../models/OpcionAsistenteIA.js';
import ParametroSistema from '../models/ParametroSistema.js';
import TipologiaCliente from '../models/TipologiaCliente.js';

// Configuración del sistema: plantillas de mensaje, opciones del asistente IA,
// parámetros globales y tipologías de cliente.
const plantillas = crudFactory(PlantillaMensaje, ['modificadoPor']);
const opcionesIA = crudFactory(OpcionAsistenteIA, ['modificadoPor']);
const parametros = crudFactory(ParametroSistema, ['modificadoPor']);
const tipologias = crudFactory(TipologiaCliente);

export { plantillas, opcionesIA, parametros, tipologias };
