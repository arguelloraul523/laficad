import mongoose from 'mongoose';

// Petición, queja o reclamo (PQR) de un usuario
const inconformidadSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    solicitud: { type: mongoose.Schema.Types.ObjectId, ref: 'Solicitud', default: null },
    tipo: { type: String, enum: ['Petición', 'Queja', 'Reclamo'], required: true },
    categoria: { type: String, trim: true },
    descripcion: { type: String, required: true },
    soporte: { type: String, default: null },
    estado: { type: String, enum: ['Abierta', 'En revisión', 'Resuelta', 'Cerrada'], default: 'Abierta' },
    fechaRegistro: { type: Date, default: Date.now },
    fechaResolucion: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Inconformidad', inconformidadSchema);
