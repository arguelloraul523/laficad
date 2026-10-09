import asyncHandler from '../utils/asyncHandler.js';
import crudFactory from '../utils/crudFactory.js';
import { codigoMuestra } from '../services/codigos.service.js';
import { esSenaExonerado } from '../services/sena.service.js';
import { transicionValida } from '../constants/estados.js';
import Muestra from '../models/Muestra.js';
import HistorialMuestra from '../models/HistorialMuestra.js';
import Solicitud from '../models/Solicitud.js';

// ===== Muestras =====
const crearMuestra = asyncHandler(async (req, res) => {
  const solicitud = await Solicitud.findById(req.body.solicitud).populate('usuario');
  if (!solicitud) return res.status(404).json({ ok: false, mensaje: 'Solicitud no encontrada' });

  // Regla inviolable RF-09: sin pago aprobado o exoneración NO se recibe la muestra.
  // Una cotización exonerada (SENA verificado) deja la solicitud en "Pagada" al
  // ser aceptada, por lo que este mismo control deja pasar al usuario SENA.
  if (solicitud.estado !== 'Pagada') {
    return res.status(409).json({
      ok: false,
      mensaje: `La solicitud debe estar pagada para recibir la muestra (estado: ${solicitud.estado})`,
    });
  }

  // El código y la prioridad dependen del tipo de usuario de la solicitud (RF-18).
  const esSena = await esSenaExonerado(solicitud.usuario);
  const codigo = await codigoMuestra(solicitud.usuario);
  const prioridad = esSena ? 'A1' : 'A2';

  const muestra = await Muestra.create({ ...req.body, codigoMuestra: codigo, prioridad });
  res.status(201).json({ ok: true, data: muestra });
});

// Cambia la etapa de la muestra y registra el movimiento en el historial
const cambiarEtapa = asyncHandler(async (req, res) => {
  const { etapaActual } = req.body;

  const muestra = await Muestra.findById(req.params.id);
  if (!muestra) return res.status(404).json({ ok: false, mensaje: 'Registro no encontrado' });

  const etapaAnterior = muestra.etapaActual;

  // Transición de etapa válida (409 si no lo es).
  if (!transicionValida('etapa', etapaAnterior, etapaActual)) {
    return res.status(409).json({
      ok: false,
      mensaje: `Transición inválida de "etapaActual": ${etapaAnterior} → ${etapaActual}`,
    });
  }

  muestra.etapaActual = etapaActual;
  await muestra.save();

  await HistorialMuestra.create({
    muestra: muestra._id,
    usuario: req.usuario._id,
    accion: 'Cambio de etapa',
    etapa: etapaActual,
    valorAnterior: etapaAnterior,
    valorNuevo: etapaActual,
  });

  res.json({ ok: true, data: muestra });
});

const muestras = {
  ...crudFactory(Muestra, ['solicitud', 'recepcionista', 'analista', 'examenes.examen']),
  crear: crearMuestra,
  cambiarEtapa,
};

// Historial de solo lectura (RF-24): sin actualizar ni eliminar.
// Las inserciones las realiza la capa de servicios/modelo, nunca la API.
const historialCrud = crudFactory(HistorialMuestra, ['muestra', 'usuario']);

const historial = {
  listar: historialCrud.listar,
  obtener: historialCrud.obtener,
};

export { muestras, historial };
