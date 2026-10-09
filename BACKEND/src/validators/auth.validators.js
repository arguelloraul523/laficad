import { body } from 'express-validator';

// Validaciones para registrar un usuario
// (el rol NO se pide: el servidor asigna Cliente; regla inviolable #12)
const validarRegistro = [
  body('nombres').notEmpty().withMessage('Los nombres son obligatorios'),
  body('apellidos').notEmpty().withMessage('Los apellidos son obligatorios'),
  body('correo').isEmail().withMessage('Correo electrónico inválido'),
  body('contrasena').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
];

// Validaciones para iniciar sesión
const validarLogin = [
  body('correo').isEmail().withMessage('Correo electrónico inválido'),
  body('contrasena').notEmpty().withMessage('La contraseña es obligatoria'),
];

export { validarRegistro, validarLogin };
