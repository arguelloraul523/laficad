import express from 'express';
const router = express.Router();
import { registrar, login, perfil, cambiarContrasena, olvideContrasena, restablecerContrasena, cambiarRol } from '../controllers/auth.controller.js';
import { validarRegistro, validarLogin } from '../validators/auth.validators.js';
import validarCampos from '../validators/index.js';
import { proteger } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimit.middleware.js';

// Autenticación (rutas sensibles con límite de peticiones)
router.post('/registro', authLimiter, validarRegistro, validarCampos, registrar);
router.post('/login', authLimiter, validarLogin, validarCampos, login);
router.post('/olvide-contrasena', authLimiter, olvideContrasena);
router.post('/restablecer-contrasena', authLimiter, restablecerContrasena);
router.get('/perfil', proteger, perfil);
router.put('/cambiar-contrasena', proteger, cambiarContrasena);
// Cambia el rol activo cuando la persona tiene varios roles asignados
router.post('/cambiar-rol', proteger, cambiarRol);

export default router;
