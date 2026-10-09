import express from 'express';
const router = express.Router();
import { categorias, tiposMuestra, examenes, crud } from '../controllers/catalogo.controller.js';
import { proteger, autorizar } from '../middlewares/auth.middleware.js';

// ============================================================
// Catálogo PÚBLICO (RF-05): lectura sin token, con filtros y paginación.
//   GET /catalogo/categorias?q=pH&pagina=1&limite=10
//   GET /catalogo/tipos-muestra?q=agua&pagina=1&limite=10
//   GET /catalogo/examenes?q=pH&categoria=<id>&tipoMuestra=<id>&pagina=1&limite=10
//   Query extra en exámenes: orden=nombre|precio|tiempoRespuestaDias&dir=asc|desc
// ============================================================

// --- Categorías de análisis ---
router.get('/categorias', categorias.listar);
router.get('/categorias/:id', categorias.obtener);
router.post('/categorias', proteger, autorizar('Administrador'), crud.categorias.crear);
router.put('/categorias/:id', proteger, autorizar('Administrador'), crud.categorias.actualizar);
router.delete('/categorias/:id', proteger, autorizar('Administrador'), crud.categorias.eliminar);

// --- Tipos de muestra ---
router.get('/tipos-muestra', tiposMuestra.listar);
router.get('/tipos-muestra/:id', tiposMuestra.obtener);
router.post('/tipos-muestra', proteger, autorizar('Administrador'), crud.tiposMuestra.crear);
router.put('/tipos-muestra/:id', proteger, autorizar('Administrador'), crud.tiposMuestra.actualizar);
router.delete('/tipos-muestra/:id', proteger, autorizar('Administrador'), crud.tiposMuestra.eliminar);

// --- Exámenes ---
router.get('/examenes', examenes.listar);
router.get('/examenes/:id', examenes.obtener);
router.post('/examenes', proteger, autorizar('Administrador'), crud.examenes.crear);
router.put('/examenes/:id', proteger, autorizar('Administrador'), crud.examenes.actualizar);
router.delete('/examenes/:id', proteger, autorizar('Administrador'), crud.examenes.eliminar);

export default router;
