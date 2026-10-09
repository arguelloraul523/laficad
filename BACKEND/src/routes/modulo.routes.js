import express from 'express';
const router = express.Router();
import { modulos } from '../controllers/rol.controller.js';
import { proteger, autorizar } from '../middlewares/auth.middleware.js';

// Módulos del sistema (solo administradores pueden modificar)
router.get('/', proteger, modulos.listar);
router.get('/:id', proteger, modulos.obtener);
router.post('/', proteger, autorizar('Administrador'), modulos.crear);
router.put('/:id', proteger, autorizar('Administrador'), modulos.actualizar);
router.delete('/:id', proteger, autorizar('Administrador'), modulos.eliminar);

export default router;
