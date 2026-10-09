import mongoose from 'mongoose';

// Módulos / pantallas del sistema para controlar accesos por rol
const moduloSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true, trim: true },
    ruta: { type: String, required: true, unique: true, trim: true },
    estado: { type: String, enum: ['Activo', 'Inactivo'], default: 'Activo' },
  },
  { timestamps: true }
);

export default mongoose.model('Modulo', moduloSchema);
