import mongoose from 'mongoose';

// Cuenta bancaria de recaudo del laboratorio
const cuentaRecaudoSchema = new mongoose.Schema(
  {
    banco: { type: String, required: true, trim: true },
    tipoCuenta: { type: String, enum: ['Ahorros', 'Corriente'], required: true },
    numeroCuenta: { type: String, required: true, unique: true, trim: true },
    titular: { type: String, required: true, trim: true },
    activa: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('CuentaRecaudo', cuentaRecaudoSchema);
