# REGLAS DE NEGOCIO — Sistema de Gestión del Laboratorio (SENA)

> Documento de contrato funcional. La fuente técnica viva es
> [`MEMORIA_PROYECTO.md`](./MEMORIA_PROYECTO.md); este documento detalla **quién puede hacer qué**
> (matriz de roles) y **qué transiciones de estado son válidas** (máquinas de estado).
>
> Última actualización: **2026-10-08**.

---

## 1. Roles del sistema

| Rol | Equivalente de negocio | Descripción |
|---|---|---|
| `Administrador` | **Jefe de Laboratorio** (RF-27/RF-31) | Control total: usuarios, catálogo, configuración, aprobar pagos y verificaciones SENA, des-anonimizar. |
| `Recepcionista` | Recepción de muestras | Gestiona solicitudes, cotizaciones, cupones, **verifica pagos** y recibe muestras. |
| `Analista` | Analista de laboratorio | Procesa muestras y ensayos, cambia etapas, genera informes. **Nunca ve datos del cliente (RF-22).** |
| `Cliente` | Usuario externo / SENA | Crea pre-solicitudes, paga, consulta **solo sus propios registros** y responde encuestas. |

### 1.1 Rol `Cajero` (RF-09) — decisión: **NO se crea**

La verificación de pagos (aprobar/rechazar comprobantes) la realizan **`Administrador` y
`Recepcionista`**. Se descartó crear un rol `Cajero` dedicado por decisión del 2026-10-08 (ver ADR en
la memoria del proyecto). Si en el futuro se exige segregación de funciones estricta, la única
restricción admisible sería limitar la verificación a `Administrador`.

### 1.2 Una persona, varios roles (multirrol)

En el laboratorio una misma persona puede cumplir **Recepcionista y Analista**. Para no violar RF-22:

- `Usuario.roles[]` = roles **asignados** a la persona.
- `Usuario.rol` = **rol activo** de la sesión. Todos los permisos se evalúan sobre el rol activo.
- `POST /api/auth/cambiar-rol { rol }` cambia el rol activo; **solo acepta un rol presente en
  `roles[]`** (si no, 403). El token JWT no cambia (solo lleva `id`).
- Con rol activo **Analista**, el backend solo expone código ciego (RF-22) aunque la persona también
  sea Recepcionista.
- La segregación es **por sesión**, no física: la persona puede alternar, pero cada acción queda
  atribuida al usuario; la ampliación de permisos es explícita y auditable.

### 1.3 Verificación SENA: solo `@sena.edu.co`

La solicitud de verificación (`POST /api/usuarios/verificaciones`) **solo admite un
`correoInstitucional` que termine en `@sena.edu.co`** (exacto: se rechazan subdominios como
`@virtual.sena.edu.co`). Decisión del 2026-10-09.

| Capa | Cómo lo aplica |
|---|---|
| Validador (`usuario.validators.js`) | `trim` + `toLowerCase` + `isEmail` + `matches(/@sena\.edu\.co$/)` → **400** |
| Modelo (`VerificacionSena`) | `match` en `correoInstitucional` (defensa ante escrituras directas) |
| Aprobar (`PUT /verificaciones/:id/aprobar`) | si el guardado no cumple → **400**; **rechazar siempre se permite** |
| Constante única | `src/constants/sena.js` → `DOMINIO_SENA`, `RE_CORREO_SENA`, `esCorreoSena()` |

- El ancla `$` impide trucos tipo `x@sena.edu.co.evil.com`; `isEmail().bail()` descarta
  `x@evil.com@sena.edu.co`.
- La validación corre **después** de multer (el correo llega como campo del multipart).
- No afecta al correo personal de la cuenta (`Usuario.correo`): ese sigue siendo libre.

---

## 2. Matriz rol → permisos (objetivo contractual)

Leyenda: **R** listar/obtener · **C** crear · **U** actualizar · **D** eliminar · **—** sin acceso.
"Propio" = solo los registros del usuario (propiedad, sección 4).

