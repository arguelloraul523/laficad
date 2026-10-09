import Solicitud from '../models/Solicitud.js';
import Examen from '../models/Examen.js';
import { esSenaExonerado } from './sena.service.js';

// ============================================================
// Cálculo de la cotización (RF-06).
// - Toma exámenes y cantidades (los de la pre-solicitud si no se envían).
// - Usa el precio VIGENTE del catálogo y lo guarda como SNAPSHOT en detalles.
// - Usuario SENA verificado -> valorTotal 0 y exonerada true (RF-02, RF-06).
// El precio NUNCA llega del cliente.
// ============================================================

const errorCon = (statusCode, mensaje) => {
  const err = new Error(mensaje);
  err.statusCode = statusCode;
  return err;
};

const calcularCotizacion = async ({ solicitud, examenes = [] } = {}) => {
  if (!solicitud) throw errorCon(400, 'La solicitud es obligatoria');

  const doc = await Solicitud.findById(solicitud)
    .populate('usuario')
    .populate('tipoMuestra');
  if (!doc) throw errorCon(404, 'Solicitud no encontrada');

  // Lista base: la enviada por el cliente o la confirmada en la pre-solicitud.
  const entradas =
    Array.isArray(examenes) && examenes.length > 0
      ? examenes.map((x) => ({
          examen: String(x.examen),
          cantidad: Number(x.cantidadMuestras) || 1,
        }))
      : (doc.examenes || []).map((x) => ({ examen: String(x.examen), cantidad: 1 }));

  if (entradas.length === 0) throw errorCon(400, 'La cotización requiere al menos un examen');

  const ids = [...new Set(entradas.map((e) => e.examen))];
  const catalogo = await Examen.find({ _id: { $in: ids }, activo: true });
  const porId = new Map(catalogo.map((e) => [String(e._id), e]));
  const faltantes = ids.filter((id) => !porId.has(id));
  if (faltantes.length > 0) {
    throw errorCon(400, `Exámenes no válidos o inactivos: ${faltantes.join(', ')}`);
  }

  // Snapshot: precio del catálogo al momento de cotizar (no cambia después).
  const detalles = entradas.map(({ examen, cantidad }) => {
    const examenCat = porId.get(examen);
    return {
      examen: examenCat._id,
      cantidadMuestras: cantidad,
      precioUnitario: examenCat.precio,
    };
  });

  const bruto = detalles.reduce((suma, d) => suma + d.precioUnitario * d.cantidadMuestras, 0);
  const exonerada = await esSenaExonerado(doc.usuario);

  return {
    solicitud: doc,
    detalles,
    valorTotal: exonerada ? 0 : bruto,
    exonerada,
  };
};

export { calcularCotizacion };
