import mongoose from 'mongoose';

// Tipo de muestra (agua, suelo, alimento, sangre, etc.)
const tipoMuestraSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true, trim: true },
    descripcion: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('TipoMuestra', tipoMuestraSchema);
