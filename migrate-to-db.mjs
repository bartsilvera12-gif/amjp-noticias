// Migración única: importa todo el contenido scrapeado (manifest.json + bodies.json + data-*.json)
// a la base de datos SQLite del panel de administración. Se corre a mano una sola vez:
//   npm run migrate
// Es seguro volver a correrlo: si ya hay artículos migrados, se aborta sin duplicar nada
// (usar --force para borrar todo y volver a importar desde cero).
import fs from "node:fs";
import path from "node:path";
import { db } from "./server/db.js";
import { hashPassword } from "./server/auth.js";
import { decode } from "./lib/decode-entities.mjs";

const ROOT = "C:/NEURA/Asociacion de Magistrados Judiciales del paraguay";
const readJSON = (name) => JSON.parse(fs.readFileSync(path.join(ROOT, name), "utf8"));
const FORCE = process.argv.includes("--force");

// node:sqlite (DatabaseSync) no trae un helper .transaction() como better-sqlite3.
function withTransaction(fn){
  db.exec("BEGIN");
  try { fn(); db.exec("COMMIT"); }
  catch (e){ db.exec("ROLLBACK"); throw e; }
}

function alreadyMigrated(){
  const row = db.prepare("SELECT COUNT(*) AS n FROM articles").get();
  return row.n > 0;
}

function wipeAll(){
  console.log("--force: borrando datos existentes...");
  for (const t of ["articles", "gallery_photos", "gallery_albums", "cd_cells", "cd_rows", "cd_sections", "cd_meta", "estatutos", "expresidentes"]){
    db.exec(`DELETE FROM ${t};`);
  }
}

function migrateArticles(){
  const insert = db.prepare("INSERT INTO articles (id, section, d, t, img, body) VALUES (?, ?, ?, ?, ?, ?)");
  const insertMany = (rows, section, imgFn) => withTransaction(() => {
    for (const it of rows){
      const body = it.body || [];
      insert.run(it.id, section, it.d, decode(it.t), imgFn(it), JSON.stringify(body.map(decode)));
    }
  });

  // Noticias: manifest.json (img) + bodies.json (cuerpo, indexado por id)
  const manifest = readJSON("manifest.json");
  const bodies = readJSON("bodies.json");
  const news = manifest.map((it) => ({ ...it, body: bodies[String(it.id)] || [] }));
  insertMany(news, "noticias", (it) => "uploads/articulos/" + path.basename(it.img));
  console.log(`  noticias: ${news.length}`);

  // Resoluciones/Cursos/Eventos/Deportes: mismo formato, img ya apunta a uploads/<seccion>/...
  const sections = [
    ["resoluciones", "data-resoluciones.json"],
    ["cursos", "data-cursos.json"],
    ["eventos", "data-eventos.json"],
    ["deportes", "data-deportes.json"],
  ];
  for (const [section, file] of sections){
    const rows = readJSON(file);
    insertMany(rows, section, (it) => it.img);
    console.log(`  ${section}: ${rows.length}`);
  }
}

function migrateGaleria(){
  const albums = readJSON("data-galeria.json");
  const insertAlbum = db.prepare(
    "INSERT INTO gallery_albums (id, slug, title, thumb, date, intro, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const insertPhoto = db.prepare(
    "INSERT INTO gallery_photos (album_id, big, thumb, caption, sort_order) VALUES (?, ?, ?, ?, ?)"
  );
  withTransaction(() => {
    albums.forEach((alb, i) => {
      const info = insertAlbum.run(i + 1, alb.slug || null, decode(alb.title), alb.thumb || null, alb.date || null, decode(alb.intro || ""), i);
      (alb.photos || []).forEach((p, j) => {
        insertPhoto.run(info.lastInsertRowid, p.big, p.thumb || null, decode(p.caption || ""), j);
      });
    });
  });
  console.log(`  álbumes: ${albums.length}, fotos: ${albums.reduce((n, a) => n + (a.photos || []).length, 0)}`);
}

function migrateComisionDirectiva(){
  const cd = readJSON("data-comision-directiva.json");
  db.prepare("INSERT INTO cd_meta (id, hero) VALUES (1, ?)").run(cd.hero || null);
  const insertSection = db.prepare("INSERT INTO cd_sections (title, sort_order) VALUES (?, ?)");
  const insertRow = db.prepare("INSERT INTO cd_rows (section_id, sort_order) VALUES (?, ?)");
  const insertCell = db.prepare("INSERT INTO cd_cells (row_id, tag, rowspan, text, sort_order) VALUES (?, ?, ?, ?, ?)");
  withTransaction(() => {
    (cd.sections || []).forEach((sec, si) => {
      const secInfo = insertSection.run(decode(sec.title), si);
      (sec.rows || []).forEach((row, ri) => {
        const rowInfo = insertRow.run(secInfo.lastInsertRowid, ri);
        row.forEach((cell, ci) => {
          insertCell.run(rowInfo.lastInsertRowid, cell.tag || "td", cell.rowspan || 1, decode(cell.text || ""), ci);
        });
      });
    });
  });
  console.log(`  secciones: ${(cd.sections || []).length}`);
}

function migrateEstatutos(){
  const est = readJSON("data-estatutos.json");
  db.prepare("INSERT INTO estatutos (id, html) VALUES (1, ?)").run(est.html || "");
  console.log("  estatutos: 1 documento");
}

function migrateExpresidentes(){
  const list = readJSON("data-expresidentes.json");
  const insert = db.prepare(
    "INSERT INTO expresidentes (big, thumb, name, period, sort_order) VALUES (?, ?, ?, ?, ?)"
  );
  withTransaction(() => {
    list.forEach((p, i) => insert.run(p.big || null, p.thumb || null, decode(p.name), decode(p.period || ""), i));
  });
  console.log(`  expresidentes: ${list.length}`);
}

function seedAdminUser(){
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(process.env.ADMIN_USERNAME || "admin");
  if (existing){ console.log("  usuario admin ya existe, no se modifica."); return; }
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "amjp2026";
  db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(username, hashPassword(password));
  console.log(`  usuario admin creado: ${username} / ${password} (¡cambiar la contraseña después del primer login!)`);
}

if (alreadyMigrated() && !FORCE){
  console.log("Ya hay artículos en la base de datos. Usá 'node migrate-to-db.mjs --force' si querés borrar todo y reimportar.");
  process.exit(0);
}
if (FORCE) wipeAll();

console.log("Migrando artículos (noticias/resoluciones/cursos/eventos/deportes)...");
migrateArticles();
console.log("Migrando galería...");
migrateGaleria();
console.log("Migrando comisión directiva...");
migrateComisionDirectiva();
console.log("Migrando estatutos...");
migrateEstatutos();
console.log("Migrando expresidentes...");
migrateExpresidentes();
console.log("Verificando usuario administrador...");
seedAdminUser();
console.log("Migración completa.");
