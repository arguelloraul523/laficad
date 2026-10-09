import mongoose from 'mongoose';
import VerificacionSena from '../models/VerificacionSena.js';

// ============================================================
// Regla de negocio SENA (RF-02, RF-06, RF-18):
// un usuario SENA verificado queda exonerado de pago (cotización $0)
// y recibe el prefijo de prioridad A1.
//
// Criterio de "SENA verificado" (decisión 2026-10-09):
//   - tipoUsuario === 'SENA'  (lo fija el Administrador),  o
//   - VerificacionSena.estado === 'Aprobada'  (aprobada por el laboratorio).
//
// El registro público nunca puede declararse SENA: nace como EXTERNO
// y el rol/tipo de usuario no se aceptan desde req.body (regla #12).
// ============================================================

// Indica si un usuario está exonerado. ASYNC: consulta la verificación SENA.
const esSenaExonerado = async (usuario) => {
  if (!usuario) return false;

  // Se puede pasar el valor directo (string 'SENA' / 'EXTERNO').
  if (typeof usuario === 'string') return usuario === 'SENA';
  if (usuario.tipoUsuario === 'SENA') return true;

  const id = usuario._id || usuario;
  if (!mongoose.isValidObjectId(String(id))) return false;

  return Boolean(await VerificacionSena.exists({ usuario: id, estado: 'Aprobada' }));
};

export { esSenaExonerado };
