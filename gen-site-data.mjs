// Bundle todos los data-*.json en site-data.js como globales window.*
import fs from "node:fs";
import path from "node:path";
const ROOT = "C:/NEURA/Asociacion de Magistrados Judiciales del paraguay";

const map = {
  RESOLUCIONES: "data-resoluciones.json",
  CURSOS: "data-cursos.json",
  EVENTOS: "data-eventos.json",
  DEPORTES: "data-deportes.json",
  CDIRECTIVA: "data-comision-directiva.json",
  ESTATUTOS: "data-estatutos.json",
  EXPRESIDENTES: "data-expresidentes.json",
  GALERIA: "data-galeria.json",
};

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

const fixPath = (s) => {
  if (typeof s !== "string") return s;
  // Las paths quedaron como "uploads/..."; necesitamos que el HTML las resuelva desde amjp/, => "../uploads/..."
  if (s.startsWith("uploads/")) return "../" + s;
  return s;
};

// Llaves cuyo contenido es texto a decodificar
const TEXT_KEYS = new Set(["t","title","name","period","caption","intro","ph","label","date"]);

function walk(obj){
  if (Array.isArray(obj)) return obj.map(walk);
  if (obj && typeof obj === "object"){
    const out = {};
    for (const [k,v] of Object.entries(obj)){
      if (k === "url") continue; // descartar URLs externas
      if (k === "img" || k === "big" || k === "thumb" || k === "hero") out[k] = fixPath(v);
      else if (k === "body" && Array.isArray(v)) out[k] = v.map(decode);
      else if (TEXT_KEYS.has(k)) out[k] = decode(v);
      else out[k] = walk(v);
    }
    return out;
  }
  return obj;
}

const parts = [];
parts.push("// Datos completos del sitio AMJP — generado automáticamente.");
for (const [varName, file] of Object.entries(map)){
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
  const fixed = walk(data);
  parts.push(`window.${varName} = ${JSON.stringify(fixed)};`);
}
fs.writeFileSync(path.join(ROOT, "amjp", "site-data.js"), parts.join("\n\n"));
console.log("Wrote site-data.js");
