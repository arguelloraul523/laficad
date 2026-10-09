import { body } from 'express-validator';

// Validaciones para crear una pre-solicitud (RF-16)
const validarSolicitud = [
  body('tipoMuestra').isMongoId().withMessage('Tipo de muestra inválido'),
  body('descripcionMuestra').notEmpty().withMessage('La descripción de la muestra es obligatoria'),
  body('origen').isIn(['Rural', 'Industrial', 'Doméstico']).withMessage('Origen inválido'),
  body('cantidadEstimada').notEmpty().withMessage('La cantidad estimada es obligatoria'),
  body('examenes').optional().isArray({ max: 20 }).withMessage('examenes debe ser un array (máx. 20)'),
  body('examenes.*').isMongoId().withMessage('Id de examen inválido'),
];

// Validaciones para pedir sugerencias de análisis (RF-16)
const validarSugerencias = [
  body('tipoMuestra').isMongoId().withMessage('Tipo de muestra inválido'),
  body('descripcionMuestra').notEmpty().withMessage('La descripción de la muestra es obligatoria'),
  body('categoria').optional().isMongoId().withMessage('Categoría inválida'),
  body('limite').optional().isInt({ min: 1, max: 50 }).withMessage('El límite debe estar entre 1 y 50'),
];

export { validarSolicitud, validarSugerencias };
