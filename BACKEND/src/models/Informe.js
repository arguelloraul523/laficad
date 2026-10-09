import mongoose from 'mongoose';

// Informe de resultados de una muestra
const informeSchema = new mongoose.Schema(
  {
    muestra: { type: mongoose.Schema.Types.ObjectId, ref: 'Muestra', required: true },
    revisadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
    archivoPdf: { type: String, required: true },
    estado: { type: String, enum: ['En revisión', 'Aprobado'], default: 'En revisión' },
    fechaValidacion: { type: Date, default: null },
    fechaEnvio: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Informe', informeSchema);
