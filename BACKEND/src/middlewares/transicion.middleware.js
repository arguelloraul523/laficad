import asyncHandler from '../utils/asyncHandler.js';
import { transicionValida } from '../constants/estados.js';

// ============================================================
// Valida que el cambio de estado solicitado sea una transición permitida.
// Si es inválida responde 409 (criterio de cierre). Si es válida, habilita
// el campo para la whitelist de crudFactory (req.camposEstadoPermitidos).
//
// Uso: exigirTransicion(Solicitud, [{ campo: 'estado', maquina: 'solicitud' }])
//      exigirTransicion(Muestra, [
//        { campo: 'estado', maquina: 'muestra' },
//        { campo: 'etapaActual', maquina: 'etapa' },
//      ])
// ============================================================
const exigirTransicion = (Model, reglas) =>
  asyncHandler(async (req, res, next) => {
    const activas = reglas.filter((r) => req.body && req.body[r.campo] !== undefined);
    if (activas.length === 0) return next();

    const doc = await Model.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ ok: false, mensaje: 'Registro no encontrado' });
    }

    const permitidos = [];
    for (const { campo, maquina } of activas) {
      const actual = doc[campo];
      const nuevo = req.body[campo];
      if (nuevo === actual) continue; // sin cambio: no es una transición

      if (!transicionValida(maquina, actual, nuevo)) {
        return res.status(409).json({
          ok: false,
          mensaje: `Transición inválida de "${campo}": ${actual} → ${nuevo}`,
        });
      }
      permitidos.push(campo);
    }

    req.camposEstadoPermitidos = permitidos;
    next();
  });

export { exigirTransicion };
