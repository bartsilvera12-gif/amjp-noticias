// Endpoints públicos (sin login) que reciben los formularios del sitio:
// Inscripción, Créditos, Actualización de datos, Contacto y la inscripción directa a cursos.
import express from "express";
import { db } from "../db.js";
import { hashPassword } from "../auth.js";
import { sendMail, welcomeCourseEmail } from "../mailer.js";

const VALID_KINDS = new Set(["Inscripción", "Créditos", "Actualización de Datos", "Contacto", "Inscripción a curso"]);

export const publicContactRouter = express.Router();

publicContactRouter.post("/contact", express.json({ limit: "100kb" }), (req, res) => {
  const { kind, data } = req.body || {};
  if (!kind || !VALID_KINDS.has(kind)) return res.status(400).json({ error: "Tipo de formulario inválido" });
  if (!data || typeof data !== "object" || Array.isArray(data)) return res.status(400).json({ error: "Datos inválidos" });
  db.prepare("INSERT INTO form_submissions (kind, data) VALUES (?, ?)").run(kind, JSON.stringify(data));
  res.status(201).json({ ok: true });
});

// Inscripción directa a un curso: crea la cuenta de alumno (si no existe) y lo matricula.
// La contraseña inicial del Aula Virtual es su número de cédula.
publicContactRouter.post("/inscripcion-curso", express.json({ limit: "100kb" }), async (req, res) => {
  const { course_id, name, cedula, email } = req.body || {};
  const nombre = (name || "").trim();
  const mail = (email || "").trim().toLowerCase();
  const ci = String(cedula || "").trim();
  if (!nombre) return res.status(400).json({ error: "Falta el nombre y apellido" });
  if (!mail) return res.status(400).json({ error: "Falta el correo electrónico" });
  if (ci.length < 4) return res.status(400).json({ error: "El número de cédula no es válido" });

  const course = db.prepare("SELECT id, t FROM articles WHERE id = ? AND section = 'cursos'").get(course_id);
  if (!course) return res.status(400).json({ error: "Elegí un curso válido" });

  // Buscar el alumno por correo; si no existe, crearlo con la cédula como contraseña inicial.
  let student = db.prepare("SELECT * FROM students WHERE email = ?").get(mail);
  let created = false;
  if (!student) {
    const info = db.prepare("INSERT INTO students (name, email, matricula, password_hash) VALUES (?, ?, ?, ?)")
      .run(nombre, mail, ci, hashPassword(ci));
    student = db.prepare("SELECT * FROM students WHERE id = ?").get(info.lastInsertRowid);
    created = true;
  }

  // Matricular en el curso (idempotente: si ya estaba, no pasa nada).
  const already = db.prepare("SELECT 1 FROM enrollments WHERE student_id = ? AND course_id = ?").get(student.id, course.id);
  if (!already) {
    db.prepare("INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)").run(student.id, course.id);
  }

  // Dejar constancia en Mensajes para la Secretaría.
  db.prepare("INSERT INTO form_submissions (kind, data) VALUES (?, ?)")
    .run("Inscripción a curso", JSON.stringify({ course: course.t, name: nombre, cedula: ci, email: mail }));

  // Correo de bienvenida con el acceso al Aula (best-effort: no falla la inscripción si el correo no sale).
  // Solo incluye la contraseña cuando la cuenta es nueva (la cédula es la contraseña inicial).
  const mailMsg = welcomeCourseEmail({ name: nombre, course: course.t, email: mail, password: ci, isNew: created });
  const mailResult = await sendMail({ to: mail, subject: mailMsg.subject, html: mailMsg.html, text: mailMsg.text });

  res.status(201).json({ ok: true, created, already: !!already, course: course.t, emailed: mailResult.sent });
});
