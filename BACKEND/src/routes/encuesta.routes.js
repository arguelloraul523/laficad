import express from 'express';
const router = express.Router();
import { preguntas, encuestas } from '../controllers/encuesta.controller.js';
import { proteger, autorizar } from '../middlewares/auth.middleware.js';
import { filtrarPropios, exigirPropietario, alcances } from '../middlewares/propietario.middleware.js';
import Encuesta from '../models/Encuesta.js';

// --- Preguntas (definido ANTES de /:id) ---
router.get('/preguntas', proteger, preguntas.listar);
router.get('/preguntas/:id', proteger, preguntas.obtener);
router.post('/preguntas', proteger, autorizar('Administrador'), preguntas.crear);
router.put('/preguntas/:id', proteger, autorizar('Administrador'), preguntas.actualizar);
router.delete('/preguntas/:id', proteger, autorizar('Administrador'), preguntas.eliminar);

// --- Encuestas ---
router.get('/', proteger, filtrarPropios(alcances.encuesta), encuestas.listar);
router.get('/:id', proteger, exigirPropietario(Encuesta, alcances.encuesta), encuestas.obtener);
router.post('/', proteger, encuestas.crear);
router.put('/:id', proteger, exigirPropietario(Encuesta, alcances.encuesta), encuestas.actualizar);
router.delete('/:id', proteger, autorizar('Administrador'), encuestas.eliminar);

export default router;