| Recurso / acción | Administrador | Recepcionista | Analista | Cliente |
|---|:--:|:--:|:--:|:--:|
| Auth: registro/login/recuperación | ✓ | ✓ | ✓ | ✓ |
| Auth: perfil, cambiar contraseña, cambiar rol activo | ✓ | ✓ | ✓ | ✓ |
| Usuarios: R / C / U / D | ✓ | — | — | — |
| Verificación SENA: R / C | ✓ | ✓ | ✓ | ✓ (propia) |
| Verificación SENA: aprobar / rechazar / D | ✓ | — | — | — |
| Roles y Módulos: R | ✓ | ✓ | ✓ | ✓ |
| Roles y Módulos: C / U / D | ✓ | — | — | — |
| Catálogo (categorías, tipos, exámenes): R | ✓ | ✓ | ✓ | ✓ |
| Catálogo: C / U / D | ✓ | — | — | — |
| Solicitudes: R / C | ✓ | ✓ | — | Propio |
| Solicitudes: U (estado) | ✓ | ✓ | — | — |
| Solicitudes: D | ✓ | — | — | — |
| Cotizaciones: R | ✓ | ✓ | — | Propio |
| Cotizaciones: C / U (estado) | ✓ | ✓ | — | — |
| Cotizaciones: D | ✓ | — | — | — |
| Pagos · cuentas: R | ✓ | ✓ | ✓ | ✓ |
| Pagos · cuentas: C / U / D | ✓ | — | — | — |
| Pagos · cupones: R | ✓ | ✓ | — | Propio |
| Pagos · cupones: C | ✓ | ✓ | — | — |
| Pagos · cupones: U / D | ✓ | — | — | — |
| Pagos: R | ✓ | ✓ | — | Propio |
| Pagos: C (reportar comprobante) | ✓ | ✓ | — | Propio |
| Pagos: verificar (aprobar/rechazar) | ✓ | ✓ | — | — |
| Pagos: bandeja de pendientes | ✓ | ✓ | — | — |
| Pagos: D | ✓ | — | — | — |
| Muestras / historial: R | ✓ | ✓ | ✓ (código ciego) | Propio |
| Muestras: C | ✓ | ✓ | — | — |
| Muestras: cambiar estado / etapa | ✓ | ✓ | ✓ | — |
| Muestras: D | ✓ | — | — | — |
| Rechazos · motivos: R | ✓ | ✓ | ✓ | — |
| Rechazos · motivos: C / U / D | ✓ | — | — | — |
| Rechazos: R / C / U | ✓ | ✓ | ✓ | — |
| Rechazos: D | ✓ | — | — | — |
| Informes: R | ✓ | ✓ | ✓ | Propio |
| Informes: C / U | ✓ | — | ✓ | — |
| Informes: D | ✓ | — | — | — |
| Encuestas · preguntas: R | ✓ | ✓ | ✓ | ✓ |
| Encuestas · preguntas: C / U / D | ✓ | — | — | — |
| Encuestas: R / C / U | ✓ | ✓ | ✓ | Propio |
| Encuestas: D | ✓ | — | — | — |
| Notificaciones: R / U (leída) | ✓ | ✓ | ✓ | Propio |
| Notificaciones: C / D | ✓ | — | — | — |
| Configuración (plantillas, IA, parámetros, tipologías): R | ✓ | ✓ | ✓ | ✓ |
| Configuración: C / U / D | ✓ | — | — | — |
| Inconformidades (PQR): R / C | ✓ | ✓ | ✓ | Propio |
| Inconformidades: U / D | ✓ | — | — | — |

> **Analista y datos del cliente (RF-22/RNF-01):** aunque la tabla muestre ✓ de lectura en
> solicitudes/muestras, para el rol **Analista** el backend debe devolver la versión **con código
> ciego** (sin identidad del cliente). Es una regla transversal, no una fila.

---

## 3. Máquinas de estado

La fuente ejecutable es `BACKEND/src/constants/estados.js`. Una transición no listada **se rechaza
con HTTP 409** (`transicion.middleware.js`). Los estados terminales (sin salidas) quedan cerrados.

### 3.1 Solicitud (`Solicitud.estado`) — inicial `Pre-solicitud`

| Desde | Hacia (permitidos) | Actor |
|---|---|---|
| `Pre-solicitud` | `Cotizada`, `No aceptada`, `Cancelada` | Recepcionista/Admin |
| `Cotizada` | `Pendiente de pago`, `Pagada`, `Cancelada` | Sistema al aceptar la firma: emite cupón si valor > 0 → `Pendiente de pago`; **exonerada → `Pagada`**; Admin |
| `Pendiente de pago` | `Pagada`, `Cancelada` | Sistema (pago verificado); Admin |
| `Pagada` | `En proceso` | Recepcionista/Admin (recepción de muestra) |
| `En proceso` | `Finalizada` | Analista/Admin (informe aprobado) |
| `Finalizada` | — (terminal) | — |
| `No aceptada` | — (terminal) | — |
| `Cancelada` | — (terminal) | — |

