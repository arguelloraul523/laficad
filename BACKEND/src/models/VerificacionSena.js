import mongoose from 'mongoose';
import { RE_CORREO_SENA } from '../constants/sena.js';

// Verificación de identidad para usuarios SENA (ficha, contrato, soporte)
const verificacionSenaSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, unique: true },
    correoInstitucional: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      // Solo correos @sena.edu.co (regla de negocio, decisión 2026-10-09)
      match: [RE_CORREO_SENA, 'El correo institucional debe terminar en @sena.edu.co'],
    },
    numeroFicha: { type: String, trim: true },
    numeroContratoCedula: { type: String, trim: true },
    archivoSoporte: { type: String, required: true },
    estado: { type: String, enum: ['Pendiente', 'Aprobada', 'Rechazada'], default: 'Pendiente' },
    fechaSolicitud: { type: Date, default: Date.now },
    revisadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
    fechaRevision: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('VerificacionSena', verificacionSenaSchema);
