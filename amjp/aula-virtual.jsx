/* aula-virtual.jsx — Aula Virtual: plataforma de cursos para alumnos matriculados.
   Requiere el servidor Node (API /api/aula/*). Login de alumno + "mis cursos" + reproductor + progreso. */

function AulaCapIcon(p){
  return (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 4 2 9l10 5 10-5-10-5Z" fill="currentColor"/>
      <path d="M6 11v4.2c0 1.6 2.7 3.2 6 3.2s6-1.6 6-3.2V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 9.5v5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

async function aulaApi(path, options){
  const res = await fetch("/api/aula" + path, {
    credentials: "same-origin",
    headers: options && options.body ? { "Content-Type": "application/json" } : undefined,
    ...options,
  });
  let data = null;
  try { data = await res.json(); } catch { /* sin cuerpo */ }
  if (!res.ok) throw new Error((data && data.error) || ("Error " + res.status));
  return data;
}

/* ---------- Login del alumno ---------- */
function AulaLogin({ onLoggedIn }){
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e){
    e.preventDefault();
    if (!email || !password){ setErr("Completá correo y contraseña."); return; }
    setBusy(true); setErr("");
    try {
      await aulaApi("/login", { method:"POST", body: JSON.stringify({ email, password }) });
      onLoggedIn();
    } catch (e2){
      setErr(e2.message || "No se pudo ingresar.");
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead crumbs={[{label:"Inicio", href:ROUTES.HOME},{label:"Socios"},{label:"Aula Virtual"}]}
        title="Aula Virtual"
        sub="Ingresá con tu cuenta de alumno para acceder a tus cursos, ver las clases y seguir tu progreso."/>
      <main className="wrap main aula-main">
        <form className="aula-login" onSubmit={submit}>
          <span className="aula-login-cap"><AulaCapIcon/></span>
          <h2>Acceso de alumnos</h2>
          <p>Usá el correo y la contraseña que te dio la AMJP.</p>
          {err && <div className="aula-login-err">{err}</div>}
          <label>Correo</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoFocus/>
          <label>Contraseña</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)}/>
          <button type="submit" disabled={busy}>{busy ? "Ingresando…" : "Ingresar"}</button>
        </form>
      </main>
    </>
  );
}

/* ---------- Tarjeta de curso (con progreso) ---------- */
function AulaCourseCard({ course, onOpen }){
  const pct = course.total_lessons ? Math.round(course.completed_lessons / course.total_lessons * 100) : 0;
  const estado = !course.total_lessons ? "Sin lecciones aún" : (pct === 100 ? "Completado ✓" : (course.completed_lessons ? "Continuar" : "Empezar"));
  return (
    <button type="button" className="aula-card" onClick={onOpen}>
      <div className="aula-card-banner" style={{ background:"linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 62%, #000))" }}>
        <span className="aula-card-cap"><AulaCapIcon/></span>
        <h3 className="aula-card-title">{course.title}</h3>
      </div>
      <div className="aula-card-body">
        <div className="aula-bar"><div className="aula-bar-fill" style={{ width: pct + "%" }}></div></div>
        <p className="aula-card-prog">{course.completed_lessons}/{course.total_lessons} lecciones · {pct}%</p>
      </div>
      <div className="aula-card-foot">
        <span className="aula-card-date">{estado}</span>
        <span className="aula-card-arrow"><Icon.arrow/></span>
      </div>
    </button>
  );
}

/* ---------- Reproductor de la lección ---------- */
function AulaLessonPlayer({ lesson, onEnded }){
  if (!lesson) return <div className="aula-player-empty">Elegí una lección de la lista para empezar.</div>;
  if (lesson.is_live){
    return (
      <div className="aula-live">
        <span className="aula-live-dot"></span>
        <div>
          <strong>Clase en vivo</strong>
          <p>El acceso a la transmisión estará disponible próximamente.</p>
          {lesson.live_url && <a href={lesson.live_url} target="_blank" rel="noopener noreferrer">Ir a la transmisión ↗</a>}
        </div>
      </div>
    );
  }
  if (!lesson.has_video) return <div className="aula-player-empty">Esta lección todavía no tiene video cargado.</div>;
  return (
    <video className="aula-video" key={lesson.id} src={`/api/aula/lessons/${lesson.id}/video`}
      controls controlsList="nodownload" onContextMenu={e=>e.preventDefault()}
      onEnded={()=> onEnded && onEnded(lesson.id)}/>
  );
}

