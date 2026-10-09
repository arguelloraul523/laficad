# MEMORIA DEL PROYECTO — Sistema de Gestión del Laboratorio (SENA)

> **Documento de verdad única.** Cualquier sesión (humana o IA) debe leer este archivo **antes**
> de tocar el proyecto. Si algo contradice una **regla inviolable** (sección 5), hay que detenerse y
> preguntar. Las decisiones nuevas se registran en la sección 7; nunca se borra historia.
>
> Última actualización: **2026-10-09** · Documento vivo.

---

## 1. Propósito y stack

Sistema web para la gestión integral del **laboratorio de análisis del SENA**: registro de usuarios,
catálogo de exámenes, pre-solicitud, cotización, pago manual verificado, recepción y trazabilidad de
muestras, informes, encuestas, PQR, notificaciones y administración.

| Componente | Tecnología |
|---|---|
| Entorno | Node.js |
| Framework | Express |
| Base de datos | MongoDB Atlas |
| ODM | Mongoose |
| Autenticación | JWT (`jsonwebtoken`) |
| Hash de contraseñas | `bcryptjs` |
| Validación | `express-validator` |
| Subida de archivos | `multer` (JPG/PNG/PDF, máx. 5 MB) |
| Correo | `nodemailer` (opcional vía SMTP) |
| CORS | `cors` |
| Variables de entorno | `dotenv` |

- **Arquitectura:** MVC.
- **Módulo:** ES Modules (`"type": "module"`, Node ≥ 18). Convención: `export default` para módulos
  de un solo valor (modelos, rutas, `asyncHandler`, `crudFactory`, `validators/index`, `config/multer`)
  y `export` nombrado para services, utils, middlewares, controllers y constants; los imports
  relativos llevan extensión `.js` siempre.
- **Raíz del backend:** `BACKEND/` · punto de entrada único **`BACKEND/index.js`**: carga `.env`, configura Express, conecta MongoDB (vía **`src/config/db.js`**), arranca el servidor y, con el flag `--seed`, ejecuta la siembra (`npm run seed`).
- **Scripts:** `npm run dev` (nodemon), `npm start`, `npm run seed`.
- **Diseño de datos original:** `DOCUMENTACION/Scripts/SCRIPT_CORREGIDO.sql` (MySQL) → migrado a MongoDB.
- **Requerimientos fuente:** `DOCUMENTACION/Requerimientos/REQUERIMIENTOS_LABORATORIO Borrador 4.docx` (RF-01..RF-33, RNF-01..RNF-09).
- **Avance previo:** `DOCUMENTACION/AVANCE_BACKEND.md`.
- **Reglas de negocio (contrato):** `DOCUMENTACION/REGLAS_NEGOCIO.md` (matriz rol→permisos, multirrol y máquinas de estado).

---

## 2. Flujo lógico oficial

> Este flujo **no se cambia sin registrar una decisión** en la sección 7.

```
Registro
  → [SENA: verificación de identidad]            (RF-02)
  → Pre-solicitud                                 (RF-16)
  → Cotización (usuario SENA verificado = $0)     (RF-06)
  → Aceptar + firma digital                        (RF-13)
  → Cupón (SOLO si valor > 0)                      (RF-07)
  → Pago + comprobante                             (RF-08, RF-33)
  → Verificación manual del pago                   (RF-09)
  → Correo con instrucciones de muestra            (RF-12)
  → Recepción presencial                            (RF-17)
  → Código A1/A2 + turno                            (RF-18, RF-19)
  → Ingreso o Rechazo                               (RF-20)
  → Rótulo                                          (RF-21)
  → Etapas: Recepción → Análisis → Observaciones → Resultados → Validación
            (Validación puede enviar a Re-ensayo con justificación)   (RF-23)
  → Informe validado                                (RF-25)
  → Encuesta obligatoria                            (RF-26)
  → Descarga                                        (RF-25)
  → Cierre y notificación                           (RF-15)
```

- **Cotización exonerada (SENA):** salta **cupón** y **pago** (no se generan).
- **Código ciego:** desde recepción hasta validación, el área técnica solo ve el código A1/A2, nunca
  datos de identidad del cliente (RF-22, RNF-01).
- **Pago es manual:** el sistema no cobra ni integra pasarela; solo informa cuentas oficiales y
  registra el comprobante para verificación humana (RF-07, RF-08).

---

## 3. Roles y permisos

### 3.1 Roles existentes hoy (según `BACKEND/src/seed.js`)

`Administrador` (= Jefe de Laboratorio, RF-27/31), `Recepcionista`, `Analista`, `Cliente`.

- **Decisión adoptada (2026-10-08, RF-09):** **no se crea** un rol `Cajero`. La verificación de pagos
  la realizan `Administrador` y `Recepcionista`, como hoy. Si más adelante se requiere segregación
  estricta, restringir la verificación a `Administrador`.

### 3.2 Matriz real de permisos (tomada de `BACKEND/src/routes/*`)

> La autorización se hace con `autorizar('Rol', ...)`. Donde solo aparece `proteger`, **cualquier
> usuario autenticado** (incluido `Cliente`) puede ejecutar la acción. ⚠ = hoy excede lo deseable.

