import express from 'express';
const router = express.Router();
import { plantillas, opcionesIA, parametros, tipologias } from '../controllers/configuracion.controller.js';
import { proteger, autorizar } from '../middlewares/auth.middleware.js';

// --- Plantillas de mensaje ---
router.get('/plantillas', proteger, plantillas.listar);
router.get('/plantillas/:id', proteger, plantillas.obtener);
router.post('/plantillas', proteger, autorizar('Administrador'), plantillas.crear);
router.put('/plantillas/:id', proteger, autorizar('Administrador'), plantillas.actualizar);
router.delete('/plantillas/:id', proteger, autorizar('Administrador'), plantillas.eliminar);

// --- Opciones del asistente IA ---
router.get('/opciones-ia', proteger, opcionesIA.listar);
router.get('/opciones-ia/:id', proteger, opcionesIA.obtener);
router.post('/opciones-ia', proteger, autorizar('Administrador'), opcionesIA.crear);
router.put('/opciones-ia/:id', proteger, autorizar('Administrador'), opcionesIA.actualizar);
router.delete('/opciones-ia/:id', proteger, autorizar('Administrador'), opcionesIA.eliminar);

// --- Parámetros del sistema ---
router.get('/parametros', proteger, parametros.listar);
router.get('/parametros/:id', proteger, parametros.obtener);
router.post('/parametros', proteger, autorizar('Administrador'), parametros.crear);
router.put('/parametros/:id', proteger, autorizar('Administrador'), parametros.actualizar);
router.delete('/parametros/:id', proteger, autorizar('Administrador'), parametros.eliminar);

// --- Tipologías de cliente ---
router.get('/tipologias', proteger, tipologias.listar);
router.get('/tipologias/:id', proteger, tipologias.obtener);
router.post('/tipologias', proteger, autorizar('Administrador'), tipologias.crear);
router.put('/tipologias/:id', proteger, autorizar('Administrador'), tipologias.actualizar);
router.delete('/tipologias/:id', proteger, autorizar('Administrador'), tipologias.eliminar);

export default router;
