// Autenticación de alumnos del Aula Virtual — independiente de la sesión de admin.
// Reutiliza el hashing scrypt de auth.js; el alumno se identifica con req.session.studentId.
import { verifyPassword } from "./auth.js";
import { db } from "./db.js";

export function requireStudent(req, res, next){
  if (req.session && req.session.studentId) return next();
  res.status(401).json({ error: "No autenticado" });
}

export function authenticateStudent(email, password){
  const student = db.prepare("SELECT * FROM students WHERE email = ? AND active = 1").get((email || "").trim().toLowerCase());
  if (!student || !verifyPassword(password, student.password_hash)) return null;
  return student;
}