```
Pre-solicitud ─▶ Cotizada ─┬─▶ Pendiente de pago ─▶ Pagada ─▶ En proceso ─▶ Finalizada
                           ├─▶ Pagada        (exonerada SENA: salta aquí, sin cupón)
                           └─▶ Cancelada
Pre-solicitud ─▶ No aceptada
```

> **Importante:** la arista `Cotizada → Pagada` **solo la usa el servidor** al aceptar una
> cotización exonerada. El camino normal de un externo es `Cotizada → Pendiente de pago → Pagada`;
> una solicitud `Pendiente de pago` **no puede recibir muestra** (409, RF-09).

### 3.2 Cotización (`Cotizacion.estado`) — inicial `Enviada`

| Desde | Hacia | Actor |
|---|---|---|
| `Enviada` | `Aceptada`, `No aceptada` | Cliente |
| `Aceptada` | — (terminal) | — |
| `No aceptada` | — (terminal) | — |

### 3.3 Pago (`Pago.estado`) — inicial `Pendiente de verificación`

| Desde | Hacia | Actor | Regla |
|---|---|---|---|
| `Pendiente de verificación` | `Pagado` | Admin/Recepcionista | deja `verificadoPor` y `fechaRevision`; **avanza la `Solicitud` a `Pagada`** y dispara `pagoAprobado` |
| `Pendiente de verificación` | `Rechazado` | Admin/Recepcionista | **exige `observacion`** (RF-09); dispara `pagoRechazado` con el motivo |
| `Rechazado` | `Pendiente de verificación` | Cliente (nuevo comprobante) | reintento permitido: en la API se materializa como un **nuevo `Pago`** para el mismo cupón |
| `Pagado` | — (terminal) | — | — |

Cada cambio queda en `Pago.historial[]` (estado, fecha, usuario y observación), escrito solo por el
servidor; el cliente lo ve en **`GET /api/pagos/mis-pagos`** y en `GET /api/pagos/:id`.

### 3.4 Muestra

**Estado (`Muestra.estado`)** — inicial `Recibida`

| Desde | Hacia | Actor |
|---|---|---|
| `Recibida` | `Aceptada`, `En observación`, `Rechazada` | Recepcionista/Admin |
| `Aceptada` | `En observación` | Recepcionista/Admin |
| `En observación` | `Aceptada`, `Rechazada` | Recepcionista/Admin |
| `Rechazada` | — (terminal) | — |

**Etapa (`Muestra.etapaActual`)** — inicial `Recepción`

| Desde | Hacia | Actor |
|---|---|---|
| `Recepción` | `Análisis` | Recepcionista/Admin |
| `Análisis` | `Observaciones`, `Resultados` | Analista |
| `Observaciones` | `Análisis`, `Resultados` | Analista |
| `Resultados` | `Validación`, `Re-ensayo` | Analista |
| `Validación` | `Finalizada`, `Re-ensayo` | Admin (Jefe) |
| `Re-ensayo` | `Resultados` | Analista |
| `Finalizada` | — (terminal) | — |

> `Re-ensayo` exige justificación (RF-23); `Rechazada` de muestra exige motivo parametrizado (RF-20).

---

## 4. Propiedad de los registros (Cliente)

- En **listados** (`GET /`), el `Cliente` recibe únicamente sus propios registros
  (`filtrarPropios` + `req.alcance` en `crudFactory`).
- En **detalle/edición** (`GET/PUT/DELETE /:id`), si el recurso no es suyo → **403**
  (`exigirPropietario`).
- Cadena de propiedad: `Solicitud.usuario` → `Cotizacion`/`Encuesta`/`Muestra` vía `solicitud` →
  `CuponPago` vía `cotizacion` → `Pago` vía `cupon` → `Informe` vía `muestra`.
- Al **crear**, el `Cliente` no puede fijar `usuario`/`solicitud` ajenos (`fijarUsuarioPropio`).

---

## 5. Whitelist de campos (nunca desde `req.body`)

Regla inviolable #12: **el rol y el estado no se aceptan del cliente.** `crudFactory` descarta del
body (`src/constants/camposPermitidos.js`):

