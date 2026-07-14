/* app.jsx — SPA multipágina AMJP */
const { useState, useEffect, useMemo, useRef, Fragment } = React;

const FONT_MAP = {
  "Spectral": "'Spectral', Georgia, serif",
  "Source": "'Source Serif 4', Georgia, serif",
  "Baskerville": "'Libre Baskerville', Georgia, serif",
};
const DENS_MAP = { "Compacta":"compact", "Normal":"normal", "Amplia":"amplia" };

/* ---------- Routing ---------- */
const ROUTES = {
  HOME: "/",
  NOTICIAS: "/noticias",
  CD: "/asociacion/comision-directiva",
  EST: "/asociacion/estatutos",
  EXPRES: "/asociacion/galeria-de-expresidentes",
  RESOL: "/resoluciones",
  CURSOS: "/socios/cursos",
  INSCR_CURSO: "/socios/inscripcion-a-curso",
  AULA: "/socios/aula-virtual",
  EVENTOS: "/socios/eventos",
  DEPORTES: "/socios/deportes",
  BENEF: "/socios/beneficios",
  CREDITOS: "/socios/creditos",
  ACTU: "/socios/actualizacion-de-datos",
  INSCR: "/inscripcion",
  GAL: "/galeria-de-imagenes",
  CONT: "/contacto",
  PRIV: "/privacidad",
};

