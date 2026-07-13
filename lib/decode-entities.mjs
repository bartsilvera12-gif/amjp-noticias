// Utilidades compartidas de decodificación de entidades HTML y arreglo de rutas de imagen.
// Usadas por los scripts gen-*.mjs, migrate-to-db.mjs y server/regenerate.mjs para que
// todos generen el mismo formato de texto/paths a partir de los datos scrapeados.

export const ENT = {
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

export const decode = (s) => typeof s === "string"
  ? s.replace(/&[a-zA-Z]+;/g, m => ENT[m] || m).replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
  : s;

// Las paths quedaron como "uploads/..."; hace falta que el HTML las resuelva desde amjp/, => "../uploads/..."
export const fixPath = (s) => {
  if (typeof s !== "string") return s;
  if (s.startsWith("uploads/")) return "../" + s;
  return s;
};

// Llaves cuyo contenido es texto a decodificar, al recorrer un objeto genérico.
export const TEXT_KEYS = new Set(["t", "title", "name", "period", "caption", "intro", "ph", "label", "date"]);

// Recorre recursivamente un objeto/array decodificando entidades en TEXT_KEYS,
// arreglando paths de imagen (img/big/thumb/hero) y descartando URLs externas.
export function walk(obj){
  if (Array.isArray(obj)) return obj.map(walk);
  if (obj && typeof obj === "object"){
    const out = {};
    for (const [k, v] of Object.entries(obj)){
      if (k === "url") continue;
      if (k === "img" || k === "big" || k === "thumb" || k === "hero") out[k] = fixPath(v);
      else if (k === "body" && Array.isArray(v)) out[k] = v.map(decode);
      else if (TEXT_KEYS.has(k)) out[k] = decode(v);
      else out[k] = walk(v);
    }
    return out;
  }
  return obj;
}
