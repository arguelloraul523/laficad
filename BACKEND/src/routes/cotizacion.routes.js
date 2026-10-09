import express from 'express';
const router = express.Router();
import { cotizaciones } from '../controllers/solicitud.controller.js';
import { proteger, autorizar } from '../middlewares/auth.middleware.js';
import { exigirTransicion } from '../middlewares/transicion.middleware.js';
import { filtrarPropios, exigirPropietario, alcances } from '../middlewares/propietario.middleware.js';
import { validarCrearCotizacion, validarAceptarCotizacion } from '../validators/cotizacion.validators.js';
import validarCampos from '../validators/index.js';
import Cotizacion from '../models/Cotizacion.js';

// Cotizaciones
router.get('/', proteger, filtrarPropios(alcances.cotizacion), cotizaciones.listar);

// PDF: solo el dueño de la solicitud o el Administrador (la ruta exige propiedad).
router.get('/:id/pdf', proteger, exigirPropietario(Cotizacion, alcances.cotizacion), cotizaciones.descargarPdf);

router.get('/:id', proteger, exigirPropietario(Cotizacion, alcances.cotizacion), cotizaciones.obtener);

// Crear: el precio lo calcula el servidor desde el catálogo (RF-06).
router.post(
  '/',
  proteger,
  autorizar('Administrador', 'Recepcionista'),
  validarCrearCotizacion,
  validarCampos,
  cotizaciones.crear
);

// Aceptar con firma digital (RF-13): el cliente firma y, si no está exonerada,
// el servidor emite el cupón de pago (RF-09).
router.post(
  '/:id/aceptar',
  proteger,
  autorizar('Administrador', 'Recepcionista', 'Cliente'),
  exigirPropietario(Cotizacion, alcances.cotizacion),
  validarAceptarCotizacion,
  validarCampos,
  cotizaciones.aceptar
);

router.put(
  '/:id',
  proteger,
  autorizar('Administrador', 'Recepcionista'),
  exigirTransicion(Cotizacion, [{ campo: 'estado', maquina: 'cotizacion' }]),
  cotizaciones.actualizar
);
router.delete('/:id', proteger, autorizar('Administrador'), cotizaciones.eliminar);

export default router;
