# Documentación de Avance — Sistema de Gestión del Laboratorio (SENA)

**Fecha:** 08/10/2026
**Estado:** Backend construido con arquitectura MVC (Node.js + Express + MongoDB Atlas)

---

## 1. Resumen del proyecto

Sistema web para la gestión integral del laboratorio de análisis (SENA). Cubre el flujo completo desde el registro de usuarios, el catálogo de exámenes, la creación de solicitudes y cotizaciones, el pago, la recepción y análisis de muestras, hasta la entrega de informes y encuestas de satisfacción.

### Avance realizado
1. Organización de los documentos en la carpeta `DOCUMENTACION/`.
2. Creación de la estructura de carpetas del backend.
3. Implementación completa de la **capa Model** (25 esquemas Mongoose).
4. Implementación completa de la **capa Controller** (13 controladores).
5. Implementación completa de la **capa Routes** (16 archivos de rutas).
6. Middlewares de autenticación, roles y manejo de errores.
7. Validadores, utilidades y configuración de subida de archivos.
8. Conexión a MongoDB Atlas verificada y funcionando.

---

## 2. Estructura actual del proyecto

```
la ficad/
├── DOCUMENTACION/
│   ├── Diagrama/
│   │   └── Diagrama sin título.drawio.png
│   ├── Requerimientos/
│   │   └── REQUERIMIENTOS_LABORATORIO Borrador 4.docx
│   ├── Scripts/
│   │   └── SCRIPT_CORREGIDO.sql
│   └── AVANCE_BACKEND.md          ← este documento
│
├── BACKEND/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js              # Conexión a MongoDB Atlas
│   │   │   └── multer.js          # Subida de archivos (JPG/PNG/PDF)
│   │   ├── models/                # 26 esquemas Mongoose
│   │   ├── constants/             # estados.js (máquinas) · camposPermitidos.js (whitelist)
│   │   ├── controllers/           # 13 controladores
│   │   ├── services/              # Lógica de negocio (códigos, SENA)
│   │   ├── routes/                # 16 archivos de rutas
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js       # JWT + roles
│   │   │   ├── transicion.middleware.js # 409 en transiciones inválidas
│   │   │   ├── propietario.middleware.js# Cliente solo lo suyo
│   │   │   ├── rateLimit.middleware.js  # límite en /auth
│   │   │   └── error.middleware.js      # 404 y errores
│   │   ├── validators/
│   │   │   ├── index.js
│   │   │   ├── auth.validators.js
│   │   │   └── usuario.validators.js
│   │   ├── utils/
│   │   │   ├── asyncHandler.js
│   │   │   ├── crudFactory.js     # CRUD genérico + whitelist
│   │   │   └── tokens.js          # JWT
│   ├── index.js                   # Punto de entrada único (Express + conexión + seed)
│   ├── uploads/                   # Archivos subidos
│   ├── .env                       # Variables de entorno
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── README.md
│
└── FRONTEN/                       # (sin tocar)
```

---

## 3. Tecnologías

| Componente | Tecnología |
|---|---|
| Entorno | Node.js |
| Framework | Express |
| Base de datos | MongoDB Atlas |
| ODM | Mongoose |
| Autenticación | JWT (jsonwebtoken) |
| Contraseñas | bcryptjs |
| Validación | express-validator |
| Subida de archivos | multer |
| CORS | cors |
| Variables de entorno | dotenv |

Dependencias de desarrollo: `nodemon`.

---

## 4. Modelos (capa Model)

Se crearon **25 esquemas** en `src/models/`. Los campos en SQL se tradujeron a camelCase.

