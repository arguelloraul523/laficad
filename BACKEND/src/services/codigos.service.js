import Contador from '../models/Contador.js';
import { esSenaExonerado } from './sena.service.js';

// ===== Códigos consecutivos y atómicos (RF-18) =====
// Los códigos NUNCA son aleatorios. Se reservan con un $inc atómico sobre
// un documento de la colección Contador, de modo que dos peticiones
// concurrentes obtienen números distintos.

const PREFIJOS = {
  presolicitud: 'PRE',
  cotizacion: 'COT',
  cupon: 'CUP',
};

// Reserva el siguiente número de una serie de forma atómica.
const siguienteSecuencia = async (serie) => {
  const doc = await Contador.findOneAndUpdate(
    { _id: serie },
    { $inc: { secuencia: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doc.secuencia;
};

// Formatea un número con ceros a la izquierda, p. ej. 1 -> "0001".
const formatearNumero = (numero, ancho = 4) => String(numero).padStart(ancho, '0');

// Códigos internos del flujo: PRE-AAAA-NNNN, COT-AAAA-NNNN, CUP-AAAA-NNNN.
const crearCodigo = async (tipo) => {
  const prefijo = PREFIJOS[tipo];
  const anio = new Date().getFullYear();
  const serie = `${prefijo}-${anio}`;
  const numero = await siguienteSecuencia(serie);
  return `${serie}-${formatearNumero(numero)}`;
};

const codigoPresolicitud = () => crearCodigo('presolicitud');
const codigoCotizacion = () => crearCodigo('cotizacion');
const codigoCupon = () => crearCodigo('cupon');

// Código de muestra con prioridad: A1 (usuario SENA) o A2 (externo).
// Formato A1-AAAA-NNNN / A2-AAAA-NNNN (RF-18).
const codigoMuestra = async (usuario) => {
  const prefijo = (await esSenaExonerado(usuario)) ? 'A1' : 'A2';
  const anio = new Date().getFullYear();
  const serie = `${prefijo}-${anio}`;
  const numero = await siguienteSecuencia(serie);
  return `${serie}-${formatearNumero(numero)}`;
};

export {
  siguienteSecuencia,
  codigoPresolicitud,
  codigoCotizacion,
  codigoCupon,
  codigoMuestra,
  formatearNumero,
};
