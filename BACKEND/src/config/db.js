// ============================================================
// Conexión a MongoDB Atlas.
// Único lugar que abre/cierra la sesión de Mongoose.
// ============================================================
import mongoose from 'mongoose';

const conectarDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Falta la variable de entorno MONGODB_URI en el archivo .env');
  }
  await mongoose.connect(uri);
  console.log('✅ Conexión a MongoDB Atlas exitosa');
};

const desconectarDB = async () => {
  await mongoose.disconnect();
};

export { conectarDB, desconectarDB };