| Recurso / acción | Administrador | Recepcionista | Analista | Cliente | Público |
|---|:--:|:--:|:--:|:--:|:--:|
| Auth: registro, login, olvide/restablecer contraseña | ✓ | ✓ | ✓ | ✓ | ✓ |
| Auth: perfil, cambiar contraseña | ✓ | ✓ | ✓ | ✓ | — |
| Usuarios: listar / obtener | ✓ | ✓ | ✓ | ✓ | — |
| Usuarios: crear ⚠ | ✓ | ✓ | ✓ | ✓ | ✓ (sin `proteger`) |
| Usuarios: actualizar ⚠ | ✓ | ✓ | ✓ | ✓ | — |
| Usuarios: eliminar | ✓ | — | — | — | — |
| Verificación SENA: listar / crear solicitud | ✓ | ✓ | ✓ | ✓ | — |
| Verificación SENA: aprobar / rechazar / eliminar | ✓ | — | — | — | — |
| Roles y Módulos: listar | ✓ | ✓ | ✓ | ✓ | — |
| Roles y Módulos: crear / actualizar / eliminar | ✓ | — | — | — | — |
| Catálogo (categorías, tipos, exámenes): listar | ✓ | ✓ | ✓ | ✓ | — |
| Catálogo: crear / actualizar / eliminar | ✓ | — | — | — | — |
| Solicitudes: listar / obtener / crear / actualizar / eliminar ⚠ | ✓ | ✓ | ✓ | ✓ | — |
| Cotizaciones: listar | ✓ | ✓ | ✓ | ✓ | — |
| Cotizaciones: crear / actualizar | ✓ | ✓ | — | — | — |
| Cotizaciones: eliminar | ✓ | — | — | — | — |
| Pagos · cuentas: listar | ✓ | ✓ | ✓ | ✓ | — |
| Pagos · cuentas: crear / actualizar / eliminar | ✓ | — | — | — | — |
| Pagos · cupones: listar | ✓ | ✓ | ✓ | ✓ | — |
| Pagos · cupones: crear | ✓ | ✓ | — | — | — |
| Pagos · cupones: actualizar / eliminar | ✓ | — | — | — | — |
| Pagos: listar / obtener ⚠ | ✓ | ✓ | ✓ (hoy ve pagos ajenos) | Propio | — |
| Pagos: crear (reportar comprobante) | ✓ | ✓ | — | Propio (cupón propio) | — |
| Pagos: verificar (aprobar/rechazar) | ✓ | ✓ | — | — | — |
| Pagos: bandeja de pendientes | ✓ | ✓ | — | — | — |
| Pagos: eliminar | ✓ | — | — | — | — |
| Muestras / historial: listar / obtener ⚠ | ✓ | ✓ | ✓ | ✓ | — |
| Muestras: crear | ✓ | ✓ | — | — | — |
| Muestras: cambiar etapa ⚠ | ✓ | ✓ | ✓ | ✓ | — |
| Muestras: actualizar ⚠ | ✓ | ✓ | ✓ | ✓ | — |
| Muestras: eliminar | ✓ | — | — | — | — |
| Rechazos · motivos: listar | ✓ | ✓ | ✓ | ✓ | — |
| Rechazos · motivos: crear / actualizar / eliminar | ✓ | — | — | — | — |
| Rechazos: listar | ✓ | ✓ | ✓ | ✓ | — |
| Rechazos: crear | ✓ | ✓ | ✓ | — | — |
| Rechazos: actualizar ⚠ | ✓ | ✓ | ✓ | ✓ | — |
| Rechazos: eliminar | ✓ | — | — | — | — |
| Informes: listar / obtener | ✓ | ✓ | ✓ | ✓ | — |
| Informes: crear (subir PDF) | ✓ | — | ✓ | — | — |
| Informes: actualizar ⚠ | ✓ | ✓ | ✓ | ✓ | — |
| Informes: eliminar | ✓ | — | — | — | — |
| Encuestas · preguntas: listar | ✓ | ✓ | ✓ | ✓ | — |
| Encuestas · preguntas: crear / actualizar / eliminar | ✓ | — | — | — | — |
| Encuestas: listar / crear / actualizar ⚠ | ✓ | ✓ | ✓ | ✓ | — |
| Encuestas: eliminar | ✓ | — | — | — | — |
| Notificaciones: todo ⚠ | ✓ | ✓ | ✓ | ✓ | — |
| Configuración (plantillas, IA, parámetros, tipologías): listar | ✓ | ✓ | ✓ | ✓ | — |
| Configuración: crear / actualizar / eliminar | ✓ | — | — | — | — |
| Inconformidades (PQR): listar / crear ⚠ | ✓ | ✓ | ✓ | ✓ | — |
| Inconformidades: actualizar / eliminar | ✓ | — | — | — | — |

**Conclusión:** hoy solo se restringe por rol en las escrituras administrativas del catálogo, cuentas,
cupones, roles, módulos, configuración, motivos y verificación SENA. No hay propiedad por dueño ni
código ciego. El endurecimiento de permisos es una brecha conocida (sección 9).

---

## 4. Máquinas de estado

Definidas por los `enum` de los modelos. En negrita, el estado inicial. Las transiciones se validan
en el servidor (`src/constants/estados.js` + `transicion.middleware.js`); las inválidas responden
**409**. Detalle y actores por transición en `DOCUMENTACION/REGLAS_NEGOCIO.md` (sección 3).

### 4.1 Solicitud (`Solicitud.estado`)

Estados: `Pre-solicitud`, `Cotizada`, `No aceptada`, `Pendiente de pago`, `Pagada`, `En proceso`,
`Finalizada`, `Cancelada`. Inicial: **`Pre-solicitud`**.

```
Pre-solicitud ──▶ Cotizada ──┬──▶ No aceptada
                             ├──▶ Pendiente de pago ──▶ Pagada ──▶ En proceso ──▶ Finalizada
                             └──▶ (exonerada SENA) ─────────────▶ En proceso ──▶ Finalizada
Cualquier estado (no terminal) ──▶ Cancelada
```

### 4.2 Cotización (`Cotizacion.estado`)

Estados: `Enviada`, `Aceptada`, `No aceptada`. Inicial: **`Enviada`**.

