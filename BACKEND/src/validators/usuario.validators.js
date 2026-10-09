import { body } from 'express-validator';
import { RE_CORREO_SENA } from '../constants/sena.js';

// Validaciones para crear/actualizar un usuario
const validarUsuario = [
  body('nombres').notEmpty().withMessage('Los nombres son obligatorios'),
  body('apellidos').notEmpty().withMessage('Los apellidos son obligatorios'),
  body('correo').isEmail().withMessage('Correo electrónico inválido'),
  body('tipoDocumento').isIn(['CC', 'TI', 'CE']).withMessage('Tipo de documento inválido'),
  body('numeroDocumento').notEmpty().withMessage('El número de documento es obligatorio'),
  body('telefono').notEmpty().withMessage('El teléfono es obligatorio'),
  body('rol').notEmpty().withMessage('El rol es obligatorio'),
];

// Validación de la solicitud de verificación SENA.
// Regla: el correo institucional debe terminar en @sena.edu.co (exacto).
// El sanitizador toLowerCase va ANTES de matches: el modelo también normaliza,
// pero esta validación corre antes de que Mongoose aplique sus setters.
const validarVerificacionSena = [
  body('correoInstitucional')
    .trim()
    .notEmpty()
    .withMessage('El correo institucional es obligatorio')
    .bail()
    .toLowerCase()
    .isEmail()
    .withMessage('Correo institucional inválido')
    .bail()
    .matches(RE_CORREO_SENA)
    .withMessage('Solo se aceptan correos @sena.edu.co'),
];

export { validarUsuario, validarVerificacionSena };