### 4.1 Usuarios y acceso
| Modelo | Campos principales |
|---|---|
| **Rol** | nombre (único), descripcion, estado, modulos[] (ref Modulo) |
| **Modulo** | nombre (único), ruta (único), estado |
| **TipologiaCliente** | nombre (único) |
| **Usuario** | rol, tipologia, nombres, apellidos, tipoDocumento (CC/TI/CE), numeroDocumento, correo (único), telefono, contrasenaHash, tipoUsuario (SENA/EXTERNO), activo, fechaRegistro, tokenRecuperacion, tokenExpiracion |
| **VerificacionSena** | usuario (único), correoInstitucional, numeroFicha, numeroContratoCedula, archivoSoporte, estado (Pendiente/Aprobada/Rechazada), fechaSolicitud, revisadoPor, fechaRevision |

### 4.2 Catálogo
| Modelo | Campos principales |
|---|---|
| **CategoriaAnalisis** | nombre (único), descripcion |
| **TipoMuestra** | nombre (único), descripcion |
| **Examen** | categoria, tipoMuestra, nombre, descripcion, precio, tiempoRespuestaDias, cantidadRequerida, unidadMedida, tipoEnvase, temperaturaConservacion, tiempoMaxTrasladoHoras, requiereTemperatura, activo |

### 4.3 Solicitud y cotización
| Modelo | Campos principales |
|---|---|
| **Solicitud** | usuario, tipoMuestra, codigoPresolicitud (único), descripcionMuestra, origen (Rural/Industrial/Doméstico), cantidadEstimada, estado, fechaCreacion, fechaCierre, autorizacion (embebida) |
| **Cotizacion** | solicitud, numeroCotizacion (único), fechaEmision, valorTotal, exonerada, estado (Enviada/Aceptada/No aceptada), archivoPdf, detalles[] (embebido) |

### 4.4 Pagos
| Modelo | Campos principales |
|---|---|
| **CuentaRecaudo** | banco, tipoCuenta (Ahorros/Corriente), numeroCuenta (único), titular, activa |
| **CuponPago** | cotizacion (único), codigoReferencia (único), fechaEmision, fechaLimitePago, cuentas[] (ref) |
| **Pago** | cupon, verificadoPor, metodo, archivoComprobante, numeroReciboCaja, fechaPagoReportada, valorReportado, estado, fechaCarga, fechaRevision, observacion |

### 4.5 Muestras
| Modelo | Campos principales |
|---|---|
| **Muestra** | solicitud, recepcionista, analista, entregadoPor, fechaHoraEntrega, cantidadRecibida, unidadMedida, estadoEmpaque, temperaturaRecepcion, codigoMuestra (único), prioridad (A1/A2), numeroTurno, estado, etapaActual, observaciones, fechaIngreso, examenes[] (embebido) |
| **MotivoRechazo** | nombre (único) |
| **Rechazo** | muestra (único), motivo, registradoPor, observaciones, evidenciaFoto, actaPdf, fechaRechazo, decisionCliente (Pendiente/Reenviar/Recoger) |
| **HistorialMuestra** | muestra, usuario, accion, etapa, valorAnterior, valorNuevo, comentario, fechaHora |

### 4.6 Entregables
| Modelo | Campos principales |
|---|---|
| **Informe** | muestra, revisadoPor, archivoPdf, estado (En revisión/Aprobado), fechaValidacion, fechaEnvio |
| **PreguntaEncuesta** | texto, tipo, activa |
| **Encuesta** | solicitud (único), comentario, fechaRespuesta, respuestas[] (embebido) |

### 4.7 Comunicación y configuración
| Modelo | Campos principales |
|---|---|
| **PlantillaMensaje** | modificadoPor, nombre, tipo, canal, asunto, cuerpo, fechaModificacion |
| **Notificacion** | usuario, plantilla, solicitud, canal (Correo/App), asunto, contenido, fechaEnvio, leida |
| **OpcionAsistenteIA** | modificadoPor, numeroOpcion (único), textoOpcion, prompt, activa, fechaModificacion |
| **ParametroSistema** | modificadoPor, clave (único), valor, descripcion, fechaModificacion |
| **Inconformidad** | usuario, solicitud, tipo (Petición/Queja/Reclamo), categoria, descripcion, soporte, estado, fechaRegistro, fechaResolucion |

