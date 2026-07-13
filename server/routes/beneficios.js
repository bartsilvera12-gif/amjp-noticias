// CRUD de Beneficios (los enlaces que se muestran en /socios/beneficios).
import express from "express";
import { db } from "../db.js";
import { regenerateSiteData } from "../regenerate.mjs";

function serialize(r){
  return { id: r.id, title: r.title, href: r.href, desc: r.desc, active: !!r.active, sort_order: r.sort_order };
}

export const beneficiosRouter = express.Router();

beneficiosRouter.get("/", (req, res) => {
  res.json(db.prepare("SELECT * FROM beneficios ORDER BY sort_order").all().map(serialize));
});

beneficiosRouter.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM beneficios WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "No encontrado" });
  res.json(serialize(row));
});

beneficiosRouter.post("/", express.json(), (req, res) => {
  const { title, href, desc, active } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "Falta el título" });
  const maxOrder = db.prepare("SELECT COALESCE(MAX(sort_order),-1) n FROM beneficios").get().n;
  const info = db.prepare("INSERT INTO beneficios (title, href, desc, active, sort_order) VALUES (?, ?, ?, ?, ?)")
    .run(title.trim(), href || null, desc || "", active ? 1 : 0, maxOrder + 1);
  regenerateSiteData();
  res.status(201).json(serialize(db.prepare("SELECT * FROM beneficios WHERE id = ?").get(info.lastInsertRowid)));
});

beneficiosRouter.put("/:id", express.json(), (req, res) => {
  const existing = db.prepare("SELECT * FROM beneficios WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "No encontrado" });
  const { title, href, desc, active } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "Falta el título" });
  db.prepare("UPDATE beneficios SET title = ?, href = ?, desc = ?, active = ? WHERE id = ?")
    .run(title.trim(), href || null, desc || "", active ? 1 : 0, req.params.id);
  regenerateSiteData();
  res.json(serialize(db.prepare("SELECT * FROM beneficios WHERE id = ?").get(req.params.id)));
});

beneficiosRouter.delete("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM beneficios WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "No encontrado" });
  db.prepare("DELETE FROM beneficios WHERE id = ?").run(req.params.id);
  regenerateSiteData();
  res.json({ ok: true });
});
