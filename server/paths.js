// Rutas de datos persistentes (base de datos + archivos subidos).
// En producción, apuntar DATABASE_PATH y UPLOADS_DIR a un VOLUMEN PERSISTENTE del
// host (Railway/Render), para que la base y los archivos NUEVOS (uploads del panel)
// no se pierdan en cada redeploy. En desarrollo, los valores por defecto dejan todo local.
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url)); // server/
const ROOT = path.join(__dirname, "..");

// Imágenes históricas ya incluidas en el repo (solo lectura). Se sirven como respaldo.
export const REPO_UPLOADS = path.join(ROOT, "uploads");

export const DATABASE_PATH = process.env.DATABASE_PATH || path.join(__dirname, "data", "amjp.db");
export const UPLOADS_DIR   = process.env.UPLOADS_DIR   || REPO_UPLOADS;
export const ARTICULOS_DIR = path.join(UPLOADS_DIR, "articulos");
export const VIDEOS_DIR    = path.join(UPLOADS_DIR, "videos");

for (const dir of [path.dirname(DATABASE_PATH), ARTICULOS_DIR, VIDEOS_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

// Sembrado inicial de la base: si el volumen todavía no tiene la base, copiar la
// base semilla del repo para que el sitio arranque con su contenido (no vacío).
if (!fs.existsSync(DATABASE_PATH)) {
  const seed = path.join(__dirname, "seed", "amjp.db");
  if (fs.existsSync(seed)) fs.copyFileSync(seed, DATABASE_PATH);
}
