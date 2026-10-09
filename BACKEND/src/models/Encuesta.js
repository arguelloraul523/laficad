import mongoose from 'mongoose';

// Respuesta de la encuesta (antes RESPUESTA_ENCUESTA, ahora embebido)
const respuestaEncuestaSchema = new mongoose.Schema(
  {
    pregunta: { type: mongoose.Schema.Types.ObjectId, ref: 'PreguntaEncuesta', required: true },
    calificacion: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// Encuesta de satisfacción asociada a una solicitud
const encuestaSchema = new mongoose.Schema(
  {
    solicitud: { type: mongoose.Schema.Types.ObjectId, ref: 'Solicitud', required: true, unique: true },
    comentario: { type: String },
    fechaRespuesta: { type: Date, default: Date.now },
    respuestas: [respuestaEncuestaSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Encuesta', encuestaSchema);
