// Bajar HTML de cada sección de amjp.org.py para inspeccionarlas
import fs from "node:fs";
import path from "node:path";

const ROOT = "C:/NEURA/Asociacion de Magistrados Judiciales del paraguay";
const OUT = path.join(ROOT, "raw-sections");
fs.mkdirSync(OUT, { recursive: true });

const SECTIONS = [
  ["home", ""],
  ["comision-directiva", "asociacion/comision-directiva"],
  ["estatutos", "asociacion/estatutos"],
  ["expresidentes", "asociacion/galeria-de-expresidentes"],
  ["resoluciones", "resoluciones"],
  ["cursos", "socios/cursos"],
  ["eventos", "socios/eventos"],
  ["deportes", "socios/deportes"],
  ["beneficios", "socios/beneficios"],
  ["creditos", "socios/creditos"],
  ["actualizacion-datos", "socios/actualizacion-de-datos"],
  ["inscripcion", "inscripcion"],
  ["galeria", "galeria-de-imagenes"],
  ["contacto", "contacto"],
];

const BASE = "https://www.amjp.org.py/";
let done = 0;
await Promise.all(SECTIONS.map(async ([name, href]) => {
  const r = await fetch(BASE + href);
  const html = await r.text();
  fs.writeFileSync(path.join(OUT, name + ".html"), html);
  done++;
  console.log(`  ${name}: ${html.length} bytes`);
}));
console.log(`Saved ${done} sections to raw-sections/`);
