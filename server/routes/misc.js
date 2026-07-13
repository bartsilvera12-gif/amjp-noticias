// Comisión Directiva, Estatutos y Expresidentes.
import express from "express";
import { db } from "../db.js";
import { regenerateSiteData } from "../regenerate.mjs";

export const miscRouter = express.Router();

/* ---------- Comisión Directiva ---------- */
miscRouter.get("/comision-directiva", (req, res) => {
  const meta = db.prepare("SELECT * FROM cd_meta WHERE id = 1").get();
  const sections = db.prepare("SELECT * FROM cd_sections ORDER BY sort_order").all().map((sec) => {
    const rows = db.prepare("SELECT * FROM cd_rows WHERE section_id = ? ORDER BY sort_order").all(sec.id);
    return {
      title: sec.title,
      rows: rows.map((row) =>
        db.prepare("SELECT * FROM cd_cells WHERE row_id = ? ORDER BY sort_order").all(row.id)
          .map((c) => ({ tag: c.tag, rowspan: c.rowspan, text: c.text }))
      ),
    };
  });
  res.json({ hero: (meta && meta.hero) || null, sections });
});

miscRouter.put("/comision-directiva", express.json({ limit: "2mb" }), (req, res) => {
  const { hero, sections } = req.body || {};
  if (!Array.isArray(sections)) return res.status(400).json({ error: "Formato inválido" });
  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM cd_sections").run(); // ON DELETE CASCADE limpia filas y celdas
    db.prepare("INSERT INTO cd_meta (id, hero) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET hero = excluded.hero").run(hero || null);
    const insSec = db.prepare("INSERT INTO cd_sections (title, sort_order) VALUES (?, ?)");
    const insRow = db.prepare("INSERT INTO cd_rows (section_id, sort_order) VALUES (?, ?)");
    const insCell = db.prepare("INSERT INTO cd_cells (row_id, tag, rowspan, text, sort_order) VALUES (?, ?, ?, ?, ?)");
    sections.forEach((sec, si) => {
      const secInfo = insSec.run(sec.title || "", si);
      (sec.rows || []).forEach((row, ri) => {
        const rowInfo = insRow.run(secInfo.lastInsertRowid, ri);
        row.forEach((cell, ci) => insCell.run(rowInfo.lastInsertRowid, cell.tag || "td", Math.max(1, Number(cell.rowspan) || 1), cell.text || "", ci));
      });
    });
    db.exec("COMMIT");
  } catch (e){
    db.exec("ROLLBACK");
    return res.status(500).json({ error: e.message });
  }
  regenerateSiteData();
  res.json({ ok: true });
});

/* ---------- Estatutos ---------- */
miscRouter.get("/estatutos", (req, res) => {
  const row = db.prepare("SELECT * FROM estatutos WHERE id = 1").get();
  res.json({ html: (row && row.html) || "" });
});

miscRouter.put("/estatutos", express.json({ limit: "5mb" }), (req, res) => {
  const { html } = req.body || {};
  db.prepare("INSERT INTO estatutos (id, html) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET html = excluded.html").run(html || "");
  regenerateSiteData();
  res.json({ ok: true });
});

/* ---------- Expresidentes ---------- */
function serializePresidente(r){
  return { id: r.id, big: r.big, thumb: r.thumb, name: r.name, period: r.period, sort_order: r.sort_order };
}

miscRouter.get("/expresidentes", (req, res) => {
  res.json(db.prepare("SELECT * FROM expresidentes ORDER BY sort_order").all().map(serializePresidente));
});

miscRouter.get("/expresidentes/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM expresidentes WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "No encontrado" });
  res.json(serializePresidente(row));
});

miscRouter.post("/expresidentes", express.json(), (req, res) => {
  const { name, period, big, thumb } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: "Falta el nombre" });
  const maxOrder = db.prepare("SELECT COALESCE(MAX(sort_order),-1) n FROM expresidentes").get().n;
  const info = db.prepare("INSERT INTO expresidentes (big, thumb, name, period, sort_order) VALUES (?, ?, ?, ?, ?)")
    .run(big || null, thumb || big || null, name.trim(), period || "", maxOrder + 1);
  regenerateSiteData();
  res.status(201).json(serializePresidente(db.prepare("SELECT * FROM expresidentes WHERE id = ?").get(info.lastInsertRowid)));
});

miscRouter.put("/expresidentes/:id", express.json(), (req, res) => {
  const existing = db.prepare("SELECT * FROM expresidentes WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "No encontrado" });
  const { name, period, big, thumb } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: "Falta el nombre" });
  db.prepare("UPDATE expresidentes SET name = ?, period = ?, big = ?, thumb = ? WHERE id = ?")
    .run(name.trim(), period || "", big || null, thumb || big || null, req.params.id);
  regenerateSiteData();
  res.json(serializePresidente(db.prepare("SELECT * FROM expresidentes WHERE id = ?").get(req.params.id)));
});

miscRouter.delete("/expresidentes/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM expresidentes WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "No encontrado" });
  db.prepare("DELETE FROM expresidentes WHERE id = ?").run(req.params.id);
  regenerateSiteData();
  res.json({ ok: true });
});
