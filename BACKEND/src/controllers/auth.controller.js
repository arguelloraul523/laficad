import crypto from 'crypto';
import asyncHandler from '../utils/asyncHandler.js';
import bcrypt from 'bcryptjs';
import { generarToken } from '../utils/tokens.js';
import Usuario from '../models/Usuario.js';
import Rol from '../models/Rol.js';
import { enviarCorreo } from '../utils/mailer.js';

// Registro de un nuevo usuario (devuelve el token de acceso)
const registrar = asyncHandler(async (req, res) => {
  const { contrasena, nombres, apellidos, tipoDocumento, numeroDocumento, correo, telefono, tipologia } =
    req.body;
  const contrasenaHash = await bcrypt.hash(contrasena, 10);

  // El rol y el tipo de usuario NUNCA se aceptan desde el body (regla inviolable #12, RF-02).
  // Todo registro público nace como Cliente externo; el Administrador asigna otros roles.
  const rolCliente = await Rol.findOne({ nombre: 'Cliente' });
  if (!rolCliente) {
    return res.status(500).json({ ok: false, mensaje: 'Falta el rol Cliente. Ejecuta el seed.' });
  }

  const usuarioCreado = await Usuario.create({
    nombres,
    apellidos,
    tipoDocumento,
    numeroDocumento,
    correo,
    telefono,
    tipologia,
    rol: rolCliente._id,
    roles: [rolCliente._id],
    tipoUsuario: 'EXTERNO',
    contrasenaHash,
  });
  const usuario = usuarioCreado.toObject();
  delete usuario.contrasenaHash;

  const token = generarToken({ id: usuario._id });
  res.status(201).json({ ok: true, data: usuario, token });
});

// Inicio de sesión con correo y contraseña
const login = asyncHandler(async (req, res) => {
  const { correo, contrasena } = req.body;

  const usuario = await Usuario.findOne({ correo }).select('+contrasenaHash');
  if (!usuario) {
    return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas' });
  }

  const valida = await bcrypt.compare(contrasena, usuario.contrasenaHash);
  if (!valida) {
    return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas' });
  }

  const datos = usuario.toObject();
  delete datos.contrasenaHash;

  const token = generarToken({ id: usuario._id });
  res.json({ ok: true, data: datos, token });
});

// Devuelve el usuario autenticado (req.usuario lo carga el middleware)
const perfil = asyncHandler(async (req, res) => {
  res.json({ ok: true, data: req.usuario });
});

// Cambia la contraseña del usuario autenticado
const cambiarContrasena = asyncHandler(async (req, res) => {
  const { contrasenaActual, contrasenaNueva } = req.body;

  const usuario = await Usuario.findById(req.usuario._id).select('+contrasenaHash');
  const valida = await bcrypt.compare(contrasenaActual, usuario.contrasenaHash);
  if (!valida) {
    return res.status(400).json({ ok: false, mensaje: 'Contraseña actual incorrecta' });
  }

  usuario.contrasenaHash = await bcrypt.hash(contrasenaNueva, 10);
  await usuario.save();

  res.json({ ok: true, mensaje: 'Contraseña actualizada correctamente' });
});

// Solicita recuperación de contraseña (genera un token temporal)
const olvideContrasena = asyncHandler(async (req, res) => {
  const { correo } = req.body;

  const usuario = await Usuario.findOne({ correo });
  // Por seguridad no revelamos si el correo existe o no
  if (!usuario) {
    return res.json({
      ok: true,
      mensaje: 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña',
    });
  }

  const token = crypto.randomBytes(32).toString('hex');
  usuario.tokenRecuperacion = token;
  usuario.tokenExpiracion = Date.now() + 30 * 60 * 1000; // 30 minutos
  await usuario.save();

  // Intenta enviar el correo (si el SMTP está configurado en .env)
  const enviado = await enviarCorreo({
    para: usuario.correo,
    asunto: 'Recuperación de contraseña',
    texto: `Usa este token para restablecer tu contraseña: ${token}`,
    html: `<p>Usa este token para restablecer tu contraseña:</p><p><b>${token}</b></p>`,
  });

  // En desarrollo, si no hay SMTP configurado, se devuelve el token
  if (!enviado) {
    return res.json({ ok: true, mensaje: 'Token generado', token });
  }

  res.json({ ok: true, mensaje: 'Correo de recuperación enviado' });
});

// Restablece la contraseña usando el token recibido
const restablecerContrasena = asyncHandler(async (req, res) => {
  const { token, contrasenaNueva } = req.body;

  const usuario = await Usuario.findOne({
    tokenRecuperacion: token,
    tokenExpiracion: { $gt: Date.now() },
  });
  if (!usuario) {
    return res.status(400).json({ ok: false, mensaje: 'Token inválido o expirado' });
  }

  usuario.contrasenaHash = await bcrypt.hash(contrasenaNueva, 10);
  usuario.tokenRecuperacion = null;
  usuario.tokenExpiracion = null;
  await usuario.save();

  res.json({ ok: true, mensaje: 'Contraseña restablecida correctamente' });
});

// Cambia el rol ACTIVO de la sesión (multirrol). Solo acepta roles disponibles.
const cambiarRol = asyncHandler(async (req, res) => {
  const { rol } = req.body;

  const disponibles = (req.usuario.roles || []).map((r) => String(r._id || r));
  if (!rol || !disponibles.includes(String(rol))) {
    return res.status(403).json({ ok: false, mensaje: 'Ese rol no está disponible para tu usuario' });
  }

  const actualizado = await Usuario.findByIdAndUpdate(req.usuario._id, { rol }, { new: true })
    .populate('rol')
    .select('-contrasenaHash');

  res.json({ ok: true, data: actualizado });
});

export {
  registrar,
  login,
  perfil,
  cambiarContrasena,
  olvideContrasena,
  restablecerContrasena,
  cambiarRol,
};
