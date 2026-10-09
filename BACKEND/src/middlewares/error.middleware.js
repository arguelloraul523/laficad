// Responde 404 para rutas no registradas
const notFound = (req, res) => {
  res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada' });
};

// Manejador central de errores
// eslint-disable-next-line no-unused-vars
const manejadorErrores = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let mensaje = err.message || 'Error interno del servidor';

  // Errores de validación de Mongoose
  if (err.name === 'ValidationError') {
    status = 400;
    mensaje = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // Clave duplicada
  if (err.code === 11000) {
    status = 409;
    const campo = Object.keys(err.keyValue || {}).join(', ');
    mensaje = `Ya existe un registro con ese valor (${campo})`;
  }

  // ID mal formado
  if (err.name === 'CastError') {
    status = 400;
    mensaje = 'Identificador inválido';
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ Error:', err);
  }

  res.status(status).json({ ok: false, mensaje });
};

export { notFound, manejadorErrores };
