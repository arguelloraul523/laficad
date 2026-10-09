import mongoose from 'mongoose';

// Historial de cambios / acciones sobre una muestra (auditoría)
const historialMuestraSchema = new mongoose.Schema(
  {
    muestra: { type: mongoose.Schema.Types.ObjectId, ref: 'Muestra', required: true },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    accion: {
      type: String,
      enum: ['Cambio de etapa', 'Edición', 'Asignación', 'Reasignación', 'Reapertura', 'Consulta datos cliente'],
      required: true,
    },
    etapa: {
      type: String,
      enum: ['Recepción', 'Análisis', 'Observaciones', 'Resultados', 'Validación', 'Re-ensayo', 'Finalizada'],
      default: null,
    },
    valorAnterior: { type: String, default: null },
    valorNuevo: { type: String, default: null },
    comentario: { type: String },
    fechaHora: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ===== Inmutabilidad (RF-24) =====
// El historial es append-only: solo se permite crear. Cualquier intento de
// actualizar o eliminar (desde la API o desde el código) lanza un error.
const inmutabilidad = function (next) {
  next(new Error('El historial de muestras es inmutable (RF-24)'));
};

historialMuestraSchema.pre('findOneAndUpdate', inmutabilidad);
historialMuestraSchema.pre('updateOne', inmutabilidad);
historialMuestraSchema.pre('updateMany', inmutabilidad);
historialMuestraSchema.pre('replaceOne', inmutabilidad);
historialMuestraSchema.pre('findOneAndDelete', inmutabilidad);
historialMuestraSchema.pre('deleteOne', inmutabilidad);
historialMuestraSchema.pre('deleteMany', inmutabilidad);

// Un documento ya guardado no puede volver a guardarse (modificación).
historialMuestraSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error('El historial de muestras es inmutable (RF-24)'));
  }
  next();
});

export default mongoose.model('HistorialMuestra', historialMuestraSchema);
