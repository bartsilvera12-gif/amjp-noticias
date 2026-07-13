// Endpoint público (sin login) que reciben los 4 formularios del sitio:
// Inscripción, Créditos, Actualización de datos y Contacto.
import express from "express";
import { db } from "../db.js";

const VALID_KINDS = new Set(["Inscripción", "Créditos", "Actualización de Datos", "Contacto"]);

export const publicContactRouter = express.Router();

publicContactRouter.post("/contact", express.json({ limit: "100kb" }), (req, res) => {
  const { kind, data } = req.body || {};
  if (!kind || !VALID_KINDS.has(kind)) return res.status(400).json({ error: "Tipo de formulario inválido" });
  if (!data || typeof data !== "object" || Array.isArray(data)) return res.status(400).json({ error: "Datos inválidos" });
  db.prepare("INSERT INTO form_submissions (kind, data) VALUES (?, ?)").run(kind, JSON.stringify(data));
  res.status(201).json({ ok: true });
});