- Identidad/permisos: `_id`, `__v`, `createdAt`, `updatedAt`, `contrasenaHash`,
  `tokenRecuperacion`, `tokenExpiracion`, `rol`, `roles`, `tipoUsuario`, `activo`.
- Códigos/valores de servidor: `codigoPresolicitud`, `codigoMuestra`, `numeroCotizacion`,
  `codigoReferencia`, `prioridad`, `numeroTurno`, `verificadoPor`, `exonerada`,
  `historial`, `fechaCarga`, `fechaRevision` (auditoría de pagos).
- Estados: `estado`, `etapaActual` → **solo** si un middleware de transición los validó.

El **registro público** (`POST /api/auth/registro`) fija en servidor `rol = Cliente` y
`tipoUsuario = 'EXTERNO'`; el paso a `SENA` requiere verificación/aprobación (cierra RF-02/RF-06).

---

## 6. Criterios de cierre (aceptación)

1. Una **transición inválida** responde **HTTP 409** con `{ ok: false, mensaje }`.
2. Un **Cliente no puede leer** (ni editar) registros de otro → **HTTP 403**.
3. **`rol` / `tipoUsuario` / `estado`** enviados en el body se **ignoran** (whitelist).
4. Un **externo no puede registrarse como `SENA` ni como `Administrador`.**
5. `cambiar-rol` con un rol no asignado responde **403**.
6. Crear una verificación SENA con un correo que no sea `@sena.edu.co` responde **400**; aprobar
   una solicitud con correo heredado no válido también responde **400** (rechazar sí procede).

---

## 7. Catálogo público, pre-solicitud y sugerencias (RF-05, RF-16)

### 7.1 Catálogo público (sin token)

`GET /api/catalogo/{categorias, tipos-muestra, examenes}` y sus `/:id` **no requieren autenticación**.
Solo lectura: las escrituras siguen `proteger` + `autorizar('Administrador')`.

| Parámetro | Aplica a | Descripción |
|---|---|---|
| `q` | todos | palabra clave en `nombre`/`descripcion` (regex **escapada**, insensible a mayúsculas) |
| `categoria` | exámenes | id de `CategoriaAnalisis` |
| `tipoMuestra` | exámenes | id de `TipoMuestra` |
| `pagina` / `limite` | todos | default `1` / `10`; **`limite` tope 50** |
| `orden` / `dir` | exámenes | `nombre` · `precio` · `tiempoRespuestaDias` / `asc`\|`desc` |

- Solo se publican exámenes con `activo: true`.
- Respuesta: `{ ok, total, pagina, limite, totalPaginas, data }`.

### 7.2 Pre-solicitud con análisis opcionales

Campos: `tipoMuestra`, `descripcionMuestra`, `origen`, `cantidadEstimada` y **`examenes` (opcional)**.

- `Solicitud.examenes[]` guarda `{ examen, origen, precioUnitario }`.
- **`precioUnitario` es un snapshot del catálogo al momento de elegir** (RF-06): cambiar el precio
  después no altera lo que el cliente ya vio.
- **El precio lo pone el servidor**: el cliente solo envía ids; un id inexistente o inactivo → **400**.
- **Si el cliente no envía `examenes`, la lista queda `[]`** (decisión 2026-10-09). Las sugerencias
  siguen devolviéndose en la respuesta, pero no se guardan solas.
- `examenes` está en la whitelist: solo el personal (Admin/Recepcionista) puede ajustarlo por `PUT`.

### 7.3 Motor de sugerencias (RF-16)

`src/services/sugerencia.service.js` — reglas simples sobre el catálogo:

| Regla | Señal | Puntaje |
|---|---|:--:|
| R1 | `tipoMuestra` coincide con el examen | **+3** |
| R2 | `categoria` coincide con el examen | **+2** |
| R3 | palabra de la descripción aparece en el nombre/descripción del examen | **+1** por palabra |

- Se normaliza a minúsculas, sin acentos, se descartan palabras vacías.
- Cada sugerencia lleva `razones` (`"tipo de muestra"`, `"palabra clave: sulfato"`), se ordena por
  puntaje descendente y se limita (por defecto 10, máximo 50).

**Punto de extensión para IA (RF-11):** el motor es un array `MOTORES`. Para añadir IA sin tocar
controladores: `MOTORES.push(sugerirPorIA)`. `sugerirExamenes()` fusiona puntajes y razones de
todos los motores activos.

