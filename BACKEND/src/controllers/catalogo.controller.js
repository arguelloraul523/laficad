import asyncHandler from '../utils/asyncHandler.js';
import crudFactory from '../utils/crudFactory.js';
import { paginar, regexDe } from '../utils/paginar.js';
import CategoriaAnalisis from '../models/CategoriaAnalisis.js';
import TipoMuestra from '../models/TipoMuestra.js';
import Examen from '../models/Examen.js';

const POBLAR_EXAMEN = ['categoria', 'tipoMuestra'];
const ORDENES_EXAMEN = ['nombre', 'precio', 'tiempoRespuestaDias'];

// ===== Consultas públicas del catálogo (RF-05, sin token) =====
// Filtros: q (palabra clave), categoria, tipoMuestra, pagina, limite, orden, dir.

const listarCategorias = asyncHandler(async (req, res) => {
  const { q, pagina, limite } = req.query;
  const regex = regexDe(q);
  const filtro = regex ? { $or: [{ nombre: regex }, { descripcion: regex }] } : {};

  const resultado = await paginar({
    Model: CategoriaAnalisis,
    filtro,
    pagina,
    limite,
    orden: 'nombre',
  });
  res.json({ ok: true, ...resultado });
});

const listarTiposMuestra = asyncHandler(async (req, res) => {
  const { q, pagina, limite } = req.query;
  const regex = regexDe(q);
  const filtro = regex ? { $or: [{ nombre: regex }, { descripcion: regex }] } : {};

  const resultado = await paginar({
    Model: TipoMuestra,
    filtro,
    pagina,
    limite,
    orden: 'nombre',
  });
  res.json({ ok: true, ...resultado });
});

const listarExamenes = asyncHandler(async (req, res) => {
  const { q, categoria, tipoMuestra, orden, dir, pagina, limite } = req.query;

  // Público solo ve exámenes activos.
  const filtro = { activo: true };
  const regex = regexDe(q);
  if (regex) filtro.$or = [{ nombre: regex }, { descripcion: regex }];
  if (categoria) filtro.categoria = categoria;
  if (tipoMuestra) filtro.tipoMuestra = tipoMuestra;

  const resultado = await paginar({
    Model: Examen,
    filtro,
    populate: POBLAR_EXAMEN,
    pagina,
    limite,
    orden: ORDENES_EXAMEN.includes(orden) ? orden : 'nombre',
    dir,
  });
  res.json({ ok: true, ...resultado });
});

const obtenerPublico = (Model, populate = []) =>
  asyncHandler(async (req, res) => {
    let query = Model.findById(req.params.id);
    populate.forEach((campo) => {
      query = query.populate(campo);
    });
    const doc = await query;
    if (!doc) return res.status(404).json({ ok: false, mensaje: 'Registro no encontrado' });
    res.json({ ok: true, data: doc });
  });

const obtenerExamen = asyncHandler(async (req, res) => {
  const doc = await Examen.findOne({ _id: req.params.id, activo: true }).populate(POBLAR_EXAMEN);
  if (!doc) return res.status(404).json({ ok: false, mensaje: 'Registro no encontrado' });
  res.json({ ok: true, data: doc });
});

const categorias = { listar: listarCategorias, obtener: obtenerPublico(CategoriaAnalisis) };
const tiposMuestra = { listar: listarTiposMuestra, obtener: obtenerPublico(TipoMuestra) };
const examenes = { listar: listarExamenes, obtener: obtenerExamen };
// Operaciones de escritura (solo Administrador) del catálogo
const crud = {
  categorias: crudFactory(CategoriaAnalisis),
  tiposMuestra: crudFactory(TipoMuestra),
  examenes: crudFactory(Examen, POBLAR_EXAMEN),
};

export { categorias, tiposMuestra, examenes, crud };
