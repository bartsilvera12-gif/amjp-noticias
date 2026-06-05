// Scrape AMJP noticias: parse HTML, build manifest, download all images.
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";

const ROOT = "C:/NEURA/Asociacion de Magistrados Judiciales del paraguay";
const HTML = fs.readFileSync(path.join(ROOT, "noticias-raw.html"), "utf8");
const OUT_DIR = path.join(ROOT, "uploads", "articulos");
fs.mkdirSync(OUT_DIR, { recursive: true });

// Decode HTML entities used in this page.
const ENT = { "&aacute;":"á","&eacute;":"é","&iacute;":"í","&oacute;":"ó","&uacute;":"ú",
  "&Aacute;":"Á","&Eacute;":"É","&Iacute;":"Í","&Oacute;":"Ó","&Uacute;":"Ú",
  "&ntilde;":"ñ","&Ntilde;":"Ñ","&uuml;":"ü","&Uuml;":"Ü","&amp;":"&","&quot;":'"',"&#39;":"'","&nbsp;":" " };
const decode = s => s.replace(/&[a-zA-Z]+;|&#\d+;/g, m => ENT[m] || m);

// Each news-item li.
const reItem = /<li class="news-item[^"]*"><a href="(noticias\/(\d{4}-\d{2}-\d{2})\/(\d+)\/[a-z0-9-]+)">\s*<div class="news-img-mini" style="background-image:url\('([^']+)'\);[^"]*">[\s\S]*?<h2>([\s\S]*?)<\/h2>/g;

const items = [];
let m;
while ((m = reItem.exec(HTML)) !== null) {
  const [, url, date, id, img, title] = m;
  items.push({
    id: Number(id),
    d: date,
    t: decode(title).trim(),
    img: img,           // ej: archivos/articulos/foo.jpg
    url: "https://www.amjp.org.py/" + url,
  });
}
console.log(`Parsed ${items.length} items`);

// Write manifest.
fs.writeFileSync(path.join(ROOT, "manifest.json"), JSON.stringify(items, null, 2));

// Download images with concurrency.
const CONC = 10;
let done = 0, failed = 0;
const failures = [];

async function dl(it) {
  const filename = path.basename(it.img);
  const dest = path.join(OUT_DIR, filename);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) { done++; return; }
  const url = "https://www.amjp.org.py/" + it.img;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error("HTTP " + r.status);
    await pipeline(r.body, fs.createWriteStream(dest));
    done++;
    if (done % 25 === 0) console.log(`  ${done}/${items.length}`);
  } catch (e) {
    failed++;
    failures.push({ id: it.id, img: it.img, err: String(e.message || e) });
    try { fs.unlinkSync(dest); } catch {}
  }
}

async function runPool(tasks, n) {
  const queue = tasks.slice();
  await Promise.all(Array.from({ length: n }, async () => {
    while (queue.length) await dl(queue.shift());
  }));
}

console.log(`Downloading ${items.length} images with ${CONC} concurrent...`);
await runPool(items, CONC);
console.log(`Done. ${done} ok, ${failed} failed.`);
if (failures.length) fs.writeFileSync(path.join(ROOT, "failures.json"), JSON.stringify(failures, null, 2));
