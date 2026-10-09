import express from 'express';
const router = express.Router();
import { roles } from '../controllers/rol.controller.js';
import { proteger, autorizar } from '../middlewares/auth.middleware.js';

// Roles del sistema (solo administradores pueden modificar)
router.get('/', proteger, roles.listar);
router.get('/:id', proteger, roles.obtener);
router.post('/', proteger, autorizar('Administrador'), roles.crear);
router.put('/:id', proteger, autorizar('Administrador'), roles.actualizar);
router.delete('/:id', proteger, autorizar('Administrador'), roles.eliminar);

export default router;
