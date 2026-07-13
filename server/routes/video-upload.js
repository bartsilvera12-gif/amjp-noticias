// Subida de videos de lecciones — se guardan autoalojados en uploads/videos.
// Archivos grandes: límite generoso y nombre saneado con timestamp para evitar colisiones.
import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VIDEOS_DIR = path.join(__dirname, "..", "..", "uploads", "videos");
fs.mkdirSync(VIDEOS_DIR, { recursive: true });

const ALLOWED = new Set([".mp4", ".webm", ".ogg", ".mov", ".m4v"]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, VIDEOS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, path.extname(file.originalname))
      .toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "video";
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1 GB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED.has(ext)) return cb(new Error("Formato de video no permitido (usá mp4, webm, mov u ogg)"));
    cb(null, true);
  },
});

export const videoUploadRouter = express.Router();

videoUploadRouter.post("/", upload.single("video"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No se recibió ningún video" });
  res.status(201).json({ path: "uploads/videos/" + req.file.filename });
});

// eslint-disable-next-line no-unused-vars
videoUploadRouter.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || "Error al subir el video" });
});