### 7.4 Endpoints

| Endpoint | Auth | Devuelve |
|---|---|---|
| `POST /api/solicitudes/sugerencias` | token | `{ ok, total, data: [...] }` |
| `POST /api/solicitudes` | token | `{ ok, data: { codigoPresolicitud, examenes, ... }, sugerencias }` |

El flujo del cliente es: pedir sugerencias → **ajustar la lista** → crear la pre-solicitud con la
lista confirmada.

### 7.5 Criterio de cierre

**Crear una pre-solicitud devuelve su código (`PRE-AAAA-NNNN`) y la lista de exámenes sugeridos.**

---

## 8. Cotización: cálculo, PDF, firma y cupón (RF-06, RF-09, RF-13)

### 8.1 Cálculo (`services/cotizacion.service.js`)

`POST /api/cotizaciones` (Admin/Recepcionista) recibe `{ solicitud, examenes? }` con
`examenes: [{ examen, cantidadMuestras }]`. **Nunca** acepta `valorTotal`, `exonerada` ni `detalles`
(whitelist): el servidor:

1. Lee el precio **vigente** del catálogo (`Examen.activo`); id inválido o inactivo → **400**.
2. Guarda en `detalles[]` un **snapshot** `{ examen, cantidadMuestras, precioUnitario }`.
3. `valorTotal = Σ precioUnitario × cantidadMuestras`.
4. Si el usuario es **SENA verificado** → `valorTotal = 0` y `exonerada = true`.
5. Genera el **PDF** y deja la solicitud en `Cotizada` (409 si no estaba en `Pre-solicitud`).

Si no se envían `examenes`, se cotizan los de la pre-solicitud (cantidad 1).

**SENA verificado** = `Usuario.tipoUsuario === 'SENA'` **o** `VerificacionSena.estado === 'Aprobada'`.

### 8.2 PDF (`services/pdf.service.js`)

- Se guarda en `uploads/cotizaciones/<numeroCotizacion>.pdf` y la ruta queda en `Cotizacion.archivoPdf`.
- `GET /api/cotizaciones/:id/pdf` → **solo el dueño de la solicitud o el Administrador** (403 para
  el resto); sin archivo → 404.
- El acceso directo `/uploads/cotizaciones/...` responde **403** (`index.js`): el PDF solo se
  descarga por el endpoint autorizado.

### 8.3 Aceptar con firma digital (RF-13)

`POST /api/cotizaciones/:id/aceptar` (Cliente dueño, Admin o Recepcionista):

| Campo | Regla |
|---|---|
| `nombreFirmante`, `documentoFirmante` | obligatorios |
| `firmaImagen` | `data:image/(png\|jpg\|jpeg\|webp);base64,...`, máx. ~600 KB → `uploads/firmas/<cotizacion>.png` |
| `aceptaTerminos` | debe ser `true` |

Faltan datos → **400**. Guarda `Solicitud.autorizacion` con `{ ..., fechaHoraFirma, ip }`.
La cotización pasa a `Aceptada`; si ya estaba decidida → **409**.

### 8.4 Cupón (`services/cupones.service.js`)

Se emite **automáticamente al aceptar** si `exonerada === false`; si no, con
`POST /api/cotizaciones` no procede y `POST /pagos/cupones` devuelve:

| Condición | Respuesta |
|---|---|
| cotización ≠ `Aceptada` | **409** |
| `valorTotal ≤ 0` (exonerada) | **400** |
| ya existe cupón para esa cotización | **409** |
| no hay `CuentaRecaudo.activa` | **409** |
| cuentas indicadas no activas | **400** |
| `fechaLimitePago` no futura | **400** |

`fechaLimitePago` = hoy + `ParametroSistema['diasVigenciaCupon']` (**default 15 días**).

### 8.5 Recepción (RF-09)

`POST /api/muestras` exige que la solicitud esté en **`Pagada`** → si está en `Pendiente de pago`
(u otro estado) responde **409**. El exonerado pasa porque su solicitud ya quedó `Pagada`.

### 8.6 Criterios de cierre

1. Un **SENA verificado** acepta la cotización → `valorTotal 0`, solicitud `Pagada`, **sin cupón**,
   y `POST /api/muestras` responde **201**.
