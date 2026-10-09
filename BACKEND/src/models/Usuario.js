import mongoose from 'mongoose';

// Usuario del sistema (SENA o externo)
const usuarioSchema = new mongoose.Schema(
  {
    rol: { type: mongoose.Schema.Types.ObjectId, ref: 'Rol', required: true },
    // Roles disponibles para la persona (puede tener varios, p. ej. Recepcionista + Analista).
    // `rol` es el rol ACTIVO de la sesión; los permisos se evalúan sobre ese rol.
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Rol' }],
    tipologia: { type: mongoose.Schema.Types.ObjectId, ref: 'TipologiaCliente', default: null },
    nombres: { type: String, required: true, trim: true },
    apellidos: { type: String, required: true, trim: true },
    tipoDocumento: { type: String, enum: ['CC', 'TI', 'CE'], required: true },
    numeroDocumento: { type: String, required: true, trim: true },
    correo: { type: String, required: true, unique: true, lowercase: true, trim: true },
    telefono: { type: String, required: true, trim: true },
    // select: false para que nunca se devuelva en las consultas por defecto
    contrasenaHash: { type: String, required: true, select: false },
    tipoUsuario: { type: String, enum: ['SENA', 'EXTERNO'], required: true },
    activo: { type: Boolean, default: true },
    fechaRegistro: { type: Date, default: Date.now },
    tokenRecuperacion: { type: String, default: null },
    tokenExpiracion: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Usuario', usuarioSchema);
