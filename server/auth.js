// Autenticación simple (usuario/contraseña compartida) para el panel de administración.
// Hash de contraseña con scrypt (node:crypto, sin dependencias nativas de terceros).
import crypto from "node:crypto";
import cookieSession from "cookie-session";
import express from "express";
import { db } from "./db.js";

export function hashPassword(password){
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored){
  const [salt, hash] = (stored || "").split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const testBuf = crypto.scryptSync(password, salt, 64);
  if (hashBuf.length !== testBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, testBuf);
}

export function sessionMiddleware(){
  // Sesión basada en cookie firmada (sin store en memoria): funciona en serverless (Vercel).
  return cookieSession({
    name: "amjp_sess",
    keys: [process.env.SESSION_SECRET || "amjp-dev-secret-cambiar-en-produccion"],
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
  });
}

export function requireAuth(req, res, next){
  if (req.session && req.session.userId) return next();
  res.status(401).json({ error: "No autenticado" });
}

export const authRouter = express.Router();

authRouter.post("/login", express.json(), (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Faltan usuario o contraseña" });
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user || !verifyPassword(password, user.password_hash)){
    return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  }
  req.session.userId = user.id;
  req.session.username = user.username;
  res.json({ ok: true, username: user.username });
});

authRouter.post("/logout", (req, res) => {
  if (req.session){ req.session.userId = null; req.session.username = null; }
  res.json({ ok: true });
});

authRouter.get("/me", (req, res) => {
  if (req.session && req.session.userId) res.json({ authenticated: true, username: req.session.username });
  else res.json({ authenticated: false });
});
