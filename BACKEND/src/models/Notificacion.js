import mongoose from 'mongoose';

// Notificación enviada a un usuario
const notificacionSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    plantilla: { type: mongoose.Schema.Types.ObjectId, ref: 'PlantillaMensaje', default: null },
    solicitud: { type: mongoose.Schema.Types.ObjectId, ref: 'Solicitud', default: null },
    canal: { type: String, enum: ['Correo', 'App'], required: true },
    asunto: { type: String, required: true, trim: true },
    contenido: { type: String, required: true },
    fechaEnvio: { type: Date, default: Date.now },
    leida: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Notificacion', notificacionSchema);
