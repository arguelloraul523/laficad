import { validationResult } from 'express-validator';

// Revisa el resultado de las validaciones de express-validator
// y responde 400 con la lista de errores si algo no cumple.
const validarCampos = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ ok: false, errores: errores.array() });
  }
  next();
};

export default validarCampos;