```
Enviada ──▶ Aceptada
        └─▶ No aceptada
```

### 4.3 Pago (`Pago.estado`)

Estados: `Pendiente de verificación`, `Pagado`, `Rechazado`. Inicial: **`Pendiente de verificación`**.

```
Pendiente de verificación ──▶ Pagado
                          └─▶ Rechazado     (exige observación)
```

### 4.4 Muestra

**Estado** (`Muestra.estado`): `Recibida`, `Aceptada`, `En observación`, `Rechazada`. Inicial: **`Recibida`**.
```
Recibida ──┬──▶ Aceptada
           ├──▶ En observación ──┬──▶ Aceptada
           │                     └──▶ Rechazada
           └──▶ Rechazada
```

**Etapa** (`Muestra.etapaActual`): `Recepción`, `Análisis`, `Observaciones`, `Resultados`, `Validación`,
`Re-ensayo`, `Finalizada`. Inicial: **`Recepción`**.
```
Recepción ──▶ Análisis ──▶ Observaciones ──▶ Resultados ──▶ Validación ──▶ Finalizada
                                                            Validación ──▶ Re-ensayo (exige justificación)
                                                            Re-ensayo  ──▶ Análisis / Observaciones / Resultados
```

---

## 5. Reglas inviolables

Cada regla es obligatoria y tiene su RF/RNF. **Si una tarea contradice alguna, detenerse y preguntar.**

1. **Sin pago aprobado o exoneración no se recibe ni procesa la muestra** (RF-09, "práctica en bolsillo").
2. **Solo el usuario con `tipoUsuario === 'SENA'` obtiene cotización $0 y prefijo A1** (RF-02, RF-06,
   RF-18). La exoneración se evalúa por `tipoUsuario`; ese campo debe administrarse en el servidor y
   nunca aceptarse ciegamente desde `req.body` (endurecer el registro es una tarea pendiente).
3. **Los códigos son consecutivos y atómicos, nunca aleatorios**, formato `PRE/COT/CUP-AAAA-NNNN` y
   `A1/A2-AAAA-NNNN` (RF-18). No aplica a identificadores internos de Mongo.
4. **`HistorialMuestra` es inmutable:** nunca `update` ni `delete` (RF-24).
5. **El Analista nunca recibe datos del cliente: código ciego** (RF-22, RNF-01).
6. **Des-anonimizar exige contraseña (reautenticación) y motivo, y queda auditado** (RF-29).
7. **Rechazar un pago exige observación; rechazar una muestra exige motivo parametrizado** (RF-09, RF-20).
8. **Re-ensayo exige justificación** (RF-23).
9. **El informe no se descarga sin encuesta completa al 100%** (RF-26).
10. **El Cliente solo accede a sus propios registros** (RF-33, RNF-07).
11. **La cotización guarda el precio como snapshot;** cambiar precios del catálogo no afecta
    cotizaciones existentes (RF-06).
12. **El rol y el estado nunca se aceptan desde `req.body`;** se derivan de reglas de servidor
    (RNF-07). Se aplica vía whitelist en `crudFactory` (`src/constants/camposPermitidos.js`), el
    registro público fija `Cliente`/`EXTERNO`, y solo un `cambiar-rol` explícito cambia el rol activo.
13. **Los registros de auditoría no pueden editarse ni eliminarse por ningún rol** (RF-24).

---

## 6. Convenciones

- **Lógica de negocio en `src/services/`** y **controladores delgados**. *(Ya existen
  `src/services/codigos.service.js` —códigos consecutivos atómicos— y `src/services/sena.service.js`
  —exoneración SENA—.)*
- **Constantes de dominio en `src/constants/`:** `estados.js` (máquinas de estado) y
  `camposPermitidos.js` (whitelist del body). No duplicar listas de estados en controladores.
- **Respuestas uniformes:** `{ ok: true, data }` o `{ ok: true, total, data }` para listas, y
  `{ ok: false, mensaje }` para errores.
- **Mensajes en español**, claros y orientados al usuario.
- **Nombres en camelCase** para campos y variables (traducción de `SNAKE_CASE` del SQL).
- **Sin credenciales ni secretos en código:** todo va por variables de entorno (`BACKEND/.env`).
- **No exponer** `contrasenaHash` (el modelo lo marca `select: false`).
- **Validar entrada** con `express-validator` cuando exista validador; idealmente whitelist de campos.
- **Módulos ES (ESM)** desde 2026-10-09 (`"type": "module"`): `export default` en los módulos de un
  solo valor (modelos, rutas, `asyncHandler`, `crudFactory`, `validators/index`, `config/multer`);
  `export` nombrado en services, utils, middlewares, controllers y constants. Los imports relativos
  **siempre** con extensión `.js`; `__dirname` se deriva con `fileURLToPath(import.meta.url)`.

---

## 7. Registro de decisiones (ADR)

> Toda decisión nueva se **agrega** al final. Las decisiones reemplazadas se marcan
> **"Reemplazada por…"**, nunca se borran.

