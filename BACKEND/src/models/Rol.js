import mongoose from 'mongoose';

// Roles del sistema (Administrador, Recepcionista, Analista, Cliente, etc.)
const rolSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true, trim: true },
    descripcion: { type: String, trim: true },
    estado: { type: String, enum: ['Activo', 'Inactivo'], default: 'Activo' },
    // Módulos a los que tiene acceso este rol (N:M con Modulo)
    modulos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Modulo' }],
  },
  { timestamps: true }
);

export default mongoose.model('Rol', rolSchema);
