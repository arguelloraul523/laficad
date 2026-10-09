import mongoose from 'mongoose';

// Parámetro global de configuración del sistema (clave-valor)
const parametroSistemaSchema = new mongoose.Schema(
  {
    modificadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
    clave: { type: String, required: true, unique: true, trim: true },
    valor: { type: String, required: true },
    descripcion: { type: String, trim: true },
    fechaModificacion: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('ParametroSistema', parametroSistemaSchema);
