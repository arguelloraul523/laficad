import mongoose from 'mongoose';

// Catálogo de preguntas para las encuestas de satisfacción
const preguntaEncuestaSchema = new mongoose.Schema(
  {
    texto: { type: String, required: true, trim: true },
    tipo: { type: String, enum: ['Calificación', 'Opción múltiple', 'Sí/No', 'Texto abierto'], required: true },
    activa: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('PreguntaEncuesta', preguntaEncuestaSchema);
