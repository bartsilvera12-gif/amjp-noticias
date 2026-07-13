// Bundle todos los data-*.json en site-data.js como globales window.*
import fs from "node:fs";
import path from "node:path";
import { walk } from "./lib/decode-entities.mjs";
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

const parts = [];
parts.push("// Datos completos del sitio AMJP — generado automáticamente.");
for (const [varName, file] of Object.entries(map)){
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
  const fixed = walk(data);
  parts.push(`window.${varName} = ${JSON.stringify(fixed)};`);
}
fs.writeFileSync(path.join(ROOT, "amjp", "site-data.js"), parts.join("\n\n"));
console.log("Wrote site-data.js");
