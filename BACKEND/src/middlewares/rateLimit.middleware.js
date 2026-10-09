import rateLimit from 'express-rate-limit';

// ============================================================
// Límite de peticiones para las rutas de autenticación.
// Mitiga fuerza bruta y abuso de recuperación de contraseña.
// ============================================================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // máximo 20 intentos por IP por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    mensaje: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  },
});

export { authLimiter };
