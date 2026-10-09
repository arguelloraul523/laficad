import Pago from '../models/Pago.js';
import CuponPago from '../models/CuponPago.js';
import Solicitud from '../models/Solicitud.js';
import { transicionValida } from '../constants/estados.js';
import { paginar } from '../utils/paginar.js';
import { emitir, suscribir } from './eventos.service.js';
import { notificarPagoAprobado, notificarPagoRechazado } from './notificaciones.service.js';

// ============================================================
// Lógica de negocio de PAGOS (RF-08, RF-09, RF-12, RF-33).
//
//   - registrarPago: método + comprobante obligatorio (salvo efectivo,
//     donde se exige número de recibo), cupón vigente, estado inicial
//     "Pendiente de verificación" y primer evento del historial.
//   - verificarPago: solo desde "Pendiente de verificación"; observación
//     obligatoria al rechazar; guarda verificadoPor/fechaRevision; al
//     aprobar avanza la Solicitud a "Pagada" y dispara "pagoAprobado";
//     al rechazar dispara "pagoRechazado" con el motivo.
//   - bandejaPendientes: pendientes ordenados por antigüedad.
//   - misPagos: consulta del cliente con historial (solo lo suyo).
//
// Regla inviolable #1: sin pago aprobado (o exoneración) no se crea la
// muestra; eso lo garantiza muestra.controller con Solicitud "Pagada".
// ============================================================

const errorCon = (statusCode, mensaje) => {
  const err = new Error(mensaje);
  err.statusCode = statusCode;
  return err;
};

// Suscripción de notificaciones a los eventos del pago (una sola vez).
suscribir('pagoAprobado', notificarPagoAprobado);
suscribir('pagoRechazado', notificarPagoRechazado);

// Solo los campos que el cliente/personal pueden reportar (regla #12).
// El comprobante llega del body (la ruta lo mapea desde multer) o del archivo.
const camposReportables = (body = {}, file = null) => ({
  cupon: body.cupon,
  metodo: body.metodo,
  archivoComprobante: body.archivoComprobante || (file ? file.filename : null),
  numeroReciboCaja: body.numeroReciboCaja,
  fechaPagoReportada: body.fechaPagoReportada,
  valorReportado: body.valorReportado,
});

// ===== Registro de un pago (reporte del cliente o del personal) =====
const registrarPago = async ({ body = {}, file, usuario, esCliente }) => {
  const cupon = await CuponPago.findById(body.cupon).populate({
    path: 'cotizacion',
    populate: { path: 'solicitud', select: 'usuario estado codigoPresolicitud' },
  });
  if (!cupon) throw errorCon(404, 'Cupón de pago no encontrado');
  if (!cupon.cotizacion || !cupon.cotizacion.solicitud) {
    throw errorCon(409, 'El cupón no tiene una cotización/solicitud asociada');
  }

  // Regla #10: el Cliente solo reporta pagos sobre sus propios cupones.
  if (esCliente) {
    const dueno = cupon.cotizacion.solicitud.usuario;
    if (String(dueno) !== String(usuario._id)) {
      throw errorCon(403, 'No tienes acceso a este cupón de pago');
    }
  }

  // Cupón vencido: se bloquean nuevos reportes (RF-09).
  if (cupon.fechaLimitePago.getTime() <= Date.now()) {
    const vencimiento = cupon.fechaLimitePago.toISOString().slice(0, 10);
    throw errorCon(409, `El cupón de pago venció el ${vencimiento}; ya no se admiten nuevos reportes`);
  }

  const pago = await Pago.create({
    ...camposReportables(body, file),
    estado: 'Pendiente de verificación', // estado inicial (lo fija el servidor)
    fechaCarga: new Date(),
    verificadoPor: null,
    fechaRevision: null,
    historial: [
      {
        estado: 'Pendiente de verificación',
        fecha: new Date(),
        usuario: usuario._id,
        observacion: 'Pago reportado por el cliente',
      },
    ],
  });

  return pago;
};

// ===== Verificación (aprobar / rechazar) =====
const verificarPago = async ({ id, aprobar, observacion, usuario }) => {
  const pago = await Pago.findById(id).populate({
    path: 'cupon',
    populate: { path: 'cotizacion', populate: { path: 'detalles.examen' } },
  });
  if (!pago) throw errorCon(404, 'Registro no encontrado');

  const nuevoEstado = aprobar ? 'Pagado' : 'Rechazado';

  // Regla inviolable #7: rechazar un pago exige observación.
  if (!aprobar && !String(observacion || '').trim()) {
    throw errorCon(400, 'Rechazar un pago exige una observación');
  }

  // Solo se verifica desde "Pendiente de verificación" (409).
  if (!transicionValida('pago', pago.estado, nuevoEstado)) {
    throw errorCon(409, `Transición inválida de "estado": ${pago.estado} → ${nuevoEstado}`);
  }

  const cotizacion = pago.cupon?.cotizacion || null;
  const solicitud = cotizacion
    ? await Solicitud.findById(cotizacion.solicitud).populate('usuario')
    : null;

  // Al aprobar, la solicitud avanza a "Pagada" (habilita RF-09 en recepción).
  if (aprobar) {
    if (!solicitud) throw errorCon(409, 'El pago no tiene una solicitud asociada');
    const yaPagada = solicitud.estado === 'Pagada';
    if (!yaPagada && !transicionValida('solicitud', solicitud.estado, 'Pagada')) {
      throw errorCon(409, `Transición inválida de "estado" de la solicitud: ${solicitud.estado} → Pagada`);
    }
  }

  const ahora = new Date();
  pago.estado = nuevoEstado;
  pago.verificadoPor = usuario._id;
  pago.fechaRevision = ahora;
  if (String(observacion || '').trim()) pago.observacion = observacion;
  pago.historial = [
    ...(pago.historial || []),
    { estado: nuevoEstado, fecha: ahora, usuario: usuario._id, observacion: observacion || null },
  ];
  await pago.save();

  if (aprobar && solicitud && solicitud.estado !== 'Pagada') {
    solicitud.estado = 'Pagada';
    await solicitud.save();
  }

  // Eventos: instrucciones de muestra al aprobar; motivo al rechazar (RF-12).
  await emitir(aprobar ? 'pagoAprobado' : 'pagoRechazado', {
    pago,
    solicitud,
    cotizacion,
    cupon: pago.cupon,
    motivo: observacion || null,
  });

  return { pago, solicitud };
};

// ===== Bandeja de pendientes (más antiguo primero) =====
const bandejaPendientes = ({ pagina, limite } = {}) =>
  paginar({
    Model: Pago,
    filtro: { estado: 'Pendiente de verificación' },
    populate: [
      {
        path: 'cupon',
        populate: {
          path: 'cotizacion',
          populate: { path: 'solicitud', select: 'codigoPresolicitud estado usuario' },
        },
      },
    ],
    pagina,
    limite,
    orden: 'fechaCarga',
    dir: 'asc',
  });

// ===== "Mis pagos" del cliente (con historial) =====
const misPagos = async (filtro = {}) => {
  const data = await Pago.find(filtro)
    .populate({ path: 'cupon', populate: { path: 'cotizacion', select: 'numeroCotizacion valorTotal' } })
    .sort({ fechaCarga: -1 });
  return { total: data.length, data };
};

export { registrarPago, verificarPago, bandejaPendientes, misPagos };
