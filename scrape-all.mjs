// Scraper unificado: secciones news-list (resoluciones/cursos/eventos/deportes),
// comision-directiva, estatutos, expresidentes, galería.
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";

const ROOT = "C:/NEURA/Asociacion de Magistrados Judiciales del paraguay";
const BASE = "https://www.amjp.org.py/";
const UP_ART = path.join(ROOT, "uploads", "articulos");
const UP_RES = path.join(ROOT, "uploads", "resoluciones");
const UP_GAL = path.join(ROOT, "uploads", "galeria");
fs.mkdirSync(UP_ART, { recursive: true });
fs.mkdirSync(UP_RES, { recursive: true });
fs.mkdirSync(UP_GAL, { recursive: true });
fs.mkdirSync(path.join(UP_GAL, "200"), { recursive: true });

const ENT = { "&aacute;":"á","&eacute;":"é","&iacute;":"í","&oacute;":"ó","&uacute;":"ú",
  "&Aacute;":"Á","&Eacute;":"É","&Iacute;":"Í","&Oacute;":"Ó","&Uacute;":"Ú",
  "&ntilde;":"ñ","&Ntilde;":"Ñ","&uuml;":"ü","&Uuml;":"Ü","&amp;":"&","&quot;":'"',"&#39;":"'","&nbsp;":" ","&ordm;":"º","&ordf;":"ª","&laquo;":"«","&raquo;":"»","&iquest;":"¿","&iexcl;":"¡","&deg;":"°","&middot;":"·","&hellip;":"…","&ldquo;":"“","&rdquo;":"”","&lsquo;":"‘","&rsquo;":"’","&mdash;":"—","&ndash;":"–" };
const decode = s => (s||"")
  .replace(/&[a-zA-Z]+;/g, m => ENT[m] || m)
  .replace(/&#(\d+);/g, (_,n) => String.fromCharCode(+n));
const strip = s => decode((s||"").replace(/<br\s*\/?>/gi," ").replace(/<[^>]+>/g,"")).replace(/\s+/g," ").trim();

async function dl(url, dest){
  if (fs.existsSync(dest) && fs.statSync(dest).size>0) return true;
  try { const r = await fetch(url); if (!r.ok) return false;
    await pipeline(r.body, fs.createWriteStream(dest)); return true;
  } catch { try{fs.unlinkSync(dest);}catch{} return false; }
}
async function pool(tasks, n, fn){
  const q = tasks.slice(); let i=0;
  await Promise.all(Array.from({length:n}, async () => {
    while (q.length){ const t = q.shift(); await fn(t, ++i, tasks.length); }
  }));
}

/* ---------------- news-list secciones ---------------- */
function parseNewsList(html, urlPrefix){
  // <li class="news-item"><a href="URL"><div class="news-img-mini" style="background-image:url('IMG');..."><div class="news-text">...<h2>TITLE</h2>
  const re = /<li class="news-item[^"]*"><a href="(\S+?)"><div class="news-img-mini" style="background-image:url\('([^']+)'\)[^"]*"[^>]*>[\s\S]*?<h2>([\s\S]*?)<\/h2>/g;
  const items = [];
  let m;
  while ((m = re.exec(html)) !== null){
    const href = m[1];
    const img = m[2];
    const title = strip(m[3]);
    const mIds = href.match(new RegExp(`${urlPrefix}/(\\d{4}-\\d{2}-\\d{2})/(\\d+)/`));
    if (!mIds) continue;
    items.push({ id: Number(mIds[2]), d: mIds[1], t: title, img, url: BASE + href });
  }
  return items;
}

