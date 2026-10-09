import { body } from 'express-validator';

// ============================================================
// Validaciones del módulo de pagos (RF-08, RF-09, RF-33).
// - Registrar: método obligatorio; comprobante de pago obligatorio
//   SALVO para "Efectivo en caja SENA", donde se exige el número
//   de recibo de caja.
// - Verificar: rechazar siempre exige observación (regla #7).
// El estado inicial ("Pendiente de verificación") lo fija el servidor.
// ============================================================

const METODOS_PAGO = ['Consignación bancaria', 'Transferencia electrónica', 'Efectivo en caja SENA'];

// Registrar pago (multipart o JSON; el archivo ya mapeó archivoComprobante en la ruta)
const validarRegistrarPago = [
  body('cupon').isMongoId().withMessage('El cupón de pago es obligatorio y debe ser un id válido'),
  body('metodo')
    .isIn(METODOS_PAGO)
    .withMessage(`El método debe ser uno de: ${METODOS_PAGO.join(', ')}`),
  body('fechaPagoReportada')
    .isISO8601()
    .withMessage('La fecha del pago reportada debe ser una fecha válida (ISO 8601)'),
  body('valorReportado')
    .isFloat({ min: 0 })
    .withMessage('El valor reportado debe ser un número mayor o igual a 0')
    .bail()
    .toFloat(),
  body('metodo').custom((metodo, { req }) => {
    const efectivo = metodo === 'Efectivo en caja SENA';
    if (efectivo) {
      const recibo = String(req.body.numeroReciboCaja || '').trim();
      if (!recibo) {
        throw new Error('Para pago en efectivo el número de recibo de caja es obligatorio');
      }
    } else if (!req.body.archivoComprobante) {
      throw new Error('El comprobante de pago (JPG, PNG o PDF) es obligatorio para este método');
    }
    return true;
  }),
];

// Verificar pago: rechazar exige observación (RF-09, regla #7)
const validarVerificarPago = [
  body('aprobar')
    .isBoolean()
    .withMessage('El campo aprobar debe ser booleano')
    .bail()
    .toBoolean(),
  body('observacion').custom((valor, { req }) => {
    if (req.body.aprobar === false && !String(valor || '').trim()) {
      throw new Error('Rechazar un pago exige una observación');
    }
    return true;
  }),
];

export { validarRegistrarPago, validarVerificarPago, METODOS_PAGO };
