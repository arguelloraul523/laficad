import { body } from 'express-validator';

// Expresión que reconoce una imagen canvas en base64.
const RE_BASE64 = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

// Crear cotización: el cliente solo envía la solicitud y la lista de exámenes.
// El precio lo pone SIEMPRE el servidor desde el catálogo (RF-06, regla #11).
const validarCrearCotizacion = [
  body('solicitud').isMongoId().withMessage('La solicitud es obligatoria y debe ser un id válido'),
  body('examenes').optional().isArray({ max: 50 }).withMessage('examenes debe ser un array (máx. 50)'),
  body('examenes.*.examen').isMongoId().withMessage('Id de examen inválido'),
  body('examenes.*.cantidadMuestras')
    .optional()
    .isInt({ min: 1, max: 999 })
    .withMessage('cantidadMuestras debe ser un entero entre 1 y 999'),
];

// Aceptar cotización con firma digital (RF-13).
const validarAceptarCotizacion = [
  body('nombreFirmante').notEmpty().withMessage('El nombre del firmante es obligatorio'),
  body('documentoFirmante').notEmpty().withMessage('El documento del firmante es obligatorio'),
  body('firmaImagen')
    .matches(RE_BASE64)
    .withMessage('La firma debe ser una imagen en base64 (data:image/png;base64,...)'),
  body('aceptaTerminos')
    .isBoolean()
    .withMessage('aceptaTerminos debe ser booleano')
    .bail()
    .equals(true)
    .withMessage('Debe aceptar los términos y condiciones para firmar'),
];

export { validarCrearCotizacion, validarAceptarCotizacion, RE_BASE64 };
