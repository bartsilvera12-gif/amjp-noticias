// Bandeja de mensajes (envíos de los formularios públicos) — solo para el panel.
import express from "express";
import { db } from "../db.js";

function serialize(r){
  return { id: r.id, kind: r.kind, data: JSON.parse(r.data || "{}"), created_at: r.created_at, read: !!r.read };
}

export const submissionsRouter = express.Router();

submissionsRouter.get("/", (req, res) => {
  res.json(db.prepare("SELECT * FROM form_submissions ORDER BY created_at DESC, id DESC").all().map(serialize));
});

submissionsRouter.patch("/:id", express.json(), (req, res) => {
  const existing = db.prepare("SELECT * FROM form_submissions WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "No encontrado" });
  const read = req.body && typeof req.body.read === "boolean" ? (req.body.read ? 1 : 0) : 1;
  db.prepare("UPDATE form_submissions SET read = ? WHERE id = ?").run(read, req.params.id);
  res.json(serialize(db.prepare("SELECT * FROM form_submissions WHERE id = ?").get(req.params.id)));
});

submissionsRouter.delete("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM form_submissions WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "No encontrado" });
  db.prepare("DELETE FROM form_submissions WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});
