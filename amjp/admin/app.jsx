/* app.jsx — Panel de administración AMJP (SPA sin build, mismo patrón que el sitio público) */
const { useState, useEffect, useMemo } = React;

const SECTIONS = [
  { key: "noticias", label: "Noticias", enabled: true },
  { key: "resoluciones", label: "Resoluciones", enabled: true },
  { key: "cursos", label: "Cursos", enabled: true },
  { key: "aula", label: "Contenido de cursos", enabled: true },
  { key: "alumnos", label: "Alumnos", enabled: true },
  { key: "eventos", label: "Eventos", enabled: true },
  { key: "deportes", label: "Deportes", enabled: true },
  { key: "galeria", label: "Galería", enabled: true },
  { key: "comision", label: "Comisión Directiva", enabled: true },
  { key: "estatutos", label: "Estatutos", enabled: true },
  { key: "expresidentes", label: "Expresidentes", enabled: true },
  { key: "beneficios", label: "Beneficios", enabled: true },
  { key: "mensajes", label: "Mensajes", enabled: true },
];

const LOGO_SRC = "../logo-amjp.png";

/* ---------- Login ---------- */
function LoginScreen({ onLoggedIn }){
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e){
    e.preventDefault();
    if (!username || !password){ setErr("Completá usuario y contraseña."); return; }
    setBusy(true); setErr("");
    try {
      const data = await Api.login(username, password);
      onLoggedIn(data.username);
    } catch (e2){
      setErr(e2.message || "No se pudo iniciar sesión.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <img className="login-logo" src={LOGO_SRC} alt="AMJP"/>
        <h1>Panel de administración</h1>
        <p>Asociación de Magistrados Judiciales del Paraguay</p>
        {err && <div className="login-err">{err}</div>}
        <div className="login-field">
          <label>Usuario</label>
          <input type="text" value={username} onChange={e=>setUsername(e.target.value)} autoFocus/>
        </div>
        <div className="login-field">
          <label>Contraseña</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)}/>
        </div>
        <button type="submit" className="login-btn" disabled={busy}>{busy ? "Ingresando…" : "Ingresar"}</button>
      </form>
    </div>
  );
}

