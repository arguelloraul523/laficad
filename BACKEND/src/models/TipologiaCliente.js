import mongoose from 'mongoose';

// Tipología de cliente externo (empresa, persona natural, institución, etc.)
const tipologiaClienteSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('TipologiaCliente', tipologiaClienteSchema);
