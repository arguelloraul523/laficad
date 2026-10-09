import asyncHandler from '../utils/asyncHandler.js';
import Solicitud from '../models/Solicitud.js';
import Cotizacion from '../models/Cotizacion.js';
import CuponPago from '../models/CuponPago.js';
import Muestra from '../models/Muestra.js';

// ============================================================
// Propiedad de los registros: el Cliente solo accede a lo suyo.
// - filtrarPropios(alcance): en listados, deja un filtro Mongo en req.alcance.
// - exigirPropietario(Model, alcance): en detalle/edición, responde 403.
// El personal (Administrador, Recepcionista, Analista) no se ve limitado aquí.
// ============================================================

const esCliente = (req) => req.usuario?.rol?.nombre === 'Cliente';

const idsDe = (Model, filtro) => Model.find(filtro).distinct('_id');

// Filtros Mongo por entidad (cadena hasta el usuario dueño de la solicitud).
const alcances = {
  solicitud: (usuarioId) => ({ usuario: usuarioId }),
  cotizacion: async (usuarioId) => ({
    solicitud: { $in: await idsDe(Solicitud, alcances.solicitud(usuarioId)) },
  }),
  cupon: async (usuarioId) => ({
    cotizacion: { $in: await idsDe(Cotizacion, await alcances.cotizacion(usuarioId)) },
  }),
  pago: async (usuarioId) => ({
    cupon: { $in: await idsDe(CuponPago, await alcances.cupon(usuarioId)) },
  }),
  muestra: async (usuarioId) => ({
    solicitud: { $in: await idsDe(Solicitud, alcances.solicitud(usuarioId)) },
  }),
  informe: async (usuarioId) => ({
    muestra: { $in: await idsDe(Muestra, await alcances.muestra(usuarioId)) },
  }),
  encuesta: async (usuarioId) => ({
    solicitud: { $in: await idsDe(Solicitud, alcances.solicitud(usuarioId)) },
  }),
  notificacion: (usuarioId) => ({ usuario: usuarioId }),
  inconformidad: (usuarioId) => ({ usuario: usuarioId }),
};

// Listados: solo el Cliente queda acotado a sus registros.
const filtrarPropios = (alcance) =>
  asyncHandler(async (req, res, next) => {
    req.alcance = esCliente(req) ? await alcance(req.usuario._id) : {};
    next();
  });

// Detalle/edición: si el Cliente no es dueño, 403 (no se filtra la existencia).
const exigirPropietario = (Model, alcance) =>
  asyncHandler(async (req, res, next) => {
    if (esCliente(req)) {
      const filtro = { _id: req.params.id, ...(await alcance(req.usuario._id)) };
      const doc = await Model.findOne(filtro);
      if (!doc) {
        return res.status(403).json({ ok: false, mensaje: 'No tienes acceso a este registro' });
      }
    }
    next();
  });

// Al crear, un Cliente no puede suplantar a otro usuario.
const fijarUsuarioPropio = (campo = 'usuario') =>
  (req, res, next) => {
    if (esCliente(req)) {
      req.body = req.body || {};
      req.body[campo] = req.usuario._id;
    }
    next();
  };

export { esCliente, alcances, filtrarPropios, exigirPropietario, fijarUsuarioPropio };
