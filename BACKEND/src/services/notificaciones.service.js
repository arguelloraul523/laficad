import Notificacion from '../models/Notificacion.js';
import Usuario from '../models/Usuario.js';
import { enviarCorreo } from '../utils/mailer.js';

// ============================================================
// Notificaciones del módulo de pagos (RF-09, RF-12, RF-33).
// Se suscriben a los eventos "pagoAprobado" y "pagoRechazado"
// desde services/pagos.service.js.
//
// RF-12: al aprobar el pago se envían las INSTRUCCIONES DE MUESTRA
// (cantidad, envase, temperatura y tiempo máximo de traslado)
// tomadas del Examen asociado a cada ítem de la cotización.
// ============================================================

// Instrucciones de muestra desde los exámenes de la cotización (snapshot).
const instruccionesDeMuestra = (cotizacion) =>
  (cotizacion?.detalles || [])
    .map((detalle) => {
      const examen = detalle.examen;
      if (!examen) return null; // examen eliminado del catálogo
      return {
        examen: examen.nombre,
        muestrasSolicitadas: detalle.cantidadMuestras,
        cantidad: `${examen.cantidadRequerida} ${examen.unidadMedida}`,
        envase: examen.tipoEnvase,
        temperatura: examen.temperaturaConservacion || 'Ambiente',
        tiempoMaxTrasladoHoras:
          typeof examen.tiempoMaxTrasladoHoras === 'number' ? examen.tiempoMaxTrasladoHoras : null,
      };
    })
    .filter(Boolean);

// Texto plano de las instrucciones (correo y notificación App).
const textoInstrucciones = (instrucciones) =>
  instrucciones
    .map(
      (i, n) =>
        `${n + 1}. ${i.examen}\n` +
        `   Cantidad: ${i.cantidad} (${i.muestrasSolicitadas} muestra(s))\n` +
        `   Envase: ${i.envase}\n` +
        `   Temperatura de conservación: ${i.temperatura}\n` +
        `   Tiempo máximo de traslado: ${
          i.tiempoMaxTrasladoHoras === null ? 'No aplica' : `${i.tiempoMaxTrasladoHoras} hora(s)`
        }`
    )
    .join('\n\n');

// Guarda la notificación en la app e intenta el correo (opcional vía SMTP).
const avisar = async ({ usuario, solicitud, asunto, contenido }) => {
  await Notificacion.create({
    usuario: usuario._id,
    solicitud: solicitud ? solicitud._id : null,
    canal: 'App',
    asunto,
    contenido,
  });

  try {
    await enviarCorreo({ para: usuario.correo, asunto, texto: contenido });
  } catch (err) {
    // El correo es best-effort: la notificación en la app ya quedó registrada.
    console.error(`⚠️  No se pudo enviar el correo "${asunto}": ${err.message}`);
  }
};

// Carga el dueño de la solicitud (acepta `usuario` como id o ya poblado).
const duenioDe = async (solicitud) => {
  const id = solicitud.usuario?._id || solicitud.usuario;
  return Usuario.findById(id).select('nombres correo');
};

// Evento: pagoAprobado -> instrucciones de muestra (RF-12)
const notificarPagoAprobado = async ({ solicitud, cotizacion }) => {
  if (!solicitud) return;
  const usuario = await duenioDe(solicitud);
  if (!usuario) return;

  const instrucciones = instruccionesDeMuestra(cotizacion);
  const cuerpo =
    `Tu pago fue verificado y aprobado. Tu solicitud ${solicitud.codigoPresolicitud} ya está ` +
    `registrada como pagada; puedes acercarte a recepción para entregar tu muestra.\n\n` +
    `INSTRUCCIONES DE MUESTRA\n${textoInstrucciones(instrucciones) || 'Consulta el catálogo por detalle.'}`;

  await avisar({
    usuario,
    solicitud,
    asunto: 'Pago aprobado - instrucciones de muestra',
    contenido: cuerpo,
  });
};

// Evento: pagoRechazado -> notificación con el motivo (RF-09, RF-33)
const notificarPagoRechazado = async ({ solicitud, motivo }) => {
  if (!solicitud) return;
  const usuario = await duenioDe(solicitud);
  if (!usuario) return;

  const cuerpo =
    `Tu pago fue rechazado en la verificación manual.\n\n` +
    `Motivo: ${motivo || 'Sin observación registrada'}\n\n` +
    `Puedes reportar un nuevo comprobante desde "Mis pagos".`;

  await avisar({
    usuario,
    solicitud,
    asunto: 'Pago rechazado',
    contenido: cuerpo,
  });
};

export { instruccionesDeMuestra, notificarPagoAprobado, notificarPagoRechazado };
