/* helpers.jsx — utilidades de fecha, categorización, placeholders e íconos */

const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const MESES_ABBR = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const DIAS = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];

function parseISO(d){ const [y,m,day]=d.split("-").map(Number); return new Date(Date.UTC(y,m-1,day)); }
function fechaLarga(d){ const dt=parseISO(d); return `${dt.getUTCDate()} de ${MESES[dt.getUTCMonth()]} de ${dt.getUTCFullYear()}`; }
function diaSemana(d){ const dt=parseISO(d); const w=DIAS[dt.getUTCDay()]; return w.charAt(0).toUpperCase()+w.slice(1); }
function diaNum(d){ return parseISO(d).getUTCDate(); }
function mesAbbr(d){ return MESES_ABBR[parseISO(d).getUTCMonth()].toUpperCase(); }
function anio(d){ return parseISO(d).getUTCFullYear(); }

function norm(s){ return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""); }

// Elige el primer p\u00e1rrafo "sustancial" del cuerpo para usar como resumen,
// saltando etiquetas cortas tipo "Tema N\u00b01:" que no aportan como bajada.
function pickSummary(body){
  if (!body || !body.length) return "";
  const isLabel = (s)=> s.length < 40 && /:\s*$/.test(s.trim());
  return body.find(p => p && p.trim() && !isLabel(p)) || body[0] || "";
}

// Categorías (orden = prioridad). Colores muy desaturados, comparten tono sobrio.
const CATS = {
  Deportes:       { color:"#4f7a5a", label:"Deportes",      ph:"Actividad deportiva" },
  Magistratura:   { color:"#9a7b3e", label:"Magistratura",  ph:"Acto de juramento" },
  Gremial:        { color:"#8a4f57", label:"Gremial",       ph:"Gestión gremial" },
  Capacitación:   { color:"#3f6f78", label:"Capacitación",  ph:"Capacitación" },
  Convenios:      { color:"#6e7048", label:"Convenios",     ph:"Firma de convenio" },
  Internacional:  { color:"#5d5784", label:"Internacional", ph:"Encuentro internacional" },
  Publicaciones:  { color:"#9a6a48", label:"Publicaciones", ph:"Publicación jurídica" },
  Comunidad:      { color:"#8a5a72", label:"Comunidad",     ph:"Acto institucional" },
  Institucional:  { color:"#44597a", label:"Institucional", ph:"Acto institucional" },
};

const CAT_RULES = [
  ["Deportes",      ["futbol","voley","torneo","campeon","deport","jornada final","copa"]],
  ["Magistratura",  ["juramento","juraron","juro","inamovibles","jurame"]],
  ["Gremial",       ["salarial","salario","reajuste","presupuesto","reivindicacion","jubilacion","jubilatori","aporte","bonificacion","adenda","reclamo","reclamar","remuneracion","ampliacion presupuestaria"]],
  ["Capacitación",  ["curso","diplomado","seminario","conferencia","taller","congreso","maestria","doctorado","capacitacion","ponencia","conversatorio","charla","disert","panel debate","master","conferencia magistral"]],
  ["Convenios",     ["convenio","cooperacion","acuerdo","beca","alianza"]],
  ["Internacional", ["flam","uim","mercosur","internacional","latinoameric","buenos aires","argentina","espana","colombia","bogota","barcelona","israel","marruecos","dominicana","bolonia","mexica","peru","union europea","union internacional"]],
  ["Publicaciones", ["revista","libro","obra juridica","gaceta","manual","articulo","publicaci","normas para la presentacion","reglamento"]],
  ["Comunidad",     ["cena","gala","homenaje","celebracion","fundacion","distincion","reconocimiento","navidad","donacion","eucaristica","mujer","violencia","ancianos","tercera edad","solidari","reinsercion","dia del abogado","funcionario judicial","policias","puerta grande","retira"]],
];

function categorize(t){
  const s = norm(t);
  for (const [cat, keys] of CAT_RULES){ if (keys.some(k => s.includes(k))) return cat; }
  return "Institucional";
}

