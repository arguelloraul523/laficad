import crudFactory from '../utils/crudFactory.js';
import PreguntaEncuesta from '../models/PreguntaEncuesta.js';
import Encuesta from '../models/Encuesta.js';

// Preguntas del catálogo y encuestas de satisfacción
const preguntas = crudFactory(PreguntaEncuesta);
const encuestas = crudFactory(Encuesta, ['solicitud', 'respuestas.pregunta']);

export { preguntas, encuestas };
