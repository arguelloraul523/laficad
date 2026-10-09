import asyncHandler from '../utils/asyncHandler.js';
import crudFactory from '../utils/crudFactory.js';
import { emitirCupon } from '../services/cupones.service.js';
import { registrarPago, verificarPago, bandejaPendientes, misPagos } from '../services/pagos.service.js';
import { esCliente } from '../middlewares/propietario.middleware.js';
import CuentaRecaudo from '../models/CuentaRecaudo.js';
import Cotizacion from '../models/Cotizacion.js';
import CuponPago from '../models/CuponPago.js';
import Pago from '../models/Pago.js';

// ===== Cupones de pago =====
// Las reglas (cotización aceptada, valor > 0, un solo cupón, cuentas activas
// y fecha límite desde ParametroSistema) viven en services/cupones.service.js.
const crearCupon = asyncHandler(async (req, res) => {
  const cotizacion = await Cotizacion.findById(req.body.cotizacion);
  if (!cotizacion) return res.status(404).json({ ok: false, mensaje: 'Registro no encontrado' });

  const cupon = await emitirCupon({
    cotizacion,
    cuentas: req.body.cuentas,
    fechaLimitePago: req.body.fechaLimitePago,
  });
  res.status(201).json({ ok: true, data: cupon });
});

const cupones = {
  ...crudFactory(CuponPago, ['cotizacion', 'cuentas']),
  crear: crearCupon,
};

// ===== Pagos =====
const pagos = {
  ...crudFactory(Pago, ['cupon']),
  // Reportar un pago (comprobante o recibo de caja) - RF-08, RF-33
  crear: asyncHandler(async (req, res) => {
    const pago = await registrarPago({
      body: req.body,
      file: req.file,
      usuario: req.usuario,
      esCliente: esCliente(req),
    });
    res.status(201).json({ ok: true, data: pago });
  }),
  // Verifica (aprueba o rechaza) un pago reportado - RF-09
  verificar: asyncHandler(async (req, res) => {
    const { pago, solicitud } = await verificarPago({
      id: req.params.id,
      aprobar: req.body.aprobar,
      observacion: req.body.observacion,
      usuario: req.usuario,
    });
    res.json({ ok: true, data: pago, solicitud });
  }),
  // Bandeja de pendientes ordenada por antigüedad (más viejo primero)
  pendientes: asyncHandler(async (req, res) => {
    const resultado = await bandejaPendientes({ pagina: req.query.pagina, limite: req.query.limite });
    res.json({ ok: true, ...resultado });
  }),
  // "Mis pagos" del cliente, con su historial de cambios
  misPagos: asyncHandler(async (req, res) => {
    const { total, data } = await misPagos(req.alcance || {});
    res.json({ ok: true, total, data });
  }),
};

const cuentasRecaudo = crudFactory(CuentaRecaudo);

export { cuentasRecaudo, cupones, pagos };
