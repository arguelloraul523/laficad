import mongoose from 'mongoose';

// Subdocumento de autorización (firma del cliente) - relación 1:1 con Solicitud
const autorizacionSchema = new mongoose.Schema(
  {
    nombreFirmante: { type: String, required: true, trim: true },
    documentoFirmante: { type: String, required: true, trim: true },
    firmaImagen: { type: String, required: true },
    aceptaTerminos: { type: Boolean, default: false },
    fechaHoraFirma: { type: Date, default: Date.now },
    // IP desde la que se firmó (auditoría de la aceptación - RF-13)
    ip: { type: String, default: null },
  },
  { _id: false }
);

// Análisis elegidos/confirmados en la pre-solicitud (RF-16).
// `precioUnitario` es un SNAPSHOT del catálogo al momento de elegir (RF-06):
// cambiar el precio después no afecta lo que ya eligió el cliente.
const solicitudExamenSchema = new mongoose.Schema(
  {
    examen: { type: mongoose.Schema.Types.ObjectId, ref: 'Examen', required: true },
    origen: { type: String, enum: ['Sugerido', 'Manual'], default: 'Sugerido' },
    precioUnitario: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

// Solicitud / pre-solicitud de análisis de un cliente
const solicitudSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    tipoMuestra: { type: mongoose.Schema.Types.ObjectId, ref: 'TipoMuestra', required: true },
    codigoPresolicitud: { type: String, required: true, unique: true, trim: true },
    descripcionMuestra: { type: String, required: true, trim: true },
    origen: { type: String, enum: ['Rural', 'Industrial', 'Doméstico'], required: true },
    cantidadEstimada: { type: String, required: true, trim: true },
    examenes: { type: [solicitudExamenSchema], default: [] },
    estado: {
      type: String,
      enum: [
        'Pre-solicitud',
        'Cotizada',
        'No aceptada',
        'Pendiente de pago',
        'Pagada',
        'En proceso',
        'Finalizada',
        'Cancelada',
      ],
      default: 'Pre-solicitud',
    },
    fechaCreacion: { type: Date, default: Date.now },
    fechaCierre: { type: Date, default: null },
    // true si la cotización se exoneró (usuario SENA verificado): sin pago y sin cupón
    exonerada: { type: Boolean, default: false },
    autorizacion: { type: autorizacionSchema, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Solicitud', solicitudSchema);
