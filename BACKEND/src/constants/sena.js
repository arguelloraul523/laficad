// ============================================================
// Constantes del dominio institucional SENA.
// La solicitud de verificación SENA solo admite correos de este
// dominio (decisión 2026-10-09). Se usa en validador, modelo y
// controlador para que la regla viva en un solo lugar.
// ============================================================

const DOMINIO_SENA = '@sena.edu.co';

// Coincide solo al FINAL del correo (evita x@sena.edu.co.evil.com).
const RE_CORREO_SENA = /@sena\.edu\.co$/;

const esCorreoSena = (correo) => RE_CORREO_SENA.test(String(correo || '').toLowerCase());

export { DOMINIO_SENA, RE_CORREO_SENA, esCorreoSena };
