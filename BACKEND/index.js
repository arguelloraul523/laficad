// ============================================================
// Punto de entrada único del backend (junto a .env).
// Carga el entorno, configura Express, conecta a MongoDB
// y arranca el servidor. Con el flag --seed ejecuta la siembra.
//
//   npm start          -> arranca el servidor
//   npm run seed       -> node index.js --seed
// ============================================================
import 'dotenv/config';

import { fileURLToPath } from 'url';

import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';

import rutasApi from './src/routes/index.js';
import { conectarDB, desconectarDB } from './src/config/db.js';
import { notFound, manejadorErrores } from './src/middlewares/error.middleware.js';
import Rol from './src/models/Rol.js';
import Modulo from './src/models/Modulo.js';
import TipologiaCliente from './src/models/TipologiaCliente.js';
import Usuario from './src/models/Usuario.js';

// En ESM no existe __dirname: se deriva de la ubicación del módulo.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3000;
const esModoSeed = process.argv.includes('--seed');

// ============================================================
// Aplicación Express
// ============================================================
const app = express();

// Middlewares globales
// Helmet añade cabeceras de seguridad; se permite cargar archivos (/uploads) desde el front.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Archivos subidos (comprobantes, informes, firmas, etc.)
// Carpetas sensibles: NO se sirven con /uploads. El PDF de la cotización y la
// firma digital solo salen por sus endpoints con propiedad/autorización (RF-06, RF-13).
const CARPETAS_PROTEGIDAS = new Set(['cotizaciones', 'firmas']);
app.use('/uploads', (req, res, next) => {
  const carpeta = (req.path.split('/')[1] || '').toLowerCase();
  if (CARPETAS_PROTEGIDAS.has(carpeta)) {
    return res
      .status(403)
      .json({ ok: false, mensaje: 'Archivo protegido: use el endpoint autorizado' });
  }
  next();
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ruta de estado de la API
app.get('/', (req, res) => {
  res.json({
    nombre: 'Sistema de Gestión del Laboratorio (SENA)',
    estado: 'API en funcionamiento 🧪',
  });
});

// Rutas de la API + manejo de rutas no encontradas y errores
app.use('/api', rutasApi);
app.use(notFound);
app.use(manejadorErrores);

// ============================================================
// Seed (datos iniciales): npm run seed  ->  node index.js --seed
// ============================================================
const correrSeed = async () => {
  // 1. Módulos del sistema
  const nombresModulos = [
    'Usuarios',
    'Roles',
    'Catálogo',
    'Solicitudes',
    'Cotizaciones',
    'Pagos',
    'Muestras',
    'Informes',
    'Encuestas',
    'Notificaciones',
    'Configuración',
    'Inconformidades',
  ];
  const modulos = [];
  for (const nombre of nombresModulos) {
    const modulo = await Modulo.findOneAndUpdate(
      { nombre },
      { nombre, ruta: `/${nombre.toLowerCase()}`, estado: 'Activo' },
      { upsert: true, new: true, runValidators: true }
    );
    modulos.push(modulo);
  }

  // 2. Roles
  const rolesDef = [
    { nombre: 'Administrador', descripcion: 'Acceso total al sistema' },
    { nombre: 'Recepcionista', descripcion: 'Recibe muestras y gestiona solicitudes' },
    { nombre: 'Analista', descripcion: 'Procesa muestras y genera resultados' },
    { nombre: 'Cliente', descripcion: 'Solicita análisis y consulta resultados' },
  ];
  const roles = {};
  for (const r of rolesDef) {
    const rol = await Rol.findOneAndUpdate(
      { nombre: r.nombre },
      { ...r, estado: 'Activo', modulos: modulos.map((m) => m._id) },
      { upsert: true, new: true, runValidators: true }
    );
    roles[r.nombre] = rol;
  }

  // 3. Tipologías de cliente
  const nombresTipologias = ['Empresa', 'Persona natural', 'Institución educativa', 'Entidad pública'];
  for (const nombre of nombresTipologias) {
    await TipologiaCliente.findOneAndUpdate(
      { nombre },
      { nombre },
      { upsert: true, new: true, runValidators: true }
    );
  }

  // 4. Usuario administrador
  const correo = process.env.ADMIN_CORREO || 'admin@laboratorio.com';
  const contrasena = process.env.ADMIN_CONTRASENA || 'Admin1234';
  const contrasenaHash = await bcrypt.hash(contrasena, 10);

  await Usuario.findOneAndUpdate(
    { correo },
    {
      rol: roles['Administrador']._id,
      roles: [roles['Administrador']._id],
      nombres: 'Administrador',
      apellidos: 'Sistema',
      tipoDocumento: 'CC',
      numeroDocumento: '0000000000',
      correo,
      telefono: '3000000000',
      contrasenaHash,
      tipoUsuario: 'SENA',
      activo: true,
      fechaRegistro: new Date(),
    },
    { upsert: true, new: true, runValidators: true }
  );

  console.log('✅ Seed completado:');
  console.log(`   - Módulos: ${modulos.length}`);
  console.log(`   - Roles: ${Object.keys(roles).join(', ')}`);
  console.log(`   - Tipologías: ${nombresTipologias.length}`);
  console.log(`   - Admin: ${correo}`);
};

// ============================================================
// Arranque
// ============================================================
(async () => {
  try {
    await conectarDB();

    if (esModoSeed) {
      await correrSeed();
      await desconectarDB();
      process.exit(0);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
