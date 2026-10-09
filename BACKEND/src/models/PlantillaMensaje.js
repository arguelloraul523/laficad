import mongoose from 'mongoose';

// Plantilla de mensaje para notificaciones
const plantillaMensajeSchema = new mongoose.Schema(
  {
    modificadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
    nombre: { type: String, required: true, trim: true },
    tipo: { type: String, enum: ['Notificación', 'Alerta de Retraso', 'Resultados'], required: true },
    canal: { type: String, enum: ['Correo', 'Chat interno'], required: true },
    asunto: { type: String, required: true, trim: true },
    cuerpo: { type: String, required: true },
    fechaModificacion: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('PlantillaMensaje', plantillaMensajeSchema);
