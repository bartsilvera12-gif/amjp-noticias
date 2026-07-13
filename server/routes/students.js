// Administración de alumnos del Aula Virtual y sus matrículas (solo admin).
import express from "express";
import { db } from "../db.js";
import { hashPassword } from "../auth.js";

function serialize(r){
  return { id: r.id, name: r.name, email: r.email, matricula: r.matricula, active: !!r.active, created_at: r.created_at };
}

export const studentsRouter = express.Router();

// Lista de alumnos con la cantidad de cursos en los que están matriculados.
studentsRouter.get("/", (req, res) => {
  const rows = db.prepare(`
    SELECT s.*, (SELECT COUNT(*) FROM enrollments e WHERE e.student_id = s.id) AS courses
    FROM students s ORDER BY s.name COLLATE NOCASE
  `).all();
  res.json(rows.map(r => ({ ...serialize(r), courses: r.courses })));
});

// Detalle del alumno + cursos matriculados.
studentsRouter.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM students WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "No encontrado" });
  const courses = db.prepare(`
    SELECT a.id, a.t AS title, a.d AS date, e.created_at AS enrolled_at
    FROM enrollments e JOIN articles a ON a.id = e.course_id
    WHERE e.student_id = ? ORDER BY e.created_at DESC
  `).all(req.params.id);
  res.json({ ...serialize(row), courses });
});

studentsRouter.post("/", express.json(), (req, res) => {
  const { name, email, matricula, password } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: "Falta el nombre" });
  const mail = (email || "").trim().toLowerCase();
  if (!mail) return res.status(400).json({ error: "Falta el correo" });
  if (!password || password.length < 4) return res.status(400).json({ error: "La contraseña debe tener al menos 4 caracteres" });
  if (db.prepare("SELECT id FROM students WHERE email = ?").get(mail)) return res.status(409).json({ error: "Ya existe un alumno con ese correo" });
  const info = db.prepare("INSERT INTO students (name, email, matricula, password_hash) VALUES (?, ?, ?, ?)")
    .run(name.trim(), mail, matricula || null, hashPassword(password));
  res.status(201).json(serialize(db.prepare("SELECT * FROM students WHERE id = ?").get(info.lastInsertRowid)));
});

studentsRouter.put("/:id", express.json(), (req, res) => {
  const existing = db.prepare("SELECT * FROM students WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "No encontrado" });
  const { name, email, matricula, active, password } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: "Falta el nombre" });
  const mail = (email || "").trim().toLowerCase();
  if (!mail) return res.status(400).json({ error: "Falta el correo" });
  const clash = db.prepare("SELECT id FROM students WHERE email = ? AND id != ?").get(mail, req.params.id);
  if (clash) return res.status(409).json({ error: "Ya existe otro alumno con ese correo" });
  db.prepare("UPDATE students SET name = ?, email = ?, matricula = ?, active = ? WHERE id = ?")
    .run(name.trim(), mail, matricula || null, active ? 1 : 0, req.params.id);
  if (password && password.length >= 4){
    db.prepare("UPDATE students SET password_hash = ? WHERE id = ?").run(hashPassword(password), req.params.id);
  }
  res.json(serialize(db.prepare("SELECT * FROM students WHERE id = ?").get(req.params.id)));
});

studentsRouter.delete("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM students WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "No encontrado" });
  db.prepare("DELETE FROM students WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// --- Matrículas ---
studentsRouter.post("/:id/enrollments", express.json(), (req, res) => {
  const student = db.prepare("SELECT id FROM students WHERE id = ?").get(req.params.id);
  if (!student) return res.status(404).json({ error: "Alumno no encontrado" });
  const { course_id } = req.body || {};
  const course = db.prepare("SELECT id FROM articles WHERE id = ? AND section = 'cursos'").get(course_id);
  if (!course) return res.status(400).json({ error: "Curso inválido" });
  try {
    db.prepare("INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)").run(req.params.id, course_id);
  } catch { /* UNIQUE: ya estaba matriculado, es idempotente */ }
  res.status(201).json({ ok: true });
});

studentsRouter.delete("/:id/enrollments/:courseId", (req, res) => {
  db.prepare("DELETE FROM enrollments WHERE student_id = ? AND course_id = ?").run(req.params.id, req.params.courseId);
  res.json({ ok: true });
});
