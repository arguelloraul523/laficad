import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// En ESM no existe __dirname: se deriva de la ubicación del módulo.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carpeta donde se guardan los archivos subidos
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const nombre = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, nombre);
  },
});

// Solo se permiten imágenes y PDF
const fileFilter = (req, file, cb) => {
  const permitidos = /jpeg|jpg|png|pdf/;
  const ok = permitidos.test(path.extname(file.originalname).toLowerCase());
  if (ok) cb(null, true);
  else cb(new Error('Formato no permitido (solo JPG, PNG o PDF)'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // máx. 5 MB
});

export default upload;
