import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';

// En ESM no existe __dirname: se deriva de la ubicación del módulo.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// Generación del PDF de la cotización (RF-06).
// Se guarda en BACKEND/uploads/cotizaciones/ y solo es descargable
// por el dueño de la solicitud o por el Administrador.
// ============================================================

const CARPETA_COTIZACIONES = path.join(__dirname, '..', '..', 'uploads', 'cotizaciones');

const formatoCOP = (valor) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
    valor || 0
  );

const generarPdfCotizacion = (cotizacion, solicitud) =>
  new Promise((resolve, reject) => {
    try {
      fs.mkdirSync(CARPETA_COTIZACIONES, { recursive: true });
    } catch (error) {
      return reject(error);
    }

    const nombreArchivo = `${cotizacion.numeroCotizacion}.pdf`;
    const destino = path.join(CARPETA_COTIZACIONES, nombreArchivo);
    const stream = fs.createWriteStream(destino);
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });

    doc.pipe(stream);

    const cliente = solicitud?.usuario || {};
    const tipoMuestra = solicitud?.tipoMuestra?.nombre || '—';

    doc.fontSize(18).text('Laboratorio - Sistema de Gestión (SENA)', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(12).text('COTIZACIÓN DE ANÁLISIS', { align: 'center' });
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Número: ${cotizacion.numeroCotizacion}`);
    doc.text(`Fecha: ${new Date(cotizacion.fechaEmision).toLocaleString('es-CO')}`);
    doc.text(`Pre-solicitud: ${solicitud?.codigoPresolicitud || '—'}`);
    doc.text(`Cliente: ${[cliente.nombres, cliente.apellidos].filter(Boolean).join(' ') || '—'}`);
    doc.text(`Correo: ${cliente.correo || '—'}`);
    doc.text(`Tipo de muestra: ${tipoMuestra}`);
    doc.moveDown();

    doc.fontSize(11).text('Detalles', { underline: true });
    doc.moveDown(0.3);

    const columnas = { descripcion: doc.x, cantidad: 280, precio: 350, subtotal: 440 };
    doc.fontSize(10);
    doc.text('Examen', columnas.descripcion, doc.y, { width: 220 });
    doc.text('Cant.', columnas.cantidad, doc.y - 13, { width: 60 });
    doc.text('Precio unit.', columnas.precio, doc.y - 13, { width: 85 });
    doc.text('Subtotal', columnas.subtotal, doc.y - 13, { width: 90 });
    doc.moveDown(0.5);

    (cotizacion.detalles || []).forEach((detalle) => {
      const y = doc.y;
      const subtotal = detalle.precioUnitario * detalle.cantidadMuestras;
      doc.text(String(detalle.examen?.nombre || detalle.examen), columnas.descripcion, y, { width: 220 });
      doc.text(String(detalle.cantidadMuestras), columnas.cantidad, y, { width: 60 });
      doc.text(formatoCOP(detalle.precioUnitario), columnas.precio, y, { width: 85 });
      doc.text(formatoCOP(subtotal), columnas.subtotal, y, { width: 90 });
      doc.moveDown(0.4);
    });

    doc.moveDown();
    doc.fontSize(12);
    doc.text(`VALOR TOTAL: ${formatoCOP(cotizacion.valorTotal)}`, { align: 'right' });

    if (cotizacion.exonerada) {
      doc.moveDown(0.3);
      doc
        .fontSize(10)
        .text('Cotización exonerada por ser usuario SENA verificado (no aplica pago).', {
          align: 'right',
        });
    }

    doc.moveDown();
    doc.fontSize(9).fillColor('#555555').text(
      'Los precios corresponden al catálogo vigente al momento de cotizar (snapshot).',
      { align: 'left' }
    );

    doc.end();

    stream.on('finish', () => resolve(nombreArchivo));
    stream.on('error', reject);
  });

export { generarPdfCotizacion, CARPETA_COTIZACIONES };
