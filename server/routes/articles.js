// CRUD de artículos (noticias/resoluciones/cursos/eventos/deportes — misma forma, por "section").
import express from "express";
import { db } from "../db.js";
import { regenerateNews, regenerateSiteData } from "../regenerate.mjs";

const VALID_SECTIONS = new Set(["noticias", "resoluciones", "cursos", "eventos", "deportes"]);

function regenerateFor(section){
  if (section === "noticias") regenerateNews();
  else regenerateSiteData(); // resoluciones/cursos/eventos/deportes viven en site-data.js
}

function serializeRow(r){
  return { id: r.id, section: r.section, d: r.d, t: r.t, img: r.img, body: JSON.parse(r.body || "[]") };
}

export const articlesRouter = express.Router();

articlesRouter.get("/", (req, res) => {
  const section = req.query.section;
  if (!section || !VALID_SECTIONS.has(section)){
    return res.status(400).json({ error: "Parámetro 'section' inválido o faltante" });
  }
  const rows = db.prepare("SELECT * FROM articles WHERE section = ? ORDER BY d DESC, id DESC").all(section);
  res.json(rows.map(serializeRow));
});

articlesRouter.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM articles WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "No encontrado" });
  res.json(serializeRow(row));
});

articlesRouter.post("/", express.json({ limit: "2mb" }), (req, res) => {
  const { section, d, t, img, body } = req.body || {};
  if (!VALID_SECTIONS.has(section)) return res.status(400).json({ error: "Sección inválida" });
  if (!d || !t) return res.status(400).json({ error: "Faltan campos obligatorios (fecha, título)" });
  const stmt = db.prepare("INSERT INTO articles (section, d, t, img, body) VALUES (?, ?, ?, ?, ?)");
  const info = stmt.run(section, d, t, img || null, JSON.stringify(Array.isArray(body) ? body : []));
  regenerateFor(section);
  const row = db.prepare("SELECT * FROM articles WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(serializeRow(row));
});

articlesRouter.put("/:id", express.json({ limit: "2mb" }), (req, res) => {
  const existing = db.prepare("SELECT * FROM articles WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "No encontrado" });
  const { d, t, img, body } = req.body || {};
  if (!d || !t) return res.status(400).json({ error: "Faltan campos obligatorios (fecha, título)" });
  db.prepare("UPDATE articles SET d = ?, t = ?, img = ?, body = ?, updated_at = datetime('now') WHERE id = ?")
    .run(d, t, img || null, JSON.stringify(Array.isArray(body) ? body : []), req.params.id);
  regenerateFor(existing.section);
  const row = db.prepare("SELECT * FROM articles WHERE id = ?").get(req.params.id);
  res.json(serializeRow(row));
});

articlesRouter.delete("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM articles WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "No encontrado" });
  db.prepare("DELETE FROM articles WHERE id = ?").run(req.params.id);
  regenerateFor(existing.section);
  res.json({ ok: true });
});
