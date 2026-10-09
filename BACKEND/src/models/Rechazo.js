import mongoose from 'mongoose';

// Rechazo de una muestra (con motivo, evidencia y acta)
const rechazoSchema = new mongoose.Schema(
  {
    muestra: { type: mongoose.Schema.Types.ObjectId, ref: 'Muestra', required: true, unique: true },
    motivo: { type: mongoose.Schema.Types.ObjectId, ref: 'MotivoRechazo', required: true },
    registradoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    observaciones: { type: String },
    evidenciaFoto: { type: String, default: null },
    actaPdf: { type: String, required: true },
    fechaRechazo: { type: Date, default: Date.now },
    decisionCliente: { type: String, enum: ['Pendiente', 'Reenviar', 'Recoger'], default: 'Pendiente' },
  },
  { timestamps: true }
);

export default mongoose.model('Rechazo', rechazoSchema);
