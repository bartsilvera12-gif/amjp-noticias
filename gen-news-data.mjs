import fs from "node:fs";
import path from "node:path";
const ROOT = "C:/NEURA/Asociacion de Magistrados Judiciales del paraguay";
const items = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));
const bodies = JSON.parse(fs.readFileSync(path.join(ROOT, "bodies.json"), "utf8"));

// Decoder de entidades HTML que el scrape original no convirtió.
const ENT = {
  "&ndash;":"–","&mdash;":"—","&ldquo;":"“","&rdquo;":"”","&lsquo;":"‘","&rsquo;":"’",
  "&hellip;":"…","&deg;":"°","&ordm;":"º","&ordf;":"ª","&middot;":"·",
  "&laquo;":"«","&raquo;":"»","&iquest;":"¿","&iexcl;":"¡",
  "&ccedil;":"ç","&Ccedil;":"Ç","&atilde;":"ã","&Atilde;":"Ã",
  "&otilde;":"õ","&Otilde;":"Õ","&euro;":"€",
  "&aacute;":"á","&eacute;":"é","&iacute;":"í","&oacute;":"ó","&uacute;":"ú",
  "&Aacute;":"Á","&Eacute;":"É","&Iacute;":"Í","&Oacute;":"Ó","&Uacute;":"Ú",
  "&ntilde;":"ñ","&Ntilde;":"Ñ","&uuml;":"ü","&Uuml;":"Ü",
  "&amp;":"&","&quot;":'"',"&apos;":"'","&nbsp;":" ",
};
const decode = s => typeof s === "string"
  ? s.replace(/&[a-zA-Z]+;/g, m => ENT[m] || m).replace(/&#(\d+);/g, (_,n)=>String.fromCharCode(+n))
  : s;
items.forEach(it => { it.t = decode(it.t); });
for (const id of Object.keys(bodies)){ bodies[id] = bodies[id].map(decode); }

// Sort: most recent first, then by id desc.
items.sort((a, b) => b.d.localeCompare(a.d) || b.id - a.id);

const J = v => JSON.stringify(v); // escape correcto para JS literal de string
const lines = items.map(it => {
  const img = "../uploads/articulos/" + path.basename(it.img);
  const body = bodies[it.id] || [];
  return `  { id: ${it.id}, d: ${J(it.d)}, t: ${J(it.t)}, img: ${J(img)}, body: ${J(body)} }`;
});

const out = `// Noticias reales de la AMJP (amjp.org.py/noticias) — preservadas íntegras.
// Cada item: { id, d: fecha ISO, t: título, img: ruta a foto destacada }.
window.NEWS = [
${lines.join(",\n")}
];
`;
fs.writeFileSync(path.join(ROOT, "amjp", "news-data.js"), out);
console.log(`Wrote ${items.length} items to news-data.js`);
