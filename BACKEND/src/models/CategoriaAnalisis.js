import mongoose from 'mongoose';

// Categoría de análisis (microbiología, físico-químico, aguas, suelos, etc.)
const categoriaAnalisisSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true, trim: true },
    descripcion: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('CategoriaAnalisis', categoriaAnalisisSchema);
