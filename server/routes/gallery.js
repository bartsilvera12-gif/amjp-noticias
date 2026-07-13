// CRUD de Galería (álbumes + fotos). Las fotos nuevas se guardan en uploads/galeria
// (misma carpeta que usa el sitio público); no se genera una miniatura aparte —
// se usa la misma imagen como "big" y "thumb" para mantenerlo simple.
import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { db } from "../db.js";
import { regenerateSiteData } from "../regenerate.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads", "galeria");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, path.extname(file.originalname))
      .toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "foto";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${base}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED.has(ext)) return cb(new Error("Formato de imagen no permitido"));
    cb(null, true);
  },
});

function slugify(s){
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function uniqueSlug(base){
  let slug = base, i = 2;
  while (db.prepare("SELECT 1 FROM gallery_albums WHERE slug = ?").get(slug)) slug = `${base}-${i++}`;
  return slug;
}
function serializeAlbum(row){
  const photos = db.prepare("SELECT * FROM gallery_photos WHERE album_id = ? ORDER BY sort_order").all(row.id);
  return {
    id: row.id, slug: row.slug, title: row.title, thumb: row.thumb, date: row.date, intro: row.intro,
    photos: photos.map((p) => ({ id: p.id, big: p.big, thumb: p.thumb, caption: p.caption, sort_order: p.sort_order })),
  };
}

export const galleryRouter = express.Router();

galleryRouter.get("/albums", (req, res) => {
  const rows = db.prepare("SELECT * FROM gallery_albums ORDER BY sort_order DESC, id DESC").all();
  res.json(rows.map((r) => ({
    id: r.id, slug: r.slug, title: r.title, thumb: r.thumb, date: r.date,
    photoCount: db.prepare("SELECT COUNT(*) n FROM gallery_photos WHERE album_id = ?").get(r.id).n,
  })));
});

galleryRouter.get("/albums/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM gallery_albums WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "No encontrado" });
  res.json(serializeAlbum(row));
});

galleryRouter.post("/albums", express.json(), (req, res) => {
  const { title, date, intro } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "Falta el título del álbum" });
  const year = (date || "").slice(0, 4) || String(new Date().getFullYear());
  const slug = uniqueSlug(`${year}/${slugify(title)}`);
  const info = db.prepare(
    "INSERT INTO gallery_albums (slug, title, thumb, date, intro, sort_order) VALUES (?, ?, NULL, ?, ?, (SELECT COALESCE(MAX(sort_order),0)+1 FROM gallery_albums))"
  ).run(slug, title.trim(), date || "", intro || "");
  regenerateSiteData();
  res.status(201).json(serializeAlbum(db.prepare("SELECT * FROM gallery_albums WHERE id = ?").get(info.lastInsertRowid)));
});

galleryRouter.put("/albums/:id", express.json(), (req, res) => {
  const existing = db.prepare("SELECT * FROM gallery_albums WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "No encontrado" });
  const { title, date, intro } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "Falta el título del álbum" });
  db.prepare("UPDATE gallery_albums SET title = ?, date = ?, intro = ? WHERE id = ?")
    .run(title.trim(), date || "", intro || "", req.params.id);
  regenerateSiteData();
  res.json(serializeAlbum(db.prepare("SELECT * FROM gallery_albums WHERE id = ?").get(req.params.id)));
});

galleryRouter.delete("/albums/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM gallery_albums WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "No encontrado" });
  db.prepare("DELETE FROM gallery_albums WHERE id = ?").run(req.params.id); // ON DELETE CASCADE limpia las fotos
  regenerateSiteData();
  res.json({ ok: true });
});

galleryRouter.post("/albums/:id/photos", upload.array("photos", 30), (req, res) => {
  const album = db.prepare("SELECT * FROM gallery_albums WHERE id = ?").get(req.params.id);
  if (!album) return res.status(404).json({ error: "Álbum no encontrado" });
  if (!req.files || !req.files.length) return res.status(400).json({ error: "No se recibió ninguna imagen" });
  const maxOrder = db.prepare("SELECT COALESCE(MAX(sort_order),-1) n FROM gallery_photos WHERE album_id = ?").get(album.id).n;
  const insert = db.prepare("INSERT INTO gallery_photos (album_id, big, thumb, caption, sort_order) VALUES (?, ?, ?, '', ?)");
  req.files.forEach((f, i) => {
    const rel = "uploads/galeria/" + f.filename;
    insert.run(album.id, rel, rel, maxOrder + 1 + i);
  });
  if (!album.thumb){
    db.prepare("UPDATE gallery_albums SET thumb = ? WHERE id = ?").run("uploads/galeria/" + req.files[0].filename, album.id);
  }
  regenerateSiteData();
  res.status(201).json(serializeAlbum(db.prepare("SELECT * FROM gallery_albums WHERE id = ?").get(album.id)));
});

galleryRouter.put("/photos/:id", express.json(), (req, res) => {
  const existing = db.prepare("SELECT * FROM gallery_photos WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "No encontrada" });
  db.prepare("UPDATE gallery_photos SET caption = ? WHERE id = ?").run((req.body && req.body.caption) || "", req.params.id);
  regenerateSiteData();
  res.json({ ok: true });
});

galleryRouter.delete("/photos/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM gallery_photos WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "No encontrada" });
  db.prepare("DELETE FROM gallery_photos WHERE id = ?").run(req.params.id);
  regenerateSiteData();
  res.json({ ok: true });
});

// eslint-disable-next-line no-unused-vars
galleryRouter.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || "Error al subir la imagen" });
});
