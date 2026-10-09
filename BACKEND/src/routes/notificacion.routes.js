import express from 'express';
const router = express.Router();
import { notificaciones } from '../controllers/notificacion.controller.js';
import { proteger } from '../middlewares/auth.middleware.js';
import { filtrarPropios, exigirPropietario, fijarUsuarioPropio, alcances } from '../middlewares/propietario.middleware.js';
import { permitirCampos } from '../constants/camposPermitidos.js';
import Notificacion from '../models/Notificacion.js';

// Notificaciones
router.get('/', proteger, filtrarPropios(alcances.notificacion), notificaciones.listar);
router.get('/:id', proteger, exigirPropietario(Notificacion, alcances.notificacion), notificaciones.obtener);
router.post('/', proteger, permitirCampos('usuario'), fijarUsuarioPropio('usuario'), notificaciones.crear);
router.put('/:id', proteger, exigirPropietario(Notificacion, alcances.notificacion), notificaciones.actualizar);
router.delete('/:id', proteger, exigirPropietario(Notificacion, alcances.notificacion), notificaciones.eliminar);

export default router;
