import express from 'express';
const router = express.Router();
import { inconformidades } from '../controllers/inconformidad.controller.js';
import { proteger, autorizar } from '../middlewares/auth.middleware.js';
import { filtrarPropios, exigirPropietario, fijarUsuarioPropio, alcances } from '../middlewares/propietario.middleware.js';
import { permitirCampos } from '../constants/camposPermitidos.js';
import Inconformidad from '../models/Inconformidad.js';
import upload from '../config/multer.js';

// Peticiones, quejas y reclamos (PQR)
router.get('/', proteger, filtrarPropios(alcances.inconformidad), inconformidades.listar);
router.get('/:id', proteger, exigirPropietario(Inconformidad, alcances.inconformidad), inconformidades.obtener);
router.post('/', proteger, permitirCampos('usuario'), fijarUsuarioPropio('usuario'), upload.single('soporte'), (req, res, next) => {
  if (req.file) req.body.soporte = req.file.filename;
  next();
}, inconformidades.crear);
router.put('/:id', proteger, autorizar('Administrador'), permitirCampos('estado', 'fechaResolucion'), inconformidades.actualizar);
router.delete('/:id', proteger, autorizar('Administrador'), inconformidades.eliminar);

export default router;
