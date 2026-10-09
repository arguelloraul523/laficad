import asyncHandler from './asyncHandler.js';
import { sanitizarBody } from '../constants/camposPermitidos.js';

// ===== Funciones CRUD genéricas =====
// Permiten crear controllers reutilizando la misma lógica de listar,
// obtener, crear, actualizar y eliminar para cualquier modelo.
//
// Whitelist: los campos protegidos (rol, estado, códigos, etc.) se descartan
// del body salvo que un middleware de transición los haya autorizado en
// req.camposEstadoPermitidos.
//
// Alcance: si filtros de propiedad dejaron un filtro en req.alcance, se aplica
// en los listados (p. ej. un Cliente solo ve sus propios registros).

const listar = (Model, populate = []) =>
  asyncHandler(async (req, res) => {
    let query = Model.find(req.alcance || {});
    populate.forEach((campo) => {
      query = query.populate(campo);
    });
    const docs = await query;
    res.json({ ok: true, total: docs.length, data: docs });
  });

const obtener = (Model, populate = []) =>
  asyncHandler(async (req, res) => {
    let query = Model.findById(req.params.id);
    populate.forEach((campo) => {
      query = query.populate(campo);
    });
    const doc = await query;
    if (!doc) return res.status(404).json({ ok: false, mensaje: 'Registro no encontrado' });
    res.json({ ok: true, data: doc });
  });

const crear = (Model) =>
  asyncHandler(async (req, res) => {
    const datos = sanitizarBody(req.body, {
      permitir: req.camposPermitidos || [],
      permitirEstado: req.camposEstadoPermitidos || [],
    });
    const doc = await Model.create(datos);
    res.status(201).json({ ok: true, data: doc });
  });

const actualizar = (Model) =>
  asyncHandler(async (req, res) => {
    const datos = sanitizarBody(req.body, {
      permitir: req.camposPermitidos || [],
      permitirEstado: req.camposEstadoPermitidos || [],
    });
    const doc = await Model.findByIdAndUpdate(req.params.id, datos, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ ok: false, mensaje: 'Registro no encontrado' });
    res.json({ ok: true, data: doc });
  });

const eliminar = (Model) =>
  asyncHandler(async (req, res) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ ok: false, mensaje: 'Registro no encontrado' });
    res.json({ ok: true, mensaje: 'Registro eliminado correctamente' });
  });

// Devuelve un objeto controller con las 5 operaciones CRUD
const crudFactory = (Model, populate = []) => ({
  listar: listar(Model, populate),
  obtener: obtener(Model, populate),
  crear: crear(Model),
  actualizar: actualizar(Model),
  eliminar: eliminar(Model),
});

export default crudFactory;
