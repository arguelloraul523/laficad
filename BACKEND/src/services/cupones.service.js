import CuentaRecaudo from '../models/CuentaRecaudo.js';
import CuponPago from '../models/CuponPago.js';
import ParametroSistema from '../models/ParametroSistema.js';
import { codigoCupon } from './codigos.service.js';

// ============================================================
// Emisión del cupón de pago (RF-09).
// Reglas:
//   - solo se emite para una cotización ACEPTADA;
//   - solo si valorTotal > 0 (la exonerada SENA no genera cupón);
//   - un SOLO cupón por cotización;
//   - siempre con cuentas de recaudo activas;
//   - fecha límite desde ParametroSistema (clave `diasVigenciaCupon`, default 15).
// ============================================================

const errorCon = (statusCode, mensaje) => {
  const err = new Error(mensaje);
  err.statusCode = statusCode;
  return err;
};

// Vigencia en días del cupón.
const diasVigenciaCupon = async () => {
  const parametro = await ParametroSistema.findOne({ clave: 'diasVigenciaCupon' });
  const dias = parametro ? parseInt(parametro.valor, 10) : NaN;
  return Number.isFinite(dias) && dias > 0 ? dias : 15;
};

// Crea el cupón. Requiere una `cotizacion` documentada (con sus valores).
// `cuentas` y `fechaLimitePago` opcionales (si no llegan, se toman del sistema).
const emitirCupon = async ({ cotizacion, cuentas, fechaLimitePago } = {}) => {
  if (!cotizacion) throw errorCon(400, 'La cotización es obligatoria');

  if (cotizacion.estado !== 'Aceptada') {
    throw errorCon(409, 'La cotización debe estar aceptada para emitir el cupón');
  }
  if (!cotizacion.valorTotal || cotizacion.valorTotal <= 0) {
    throw errorCon(400, 'Una cotización exonerada ($0) no genera cupón de pago');
  }
  if (await CuponPago.exists({ cotizacion: cotizacion._id })) {
    throw errorCon(409, 'La cotización ya tiene un cupón de pago (solo uno)');
  }

  const activas = await CuentaRecaudo.find({ activa: true });
  if (activas.length === 0) {
    throw errorCon(409, 'No hay cuentas de recaudo activas para emitir el cupón');
  }

  // Si el cliente/personal envía cuentas, solo se aceptan las activas.
  const permitidas = new Map(activas.map((c) => [String(c._id), c._id]));
  const seleccionadas =
    Array.isArray(cuentas) && cuentas.length > 0
      ? cuentas.map((id) => permitidas.get(String(id))).filter(Boolean)
      : activas.map((c) => c._id);

  if (seleccionadas.length === 0) {
    throw errorCon(400, 'Ninguna cuenta de recaudo indicada está activa');
  }

  let fecha = fechaLimitePago ? new Date(fechaLimitePago) : null;
  if (fecha && Number.isNaN(fecha.getTime())) throw errorCon(400, 'fechaLimitePago inválida');
  if (!fecha) fecha = new Date(Date.now() + (await diasVigenciaCupon()) * 24 * 60 * 60 * 1000);
  if (fecha.getTime() <= Date.now()) throw errorCon(400, 'La fecha límite debe ser futura');

  return CuponPago.create({
    cotizacion: cotizacion._id,
    codigoReferencia: await codigoCupon(),
    fechaLimitePago: fecha,
    cuentas: seleccionadas,
  });
};

export { diasVigenciaCupon, emitirCupon };
