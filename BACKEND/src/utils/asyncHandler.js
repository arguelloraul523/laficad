// Envuelve un controlador async para capturar errores automáticamente
// y pasarlos al middleware de errores sin try/catch en cada función.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
