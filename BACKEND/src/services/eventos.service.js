import { EventEmitter } from 'events';

// ============================================================
// Bus de eventos del dominio (decisión 2026-10-09).
// Eventos del módulo de pagos:
//   - pagoAprobado  -> instrucciones de muestra al cliente (RF-12)
//   - pagoRechazado -> notificación con el motivo (RF-09, RF-33)
// emitir() nunca rechaza: un fallo al notificar no debe romper la
// respuesta HTTP de quien verificó el pago.
// ============================================================

const emisor = new EventEmitter();
emisor.setMaxListeners(50);

// Suscribe un manejador a un evento.
const suscribir = (evento, manejador) => emisor.on(evento, manejador);

// Emite un evento y espera a todos sus manejadores (async incluidos).
const emitir = async (evento, datos) => {
  try {
    const resultados = emisor
      .listeners(evento)
      .map((manejador) => {
        try {
          return Promise.resolve(manejador(datos));
        } catch (err) {
          return Promise.reject(err);
        }
      });
    await Promise.all(resultados);
  } catch (err) {
    console.error(`⚠️  Evento "${evento}" falló: ${err.message}`);
  }
};

export { suscribir, emitir };
