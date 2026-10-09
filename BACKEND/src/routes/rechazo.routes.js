import express from 'express';
const router = express.Router();
import { motivos, rechazos } from '../controllers/rechazo.controller.js';
import { proteger, autorizar } from '../middlewares/auth.middleware.js';
import upload from '../config/multer.js';

// --- Motivos de rechazo (definido ANTES de /:id) ---
router.get('/motivos', proteger, motivos.listar);
router.get('/motivos/:id', proteger, motivos.obtener);
router.post('/motivos', proteger, autorizar('Administrador'), motivos.crear);
router.put('/motivos/:id', proteger, autorizar('Administrador'), motivos.actualizar);
router.delete('/motivos/:id', proteger, autorizar('Administrador'), motivos.eliminar);

// --- Rechazos ---
router.get('/', proteger, rechazos.listar);
router.get('/:id', proteger, rechazos.obtener);
router.post(
  '/',
  proteger,
  autorizar('Administrador', 'Recepcionista', 'Analista'),
  upload.fields([
    { name: 'evidenciaFoto', maxCount: 1 },
    { name: 'actaPdf', maxCount: 1 },
  ]),
  (req, res, next) => {
    if (req.files?.evidenciaFoto?.[0]) req.body.evidenciaFoto = req.files.evidenciaFoto[0].filename;
    if (req.files?.actaPdf?.[0]) req.body.actaPdf = req.files.actaPdf[0].filename;
    next();
  },
  rechazos.crear
);
router.put('/:id', proteger, rechazos.actualizar);
router.delete('/:id', proteger, autorizar('Administrador'), rechazos.eliminar);

export default router;