function parseHash(){
  const h = (location.hash || "#/").replace(/^#/, "");
  // Soportar /galeria-de-imagenes/:slug
  const galM = h.match(/^\/galeria-de-imagenes\/(.+)$/);
  if (galM) return { name:"galeria-album", slug: galM[1] };
  return { name: h || "/", slug: null };
}

function useHashRoute(){
  const [route, setRoute] = useState(parseHash());
  useEffect(()=>{
    const onHash = ()=> { setRoute(parseHash()); window.scrollTo(0,0); };
    window.addEventListener("hashchange", onHash);
    return ()=> window.removeEventListener("hashchange", onHash);
  }, []);
  return route;
}

function link(href){ return "#" + href; }

const NAV = [
  { label:"Asociación", children:[
    ["Comisión Directiva", ROUTES.CD],
    ["Estatutos", ROUTES.EST],
    ["Galería de expresidentes", ROUTES.EXPRES],
  ]},
  { label:"Resoluciones", href: ROUTES.RESOL },
  { label:"Socios", children:[
    // Ocultos temporalmente hasta que el backend esté online (Aula e Inscripción necesitan servidor):
    // ["Aula Virtual", ROUTES.AULA],
    ["Cursos", ROUTES.CURSOS],
    // ["Inscripción a cursos", ROUTES.INSCR_CURSO],
    ["Eventos", ROUTES.EVENTOS],
    ["Deportes", ROUTES.DEPORTES],
    ["Beneficios", ROUTES.BENEF],
    ["Créditos", ROUTES.CREDITOS],
    ["Actualización de datos", ROUTES.ACTU],
  ]},
  { label:"Noticias", href: ROUTES.NOTICIAS },
  { label:"Beneficios", href: ROUTES.BENEF },
  { label:"Inscripción", href: ROUTES.INSCR },
  { label:"Galería", href: ROUTES.GAL },
  { label:"Contacto", href: ROUTES.CONT },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "Moderno",
  "accent": "#b08a3c",
  "titleFont": "Spectral",
  "density": "Normal",
  "dark": false,
  "photos": true
}/*EDITMODE-END*/;

/* ---------- Marca ---------- */
const LOGO_SRC = "logo-amjp.png";
function Brand({ small }){
  return (
    <a className={"brand" + (small?" brand--sm":"")} href={link(ROUTES.HOME)}>
      <span className="brand-emblem"><img src={LOGO_SRC} alt="Logo AMJP" loading="eager"/></span>
      <span className="brand-text">
        <span className="brand-mark">AMJP</span>
        <span className="brand-name">Asociación de Magistrados<br/>Judiciales del Paraguay</span>
      </span>
    </a>
  );
}

/* ---------- Navegación ---------- */
function TopBar({ dark, onToggleDark }){
  return (
    <div className="topbar">
      <div className="wrap topbar-in">
        {/* <span className="topbar-tag">Casa del Magistrado · Asunción, Paraguay</span> */}
        <nav className="topbar-links">
          {/* Enlaces ocultos a pedido: Acceso socios · Inscripción · Contacto */}
          <button type="button" className={"theme-toggle" + (dark ? " is-dark" : "")}
            onClick={onToggleDark}
            aria-label={dark ? "Activar modo claro" : "Activar modo oscuro"}
            aria-pressed={!!dark}
            title={dark ? "Modo claro" : "Modo oscuro"}>
            <span className="tt-icon tt-sun"><Icon.sun/></span>
            <span className="tt-icon tt-moon"><Icon.moon/></span>
          </button>
        </nav>
      </div>
    </div>
  );
}

function isActive(route, item){
  const path = route.name === "galeria-album" ? ROUTES.GAL : route.name;
  if (item.href) return item.href === path;
  if (item.children) return item.children.some(c => c[1] === path);
  return false;
}

function Header({ route }){
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(()=>{ setOpen(false); }, [route.name, route.slug]);
  useEffect(()=>{
    const onScroll = ()=> setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return ()=> window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={"nav" + (scrolled ? " is-scrolled" : "")}>
      <div className="wrap nav-in">
        <Brand/>
        <nav className="nav-menu">
          {NAV.map((it,i)=>{
            const active = isActive(route, it);
            return (
              <div className={"nav-item" + (active?" is-active":"") + (it.children?" has-drop":"")} key={i}>
                <a href={it.href ? link(it.href) : (it.children ? link(it.children[0][1]) : "#/")}>
                  {it.label}
                  {it.children && <Icon.chevron className="nav-caret"/>}
                </a>
                {it.children && (
                  <div className="nav-drop">
                    {it.children.map((c,j)=>(
                      <a key={j} href={link(c[1])}>{c[0]}</a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <button className="nav-burger" onClick={()=>setOpen(o=>!o)} aria-label="Menú">
          {open ? <Icon.close/> : <Icon.menu/>}
        </button>
      </div>
      {open && (
        <div className="nav-mobile">
          {NAV.map((it,i)=>{
            const active = isActive(route, it);
            return (
              <div className="nm-group" key={i}>
                {it.href ? (
                  <a className={"nm-top"+(active?" is-active":"")} href={link(it.href)}>{it.label}</a>
                ) : (
                  <div className={"nm-top"+(active?" is-active":"")}>{it.label}</div>
                )}
                {it.children && <div className="nm-children">{it.children.map((c,j)=><a key={j} href={link(c[1])}>{c[0]}</a>)}</div>}
              </div>
            );
          })}
        </div>
      )}
    </header>
  );
}

/* ---------- Encabezado de página ---------- */
function PageHead({ crumbs, title, sub }){
  return (
    <div className="page-head">
      <div className="wrap">
        <div className="crumb">
          {crumbs.map((c, i)=> (
            <Fragment key={i}>
              {c.href ? <a href={link(c.href)}>{c.label}</a> : <span>{c.label}</span>}
              {i < crumbs.length-1 && <span>/</span>}
            </Fragment>
          ))}
        </div>
        <h1 className="page-title">{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
    </div>
  );
}

/* ---------- Chip de categoría ---------- */
function Chip({ cat, sm }){
  const c = CATS[cat] || CATS.Institucional;
  return (
    <span className={"chip"+(sm?" chip--sm":"")}>
      <span className="chip-dot" style={{ background:c.color }}></span>
      {c.label}
    </span>
  );
}

/* ---------- Portada — carrusel auto (estilo Agenda Legal) ---------- */
function PortadaSlide({ item, kicker, onOpen, active }){
  const summary = pickSummary(item.body);
  const truncated = summary.length > 240 ? summary.slice(0, 240).replace(/\s+\S*$/,"") + "…" : summary;
  return (
    <article className={"portada-card" + (active ? " is-on" : "")}
      onClick={()=> active && onOpen(item)}
      aria-hidden={!active}>
      <div className="portada-photo">
        <Placeholder cat={item.cat} ratio="auto" src={item.img} fit="contain"/>
      </div>
      <div className="portada-text">
        <div className="portada-kicker">{kicker || "Portada · Nota destacada"}</div>
        <h2 className="portada-title">{item.t}</h2>
        {truncated && <p className="portada-sum">{truncated}</p>}
        <div className="portada-meta">
          {item.cat && <Chip cat={item.cat}/>}
          <span className="portada-date">{fechaLarga(item.d)}</span>
        </div>
        <span className="portada-cta">Leer la nota completa <Icon.arrow/></span>
      </div>
    </article>
  );
}

function Portada({ items, onOpen, kicker, autoMs }){
  const list = (items || []).filter(Boolean);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const interval = autoMs || 6000;

  // Reset idx si la longitud cambia
  useEffect(()=>{ if (idx >= list.length) setIdx(0); }, [list.length]);

  // Auto-advance
  useEffect(()=>{
    if (paused || list.length < 2) return;
    const id = setTimeout(()=> setIdx(i => (i + 1) % list.length), interval);
    return ()=> clearTimeout(id);
  }, [idx, paused, list.length, interval]);

  if (!list.length) return null;
  const go = (n) => setIdx(((n % list.length) + list.length) % list.length);

  return (
    <section className="portada">
      <div className="wrap">
        <div className="portada-stage"
          onMouseEnter={()=>setPaused(true)}
          onMouseLeave={()=>setPaused(false)}
          onFocus={()=>setPaused(true)}
          onBlur={()=>setPaused(false)}>
          {list.map((it, i) => (
            <PortadaSlide key={it.id} item={it} kicker={kicker} onOpen={onOpen} active={i === idx}/>
          ))}
          {list.length > 1 && (
            <>
              <button className="port-nav port-prev"
                onClick={(e)=>{ e.stopPropagation(); go(idx - 1); }}
                aria-label="Anterior">
                <Icon.arrow/>
              </button>
              <button className="port-nav port-next"
                onClick={(e)=>{ e.stopPropagation(); go(idx + 1); }}
                aria-label="Siguiente">
                <Icon.arrow/>
              </button>
              <div className="port-dots" role="tablist">
                {list.map((_, i) => (
                  <button key={i}
                    className={"port-dot" + (i === idx ? " is-on" : "")}
                    onClick={(e)=>{ e.stopPropagation(); go(i); }}
                    aria-label={`Slide ${i+1}`}
                    aria-current={i === idx}/>
                ))}
              </div>
              <div className="port-progress" key={idx} style={{ animationDuration: paused ? "0s" : `${interval}ms`, animationPlayState: paused ? "paused" : "running" }}/>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- Destacadas ---------- */
function Featured({ items, photos, onOpen, label }){
  const [mainHq, setMainHq] = useState(true);
  if (!items.length) return null;
  const [main, ...side] = items;
  return (
    <section className="featured">
      <div className="wrap">
        <div className="sec-head">
          <h2 className="sec-title">{label || "Lo último"}</h2>
          <span className="sec-rule"></span>
        </div>
        <div className="featured-grid">
          <article className={"feat feat--main"+(mainHq?"":" feat--main-lowres")} onClick={()=>onOpen(main)}>
            {photos && <Placeholder cat={main.cat} ratio="16 / 9" className="feat-img" src={main.img}
              onNaturalSize={(w)=>{ if (w < 700) setMainHq(false); }}/>}
            <div className="feat-body">
              <div className="feat-meta">{main.cat && <Chip cat={main.cat}/>}<span className="meta-date">{fechaLarga(main.d)}</span></div>
              <h3 className="feat-title">{main.t}</h3>
              <span className="readlink">Leer la nota <Icon.arrow className="rl-arrow"/></span>
            </div>
          </article>
          <div className="feat-side">
            {side.map((it)=>(
              <article className="feat feat--mini" key={it.id} onClick={()=>onOpen(it)}>
                {photos && <Placeholder cat={it.cat} ratio="4 / 3" className="feat-img" src={it.img}/>}
                <div className="feat-body">
                  <div className="feat-meta">{it.cat && <Chip cat={it.cat} sm/>}<span className="meta-date">{fechaLarga(it.d)}</span></div>
                  <h3 className="feat-title">{it.t}</h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Divisoria editorial mínima ---------- */
function SectionDivider(){
  return (
    <div className="sec-div" aria-hidden="true">
      <div className="wrap"><span className="sd-line"></span><span className="sd-mark"></span><span className="sd-line"></span></div>
    </div>
  );
}

/* ---------- Banda divisoria institucional (estilo banner Agenda Legal) ---------- */
function InstitutionalBanner({ kicker, tagline }){
  return (
    <section className="ib">
      <div className="wrap">
        <div className="ib-card">
          <span className="ib-kicker">{kicker || "Espacio institucional"}</span>
          <div className="ib-content">
            <div className="ib-logo">
              <img src={LOGO_SRC} alt="" aria-hidden="true"/>
            </div>
            <div className="ib-text">
              <div className="ib-mark">AMJP</div>
              <div className="ib-name">Asociación de Magistrados<br/>Judiciales del Paraguay</div>
            </div>
          </div>
          {tagline && (
            <div className="ib-tagline">
              <span className="ib-rule"></span>
              <em>{tagline}</em>
              <span className="ib-rule"></span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- Barra de filtros (solo Noticias) ---------- */
/* ---------- Overlay de búsqueda con shape-morph (Codrops/Wilson) ---------- */
function SearchOverlay({ open, onClose, q, setQ, resultCount }){
  const inputRef = useRef(null);
  const svgRef = useRef(null);
  const stateRef = useRef({ isOpened: true, timeStart: 0, delayPoints: [], rafId: null });
  const [visible, setVisible] = useState(false);
  const [contentReady, setContentReady] = useState(false);

  const NUM_POINTS = 18, DURATION = 600, DELAY_POINTS_MAX = 250, DELAY_PER_PATH = 120;

  const runMorph = (opening) => {
    const s = stateRef.current;
    if (s.rafId) cancelAnimationFrame(s.rafId);
    s.delayPoints = Array.from({length: NUM_POINTS}, () => Math.random() * DELAY_POINTS_MAX);
    s.isOpened = opening; // true = ocultando overlay; false = mostrándolo
    s.timeStart = Date.now();
    const paths = (svgRef.current && svgRef.current.querySelectorAll('path')) || [];
    const numPaths = paths.length;
    const total = DURATION + DELAY_PER_PATH * (numPaths - 1) + DELAY_POINTS_MAX;
    const easeIn = (t)=> t*t*t;
    const easeOut = (t)=> 1 - Math.pow(1-t, 3);
    function updatePath(time){
      const pts = [];
      for (let i=0; i<NUM_POINTS; i++){
        const ease = s.isOpened ? (i===1?easeOut:easeIn) : (i===1?easeIn:easeOut);
        const t = Math.min(Math.max(time - s.delayPoints[i], 0) / DURATION, 1);
        pts[i] = (1 - ease(t)) * 100;
      }
      let d = s.isOpened ? `M 0 0 V ${pts[0]}` : `M 0 ${pts[0]}`;
      for (let i=0; i<NUM_POINTS-1; i++){
        const p = (i+1)/(NUM_POINTS-1)*100;
        const cp = p - (1/(NUM_POINTS-1)*100)/2;
        d += ` C ${cp} ${pts[i]} ${cp} ${pts[i+1]} ${p} ${pts[i+1]}`;
      }
      d += s.isOpened ? ' V 0 H 0' : ' V 100 H 0';
      return d;
    }
    function render(){
      for (let i=0; i<paths.length; i++){
        const delay = s.isOpened ? DELAY_PER_PATH * i : DELAY_PER_PATH * (paths.length - i - 1);
        paths[i].setAttribute('d', updatePath(Date.now() - (s.timeStart + delay)));
      }
    }
    function loop(){
      render();
      if (Date.now() - s.timeStart < total){
        s.rafId = requestAnimationFrame(loop);
      } else {
        s.rafId = null;
        if (s.isOpened) setVisible(false);
        else setContentReady(true);
      }
    }
    loop();
  };

  useEffect(()=>{
    if (open){
      setVisible(true);
      const id = setTimeout(()=> runMorph(false), 20); // morph IN (cubre)
      return ()=> clearTimeout(id);
    } else if (visible){
      setContentReady(false);
      const id = setTimeout(()=> runMorph(true), 140); // primero fade-out contenido, luego morph OUT
      return ()=> clearTimeout(id);
    }
  }, [open]);

  useEffect(()=>{
    if (!visible) return;
    const onKey = (e)=>{ if (e.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return ()=>{
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [visible, onClose]);

  useEffect(()=>{ if (contentReady && inputRef.current) inputRef.current.focus(); }, [contentReady]);
  useEffect(()=>()=>{ if (stateRef.current.rafId) cancelAnimationFrame(stateRef.current.rafId); }, []);

  if (!visible) return null;
  return (
    <div className={"sov is-open" + (contentReady ? " content-ready" : "")} onClick={onClose} role="dialog" aria-modal="true">
      <svg className="sov-shapes" viewBox="0 0 100 100" preserveAspectRatio="none" ref={svgRef} aria-hidden="true">
        <path d=""/><path d=""/><path d=""/>
      </svg>
      <button className="sov-close" onClick={onClose} aria-label="Cerrar buscador"><Icon.close/></button>
      <div className="sov-inner" onClick={e=>e.stopPropagation()}>
        <p className="sov-hint">Buscar en el archivo</p>
        <h2 className="sov-title">¿Qué nota estás buscando?</h2>
        <form className={"sov-field" + (q.trim() && resultCount===0 ? " no-results" : "")}
          onSubmit={(e)=>{ e.preventDefault(); onClose(); }}>
          <span>Buscar</span>
          <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)}
            placeholder="Ej: jubilación, convenio, FLAM…" aria-label="Buscar noticias"/>
          {q && <button type="button" className="sov-clear" onClick={()=>{ setQ(""); inputRef.current?.focus(); }} aria-label="Limpiar"><Icon.close/></button>}
        </form>
        <div className="sov-meta">
          {q.trim()
            ? <><strong>{resultCount}</strong> {resultCount===1 ? "nota encontrada" : "notas encontradas"}{resultCount > 0 && " — pulsá Enter para ver"}</>
            : <>Escribí palabras clave para filtrar las noticias del archivo. Pulsá <kbd>Esc</kbd> para cerrar.</>
          }
        </div>
      </div>
    </div>
  );
}

function FilterBar({ q, setQ, year, setYear, cat, setCat, years, cats, resultCount, filtering }){
  const [compact, setCompact] = useState(false);
  const [hidden, setHidden] = useState(false);
  const compactRef = useRef(false);
  const sentinelRef = useRef(null);
  useEffect(()=>{
    const sen = sentinelRef.current;
    if (!sen || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e])=>{ const c = !e.isIntersecting && e.boundingClientRect.top < 0; compactRef.current = c; setCompact(c); },
      { rootMargin:"-72px 0px 0px 0px", threshold:0 }
    );
    io.observe(sen);
    return ()=> io.disconnect();
  }, []);
  // Ocultar al desplazarse hacia abajo (y volver a mostrar al subir), solo cuando
  // la barra ya está pegada arriba, para que no salte estando en medio de la página.
  useEffect(()=>{
    let last = window.scrollY;
    const onScroll = ()=>{
      const y = window.scrollY;
      if (Math.abs(y - last) < 6) return;
      if (!compactRef.current) { setHidden(false); last = y; return; }
      setHidden(y > last);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive:true });
    return ()=> window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <>
      <div ref={sentinelRef} className="filterbar-sentinel" aria-hidden="true"></div>
    <div className={"filterbar" + (compact ? " is-compact" : "") + (hidden ? " is-hidden" : "")}>
      <div className="wrap filterbar-in">
        <div className="fb-row">
          <div className="search">
            <Icon.search className="search-ic"/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar en noticias…" aria-label="Buscar noticias"/>
            {q && <button type="button" className="search-x" onClick={()=>setQ("")} aria-label="Limpiar"><Icon.close/></button>}
          </div>
          {cats && cats.length > 0 && (
            <div className="yr">
              <select value={cat} onChange={e=>setCat(e.target.value)} aria-label="Filtrar por categoría">
                <option value="all">Todas las categorías</option>
                {cats.map(c=> <option key={c} value={c}>{CATS[c].label}</option>)}
              </select>
              <Icon.chevron className="yr-caret"/>
            </div>
          )}
          <div className="yr">
            <select value={year} onChange={e=>setYear(e.target.value)} aria-label="Filtrar por año">
              <option value="all">Todos los años</option>
              {years.map(y=> <option key={y} value={y}>{y}</option>)}
            </select>
            <Icon.chevron className="yr-caret"/>
          </div>
        </div>
        {filtering && <div className="fb-count">{resultCount} {resultCount===1?"resultado":"resultados"}</div>}
      </div>
    </div>
    </>
  );
}

/* ---------- Filas de noticias (vista lista compacta) ---------- */
function NewsRow({ item, onOpen }){
  return (
    <article className="row" onClick={()=>onOpen(item)}>
      <div className="row-date">
        <span className="rd-day">{String(diaNum(item.d)).padStart(2,"0")}</span>
        <span className="rd-my">{mesAbbr(item.d)} {anio(item.d)}</span>
      </div>
      <div className="row-main">
        {item.cat && <Chip cat={item.cat} sm/>}
        <h3 className="row-title">{item.t}</h3>
      </div>
      <span className="row-arrow"><Icon.arrow/></span>
    </article>
  );
}

/* ---------- Card de noticia (estilo Agenda Legal) ---------- */
// big=true agranda la card (nota más reciente del año). Si la foto es de baja resolución
// (más chica que la caja grande), se evita agrandarla para no verse borrosa/estirada.
function NewsCard({ item, onOpen, big }){
  const [hq, setHq] = useState(true);
  const showBig = big && hq;
  const summary = pickSummary(item.body);
  const cap = showBig ? 260 : 160;
  const truncated = summary.length > cap ? summary.slice(0, cap).replace(/\s+\S*$/,"") + "…" : summary;
  return (
    <article className={"ac"+(showBig?" ac--lead":"")} onClick={()=>onOpen(item)}>
      <div className="ac-img">
        <Placeholder cat={item.cat} ratio={showBig?"21 / 9":"16 / 10"} src={item.img}
          onNaturalSize={big ? (w)=>{ if (w < 700) setHq(false); } : undefined}/>
        {item.cat && <span className="ac-badge" style={{ background: CATS[item.cat].color }}>{CATS[item.cat].label}</span>}
      </div>
      <div className="ac-body">
        <h3 className="ac-title">{item.t}</h3>
        {truncated && <p className="ac-sum">{truncated}</p>}
        <div className="ac-foot">
          <span className="ac-date">{fechaLarga(item.d)}</span>
          <span className="ac-cta">Leer la nota <Icon.arrow/></span>
        </div>
      </div>
    </article>
  );
}

function NewsList({ items, onOpen, grouped, mode }){
  // mode: "cards" (default) | "rows"
  const useCards = mode !== "rows";
  if (!useCards){
    const rows = [];
    let lastYear = null;
    items.forEach((item)=>{
      const y = anio(item.d);
      if (grouped && y !== lastYear){
        rows.push(<div className="year-div" key={"y"+y}><span className="yd-num">{y}</span><span className="yd-line"></span></div>);
        lastYear = y;
      }
      rows.push(<NewsRow item={item} onOpen={onOpen} key={item.id}/>);
    });
    return <div className="news-list">{rows}</div>;
  }
  // Cards mode: agrupar por año si grouped, cada grupo tiene su grid de cards
  if (!grouped){
    return <div className="ac-grid">{items.map(it => <NewsCard key={it.id} item={it} onOpen={onOpen}/>)}</div>;
  }
  const groups = [];
  let cur = null;
  items.forEach((item)=>{
    const y = anio(item.d);
    if (!cur || cur.y !== y){ cur = { y, items: [] }; groups.push(cur); }
    cur.items.push(item);
  });
  return (
    <div className="ac-groups">
      {groups.map(g => {
        const [yearLead, ...yearRest] = g.items;
        return (
          <section className="ac-group" key={g.y}>
            <div className="year-div"><span className="yd-num">{g.y}</span><span className="yd-line"></span></div>
            <div className="ac-year-layout">
              {yearLead && <NewsCard item={yearLead} onOpen={onOpen} big/>}
              {yearRest.length > 0 && <div className="ac-grid">{yearRest.map(it => <NewsCard key={it.id} item={it} onOpen={onOpen}/>)}</div>}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ---------- Convenios: parser + renderer (detectado por contenido) ---------- */
const FIELD_LABELS = ["Sitio web","Teléfono","Telefono","Linea Baja","Línea Baja","Celular","Email","Correo","Dirección","Direccion","Contacto general","Dir.","Dir","Web"]
  .sort((a,b)=>b.length-a.length); // más largos primero para evitar ambigüedad en la alternación
const escReg = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const FIELD_RE = new RegExp("(" + FIELD_LABELS.map(escReg).join("|") + ")\\s*:\\s*", "i");
const FIELD_ORDER = { "Dirección":0, "Direccion":0, "Dir.":0, "Dir":0, "Sitio web":1, "Web":1, "Teléfono":2, "Telefono":2, "Linea Baja":3, "Línea Baja":3, "Celular":4, "Contacto general":5, "Email":6, "Correo":6 };

function splitFields(line){
  // "Sitio web: X Teléfono: Y" → [{label, value}, ...]
  const out = [];
  const reG = new RegExp("(" + FIELD_LABELS.map(escReg).join("|") + ")\\s*:\\s*", "gi");
  const positions = [];
  let m;
  while ((m = reG.exec(line)) !== null) positions.push({ idx: m.index, label: m[1], end: reG.lastIndex });
  if (!positions.length) return null;
  for (let i = 0; i < positions.length; i++){
    const p = positions[i];
    const next = positions[i+1];
    const value = line.slice(p.end, next ? next.idx : line.length).trim().replace(/[,;.]\s*$/,"");
    if (value) out.push({ label: p.label, value });
  }
  return out;
}

function classifyLine(t){
  if (FIELD_RE.test(t)) return "field";
  if (/:\s*$/.test(t)) return "name";                                                     // termina en ":"
  if (/^(El\s|La\s|Las\s|Los\s)?(Universidad|Instituto|Asociaci[oó]n|Federaci[oó]n|Colegio|Sociedad|Centro|Red|C[áa]mara|Corte|Tribunal)\b/i.test(t)) return "name";
  if (/-\s*[A-Z][A-Za-z0-9]{1,}\s*$/.test(t)) return "name";                              // termina con "- ACRÓNIMO"
  if (/^(Av\.|Avda\.?|Avenida|Calle|Ruta|Camino|Pasaje|Dir\.|Dirección)(?=\s|$|[,:])/i.test(t)) return "addr";
  if (/^[A-Z0-9]{4,}\+[A-Z0-9]{2,}/.test(t)) return "addr";                               // Plus Code
  if (/\d/.test(t) && /(c\/|N°|N\.°|nº|N\s|casi\s|esquina|esq\.)/i.test(t)) return "addr"; // n° + marcador de calle
  if (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+$/.test(t) && t.length > 4) return "name";                  // palabra única capitalizada (ej. "Corjusticia")
  return "addr"; // fallback: extra-info de la institución actual
}

function parseConvenios(body){
  if (!body || body.length < 5) return null;
  const hasHeader = body.some(p => /^(Nacionales|Internacionales)$/i.test(p.trim()));
  const fieldCount = body.filter(p => FIELD_RE.test(p)).length;
  if (!hasHeader || fieldCount < 3) return null;

  const sections = [];
  let curSec = null;
  let curInst = null;
  const ensureSec = () => { if (!curSec){ curSec = { title: "General", institutions: [] }; sections.push(curSec); } };

  for (const raw of body){
    const t = (raw || "").trim();
    if (!t) continue;
    if (/^(Nacionales|Internacionales)$/i.test(t)){
      curSec = { title: t, institutions: [] };
      sections.push(curSec);
      curInst = null;
      continue;
    }
    const cls = classifyLine(t);
    if (cls === "field"){
      ensureSec();
      if (!curInst){ curInst = { name: "Sin nombre", fields: [] }; curSec.institutions.push(curInst); }
      curInst.fields.push(...splitFields(t));
    } else if (cls === "name"){
      ensureSec();
      curInst = { name: t.replace(/:$/,"").trim(), fields: [] };
      curSec.institutions.push(curInst);
    } else { // addr / extra-info
      if (curInst){
        curInst.fields.push({ label: "Dirección", value: t.replace(/^Dir\.?\s*:?\s*/i, "").trim() });
      } else {
        ensureSec();
        curInst = { name: t.replace(/:$/,"").trim(), fields: [] };
        curSec.institutions.push(curInst);
      }
    }
  }

  // Red de seguridad: fusionar cards cuyo "nombre" en realidad es una dirección.
  // Cubre cualquier caso donde el parser haya dividido por error: si el nombre empieza con
  // un marcador de calle, un número, un Plus Code o un patrón "Ciudad - dirección", lo
  // tratamos como dirección de la institución anterior.
  const looksLikeAddrName = (n) => {
    if (!n) return true;
    return /^(Av\.|Avda\.?|Avenida|Calle|Ruta|Camino|Pasaje|Dir\.?|Dirección)\b/i.test(n)
      || /^[A-Z0-9]{3,}\+[A-Z0-9]{2,}/.test(n)
      || /^\d/.test(n)
      || /^[A-Záéíóúñ]+\s*-\s+/.test(n) && /\d/.test(n);
  };
  for (const sec of sections){
    const merged = [];
    for (const cur of sec.institutions){
      const prev = merged[merged.length - 1];
      if (prev && looksLikeAddrName(cur.name)){
        prev.fields.push({ label: "Dirección", value: cur.name }, ...cur.fields);
      } else {
        merged.push(cur);
      }
    }
    sec.institutions = merged;
  }

  // Para cada institución: extraer URL del sitio web + dominio para logo, y ordenar campos
  for (const sec of sections){
    for (const inst of sec.institutions){
      const web = inst.fields.find(f => /web|sitio/i.test(f.label));
      if (web){
        const m = web.value.match(/(?:https?:\/\/)?(?:www\.)?([a-z0-9.-]+\.[a-z]{2,})/i);
        if (m){
          inst.domain = m[1].toLowerCase();
          inst.url = web.value.match(/^https?:\/\//i) ? web.value : "https://" + web.value.replace(/^www\./,"");
        }
      }
      inst.fields.sort((a,b)=> (FIELD_ORDER[a.label] ?? 9) - (FIELD_ORDER[b.label] ?? 9));
    }
  }
  return sections;
}

function ConveniosBody({ sections }){
  return (
    <div className="conv">
      {sections.map((sec, si)=>(
        <section className="conv-sec" key={si}>
          <div className="sec-head sec-head--list">
            <h2 className="sec-title">{sec.title}</h2>
            <span className="sec-rule"></span>
            <span className="conv-count">{sec.institutions.length}</span>
          </div>
          <div className="conv-grid">
            {sec.institutions.map((inst, i)=>{
              const logo = inst.domain ? `https://www.google.com/s2/favicons?domain=${inst.domain}&sz=128` : null;
              return (
                <article className="conv-card" key={i}>
                  <div className="conv-card-h">
                    <div className="conv-logo">
                      {logo
                        ? <img src={logo} alt="" loading="lazy" onError={(e)=>{ e.currentTarget.style.display="none"; }}/>
                        : <span className="conv-logo-fall">{inst.name.charAt(0).toUpperCase()}</span>}
                    </div>
                    <h3 className="conv-name">{inst.name}</h3>
                  </div>
                  <dl className="conv-fields">
                    {inst.fields.map((f, j)=>{
                      const isWeb = /web|sitio/i.test(f.label);
                      const isMail = /email|correo/i.test(f.label);
                      const isTel = /tel|línea|linea|celular/i.test(f.label);
                      let valNode = f.value;
                      if (isWeb && inst.url) valNode = <a href={inst.url} target="_blank" rel="noopener">{f.value}</a>;
                      else if (isMail) valNode = <a href={`mailto:${f.value}`}>{f.value}</a>;
                      else if (isTel) valNode = <a href={`tel:${f.value.replace(/\s/g,'')}`}>{f.value}</a>;
                      return (
                        <Fragment key={j}>
                          <dt className={"conv-lbl" + (isWeb?" conv-lbl--web":isMail?" conv-lbl--mail":isTel?" conv-lbl--tel":"")}>{f.label}</dt>
                          <dd className="conv-val">{valNode}</dd>
                        </Fragment>
                      );
                    })}
                  </dl>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ---------- Modal de lectura ---------- */
function ArticleModal({ item, onClose, onPrev, onNext, hasPrev, hasNext }){
  const [imgHq, setImgHq] = useState(true);
  useEffect(()=>{ setImgHq(true); }, [item]);
  useEffect(()=>{
    function k(e){
      if (e.key==="Escape") onClose();
      else if (e.key==="ArrowLeft" && hasPrev) onPrev();
      else if (e.key==="ArrowRight" && hasNext) onNext();
    }
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return ()=>{ window.removeEventListener("keydown", k); document.body.style.overflow=""; };
  }, [item, hasPrev, hasNext]);
  if (!item) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <button className="modal-x" onClick={onClose} aria-label="Cerrar"><Icon.close/></button>
        <div className="modal-scroll">
          <div className="article">
            <div className="art-meta">{item.cat && <Chip cat={item.cat}/>}<span className="meta-date"><Icon.clock className="md-ic"/>{diaSemana(item.d)}, {fechaLarga(item.d)}</span></div>
            <h1 className="art-title">{item.t}</h1>
            <div className="art-byline">Prensa AMJP · Asociación de Magistrados Judiciales del Paraguay</div>
            <Placeholder cat={item.cat} ratio="16 / 9" className={"art-img"+(imgHq?"":" art-img--lowres")} src={item.img} fit="contain"
              onNaturalSize={(w)=>{ if (w < 700) setImgHq(false); }}/>
            {(() => {
              if (!item.body || !item.body.length) return (
                <div className="art-note">
                  <span className="an-kicker">Sin cuerpo</span>
                  Esta nota fue publicada en el sitio original solo con título e imagen.
                </div>
              );
              const convenios = parseConvenios(item.body);
              if (convenios) return <ConveniosBody sections={convenios}/>;
              return <div className="art-body">{item.body.map((p, i) => <p key={i}>{p}</p>)}</div>;
            })()}
          </div>
        </div>
        <div className="modal-foot">
          <button className="mf-btn" onClick={onPrev} disabled={!hasPrev}><span className="mf-arrow mf-prev"><Icon.arrow/></span>Más reciente</button>
          <button className="mf-back" onClick={onClose}>Volver al listado</button>
          <button className="mf-btn mf-btn--r" onClick={onNext} disabled={!hasNext}>Más antigua<span className="mf-arrow"><Icon.arrow/></span></button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Footer ---------- */
function Footer(){
  const cols = [
    ["Asociación", [
      ["Comisión Directiva", ROUTES.CD],
      ["Estatutos", ROUTES.EST],
      ["Galería de expresidentes", ROUTES.EXPRES],
      ["Resoluciones", ROUTES.RESOL],
    ]],
    ["Socios", [
      ["Cursos", ROUTES.CURSOS],
      ["Eventos", ROUTES.EVENTOS],
      ["Deportes", ROUTES.DEPORTES],
      ["Beneficios", ROUTES.BENEF],
      ["Créditos", ROUTES.CREDITOS],
      ["Actualización de datos", ROUTES.ACTU],
    ]],
    ["Institucional", [
      ["Noticias", ROUTES.NOTICIAS],
      ["Inscripción", ROUTES.INSCR],
      ["Galería de imágenes", ROUTES.GAL],
      ["Contacto", ROUTES.CONT],
      ["Política de Privacidad", ROUTES.PRIV],
    ]],
  ];
  return (
    <footer className="footer">
      <div className="wrap footer-in">
        <div className="footer-brand">
          <Brand small/>
          <p className="footer-desc">Gremio que nuclea a los Magistrados Judiciales del Paraguay, en defensa de la independencia judicial y la dignificación de la carrera.</p>
        </div>
        <div className="footer-cols">
          {cols.map(([h,links])=>(
            <div className="fcol" key={h}>
              <div className="fcol-h">{h}</div>
              {links.map(([label,href])=> <a key={label} href={link(href)}>{label}</a>)}
            </div>
          ))}
        </div>
      </div>
      <div className="footer-bar">
        <div className="wrap footer-bar-in">
          <span>© {new Date().getFullYear()} Asociación de Magistrados Judiciales del Paraguay</span>
          <span className="fb-credit">Desarrollado por <strong>Neura</strong></span>
          <span className="fb-meta">Casa del Magistrado · Asunción, Paraguay</span>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================== */
/*                            PÁGINAS                              */
/* ============================================================== */

/* ---------- Noticias (página principal) ---------- */
function NoticiasPage({ photos }){
  const news = useMemo(()=> window.NEWS.map(n=>({ ...n, cat: categorize(n.t) })), []);
  const years = useMemo(()=> [...new Set(news.map(n=>anio(n.d)))].sort((a,b)=>b-a), [news]);
  const cats = useMemo(()=>{
    const present = new Set(news.map(n=>n.cat));
    return Object.keys(CATS).filter(c=>present.has(c));
  }, [news]);

  const [q, setQ] = useState("");
  const [year, setYear] = useState("all");
  const [cat, setCat] = useState("all");
  const [visible, setVisible] = useState(18);
  const [sel, setSel] = useState(null);
  const filtering = q.trim()!=="" || year!=="all" || cat!=="all";

  const filtered = useMemo(()=>{
    const nq = q.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
    return news.filter(n=>{
      if (year!=="all" && anio(n.d)!==Number(year)) return false;
      if (cat!=="all" && n.cat!==cat) return false;
      if (nq){
        const hay = (n.t+" "+CATS[n.cat].label).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
        if (!hay.includes(nq)) return false;
      }
      return true;
    });
  }, [news, q, year, cat]);

  useEffect(()=>{ setVisible(18); }, [q, year, cat]);

  const portadaItems = filtering ? [] : news.slice(0, 5);
  const featured = filtering ? [] : news.slice(5, 8);
  const listSource = filtering ? filtered : news.slice(8);
  const shown = listSource.slice(0, visible);
  const hasMore = shown.length < listSource.length;

  // Scroll infinito: al acercarse al final de la página, cargar 18 más automáticamente.
  useEffect(()=>{
    if (!hasMore) return;
    const onScroll = ()=>{
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 700) {
        setVisible(v => v + 18);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // por si el fondo ya está a la vista
    return ()=> window.removeEventListener("scroll", onScroll);
  }, [hasMore]);

  const openItem = (item)=> setSel(news.findIndex(n=>n.id===item.id));
  const selItem = sel==null ? null : news[sel];

  return (
    <>
      <PageHead crumbs={[{label:"Inicio", href:ROUTES.HOME},{label:"Noticias"}]}
        title="Noticias"
        sub={<>Actividad institucional, gremial y académica de la Asociación. <span className="ph-count">{news.length} publicaciones desde 2018.</span></>}/>
      <Portada items={portadaItems} onOpen={openItem}/>
      <Featured items={featured} photos={photos} onOpen={openItem}/>
      {!filtering && <SectionDivider/>}
      <FilterBar q={q} setQ={setQ} year={year} setYear={setYear} cat={cat} setCat={setCat}
        years={years} cats={cats} resultCount={filtered.length} filtering={filtering}/>
      <main className="wrap main">
        {!filtering && <div className="sec-head sec-head--list"><h2 className="sec-title">Archivo de noticias</h2><span className="sec-rule"></span></div>}
        {shown.length>0 ? (
          <NewsList items={shown} onOpen={openItem} grouped={true}/>
        ) : (
          <div className="empty">
            <div className="empty-mark"><Icon.search/></div>
            <p>No encontramos noticias para tu búsqueda.</p>
            <button className="empty-reset" onClick={()=>{ setQ(""); setYear("all"); setCat("all"); }}>Limpiar filtros</button>
          </div>
        )}
        {hasMore && (
          <div className="loadmore-wrap">
            <span className="loadmore-auto">
              <span className="lm-dot"></span>
              Cargando más noticias
              <span className="lm-count">{shown.length} de {listSource.length}</span>
            </span>
          </div>
        )}
      </main>
      {selItem && (
        <ArticleModal item={selItem} onClose={()=>setSel(null)}
          onPrev={()=>setSel(s=>Math.max(0,s-1))} onNext={()=>setSel(s=>Math.min(news.length-1,s+1))}
          hasPrev={sel>0} hasNext={sel<news.length-1}/>
      )}
    </>
  );
}

/* ---------- Home (portada estilo periódico) ---------- */
const HERO_ALBUMS = ["Casa del Magistrado", "Sede Social", "Sede Central"];
const stripHtml = (s)=> (s||"").replace(/<br\s*\/?>/gi, " ").replace(/\s+/g," ").trim();

function HcIconPlay(p){ return (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M7 4.5v15l13-7.5-13-7.5Z" fill="currentColor"/></svg>); }
function HcIconPause(p){ return (<svg viewBox="0 0 24 24" fill="none" {...p}><rect x="6" y="4.5" width="4.5" height="15" rx="1" fill="currentColor"/><rect x="13.5" y="4.5" width="4.5" height="15" rx="1" fill="currentColor"/></svg>); }
function HcIconExpand(p){ return (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>); }

/* ---------- Carrusel de portada (sede/edificio) ---------- */
function HomeHeroCarousel(){
  const photos = useMemo(()=>{
    const albums = window.GALERIA || [];
    const out = [];
    HERO_ALBUMS.forEach(name=>{
      const alb = albums.find(a=>a.title===name);
      if (!alb) return;
      (alb.photos||[]).forEach(p=> out.push({ ...p, album: alb.title }));
    });
    return out;
  }, []);
  const [slide, setSlide] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [lbOpen, setLbOpen] = useState(false);
  const n = photos.length;

  useEffect(()=>{
    if (!playing || n < 2) return;
    const t = setInterval(()=> setSlide(s=>(s+1)%n), 4500);
    return ()=> clearInterval(t);
  }, [playing, n]);

  if (!n) return null;
  const goto = (i)=>{ setPlaying(false); setSlide(((i%n)+n)%n); };
  const cur = photos[slide];

  return (
    <section className="hero-carousel">
      <div className="wrap">
        <div className="hc-stage">
          <div className="hc-photo">
            <Placeholder cat="Institucional" ratio="auto" src={cur.big} fit="contain"/>
            {n > 1 && (
              <>
                <button type="button" className="hc-nav hc-prev" onClick={()=>goto(slide-1)} aria-label="Anterior"><Icon.arrow/></button>
                <button type="button" className="hc-nav hc-next" onClick={()=>goto(slide+1)} aria-label="Siguiente"><Icon.arrow/></button>
              </>
            )}
          </div>
          <div className="hc-text">
            <span className="hc-kicker">Nuestra sede</span>
            <h2 className="hc-title">{cur.album}</h2>
            <p className="hc-caption">{stripHtml(cur.caption) || "Casa del Magistrado — sede de la Asociación de Magistrados Judiciales del Paraguay."}</p>
            <div className="hc-controls">
              <button type="button" className="hc-ctrl" onClick={()=>setPlaying(p=>!p)} aria-label={playing?"Pausar":"Reproducir"}>
                {playing ? <HcIconPause/> : <HcIconPlay/>}
              </button>
              <button type="button" className="hc-ctrl" onClick={()=>setLbOpen(true)} aria-label="Ver en grande"><HcIconExpand/></button>
              {n > 1 && <span className="hc-count">{slide+1} / {n}</span>}
            </div>
          </div>
        </div>
      </div>
      {lbOpen && (
        <Lightbox items={photos} index={slide} onClose={()=>setLbOpen(false)} onNav={goto}
          renderCaption={p=>stripHtml(p.caption) || p.album}/>
      )}
    </section>
  );
}

const HOME_SECTIONS = ["Institucional", "Capacitación", "Gremial", "Internacional", "Deportes"];

function HomePage({ photos }){
  const news = useMemo(()=> window.NEWS.map(n=>({ ...n, cat: categorize(n.t) })), []);
  const [sel, setSel] = useState(null);
  const openItem = (item)=> setSel(news.findIndex(n=>n.id===item.id));
  const selItem = sel==null ? null : news[sel];

  const hero = news.slice(0, 6);
  const sections = useMemo(()=>{
    const used = new Set(hero.map(n=>n.id));
    return HOME_SECTIONS.map(cat=>({
      cat,
      items: news.filter(n=>n.cat===cat && !used.has(n.id)).slice(0, 3),
    })).filter(s=>s.items.length>0);
  }, [news]);

  // "Más noticias": el resto de las publicaciones, con scroll infinito (cargan solas al bajar).
  const [visible, setVisible] = useState(18);
  const rest = useMemo(()=>{
    const used = new Set(hero.map(n=>n.id));
    sections.forEach(sec => sec.items.forEach(it => used.add(it.id)));
    return news.filter(n => !used.has(n.id));
  }, [news, sections]);
  const shownRest = rest.slice(0, visible);
  const hasMore = shownRest.length < rest.length;
  useEffect(()=>{
    if (!hasMore) return;
    const onScroll = ()=>{
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 700) setVisible(v => v + 18);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return ()=> window.removeEventListener("scroll", onScroll);
  }, [hasMore]);

  return (
    <>
      <Featured items={hero} photos={photos} onOpen={openItem} label="Lo último"/>

      {/* Carrusel "Nuestra Sede / Casa del Magistrado" ocultado a pedido:
      <HomeHeroCarousel/>
      */}

      {sections.map((s, i)=>(
        <Fragment key={s.cat}>
          <SectionDivider/>
          <section className="home-section">
            <div className="wrap">
              <div className="sec-head">
                <h2 className="sec-title">{CATS[s.cat]?.label || s.cat}</h2>
                <span className="sec-rule"></span>
              </div>
              <div className="ac-grid">
                {s.items.map(it => <NewsCard key={it.id} item={it} onOpen={openItem}/>)}
              </div>
            </div>
          </section>
        </Fragment>
      ))}

      {rest.length > 0 && (
        <>
          <SectionDivider/>
          <main className="wrap main">
            <div className="sec-head sec-head--list"><h2 className="sec-title">Más noticias</h2><span className="sec-rule"></span></div>
            <NewsList items={shownRest} onOpen={openItem} grouped={true}/>
            {hasMore && (
              <div className="loadmore-wrap">
                <span className="loadmore-auto"><span className="lm-dot"></span>Cargando más noticias<span className="lm-count">{shownRest.length} de {rest.length}</span></span>
              </div>
            )}
          </main>
        </>
      )}

      {selItem && (
        <ArticleModal item={selItem} onClose={()=>setSel(null)}
          onPrev={()=>setSel(s=>Math.max(0,s-1))} onNext={()=>setSel(s=>Math.min(news.length-1,s+1))}
          hasPrev={sel>0} hasNext={sel<news.length-1}/>
      )}
    </>
  );
}

/* ---------- Lista genérica (Resoluciones/Cursos/Eventos/Deportes) ---------- */
function SectionList({ items, photos, title, kicker, crumbs, sub, defaultCat, flat, cta }){
  const enriched = useMemo(()=> items.map(n=>({ ...n, cat: n.cat || defaultCat || categorize(n.t) })), [items, defaultCat]);
  const sorted = useMemo(()=> enriched.slice().sort((a,b)=> b.d.localeCompare(a.d) || b.id-a.id), [enriched]);
  const [sel, setSel] = useState(null);
  const openItem = (item)=> setSel(sorted.findIndex(n=>n.id===item.id));
  const selItem = sel==null ? null : sorted[sel];

  const modal = selItem && (
    <ArticleModal item={selItem} onClose={()=>setSel(null)}
      onPrev={()=>setSel(s=>Math.max(0,s-1))} onNext={()=>setSel(s=>Math.min(sorted.length-1,s+1))}
      hasPrev={sel>0} hasNext={sel<sorted.length-1}/>
  );

  // Modo "grilla plana": todos los ítems juntos en cards del mismo tamaño, sin portada ni destacados.
  if (flat){
    return (
      <>
        <PageHead crumbs={crumbs} title={title} sub={sub}/>
        <main className="wrap main">
          {cta && (
            <div className="list-cta">
              <a className="list-cta-btn" href={link(cta.href)}>{cta.label} <Icon.arrow/></a>
            </div>
          )}
          <NewsList items={sorted} onOpen={openItem} grouped={false}/>
        </main>
        {modal}
      </>
    );
  }

  const portadaItems = sorted.slice(0, Math.min(5, sorted.length));
  const featured = sorted.slice(portadaItems.length, portadaItems.length + 3);
  const rest = sorted.slice(portadaItems.length + featured.length);

  return (
    <>
      <PageHead crumbs={crumbs} title={title} sub={sub}/>
      <Portada items={portadaItems} onOpen={openItem} kicker={kicker}/>
      {featured.length > 0 && <Featured items={featured} photos={photos} onOpen={openItem} label="También destacado"/>}
      {rest.length > 0 && <SectionDivider/>}
      <main className="wrap main">
        {rest.length > 0 && <div className="sec-head sec-head--list"><h2 className="sec-title">Archivo completo</h2><span className="sec-rule"></span></div>}
        {rest.length > 0 && <NewsList items={rest} onOpen={openItem} grouped={true}/>}
      </main>
      {modal}
    </>
  );
}

/* ---------- Comisión Directiva ---------- */
function ComisionDirectivaPage(){
  const d = window.CDIRECTIVA;
  return (
    <>
      <PageHead crumbs={[{label:"Inicio", href:ROUTES.HOME},{label:"Asociación"},{label:"Comisión Directiva"}]}
        title="Comisión Directiva"
        sub="Autoridades de la Asociación de Magistrados Judiciales del Paraguay para el período 2024–2027."/>
      <main className="wrap main">
        {d.hero && (
          <div className="cd-hero">
            <img src={d.hero} alt="Comisión Directiva 2024-2027"/>
            <p className="cd-hero-cap">Comisión Directiva de la Asociación de Magistrados Judiciales del Paraguay, período 2024-2027.</p>
          </div>
        )}
        {d.sections.map((sec, si)=>(
          <section className="cd-sec" key={si}>
            <div className="sec-head sec-head--list"><h2 className="sec-title">{sec.title}</h2><span className="sec-rule"></span></div>
            <div className="cd-table-wrap">
              <table className="cd-table">
                <tbody>
                  {sec.rows.map((row, ri)=>(
                    <tr key={ri}>
                      {row.map((c, ci)=> c.tag === "th"
                        ? <th key={ci} rowSpan={c.rowspan>1?c.rowspan:undefined}>{c.text}</th>
                        : <td key={ci} rowSpan={c.rowspan>1?c.rowspan:undefined}>{c.text}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </main>
    </>
  );
}

/* ---------- Estatutos ---------- */
function EstatutosPage(){
  const d = window.ESTATUTOS;
  return (
    <>
      <PageHead crumbs={[{label:"Inicio", href:ROUTES.HOME},{label:"Asociación"},{label:"Estatutos"}]}
        title="Estatutos"
        sub="Cuerpo normativo que rige la Asociación de Magistrados Judiciales del Paraguay."/>
      <main className="wrap main">
        <div className="estatutos" dangerouslySetInnerHTML={{ __html: d.html }}/>
      </main>
    </>
  );
}

/* ---------- Galería de expresidentes ---------- */
function ExpresidentesPage(){
  const items = window.EXPRESIDENTES;
  const [sel, setSel] = useState(null);
  return (
    <>
      <PageHead crumbs={[{label:"Inicio", href:ROUTES.HOME},{label:"Asociación"},{label:"Galería de expresidentes"}]}
        title="Galería de expresidentes"
        sub={`${items.length} retratos de quienes presidieron la AMJP desde 1958.`}/>
      <main className="wrap main">
        <div className="grid-cards">
          {items.map((it, i)=>(
            <button className="pres-card" key={i} onClick={()=>setSel(i)}>
              <div className="pres-img"><img src={it.thumb} alt={it.name} loading="lazy"/></div>
              <div className="pres-info">
                <h3 className="pres-name">{it.name}</h3>
                <p className="pres-period">{it.period}</p>
              </div>
            </button>
          ))}
        </div>
      </main>
      {sel != null && <Lightbox items={items} index={sel} onClose={()=>setSel(null)} onNav={i=>setSel(i)}
        renderCaption={it => <><strong>{it.name}</strong>{it.period && <> · {it.period}</>}</>}
      />}
    </>
  );
}

/* ---------- Lightbox genérico ---------- */
function Lightbox({ items, index, onClose, onNav, renderCaption }){
  useEffect(()=>{
    function k(e){
      if (e.key==="Escape") onClose();
      else if (e.key==="ArrowLeft") onNav(Math.max(0, index-1));
      else if (e.key==="ArrowRight") onNav(Math.min(items.length-1, index+1));
    }
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return ()=>{ window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [index, items]);
  const it = items[index];
  return (
    <div className="lbx" onClick={onClose}>
      <button className="lbx-x" onClick={onClose} aria-label="Cerrar"><Icon.close/></button>
      <button className="lbx-prev" onClick={e=>{e.stopPropagation();onNav(Math.max(0,index-1));}} disabled={index===0} aria-label="Anterior"><Icon.arrow/></button>
      <button className="lbx-next" onClick={e=>{e.stopPropagation();onNav(Math.min(items.length-1,index+1));}} disabled={index===items.length-1} aria-label="Siguiente"><Icon.arrow/></button>
      <figure className="lbx-fig" onClick={e=>e.stopPropagation()}>
        <img src={it.big || it.thumb} alt=""/>
        {renderCaption && <figcaption>{renderCaption(it)}</figcaption>}
        <div className="lbx-count">{index+1} / {items.length}</div>
      </figure>
    </div>
  );
}

/* ---------- Galería de imágenes ---------- */
function GaleriaIndexPage(){
  const albums = window.GALERIA;
  return (
    <>
      <PageHead crumbs={[{label:"Inicio", href:ROUTES.HOME},{label:"Galería"}]}
        title="Galería de imágenes"
        sub={`${albums.length} álbumes documentando la vida institucional de la AMJP.`}/>
      <main className="wrap main">
        <div className="grid-cards">
          {albums.map((alb, i)=>(
            <a className="pres-card" key={i} href={link(ROUTES.GAL + "/" + alb.slug)}>
              <div className="pres-img"><img src={alb.thumb} alt={alb.title} loading="lazy"/></div>
              <div className="pres-info">
                <h3 className="pres-name">{alb.title}</h3>
                <p className="pres-period">{alb.date} · {(alb.photos||[]).length} fotos</p>
              </div>
            </a>
          ))}
        </div>
      </main>
    </>
  );
}

function GaleriaAlbumPage({ slug }){
  const albums = window.GALERIA;
  const album = albums.find(a => a.slug === slug);
  const [sel, setSel] = useState(null);
  if (!album){
    return (
      <>
        <PageHead crumbs={[{label:"Inicio", href:ROUTES.HOME},{label:"Galería", href:ROUTES.GAL},{label:"No encontrado"}]} title="Álbum no encontrado"/>
        <main className="wrap main"><p>El álbum solicitado no existe.</p></main>
      </>
    );
  }
  const photos = album.photos || [];
  return (
    <>
      <PageHead crumbs={[{label:"Inicio", href:ROUTES.HOME},{label:"Galería", href:ROUTES.GAL},{label:album.title}]}
        title={album.title}
        sub={`${photos.length} ${photos.length===1?"foto":"fotos"} · ${album.date}`}/>
      <main className="wrap main">
        <div className="photo-grid">
          {photos.map((p, i)=>(
            <button className="photo-cell" key={i} onClick={()=>setSel(i)}>
              <img src={p.thumb} alt={p.caption||""} loading="lazy"/>
            </button>
          ))}
        </div>
      </main>
      {sel != null && <Lightbox items={photos} index={sel} onClose={()=>setSel(null)} onNav={i=>setSel(i)}
        renderCaption={p => p.caption || null}/>}
    </>
  );
}

/* ---------- Beneficios (página índice con enlaces a sub-servicios) ---------- */
function BeneficiosPage(){
  const items = window.BENEFICIOS || [];
  return (
    <>
      <PageHead crumbs={[{label:"Inicio", href:ROUTES.HOME},{label:"Socios"},{label:"Beneficios"}]}
        title="Beneficios"
        sub="A través de la A.M.J.P. los asociados acceden a una variedad de beneficios."/>
      <main className="wrap main">
        <div className="benef-grid">
          {items.map((b)=>{
            const isExternal = b.href && /^https?:\/\//i.test(b.href);
            const isActive = b.active && b.href;
            return isActive
              ? <a className="benef-card" key={b.id} href={isExternal ? b.href : link(b.href)}
                  target={isExternal ? "_blank" : undefined} rel={isExternal ? "noopener noreferrer" : undefined}>
                  <h3>{b.title}</h3><p>{b.desc}</p>
                  <span className="benef-cta">Solicitar <Icon.arrow/></span>
                </a>
              : <div className="benef-card benef-card--off" key={b.id}>
                  <h3>{b.title}</h3><p>{b.desc}</p>
                  <span className="benef-cta benef-cta--off">Próximamente</span>
                </div>;
          })}
        </div>
      </main>
    </>
  );
}

/* ---------- Form genérico (Inscripción / Créditos / Actualización / Contacto) ---------- */
function ContactForm({ title, crumbs, sub, fields, hidden, intro, kind }){
  const [vals, setVals] = useState(Object.fromEntries(fields.map(f=>[f.name, ""])));
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  async function submit(e){
    e.preventDefault();
    const missing = fields.filter(f => f.required !== false && !String(vals[f.name]||"").trim()).map(f=>f.label);
    if (missing.length){ setErr("Faltan completar: " + missing.join(", ")); return; }
    setErr(""); setSending(true);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: hidden, data: vals }),
      });
      if (!res.ok) throw new Error("No se pudo enviar. Probá de nuevo en unos minutos.");
      setSent(true);
    } catch (e2){
      setErr(e2.message);
    } finally {
      setSending(false);
    }
  }
  return (
    <>
      <PageHead crumbs={crumbs} title={title} sub={sub}/>
      <main className="wrap main">
        <div className="form-card">
          {intro && <div className="form-intro">{intro}</div>}
          {sent ? (
            <div className="form-sent">
              <div className="form-sent-ic"><Icon.check/></div>
              <h3>Solicitud registrada</h3>
              <p>Recibimos tu {kind || "mensaje"}. Te contactaremos por la vía indicada en breve.</p>
              <button className="form-btn" onClick={()=>{ setSent(false); setVals(Object.fromEntries(fields.map(f=>[f.name, ""]))); }}>Enviar otro</button>
            </div>
          ) : (
            <form className="form" onSubmit={submit} noValidate>
              {fields.map(f=>(
                <label className="form-row" key={f.name}>
                  <span className="form-lbl">{f.label}{f.required !== false && <span className="req">*</span>}</span>
                  {f.type === "textarea"
                    ? <textarea rows={f.rows||5} placeholder={f.placeholder||""} value={vals[f.name]} onChange={e=>setVals(v=>({...v, [f.name]: e.target.value}))}/>
                    : f.type === "select"
                    ? <select className="form-select" value={vals[f.name]} onChange={e=>setVals(v=>({...v, [f.name]: e.target.value}))}>
                        <option value="">{f.placeholder || "Elegí una opción…"}</option>
                        {(f.options||[]).map(o=>{ const val = typeof o === "string" ? o : o.value; const lab = typeof o === "string" ? o : o.label; return <option key={val} value={val}>{lab}</option>; })}
                      </select>
                    : <input type={f.type||"text"} placeholder={f.placeholder||""} value={vals[f.name]} onChange={e=>setVals(v=>({...v, [f.name]: e.target.value}))}/>
                  }
                </label>
              ))}
              {hidden && <div className="form-hidden-meta">Tipo de solicitud: <strong>{hidden}</strong></div>}
              {err && <div className="form-err">{err}</div>}
              <button type="submit" className="form-btn" disabled={sending}>
                {sending ? "Enviando…" : <>Enviar solicitud <Icon.arrow/></>}
              </button>
            </form>
          )}
        </div>
      </main>
    </>
  );
}

/* ---------- Páginas concretas de formularios ---------- */
function InscripcionPage(){
  return <ContactForm
    title="Inscripción" kind="solicitud de inscripción"
    crumbs={[{label:"Inicio",href:ROUTES.HOME},{label:"Inscripción"}]}
    sub="Complete el formulario para iniciar el trámite de asociación."
    intro="Los datos serán recibidos por Secretaría y un miembro de la Comisión Directiva tomará contacto para los pasos siguientes."
    hidden="Inscripción"
    fields={[
      {name:"name", label:"Nombre y apellido"},
      {name:"position", label:"Cargo"},
      {name:"expiration", label:"Vencimiento del cargo"},
      {name:"location", label:"Circunscripción"},
      {name:"city", label:"Localidad"},
      {name:"birthdate", label:"Fecha de nacimiento", placeholder:"YYYY-MM-DD"},
      {name:"email", label:"Correo electrónico", type:"email"},
      {name:"phone", label:"Teléfono"},
      {name:"mobile", label:"Celular"},
    ]}/>;
}

function InscripcionCursoPage(){
  const cursos = useMemo(()=> (window.CURSOS||[]).slice().sort((a,b)=> b.d.localeCompare(a.d) || b.id-a.id), []);
  const [vals, setVals] = useState({ course_id:"", name:"", cedula:"", email:"" });
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(null); // {course, cedula, email}

  const preselect = useMemo(()=>{
    const m = (location.hash||"").match(/[?&]curso=(\d+)/);
    return m ? m[1] : "";
  }, []);
  useEffect(()=>{ if (preselect) setVals(v=>({ ...v, course_id: preselect })); }, [preselect]);

  async function submit(e){
    e.preventDefault();
    if (!vals.course_id) return setErr("Elegí el curso al que querés inscribirte.");
    if (!vals.name.trim() || !vals.email.trim() || !vals.cedula.trim())
      return setErr("Completá nombre, cédula y correo.");
    setErr(""); setSending(true);
    try {
      const res = await fetch("/api/public/inscripcion-curso", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ course_id: Number(vals.course_id), name: vals.name, cedula: vals.cedula, email: vals.email }),
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data.error || "No se pudo completar la inscripción. Probá de nuevo.");
      setDone({ course: data.course, cedula: vals.cedula.trim(), email: vals.email.trim().toLowerCase(), already: data.already, emailed: data.emailed });
    } catch (e2){ setErr(e2.message); }
    finally { setSending(false); }
  }

  return (
    <>
      <PageHead crumbs={[{label:"Inicio",href:ROUTES.HOME},{label:"Socios"},{label:"Inscripción a cursos"}]}
        title="Inscripción a cursos"
        sub="Inscribite a un curso de la AMJP completando el formulario."/>
      <main className="wrap main">
        <div className="form-card">
          {done ? (
            <div className="form-sent">
              <div className="form-sent-ic"><Icon.check/></div>
              <h3>{done.already ? "Ya estabas inscripto" : "¡Inscripción confirmada!"}</h3>
              <p>Quedaste inscripto en <strong>{done.course}</strong>.</p>
              <div className="insc-access">
                <p>Ya podés acceder al <strong>Aula Virtual</strong> para ver el curso:</p>
                <ul>
                  <li>Usuario: <strong>{done.email}</strong></li>
                  <li>Contraseña: tu número de cédula (<strong>{done.cedula}</strong>)</li>
                </ul>
                {done.emailed && <p className="insc-mail-ok">También te enviamos estos datos por correo a {done.email}. Revisá tu bandeja de entrada (y la carpeta de spam).</p>}
              </div>
              <a className="form-btn" href={link(ROUTES.AULA)}>Ir al Aula Virtual <Icon.arrow/></a>
            </div>
          ) : (
            <>
              <div className="form-intro">Elegí el curso e ingresá tus datos. Al confirmar, quedás inscripto y podés entrar al Aula Virtual con tu correo y tu número de cédula.</div>
              <form className="form" onSubmit={submit} noValidate>
                <label className="form-row">
                  <span className="form-lbl">Curso al que se inscribe<span className="req">*</span></span>
                  <select className="form-select" value={vals.course_id} onChange={e=>setVals(v=>({...v, course_id:e.target.value}))}>
                    <option value="">Elegí un curso…</option>
                    {cursos.map(c=> <option key={c.id} value={c.id}>{c.t}</option>)}
                  </select>
                </label>
                <label className="form-row">
                  <span className="form-lbl">Nombre y apellido<span className="req">*</span></span>
                  <input type="text" value={vals.name} onChange={e=>setVals(v=>({...v, name:e.target.value}))}/>
                </label>
                <label className="form-row">
                  <span className="form-lbl">Número de cédula<span className="req">*</span></span>
                  <input type="text" value={vals.cedula} onChange={e=>setVals(v=>({...v, cedula:e.target.value}))}/>
                </label>
                <label className="form-row">
                  <span className="form-lbl">Correo electrónico<span className="req">*</span></span>
                  <input type="email" value={vals.email} onChange={e=>setVals(v=>({...v, email:e.target.value}))}/>
                </label>
                {err && <div className="form-err">{err}</div>}
                <button type="submit" className="form-btn" disabled={sending}>
                  {sending ? "Inscribiendo…" : <>Inscribirme <Icon.arrow/></>}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </>
  );
}

function CreditosPage(){
  return <ContactForm
    title="Créditos" kind="solicitud de crédito"
    crumbs={[{label:"Inicio",href:ROUTES.HOME},{label:"Socios"},{label:"Beneficios", href:ROUTES.BENEF},{label:"Créditos"}]}
    sub="Solicitud de préstamos para socios de la AMJP con condiciones preferenciales."
    intro="Indique el monto y cantidad de cuotas. La aprobación queda sujeta al análisis de la Comisión correspondiente."
    hidden="Créditos"
    fields={[
      {name:"name", label:"Nombre y apellido"},
      {name:"docid", label:"Cédula de Identidad"},
      {name:"amount", label:"Monto solicitado", placeholder:"Guaraníes"},
      {name:"payments", label:"Cantidad de cuotas"},
      {name:"email", label:"Correo electrónico", type:"email"},
      {name:"phone", label:"Teléfono"},
      {name:"mobile", label:"Celular"},
    ]}/>;
}

function ActualizacionDatosPage(){
  return <ContactForm
    title="Actualización de datos" kind="actualización"
    crumbs={[{label:"Inicio",href:ROUTES.HOME},{label:"Socios"},{label:"Actualización de datos"}]}
    sub="Mantenga actualizada su ficha de socio."
    intro="Los datos quedarán registrados en el padrón de socios."
    hidden="Actualización de Datos"
    fields={[
      {name:"name", label:"Nombre y apellido"},
      {name:"position", label:"Cargo"},
      {name:"expiration", label:"Vencimiento del cargo"},
      {name:"location", label:"Circunscripción"},
      {name:"city", label:"Localidad"},
      {name:"birthdate", label:"Fecha de nacimiento", placeholder:"YYYY-MM-DD"},
      {name:"email", label:"Correo electrónico", type:"email"},
      {name:"phone", label:"Teléfono"},
      {name:"mobile", label:"Celular"},
    ]}/>;
}

function ContactoPage(){
  return (
    <>
      <PageHead crumbs={[{label:"Inicio",href:ROUTES.HOME},{label:"Contacto"}]}
        title="Contacto" sub="Estamos a disposición para consultas, propuestas e inquietudes."/>
      <main className="wrap main">
        <div className="contact-grid">
          <aside className="contact-info">
            <h3>Dirección</h3>
            <p>De la Conquista 1415 e/ Cap. Gwynn y Carlos A. López,<br/>Sajonia, Asunción, Paraguay.</p>
            <h3>Teléfono</h3>
            <p>+595 21 425 100</p>
            <h3>Casa del Magistrado</h3>
            <p>Atención de lunes a viernes, 08:00–17:00 hs.</p>
          </aside>
          <div className="contact-form">
            <ContactForm
              title="" kind="mensaje"
              crumbs={[]}
              sub=""
              hidden="Contacto"
              fields={[
                {name:"name", label:"Nombre"},
                {name:"email", label:"Correo electrónico", type:"email"},
                {name:"message", label:"Mensaje", type:"textarea"},
              ]}/>
          </div>
        </div>
      </main>
    </>
  );
}

/* ---------- Política de Privacidad (plantilla reutilizable por cliente) ---------- */
/* Página estándar para las webs desarrolladas por Neura.
   RESPONSABLE DE LOS DATOS = el cliente (la organización dueña del sitio).
   Neura figura SOLO como proveedor tecnológico / encargado del tratamiento (no es dueño de los datos).
   Para reutilizar en otro cliente: reemplazar únicamente los valores de EMPRESA. */
const EMPRESA = {
  nombre: "Asociación de Magistrados Judiciales del Paraguay",
  ruc: "",                 // ← completar con el RUC del cliente
  email: "",               // ← completar con el correo oficial del cliente
  telefono: "+595 21 425 100",
  direccion: "De la Conquista 1415 e/ Cap. Gwynn y Carlos A. López, Sajonia, Asunción, Paraguay",
};
const PROVEEDOR = { nombre: "Neura", rol: "proveedor tecnológico y encargado del tratamiento" };
const PRIV_UPDATED = "13 de julio de 2026";

function PrivacidadPage(){
  // Muestra el valor si está cargado; si no, un marcador discreto para completar.
  const dato = (v)=> v && v.trim() ? <strong>{v}</strong> : <em className="legal-todo">(por completar)</em>;
  const E = EMPRESA;
  return (
    <>
      <PageHead crumbs={[{label:"Inicio", href:ROUTES.HOME},{label:"Política de Privacidad"}]}
        title="Política de Privacidad"
        sub="Cómo se recopilan, usan y protegen los datos personales en este sitio."/>
      <main className="wrap main">
        <div className="legal">
          <p className="legal-updated">Última actualización: {PRIV_UPDATED}</p>

          <p>
            La presente Política de Privacidad describe cómo {dato(E.nombre)} (en adelante,
            «la Organización») recopila, utiliza, conserva y protege los datos personales de las
            personas que utilizan este sitio web. La Organización es la <strong>responsable del
            tratamiento</strong> de los datos personales recogidos a través de este sitio.
          </p>

          <h2>1. Responsable del tratamiento</h2>
          <p>El responsable del tratamiento de tus datos personales es:</p>
          <ul className="legal-list">
            <li><span className="legal-lbl">Organización:</span> {dato(E.nombre)}</li>
            <li><span className="legal-lbl">RUC:</span> {dato(E.ruc)}</li>
            <li><span className="legal-lbl">Domicilio:</span> {dato(E.direccion)}</li>
            <li><span className="legal-lbl">Correo electrónico:</span> {dato(E.email)}</li>
            <li><span className="legal-lbl">Teléfono:</span> {dato(E.telefono)}</li>
          </ul>

          <h2>2. Qué datos recopilamos</h2>
          <p>Podemos recopilar los siguientes datos personales, siempre que vos los proporciones de forma voluntaria a través del sitio:</p>
          <ul className="legal-list">
            <li>Datos de identificación y contacto: nombre y apellido, cédula de identidad, correo electrónico, teléfono y domicilio.</li>
            <li>Información enviada mediante los formularios del sitio (contacto, inscripción, actualización de datos y solicitudes).</li>
            <li>Datos de acceso a áreas privadas (por ejemplo, credenciales de alumnos del aula virtual, cuando corresponda).</li>
            <li>Datos técnicos de navegación estrictamente necesarios para el funcionamiento del sitio.</li>
          </ul>

          <h2>3. Finalidad del tratamiento</h2>
          <p>Los datos se utilizan únicamente para las siguientes finalidades:</p>
          <ul className="legal-list">
            <li>Responder consultas, solicitudes y comunicaciones enviadas a través del sitio.</li>
            <li>Gestionar inscripciones, membresías y la actualización de datos de los interesados.</li>
            <li>Brindar acceso a los servicios y contenidos disponibles para usuarios registrados.</li>
            <li>Cumplir con obligaciones legales y con los fines institucionales de la Organización.</li>
          </ul>

          <h2>4. Base del tratamiento y consentimiento</h2>
          <p>
            El tratamiento de tus datos se basa en el consentimiento que otorgás al enviar tus datos
            a través del sitio, en la ejecución de la relación que te vincula con la Organización y en
            el cumplimiento de obligaciones legales aplicables. Podés retirar tu consentimiento en
            cualquier momento, sin que ello afecte la licitud del tratamiento previo.
          </p>

          <h2>5. Conservación de los datos</h2>
          <p>
            Los datos personales se conservan durante el tiempo necesario para cumplir las finalidades
            indicadas y las obligaciones legales correspondientes. Una vez cumplidas, los datos son
            eliminados o anonimizados de forma segura.
          </p>

          <h2>6. Con quién se comparten los datos</h2>
          <p>
            La Organización <strong>no vende ni cede</strong> tus datos personales a terceros con fines
            comerciales. Los datos pueden ser tratados por proveedores de servicios tecnológicos que
            actúan por cuenta y bajo instrucciones de la Organización (encargados del tratamiento),
            únicamente para el funcionamiento y mantenimiento del sitio.
          </p>

          <h2>7. Proveedor tecnológico</h2>
          <p>
            Este sitio fue desarrollado y es mantenido técnicamente por {PROVEEDOR.nombre}, en calidad de
            <strong> {PROVEEDOR.rol}</strong>. {PROVEEDOR.nombre} interviene exclusivamente como soporte
            técnico y <strong>no es el responsable ni el propietario de los datos personales</strong>: trata
            los datos por cuenta de la Organización, siguiendo sus instrucciones y aplicando medidas de
            seguridad, sin utilizarlos para fines propios.
          </p>

          <h2>8. Seguridad</h2>
          <p>
            Se aplican medidas técnicas y organizativas razonables para proteger los datos personales
            frente a accesos no autorizados, pérdida, alteración o divulgación indebida.
          </p>

          <h2>9. Derechos de los titulares</h2>
          <p>
            Como titular de los datos, tenés derecho a acceder, rectificar y solicitar la supresión de tus
            datos personales, así como a oponerte o limitar su tratamiento. Para ejercer estos derechos,
            podés comunicarte con la Organización a través del correo {dato(E.email)} o de los datos de
            contacto indicados en esta política.
          </p>

          <h2>10. Cookies y tecnologías similares</h2>
          <p>
            El sitio puede utilizar cookies o tecnologías equivalentes estrictamente necesarias para su
            correcto funcionamiento. Podés configurar tu navegador para bloquearlas, teniendo en cuenta
            que algunas funciones del sitio podrían verse afectadas.
          </p>

          <h2>11. Cambios en esta política</h2>
          <p>
            Esta Política de Privacidad puede ser actualizada en cualquier momento. La versión vigente
            será siempre la publicada en esta página, indicando la fecha de última actualización.
          </p>

          <h2>12. Contacto</h2>
          <p>
            Ante cualquier consulta sobre esta política o sobre el tratamiento de tus datos personales,
            podés escribir a {dato(E.email)} o comunicarte con {dato(E.nombre)} a través de los datos de
            contacto indicados más arriba.
          </p>
        </div>
      </main>
    </>
  );
}

/* ============================================================== */
/*                              APP                                */
/* ============================================================== */

function App(){
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const route = useHashRoute();

  // Persistir modo oscuro en localStorage (sobreescribe el default al cargar)
  useEffect(()=>{
    try {
      const saved = localStorage.getItem("amjp.dark");
      if (saved !== null){
        const v = saved === "1";
        if (v !== t.dark) setTweak("dark", v);
      }
    } catch {}
  }, []);
  const toggleDark = () => {
    const next = !t.dark;
    // Activar transición global suave por ~500ms
    const html = document.documentElement;
    html.classList.add("theme-transitioning");
    setTimeout(()=> html.classList.remove("theme-transitioning"), 500);
    setTweak("dark", next);
    try { localStorage.setItem("amjp.dark", next ? "1" : "0"); } catch {}
  };

  let page;
  switch (route.name){
    case "/":
      page = <HomePage photos={t.photos}/>; break;
    case "/noticias":
      page = <NoticiasPage photos={t.photos}/>; break;
    case ROUTES.RESOL:
      page = <SectionList items={window.RESOLUCIONES} photos={t.photos}
        title="Resoluciones" kicker="Resolución destacada"
        crumbs={[{label:"Inicio", href:ROUTES.HOME},{label:"Resoluciones"}]}
        sub="Decisiones de la Plenaria de la Corte Suprema de Justicia y otras resoluciones relevantes."
        defaultCat="Institucional"/>; break;
    case ROUTES.CURSOS:
      page = <SectionList items={window.CURSOS} photos={t.photos} flat
        title="Cursos" kicker="Curso destacado"
        crumbs={[{label:"Inicio", href:ROUTES.HOME},{label:"Socios"},{label:"Cursos"}]}
        sub="Capacitación continua para magistrados, fiscales y defensores."
        defaultCat="Capacitación"/>; break;
    case ROUTES.AULA:
      page = <AulaVirtualPage/>; break;
    case ROUTES.EVENTOS:
      page = <SectionList items={window.EVENTOS} photos={t.photos}
        title="Eventos" kicker="Evento destacado"
        crumbs={[{label:"Inicio", href:ROUTES.HOME},{label:"Socios"},{label:"Eventos"}]}
        sub="Encuentros institucionales, jornadas y actos de la AMJP."
        defaultCat="Comunidad"/>; break;
    case ROUTES.DEPORTES:
      page = <SectionList items={window.DEPORTES} photos={t.photos}
        title="Deportes" kicker="Torneo destacado"
        crumbs={[{label:"Inicio", href:ROUTES.HOME},{label:"Socios"},{label:"Deportes"}]}
        sub="Torneos de fútbol, vóley y demás actividades deportivas de la Asociación."
        defaultCat="Deportes"/>; break;
    case ROUTES.CD: page = <ComisionDirectivaPage/>; break;
    case ROUTES.EST: page = <EstatutosPage/>; break;
    case ROUTES.EXPRES: page = <ExpresidentesPage/>; break;
    case ROUTES.BENEF: page = <BeneficiosPage/>; break;
    case ROUTES.CREDITOS: page = <CreditosPage/>; break;
    case ROUTES.ACTU: page = <ActualizacionDatosPage/>; break;
    case ROUTES.INSCR: page = <InscripcionPage/>; break;
    case ROUTES.GAL: page = <GaleriaIndexPage/>; break;
    case "galeria-album": page = <GaleriaAlbumPage slug={route.slug}/>; break;
    case ROUTES.CONT: page = <ContactoPage/>; break;
    case ROUTES.INSCR_CURSO: page = <InscripcionCursoPage/>; break;
    case ROUTES.PRIV: page = <PrivacidadPage/>; break;
    default:
      page = (<>
        <PageHead crumbs={[{label:"Inicio", href:ROUTES.HOME},{label:"No encontrado"}]} title="Página no encontrada"
          sub="La sección que buscás no existe. Volvé al inicio o usá el menú principal."/>
        <main className="wrap main"><a className="empty-reset" href={link(ROUTES.HOME)}>Ir al inicio</a></main>
      </>);
  }

  return (
    <div className="amjp"
      data-theme={t.theme.toLowerCase()}
      data-density={DENS_MAP[t.density]||"normal"}
      data-dark={t.dark ? "true":"false"}
      style={{ "--accent": t.accent, "--title-font": FONT_MAP[t.titleFont]||FONT_MAP.Spectral }}>
      <TopBar dark={t.dark} onToggleDark={toggleDark}/>
      <Header route={route}/>
      {page}
      <Footer/>
      <TweaksPanel>
        <TweakSection label="Estilo general"/>
        <TweakRadio label="Dirección" value={t.theme} options={["Editorial","Institucional","Moderno"]} onChange={v=>setTweak("theme", v)}/>
        <TweakColor label="Acento" value={t.accent} options={["#b08a3c","#8c4a52","#2f5488"]} onChange={v=>setTweak("accent", v)}/>
        <TweakToggle label="Modo oscuro" value={t.dark} onChange={v=>setTweak("dark", v)}/>
        <TweakSection label="Tipografía"/>
        <TweakRadio label="Títulos" value={t.titleFont} options={["Spectral","Source","Baskerville"]} onChange={v=>setTweak("titleFont", v)}/>
        <TweakSection label="Composición"/>
        <TweakRadio label="Densidad" value={t.density} options={["Compacta","Normal","Amplia"]} onChange={v=>setTweak("density", v)}/>
        <TweakToggle label="Fotos en destacadas" value={t.photos} onChange={v=>setTweak("photos", v)}/>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