2. Un **externo** acepta → solicitud `Pendiente de pago` + **cupón único** emitido; sin cupón
   pagado, `POST /api/muestras` responde **409**.
3. El PDF solo lo descarga el dueño o el Administrador (**403** para el resto).

---

## 9. Pagos: registro, verificación, bandeja y notificaciones (RF-08, RF-09, RF-12, RF-33)

Lógica en `BACKEND/src/services/pagos.service.js`; eventos en `eventos.service.js` y notificaciones
en `notificaciones.service.js`.

### 9.1 Registrar un pago — `POST /api/pagos` (multipart o JSON)

Roles: `Administrador`, `Recepcionista` y `Cliente` (el Analista **no**). El Cliente solo puede
reportar sobre **sus propios cupones** (403 si es ajeno).

| Condición | Respuesta |
|---|---|
| cupón inexistente | **404** |
| cupón **vencido** (`fechaLimitePago < hoy`) | **409** — ya no se admiten nuevos reportes |
| cupón ajeno (Cliente) | **403** |
| método ≠ `Efectivo en caja SENA` y sin `archivoComprobante` | **400** |
| método = `Efectivo en caja SENA` y sin `numeroReciboCaja` | **400** |
| `metodo` fuera del enum, `fechaPagoReportada` inválida o `valorReportado < 0` | **400** |

- `metodo`: `Consignación bancaria` · `Transferencia electrónica` · `Efectivo en caja SENA`.
- El servidor fija **`estado = "Pendiente de verificación"`**, `fechaCarga`, `historial[0]` e ignora
  `estado`/`historial`/`fechaCarga`/`fechaRevision` si llegan en el cuerpo (whitelist, regla #12).
- Un cupón vencido **sí** permite verificar los pagos reportados a tiempo (solo se bloquean nuevos).

### 9.2 Verificar — `PUT /api/pagos/:id/verificar`

Roles: `Administrador`, `Recepcionista` (sin rol Cajero, decisión 2026-10-08).

| Condición | Respuesta |
|---|---|
| estado ≠ `Pendiente de verificación` | **409** |
| `aprobar: false` sin `observacion` | **400** |
| solicitud en estado no convertible a `Pagada` (solo al aprobar) | **409** |

- Siempre guarda `verificadoPor`, `fechaRevision` y agrega el evento al `historial`.
- **Al aprobar:** `Solicitud` `Pendiente de pago → Pagada` y emite el evento **`pagoAprobado`**.
- **Al rechazar:** no toca la solicitud y emite **`pagoRechazado`** con el motivo.

### 9.3 Eventos y notificaciones

| Evento | Notificación al cliente |
|---|---|
| `pagoAprobado` | App + correo (opcional SMTP) con las **instrucciones de muestra** tomadas del `Examen`: cantidad (`cantidadRequerida` + `unidadMedida`), `tipoEnvase`, `temperaturaConservacion` y `tiempoMaxTrasladoHoras` (RF-12) |
| `pagoRechazado` | App + correo con el **motivo** (`observacion`) y la indicación de reintentar desde "Mis pagos" |

Un fallo al notificar **no** rompe la respuesta HTTP de verificación (el emisor traga el error y lo
loguea).

### 9.4 Consultas

- `GET /api/pagos/pendientes` — bandeja solo para `Administrador`/`Recepcionista`, ordenada por
  `fechaCarga` **asc** (más antiguo primero) y paginada (`pagina`, `limite` ≤ 50).
- `GET /api/pagos/mis-pagos` — del Cliente: **solo los suyos**, con `estado` e `historial` de cambios.
- `GET /api/pagos/:id` — incluye el `historial` (el Cliente solo accede al suyo).

### 9.5 Criterios de cierre

1. Reportar comprobante sin archivo (consignación/transferencia) → **400**; en efectivo sin número
   de recibo → **400**.
2. Reportar sobre un cupón vencido → **409**; sobre un cupón ajeno → **403**.
3. Aprobar deja `verificadoPor`/`fechaRevision`, mueve la solicitud a `Pagada` y crea la notificación
   con las instrucciones de los exámenes.
4. Rechazar sin observación → **400**; con observación → notificación con el motivo.
5. `GET /api/pagos/pendientes` devuelve los pendientes del más antiguo al más reciente.
6. Con la solicitud aún `Pendiente de pago`, `POST /api/muestras` sigue respondiendo **409** (RF-09).
