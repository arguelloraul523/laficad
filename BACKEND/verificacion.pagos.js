// ============================================================
// Verificación del módulo de pagos SIN conectar a MongoDB.
// Uso:  node verificacion.pagos.js   (sale con código 1 si algo falla)
// No forma parte de la aplicación; solo replica las reglas con
// dobles en memoria. Los casos HTTP están en API_TEST.http (43-46c).
// ============================================================
import { validationResult } from 'express-validator';
import { validarRegistrarPago, validarVerificarPago } from './src/validators/pago.validators.js';
import { instruccionesDeMuestra } from './src/services/notificaciones.service.js';
import { suscribir, emitir } from './src/services/eventos.service.js';
import { sanitizarBody } from './src/constants/camposPermitidos.js';
import { transicionValida } from './src/constants/estados.js';
import Pago from './src/models/Pago.js';
import CuponPago from './src/models/CuponPago.js';
import Solicitud from './src/models/Solicitud.js';
import Notificacion from './src/models/Notificacion.js';
import Usuario from './src/models/Usuario.js';
import * as pagos from './src/services/pagos.service.js';
import * as notifs from './src/services/notificaciones.service.js';

let total = 0;
let fallos = 0;
const ok = (c, m) => { total++; if (c) console.log('ok: ' + m); else { fallos++; console.log('FALLO: ' + m); } };
const correr = async (cadena, body) => {
  const req = { body };
  for (const c of cadena) await c.run(req);
  return validationResult(req);
};
const run = (valor) => ({ populate: () => Promise.resolve(valor), select: () => Promise.resolve(valor) });

