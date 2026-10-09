# AGENTS.md — Sistema de Gestión del Laboratorio (SENA)

Backend académico del laboratorio del SENA: Node.js + Express + MongoDB Atlas (Mongoose),
arquitectura MVC, ES Modules. Cubre registro, catálogo, pre-solicitud, cotización, pago manual
verificado, recepción y trazabilidad de muestras, informes, encuestas, PQR y administración.

## Orden obligatoria antes de cualquier cambio

**Lee `DOCUMENTACION/MEMORIA_PROYECTO.md` antes de tocar el proyecto.** Si algo contradice una
regla inviolable, detente y pregunta; no improvises. Las decisiones nuevas van al ADR (sección 7)
y cada sesión se registra en `DOCUMENTACION/BITACORA.md`.

## Reglas inviolables (una línea cada una)

1. Sin pago aprobado o exoneración no se recibe ni procesa la muestra (RF-09).
2. Solo el SENA verificado obtiene cotización $0 y prefijo A1 (RF-02, RF-06, RF-18).
3. Los códigos son consecutivos y atómicos (`A1/A2-AAAA-NNN`), nunca aleatorios (RF-18).
4. `HistorialMuestra` es inmutable: sin update ni delete (RF-24).
5. El Analista nunca recibe datos del cliente: código ciego (RF-22, RNF-01).
6. Des-anonimizar exige contraseña y motivo, y queda auditado (RF-29).
7. Rechazar un pago exige observación; rechazar una muestra exige motivo parametrizado (RF-09, RF-20).
8. Re-ensayo exige justificación (RF-23).
9. El informe no se descarga sin encuesta completa al 100% (RF-26).
10. El Cliente solo accede a sus propios registros.
11. La cotización guarda el precio como snapshot.
12. El rol y el estado nunca se aceptan desde `req.body`.

## Protocolo de sesión

- **Al empezar:** leer la memoria, identificar la fase activa y confirmar en una línea qué se hará.
- **Durante:** ante conflicto con una regla inviolable, detenerse y preguntar.
- **Al terminar:** actualizar checklist (sección 8), añadir entrada a `DOCUMENTACION/BITACORA.md`,
  registrar decisiones nuevas (sección 7) y ajustar casos en `BACKEND/API_TEST.http`.
- **Nunca borrar entradas históricas.**

## Límites

- No tocar `BACKEND/src` sin actualizar la memoria/bitácora.
- No leer ni imprimir `BACKEND/.env`. Sin credenciales en el código.
- Bitácora completa en `DOCUMENTACION/BITACORA.md` (no incluirla en `instructions`).
