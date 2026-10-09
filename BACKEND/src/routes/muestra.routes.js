import express from 'express';
const router = express.Router();
import { muestras, historial } from '../controllers/muestra.controller.js';
import { proteger, autorizar } from '../middlewares/auth.middleware.js';
import { exigirTransicion } from '../middlewares/transicion.middleware.js';
import { filtrarPropios, exigirPropietario, alcances } from '../middlewares/propietario.middleware.js';
import Muestra from '../models/Muestra.js';

// --- Historial de muestras (definido ANTES de /:id) ---
router.get('/historial', proteger, historial.listar);
router.get('/historial/:id', proteger, historial.obtener);

// --- Muestras ---
router.get('/', proteger, filtrarPropios(alcances.muestra), muestras.listar);
router.get('/:id', proteger, exigirPropietario(Muestra, alcances.muestra), muestras.obtener);
router.post('/', proteger, autorizar('Administrador', 'Recepcionista'), muestras.crear);
router.put('/:id/cambiar-etapa', proteger, autorizar('Administrador', 'Recepcionista', 'Analista'), muestras.cambiarEtapa);
router.put(
  '/:id',
  proteger,
  autorizar('Administrador', 'Recepcionista', 'Analista'),
  exigirTransicion(Muestra, [
    { campo: 'estado', maquina: 'muestra' },
    { campo: 'etapaActual', maquina: 'etapa' },
  ]),
  muestras.actualizar
);
router.delete('/:id', proteger, autorizar('Administrador'), muestras.eliminar);

export default router;
