import express from 'express';

import authRoutes from './auth.routes.js';
import usuarioRoutes from './usuario.routes.js';
import rolRoutes from './rol.routes.js';
import moduloRoutes from './modulo.routes.js';
import catalogoRoutes from './catalogo.routes.js';
import solicitudRoutes from './solicitud.routes.js';
import cotizacionRoutes from './cotizacion.routes.js';
import pagoRoutes from './pago.routes.js';
import muestraRoutes from './muestra.routes.js';
import rechazoRoutes from './rechazo.routes.js';
import informeRoutes from './informe.routes.js';
import encuestaRoutes from './encuesta.routes.js';
import notificacionRoutes from './notificacion.routes.js';
import configuracionRoutes from './configuracion.routes.js';
import inconformidadRoutes from './inconformidad.routes.js';

const router = express.Router();

// Agrupa todas las rutas de la API bajo /api
router.use('/auth', authRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/roles', rolRoutes);
router.use('/modulos', moduloRoutes);
router.use('/catalogo', catalogoRoutes);
router.use('/solicitudes', solicitudRoutes);
router.use('/cotizaciones', cotizacionRoutes);
router.use('/pagos', pagoRoutes);
router.use('/muestras', muestraRoutes);
router.use('/rechazos', rechazoRoutes);
router.use('/informes', informeRoutes);
router.use('/encuestas', encuestaRoutes);
router.use('/notificaciones', notificacionRoutes);
router.use('/configuracion', configuracionRoutes);
router.use('/inconformidades', inconformidadRoutes);

export default router;
