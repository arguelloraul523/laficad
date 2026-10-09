import mongoose from 'mongoose';

// Catálogo de motivos de rechazo de muestras
const motivoRechazoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('MotivoRechazo', motivoRechazoSchema);
