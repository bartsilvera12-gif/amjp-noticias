// Aula Virtual — API del alumno. Login propio y acceso solo a los cursos matriculados.
import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { db } from "../db.js";
import { requireStudent, authenticateStudent } from "../student-auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");

export const aulaRouter = express.Router();

// --- Sesión del alumno (público) ---
aulaRouter.post("/login", express.json(), (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Faltan correo o contraseña" });
  const student = authenticateStudent(email, password);
  if (!student) return res.status(401).json({ error: "Correo o contraseña incorrectos" });
  req.session.studentId = student.id;
  req.session.studentName = student.name;
  res.json({ ok: true, name: student.name, email: student.email });
});

aulaRouter.post("/logout", (req, res) => {
  delete req.session.studentId;
  delete req.session.studentName;
  res.json({ ok: true });
});

aulaRouter.get("/me", (req, res) => {
  if (req.session && req.session.studentId){
    const s = db.prepare("SELECT id, name, email, matricula FROM students WHERE id = ?").get(req.session.studentId);
    if (s) return res.json({ authenticated: true, student: s });
  }
  res.json({ authenticated: false });
});

// Helper: ¿el alumno está matriculado en este curso?
function isEnrolled(studentId, courseId){
  return !!db.prepare("SELECT 1 FROM enrollments WHERE student_id = ? AND course_id = ?").get(studentId, courseId);
}

// --- Mis cursos (con progreso) ---
aulaRouter.get("/courses", requireStudent, (req, res) => {
  const sid = req.session.studentId;
  const courses = db.prepare(`
    SELECT a.id, a.t AS title, a.d AS date, a.img
    FROM enrollments e JOIN articles a ON a.id = e.course_id
    WHERE e.student_id = ? ORDER BY e.created_at DESC
  `).all(sid);
  const totalStmt = db.prepare(`SELECT COUNT(*) n FROM course_lessons l JOIN course_modules m ON m.id = l.module_id WHERE m.course_id = ?`);
  const doneStmt = db.prepare(`
    SELECT COUNT(*) n FROM lesson_progress p
    JOIN course_lessons l ON l.id = p.lesson_id
    JOIN course_modules m ON m.id = l.module_id
    WHERE p.student_id = ? AND m.course_id = ? AND p.completed = 1
  `);
  res.json(courses.map(c => ({
    ...c,
    total_lessons: totalStmt.get(c.id).n,
    completed_lessons: doneStmt.get(sid, c.id).n,
  })));
});

// --- Detalle de un curso: módulos, lecciones y mi progreso ---
aulaRouter.get("/courses/:courseId", requireStudent, (req, res) => {
  const sid = req.session.studentId;
  const courseId = req.params.courseId;
  if (!isEnrolled(sid, courseId)) return res.status(403).json({ error: "No estás matriculado en este curso" });
  const course = db.prepare("SELECT id, t AS title, d AS date, img, body FROM articles WHERE id = ? AND section = 'cursos'").get(courseId);
  if (!course) return res.status(404).json({ error: "Curso no encontrado" });
  const done = new Set(db.prepare(`
    SELECT p.lesson_id FROM lesson_progress p
    JOIN course_lessons l ON l.id = p.lesson_id
    JOIN course_modules m ON m.id = l.module_id
    WHERE p.student_id = ? AND m.course_id = ? AND p.completed = 1
  `).all(sid, courseId).map(r => r.lesson_id));
  const modules = db.prepare("SELECT * FROM course_modules WHERE course_id = ? ORDER BY sort_order, id").all(courseId);
  const lessonsStmt = db.prepare("SELECT * FROM course_lessons WHERE module_id = ? ORDER BY sort_order, id");
  const data = modules.map(m => ({
    id: m.id, title: m.title,
    lessons: lessonsStmt.all(m.id).map(l => ({
      id: l.id, title: l.title, description: l.description,
      is_live: !!l.is_live, live_url: l.is_live ? l.live_url : null,
      has_video: !!l.video_path,
      completed: done.has(l.id),
    })),
  }));
  res.json({ id: course.id, title: course.title, date: course.date, img: course.img, modules: data });
});

// --- Marcar / desmarcar lección como vista ---
aulaRouter.post("/lessons/:id/progress", express.json(), requireStudent, (req, res) => {
  const sid = req.session.studentId;
  const lesson = db.prepare(`
    SELECT l.id, m.course_id FROM course_lessons l JOIN course_modules m ON m.id = l.module_id WHERE l.id = ?
  `).get(req.params.id);
  if (!lesson) return res.status(404).json({ error: "Lección no encontrada" });
  if (!isEnrolled(sid, lesson.course_id)) return res.status(403).json({ error: "No estás matriculado en este curso" });
  const completed = req.body && req.body.completed ? 1 : 0;
  db.prepare(`
    INSERT INTO lesson_progress (student_id, lesson_id, completed, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(student_id, lesson_id) DO UPDATE SET completed = excluded.completed, updated_at = datetime('now')
  `).run(sid, req.params.id, completed);
  res.json({ ok: true, completed: !!completed });
});

// --- Streaming de video protegido por matrícula (con soporte de Range para adelantar) ---
aulaRouter.get("/lessons/:id/video", requireStudent, (req, res) => {
  const sid = req.session.studentId;
  const lesson = db.prepare(`
    SELECT l.video_path, m.course_id FROM course_lessons l JOIN course_modules m ON m.id = l.module_id WHERE l.id = ?
  `).get(req.params.id);
  if (!lesson || !lesson.video_path) return res.status(404).json({ error: "La lección no tiene video" });
  if (!isEnrolled(sid, lesson.course_id)) return res.status(403).json({ error: "No estás matriculado en este curso" });

  // Evita path traversal: solo servimos archivos dentro de uploads/videos.
  const videosDir = path.join(ROOT, "uploads", "videos");
  const abs = path.join(ROOT, lesson.video_path);
  if (!abs.startsWith(videosDir) || !fs.existsSync(abs)) return res.status(404).json({ error: "Video no disponible" });

  const stat = fs.statSync(abs);
  const total = stat.size;
  const ext = path.extname(abs).toLowerCase();
  const type = ext === ".webm" ? "video/webm" : ext === ".ogg" ? "video/ogg" : "video/mp4";
  const range = req.headers.range;

  if (range){
    const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
    const start = m[1] ? parseInt(m[1], 10) : 0;
    const end = m[2] ? parseInt(m[2], 10) : total - 1;
    if (start >= total || start > end){
      res.status(416).set("Content-Range", `bytes */${total}`).end();
      return;
    }
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${total}`,
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
      "Content-Type": type,
    });
    fs.createReadStream(abs, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { "Content-Length": total, "Content-Type": type, "Accept-Ranges": "bytes" });
    fs.createReadStream(abs).pipe(res);
  }
});
