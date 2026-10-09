// ============================================================
// Utilidades de consulta: paginación y construcción de filtros.
// ============================================================

// Escapa una expresión regular para que el texto del usuario se trate literal.
const escaparRegex = (texto = '') => String(texto).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Construye una expresión regular insensible a mayúsculas desde un término.
const regexDe = (texto, flags = 'i') => {
  const limpio = String(texto || '').trim();
  return limpio ? new RegExp(escaparRegex(limpio), flags) : null;
};

// Devuelve la consulta paginada: { total, pagina, limite, totalPaginas, data }.
const paginar = async ({
  Model,
  filtro = {},
  populate = [],
  pagina = 1,
  limite = 10,
  maxLimite = 50,
  orden = null,
  dir = 'asc',
} = {}) => {
  const max = Math.min(Math.max(parseInt(maxLimite, 10) || 50, 1), maxLimite);
  const l = Math.min(Math.max(parseInt(limite, 10) || 10, 1), max);

  const total = await Model.countDocuments(filtro);
  const totalPaginas = Math.max(Math.ceil(total / l), 1);

  let p = parseInt(pagina, 10) || 1;
  if (p < 1) p = 1;
  if (p > totalPaginas) p = totalPaginas; // nunca buscar fuera del rango

  let query = Model.find(filtro)
    .skip((p - 1) * l)
    .limit(l);

  populate.forEach((campo) => {
    query = query.populate(campo);
  });

  if (orden) {
    query = query.sort({ [orden]: dir === 'desc' ? -1 : 1 });
  }

  const data = await query;
  return { total, pagina: p, limite: l, totalPaginas, data };
};

export { escaparRegex, regexDe, paginar };
