import express from 'express';
const router = express.Router();
import { cuentasRecaudo, cupones, pagos } from '../controllers/pago.controller.js';
import { proteger, autorizar } from '../middlewares/auth.middleware.js';
import { filtrarPropios, exigirPropietario, alcances } from '../middlewares/propietario.middleware.js';
import { validarRegistrarPago, validarVerificarPago } from '../validators/pago.validators.js';
import validarCampos from '../validators/index.js';
import CuponPago from '../models/CuponPago.js';
import Pago from '../models/Pago.js';
import upload from '../config/multer.js';

// --- Cuentas de recaudo ---
router.get('/cuentas', proteger, cuentasRecaudo.listar);
router.get('/cuentas/:id', proteger, cuentasRecaudo.obtener);
router.post('/cuentas', proteger, autorizar('Administrador'), cuentasRecaudo.crear);
router.put('/cuentas/:id', proteger, autorizar('Administrador'), cuentasRecaudo.actualizar);
router.delete('/cuentas/:id', proteger, autorizar('Administrador'), cuentasRecaudo.eliminar);

// --- Cupones de pago ---
router.get('/cupones', proteger, filtrarPropios(alcances.cupon), cupones.listar);
router.get('/cupones/:id', proteger, exigirPropietario(CuponPago, alcances.cupon), cupones.obtener);
router.post('/cupones', proteger, autorizar('Administrador', 'Recepcionista'), cupones.crear);
router.put('/cupones/:id', proteger, autorizar('Administrador'), cupones.actualizar);
router.delete('/cupones/:id', proteger, autorizar('Administrador'), cupones.eliminar);

// --- Pagos ---
// Bandeja de pendientes y consulta del cliente ANTES de /:id (orden de rutas).
router.get('/pendientes', proteger, autorizar('Administrador', 'Recepcionista'), pagos.pendientes);
router.get('/mis-pagos', proteger, filtrarPropios(alcances.pago), pagos.misPagos);
router.get('/', proteger, filtrarPropios(alcances.pago), pagos.listar);
router.get('/:id', proteger, exigirPropietario(Pago, alcances.pago), pagos.obtener);
router.post(
  '/',
  proteger,
  autorizar('Administrador', 'Recepcionista', 'Cliente'),
  upload.single('archivoComprobante'),
  (req, res, next) => {
    if (req.file) req.body.archivoComprobante = req.file.filename;
    next();
  },
  validarRegistrarPago,
  validarCampos,
  pagos.crear
);
router.put(
  '/:id/verificar',
  proteger,
  autorizar('Administrador', 'Recepcionista'),
  validarVerificarPago,
  validarCampos,
  pagos.verificar
);
router.delete('/:id', proteger, autorizar('Administrador'), pagos.eliminar);

export default router;
