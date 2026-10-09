// ============================================================
// Whitelist implícita del body: campos que NUNCA se aceptan del cliente.
// Regla inviolable: el rol y el estado no se aceptan desde req.body.
// Se usa en crudFactory.crear/actualizar antes de tocar la base.
// ============================================================

// Campos internos o sensibles que se descartan siempre.
const CAMPOS_PROTEGIDOS = [
  '_id',
  '__v',
  'createdAt',
  'updatedAt',
  // Identidad / permisos / seguridad
  'contrasenaHash',
  'tokenRecuperacion',
  'tokenExpiracion',
  'rol',
  'roles',
  'tipoUsuario',
  'activo',
  'usuario',
  // Códigos y valores calculados en servidor (RF-18)
  'codigoPresolicitud',
  'codigoMuestra',
  'numeroCotizacion',
  'codigoReferencia',
  'prioridad',
  'numeroTurno',
  // Lista de análisis: el precio solo lo pone el servidor (snapshot)
  'examenes',
  'detalles',
  'valorTotal',
  // Trazabilidad de servidor
  'verificadoPor',
  'exonerada',
  // Auditoría de pagos: solo la escribe el servidor
  'historial',
  'fechaCarga',
  'fechaRevision',
];

// Campos de estado: solo se permiten si un middleware de transición los validó.
const CAMPOS_ESTADO = ['estado', 'etapaActual'];

// Middleware: habilita campos protegidos concretos para una ruta (uso administrativo).
// Uso: permitirCampos('estado', 'usuario')
const permitirCampos =
  (...campos) =>
  (req, res, next) => {
    req.camposPermitidos = [...(req.camposPermitidos || []), ...campos];
    next();
  };

// Devuelve una copia del body sin los campos protegidos.
// `permitir` habilita campos protegidos, `permitirEstado` habilita estados.
const sanitizarBody = (body = {}, { permitir = [], permitirEstado = [] } = {}) => {
  const limpio = {};
  Object.keys(body).forEach((campo) => {
    if (CAMPOS_PROTEGIDOS.includes(campo) && !permitir.includes(campo)) return;
    if (CAMPOS_ESTADO.includes(campo) && !permitir.includes(campo) && !permitirEstado.includes(campo)) {
      return;
    }
    limpio[campo] = body[campo];
  });
  return limpio;
};

export { CAMPOS_PROTEGIDOS, CAMPOS_ESTADO, sanitizarBody, permitirCampos };
