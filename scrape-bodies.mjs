// Bajar cuerpo de cada nota desde amjp.org.py y guardarlo en bodies.json
import fs from "node:fs";
import path from "node:path";

const ROOT = "C:/NEURA/Asociacion de Magistrados Judiciales del paraguay";
const items = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));

const ENT = { "&aacute;":"á","&eacute;":"é","&iacute;":"í","&oacute;":"ó","&uacute;":"ú",
  "&Aacute;":"Á","&Eacute;":"É","&Iacute;":"Í","&Oacute;":"Ó","&Uacute;":"Ú",
  "&ntilde;":"ñ","&Ntilde;":"Ñ","&uuml;":"ü","&Uuml;":"Ü","&amp;":"&","&quot;":'"',"&#39;":"'","&nbsp;":" ","&ordm;":"º","&ordf;":"ª","&laquo;":"«","&raquo;":"»","&iquest;":"¿","&iexcl;":"¡","&deg;":"°","&middot;":"·","&hellip;":"…","&ldquo;":"“","&rdquo;":"”","&lsquo;":"‘","&rsquo;":"’","&mdash;":"—","&ndash;":"–" };
const decode = s => s
  .replace(/&[a-zA-Z]+;/g, m => ENT[m] || m)
  .replace(/&#(\d+);/g, (_,n) => String.fromCharCode(+n));

// Extraer paragraphs de <div class="news-content"> y opcionalmente <div class="news-intro">
function extractBody(html){
  const intro = (html.match(/<div class="news-intro">([\s\S]*?)<\/div>/) || [,""])[1].trim();
  const content = (html.match(/<div class="news-content">([\s\S]*?)<\/div>\s*<div class="news-source"/) || [,""])[1].trim();
  const full = (intro ? intro + "\n" : "") + content;
  if (!full) return null;
  // Sacar <p> en orden, decodificar, limpiar tags internos básicos.
  const paras = [];
  const reP = /<p[^>]*>([\s\S]*?)<\/p>/g;
  let m;
  while ((m = reP.exec(full)) !== null){
    let t = m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    t = decode(t);
    if (t) paras.push(t);
  }
  return paras.length ? paras : null;
}

const CONC = 12;
let done = 0, failed = 0;
const bodies = {};
const failures = [];

async function get(it){
  try {
    const r = await fetch(it.url);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const html = await r.text();
    const body = extractBody(html);
    if (body) bodies[it.id] = body;
    else failures.push({ id: it.id, reason: "no body parsed" });
  } catch(e){
    failed++;
    failures.push({ id: it.id, err: String(e.message || e) });
  }
  done++;
  if (done % 25 === 0) console.log(`  ${done}/${items.length}`);
}

async function runPool(tasks, n){
  const q = tasks.slice();
  await Promise.all(Array.from({length:n}, async () => {
    while (q.length) await get(q.shift());
  }));
}

console.log(`Fetching ${items.length} article bodies with ${CONC} concurrent...`);
await runPool(items, CONC);
console.log(`Done. Bodies: ${Object.keys(bodies).length}. Failed/empty: ${failures.length}`);
fs.writeFileSync(path.join(ROOT, "bodies.json"), JSON.stringify(bodies));
if (failures.length) fs.writeFileSync(path.join(ROOT, "bodies-failures.json"), JSON.stringify(failures, null, 2));
