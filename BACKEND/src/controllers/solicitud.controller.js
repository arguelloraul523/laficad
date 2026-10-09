import asyncHandler from '../utils/asyncHandler.js';
import fs from 'fs';
import path from 'path';
import crudFactory from '../utils/crudFactory.js';
import { codigoPresolicitud, codigoCotizacion } from '../services/codigos.service.js';
import { sugerirExamenes } from '../services/sugerencia.service.js';
import { calcularCotizacion } from '../services/cotizacion.service.js';
import { generarPdfCotizacion } from '../services/pdf.service.js';
import { emitirCupon } from '../services/cupones.service.js';
import { transicionValida } from '../constants/estados.js';
import { esCliente } from '../middlewares/propietario.middleware.js';
import Solicitud from '../models/Solicitud.js';
import Cotizacion from '../models/Cotizacion.js';
import Examen from '../models/Examen.js';
import { fileURLToPath } from 'url';

// En ESM no existe __dirname: se deriva de la ubicación del módulo.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Convierte los ids enviados por el cliente en subdocumentos con precio de catálogo.
// El precio NUNCA llega del cliente: lo lee el servidor (RF-06, regla #11).
const cargarExamenes = async (ids = [], idsSugeridos = []) => {
  const unicos = [...new Set((ids || []).map(String))];
  if (unicos.length === 0) return [];

  const examenes = await Examen.find({ _id: { $in: unicos }, activo: true });
  const porId = new Map(examenes.map((e) => [String(e._id), e]));
  const faltantes = unicos.filter((id) => !porId.has(id));

  if (faltantes.length > 0) {
    const error = new Error(`Exámenes no válidos o inactivos: ${faltantes.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  return unicos.map((id) => {
    const examen = porId.get(id);
    return {
      examen: examen._id,
      origen: idsSugeridos.includes(id) ? 'Sugerido' : 'Manual',
      precioUnitario: examen.precio, // snapshot al momento de elegir
    };
  });
};

// ===== Solicitudes =====
const crearSolicitud = asyncHandler(async (req, res) => {
  const codigo = await codigoPresolicitud();

  // Batería sugerida (RF-16): siempre se devuelve, aunque el cliente no envíe lista.
  const sugerencias = await sugerirExamenes({
    tipoMuestra: req.body.tipoMuestra,
    categoria: req.body.categoria,
    descripcionMuestra: req.body.descripcionMuestra,
    limite: req.body.limite,
  });

  // Lista final: la que el cliente confirma (ajustada). Si no envía nada, queda vacía.
  const examenes = await cargarExamenes(
    Array.isArray(req.body.examenes) ? req.body.examenes : [],
    sugerencias.map((s) => String(s.examen))
  );

  const datos = { ...req.body, codigoPresolicitud: codigo, examenes };
  if (esCliente(req)) datos.usuario = req.usuario._id;

  const solicitud = await Solicitud.create(datos);
  res.status(201).json({ ok: true, data: solicitud, sugerencias });
});

// Sugiere análisis según tipo de muestra, categoría y palabras de la descripción.
const sugerencias = asyncHandler(async (req, res) => {
  const data = await sugerirExamenes({
    tipoMuestra: req.body.tipoMuestra,
    categoria: req.body.categoria,
    descripcionMuestra: req.body.descripcionMuestra,
    limite: req.body.limite,
  });
  res.json({ ok: true, total: data.length, data });
});

const solicitudes = {
  ...crudFactory(Solicitud, ['usuario', 'tipoMuestra', 'examenes.examen']),
  crear: crearSolicitud,
  sugerencias,
};

// ===== Cotizaciones =====

// Carpeta donde viven las firmas digitales (uploads/firmas/<cotizacion>.png)
const CARPETA_FIRMAS = path.join(__dirname, '..', '..', 'uploads', 'firmas');
const RE_BASE64_IMG = /^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
const MAX_FIRMA_BASE64 = 800_000; // ~600 KB en binario

// Decodifica la firma del canvas y la guarda como archivo. Devuelve la ruta relativa.
const guardarFirma = (firmaImagen, cotizacionId) => {
  const match = RE_BASE64_IMG.exec(String(firmaImagen || ''));
  if (!match) {
    const error = new Error('La firma debe ser una imagen en base64 (data:image/png;base64,...)');
    error.statusCode = 400;
    throw error;
  }
  if (match[2].length > MAX_FIRMA_BASE64) {
    const error = new Error('La imagen de la firma supera el tamaño máximo (600 KB)');
    error.statusCode = 400;
    throw error;
  }

  fs.mkdirSync(CARPETA_FIRMAS, { recursive: true });
  const nombre = `firma-${cotizacionId}.png`;
  fs.writeFileSync(path.join(CARPETA_FIRMAS, nombre), Buffer.from(match[2], 'base64'));
  return `firmas/${nombre}`;
};

// Crear cotización: calcula en el servidor y guarda el PDF (RF-06).
const crearCotizacion = asyncHandler(async (req, res) => {
  const { solicitud, detalles, valorTotal, exonerada } = await calcularCotizacion({
    solicitud: req.body.solicitud,
    examenes: req.body.examenes,
  });

  // Solo se puede cotizar una solicitud en estado inicial (409 en caso contrario).
  if (!transicionValida('solicitud', solicitud.estado, 'Cotizada')) {
    return res.status(409).json({
      ok: false,
      mensaje: `Transición inválida de "estado": ${solicitud.estado} → Cotizada`,
    });
  }

  const numeroCotizacion = await codigoCotizacion();
  const cotizacion = await Cotizacion.create({
    solicitud: solicitud._id,
    numeroCotizacion,
    detalles,
    valorTotal,
    exonerada,
  });

  await cotizacion.populate('detalles.examen');
  const archivoPdf = await generarPdfCotizacion(cotizacion, solicitud);
  cotizacion.archivoPdf = archivoPdf;
  await cotizacion.save();

  solicitud.estado = 'Cotizada';
  await solicitud.save();

  res.status(201).json({ ok: true, data: cotizacion });
});

// Descarga el PDF: solo el dueño de la solicitud o el Administrador (la ruta lo valida).
const descargarPdf = asyncHandler(async (req, res) => {
  const cotizacion = await Cotizacion.findById(req.params.id);
  if (!cotizacion) return res.status(404).json({ ok: false, mensaje: 'Registro no encontrado' });
  if (!cotizacion.archivoPdf) {
    return res.status(404).json({ ok: false, mensaje: 'El PDF de la cotización no está disponible' });
  }

  const ruta = path.join(
    __dirname,
    '..',
    '..',
    'uploads',
    'cotizaciones',
    path.basename(cotizacion.archivoPdf)
  );
  if (!fs.existsSync(ruta)) {
    return res.status(404).json({ ok: false, mensaje: 'El PDF de la cotización no está disponible' });
  }

  res.download(ruta, `${cotizacion.numeroCotizacion}.pdf`);
});

// Aceptar cotización con firma digital (RF-13) + emisión del cupón (RF-09).
const aceptarCotizacion = asyncHandler(async (req, res) => {
  const cotizacion = await Cotizacion.findById(req.params.id);
  if (!cotizacion) return res.status(404).json({ ok: false, mensaje: 'Registro no encontrado' });

  const solicitud = await Solicitud.findById(cotizacion.solicitud).populate('usuario');
  if (!solicitud) return res.status(404).json({ ok: false, mensaje: 'Registro no encontrado' });

  // Una cotización solo se puede aceptar una vez (409 si ya está decidida).
  if (!transicionValida('cotizacion', cotizacion.estado, 'Aceptada')) {
    return res.status(409).json({
      ok: false,
      mensaje: `Transición inválida de "estado": ${cotizacion.estado} → Aceptada`,
    });
  }

  // Exonerada (SENA verificado) pasa a Pagada; el externo queda a la espera del cupón.
  const destino = cotizacion.exonerada ? 'Pagada' : 'Pendiente de pago';
  if (!transicionValida('solicitud', solicitud.estado, destino)) {
    return res.status(409).json({
      ok: false,
      mensaje: `Transición inválida de "estado": ${solicitud.estado} → ${destino}`,
    });
  }

  // Firma digital: imagen del canvas + términos + nombre y documento (RF-13).
  const firmaImagen = guardarFirma(req.body.firmaImagen, String(cotizacion._id));
  const autorizacion = {
    nombreFirmante: req.body.nombreFirmante,
    documentoFirmante: req.body.documentoFirmante,
    firmaImagen,
    aceptaTerminos: true,
    fechaHoraFirma: new Date(),
    ip: req.ip,
  };

  // Cupón: solo si NO está exonerada; un solo cupón y cuentas activas (RF-09).
  const cupon = cotizacion.exonerada ? null : await emitirCupon({ cotizacion });

  cotizacion.estado = 'Aceptada';
  await cotizacion.save();

  solicitud.estado = destino;
  solicitud.autorizacion = autorizacion;
  if (cotizacion.exonerada) solicitud.exonerada = true;
  await solicitud.save();

  res.json({ ok: true, data: cotizacion, autorizacion, cupon, solicitud });
});

const cotizaciones = {
  ...crudFactory(Cotizacion, ['solicitud', 'detalles.examen']),
  crear: crearCotizacion,
  aceptar: aceptarCotizacion,
  descargarPdf,
};

export { solicitudes, cotizaciones };