### 4.8 Decisión de diseño: MySQL → MongoDB
Las tablas intermedias N:M del script SQL se convirtieron en **documentos embebidos** o **arrays de referencias**:

| Tabla SQL | Representación en MongoDB |
|---|---|
| ROL_MODULO | `Rol.modulos[]` (ref Modulo) |
| AUTORIZACION | subdocumento `Solicitud.autorizacion` |
| DETALLE_COTIZACION | `Cotizacion.detalles[]` (embebido) |
| CUPON_CUENTA | `CuponPago.cuentas[]` (ref CuentaRecaudo) |
| MUESTRA_EXAMEN | `Muestra.examenes[]` (embebido) |
| RESPUESTA_ENCUESTA | `Encuesta.respuestas[]` (embebido) |

---

## 5. Controladores (capa Controller)

**13 controladores** en `src/controllers/`. Se usa un `crudFactory` genérico (`listar`, `obtener`, `crear`, `actualizar`, `eliminar`) y se añade lógica específica cuando es necesario.

| Controlador | Responsabilidad | Métodos especiales |
|---|---|---|
| auth.controller | registro, login, perfil, cambio de contraseña | encriptado de contraseña, JWT |
| usuario.controller | usuarios + verificación SENA | aprobar/rechazar verificación |
| rol.controller | roles + módulos | — |
| catalogo.controller | categorías, tipos de muestra, exámenes | — |
| solicitud.controller | solicitudes + cotizaciones | genera códigos PRE-/COT- |
| pago.controller | cuentas, cupones, pagos | verificar pago |
| muestra.controller | muestras + historial | generar código MU-, cambiar etapa |
| rechazo.controller | motivos + rechazos | — |
| informe.controller | informes | — |
| encuesta.controller | preguntas + encuestas | — |
| notificacion.controller | notificaciones | — |
| configuracion.controller | plantillas, IA, parámetros, tipologías | — |
| inconformidad.controller | PQR | — |

---

## 6. Rutas / Endpoints (capa Routes)

Todas las rutas viven bajo `/api` y están protegidas con JWT, **salvo el catálogo público**
(`GET /api/catalogo/*`) y las rutas públicas de `auth`. Los accesos administrativos usan `autorizar('Administrador')`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/registro` | Registrar usuario (público) |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/perfil` | Perfil del usuario autenticado |
| PUT | `/api/auth/cambiar-contrasena` | Cambiar contraseña |
| CRUD | `/api/usuarios` | Usuarios |
| CRUD | `/api/usuarios/verificaciones` | Verificación SENA (+ aprobar/rechazar) |
| CRUD | `/api/roles` | Roles |
| CRUD | `/api/modulos` | Módulos |
| GET | `/api/catalogo/{categorias,tipos-muestra,examenes}` | **Catálogo público** (sin token, filtros y paginación) |
| CRUD | `/api/catalogo/categorias` | Categorías (escritura: Administrador) |
| CRUD | `/api/catalogo/tipos-muestra` | Tipos de muestra (escritura: Administrador) |
| CRUD | `/api/catalogo/examenes` | Exámenes (escritura: Administrador) |
| CRUD | `/api/solicitudes` | Solicitudes (+ `POST /sugerencias`) |
| CRUD | `/api/cotizaciones` | Cotizaciones (+ `POST /:id/aceptar`, `GET /:id/pdf`) |
| CRUD | `/api/pagos/cuentas` | Cuentas de recaudo |
| CRUD | `/api/pagos/cupones` | Cupones |
| CRUD | `/api/pagos` | Pagos (+ `/:id/verificar`) |
| CRUD | `/api/muestras` | Muestras (+ `/:id/cambiar-etapa`) |
| CRUD | `/api/muestras/historial` | Historial |
| CRUD | `/api/rechazos/motivos` | Motivos de rechazo |
| CRUD | `/api/rechazos` | Rechazos |
| CRUD | `/api/informes` | Informes |
| CRUD | `/api/encuestas/preguntas` | Preguntas |
| CRUD | `/api/encuestas` | Encuestas |
| CRUD | `/api/notificaciones` | Notificaciones |
| CRUD | `/api/configuracion/plantillas` | Plantillas |
| CRUD | `/api/configuracion/opciones-ia` | Opciones IA |
| CRUD | `/api/configuracion/parametros` | Parámetros |
| CRUD | `/api/configuracion/tipologias` | Tipologías |
| CRUD | `/api/inconformidades` | PQR |

