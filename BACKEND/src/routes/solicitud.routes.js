import express from 'express';
const router = express.Router();
import { solicitudes } from '../controllers/solicitud.controller.js';
import { proteger, autorizar } from '../middlewares/auth.middleware.js';
import { exigirTransicion } from '../middlewares/transicion.middleware.js';
import { filtrarPropios, exigirPropietario, alcances } from '../middlewares/propietario.middleware.js';
import { permitirCampos } from '../constants/camposPermitidos.js';
import { validarSolicitud, validarSugerencias } from '../validators/solicitud.validators.js';
import validarCampos from '../validators/index.js';
import Solicitud from '../models/Solicitud.js';

// Sugerencias de análisis (RF-16) - definido ANTES de /:id
router.post('/sugerencias', proteger, validarSugerencias, validarCampos, solicitudes.sugerencias);

// Solicitudes / pre-solicitudes
router.get('/', proteger, filtrarPropios(alcances.solicitud), solicitudes.listar);
router.get('/:id', proteger, exigirPropietario(Solicitud, alcances.solicitud), solicitudes.obtener);
router.post('/', proteger, validarSolicitud, validarCampos, solicitudes.crear);
router.put(
  '/:id',
  proteger,
  autorizar('Administrador', 'Recepcionista'),
  permitirCampos('examenes'),
  exigirTransicion(Solicitud, [{ campo: 'estado', maquina: 'solicitud' }]),
  solicitudes.actualizar
);
router.delete('/:id', proteger, autorizar('Administrador'), solicitudes.eliminar);

export default router;