/* ---------- Curso: reproductor + lista de lecciones + progreso ---------- */
function AulaCourse({ courseId, onBack }){
  const [data, setData] = useState(null);
  const [current, setCurrent] = useState(null);
  const [err, setErr] = useState("");

  useEffect(()=>{
    let alive = true;
    aulaApi(`/courses/${courseId}`).then(d => {
      if (!alive) return;
      setData(d);
      const all = d.modules.flatMap(m => m.lessons);
      setCurrent(all.find(l => !l.completed) || all[0] || null);
    }).catch(e => { if (alive) setErr(e.message); });
    return ()=>{ alive = false; };
  }, [courseId]);

  async function setCompleted(lessonId, completed){
    try {
      await aulaApi(`/lessons/${lessonId}/progress`, { method:"POST", body: JSON.stringify({ completed }) });
      setData(d => ({ ...d, modules: d.modules.map(m => ({ ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, completed } : l) })) }));
      setCurrent(c => c && c.id === lessonId ? { ...c, completed } : c);
    } catch (e){ alert(e.message); }
  }

  if (err) return (
    <main className="wrap main aula-main">
      <button type="button" className="aula-back" onClick={onBack}><Icon.arrow style={{ transform:"rotate(180deg)" }}/> Volver a mis cursos</button>
      <div className="empty"><p>{err}</p></div>
    </main>
  );
  if (!data) return <main className="wrap main aula-main"><div className="empty"><p>Cargando…</p></div></main>;

  const all = data.modules.flatMap(m => m.lessons);
  const done = all.filter(l => l.completed).length;
  const pct = all.length ? Math.round(done / all.length * 100) : 0;

  return (
    <main className="wrap main aula-main">
      <button type="button" className="aula-back" onClick={onBack}><Icon.arrow style={{ transform:"rotate(180deg)" }}/> Volver a mis cursos</button>
      <div className="aula-detail-banner" style={{ background:"linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 68%, #000))" }}>
        <span className="aula-detail-cap"><AulaCapIcon/></span>
        <div style={{ flex:1, minWidth:0 }}>
          <span className="aula-detail-kicker">Curso · Aula Virtual</span>
          <h1 className="aula-detail-title">{data.title}</h1>
          <div className="aula-detail-prog">
            <div className="aula-bar aula-bar--light"><div className="aula-bar-fill" style={{ width: pct + "%" }}></div></div>
            <span>{done}/{all.length} lecciones · {pct}%</span>
          </div>
        </div>
      </div>

      <div className="aula-course">
        <div className="aula-course-main">
          <AulaLessonPlayer lesson={current} onEnded={(id)=>setCompleted(id, true)}/>
          {current && !current.is_live && (
            <div className="aula-lesson-head">
              <div className="aula-lesson-info">
                <h2 className="aula-lesson-title">{current.title}</h2>
                {current.description && <p className="aula-lesson-desc">{current.description}</p>}
              </div>
              <button type="button" className={"aula-complete" + (current.completed ? " is-done" : "")}
                onClick={()=>setCompleted(current.id, !current.completed)}>
                {current.completed ? <><Icon.check/> Completada</> : "Marcar como vista"}
              </button>
            </div>
          )}
        </div>

        <aside className="aula-playlist">
          <h3 className="aula-pl-head">Contenido del curso</h3>
          {data.modules.length === 0 && <p className="aula-pl-empty">Este curso todavía no tiene contenido cargado.</p>}
          {data.modules.map(m => (
            <div className="aula-pl-module" key={m.id}>
              <h4 className="aula-pl-mtitle">{m.title}</h4>
              {m.lessons.length === 0 ? <p className="aula-pl-empty">Sin lecciones.</p> : m.lessons.map(l => (
                <button type="button" key={l.id}
                  className={"aula-pl-item" + (current && current.id === l.id ? " is-current" : "") + (l.completed ? " is-done" : "")}
                  onClick={()=>setCurrent(l)}>
                  <span className="aula-pl-ic">{l.completed ? <Icon.check/> : (l.is_live ? "🔴" : "▶")}</span>
                  <span className="aula-pl-title">{l.title}</span>
                </button>
              ))}
            </div>
          ))}
        </aside>
      </div>
    </main>
  );
}

