// Subida de imágenes — guarda en uploads/articulos (misma carpeta que usa el sitio público)
// con nombre {timestamp}-{nombre-original-saneado}.{ext} para evitar colisiones.
import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads", "articulos");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, path.extname(file.originalname))
      .toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "imagen";
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED.has(ext)) return cb(new Error("Formato de imagen no permitido"));
    cb(null, true);
  },
});

export const uploadRouter = express.Router();

uploadRouter.post("/", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No se recibió ninguna imagen" });
  res.status(201).json({ path: "uploads/articulos/" + req.file.filename });
});

// eslint-disable-next-line no-unused-vars
uploadRouter.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || "Error al subir la imagen" });
});