---

## 7. Middlewares, validadores y utilidades

### Middlewares (`src/middlewares/`)
- **auth.middleware.js**: `proteger` (valida el token JWT y carga el usuario) y `autorizar(...roles)` (restringe por rol).
- **error.middleware.js**: `notFound` (404) y `manejadorErrores` (errores de validación de Mongoose, claves duplicadas, IDs inválidos).

### Validadores (`src/validators/`)
- `auth.validators.js`: reglas para registro y login.
- `usuario.validators.js`: reglas para crear/actualizar usuarios.
- `solicitud.validators.js`: creación de pre-solicitud y de sugerencias (RF-16).
- `cotizacion.validators.js`: creación de cotización (solo `solicitud` + `examenes`) y
  aceptación con firma digital (RF-13: base64, nombre, documento y términos).
- `index.js`: `validarCampos`, devuelve los errores de express-validator.

### Utilidades (`src/utils/`)
- `asyncHandler.js`: envuelve controladores async para capturar errores.
- `crudFactory.js`: CRUD genérico reutilizable (aplica whitelist de campos y `req.alcance`).
- `tokens.js`: generar/verificar JWT.
- `paginar.js`: paginación con tope de `limite` y expresiones regulares escapadas.

### Servicios (`src/services/`)
- `codigos.service.js`: códigos consecutivos y atómicos vía `Contador` (PRE-, COT-, CUP-, A1/A2-).
- `sena.service.js`: `esSenaExonerado` (async) — `tipoUsuario === 'SENA'` o verificación aprobada.
- `sugerencia.service.js`: motor de reglas de baterías con punto de extensión `MOTORES[]` (RF-11/RF-16).
- `cotizacion.service.js`: `calcularCotizacion` — snapshot de precios y exoneración (RF-06).
- `cupones.service.js`: `emitirCupon` — cotización aceptada, valor > 0, un cupón, cuentas activas (RF-09).
- `pdf.service.js`: PDF de la cotización con `pdfkit` → `uploads/cotizaciones/`.

### Configuración (`src/config/`)
- `db.js`: conexión a MongoDB Atlas.
- `multer.js`: subida de archivos (máx. 5 MB, solo JPG/PNG/PDF) a `uploads/`.

---

## 8. Cómo ejecutar el proyecto

```bash
cd BACKEND
npm install          # instala dependencias
npm run dev          # arranca en modo desarrollo (nodemon)
```

Requisitos previos:
1. Tener el archivo `.env` con la `MONGODB_URI` de Atlas y el `JWT_SECRET`.
2. Tener configurado el cluster, el usuario y el acceso de red en MongoDB Atlas.

Al arrancar debe mostrar:
```
✅ Conexión a MongoDB Atlas exitosa
🚀 Servidor corriendo en http://localhost:3000
```

---

## 9. Próximos pasos pendientes

1. **Script de seed** (`src/seed.js`): crear roles iniciales (Administrador, Recepcionista, Analista, Cliente) y un usuario administrador con contraseña encriptada, ya que la base de datos está vacía.
2. **Pruebas de endpoints** con Postman/Thunder Client.
3. **Conexión con el frontend** (pendiente, no se ha tocado `FRONTEN/`).
4. **Envío real de correos/notificaciones** (actualmente las notificaciones solo se registran en BD).
5. **Revisión de las 3 vulnerabilidades "high"** reportadas por `npm audit`.
