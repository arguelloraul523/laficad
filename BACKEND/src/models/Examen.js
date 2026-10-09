import mongoose from 'mongoose';

// Examen / análisis ofrecido por el laboratorio
const examenSchema = new mongoose.Schema(
  {
    categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'CategoriaAnalisis', required: true },
    tipoMuestra: { type: mongoose.Schema.Types.ObjectId, ref: 'TipoMuestra', required: true },
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String },
    precio: { type: Number, required: true, min: 0 },
    tiempoRespuestaDias: { type: Number, required: true, min: 0 },
    cantidadRequerida: { type: Number, required: true, min: 0 },
    unidadMedida: { type: String, required: true, trim: true },
    tipoEnvase: { type: String, required: true, trim: true },
    temperaturaConservacion: { type: String, trim: true },
    tiempoMaxTrasladoHoras: { type: Number, min: 0 },
    requiereTemperatura: { type: Boolean, default: false },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Examen', examenSchema);
