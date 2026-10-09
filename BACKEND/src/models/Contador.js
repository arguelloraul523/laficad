import mongoose from 'mongoose';

// Contador atómico para generar códigos consecutivos (RF-18).
// Un documento por serie. Ejemplos de _id: "A1-2026", "A2-2026", "PRE-2026".
const contadorSchema = new mongoose.Schema(
  {
    _id: { type: String }, // clave de la serie (prefijo-año o prefijo)
    secuencia: { type: Number, default: 0, min: 0 },
  },
  { versionKey: false }
);

export default mongoose.model('Contador', contadorSchema);
