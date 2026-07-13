/* api.jsx — wrapper fetch para la API del panel de administración */
async function apiCall(path, options){
  const res = await fetch("/api" + path, {
    credentials: "same-origin",
    headers: options && options.body ? { "Content-Type": "application/json" } : undefined,
    ...options,
  });
  let data = null;
  try { data = await res.json(); } catch { /* respuesta sin cuerpo */ }
  if (!res.ok){
    throw new Error((data && data.error) || `Error ${res.status}`);
  }
  return data;
}

const Api = {
  me: () => apiCall("/me"),
  login: (username, password) => apiCall("/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  logout: () => apiCall("/logout", { method: "POST" }),

  listArticles: (section) => apiCall(`/articles?section=${encodeURIComponent(section)}`),
  getArticle: (id) => apiCall(`/articles/${id}`),
  createArticle: (data) => apiCall("/articles", { method: "POST", body: JSON.stringify(data) }),
  updateArticle: (id, data) => apiCall(`/articles/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteArticle: (id) => apiCall(`/articles/${id}`, { method: "DELETE" }),

  async uploadImage(file){
    const form = new FormData();
    form.append("image", file);
    const res = await fetch("/api/upload", { method: "POST", credentials: "same-origin", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al subir la imagen");
    return data.path;
  },

  listAlbums: () => apiCall("/gallery/albums"),
  getAlbum: (id) => apiCall(`/gallery/albums/${id}`),
  createAlbum: (data) => apiCall("/gallery/albums", { method: "POST", body: JSON.stringify(data) }),
  updateAlbum: (id, data) => apiCall(`/gallery/albums/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAlbum: (id) => apiCall(`/gallery/albums/${id}`, { method: "DELETE" }),
  updatePhoto: (id, data) => apiCall(`/gallery/photos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePhoto: (id) => apiCall(`/gallery/photos/${id}`, { method: "DELETE" }),

  async addPhotos(albumId, files){
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("photos", f));
    const res = await fetch(`/api/gallery/albums/${albumId}/photos`, { method: "POST", credentials: "same-origin", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al subir las fotos");
    return data;
  },

  getComisionDirectiva: () => apiCall("/comision-directiva"),
  updateComisionDirectiva: (data) => apiCall("/comision-directiva", { method: "PUT", body: JSON.stringify(data) }),

  getEstatutos: () => apiCall("/estatutos"),
  updateEstatutos: (html) => apiCall("/estatutos", { method: "PUT", body: JSON.stringify({ html }) }),

  listExpresidentes: () => apiCall("/expresidentes"),
  getExpresidente: (id) => apiCall(`/expresidentes/${id}`),
  createExpresidente: (data) => apiCall("/expresidentes", { method: "POST", body: JSON.stringify(data) }),
  updateExpresidente: (id, data) => apiCall(`/expresidentes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteExpresidente: (id) => apiCall(`/expresidentes/${id}`, { method: "DELETE" }),

  listBeneficios: () => apiCall("/beneficios"),
  getBeneficio: (id) => apiCall(`/beneficios/${id}`),
  createBeneficio: (data) => apiCall("/beneficios", { method: "POST", body: JSON.stringify(data) }),
  updateBeneficio: (id, data) => apiCall(`/beneficios/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteBeneficio: (id) => apiCall(`/beneficios/${id}`, { method: "DELETE" }),

  listSubmissions: () => apiCall("/submissions"),
  markSubmissionRead: (id, read=true) => apiCall(`/submissions/${id}`, { method: "PATCH", body: JSON.stringify({ read }) }),
  deleteSubmission: (id) => apiCall(`/submissions/${id}`, { method: "DELETE" }),

  // --- Aula Virtual: alumnos y matrículas ---
  listStudents: () => apiCall("/students"),
  getStudent: (id) => apiCall(`/students/${id}`),
  createStudent: (data) => apiCall("/students", { method: "POST", body: JSON.stringify(data) }),
  updateStudent: (id, data) => apiCall(`/students/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteStudent: (id) => apiCall(`/students/${id}`, { method: "DELETE" }),
  enrollStudent: (id, courseId) => apiCall(`/students/${id}/enrollments`, { method: "POST", body: JSON.stringify({ course_id: courseId }) }),
  unenrollStudent: (id, courseId) => apiCall(`/students/${id}/enrollments/${courseId}`, { method: "DELETE" }),

  // --- Aula Virtual: contenido de los cursos (módulos y lecciones) ---
  listLmsCourses: () => apiCall("/lms/courses"),
  getCourseModules: (courseId) => apiCall(`/lms/courses/${courseId}/modules`),
  createModule: (courseId, title) => apiCall(`/lms/courses/${courseId}/modules`, { method: "POST", body: JSON.stringify({ title }) }),
  updateModule: (id, title) => apiCall(`/lms/modules/${id}`, { method: "PUT", body: JSON.stringify({ title }) }),
  deleteModule: (id) => apiCall(`/lms/modules/${id}`, { method: "DELETE" }),
  createLesson: (moduleId, data) => apiCall(`/lms/modules/${moduleId}/lessons`, { method: "POST", body: JSON.stringify(data) }),
  updateLesson: (id, data) => apiCall(`/lms/lessons/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteLesson: (id) => apiCall(`/lms/lessons/${id}`, { method: "DELETE" }),

  // Subida de video con progreso (XHR: los videos son grandes y conviene mostrar avance).
  uploadVideo(file, onProgress){
    return new Promise((resolve, reject) => {
      const form = new FormData();
      form.append("video", file);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/video");
      xhr.withCredentials = true;
      xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = () => {
        let data = null;
        try { data = JSON.parse(xhr.responseText); } catch { /* sin cuerpo */ }
        if (xhr.status >= 200 && xhr.status < 300) resolve(data.path);
        else reject(new Error((data && data.error) || "Error al subir el video"));
      };
      xhr.onerror = () => reject(new Error("Error de red al subir el video"));
      xhr.send(form);
    });
  },
};
