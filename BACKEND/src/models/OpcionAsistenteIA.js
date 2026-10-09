import mongoose from 'mongoose';

// Opción configurable del asistente de IA (prompt predefinido)
const opcionAsistenteIASchema = new mongoose.Schema(
  {
    modificadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
    numeroOpcion: { type: Number, required: true, unique: true },
    textoOpcion: { type: String, required: true, trim: true },
    prompt: { type: String, required: true },
    activa: { type: Boolean, default: true },
    fechaModificacion: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('OpcionAsistenteIA', opcionAsistenteIASchema);
