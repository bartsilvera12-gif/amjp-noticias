// Punto de entrada serverless para Vercel: expone la app Express como función.
// Vercel sirve los archivos estáticos por CDN; esta función atiende /api/*.
import app from "../server/app.js";

export default app;
