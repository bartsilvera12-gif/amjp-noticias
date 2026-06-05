<p align="center">
  <img src="amjp/logo-amjp.png" alt="Escudo AMJP" width="128" height="128"/>
</p>

<h1 align="center">AMJP — Rediseño Web</h1>

<p align="center">
  <em>Asociación de Magistrados Judiciales del Paraguay</em>
</p>

---

Rediseño completo del sitio de la **Asociación de Magistrados Judiciales del Paraguay** ([amjp.org.py](https://www.amjp.org.py/)), implementado como **single-page app** con React + Babel en navegador, sin build step.

## Estructura

```
index.html                  ← Redirect a amjp/ (raíz para Vercel/GitHub Pages)
amjp/
  index.html               ← Entry point + estilos (CSS)
  app.jsx                  ← Componentes React (SPA + router hash)
  helpers.jsx              ← Categorías, formato de fecha, íconos, Placeholder de imágenes
  tweaks-panel.jsx         ← Panel de tweaks (dev only)
  news-data.js             ← 816 noticias con título, fecha, imagen y cuerpo completo
  site-data.js             ← Datos del resto de secciones (Resoluciones, Cursos, Comisión Directiva, Estatutos, Galerías, etc.)
  logo-amjp.png

uploads/
  articulos/               ← 757 imágenes destacadas de notas (363 MB)
  galeria/                 ← Fotos de álbumes + miniaturas en /200/
  secciones/               ← Imagen hero de Comisión Directiva

scrape-*.mjs               ← Scripts Node.js usados para extraer la data del sitio original
gen-*.mjs                  ← Scripts para regenerar news-data.js / site-data.js
```

## Secciones implementadas (router hash)

- `#/` o `#/noticias` — Noticias con carrusel automático de portada, 3 destacadas y archivo de 808 notas en grid de cards
- `#/asociacion/comision-directiva` — Foto + tablas de autoridades por jurisdicción
- `#/asociacion/estatutos` — Texto legal completo
- `#/asociacion/galeria-de-expresidentes` — 17 retratos con lightbox
- `#/resoluciones` — 21 decisiones de la CSJ
- `#/socios/cursos`, `#/socios/eventos`, `#/socios/deportes` — Listas con cuerpo completo
- `#/socios/beneficios`, `#/socios/creditos`, `#/socios/actualizacion-de-datos` — Formularios funcionales
- `#/inscripcion`, `#/contacto` — Formularios
- `#/galeria-de-imagenes` — 7 álbumes con ~76 fotos totales

## Correr localmente

Se necesita Node.js para `http-server`. Cualquier servidor estático sirve.

```powershell
cd "<ruta al proyecto>"
npx http-server -p 8766 -c-1
# Abre http://localhost:8766/amjp/
```

> Importante: el servidor debe arrancar desde la **raíz del proyecto** (no desde `amjp/`) para que las rutas relativas `../uploads/...` resuelvan a las imágenes.

## Características principales

- **SPA con router hash** — toda la navegación queda dentro del HTML
- **Modo oscuro persistente** (localStorage)
- **Renderer especial de convenios** — detecta automáticamente notas con estructura "Nacionales/Internacionales" + campos y las renderiza como cards con favicon
- **Búsqueda en vivo** con chips de categoría y filtro por año
- **Modal de lectura** con drop cap y navegación ±1 (teclado ← →)
- **Lightbox** para galerías y expresidentes
- **Galerías de fotos** descargadas localmente — funcionamiento offline

## Re-generar datos (opcional)

Los scripts `scrape-*.mjs` y `gen-*.mjs` permiten regenerar la data desde cero leyendo amjp.org.py. Los archivos intermedios (`manifest.json`, `bodies.json`, `data-*.json`) están en `.gitignore` y se generan al correr los scripts.

```powershell
node scrape.mjs              # Descarga las 816 imágenes destacadas
node scrape-bodies.mjs       # Extrae los cuerpos de notas
node scrape-all.mjs          # Resto de secciones (resoluciones, cursos, galerías, etc.)
node gen-news-data.mjs       # Regenera amjp/news-data.js
node gen-site-data.mjs       # Regenera amjp/site-data.js
```

## Licencia

Sitio institucional. Todo el contenido (textos, imágenes, datos) pertenece a la Asociación de Magistrados Judiciales del Paraguay.
