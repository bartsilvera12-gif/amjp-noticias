# Despliegue del servidor AMJP

El **sitio público** es estático, pero el **panel de administración, el Aula Virtual,
la inscripción a cursos y los correos** corren sobre un **servidor Node (Express + SQLite)**.
Por eso NO alcanza con Vercel: hay que desplegarlo en un host que ejecute Node y ofrezca
un **volumen persistente** (para la base de datos y los archivos que se suben desde el panel).

Recomendado: **Railway** (el más simple). Alternativa: **Render**. También sirve un VPS.

---

## Qué necesita el host

- **Node 22.5 o superior** (el repo fija Node 24 en `.node-version` y `package.json`).
- Un **volumen persistente** montado (p. ej. en `/data`).
- Las **variables de entorno** de abajo.
- Arranque: `npm start` (ya definido; usa `node --experimental-sqlite server/server.js`).

## Variables de entorno

| Variable | Ejemplo | Para qué |
|---|---|---|
| `PORT` | *(la asigna el host)* | Puerto del servidor |
| `SESSION_SECRET` | *(cadena larga y aleatoria)* | Firma de las sesiones |
| `SITE_URL` | `https://amjp.up.railway.app` | Enlaces dentro de los correos |
| `DATABASE_PATH` | `/data/amjp.db` | Base de datos en el volumen |
| `UPLOADS_DIR` | `/data/uploads` | Archivos nuevos (panel) en el volumen |
| `SMTP_HOST` | `mail.amjp.org.py` | Servidor de correo |
| `SMTP_PORT` | `587` | Puerto SMTP |
| `SMTP_SECURE` | `false` | `true` si usás el puerto 465 |
| `SMTP_USER` | `info@amjp.org.py` | Usuario SMTP |
| `SMTP_PASS` | *(contraseña)* | Contraseña SMTP |
| `MAIL_FROM` | `AMJP <info@amjp.org.py>` | Remitente de los correos |

> La base y las imágenes históricas ya vienen en el repo. Al arrancar con un volumen
> vacío, el sistema **siembra solo** la base (`server/seed/amjp.db`) y sirve las imágenes
> incluidas; los archivos que subas después (imágenes/videos del panel) van al volumen.

---

## Railway (recomendado)

1. Asegurate de que el código esté en GitHub (ya está en el remoto `bartsilvera`).
2. Entrá a **railway.app** → **New Project** → **Deploy from GitHub repo** → elegí el repo `amjp-noticias`.
3. En el servicio, pestaña **Variables**: cargá las variables de la tabla de arriba.
4. Pestaña **Storage** (o **Volumes**) → **Add Volume** → *mount path* **`/data`**.
5. Railway detecta Node por `.node-version` (24) y corre `npm start` automáticamente.
6. **Settings → Networking → Generate Domain**: copiá la URL generada y pegala en `SITE_URL`.
7. Redeploy. Al primer arranque, la base se siembra sola y el sitio queda con su contenido.

## Render (alternativa)

1. **New → Web Service** → conectá el repo de GitHub.
2. **Build Command:** `npm install` · **Start Command:** `npm start`.
3. **Advanced → Add Disk:** *mount path* `/data`, tamaño p. ej. 2 GB.
4. **Environment:** cargá las mismas variables (Render también respeta `.node-version`).
5. Deploy. Copiá la URL pública a `SITE_URL` y volvé a desplegar.

---

## Después de desplegar

- **Panel:** `https://TU-DOMINIO/admin` — usuario `admin`, contraseña `amjp2026`
  (viene en la base semilla). **Conviene cambiarla** apenas esté en línea.
- **Correos:** verificá que lleguen (probá una inscripción). Si no salen, revisá las
  variables `SMTP_*` y los logs del servicio.
- **Videos de cursos:** subilos desde el panel una vez en producción (van al volumen).

## Notas

- Las sesiones usan memoria del proceso: con **una sola instancia** funciona bien.
  Si algún día escalás a varias instancias, habría que usar un store de sesiones externo.
- El `.env` local no se sube (está en `.gitignore`); en el host se cargan las variables
  desde el panel del proveedor.
