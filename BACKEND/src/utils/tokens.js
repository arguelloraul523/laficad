import jwt from 'jsonwebtoken';

// Genera un token JWT con la información del usuario
const generarToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// Verifica y decodifica un token JWT (lanza error si es inválido)
const verificarToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

export { generarToken, verificarToken };