/* ---------- Lista de artículos (noticias, y a futuro resoluciones/cursos/etc.) ---------- */
function ArticleList({ section, label, onNew, onEdit, reloadToken }){
  const [items, setItems] = useState(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  useEffect(()=>{
    let alive = true;
    setItems(null);
    Api.listArticles(section)
      .then(data => { if (alive) setItems(data); })
      .catch(e => { if (alive) setErr(e.message); });
    return ()=>{ alive = false; };
  }, [section, reloadToken]);

  const filtered = useMemo(()=>{
    if (!items) return [];
    const nq = q.trim().toLowerCase();
    if (!nq) return items;
    return items.filter(it => it.t.toLowerCase().includes(nq));
  }, [items, q]);

  async function handleDelete(it){
    if (!window.confirm(`¿Borrar "${it.t}"? Esta acción no se puede deshacer.`)) return;
    try {
      await Api.deleteArticle(it.id);
      setItems(items.filter(x => x.id !== it.id));
    } catch (e){
      alert("No se pudo borrar: " + e.message);
    }
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>{label}</h1>
          <p>{items ? `${items.length} publicaciones` : "Cargando…"}</p>
        </div>
        <button className="btn btn-primary" onClick={onNew}>+ Nueva publicación</button>
      </div>

      <div className="admin-search">
        <span>🔍</span>
        <input placeholder="Buscar por título…" value={q} onChange={e=>setQ(e.target.value)}/>
      </div>

      {err && <div className="admin-err">{err}</div>}

      {items && (
        <div className="admin-list">
          {filtered.length === 0 ? (
            <div className="admin-empty">No hay publicaciones que coincidan con la búsqueda.</div>
          ) : filtered.map(it => (
            <div className="admin-row" key={it.id}>
              <div className="admin-row-thumb">
                {it.img && <img src={"/" + it.img.replace(/^\.\.\//,"")} alt="" loading="lazy"/>}
              </div>
              <div className="admin-row-title">{it.t}</div>
              <div className="admin-row-date">{it.d}</div>
              <div className="admin-row-actions">
                <button onClick={()=>onEdit(it.id)}>Editar</button>
                <button onClick={()=>handleDelete(it)}>Borrar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------- Editor de artículo (crear / editar) ---------- */
function ArticleEditor({ section, label, id, onDone, onCancel }){
  const isNew = id == null;
  const [loading, setLoading] = useState(!isNew);
  const [d, setD] = useState(new Date().toISOString().slice(0,10));
  const [t, setT] = useState("");
  const [img, setImg] = useState("");
  const [body, setBody] = useState([""]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(()=>{
    if (isNew) return;
    let alive = true;
    Api.getArticle(id).then(item => {
      if (!alive) return;
      setD(item.d); setT(item.t); setImg(item.img || "");
      setBody(item.body && item.body.length ? item.body : [""]);
      setLoading(false);
    }).catch(e => { if (alive){ setErr(e.message); setLoading(false); } });
    return ()=>{ alive = false; };
  }, [id]);

  async function handleFile(e){
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setErr("");
    try {
      const path = await Api.uploadImage(file);
      setImg(path);
    } catch (e2){
      setErr(e2.message);
    } finally {
      setUploading(false);
    }
  }

  function updatePara(i, value){
    setBody(body.map((p, j) => j === i ? value : p));
  }
  function addPara(){ setBody([...body, ""]); }
  function removePara(i){ setBody(body.filter((_, j) => j !== i)); }

  async function submit(e){
    e.preventDefault();
    if (!d || !t.trim()){ setErr("Completá al menos la fecha y el título."); return; }
    setSaving(true); setErr("");
    const payload = { section, d, t: t.trim(), img: img || null, body: body.map(p=>p.trim()).filter(Boolean) };
    try {
      if (isNew) await Api.createArticle(payload);
      else await Api.updateArticle(id, payload);
      onDone();
    } catch (e2){
      setErr(e2.message);
      setSaving(false);
    }
  }

  if (loading) return <div className="admin-empty">Cargando…</div>;

  const previewSrc = img ? "/" + img.replace(/^\.\.\//,"") : null;

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>{isNew ? `Nueva publicación · ${label}` : `Editar publicación · ${label}`}</h1>
        </div>
      </div>

      <form className="admin-form" onSubmit={submit}>
        {err && <div className="admin-err">{err}</div>}

        <div className="admin-row-2">
          <div className="admin-field">
            <label>Título</label>
            <input type="text" value={t} onChange={e=>setT(e.target.value)} placeholder="Título de la publicación"/>
          </div>
          <div className="admin-field">
            <label>Fecha</label>
            <input type="date" value={d} onChange={e=>setD(e.target.value)}/>
          </div>
        </div>

        <div className="admin-field">
          <label>Imagen destacada</label>
          <div className="admin-img-preview">
            {previewSrc ? <img src={previewSrc} alt=""/> : "Sin imagen"}
          </div>
          <input type="file" accept="image/*" onChange={handleFile} disabled={uploading}/>
          {uploading && <p style={{fontSize:"13px", color:"var(--muted)", marginTop:"6px"}}>Subiendo imagen…</p>}
        </div>

        <div className="admin-field">
          <label>Cuerpo (un párrafo por bloque)</label>
          <div className="para-list">
            {body.map((p, i) => (
              <div className="para-item" key={i}>
                <textarea value={p} onChange={e=>updatePara(i, e.target.value)} rows={3} placeholder={`Párrafo ${i+1}`}/>
                {body.length > 1 && (
                  <button type="button" className="para-remove" onClick={()=>removePara(i)} aria-label="Quitar párrafo">×</button>
                )}
              </div>
            ))}
          </div>
          <button type="button" className="para-add" onClick={addPara}>+ Agregar párrafo</button>
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        </div>
      </form>
    </>
  );
}

/* ---------- Galería: lista de álbumes ---------- */
function GalleryList({ onNew, onEdit, reloadToken }){
  const [albums, setAlbums] = useState(null);
  const [err, setErr] = useState("");

  useEffect(()=>{
    let alive = true;
    setAlbums(null);
    Api.listAlbums().then(data => { if (alive) setAlbums(data); }).catch(e => { if (alive) setErr(e.message); });
    return ()=>{ alive = false; };
  }, [reloadToken]);

  async function handleDelete(alb){
    if (!window.confirm(`¿Borrar el álbum "${alb.title}" y sus ${alb.photoCount} fotos? Esta acción no se puede deshacer.`)) return;
    try {
      await Api.deleteAlbum(alb.id);
      setAlbums(albums.filter(a => a.id !== alb.id));
    } catch (e){
      alert("No se pudo borrar: " + e.message);
    }
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Galería</h1>
          <p>{albums ? `${albums.length} álbumes` : "Cargando…"}</p>
        </div>
        <button className="btn btn-primary" onClick={onNew}>+ Nuevo álbum</button>
      </div>

      {err && <div className="admin-err">{err}</div>}

      {albums && (
        <div className="admin-list">
          {albums.length === 0 ? (
            <div className="admin-empty">Todavía no hay álbumes.</div>
          ) : albums.map(alb => (
            <div className="admin-row" key={alb.id}>
              <div className="admin-row-thumb">
                {alb.thumb && <img src={"/" + alb.thumb.replace(/^\.\.\//,"")} alt="" loading="lazy"/>}
              </div>
              <div className="admin-row-title">{alb.title}</div>
              <div className="admin-row-date">{alb.photoCount} fotos</div>
              <div className="admin-row-actions">
                <button onClick={()=>onEdit(alb.id)}>Editar</button>
                <button onClick={()=>handleDelete(alb)}>Borrar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------- Galería: editor de álbum (meta + fotos) ---------- */
function GalleryAlbumEditor({ id, onDone, onCancel, onCreated }){
  const isNew = id == null;
  const [loading, setLoading] = useState(!isNew);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [intro, setIntro] = useState("");
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(()=>{
    if (isNew) return;
    let alive = true;
    Api.getAlbum(id).then(alb => {
      if (!alive) return;
      setTitle(alb.title); setDate(alb.date || ""); setIntro(alb.intro || ""); setPhotos(alb.photos || []);
      setLoading(false);
    }).catch(e => { if (alive){ setErr(e.message); setLoading(false); } });
    return ()=>{ alive = false; };
  }, [id]);

  async function submit(e){
    e.preventDefault();
    if (!title.trim()){ setErr("Completá el título del álbum."); return; }
    setSaving(true); setErr("");
    try {
      if (isNew){
        const created = await Api.createAlbum({ title: title.trim(), date, intro });
        onCreated(created.id);
      } else {
        await Api.updateAlbum(id, { title: title.trim(), date, intro });
        onDone();
      }
    } catch (e2){
      setErr(e2.message);
      setSaving(false);
    }
  }

  async function handleAddPhotos(e){
    const files = e.target.files;
    if (!files || !files.length) return;
    setUploading(true); setErr("");
    try {
      const updated = await Api.addPhotos(id, files);
      setPhotos(updated.photos);
    } catch (e2){
      setErr(e2.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleCaptionBlur(photo, value){
    if (value === photo.caption) return;
    try { await Api.updatePhoto(photo.id, { caption: value }); }
    catch (e2){ setErr(e2.message); }
  }

  async function handleRemovePhoto(photo){
    if (!window.confirm("¿Quitar esta foto del álbum?")) return;
    try {
      await Api.deletePhoto(photo.id);
      setPhotos(photos.filter(p => p.id !== photo.id));
    } catch (e2){
      alert("No se pudo borrar: " + e2.message);
    }
  }

  if (loading) return <div className="admin-empty">Cargando…</div>;

  return (
    <>
      <div className="admin-head">
        <div><h1>{isNew ? "Nuevo álbum" : "Editar álbum"}</h1></div>
      </div>

      <form className="admin-form" onSubmit={submit}>
        {err && <div className="admin-err">{err}</div>}
        <div className="admin-row-2">
          <div className="admin-field">
            <label>Título del álbum</label>
            <input type="text" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ej: Casa del Magistrado"/>
          </div>
          <div className="admin-field">
            <label>Fecha</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)}/>
          </div>
        </div>
        <div className="admin-field">
          <label>Descripción (opcional)</label>
          <textarea value={intro} onChange={e=>setIntro(e.target.value)} rows={2} placeholder="Bajada o descripción del álbum"/>
        </div>
        <div className="admin-form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Guardando…" : isNew ? "Crear álbum" : "Guardar cambios"}
          </button>
          <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        </div>
      </form>

      {!isNew && (
        <div className="admin-form" style={{marginTop:"24px"}}>
          <div className="admin-field">
            <label>Fotos del álbum ({photos.length})</label>
            <input type="file" accept="image/*" multiple onChange={handleAddPhotos} disabled={uploading}/>
            {uploading && <p style={{fontSize:"13px", color:"var(--muted)", marginTop:"6px"}}>Subiendo fotos…</p>}
          </div>
          {photos.length > 0 && (
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:"16px", marginTop:"10px"}}>
              {photos.map(p => (
                <div key={p.id} style={{border:"1px solid var(--line)", borderRadius:"8px", overflow:"hidden"}}>
                  <img src={"/" + p.big.replace(/^\.\.\//,"")} alt="" style={{width:"100%", aspectRatio:"4/3", objectFit:"cover", display:"block"}}/>
                  <div style={{padding:"8px"}}>
                    <textarea defaultValue={p.caption} rows={2} placeholder="Leyenda (opcional)"
                      style={{width:"100%", fontSize:"12.5px", padding:"6px 8px", border:"1px solid var(--line-strong)", borderRadius:"5px", resize:"vertical"}}
                      onBlur={e=>handleCaptionBlur(p, e.target.value)}/>
                    <button type="button" className="btn btn-danger" style={{width:"100%", marginTop:"6px", padding:"6px", fontSize:"12px"}}
                      onClick={()=>handleRemovePhoto(p)}>Quitar foto</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ---------- Comisión Directiva: portada + tablas por sección ---------- */
function ComisionDirectivaEditor(){
  const [loading, setLoading] = useState(true);
  const [hero, setHero] = useState("");
  const [sections, setSections] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedTag, setSavedTag] = useState(false);
  const [err, setErr] = useState("");

  useEffect(()=>{
    Api.getComisionDirectiva().then(data => {
      setHero(data.hero || ""); setSections(data.sections || []); setLoading(false);
    }).catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  async function handleHeroFile(e){
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setErr("");
    try { setHero(await Api.uploadImage(file)); }
    catch (e2){ setErr(e2.message); }
    finally { setUploading(false); }
  }

  function updateCell(si, ri, ci, field, value){
    setSections(secs => secs.map((sec, i) => i!==si ? sec : {
      ...sec, rows: sec.rows.map((row, j) => j!==ri ? row : row.map((cell, k) => k!==ci ? cell : { ...cell, [field]: value })),
    }));
  }
  function updateTitle(si, value){
    setSections(secs => secs.map((sec, i) => i!==si ? sec : { ...sec, title: value }));
  }
  function addRow(si){
    setSections(secs => secs.map((sec, i) => {
      if (i!==si) return sec;
      const cols = sec.rows.length ? sec.rows[sec.rows.length-1].length : 1;
      return { ...sec, rows: [...sec.rows, Array.from({length: cols}, () => ({ tag:"td", rowspan:1, text:"" }))] };
    }));
  }
  function removeLastRow(si){
    if (!window.confirm("¿Quitar la última fila de esta sección?")) return;
    setSections(secs => secs.map((sec, i) => i!==si ? sec : { ...sec, rows: sec.rows.slice(0, -1) }));
  }
  function addSection(){
    setSections(secs => [...secs, { title:"Nueva sección", rows:[[{ tag:"th", rowspan:1, text:"Columna 1" }]] }]);
  }
  function removeSection(si){
    if (!window.confirm("¿Borrar esta sección completa, con todas sus filas?")) return;
    setSections(secs => secs.filter((_, i) => i!==si));
  }

  async function save(){
    setSaving(true); setErr(""); setSavedTag(false);
    try {
      await Api.updateComisionDirectiva({ hero, sections });
      setSavedTag(true);
      setTimeout(()=>setSavedTag(false), 2500);
    } catch (e2){
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="admin-empty">Cargando…</div>;
  const previewSrc = hero ? "/" + hero.replace(/^\.\.\//,"") : null;

  return (
    <>
      <div className="admin-head">
        <div><h1>Comisión Directiva</h1><p>Foto de portada y tablas de autoridades por jurisdicción</p></div>
        <div style={{display:"flex", alignItems:"center", gap:"12px"}}>
          {savedTag && <span className="admin-saved-tag">Guardado ✓</span>}
          <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>

      {err && <div className="admin-err">{err}</div>}

      <div className="admin-form">
        <div className="admin-field">
          <label>Foto de portada</label>
          <div className="admin-img-preview">{previewSrc ? <img src={previewSrc} alt=""/> : "Sin imagen"}</div>
          <input type="file" accept="image/*" onChange={handleHeroFile} disabled={uploading}/>
          {uploading && <p style={{fontSize:"13px", color:"var(--muted)", marginTop:"6px"}}>Subiendo imagen…</p>}
        </div>
      </div>

      {sections.map((sec, si) => (
        <div className="admin-form" key={si} style={{marginTop:"20px"}}>
          <div className="admin-row-2" style={{alignItems:"flex-end"}}>
            <div className="admin-field" style={{marginBottom:0}}>
              <label>Título de la sección</label>
              <input type="text" value={sec.title} onChange={e=>updateTitle(si, e.target.value)}/>
            </div>
            <button type="button" className="btn btn-danger" onClick={()=>removeSection(si)}>Borrar sección</button>
          </div>

          <div style={{overflowX:"auto", marginTop:"16px"}}>
            <table style={{width:"100%", borderCollapse:"collapse"}}>
              <tbody>
                {sec.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} rowSpan={cell.rowspan>1?cell.rowspan:undefined}
                        style={{border:"1px solid var(--line)", padding:"6px", verticalAlign:"top",
                          background: cell.tag==="th" ? "var(--paper)" : "transparent"}}>
                        <input type="text" value={cell.text} onChange={e=>updateCell(si, ri, ci, "text", e.target.value)}
                          style={{width:"100%", minWidth:"140px", border:"1px solid var(--line-strong)", borderRadius:"4px",
                            padding:"5px 7px", fontSize:"13px", fontWeight: cell.tag==="th" ? "700" : "400"}}/>
                        <input type="number" min="1" value={cell.rowspan} title="Filas que abarca"
                          onChange={e=>updateCell(si, ri, ci, "rowspan", Math.max(1, Number(e.target.value)||1))}
                          style={{width:"52px", marginTop:"4px", fontSize:"11px", padding:"2px 4px",
                            border:"1px solid var(--line-strong)", borderRadius:"4px"}}/>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{display:"flex", gap:"10px", marginTop:"12px"}}>
            <button type="button" className="btn" onClick={()=>addRow(si)}>+ Agregar fila</button>
            {sec.rows.length>0 && <button type="button" className="btn" onClick={()=>removeLastRow(si)}>Quitar última fila</button>}
          </div>
        </div>
      ))}

      <button type="button" className="btn" style={{marginTop:"20px"}} onClick={addSection}>+ Agregar sección</button>
    </>
  );
}

/* ---------- Estatutos: texto legal completo (HTML) ---------- */
function EstatutosEditor(){
  const [loading, setLoading] = useState(true);
  const [html, setHtml] = useState("");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedTag, setSavedTag] = useState(false);
  const [err, setErr] = useState("");

  useEffect(()=>{
    Api.getEstatutos().then(d => { setHtml(d.html || ""); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  async function save(){
    setSaving(true); setErr(""); setSavedTag(false);
    try {
      await Api.updateEstatutos(html);
      setSavedTag(true);
      setTimeout(()=>setSavedTag(false), 2500);
    } catch (e2){
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="admin-empty">Cargando…</div>;

  return (
    <>
      <div className="admin-head">
        <div><h1>Estatutos</h1><p>Texto legal completo del sitio</p></div>
        <div style={{display:"flex", alignItems:"center", gap:"12px"}}>
          {savedTag && <span className="admin-saved-tag">Guardado ✓</span>}
          <button type="button" className="btn" onClick={()=>setPreview(p=>!p)}>{preview ? "Ver HTML" : "Vista previa"}</button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>

      {err && <div className="admin-err">{err}</div>}

      {preview ? (
        <div className="admin-form" style={{maxHeight:"70vh", overflowY:"auto", lineHeight:"1.6"}}
          dangerouslySetInnerHTML={{ __html: html }}/>
      ) : (
        <textarea value={html} onChange={e=>setHtml(e.target.value)} rows={26}
          style={{width:"100%", fontFamily:"monospace", fontSize:"12.5px", padding:"16px", lineHeight:"1.5",
            border:"1px solid var(--line-strong)", borderRadius:"8px", boxSizing:"border-box"}}/>
      )}
    </>
  );
}

/* ---------- Expresidentes: lista + editor ---------- */
function ExpresidentesList({ onNew, onEdit, reloadToken }){
  const [items, setItems] = useState(null);
  const [err, setErr] = useState("");

  useEffect(()=>{
    let alive = true;
    setItems(null);
    Api.listExpresidentes().then(d => { if (alive) setItems(d); }).catch(e => { if (alive) setErr(e.message); });
    return ()=>{ alive = false; };
  }, [reloadToken]);

  async function handleDelete(it){
    if (!window.confirm(`¿Borrar a "${it.name}"?`)) return;
    try { await Api.deleteExpresidente(it.id); setItems(items.filter(x => x.id !== it.id)); }
    catch (e){ alert("No se pudo borrar: " + e.message); }
  }

  return (
    <>
      <div className="admin-head">
        <div><h1>Expresidentes</h1><p>{items ? `${items.length} retratos` : "Cargando…"}</p></div>
        <button className="btn btn-primary" onClick={onNew}>+ Nuevo</button>
      </div>
      {err && <div className="admin-err">{err}</div>}
      {items && (
        <div className="admin-list">
          {items.length === 0 ? (
            <div className="admin-empty">Todavía no hay expresidentes cargados.</div>
          ) : items.map(it => (
            <div className="admin-row" key={it.id}>
              <div className="admin-row-thumb">{it.thumb && <img src={"/" + it.thumb.replace(/^\.\.\//,"")} alt="" loading="lazy"/>}</div>
              <div className="admin-row-title">{it.name}</div>
              <div className="admin-row-date">{it.period}</div>
              <div className="admin-row-actions">
                <button onClick={()=>onEdit(it.id)}>Editar</button>
                <button onClick={()=>handleDelete(it)}>Borrar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function ExpresidenteEditor({ id, onDone, onCancel }){
  const isNew = id == null;
  const [loading, setLoading] = useState(!isNew);
  const [name, setName] = useState("");
  const [period, setPeriod] = useState("");
  const [img, setImg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(()=>{
    if (isNew) return;
    let alive = true;
    Api.getExpresidente(id).then(it => {
      if (!alive) return;
      setName(it.name); setPeriod(it.period || ""); setImg(it.big || ""); setLoading(false);
    }).catch(e => { if (alive){ setErr(e.message); setLoading(false); } });
    return ()=>{ alive = false; };
  }, [id]);

  async function handleFile(e){
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setErr("");
    try { setImg(await Api.uploadImage(file)); }
    catch (e2){ setErr(e2.message); }
    finally { setUploading(false); }
  }

  async function submit(e){
    e.preventDefault();
    if (!name.trim()){ setErr("Completá el nombre."); return; }
    setSaving(true); setErr("");
    const payload = { name: name.trim(), period, big: img || null, thumb: img || null };
    try {
      if (isNew) await Api.createExpresidente(payload);
      else await Api.updateExpresidente(id, payload);
      onDone();
    } catch (e2){
      setErr(e2.message);
      setSaving(false);
    }
  }

  if (loading) return <div className="admin-empty">Cargando…</div>;
  const previewSrc = img ? "/" + img.replace(/^\.\.\//,"") : null;

  return (
    <>
      <div className="admin-head"><div><h1>{isNew ? "Nuevo expresidente" : "Editar expresidente"}</h1></div></div>
      <form className="admin-form" onSubmit={submit}>
        {err && <div className="admin-err">{err}</div>}
        <div className="admin-row-2">
          <div className="admin-field"><label>Nombre</label><input type="text" value={name} onChange={e=>setName(e.target.value)}/></div>
          <div className="admin-field"><label>Período</label>
            <input type="text" value={period} onChange={e=>setPeriod(e.target.value)} placeholder="Ej: 1967 a 1968"/>
          </div>
        </div>
        <div className="admin-field">
          <label>Retrato</label>
          <div className="admin-img-preview">{previewSrc ? <img src={previewSrc} alt=""/> : "Sin imagen"}</div>
          <input type="file" accept="image/*" onChange={handleFile} disabled={uploading}/>
          {uploading && <p style={{fontSize:"13px", color:"var(--muted)", marginTop:"6px"}}>Subiendo imagen…</p>}
        </div>
        <div className="admin-form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving || uploading}>{saving ? "Guardando…" : "Guardar"}</button>
          <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        </div>
      </form>
    </>
  );
}

/* ---------- Beneficios: lista + editor ---------- */
function BeneficiosList({ onNew, onEdit, reloadToken }){
  const [items, setItems] = useState(null);
  const [err, setErr] = useState("");

  useEffect(()=>{
    let alive = true;
    setItems(null);
    Api.listBeneficios().then(d => { if (alive) setItems(d); }).catch(e => { if (alive) setErr(e.message); });
    return ()=>{ alive = false; };
  }, [reloadToken]);

  async function handleDelete(it){
    if (!window.confirm(`¿Borrar "${it.title}"?`)) return;
    try { await Api.deleteBeneficio(it.id); setItems(items.filter(x => x.id !== it.id)); }
    catch (e){ alert("No se pudo borrar: " + e.message); }
  }

  return (
    <>
      <div className="admin-head">
        <div><h1>Beneficios</h1><p>{items ? `${items.length} beneficios` : "Cargando…"}</p></div>
        <button className="btn btn-primary" onClick={onNew}>+ Nuevo beneficio</button>
      </div>
      {err && <div className="admin-err">{err}</div>}
      {items && (
        <div className="admin-list">
          {items.length === 0 ? (
            <div className="admin-empty">Todavía no hay beneficios cargados.</div>
          ) : items.map(it => (
            <div className="admin-row" key={it.id} style={{gridTemplateColumns:"1fr 130px 150px"}}>
              <div className="admin-row-title">{it.title}</div>
              <div className="admin-row-date">{it.active ? "Activo" : "Próximamente"}</div>
              <div className="admin-row-actions">
                <button onClick={()=>onEdit(it.id)}>Editar</button>
                <button onClick={()=>handleDelete(it)}>Borrar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function BeneficioEditor({ id, onDone, onCancel }){
  const isNew = id == null;
  const [loading, setLoading] = useState(!isNew);
  const [title, setTitle] = useState("");
  const [href, setHref] = useState("");
  const [desc, setDesc] = useState("");
  const [active, setActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(()=>{
    if (isNew) return;
    let alive = true;
    Api.getBeneficio(id).then(b => {
      if (!alive) return;
      setTitle(b.title); setHref(b.href || ""); setDesc(b.desc || ""); setActive(!!b.active); setLoading(false);
    }).catch(e => { if (alive){ setErr(e.message); setLoading(false); } });
    return ()=>{ alive = false; };
  }, [id]);

  async function submit(e){
    e.preventDefault();
    if (!title.trim()){ setErr("Completá el título."); return; }
    setSaving(true); setErr("");
    const payload = { title: title.trim(), href: href.trim() || null, desc: desc.trim(), active };
    try {
      if (isNew) await Api.createBeneficio(payload);
      else await Api.updateBeneficio(id, payload);
      onDone();
    } catch (e2){
      setErr(e2.message);
      setSaving(false);
    }
  }

  if (loading) return <div className="admin-empty">Cargando…</div>;

  return (
    <>
      <div className="admin-head"><div><h1>{isNew ? "Nuevo beneficio" : "Editar beneficio"}</h1></div></div>
      <form className="admin-form" onSubmit={submit}>
        {err && <div className="admin-err">{err}</div>}
        <div className="admin-field"><label>Título</label><input type="text" value={title} onChange={e=>setTitle(e.target.value)}/></div>
        <div className="admin-field">
          <label>Enlace (opcional — interno como /socios/creditos, o externo con https://)</label>
          <input type="text" value={href} onChange={e=>setHref(e.target.value)} placeholder="/socios/creditos"/>
        </div>
        <div className="admin-field"><label>Descripción</label>
          <textarea rows={3} value={desc} onChange={e=>setDesc(e.target.value)}/>
        </div>
        <label className="admin-field" style={{display:"flex", alignItems:"center", gap:"8px", flexDirection:"row"}}>
          <input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} style={{width:"auto"}}/>
          <span style={{marginBottom:0}}>Activo (visible con enlace en el sitio; si no, se muestra como "Próximamente")</span>
        </label>
        <div className="admin-form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</button>
          <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        </div>
      </form>
    </>
  );
}

/* ---------- Mensajes: bandeja de envíos de los formularios públicos ---------- */
function MensajesInbox(){
  const [items, setItems] = useState(null);
  const [err, setErr] = useState("");
  const [openId, setOpenId] = useState(null);

  function load(){
    Api.listSubmissions().then(setItems).catch(e => setErr(e.message));
  }
  useEffect(load, []);

  async function toggleOpen(it){
    const opening = openId !== it.id;
    setOpenId(opening ? it.id : null);
    if (opening && !it.read){
      try {
        const updated = await Api.markSubmissionRead(it.id, true);
        setItems(items.map(x => x.id === it.id ? updated : x));
      } catch { /* no crítico si falla */ }
    }
  }

  async function handleDelete(it){
    if (!window.confirm("¿Borrar este mensaje?")) return;
    try { await Api.deleteSubmission(it.id); setItems(items.filter(x => x.id !== it.id)); }
    catch (e){ alert("No se pudo borrar: " + e.message); }
  }

  const unreadCount = items ? items.filter(i => !i.read).length : 0;

  return (
    <>
      <div className="admin-head">
        <div><h1>Mensajes</h1><p>{items ? `${items.length} recibidos · ${unreadCount} sin leer` : "Cargando…"}</p></div>
      </div>
      {err && <div className="admin-err">{err}</div>}
      {items && (
        <div className="admin-list">
          {items.length === 0 ? (
            <div className="admin-empty">Todavía no llegó ningún mensaje.</div>
          ) : items.map(it => {
            const preview = it.data.name || it.data.email || Object.values(it.data)[0] || "";
            const isOpen = openId === it.id;
            return (
              <div key={it.id} style={{borderBottom:"1px solid var(--line)"}}>
                <div className="admin-row" style={{gridTemplateColumns:"110px 1fr 150px 130px", cursor:"pointer", border:0}}
                  onClick={()=>toggleOpen(it)}>
                  <div style={{fontSize:"12px", color:"var(--muted)"}}>{it.kind}</div>
                  <div className="admin-row-title" style={{fontWeight: it.read ? "500" : "700"}}>
                    {!it.read && <span style={{color:"var(--gold)"}}>● </span>}{preview}
                  </div>
                  <div className="admin-row-date">{new Date(it.created_at.replace(" ","T")+"Z").toLocaleString("es-PY")}</div>
                  <div className="admin-row-actions">
                    <button onClick={(e)=>{ e.stopPropagation(); handleDelete(it); }}>Borrar</button>
                  </div>
                </div>
                {isOpen && (
                  <div style={{padding:"16px 20px 20px", background:"var(--paper)"}}>
                    {Object.entries(it.data).map(([k,v]) => (
                      <div key={k} style={{display:"flex", gap:"10px", fontSize:"13.5px", padding:"4px 0"}}>
                        <strong style={{minWidth:"140px", color:"var(--ink-soft)"}}>{k}:</strong>
                        <span>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ---------- Secciones aún no disponibles ---------- */
function ComingSoon({ label }){
  return (
    <div className="admin-soon">
      <h2>{label}</h2>
      <p>Esta sección todavía no está disponible en el panel — próximamente.</p>
    </div>
  );
}

/* ================= Aula Virtual: Alumnos ================= */
function StudentsList({ onNew, onEdit, reloadToken }){
  const [items, setItems] = useState(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  useEffect(()=>{
    let alive = true; setItems(null);
    Api.listStudents().then(d => { if (alive) setItems(d); }).catch(e => { if (alive) setErr(e.message); });
    return ()=>{ alive = false; };
  }, [reloadToken]);

  const filtered = useMemo(()=>{
    if (!items) return [];
    const nq = q.trim().toLowerCase();
    if (!nq) return items;
    return items.filter(s => s.name.toLowerCase().includes(nq) || s.email.toLowerCase().includes(nq) || (s.matricula||"").toLowerCase().includes(nq));
  }, [items, q]);

  async function handleDelete(s){
    if (!window.confirm(`¿Borrar al alumno "${s.name}"? Se eliminan sus matrículas y su progreso.`)) return;
    try { await Api.deleteStudent(s.id); setItems(items.filter(x => x.id !== s.id)); }
    catch (e){ alert("No se pudo borrar: " + e.message); }
  }

  return (
    <>
      <div className="admin-head">
        <div><h1>Alumnos</h1><p>{items ? `${items.length} alumnos registrados` : "Cargando…"}</p></div>
        <button className="btn btn-primary" onClick={onNew}>+ Nuevo alumno</button>
      </div>
      <div className="admin-search"><span>🔍</span><input placeholder="Buscar por nombre, correo o matrícula…" value={q} onChange={e=>setQ(e.target.value)}/></div>
      {err && <div className="admin-err">{err}</div>}
      {items && (
        <div className="admin-list">
          {filtered.length === 0 ? <div className="admin-empty">No hay alumnos que coincidan.</div> : filtered.map(s => (
            <div className="admin-row admin-row--student" key={s.id}>
              <div className="admin-row-title">{s.name}<span className="admin-row-sub">{s.email}{s.matricula ? ` · Mat. ${s.matricula}` : ""}</span></div>
              <div className="admin-row-date">{s.courses} curso{s.courses === 1 ? "" : "s"}{!s.active && <span className="tag-off">Inactivo</span>}</div>
              <div className="admin-row-actions">
                <button onClick={()=>onEdit(s.id)}>Editar</button>
                <button onClick={()=>handleDelete(s)}>Borrar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function StudentEditor({ id, onDone, onCancel, onCreated }){
  const isNew = id == null;
  const [loading, setLoading] = useState(!isNew);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [matricula, setMatricula] = useState("");
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(true);
  const [courses, setCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [pick, setPick] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(()=>{ Api.listLmsCourses().then(setAllCourses).catch(()=>{}); }, []);
  useEffect(()=>{
    if (isNew){ setLoading(false); return; }
    let alive = true;
    Api.getStudent(id).then(s => {
      if (!alive) return;
      setName(s.name); setEmail(s.email); setMatricula(s.matricula || ""); setActive(!!s.active);
      setCourses(s.courses || []); setLoading(false);
    }).catch(e => { if (alive){ setErr(e.message); setLoading(false); } });
    return ()=>{ alive = false; };
  }, [id]);

  async function submit(e){
    e.preventDefault();
    if (!name.trim() || !email.trim()){ setErr("Completá nombre y correo."); return; }
    if (isNew && password.length < 4){ setErr("La contraseña debe tener al menos 4 caracteres."); return; }
    setSaving(true); setErr("");
    const payload = { name: name.trim(), email: email.trim(), matricula: matricula.trim() || null, active };
    if (password) payload.password = password;
    try {
      if (isNew){ const s = await Api.createStudent(payload); onCreated(s.id); }
      else { await Api.updateStudent(id, payload); onDone(); }
    } catch (e2){ setErr(e2.message); setSaving(false); }
  }

  async function addCourse(){
    if (!pick) return;
    try { await Api.enrollStudent(id, Number(pick)); const s = await Api.getStudent(id); setCourses(s.courses || []); setPick(""); }
    catch (e){ alert("No se pudo matricular: " + e.message); }
  }
  async function removeCourse(courseId){
    try { await Api.unenrollStudent(id, courseId); setCourses(courses.filter(c => c.id !== courseId)); }
    catch (e){ alert("No se pudo quitar: " + e.message); }
  }

  if (loading) return <div className="admin-empty">Cargando…</div>;
  const enrolledIds = new Set(courses.map(c => c.id));
  const available = allCourses.filter(c => !enrolledIds.has(c.id));

  return (
    <form className="admin-form" onSubmit={submit}>
      <div className="admin-head" style={{ marginBottom: 20 }}><h1 style={{ fontSize: 22 }}>{isNew ? "Nuevo alumno" : "Editar alumno"}</h1></div>
      {err && <div className="admin-err">{err}</div>}
      <div className="admin-field"><label>Nombre y apellido</label><input type="text" value={name} onChange={e=>setName(e.target.value)} autoFocus/></div>
      <div className="admin-row-2">
        <div className="admin-field"><label>Correo (usuario para ingresar)</label><input type="text" value={email} onChange={e=>setEmail(e.target.value)}/></div>
        <div className="admin-field"><label>Matrícula (opcional)</label><input type="text" value={matricula} onChange={e=>setMatricula(e.target.value)}/></div>
      </div>
      <div className="admin-row-2">
        <div className="admin-field"><label>{isNew ? "Contraseña" : "Nueva contraseña (vacío = no cambiar)"}</label><input type="text" value={password} onChange={e=>setPassword(e.target.value)} placeholder={isNew ? "" : "••••••"}/></div>
        <div className="admin-field"><label>Estado</label><label className="admin-check"><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)}/> Activo (puede ingresar)</label></div>
      </div>

      {!isNew && (
        <div className="admin-enroll">
          <h3>Cursos matriculados</h3>
          {courses.length === 0 ? <p className="admin-enroll-empty">Todavía no está matriculado en ningún curso.</p> : (
            <div className="enroll-chips">
              {courses.map(c => <span className="enroll-chip" key={c.id}>{c.title}<button type="button" onClick={()=>removeCourse(c.id)} title="Quitar matrícula">×</button></span>)}
            </div>
          )}
          <div className="enroll-add">
            <select value={pick} onChange={e=>setPick(e.target.value)}>
              <option value="">Elegí un curso para matricular…</option>
              {available.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <button type="button" className="btn" onClick={addCourse} disabled={!pick}>Matricular</button>
          </div>
        </div>
      )}

      <div className="admin-form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Guardando…" : (isNew ? "Crear alumno" : "Guardar cambios")}</button>
        <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
      </div>
      {isNew && <p className="admin-hint">Después de crear el alumno vas a poder matricularlo en cursos.</p>}
    </form>
  );
}

/* ================= Aula Virtual: contenido de cursos ================= */
function CourseContentList({ onManage, reloadToken }){
  const [items, setItems] = useState(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  useEffect(()=>{
    let alive = true; setItems(null);
    Api.listLmsCourses().then(d => { if (alive) setItems(d); }).catch(e => { if (alive) setErr(e.message); });
    return ()=>{ alive = false; };
  }, [reloadToken]);
  const filtered = useMemo(()=>{
    if (!items) return [];
    const nq = q.trim().toLowerCase();
    return nq ? items.filter(c => (c.title||"").toLowerCase().includes(nq)) : items;
  }, [items, q]);
  return (
    <>
      <div className="admin-head"><div><h1>Contenido de cursos</h1><p>Armá los módulos y lecciones (videos) de cada curso del Aula Virtual.</p></div></div>
      <div className="admin-search"><span>🔍</span><input placeholder="Buscar curso…" value={q} onChange={e=>setQ(e.target.value)}/></div>
      {err && <div className="admin-err">{err}</div>}
      {items && (
        <div className="admin-list">
          {filtered.length === 0 ? <div className="admin-empty">No hay cursos. Creá primero un curso en la sección "Cursos".</div> : filtered.map(c => (
            <div className="admin-row admin-row--course" key={c.id}>
              <div className="admin-row-thumb">{c.img && <img src={"/" + c.img.replace(/^\.\.\//,"")} alt="" loading="lazy"/>}</div>
              <div className="admin-row-title">{c.title}<span className="admin-row-sub">{c.modules} módulo{c.modules === 1 ? "" : "s"} · {c.lessons} lección{c.lessons === 1 ? "" : "es"} · {c.students} alumno{c.students === 1 ? "" : "s"}</span></div>
              <div className="admin-row-actions"><button onClick={()=>onManage(c.id)}>Gestionar contenido</button></div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function CourseContentEditor({ courseId, onBack }){
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState(null);
  const [newModule, setNewModule] = useState("");
  const [err, setErr] = useState("");

  function reload(){ Api.getCourseModules(courseId).then(setModules).catch(e => setErr(e.message)); }
  useEffect(()=>{
    Api.listLmsCourses().then(cs => setCourse(cs.find(c => c.id === Number(courseId)) || { title: "Curso" })).catch(()=>{});
    reload();
  }, [courseId]);

  async function addModule(e){
    e.preventDefault();
    if (!newModule.trim()) return;
    try { await Api.createModule(courseId, newModule.trim()); setNewModule(""); reload(); }
    catch (e2){ alert(e2.message); }
  }
  async function renameModule(m){
    const t = window.prompt("Nuevo nombre del módulo:", m.title);
    if (t == null || !t.trim()) return;
    try { await Api.updateModule(m.id, t.trim()); reload(); } catch (e){ alert(e.message); }
  }
  async function deleteModule(m){
    if (!window.confirm(`¿Borrar el módulo "${m.title}" y todas sus lecciones?`)) return;
    try { await Api.deleteModule(m.id); reload(); } catch (e){ alert(e.message); }
  }

  return (
    <>
      <button type="button" className="admin-back" onClick={onBack}>← Volver a los cursos</button>
      <div className="admin-head"><div><h1>{course ? course.title : "…"}</h1><p>Módulos y lecciones del curso</p></div></div>
      {err && <div className="admin-err">{err}</div>}
      {modules === null ? <div className="admin-empty">Cargando…</div> : (
        <div className="mod-list">
          {modules.map(m => <ModuleCard key={m.id} module={m} onChanged={reload} onRename={()=>renameModule(m)} onDelete={()=>deleteModule(m)}/>)}
          {modules.length === 0 && <div className="mod-empty">Este curso todavía no tiene módulos. Agregá el primero abajo.</div>}
        </div>
      )}
      <form className="mod-add" onSubmit={addModule}>
        <input type="text" placeholder="Nombre del nuevo módulo (ej. Módulo 1 — Introducción)" value={newModule} onChange={e=>setNewModule(e.target.value)}/>
        <button type="submit" className="btn btn-primary" disabled={!newModule.trim()}>+ Agregar módulo</button>
      </form>
    </>
  );
}

function ModuleCard({ module, onChanged, onRename, onDelete }){
  const [adding, setAdding] = useState(false);
  return (
    <div className="mod-card">
      <div className="mod-card-head">
        <h3>{module.title}</h3>
        <div className="mod-card-actions">
          <button type="button" onClick={onRename}>Renombrar</button>
          <button type="button" onClick={onDelete}>Borrar</button>
        </div>
      </div>
      <div className="les-list">
        {module.lessons.length === 0 && <p className="les-empty">Sin lecciones todavía.</p>}
        {module.lessons.map(l => <LessonRow key={l.id} lesson={l} onChanged={onChanged}/>)}
      </div>
      {adding ? (
        <LessonForm moduleId={module.id} onDone={()=>{ setAdding(false); onChanged(); }} onCancel={()=>setAdding(false)}/>
      ) : (
        <button type="button" className="les-add" onClick={()=>setAdding(true)}>+ Agregar lección</button>
      )}
    </div>
  );
}

function LessonRow({ lesson, onChanged }){
  const [editing, setEditing] = useState(false);
  async function del(){
    if (!window.confirm(`¿Borrar la lección "${lesson.title}"?`)) return;
    try { await Api.deleteLesson(lesson.id); onChanged(); } catch (e){ alert(e.message); }
  }
  if (editing) return <LessonForm moduleId={lesson.module_id} lesson={lesson} onDone={()=>{ setEditing(false); onChanged(); }} onCancel={()=>setEditing(false)}/>;
  return (
    <div className="les-row">
      <span className="les-ic">{lesson.is_live ? "🔴" : (lesson.video_path ? "▶" : "•")}</span>
      <div className="les-main">
        <div className="les-title">{lesson.title}</div>
        <div className="les-meta">{lesson.is_live ? "Clase en vivo" : (lesson.video_path ? "Video cargado" : "Sin video")}</div>
      </div>
      <div className="les-actions">
        <button type="button" onClick={()=>setEditing(true)}>Editar</button>
        <button type="button" onClick={del}>Borrar</button>
      </div>
    </div>
  );
}

function LessonForm({ moduleId, lesson, onDone, onCancel }){
  const isNew = !lesson;
  const [title, setTitle] = useState(lesson ? lesson.title : "");
  const [description, setDescription] = useState(lesson ? (lesson.description || "") : "");
  const [videoPath, setVideoPath] = useState(lesson ? (lesson.video_path || "") : "");
  const [isLive, setIsLive] = useState(lesson ? !!lesson.is_live : false);
  const [liveUrl, setLiveUrl] = useState(lesson ? (lesson.live_url || "") : "");
  const [progress, setProgress] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function handleVideo(e){
    const file = e.target.files[0]; if (!file) return;
    setProgress(0); setErr("");
    try { const path = await Api.uploadVideo(file, setProgress); setVideoPath(path); setProgress(null); }
    catch (e2){ setErr(e2.message); setProgress(null); }
  }
  async function submit(e){
    e.preventDefault();
    if (!title.trim()){ setErr("Falta el título de la lección."); return; }
    setSaving(true); setErr("");
    const payload = { title: title.trim(), description: description.trim(), video_path: videoPath || null, is_live: isLive, live_url: isLive ? (liveUrl.trim() || null) : null };
    try {
      if (isNew) await Api.createLesson(moduleId, payload);
      else await Api.updateLesson(lesson.id, payload);
      onDone();
    } catch (e2){ setErr(e2.message); setSaving(false); }
  }
  return (
    <form className="les-form" onSubmit={submit}>
      {err && <div className="admin-err" style={{ marginBottom: 12 }}>{err}</div>}
      <div className="admin-field"><label>Título de la lección</label><input type="text" value={title} onChange={e=>setTitle(e.target.value)} autoFocus/></div>
      <div className="admin-field"><label>Descripción (opcional)</label><textarea value={description} onChange={e=>setDescription(e.target.value)}/></div>
      <div className="admin-field">
        <label>Video de la lección</label>
        {videoPath ? (
          <div className="les-video-ok">✔ Video cargado <button type="button" onClick={()=>setVideoPath("")}>Quitar</button></div>
        ) : progress !== null ? (
          <div className="les-progress"><div className="les-progress-bar" style={{ width: progress + "%" }}></div><span>{progress}%</span></div>
        ) : (
          <input type="file" accept="video/*" onChange={handleVideo}/>
        )}
      </div>
      <label className="admin-check"><input type="checkbox" checked={isLive} onChange={e=>setIsLive(e.target.checked)}/> Es una clase en vivo (el método de transmisión se define más adelante)</label>
      {isLive && <div className="admin-field" style={{ marginTop: 12 }}><label>Enlace de la transmisión (opcional por ahora)</label><input type="text" value={liveUrl} onChange={e=>setLiveUrl(e.target.value)} placeholder="Se completará cuando definamos el método de transmisión"/></div>}
      <div className="les-form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving || progress !== null}>{saving ? "Guardando…" : (isNew ? "Agregar lección" : "Guardar")}</button>
        <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}

/* ---------- Shell (sidebar + contenido) ---------- */
function AdminShell({ username, onLogout }){
  const [section, setSection] = useState("noticias");
  const [view, setView] = useState({ name: "list" });
  const [reloadToken, setReloadToken] = useState(0);

  const current = SECTIONS.find(s => s.key === section);

  function goList(){ setView({ name: "list" }); setReloadToken(v=>v+1); }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img src={LOGO_SRC} alt="AMJP"/>
          <span>Panel AMJP</span>
        </div>
        <nav className="admin-nav">
          {SECTIONS.map(s => (
            <button
              key={s.key}
              className={"admin-nav-item" + (section===s.key?" is-active":"") + (!s.enabled?" is-disabled":"")}
              disabled={!s.enabled}
              onClick={()=>{ setSection(s.key); setView({ name:"list" }); }}>
              {s.label}
              {!s.enabled && <span className="admin-nav-tag">Pronto</span>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <div className="admin-user">Conectado como <strong>{username}</strong></div>
          <button className="admin-logout" onClick={onLogout}>Cerrar sesión</button>
        </div>
      </aside>

      <main className="admin-main">
        {!current.enabled ? (
          <ComingSoon label={current.label}/>
        ) : section === "alumnos" ? (
          view.name === "list" ? (
            <StudentsList
              reloadToken={reloadToken}
              onNew={()=>setView({ name:"new" })}
              onEdit={(id)=>setView({ name:"edit", id })}
            />
          ) : (
            <StudentEditor
              id={view.name==="edit" ? view.id : null}
              onDone={goList} onCancel={goList}
              onCreated={(id)=>setView({ name:"edit", id })}
            />
          )
        ) : section === "aula" ? (
          view.name === "list" ? (
            <CourseContentList reloadToken={reloadToken} onManage={(id)=>setView({ name:"manage", id })}/>
          ) : (
            <CourseContentEditor courseId={view.id} onBack={goList}/>
          )
        ) : section === "galeria" ? (
          view.name === "list" ? (
            <GalleryList
              reloadToken={reloadToken}
              onNew={()=>setView({ name:"new" })}
              onEdit={(id)=>setView({ name:"edit", id })}
            />
          ) : (
            <GalleryAlbumEditor
              id={view.name==="edit" ? view.id : null}
              onDone={goList}
              onCancel={goList}
              onCreated={(newId)=>setView({ name:"edit", id:newId })}
            />
          )
        ) : section === "comision" ? (
          <ComisionDirectivaEditor/>
        ) : section === "estatutos" ? (
          <EstatutosEditor/>
        ) : section === "expresidentes" ? (
          view.name === "list" ? (
            <ExpresidentesList
              reloadToken={reloadToken}
              onNew={()=>setView({ name:"new" })}
              onEdit={(id)=>setView({ name:"edit", id })}
            />
          ) : (
            <ExpresidenteEditor id={view.name==="edit" ? view.id : null} onDone={goList} onCancel={goList}/>
          )
        ) : section === "beneficios" ? (
          view.name === "list" ? (
            <BeneficiosList
              reloadToken={reloadToken}
              onNew={()=>setView({ name:"new" })}
              onEdit={(id)=>setView({ name:"edit", id })}
            />
          ) : (
            <BeneficioEditor id={view.name==="edit" ? view.id : null} onDone={goList} onCancel={goList}/>
          )
        ) : section === "mensajes" ? (
          <MensajesInbox/>
        ) : view.name === "list" ? (
          <ArticleList
            section={section} label={current.label} reloadToken={reloadToken}
            onNew={()=>setView({ name:"new" })}
            onEdit={(id)=>setView({ name:"edit", id })}
          />
        ) : (
          <ArticleEditor
            section={section} label={current.label}
            id={view.name==="edit" ? view.id : null}
            onDone={goList}
            onCancel={goList}
          />
        )}
      </main>
    </div>
  );
}

/* ---------- App raíz ---------- */
function App(){
  const [me, setMe] = useState(undefined); // undefined=cargando, null=sin sesión, string=usuario

  useEffect(()=>{
    Api.me().then(data => setMe(data.authenticated ? data.username : null)).catch(()=>setMe(null));
  }, []);

  async function handleLogout(){
    await Api.logout().catch(()=>{});
    setMe(null);
  }

  if (me === undefined) return <div className="spinner-wrap">Cargando…</div>;
  if (me === null) return <LoginScreen onLoggedIn={setMe}/>;
  return <AdminShell username={me} onLogout={handleLogout}/>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
