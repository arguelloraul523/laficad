import mongoose from 'mongoose';

// Detalle de la cotización (antes DETALLE_COTIZACION, ahora embebido)
const detalleCotizacionSchema = new mongoose.Schema(
  {
    examen: { type: mongoose.Schema.Types.ObjectId, ref: 'Examen', required: true },
    cantidadMuestras: { type: Number, required: true, min: 1 },
    precioUnitario: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// Cotización enviada al cliente
const cotizacionSchema = new mongoose.Schema(
  {
    solicitud: { type: mongoose.Schema.Types.ObjectId, ref: 'Solicitud', required: true },
    numeroCotizacion: { type: String, required: true, unique: true, trim: true },
    fechaEmision: { type: Date, default: Date.now },
    valorTotal: { type: Number, required: true, min: 0 },
    exonerada: { type: Boolean, default: false },
    estado: { type: String, enum: ['Enviada', 'Aceptada', 'No aceptada'], default: 'Enviada' },
    archivoPdf: { type: String, default: null },
    detalles: [detalleCotizacionSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Cotizacion', cotizacionSchema);