| Fecha | Decisión | Motivo | Alternativa descartada |
|---|---|---|---|
| 2026-10-07 | Migrar de **MySQL** (`SCRIPT_CORREGIDO.sql`) a **MongoDB Atlas** con Mongoose | Flexibilidad de esquema y despliegue en la nube del SENA | Mantener MySQL relacional con joins y migraciones |
| 2026-10-07 | Modelar las **tablas N:M como embebidos o arrays de referencias**: `ROL_MODULO`→`Rol.modulos[]`, `AUTORIZACION`→`Solicitud.autorizacion`, `DETALLE_COTIZACION`→`Cotizacion.detalles[]`, `CUPON_CUENTA`→`CuponPago.cuentas[]`, `MUESTRA_EXAMEN`→`Muestra.examenes[]`, `RESPUESTA_ENCUESTA`→`Encuesta.respuestas[]` | Evitar colecciones puente y simplificar lecturas del flujo | Conservar tablas intermedias como colecciones con `$lookup` |
| 2026-10-07 | Arquitectura **MVC + CommonJS** con Express y Mongoose **(Reemplazada por el ADR del 2026-10-09: ES Modules)** | Simplicidad, familiaridad y tiempos del proyecto académico | TypeScript + ESM con capa `services` desde el inicio |
| 2026-10-08 | Autorización por **nombre de rol en la ruta** (`autorizar('Administrador', ...)`) | Implementación directa y legible | Permisos por módulo (`Rol.modulos[]`) evaluados en middleware |
| 2026-10-08 | Adoptar **`src/services/` para la lógica de negocio** y dejar controladores delgados | Regla del proyecto; facilita pruebas y evita duplicar lógica | Seguir metiendo la lógica en controladores y en `crudFactory` |
| 2026-10-08 | **No crear rol `Cajero`;** la verificación de pagos sigue en `Administrador` y `Recepcionista` (RF-09) | No ampliar la matriz de roles con el equipo actual | Crear un rol `Cajero` dedicado a verificar pagos |
| 2026-10-08 | **Exonerar por `tipoUsuario === 'SENA'`** en la cotización (RF-02, RF-06) | Regla indicada por el negocio | Exigir `VerificacionSena.estado === 'Aprobada'` para exonerar |
| 2026-10-08 | **Códigos consecutivos y atómicos** con la colección `Contador` (`$inc` + upsert) (RF-18) | Garantiza unicidad y consecutividad bajo concurrencia | Códigos aleatorios con `Math.random` (descartado) |
| 2026-10-08 | **`HistorialMuestra` inmutable:** controlador solo-lectura + hooks que bloquean update/delete (RF-24) | Blindar la auditoría tanto en la API como en el modelo | Confiar solo en no exponer rutas de escritura |
| 2026-10-08 | Mantener el enum de `HistorialMuestra.accion` y usar `'Consulta datos cliente'` para RF-29 | Valor ya existente; sin migración | Renombrar a `'Des-anonimización'` (descartado por ahora) |
| 2026-10-08 | **Consolidar entorno, Express, conexión y seed en un único `BACKEND/index.js`** y eliminar `src/app.js`, `src/server.js`, `src/seed.js` y `src/config/db.js` | Un solo punto de entrada; seed con `node index.js --seed` | Mantener los archivos separados (`app.js` + `server.js` + `config/db.js`) |
| 2026-10-08 | **Restaurar `src/config/db.js`** (revertir esa parte): la conexión a MongoDB vuelve a vivir en `src/config/db.js` (`conectarDB`/`desconectarDB`); `index.js` la importa | Separar infraestructura (conexión) del arranque; `index.js` sigue siendo el único punto de entrada | Dejar la conexión inline en `index.js` (descartado) |
| 2026-10-08 | **Consecutivos de 4 dígitos** (`PRE/COT/CUP-AAAA-NNNN`, `A1/A2-AAAA-NNNN`) | Formato pedido por el negocio; evita agotar la serie anual | Mantener 3 dígitos |
| 2026-10-08 | **Usuario multirrol** (`roles[]` asignados + `rol` activo) con `POST /api/auth/cambiar-rol` | Una persona puede ser Recepcionista y Analista sin mezclar permisos en la sesión (RF-22) | Dos cuentas para la misma persona |
| 2026-10-08 | **Registro público fuerza `rol = Cliente` y `tipoUsuario = 'EXTERNO'`** en servidor; `rol`/`tipoUsuario` fuera del body | Cierra el agujero de autoproclamarse Administrador o SENA y obtener `$0` (RF-02, RF-06, regla #12) | Aceptar `rol`/`tipoUsuario` del body |
| 2026-10-08 | **Whitelist de campos en `crudFactory`** (`src/constants/camposPermitidos.js`): descarta `rol`, `estado`, códigos y valores de servidor | Regla inviolable #12; el estado solo entra si lo habilita un middleware de transición | Seguir pasando `req.body` directo |
| 2026-10-08 | **Transiciones de estado validadas en servidor** (`estados.js` + `transicion.middleware.js`); inválida → **409** | RF-18/20/23; cierra la brecha de estados arbitrarios | Validar dentro de cada controlador |
| 2026-10-08 | **Propiedad de registros:** `filtrarPropios`/`exigirPropietario` (Cliente solo lo suyo, si no 403) | RF-33, RNF-07; el Analista sigue con código ciego por rol | Permisos solo por rol sin propiedad |
| 2026-10-08 | **Endurecer HTTP:** `helmet`, `express-rate-limit` en `/auth` y límite de body a `1mb` | RNF de seguridad; mitiga fuerza bruta y payloads grandes | Sin cabeceras ni límites |
| 2026-10-08 | **Vulnerabilidades `high` de `npm audit`: aceptadas y documentadas** (solo dev: `nodemon→chokidar→braces`; no llegan a producción) | `nodemon` no admite `chokidar` 4; se decide no romper el dev-server | Cambiar a `node --watch` (descartado) o `npm audit fix --force` |
| 2026-10-09 | **Catálogo público sin token** (RF-05): `GET /api/catalogo/*` con `q`, `categoria`, `tipoMuestra`, `pagina`, `limite` (tope 50) y `orden` | El catálogo es la vitrina del laboratorio; solo lectura y solo `activo: true` | Exigir token para ver el catálogo |
| 2026-10-09 | **Snapshot de precio en la pre-solicitud** (`Solicitud.examenes[].precioUnitario` leído por el servidor) | El cliente ve fijo lo que eligió; el precio solo lo pone el servidor (RF-06, reglas #11/#12) | Guardar solo los `ObjectId` y calcular al cotizar |
| 2026-10-09 | **Si el cliente no envía `examenes`, la lista queda vacía** (no se guardan las sugerencias) | El cliente confirma siempre de forma explícita la lista final | Autocompletar con las sugerencias (descartado) |
| 2026-10-09 | **Motor de sugerencias de reglas con `MOTORES[]`** (`services/sugerencia.service.js`) y `POST /solicitudes/sugerencias` | RF-16 con puntaje + razones; punto de extensión para IA (RF-11) sin tocar controladores | Integrar IA directamente en el controlador |
| 2026-10-09 | **Amplía el criterio "SENA verificado"**: `tipoUsuario === 'SENA'` **o** `VerificacionSena.estado === 'Aprobada'` (`esSenaExonerado` ahora es **async**) | El registro público nace `EXTERNO`, así que nadie podía llegar a SENA sin edición manual; el ADR del 2026-10-08 quedaba incompleto | Exigir solo `tipoUsuario` y que el admin edite a mano cada usuario |
| 2026-10-09 | **`calcularCotizacion` en servidor** (`services/cotizacion.service.js`): totales y `detalles[]` protegidos en la whitelist | El precio solo sale del catálogo vigente; `valorTotal`/`exonerada`/`detalles` dejan de aceptarse desde `req.body` | Dejar que el cliente envíe el total (descartado) |
| 2026-10-09 | **PDF con `pdfkit`** en `uploads/cotizaciones/` y descarga `GET /cotizaciones/:id/pdf` solo para dueño o Administrador | Adjunto verificable de la cotización (RF-06) sin depender de storage externo | Generar el PDF bajo demanda y no guardarlo (descartado) |
| 2026-10-09 | **Firma digital guardada como archivo** `uploads/firmas/<cotizacion>.png`; en `Solicitud.autorizacion` solo la ruta + fecha/hora + `ip` | La imagen base64 no debe inflar el documento Mongo (RF-13) | Guardar el base64 en Mongo (descartado) |
| 2026-10-09 | **Cupón emitido por el servidor al aceptar** (`services/cupones.service.js`): cotización `Aceptada`, `valorTotal > 0`, un solo cupón, cuentas `activa` y vigencia desde `ParametroSistema` (`diasVigenciaCupon`, default 15) | Un externo no puede avanzar sin cupón y nadie puede crear dos; la exonerada no genera cupón (RF-09) | Que el cliente pida el cupón después (descartado) |
| 2026-10-09 | **Transición `Cotizada → Pagada`** reservada al servidor para la vía exonerada; el camino normal sigue `Cotizada → Pendiente de pago → Pagada` | Permite que un SENA verificado llegue a recepción sin cupón dentro de la misma máquina de estados | Hacer el salto con `$set` fuera de `TRANSICIONES` (descartado) |
| 2026-10-09 | **RF-09 en recepción**: `crearMuestra` responde **409** si la solicitud no está `Pagada` | Cierra el criterio "un externo no avanza sin cupón"; el exonerado pasa porque su solicitud ya está `Pagada` | Validar el pago comparando con `CuponPago` (más frágil) |
| 2026-10-09 | **Verificación SENA solo con `correoInstitucional` `@sena.edu.co`** (exacto, sin subdominios): `constants/sena.js` compartido por validador, `match` del modelo y bloqueo al **aprobar** (400) | El usuario corrigió la regla: antes no había ninguna restricción de dominio. Se valida en 3 capas y **rechazar sigue permitido** para documentos heredados | Aceptar subdominios (`@virtual.sena.edu.co`) o validar solo en el validador |
| 2026-10-09 | **Historial de pagos como subdocumento `Pago.historial[]`** (estado, fecha, usuario, observación), escrito solo por el servidor y añadido a la whitelist | El Cliente debe ver sus cambios de estado (RF-33) y el pago viaja con su auditoría sin crear otra colección ni consulta en dos pasos | Colección `HistorialPago` aparte al estilo `HistorialMuestra` |
| 2026-10-09 | **Bus de eventos `pagoAprobado` / `pagoRechazado`** en `services/eventos.service.js` (EventEmitter); los manejadores crean `Notificacion` (canal App) y envían correo opcional con `mailer`, y **un fallo al notificar nunca rompe la respuesta HTTP** | RF-12 (instrucciones de muestra al aprobar) y RF-09/RF-33 (motivo al rechazar) sin acoplar la verificación al envío | Notificar inline en el controlador (acoplamiento) o cola/worker externo (sobre-ingeniería para el proyecto) |
| 2026-10-09 | **Las instrucciones de muestra salen del `Examen` de la cotización** (`cantidadRequerida`+`unidadMedida`, `tipoEnvase`, `temperaturaConservacion`, `tiempoMaxTrasladoHoras`) | RF-12 pide datos técnicos del examen; la cotización ya snapshot-ea los exámenes elegidos | Redactar un texto libre por plantilla (RF-14 sigue pendiente) |
| 2026-10-09 | **Cupón vencido bloquea nuevos reportes (409), no la verificación** de pagos ya enviados a tiempo | Criterio literal del usuario; un comprobante entregado antes del vencimiento sigue siendo válido | Bloquear también la aprobación (más estricto, descartado) |
| 2026-10-09 | **Registro de pagos restringido a `Administrador`, `Recepcionista` y `Cliente` dueño del cupón** (el Analista queda fuera) y cupón ajeno → 403 | Regla #10 (el Cliente solo accede a lo suyo) y RF-22 (el Analista no maneja datos de pago) | Dejar `POST /pagos` abierto a cualquier autenticado (antes era el caso) |
| 2026-10-09 | **Se mantiene la verificación en `Administrador` + `Recepcionista`**; "Cajero" del requisito se interpreta como la Recepcionista, **sin crear el rol** | Confirma el ADR del 2026-10-08 (decisión del usuario) | Crear rol `Cajero` o restringir a solo Administrador |
| 2026-10-09 | **Migración a ES Modules** (`"type": "module"` + `engines.node >= 18`): `export default` para módulos de un solo valor (modelos, rutas, `asyncHandler`, `crudFactory`, `validators/index`, `config/multer`), `export` nombrado para services/utils/middlewares/controllers/constants, extensión `.js` explícita en imports relativos y `__dirname` vía `fileURLToPath(import.meta.url)` | Ecosistema actual (Node ≥ 18): imports estáticos, resolución temprana de errores y una sola convención en todo el backend; reemplaza el ADR "MVC + CommonJS" del 2026-10-07 | Mantener CommonJS y migrar solo los archivos nuevos |

---

## 8. Estado por fases

> Marcar **solo** lo verificado en el código. `[ ]` = pendiente. Fecha y responsable se anotan al completar.

### Fase 0 — Cimientos y seguridad
- [x] Estructura MVC completa (`models`, `controllers`, `routes`, `middlewares`, `validators`, `utils`, `config`).
- [x] Conexión a MongoDB Atlas (`src/config/db.js`).
- [x] JWT: generar/verificar (`src/utils/tokens.js`) + middleware `proteger`.
- [x] Hash de contraseñas con `bcryptjs` (auth y usuarios).
- [x] Middleware `autorizar(roles)`.
- [x] Manejo central de errores y 404 (`error.middleware.js`).
- [x] CORS, `express.json`/`urlencoded` (límite `1mb`) y estáticos de `uploads`.
- [x] `helmet` (cabeceras de seguridad) y `express-rate-limit` en `/api/auth` (2026-10-08).
- [x] Multer (JPG/PNG/PDF, máx. 5 MB).
- [x] Whitelist de campos en `crudFactory` (`src/constants/camposPermitidos.js`) (2026-10-08).
- [x] Transiciones de estado validadas + 409 (`estados.js`, `transicion.middleware.js`) (2026-10-08).
- [x] Propiedad de registros para el Cliente (`propietario.middleware.js`) (2026-10-08).
- [x] Migración a **ES Modules** (`"type": "module"`): 87 archivos convertidos, sin restos de
  `require`/`module.exports` en el código propio, `node --check` 87/87, grafo de rutas cargando,
  arranque real y API respondiendo (2026-10-09).
- [ ] Rotación de credenciales de Atlas (ver sección 9).
- [ ] 3 vulnerabilidades `high` de `npm audit` **aceptadas y documentadas**: solo desarrollo
      (`nodemon→chokidar→braces`), no llegan a producción (2026-10-08).

### Fase 1 — Usuarios / SENA / tipología
- [x] Modelos `Usuario`, `Rol`, `Modulo`, `TipologiaCliente`, `VerificacionSena`.
- [x] Registro, login, perfil, cambio de contraseña, recuperación/restablecimiento.
- [x] CRUD de usuarios + aprobar/rechazar verificación SENA.
- [x] Seed de módulos, roles, tipologías y admin.
- [x] Endurecer `POST /api/usuarios` (ahora solo Administrador) y `PUT /api/usuarios/:id` (2026-10-08).
- [x] No aceptar `rol`/`tipoUsuario` desde el body; registro público nace `Cliente`/`EXTERNO` (2026-10-08).
- [x] Usuario multirrol (`roles[]` + `rol` activo) con `POST /api/auth/cambiar-rol` (2026-10-08).
- [x] Verificación SENA **solo con correo `@sena.edu.co`**: validador + `match` en el modelo + bloqueo
  al aprobar (2026-10-09, `constants/sena.js`).
- [ ] Notificar el resultado de la verificación SENA.

### Fase 2 — Catálogo y pre-solicitud
- [x] Modelos `CategoriaAnalisis`, `TipoMuestra`, `Examen`.
- [x] CRUD de catálogo (escritura solo administrador; lectura ahora **pública**).
- [x] Modelo `Solicitud` con `codigoPresolicitud` y `autorizacion` embebida; endpoint de creación.
- [x] Catálogo público sin login (RF-05) con `q`, `categoria`, `tipoMuestra`, paginación y orden (2026-10-09).
- [x] Sugerencia automática de batería de exámenes (RF-16): motor de reglas + punto de extensión IA (2026-10-09).
- [x] Pre-solicitud con `examenes[]` opcionales y **snapshot de precio**; respuesta con `codigoPresolicitud` + `sugerencias` (2026-10-09).
- [x] Código de pre-solicitud/cotización/cupón consecutivo y atómico (2026-10-08, `services/codigos.service.js`).

### Fase 3 — Cotización / firma / cupón
- [x] Modelo `Cotizacion` con `detalles[]` embebidos.
- [x] Endpoint de creación de cotización y de cupón (`CUP-`) (ahora con cálculo en servidor).
- [x] Cálculo de precios y snapshot por examen (2026-10-09, `services/cotizacion.service.js`): precios del catálogo vigente.
- [x] Forzar `$0`/`exonerada` para usuario SENA **verificado** (`tipoUsuario === 'SENA'` o `VerificacionSena` aprobada) (2026-10-09).
- [x] Generar PDF de la cotización (2026-10-09, `pdfkit` → `uploads/cotizaciones/`, descarga solo dueño/admin).
- [x] Endpoint de aceptar + firma digital (RF-13) (2026-10-09): firma `base64` → `uploads/firmas/`, términos, nombre/documento, fecha/hora e IP en `Solicitud.autorizacion`.
- [x] Cupón solo si `valor > 0`, con cuentas activas vigentes, fecha desde `ParametroSistema` y un solo cupón por cotización (2026-10-09, `services/cupones.service.js`).

### Fase 4 — Pagos
- [x] Modelos `CuentaRecaudo`, `CuponPago`, `Pago`.
- [x] Carga de comprobante (multer) y verificación aprobar/rechazar (preliminar).
- [x] Restringir listado/consulta a dueño o rol autorizado (2026-10-08).
- [x] Validar estado previo `Pendiente de verificación` y exigir observación al rechazar (2026-10-08).
- [x] **Registrar pago** con validación completa (2026-10-09): método (consignación, transferencia,
  efectivo), comprobante obligatorio salvo efectivo (allí `numeroReciboCaja`), `fechaPagoReportada`,
  `valorReportado`, estado inicial `Pendiente de verificación` fijado por el servidor y
  **cupón vencido → 409** (`services/pagos.service.js`, `validators/pago.validators.js`).
- [x] **Verificación** (2026-10-09): solo Admin/Recepcionista y solo desde `Pendiente`; observación
  obligatoria al rechazar; guarda `verificadoPor`/`fechaRevision`; **al aprobar mueve la `Solicitud`
  a `Pagada`** (sostiene RF-09 en recepción).
- [x] **"Mis pagos" con historial** (2026-10-09): `GET /api/pagos/mis-pagos` (solo lo suyo) +
  `Pago.historial[]` visible también en `GET /api/pagos/:id`.
- [x] **Eventos `pagoAprobado` / `pagoRechazado`** (2026-10-09): `services/eventos.service.js`;
  al aprobar envía las **instrucciones de muestra** del `Examen` (cantidad, envase, temperatura,
  tiempo máximo de traslado, RF-12); al rechazar notifica con el motivo (RF-09/RF-33).
- [x] **Bandeja de pendientes** (2026-10-09): `GET /api/pagos/pendientes`, solo Admin/Recepcionista,
  ordenada por antigüedad (`fechaCarga` asc) y paginada.
- [ ] Reintentar un pago rechazado enlazando el registro anterior (hoy se crea un pago nuevo).

### Fase 5 — Recepción / turnos / rechazo / rótulos
- [x] Modelo `Muestra` + creación (código `A1/A2-AAAA-NNNN`).
- [x] Modelos `MotivoRechazo` y `Rechazo` + CRUD.
- [x] Verificar pago aprobado antes de recibir (RF-09) (2026-10-09): `crearMuestra` exige que la solicitud esté `Pagada` (o exonerada) → **409**.
- [x] Código `A1/A2-AAAA-NNNN` consecutivo y atómico (2026-10-08).
- [ ] Turnos y prioridad A1/A2 en la cola de atención (RF-18, RNF-08). `prioridad` ya se asigna; falta el motor de turnos.
- [ ] Rechazo cambia estado de la muestra + acta + notificación (RF-20).
- [ ] Rótulos editables 58/80 mm (RF-21).

### Fase 6 — Trazabilidad / código ciego / auditoría
- [x] Modelo `HistorialMuestra`; `cambiarEtapa` registra movimiento.
- [x] Enum de acción incluye `Consulta datos cliente` (RF-29).
- [x] Validar transiciones de etapa (RF-23) (2026-10-08).
- [ ] Justificación obligatoria al pasar a Re-ensayo (RF-23).
- [x] Inmutabilidad de historial (RF-24) (2026-10-08).
- [ ] Código ciego / enmascarar identidad para el Analista (RF-22, RNF-01).
- [ ] Des-anonimización con contraseña + motivo auditado (RF-29).
- [ ] Reasignación/reapertura con motivo (RF-28).

### Fase 7 — Informe / encuesta / cierre / PQR
- [x] Modelo `Informe` + CRUD + subida de PDF.
- [x] Modelos `PreguntaEncuesta`, `Encuesta` e `Inconformidad` + CRUD.
- [ ] Bloqueo de descarga del informe hasta encuesta 100% (RF-26).
- [ ] Validar completitud de la encuesta.
- [ ] Notificación de cierre (RF-15).
- [ ] Informe PDF validado/firmado por Jefe de Laboratorio (RF-25).

### Fase 8 — Notificaciones / plantillas / cron / IA
- [x] Modelos `Notificacion`, `PlantillaMensaje`, `OpcionAsistenteIA`, `ParametroSistema`.
- [x] CRUD de notificaciones y de configuración.
- [x] Util `mailer` (Nodemailer opcional) usado en recuperación de contraseña.
- [ ] Motor de variables en plantillas (RF-14).
- [ ] Cron de alertas de retraso (RF-32).
- [ ] Asistente IA / chat (RF-11).
- [ ] Notificaciones multicanal asíncronas (RNF-09).

### Fase 9 — Panel / reportes / configuración / pruebas
- [x] CRUD de configuración (plantillas, IA, parámetros, tipologías).
- [x] `BACKEND/API_TEST.http` con pruebas manuales base.
- [ ] Endpoints de reportes exportables (RF-30).
- [ ] Dashboard del Jefe de Laboratorio (RF-27).
- [ ] Pruebas automatizadas.
- [ ] Corrección de las 3 vulnerabilidades `high` de dev.

---

## 9. Brechas conocidas hoy

> Verificadas contra el código (última revisión: **2026-10-09**). Si una ya no aplica, corregir aquí
> y registrar en bitácora.

1. **Cotización: resuelto (2026-10-09).** `calcularCotizacion` (`services/cotizacion.service.js`)
   toma precios **vigentes** del catálogo y los guarda como snapshot en `detalles[]`; `valorTotal`,
   `exonerada` y `detalles` ya **no** se aceptan desde `req.body` (whitelist). El PDF se genera con
   `pdfkit` (`uploads/cotizaciones/`) y solo se descarga por `GET /cotizaciones/:id/pdf` (el acceso
   estático a esa carpeta responde 403). Sigue **pendiente**: enviar la cotización por correo.
2. **Pagos: resuelto (2026-10-09).** Además de la propiedad (`alcances.pago`) y de la transición
   (`Pendiente de verificación → Pagado|Rechazado`) con `observacion` obligatoria al rechazar:
   registro validado (comprobante salvo efectivo, cupón vigente y propio), historial en
   `Pago.historial[]`, **eventos `pagoAprobado`/`pagoRechazado` con notificación App + correo**
   (RF-12 instrucciones de muestra), la **`Solicitud` pasa a `Pagada` al aprobar** y existe la
   bandeja `GET /pagos/pendientes`. Sigue **pendiente**: enlazar el reintento de un pago rechazado
   con el registro anterior y usar plantillas con variables (RF-14).
3. **Muestra: transiciones y RF-09 resueltos (2026-10-09).** `cambiarEtapa` y `PUT /muestras/:id`
   validan `estado`/`etapaActual` (inválida → 409); código `A1/A2-AAAA-NNNN` + `prioridad`; y
   `crearMuestra` exige que la solicitud esté **`Pagada`** (409 si no), lo que cierra el criterio
   "sin pago o exoneración no se recibe la muestra". Sigue **pendiente**: motor de `numeroTurno`.
4. **HistorialMuestra (RF-24): resuelto (2026-10-08).** El controlador es solo-lectura
   (`listar`/`obtener`) y el modelo bloquea `update`/`delete` con hooks; solo se permite crear desde
   la capa interna.
5. **Código ciego (RF-22/RNF-01): parcial.** La propiedad por dueño ya aplica
   (`propietario.middleware`) y `/api/usuarios` quedó solo para Administrador. Sigue **pendiente**:
   enmascarar la identidad del cliente para el rol Analista en solicitudes/muestras/informes.
6. **Informe/encuesta:** `informe` y `encuesta` son CRUD plano: sin bloqueo de descarga por encuesta
   (RF-26) y sin validar completitud al 100%.
7. **Rechazo:** CRUD plano; no cambia `Muestra.estado`, no genera acta ni notifica (RF-20).
8. **No existen:** cron RF-32, reportes RF-30, rótulos RF-21, asistente IA RF-11, motor de variables
   de plantillas RF-14, des-anonimización RF-29.
   *Resuelto (2026-10-09):* **firma digital RF-13** — `POST /cotizaciones/:id/aceptar` exige
   `firmaImagen` (base64), `aceptaTerminos`, nombre y documento, y guarda fecha/hora e **IP** en
   `Solicitud.autorizacion` (antes solo existía el modelo, sin lógica).
   *Parcial:* ya hay modelos `PlantillaMensaje`/`OpcionAsistenteIA` sin la lógica correspondiente.
9. **Whitelist `crudFactory`: resuelto (2026-10-08).** `crear`/`actualizar` pasan por `sanitizarBody`
   (`src/constants/camposPermitidos.js`): descarta `rol`, códigos y valores de servidor; el estado
   solo entra si un middleware de transición lo autoriza.
10. **Seguridad de datos:** se reporta que el `BACKEND/.env` con credenciales de Atlas fue compartido;
    **hay que rotar la contraseña del usuario de la base de datos** (no verificable sin leer el `.env`,
    prohibido). Estado de `npm audit`: **0** vulnerabilidades en producción; **3 `high`** en desarrollo
    (`nodemon → chokidar → braces`) **aceptadas y documentadas** (no llegan a producción, 2026-10-08).
11. **Permisos: endurecido (2026-10-08).** `GET/POST/PUT/DELETE /api/usuarios` solo Administrador;
    propiedad por dueño en solicitudes, cotizaciones, cupones, pagos, muestras, informes, encuestas,
    notificaciones e inconformidades. Sigue **pendiente**: `rechazos` (CRUD plano) y afinar la matriz
    §2 de `REGLAS_NEGOCIO.md` frente a la implementación real.
12. **Exoneración SENA: cerrado el vector de registro (2026-10-08) y ampliado el criterio
    (2026-10-09).** El registro público fija `tipoUsuario = 'EXTERNO'` y `rol = Cliente`; ambos están
    fuera del body (whitelist). `esSenaExonerado` ahora acepta `tipoUsuario === 'SENA'` **o**
    `VerificacionSena.estado === 'Aprobada'`, por lo que la exoneración y el prefijo **A1** ya no
    dependen de editar `tipoUsuario` a mano. Sigue **pendiente** promover `tipoUsuario` a `'SENA'`
    al aprobar la verificación (hoy es redundante, pero mantiene coherente el dato).

---

## 10. Protocolo de sesión

1. **Al empezar:** leer esta memoria, identificar la **fase activa** (sección 8) y confirmar en **una
   línea** qué se va a hacer.
2. **Durante:** si algo contradice una **regla inviolable** (sección 5), **detenerse y preguntar**; no
   improvisar.
3. **Al terminar:**
   - actualizar el checklist (sección 8),
   - añadir la entrada en `DOCUMENTACION/BITACORA.md`,
   - registrar decisiones nuevas (sección 7),
   - agregar o ajustar casos en `BACKEND/API_TEST.http`.
4. **Nunca borrar entradas históricas** (memoria, ADR ni bitácora).

---

## 11. Bitácora

El historial cronológico de trabajo **no** vive aquí: está en
[`DOCUMENTACION/BITACORA.md`](./BITACORA.md).
