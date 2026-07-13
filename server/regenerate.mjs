// Reescribe amjp/news-data.js y amjp/site-data.js a partir de la base de datos.
// Se llama automáticamente después de cada alta/edición/baja hecha desde el panel,
// para que el sitio público (100% estático) siempre refleje el contenido más reciente.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";
import { fixPath } from "../lib/decode-entities.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const J = (v) => JSON.stringify(v);

export function regenerateNews(){
  const rows = db.prepare("SELECT * FROM articles WHERE section = 'noticias' ORDER BY d DESC, id DESC").all();
  const lines = rows.map((r) => {
    const img = r.img ? "../uploads/articulos/" + path.basename(r.img) : "";
    const body = JSON.parse(r.body || "[]");
    return `  { id: ${r.id}, d: ${J(r.d)}, t: ${J(r.t)}, img: ${J(img)}, body: ${J(body)} }`;
  });
  const out = `// Noticias reales de la AMJP (amjp.org.py/noticias) — preservadas íntegras.
// Cada item: { id, d: fecha ISO, t: título, img: ruta a foto destacada }.
// Generado automáticamente por el panel de administración — no editar a mano.
window.NEWS = [
${lines.join(",\n")}
];
`;
  fs.writeFileSync(path.join(ROOT, "amjp", "news-data.js"), out);
  return rows.length;
}

const ARTICLE_SECTIONS = [
  ["RESOLUCIONES", "resoluciones"],
  ["CURSOS", "cursos"],
  ["EVENTOS", "eventos"],
  ["DEPORTES", "deportes"],
];

function buildArticlesFor(section){
  const rows = db.prepare("SELECT * FROM articles WHERE section = ? ORDER BY d DESC, id DESC").all(section);
  return rows.map((r) => ({ id: r.id, d: r.d, t: r.t, img: fixPath(r.img || ""), body: JSON.parse(r.body || "[]") }));
}

function buildComisionDirectiva(){
  const meta = db.prepare("SELECT * FROM cd_meta WHERE id = 1").get();
  const sections = db.prepare("SELECT * FROM cd_sections ORDER BY sort_order").all();
  const out = { hero: fixPath((meta && meta.hero) || ""), sections: [] };
  for (const sec of sections){
    const rows = db.prepare("SELECT * FROM cd_rows WHERE section_id = ? ORDER BY sort_order").all(sec.id);
    const rowsOut = rows.map((row) => {
      const cells = db.prepare("SELECT * FROM cd_cells WHERE row_id = ? ORDER BY sort_order").all(row.id);
      return cells.map((c) => ({ tag: c.tag, rowspan: c.rowspan, text: c.text }));
    });
    out.sections.push({ title: sec.title, rows: rowsOut });
  }
  return out;
}

function buildEstatutos(){
  const row = db.prepare("SELECT * FROM estatutos WHERE id = 1").get();
  return { html: (row && row.html) || "" };
}

function buildExpresidentes(){
  const rows = db.prepare("SELECT * FROM expresidentes ORDER BY sort_order").all();
  return rows.map((p) => ({ big: fixPath(p.big || ""), thumb: fixPath(p.thumb || ""), name: p.name, period: p.period || "" }));
}

function buildGaleria(){
  const albums = db.prepare("SELECT * FROM gallery_albums ORDER BY sort_order").all();
  return albums.map((alb) => {
    const photos = db.prepare("SELECT * FROM gallery_photos WHERE album_id = ? ORDER BY sort_order").all(alb.id);
    return {
      slug: alb.slug || "",
      title: alb.title,
      thumb: fixPath(alb.thumb || ""),
      date: alb.date || "",
      intro: alb.intro || "",
      photos: photos.map((p) => ({ big: fixPath(p.big), thumb: fixPath(p.thumb || ""), caption: p.caption || "" })),
    };
  });
}

function buildBeneficios(){
  const rows = db.prepare("SELECT * FROM beneficios ORDER BY sort_order").all();
  return rows.map((b) => ({ id: b.id, title: b.title, href: b.href || null, desc: b.desc || "", active: !!b.active }));
}

// Reescribe amjp/site-data.js completo (todas las secciones) a partir de la base de datos.
export function regenerateSiteData(){
  const parts = ["// Datos completos del sitio AMJP — generado automáticamente por el panel de administración."];
  for (const [varName, section] of ARTICLE_SECTIONS){
    parts.push(`window.${varName} = ${J(buildArticlesFor(section))};`);
  }
  parts.push(`window.CDIRECTIVA = ${J(buildComisionDirectiva())};`);
  parts.push(`window.ESTATUTOS = ${J(buildEstatutos())};`);
  parts.push(`window.EXPRESIDENTES = ${J(buildExpresidentes())};`);
  parts.push(`window.GALERIA = ${J(buildGaleria())};`);
  parts.push(`window.BENEFICIOS = ${J(buildBeneficios())};`);
  fs.writeFileSync(path.join(ROOT, "amjp", "site-data.js"), parts.join("\n\n") + "\n");
}
