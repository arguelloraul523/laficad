import mongoose from 'mongoose';

// Examen asignado a la muestra (antes MUESTRA_EXAMEN, ahora embebido)
const muestraExamenSchema = new mongoose.Schema(
  {
    examen: { type: mongoose.Schema.Types.ObjectId, ref: 'Examen', required: true },
    resultado: { type: String, default: null },
    fechaResultado: { type: Date, default: null },
  },
  { _id: false }
);

// Muestra física recibida en el laboratorio
const muestraSchema = new mongoose.Schema(
  {
    solicitud: { type: mongoose.Schema.Types.ObjectId, ref: 'Solicitud', required: true },
    recepcionista: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    analista: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
    entregadoPor: { type: String, required: true, trim: true },
    fechaHoraEntrega: { type: Date, required: true },
    cantidadRecibida: { type: Number, required: true, min: 0 },
    unidadMedida: { type: String, required: true, trim: true },
    estadoEmpaque: { type: String, enum: ['Buen estado', 'Malas condiciones'], required: true },
    temperaturaRecepcion: { type: Number, default: null },
    codigoMuestra: { type: String, unique: true, sparse: true, trim: true },
    prioridad: { type: String, enum: ['A1', 'A2'], default: null },
    numeroTurno: { type: Number, default: null },
    estado: { type: String, enum: ['Recibida', 'Aceptada', 'En observación', 'Rechazada'], default: 'Recibida' },
    etapaActual: {
      type: String,
      enum: ['Recepción', 'Análisis', 'Observaciones', 'Resultados', 'Validación', 'Re-ensayo', 'Finalizada'],
      default: 'Recepción',
    },
    observaciones: { type: String },
    fechaIngreso: { type: Date, default: Date.now },
    examenes: [muestraExamenSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Muestra', muestraSchema);
