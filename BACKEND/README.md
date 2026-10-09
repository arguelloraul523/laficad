# BACKEND — Sistema de Gestión del Laboratorio (SENA)

Backend construido con **Node.js + Express + MongoDB Atlas (Mongoose)**, siguiendo una estructura **MVC**.

## Estructura de carpetas

```
BACKEND/
├── src/
│   ├── config/        # db.js (conexión a MongoDB Atlas) · multer.js (subida)
│   ├── constants/     # estados.js (máquinas de estado) · camposPermitidos.js (whitelist)
│   ├── models/        # Esquemas Mongoose (Model)
│   ├── controllers/   # Controladores (capa fina)
│   ├── services/      # Lógica de negocio
│   ├── routes/        # Rutas de la API
│   ├── middlewares/   # Auth, roles, transiciones, propiedad, rate limit, errores
│   ├── validators/    # Esquemas de validación de entrada
│   └── utils/         # Helpers (tokens, mailer, CRUD)
├── uploads/           # Archivos subidos (firmas, comprobantes, informes)
├── index.js           # Punto de entrada único (Express + conexión + seed)
├── .env               # Variables de entorno (NO subir al repositorio)
├── .env.example       # Plantilla de variables de entorno
├── .gitignore
├── package.json
└── README.md
```

## Instalación

```bash
npm install
```

1. Copia `.env.example` a `.env` y completa la `MONGODB_URI` de tu cluster en Atlas.
2. Ejecuta en desarrollo:

```bash
npm run dev
```

## Nota sobre el modelo de datos

El diseño original está en `DOCUMENTACION/Scripts/SCRIPT_CORREGIDO.sql` (MySQL). En MongoDB, las tablas N:M se modelan con **arrays de referencias** o **documentos embebidos**, según se defina en cada módulo.

## Datos iniciales (seed)

```bash
npm run seed
```

Crea módulos, roles (Administrador, Recepcionista, Analista, Cliente), tipologías de cliente y un usuario administrador:

- **Correo:** `admin@laboratorio.com` (configurable en `.env` con `ADMIN_CORREO`)
- **Contraseña:** `Admin1234` (configurable con `ADMIN_CONTRASENA`)

## Recuperación de contraseña

- `POST /api/auth/olvide-contrasena` → genera un token temporal.
- `POST /api/auth/restablecer-contrasena` → restablece la contraseña con el token.

Si configuras las variables `MAIL_*` en `.env`, el token se envía por correo; si no, se devuelve en la respuesta (modo desarrollo).
