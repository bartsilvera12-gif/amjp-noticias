// Extraer el bloque <div class="content"> de cada sección (núcleo de la página)
import fs from "node:fs";
import path from "node:path";
const ROOT = "C:/NEURA/Asociacion de Magistrados Judiciales del paraguay";
const DIR = path.join(ROOT, "raw-sections");

function extractMain(html){
  // El contenido vivo viene en <div class="content {name}"> dentro de #main o similar.
  // Buscar el primer <div class="content NOMBRE">
  const m = html.match(/<div class="content [a-zA-Z-]+">([\s\S]*?)<\/body>/);
  if (!m) return null;
  return m[1].slice(0, 4000);
}

for (const file of fs.readdirSync(DIR)){
  if (!file.endsWith(".html")) continue;
  const html = fs.readFileSync(path.join(DIR, file), "utf8");
  // Quitar <style>...</style> y <script>...</script>
  const clean = html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "");
  const main = extractMain(clean) || clean.match(/<div class="content[^"]*">([\s\S]*?)$/)?.[1]?.slice(0,4000);
  console.log("\n========== " + file + " ==========");
  console.log((main || "(no match)").trim().slice(0,2500));
}
