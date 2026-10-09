import express from 'express';
const router = express.Router();
import { informes } from '../controllers/informe.controller.js';
import { proteger, autorizar } from '../middlewares/auth.middleware.js';
import { filtrarPropios, exigirPropietario, alcances } from '../middlewares/propietario.middleware.js';
import { permitirCampos } from '../constants/camposPermitidos.js';
import Informe from '../models/Informe.js';
import upload from '../config/multer.js';

// Informes de resultados
router.get('/', proteger, filtrarPropios(alcances.informe), informes.listar);
router.get('/:id', proteger, exigirPropietario(Informe, alcances.informe), informes.obtener);
router.post('/', proteger, autorizar('Administrador', 'Analista'), upload.single('archivoPdf'), (req, res, next) => {
  if (req.file) req.body.archivoPdf = req.file.filename;
  next();
}, informes.crear);
router.put('/:id', proteger, autorizar('Administrador', 'Analista'), permitirCampos('estado', 'revisadoPor', 'fechaValidacion', 'fechaEnvio'), informes.actualizar);
router.delete('/:id', proteger, autorizar('Administrador'), informes.eliminar);

export default router;