function extractArticleBody(html){
  const intro = (html.match(/<div class="news-intro">([\s\S]*?)<\/div>/) || [,""])[1];
  const content = (html.match(/<div class="news-content">([\s\S]*?)<\/div>\s*<div class="news-source"/) || [,""])[1];
  const out = [];
  for (const block of [intro, content]){
    const ps = [...block.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(m=>strip(m[1])).filter(Boolean);
    if (ps.length) out.push(...ps);
    else { const t = strip(block); if (t) out.push(t); }
  }
  return out;
}

async function scrapeNewsListSection({ name, list_url, urlPrefix, uploads }){
  console.log(`\n[${name}] downloading list...`);
  const html = await (await fetch(BASE + list_url)).text();
  const items = parseNewsList(html, urlPrefix);
  console.log(`[${name}] ${items.length} items`);

  // Bodies
  await pool(items, 12, async (it, i, n)=>{
    try {
      const r = await fetch(it.url);
      const h = await r.text();
      it.body = extractArticleBody(h);
    } catch { it.body = []; }
    if (i % 25 === 0) console.log(`  [${name}] bodies ${i}/${n}`);
  });

  // Images
  await pool(items, 10, async (it)=>{
    const filename = path.basename(it.img);
    const dest = path.join(uploads, filename);
    await dl(BASE + it.img, dest);
    it.img = path.relative(ROOT, dest).replace(/\\/g,"/");
  });

  fs.writeFileSync(path.join(ROOT, `data-${name}.json`), JSON.stringify(items, null, 2));
  console.log(`[${name}] done.`);
}

/* ---------------- comision-directiva ---------------- */
async function scrapeComisionDirectiva(){
  console.log(`\n[comision-directiva] parsing...`);
  const html = fs.readFileSync(path.join(ROOT, "raw-sections", "comision-directiva.html"), "utf8");
  // Imagen
  const imgM = html.match(/<img[^>]+src="(http[^"]+galeria\/[^"]+comision-directiva[^"]+)"/);
  const heroSrc = imgM ? imgM[1] : null;
  let heroLocal = null;
  if (heroSrc){
    const dest = path.join(ROOT, "uploads", "secciones", path.basename(heroSrc));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    await dl(heroSrc, dest);
    heroLocal = path.relative(ROOT, dest).replace(/\\/g,"/");
  }
  // Tablas: extraer cada <h2>+<table>
  const out = { hero: heroLocal, sections: [] };
  const reSec = /<h2>([^<]+)<\/h2>\s*<table class="tabular">\s*<tbody>([\s\S]*?)<\/tbody>\s*<\/table>/g;
  let m;
  while ((m = reSec.exec(html)) !== null){
    const title = decode(m[1]).trim();
    const tbody = m[2];
    // Parse <tr>...<th>/<td>...
    const rows = [];
    const reTr = /<tr>([\s\S]*?)<\/tr>/g;
    let tm;
    while ((tm = reTr.exec(tbody)) !== null){
      const cells = [...tm[1].matchAll(/<(t[hd])([^>]*)>([\s\S]*?)<\/\1>/g)].map(c=>{
        const span = (c[2].match(/rowspan="(\d+)"/) || [,1])[1];
        return { tag: c[1], rowspan: Number(span)||1, text: strip(c[3]) };
      });
      rows.push(cells);
    }
    out.sections.push({ title, rows });
  }
  fs.writeFileSync(path.join(ROOT, "data-comision-directiva.json"), JSON.stringify(out, null, 2));
  console.log(`[comision-directiva] ${out.sections.length} sections`);
}

/* ---------------- estatutos ---------------- */
async function scrapeEstatutos(){
  console.log(`\n[estatutos] parsing...`);
  const html = fs.readFileSync(path.join(ROOT, "raw-sections", "estatutos.html"), "utf8");
  const m = html.match(/<div class="constitution">([\s\S]*?)<\/div>\s*<div class="clear">/);
  if (!m){ console.log(`[estatutos] no match!`); return; }
  // Mantener el HTML interno (con <p>, <strong>, etc.) pero limpio.
  let body = m[1];
  // Quitar comentarios HTML
  body = body.replace(/<!--[\s\S]*?-->/g, "");
  // Decodificar entidades
  body = decode(body);
  fs.writeFileSync(path.join(ROOT, "data-estatutos.json"), JSON.stringify({ html: body.trim() }, null, 2));
  console.log(`[estatutos] ${body.length} chars`);
}

/* ---------------- expresidentes ---------------- */
async function scrapeExpresidentes(){
  console.log(`\n[expresidentes] parsing...`);
  const html = fs.readFileSync(path.join(ROOT, "raw-sections", "expresidentes.html"), "utf8");
  // <a class="lbx block" data-bigpic="archivos/galeria/X.jpg" ... title="Nombre<br/>Periodo"><img src="archivos/galeria/200/X.jpg" alt="Nombre" title="Periodo"/></a>
  const re = /<a class="lbx block" data-bigpic="([^"]+)"[^>]+title="([^"]+)"[^>]*>\s*<img src="([^"]+)"[^>]*alt="([^"]+)"[^>]*title="([^"]*)"/g;
  const items = [];
  let m;
  while ((m = re.exec(html)) !== null){
    items.push({
      big: m[1], thumb: m[3],
      name: decode(m[4]).trim(),
      period: decode(m[5]).trim(),
    });
  }
  console.log(`[expresidentes] ${items.length} photos`);
  // Bajar imágenes (big + thumb)
  const downloads = [];
  for (const it of items){
    downloads.push({ url: it.big, dest: path.join(UP_GAL, path.basename(it.big)) });
    downloads.push({ url: it.thumb, dest: path.join(UP_GAL, "200", path.basename(it.thumb)) });
  }
  await pool(downloads, 12, async (t)=>{ await dl(BASE + t.url, t.dest); });
  // Reescribir paths a relativos
  for (const it of items){
    it.big = "uploads/galeria/" + path.basename(it.big);
    it.thumb = "uploads/galeria/200/" + path.basename(it.thumb);
  }
  fs.writeFileSync(path.join(ROOT, "data-expresidentes.json"), JSON.stringify(items, null, 2));
}

