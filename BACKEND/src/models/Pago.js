import mongoose from 'mongoose';

const ESTADOS_PAGO = ['Pendiente de verificación', 'Pagado', 'Rechazado'];

// Subdocumento de auditoría: cada cambio de estado del pago queda registrado.
// Solo lo escribe el servidor (append); el cliente nunca lo envía (regla #12).
const historialPagoSchema = new mongoose.Schema(
  {
    estado: { type: String, enum: ESTADOS_PAGO, required: true },
    fecha: { type: Date, default: Date.now },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
    observacion: { type: String, default: null },
  },
  { _id: false }
);

// Pago reportado por el cliente (pendiente de verificación por el laboratorio)
const pagoSchema = new mongoose.Schema(
  {
    cupon: { type: mongoose.Schema.Types.ObjectId, ref: 'CuponPago', required: true },
    verificadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
    metodo: {
      type: String,
      enum: ['Consignación bancaria', 'Transferencia electrónica', 'Efectivo en caja SENA'],
      required: true,
    },
    archivoComprobante: { type: String, default: null },
    numeroReciboCaja: { type: String, trim: true },
    fechaPagoReportada: { type: Date, required: true },
    valorReportado: { type: Number, required: true, min: 0 },
    estado: { type: String, enum: ESTADOS_PAGO, default: 'Pendiente de verificación' },
    fechaCarga: { type: Date, default: Date.now },
    fechaRevision: { type: Date, default: null },
    observacion: { type: String },
    // Historial de cambios (estado, fecha, quién y observación) - solo servidor.
    historial: { type: [historialPagoSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Pago', pagoSchema);