(async () => {
  // ---- 1) Validadores (11) ----
  const base = { cupon: '507f1f77bcf86cd799439011', fechaPagoReportada: '2026-10-09', valorReportado: 50000 };
  let r = await correr(validarRegistrarPago, { ...base, metodo: 'Consignación bancaria' });
  ok(!r.isEmpty(), 'consignacion sin comprobante -> 400');
  r = await correr(validarRegistrarPago, { ...base, metodo: 'Consignación bancaria', archivoComprobante: 'c.pdf' });
  ok(r.isEmpty(), 'consignacion con comprobante -> pasa');
  r = await correr(validarRegistrarPago, { ...base, metodo: 'Efectivo en caja SENA' });
  ok(!r.isEmpty(), 'efectivo sin numeroReciboCaja -> 400');
  r = await correr(validarRegistrarPago, { ...base, metodo: 'Efectivo en caja SENA', numeroReciboCaja: 'RC-1' });
  ok(r.isEmpty(), 'efectivo con numeroReciboCaja -> pasa');
  r = await correr(validarRegistrarPago, { cupon: 'x', metodo: 'Tarjeta', fechaPagoReportada: 'ayer', valorReportado: -1 });
  ok(r.array().length >= 4, 'metodo/cupon/fecha/valor invalidos -> 4+ errores');
  r = await correr(validarVerificarPago, { aprobar: false });
  ok(!r.isEmpty(), 'rechazar sin observacion -> 400');
  r = await correr(validarVerificarPago, { aprobar: false, observacion: 'motivo' });
  ok(r.isEmpty(), 'rechazar con observacion -> pasa');
  r = await correr(validarVerificarPago, { aprobar: true });
  ok(r.isEmpty(), 'aprobar sin observacion -> pasa');
  const instr = instruccionesDeMuestra({ detalles: [
    { cantidadMuestras: 2, examen: { nombre: 'Sulfato', cantidadRequerida: 250, unidadMedida: 'mL', tipoEnvase: 'Frasco', temperaturaConservacion: '2-8 C', tiempoMaxTrasladoHoras: 6 } },
    { cantidadMuestras: 1, examen: null },
  ] });
  ok(instr.length === 1, 'detalles con examen nulo se ignoran');
  ok(instr[0].cantidad === '250 mL' && instr[0].envase === 'Frasco' && instr[0].temperatura === '2-8 C' && instr[0].tiempoMaxTrasladoHoras === 6, 'cantidad/envase/temperatura/tiempoMaxTraslado');
  let llamado = 0;
  suscribir('pagoAprobado', async () => { llamado++; throw new Error('fallo SMTP simulado'); });
  await emitir('pagoAprobado', {});
  ok(llamado === 1, 'emitir no rechaza aunque el manejador falle');

  // ---- 2) Whitelist y transiciones (9) ----
  const limpio = sanitizarBody({ estado: 'Pagado', historial: [{}], fechaCarga: 1, fechaRevision: 1, verificadoPor: 'x', observacion: 'o', valorReportado: 1000 });
  ok(!('estado' in limpio) && !('historial' in limpio) && !('fechaCarga' in limpio) && !('fechaRevision' in limpio) && !('verificadoPor' in limpio), 'campos de servidor bloqueados');
  ok('observacion' in limpio && 'valorReportado' in limpio, 'campos del cliente conservados');
  ok(transicionValida('pago', 'Pendiente de verificación', 'Pagado'), 'Pendiente -> Pagado');
  ok(transicionValida('pago', 'Pendiente de verificación', 'Rechazado'), 'Pendiente -> Rechazado');
  ok(!transicionValida('pago', 'Pagado', 'Rechazado'), 'Pagado -> Rechazado invalido');
  ok(!transicionValida('pago', 'Rechazado', 'Pagado'), 'Rechazado -> Pagado invalido');
  ok(transicionValida('solicitud', 'Pendiente de pago', 'Pagada'), 'Solicitud Pendiente de pago -> Pagada');
  ok(!transicionValida('solicitud', 'Pagada', 'Pagada'), 'Solicitud Pagada no repite transicion');
  ok(!transicionValida('solicitud', 'Cancelada', 'Pagada'), 'Cancelada -> Pagada invalido');

  // ---- 3) Servicio con modelos dobles (18) ----
  const cuponDueno = { _id: 'c1', fechaLimitePago: new Date(Date.now() + 86400000), cotizacion: { solicitud: { usuario: 'cliente1' } } };
  const cuponVencido = { _id: 'c2', fechaLimitePago: new Date(Date.now() - 86400000), cotizacion: cuponDueno.cotizacion };
  CuponPago.findById = (id) => run(id === 'c2' ? cuponVencido : cuponDueno);
  Pago.create = async (d) => ({ _id: 'nuevo', ...d, save: async () => {} });

  try { await pagos.registrarPago({ body: { cupon: 'c2', metodo: 'Efectivo en caja SENA' }, usuario: { _id: 'cliente1' }, esCliente: true }); ok(false, 'cupon vencido -> 409'); }
  catch (e) { ok(e.statusCode === 409 && /venció/.test(e.message), 'cupon vencido -> 409'); }
  try { await pagos.registrarPago({ body: { cupon: 'c1', metodo: 'Efectivo en caja SENA' }, usuario: { _id: 'otro' }, esCliente: true }); ok(false, 'cupon ajeno -> 403'); }
  catch (e) { ok(e.statusCode === 403, 'cupon ajeno -> 403'); }
  const creado = await pagos.registrarPago({
    body: { cupon: 'c1', metodo: 'Efectivo en caja SENA', numeroReciboCaja: 'RC-9', fechaPagoReportada: new Date().toISOString(), valorReportado: 150000, estado: 'Pagado', historial: [{ estado: 'Pagado' }] },
    usuario: { _id: 'cliente1' }, esCliente: true,
  });
  ok(creado.estado === 'Pendiente de verificación', 'estado inicial forzado por el servidor');
  ok(creado.historial.length === 1 && creado.historial[0].estado === 'Pendiente de verificación', 'historial[0] del reporte');
  ok(creado.fechaCarga instanceof Date && creado.verificadoPor === null, 'fechaCarga y verificadoPor en null');
  ok(creado.valorReportado === 150000 && creado.numeroReciboCaja === 'RC-9', 'valor y recibo conservados');

  Pago.findById = () => run({ estado: 'Pagado', historial: [], save: async function () {} });
  try { await pagos.verificarPago({ id: 'x', aprobar: false, observacion: '', usuario: { _id: 'a' } }); ok(false, 'rechazo sin observacion -> 400'); }
  catch (e) { ok(e.statusCode === 400, 'rechazo sin observacion -> 400'); }
  try { await pagos.verificarPago({ id: 'x', aprobar: true, usuario: { _id: 'a' } }); ok(false, 'verificar sin Pendiente -> 409'); }
  catch (e) { ok(e.statusCode === 409 && /Transición inválida/.test(e.message), 'verificar sin Pendiente -> 409'); }

  const eventos = [];
  suscribir('pagoAprobado', (d) => eventos.push(['aprobado', d]));
  suscribir('pagoRechazado', (d) => eventos.push(['rechazado', d]));

  // Dobles de usuario/notificación (evitan cualquier acceso a la BD).
  const creadas = [];
  Notificacion.create = async (d) => { creadas.push(d); return d; };
  Usuario.findById = (id) => ({ select: () => Promise.resolve({ _id: id, nombres: 'Ana', correo: 'ana@x.com' }) });

  let solicitud = { _id: 's1', estado: 'Pendiente de pago', usuario: 'cliente1', save: async function () { this.guardada = true; } };
  Solicitud.findById = () => run(solicitud);
  Pago.findById = () => run({ estado: 'Pendiente de verificación', historial: [], cupon: { cotizacion: { detalles: [], solicitud: 's1' } }, save: async function () {} });
  const res = await pagos.verificarPago({ id: 'x', aprobar: true, usuario: { _id: 'admin1' } });
  ok(res.pago.estado === 'Pagado' && res.pago.verificadoPor === 'admin1' && res.pago.fechaRevision instanceof Date, 'aprobar guarda estado/verificadoPor/fechaRevision');
  ok(res.pago.historial.length === 1 && res.pago.historial[0].estado === 'Pagado', 'historial de la aprobacion');
  ok(res.solicitud.estado === 'Pagada' && res.solicitud.guardada, 'Solicitud avanzo a Pagada');
  ok(eventos.some(([n]) => n === 'aprobado') && eventos.find(([n]) => n === 'aprobado')[1].solicitud.usuario === 'cliente1', 'evento pagoAprobado con solicitud');

  solicitud = { _id: 's1', estado: 'Pendiente de pago', usuario: 'cliente1', save: async function () { this.guardada = true; } };
  Pago.findById = () => run({ estado: 'Pendiente de verificación', historial: [], cupon: { cotizacion: { detalles: [], solicitud: 's1' } }, save: async function () {} });
  const res4 = await pagos.verificarPago({ id: 'x', aprobar: false, observacion: 'No coincide con el cupon', usuario: { _id: 'admin1' } });
  ok(res4.pago.estado === 'Rechazado' && res4.pago.observacion === 'No coincide con el cupon', 'rechazo guarda estado y observacion');
  ok(res4.solicitud.estado === 'Pendiente de pago' && !res4.solicitud.guardada, 'rechazo NO cambia la solicitud');
  const rech = eventos.find(([n]) => n === 'rechazado');
  ok(!!rech && rech[1].motivo === 'No coincide con el cupon', 'evento pagoRechazado con motivo');
  ok(typeof pagos.bandejaPendientes === 'function' && typeof pagos.misPagos === 'function', 'bandejaPendientes y misPagos exportados');

  // ---- 4) Bandeja y mis pagos (5) ----
  const captura = {};
  const docs = [{ _id: 'p2', fechaCarga: new Date('2026-10-05') }, { _id: 'p1', fechaCarga: new Date('2026-10-01') }];
  Pago.countDocuments = async (f) => { captura.filtro = f; return docs.length; };
  Pago.find = (f) => { captura.filtroF = f;
    const q = { skip: () => q, limit: () => q, populate: () => q, sort: (s) => { captura.orden = s; return Promise.resolve(docs); } };
    return q; };
  const b = await pagos.bandejaPendientes({ pagina: 1, limite: 10 });
  ok(JSON.stringify(captura.filtro) === JSON.stringify({ estado: 'Pendiente de verificación' }), 'bandeja filtra pendientes');
  ok(captura.orden && captura.orden.fechaCarga === 1, 'bandeja ordena por antiguedad (asc)');
  ok(b.total === 2 && b.data.length === 2 && b.pagina === 1, 'bandeja paginada');
  Pago.find = (f) => { captura.alcance = f; const q = { populate: () => q, sort: async () => docs }; return q; };
  const m = await pagos.misPagos({ cupon: { $in: ['c1'] } });
  ok(JSON.stringify(captura.alcance) === JSON.stringify({ cupon: { $in: ['c1'] } }), 'misPagos aplica el alcance del cliente');
  ok(m.total === 2 && m.data.length === 2, 'misPagos devuelve total y data');

  // ---- 5) Notificadores (7) ----
  creadas.length = 0;

  const solicitudDoble = { _id: 's1', codigoPresolicitud: 'PRE-2026-0001', usuario: 'u1' };
  await notifs.notificarPagoAprobado({ solicitud: solicitudDoble, cotizacion: { detalles: [
    { cantidadMuestras: 2, examen: { nombre: 'Sulfato', cantidadRequerida: 250, unidadMedida: 'mL', tipoEnvase: 'Frasco de vidrio', temperaturaConservacion: '2-8 C', tiempoMaxTrasladoHoras: 6 } },
  ] } });
  ok(creadas.length === 1, 'pagoAprobado crea 1 Notificacion');
  const n1 = creadas[0];
  ok(n1.usuario === 'u1' && n1.canal === 'App' && n1.solicitud === 's1', 'Notificacion con usuario/canal App/solicitud');
  ok(n1.asunto.includes('aprobado'), 'asunto del pago aprobado');
  ok(n1.contenido.includes('250 mL') && n1.contenido.includes('Frasco de vidrio') && n1.contenido.includes('2-8 C') && n1.contenido.includes('6 hora(s)'), 'incluye cantidad, envase, temperatura y tiempo maximo de traslado (RF-12)');

  // usuario ya poblado (objeto con _id) tambien se resuelve
  await notifs.notificarPagoRechazado({ solicitud: { _id: 's2', usuario: { _id: 'u9' } }, motivo: 'Valor no coincide' });
  const n2 = creadas[1];
  ok(!!n2 && n2.usuario === 'u9' && n2.contenido.includes('Valor no coincide') && n2.contenido.includes('rechazado'), 'pagoRechazado notifica el motivo (acepta usuario poblado)');

  // sin solicitud no notifica
  await notifs.notificarPagoAprobado({ solicitud: null });
  ok(creadas.length === 2, 'sin solicitud no crea notificacion');

  // usuario inexistente -> tampoco
  Usuario.findById = () => ({ select: () => Promise.resolve(null) });
  await notifs.notificarPagoAprobado({ solicitud: { _id: 's3', usuario: 'u404' } });
  ok(creadas.length === 2, 'usuario inexistente no rompe ni notifica');

  console.log(`\n${total} aserciones, ${fallos} fallos`);
  process.exit(fallos ? 1 : 0);
})();
