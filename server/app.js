// Construcción de la app Express (reutilizable): la usa el arranque local
// (server.js) y la función serverless de Vercel (api/index.js).
import path from "node:path";
import { fileURLToPath } from "node:url";
try { process.loadEnvFile(); } catch { /* .env opcional en desarrollo */ }

import express from "express";
import { sessionMiddleware, authRouter, requireAuth } from "./auth.js";
import { articlesRouter } from "./routes/articles.js";
import { uploadRouter } from "./routes/upload.js";
import { galleryRouter } from "./routes/gallery.js";
import { miscRouter } from "./routes/misc.js";
import { beneficiosRouter } from "./routes/beneficios.js";
import { publicContactRouter } from "./routes/public-contact.js";
import { submissionsRouter } from "./routes/submissions.js";
import { studentsRouter } from "./routes/students.js";
import { lmsRouter } from "./routes/lms.js";
import { videoUploadRouter } from "./routes/video-upload.js";
import { aulaRouter } from "./routes/aula.js";
import { UPLOADS_DIR, REPO_UPLOADS } from "./paths.js";
import "./db.js"; // asegura que el esquema exista al arrancar

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const app = express();
app.set("trust proxy", 1); // detrás del proxy de Vercel/host
app.use(sessionMiddleware());

// --- Sitio público (en local lo sirve Express; en Vercel lo sirve el CDN) ---
app.get("/", (req, res) => res.sendFile(path.join(ROOT, "index.html")));
app.use("/amjp", express.static(path.join(ROOT, "amjp")));
// Archivos subidos: primero el volumen (uploads nuevos), luego las imágenes
// históricas incluidas en el repo como respaldo. Si son la misma carpeta, no molesta.
app.use("/uploads", express.static(UPLOADS_DIR));
if (REPO_UPLOADS !== UPLOADS_DIR) app.use("/uploads", express.static(REPO_UPLOADS));
app.get("/admin", (req, res) => res.redirect("/amjp/admin/"));

// --- API del panel ---
app.use("/api", authRouter);
app.use("/api/public", publicContactRouter); // sin login: lo llaman los formularios del sitio — va antes que cualquier requireAuth
app.use("/api/aula", aulaRouter); // Aula Virtual: login del alumno + área de socios (se auto-protege por dentro)
app.use("/api/articles", requireAuth, articlesRouter);
app.use("/api/upload", requireAuth, uploadRouter);
app.use("/api/video", requireAuth, videoUploadRouter);
app.use("/api/gallery", requireAuth, galleryRouter);
app.use("/api/beneficios", requireAuth, beneficiosRouter);
app.use("/api/submissions", requireAuth, submissionsRouter);
app.use("/api/students", requireAuth, studentsRouter);
app.use("/api/lms", requireAuth, lmsRouter);
app.use("/api", requireAuth, miscRouter); // mount genérico: siempre al final para no tapar rutas más específicas

export default app;
