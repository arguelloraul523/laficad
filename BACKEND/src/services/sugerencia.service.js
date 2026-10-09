import Examen from '../models/Examen.js';

// ============================================================
// Sugerencia de batería de análisis (RF-16).
//
// Motor de REGLAS simples sobre el catálogo:
//   R1  coincide el tipo de muestra ............... +3
//   R2  coincide la categoría ..................... +2
//   R3  palabra clave de la descripción ........... +1 por palabra
//
// PUNTO DE EXTENSIÓN PARA IA (RF-11): agregar aquí el motor cuando exista
// el asistente, sin tocar los controladores:
//     MOTORES.push(sugerirPorIA);
// `sugerirExamenes` fusiona los resultados de todos los motores activos.
// ============================================================

// Palabras vacías (español) que no aportan a la búsqueda.
const PALABRAS_VACIAS = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'y', 'o', 'u', 'con', 'para', 'por', 'en',
  'un', 'una', 'unos', 'unas', 'que', 'se', 'es', 'al', 'lo', 'su', 'sus', 'como',
  'mas', 'más', 'sin', 'sobre', 'desde', 'hasta', 'tiene', 'tengo', 'quiero',
]);

// Normaliza texto: minúsculas, sin acentos, solo letras y números.
const normalizar = (texto = '') =>
  String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');

// Extrae las palabras significativas de un texto libre.
const palabrasClave = (texto = '') =>
  normalizar(texto)
    .split(/\s+/)
    .filter((p) => p.length > 2 && !PALABRAS_VACIAS.has(p));

// === Motor 1: reglas sobre el catálogo ===
const sugerirPorReglas = async ({ tipoMuestra, categoria, descripcionMuestra, limite = 10 } = {}) => {
  const examenes = await Examen.find({ activo: true })
    .populate('categoria')
    .populate('tipoMuestra');

  const objetivo = String(tipoMuestra || '');
  const objetivoCategoria = String(categoria || '');
  const claves = palabrasClave(descripcionMuestra);

  const sugeridos = [];

  examenes.forEach((e) => {
    let puntaje = 0;
    const razones = [];

    if (objetivo && String(e.tipoMuestra?._id || e.tipoMuestra) === objetivo) {
      puntaje += 3;
      razones.push('tipo de muestra');
    }

    if (objetivoCategoria && String(e.categoria?._id || e.categoria) === objetivoCategoria) {
      puntaje += 2;
      razones.push('categoría');
    }

    claves.forEach((clave) => {
      const enTitulo = normalizar(e.nombre).includes(clave);
      const enDescripcion = normalizar(e.descripcion || '').includes(clave);
      if (enTitulo || enDescripcion) {
        puntaje += 1;
        const razon = `palabra clave: ${clave}`;
        if (!razones.includes(razon)) razones.push(razon);
      }
    });

    if (puntaje > 0) {
      sugeridos.push({
        examen: e._id,
        nombre: e.nombre,
        precio: e.precio,
        tiempoRespuestaDias: e.tiempoRespuestaDias,
        categoria: e.categoria?.nombre || null,
        tipoMuestra: e.tipoMuestra?.nombre || null,
        puntaje,
        razones,
      });
    }
  });

  sugeridos.sort((a, b) => b.puntaje - a.puntaje || String(a.nombre).localeCompare(String(b.nombre)));
  return sugeridos.slice(0, Math.max(parseInt(limite, 10) || 10, 1));
};

// Motores activos. Para añadir IA: MOTORES.push(sugerirPorIA);
const MOTORES = [sugerirPorReglas];

// Fusiona varias listas de sugerencias en una sola (suma puntajes, une razones).
const fusionar = (listas) => {
  const mapa = new Map();
  listas.flat().forEach((item) => {
    const llave = String(item.examen);
    const actual = mapa.get(llave);
    if (!actual) {
      mapa.set(llave, { ...item, razones: [...(item.razones || [])] });
      return;
    }
    actual.puntaje = (actual.puntaje || 0) + (item.puntaje || 0);
    (item.razones || []).forEach((r) => {
      if (!actual.razones.includes(r)) actual.razones.push(r);
    });
  });
  return [...mapa.values()].sort(
    (a, b) => b.puntaje - a.puntaje || String(a.nombre).localeCompare(String(b.nombre))
  );
};

// Punto de entrada único: ejecuta todos los motores y fusiona.
const sugerirExamenes = async (entrada = {}) => fusionar(await Promise.all(MOTORES.map((m) => m(entrada))));

export { sugerirPorReglas, sugerirExamenes, fusionar, MOTORES, normalizar, palabrasClave };