// Imagen destacada: foto real si existe, fallback a placeholder con rayas.
// fit="cover" (default) | "contain" — con fondo borroso de la misma foto.
// Si la foto es vertical o casi cuadrada (ej. tapa de revista, o foto donde el sujeto
// no está centrado) y la caja es horizontal, se pasa automáticamente a "contain" con
// fondo borroso para no recortar el contenido principal.
function Placeholder({ cat, label, ratio, className, src, position, fit, onNaturalSize }){
  const c = CATS[cat] || CATS.Institucional;
  const txt = label || (c.ph + "").toUpperCase();
  const style = { aspectRatio: ratio || "16 / 10" };
  const [broken, setBroken] = React.useState(false);
  const [autoContain, setAutoContain] = React.useState(false);
  const imgRef = React.useRef(null);

  const processSize = (w, h)=>{
    if (onNaturalSize) onNaturalSize(w, h);
    if (fit !== "contain" && h > w * 0.9) setAutoContain(true);
  };

  // Si la imagen ya estaba en caché del navegador, el evento onLoad puede no dispararse
  // (queda "complete" antes de que React termine de montar el listener). Lo verificamos
  // manualmente al montar para no perder la detección de tamaño en ese caso.
  React.useEffect(()=>{
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) processSize(img.naturalWidth, img.naturalHeight);
  }, [src]);

  if (src && !broken){
    const useContain = fit === "contain" || autoContain;
    const handleLoad = (e)=>{
      const img = e.currentTarget;
      processSize(img.naturalWidth, img.naturalHeight);
    };
    return (
      <div className={"ph ph--photo " + (useContain ? "ph--contain " : "") + (className||"")}
        style={useContain ? { ...style, ["--ph-bg"]: `url("${src}")` } : style}
        aria-hidden="true">
        {useContain && <div className="ph-blur"></div>}
        <img ref={imgRef} src={src} alt="" loading="lazy" onLoad={handleLoad}
          style={{ width:"100%", height:"100%", objectFit: useContain ? "contain" : "cover",
            objectPosition: position || "center", display:"block",
            position: useContain ? "relative" : "static", zIndex: useContain ? 1 : "auto" }}
          onError={()=> setBroken(true)}
        />
      </div>
    );
  }
  // Sin foto, o la foto no pudo cargarse: placeholder con rayas y etiqueta de categoría.
  return (
    <div className={"ph " + (className||"")} style={style} aria-hidden="true">
      <div className="ph-stripes"></div>
      <div className="ph-grad" style={{ background:`linear-gradient(135deg, ${c.color}22, transparent 60%)` }}></div>
      <span className="ph-tag">{broken ? "Imagen no disponible" : txt}</span>
    </div>
  );
}

const Icon = {
  search: (p)=>(<svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6"/><line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>),
  chevron: (p)=>(<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  arrow: (p)=>(<svg viewBox="0 0 24 24" fill="none" {...p}><line x1="4" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  close: (p)=>(<svg viewBox="0 0 24 24" fill="none" {...p}><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>),
  menu: (p)=>(<svg viewBox="0 0 24 24" fill="none" {...p}><line x1="4" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><line x1="4" y1="17" x2="20" y2="17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>),
  clock: (p)=>(<svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5"/><path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  check: (p)=>(<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  sun: (p)=>(<svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6"/><g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="12" y1="2.4" x2="12" y2="4.8"/><line x1="12" y1="19.2" x2="12" y2="21.6"/><line x1="2.4" y1="12" x2="4.8" y2="12"/><line x1="19.2" y1="12" x2="21.6" y2="12"/><line x1="5.3" y1="5.3" x2="6.95" y2="6.95"/><line x1="17.05" y1="17.05" x2="18.7" y2="18.7"/><line x1="5.3" y1="18.7" x2="6.95" y2="17.05"/><line x1="17.05" y1="6.95" x2="18.7" y2="5.3"/></g></svg>),
  moon: (p)=>(<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>),
};

Object.assign(window, { fechaLarga, diaSemana, diaNum, mesAbbr, anio, categorize, CATS, Placeholder, Icon });
