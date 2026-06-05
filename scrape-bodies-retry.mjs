// Re-procesar las 29 notas que fallaron: extraer texto plano cuando no hay <p>
import fs from "node:fs";
import path from "node:path";

const ROOT = "C:/NEURA/Asociacion de Magistrados Judiciales del paraguay";
const items = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));
const bodies = JSON.parse(fs.readFileSync(path.join(ROOT, "bodies.json"), "utf8"));
const failures = JSON.parse(fs.readFileSync(path.join(ROOT, "bodies-failures.json"), "utf8"));
const byId = new Map(items.map(it=>[it.id, it]));

const ENT = { "&aacute;":"á","&eacute;":"é","&iacute;":"í","&oacute;":"ó","&uacute;":"ú",
  "&Aacute;":"Á","&Eacute;":"É","&Iacute;":"Í","&Oacute;":"Ó","&Uacute;":"Ú",
  "&ntilde;":"ñ","&Ntilde;":"Ñ","&uuml;":"ü","&Uuml;":"Ü","&amp;":"&","&quot;":'"',"&#39;":"'","&nbsp;":" ","&ordm;":"º","&ordf;":"ª","&laquo;":"«","&raquo;":"»","&iquest;":"¿","&iexcl;":"¡","&deg;":"°","&middot;":"·","&hellip;":"…","&ldquo;":"“","&rdquo;":"”","&lsquo;":"‘","&rsquo;":"’","&mdash;":"—","&ndash;":"–" };
const decode = s => s
  .replace(/&[a-zA-Z]+;/g, m => ENT[m] || m)
  .replace(/&#(\d+);/g, (_,n) => String.fromCharCode(+n));

function paragraphs(html){
  // Primero intentar con <p>...</p>
  const ps = [];
  const reP = /<p[^>]*>([\s\S]*?)<\/p>/g;
  let m;
  while ((m = reP.exec(html)) !== null){
    const t = decode(m[1].replace(/<br\s*\/?>/gi,"\n").replace(/<[^>]+>/g,"").replace(/[ \t]+/g," ").trim());
    if (t) ps.push(t);
  }
  if (ps.length) return ps;
  // Fallback: texto plano (con <br> como separador)
  const txt = decode(html.replace(/<br\s*\/?>/gi,"\n").replace(/<[^>]+>/g,"").trim());
  if (!txt) return [];
  return txt.split(/\n+/).map(s=>s.trim()).filter(Boolean);
}

function extractBody(html){
  const intro = (html.match(/<div class="news-intro">([\s\S]*?)<\/div>/) || [,""])[1].trim();
  const content = (html.match(/<div class="news-content">([\s\S]*?)<\/div>\s*<div class="news-source"/) || [,""])[1].trim();
  const out = [...paragraphs(intro), ...paragraphs(content)];
  return out.length ? out : null;
}

let recovered = 0, stillFailing = [];
for (const f of failures){
  const it = byId.get(f.id);
  if (!it) continue;
  try {
    const r = await fetch(it.url);
    const html = await r.text();
    const body = extractBody(html);
    if (body){ bodies[it.id] = body; recovered++; }
    else stillFailing.push({ id: it.id, url: it.url });
  } catch(e){
    stillFailing.push({ id: it.id, err: String(e.message||e) });
  }
}
console.log(`Recovered: ${recovered}. Still failing: ${stillFailing.length}`);
fs.writeFileSync(path.join(ROOT,"bodies.json"), JSON.stringify(bodies));
fs.writeFileSync(path.join(ROOT,"bodies-failures.json"), JSON.stringify(stillFailing, null, 2));