/* ---------------- galeria (lista de álbumes) ---------------- */
async function scrapeGaleria(){
  console.log(`\n[galeria] parsing list...`);
  const listHtml = fs.readFileSync(path.join(ROOT, "raw-sections", "galeria.html"), "utf8");
  // <article class="gallery-item"><a class="sld" href="galeria-de-imagenes/YEAR/SLUG" title="TITLE"><img src="archivos/galeria/200/X.jpg"...
  const re = /<article class="gallery-item"><a class="sld" href="(galeria-de-imagenes\/[^"]+)" title="([^"]+)"><img src="([^"]+)"[^>]*>[\s\S]*?<div [^>]*>(\d{2}\/\d{2}\/\d{4})<\/div>/g;
  const albums = [];
  let m;
  while ((m = re.exec(listHtml)) !== null){
    albums.push({
      slug: m[1].replace(/^galeria-de-imagenes\//,""),
      title: decode(m[2]).trim(),
      thumb: m[3],
      date: m[4],
      url: BASE + m[1],
    });
  }
  console.log(`[galeria] ${albums.length} álbumes`);

  // Para cada álbum, bajar HTML y extraer fotos
  for (const alb of albums){
    try {
      const r = await fetch(alb.url);
      const h = await r.text();
      // Misma estructura que expresidentes
      const photos = [];
      const re2 = /<a class="lbx[^"]*" data-bigpic="([^"]+)"[^>]*title="([^"]*)"[^>]*>\s*<img src="([^"]+)"/g;
      let pm;
      while ((pm = re2.exec(h)) !== null){
        photos.push({ big: pm[1], thumb: pm[3], caption: decode(pm[2]).trim() });
      }
      alb.photos = photos;
      // Intro/descripción opcional
      const introM = h.match(/<div class="content pad-1">[\s\S]*?<h1[^>]*>[\s\S]*?<\/h1>([\s\S]*?)<div class="gallery">/);
      alb.intro = introM ? strip(introM[1]) : "";
      console.log(`  ${alb.slug}: ${photos.length} fotos`);
    } catch(e){ alb.photos = []; console.log(`  FAIL ${alb.slug}: ${e.message}`); }
  }

  // Bajar todas las imágenes
  const downloads = [];
  for (const alb of albums){
    downloads.push({ url: alb.thumb, dest: path.join(UP_GAL, "200", path.basename(alb.thumb)) });
    for (const p of (alb.photos||[])){
      downloads.push({ url: p.big, dest: path.join(UP_GAL, path.basename(p.big)) });
      downloads.push({ url: p.thumb, dest: path.join(UP_GAL, "200", path.basename(p.thumb)) });
    }
  }
  console.log(`[galeria] downloading ${downloads.length} files...`);
  await pool(downloads, 12, async (t, i, n)=>{
    await dl(BASE + t.url, t.dest);
    if (i % 50 === 0) console.log(`  ${i}/${n}`);
  });

  // Reescribir paths
  for (const alb of albums){
    alb.thumb = "uploads/galeria/200/" + path.basename(alb.thumb);
    for (const p of (alb.photos||[])){
      p.big = "uploads/galeria/" + path.basename(p.big);
      p.thumb = "uploads/galeria/200/" + path.basename(p.thumb);
    }
  }
  fs.writeFileSync(path.join(ROOT, "data-galeria.json"), JSON.stringify(albums, null, 2));
}

/* ---------------- main ---------------- */
const target = process.argv[2] || "all";
if (target === "news" || target === "all"){
  await scrapeNewsListSection({ name:"resoluciones", list_url:"resoluciones", urlPrefix:"resoluciones", uploads: UP_RES });
  await scrapeNewsListSection({ name:"cursos", list_url:"socios/cursos", urlPrefix:"socios/cursos", uploads: UP_ART });
  await scrapeNewsListSection({ name:"eventos", list_url:"socios/eventos", urlPrefix:"socios/eventos", uploads: UP_ART });
  await scrapeNewsListSection({ name:"deportes", list_url:"socios/deportes", urlPrefix:"socios/deportes", uploads: UP_ART });
}
if (target === "cd" || target === "all") await scrapeComisionDirectiva();
if (target === "est" || target === "all") await scrapeEstatutos();
if (target === "expres" || target === "all") await scrapeExpresidentes();
if (target === "gal" || target === "all") await scrapeGaleria();
console.log("\nDone.");
