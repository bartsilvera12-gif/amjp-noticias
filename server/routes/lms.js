// Contenido de los cursos (módulos y lecciones) — administración, solo admin.
// El curso es un artículo de la sección 'cursos'; acá se le arma la estructura pedagógica.
import express from "express";
import { db } from "../db.js";

function serializeLesson(l){
  return {
    id: l.id, module_id: l.module_id, title: l.title, description: l.description,
    video_path: l.video_path, is_live: !!l.is_live, live_url: l.live_url, sort_order: l.sort_order,
  };
}

function modulesWithLessons(courseId){
  const modules = db.prepare("SELECT * FROM course_modules WHERE course_id = ? ORDER BY sort_order, id").all(courseId);
  const lessonsByModule = db.prepare("SELECT * FROM course_lessons WHERE module_id = ? ORDER BY sort_order, id");
  return modules.map(m => ({
    id: m.id, course_id: m.course_id, title: m.title, sort_order: m.sort_order,
    lessons: lessonsByModule.all(m.id).map(serializeLesson),
  }));
}

export const lmsRouter = express.Router();

// Cursos disponibles para armar contenido (con conteo de módulos y lecciones).
lmsRouter.get("/courses", (req, res) => {
  const rows = db.prepare(`
    SELECT a.id, a.t AS title, a.d AS date, a.img,
      (SELECT COUNT(*) FROM course_modules m WHERE m.course_id = a.id) AS modules,
      (SELECT COUNT(*) FROM course_lessons l JOIN course_modules m ON m.id = l.module_id WHERE m.course_id = a.id) AS lessons,
      (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = a.id) AS students
    FROM articles a WHERE a.section = 'cursos' ORDER BY a.d DESC, a.id DESC
  `).all();
  res.json(rows);
});

lmsRouter.get("/courses/:courseId/modules", (req, res) => {
  const course = db.prepare("SELECT id FROM articles WHERE id = ? AND section = 'cursos'").get(req.params.courseId);
  if (!course) return res.status(404).json({ error: "Curso no encontrado" });
  res.json(modulesWithLessons(req.params.courseId));
});

lmsRouter.post("/courses/:courseId/modules", express.json(), (req, res) => {
  const course = db.prepare("SELECT id FROM articles WHERE id = ? AND section = 'cursos'").get(req.params.courseId);
  if (!course) return res.status(404).json({ error: "Curso no encontrado" });
  const { title } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "Falta el título del módulo" });
  const n = db.prepare("SELECT COALESCE(MAX(sort_order),-1) n FROM course_modules WHERE course_id = ?").get(req.params.courseId).n;
  const info = db.prepare("INSERT INTO course_modules (course_id, title, sort_order) VALUES (?, ?, ?)")
    .run(req.params.courseId, title.trim(), n + 1);
  res.status(201).json({ id: info.lastInsertRowid, course_id: Number(req.params.courseId), title: title.trim(), sort_order: n + 1, lessons: [] });
});

lmsRouter.put("/modules/:id", express.json(), (req, res) => {
  const existing = db.prepare("SELECT * FROM course_modules WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Módulo no encontrado" });
  const { title } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "Falta el título del módulo" });
  db.prepare("UPDATE course_modules SET title = ? WHERE id = ?").run(title.trim(), req.params.id);
  res.json({ ok: true });
});

lmsRouter.delete("/modules/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM course_modules WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Módulo no encontrado" });
  db.prepare("DELETE FROM course_modules WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

lmsRouter.post("/modules/:id/lessons", express.json(), (req, res) => {
  const mod = db.prepare("SELECT * FROM course_modules WHERE id = ?").get(req.params.id);
  if (!mod) return res.status(404).json({ error: "Módulo no encontrado" });
  const { title, description, video_path, is_live, live_url } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "Falta el título de la lección" });
  const n = db.prepare("SELECT COALESCE(MAX(sort_order),-1) n FROM course_lessons WHERE module_id = ?").get(req.params.id).n;
  const info = db.prepare(`INSERT INTO course_lessons (module_id, title, description, video_path, is_live, live_url, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(req.params.id, title.trim(), description || "", video_path || null, is_live ? 1 : 0, live_url || null, n + 1);
  res.status(201).json(serializeLesson(db.prepare("SELECT * FROM course_lessons WHERE id = ?").get(info.lastInsertRowid)));
});

lmsRouter.put("/lessons/:id", express.json(), (req, res) => {
  const existing = db.prepare("SELECT * FROM course_lessons WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Lección no encontrada" });
  const { title, description, video_path, is_live, live_url } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "Falta el título de la lección" });
  db.prepare(`UPDATE course_lessons SET title = ?, description = ?, video_path = ?, is_live = ?, live_url = ? WHERE id = ?`)
    .run(title.trim(), description || "", video_path || null, is_live ? 1 : 0, live_url || null, req.params.id);
  res.json(serializeLesson(db.prepare("SELECT * FROM course_lessons WHERE id = ?").get(req.params.id)));
});

lmsRouter.delete("/lessons/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM course_lessons WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Lección no encontrada" });
  db.prepare("DELETE FROM course_lessons WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});