/* ---------- Inicio del alumno: resumen + mis cursos ---------- */
function AulaHome({ student, onLogout, onOpenCourse }){
  const [courses, setCourses] = useState(null);
  const [err, setErr] = useState("");
  useEffect(()=>{ aulaApi("/courses").then(setCourses).catch(e => setErr(e.message)); }, []);

  const summary = useMemo(()=>{
    if (!courses) return null;
    const total = courses.reduce((a,c)=>a + c.total_lessons, 0);
    const done = courses.reduce((a,c)=>a + c.completed_lessons, 0);
    return { courses: courses.length, total, done, pct: total ? Math.round(done/total*100) : 0 };
  }, [courses]);

  return (
    <>
      <PageHead crumbs={[{label:"Inicio", href:ROUTES.HOME},{label:"Socios"},{label:"Aula Virtual"}]}
        title="Aula Virtual"
        sub={`Hola, ${student.name.split(" ")[0]}. Accedé a tus cursos, mirá las clases y seguí tu progreso.`}/>
      <main className="wrap main aula-main">
        <div className="aula-userbar">
          <div className="aula-userbar-info">
            <span className="aula-userbar-name">{student.name}</span>
            <span className="aula-userbar-mail">{student.email}{student.matricula ? ` · Matrícula ${student.matricula}` : ""}</span>
          </div>
          <button type="button" className="aula-logout" onClick={onLogout}>Cerrar sesión</button>
        </div>

        {summary && summary.courses > 0 && (
          <div className="aula-summary">
            <div className="aula-summary-stat"><strong>{summary.courses}</strong><span>curso{summary.courses === 1 ? "" : "s"}</span></div>
            <div className="aula-summary-stat"><strong>{summary.done}/{summary.total}</strong><span>lecciones vistas</span></div>
            <div className="aula-summary-prog">
              <div className="aula-bar"><div className="aula-bar-fill" style={{ width: summary.pct + "%" }}></div></div>
              <span>{summary.pct}% completado</span>
            </div>
          </div>
        )}

        {err && <div className="empty"><p>{err}</p></div>}
        {!courses && !err && <div className="empty"><p>Cargando tus cursos…</p></div>}
        {courses && (courses.length === 0 ? (
          <div className="empty">
            <div className="empty-mark"><AulaCapIcon/></div>
            <p>Todavía no estás matriculado en ningún curso. Cuando la AMJP te inscriba, tus cursos van a aparecer acá.</p>
          </div>
        ) : (
          <>
            <h2 className="aula-section-title">Mis cursos</h2>
            <div className="aula-grid">
              {courses.map(c => <AulaCourseCard key={c.id} course={c} onOpen={()=>onOpenCourse(c.id)}/>)}
            </div>
          </>
        ))}
      </main>
    </>
  );
}

/* ---------- Página raíz: portón de acceso ---------- */
function AulaVirtualPage(){
  const [auth, setAuth] = useState(undefined); // undefined=cargando, null=sin sesión, objeto=alumno
  const [openCourseId, setOpenCourseId] = useState(null);

  function refresh(){
    aulaApi("/me").then(d => setAuth(d.authenticated ? d.student : null)).catch(()=> setAuth(null));
  }
  useEffect(()=>{ refresh(); }, []);

  async function logout(){
    try { await aulaApi("/logout", { method:"POST" }); } catch { /* ignorar */ }
    setAuth(null); setOpenCourseId(null);
  }

  if (auth === undefined) return <main className="wrap main aula-main"><div className="empty"><p>Cargando…</p></div></main>;
  if (auth === null) return <AulaLogin onLoggedIn={refresh}/>;
  if (openCourseId != null) return <AulaCourse courseId={openCourseId} onBack={()=>setOpenCourseId(null)}/>;
  return <AulaHome student={auth} onLogout={logout} onOpenCourse={setOpenCourseId}/>;
}
