import { verificarToken } from '../utils/tokens.js';
import Usuario from '../models/Usuario.js';

// Protege rutas: exige un token JWT válido y carga el usuario en req.usuario
const proteger = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, mensaje: 'No autorizado, token requerido' });
    }

    const token = header.split(' ')[1];
    const payload = verificarToken(token);

    const usuario = await Usuario.findById(payload.id)
      .populate('rol')
      .populate('roles')
      .select('-contrasenaHash');

    if (!usuario) {
      return res.status(401).json({ ok: false, mensaje: 'Usuario no encontrado' });
    }

    // Compatibilidad: documentos creados antes del multirrol solo tienen `rol`.
    if (!usuario.roles || usuario.roles.length === 0) {
      usuario.roles = usuario.rol ? [usuario.rol] : [];
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(401).json({ ok: false, mensaje: 'Token inválido o expirado' });
  }
};

// Restringe una ruta a ciertos roles. Uso: autorizar('Administrador', 'Recepcionista')
const autorizar =
  (...roles) =>
  (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ ok: false, mensaje: 'No autorizado' });
    }
    const nombreRol = req.usuario.rol?.nombre;
    if (!roles.includes(nombreRol)) {
      return res.status(403).json({ ok: false, mensaje: 'No tienes permisos para esta acción' });
    }
    next();
  };

export { proteger, autorizar };
