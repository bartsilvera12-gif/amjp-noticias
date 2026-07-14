// Envío de correos del sitio (nodemailer).
// Se configura por variables de entorno (.env). Si no está configurado, NO falla:
// registra un aviso y sigue, para que el sitio funcione igual en desarrollo.
import nodemailer from "nodemailer";

const {
  SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM,
  SITE_URL,
} = process.env;

export const SITE = (SITE_URL || "http://localhost:5173").replace(/\/+$/, "");
export const AULA_URL = `${SITE}/amjp/#/socios/aula-virtual`;

export function isMailConfigured(){
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

let transporter = null;
function getTransporter(){
  if (!isMailConfigured()) return null;
  if (!transporter){
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: String(SMTP_SECURE) === "true" || Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

// Envía un correo. Devuelve {sent:true} o {sent:false, skipped/error}. Nunca lanza.
export async function sendMail({ to, subject, html, text }){
  const tx = getTransporter();
  if (!tx){
    console.warn(`[mailer] SMTP no configurado — se omite el correo "${subject}" a ${to}`);
    return { sent: false, skipped: true };
  }
  try {
    await tx.sendMail({ from: MAIL_FROM || SMTP_USER, to, subject, html, text });
    return { sent: true };
  } catch (err){
    console.error(`[mailer] Error enviando "${subject}" a ${to}:`, err.message);
    return { sent: false, error: err.message };
  }
}

// Plantilla de bienvenida al inscribirse a un curso.
export function welcomeCourseEmail({ name, course, email, password, isNew }){
  const subject = `Bienvenido/a al curso: ${course}`;
  const saludo = `Hola ${name},`;
  const credencialesHtml = isNew ? `
    <p>Ya podés acceder al <strong>Aula Virtual</strong> con estos datos:</p>
    <table style="border-collapse:collapse;margin:8px 0 16px">
      <tr><td style="padding:6px 14px 6px 0;color:#555">Usuario:</td><td style="padding:6px 0"><strong>${email}</strong></td></tr>
      <tr><td style="padding:6px 14px 6px 0;color:#555">Contraseña:</td><td style="padding:6px 0"><strong>${password}</strong> (tu número de cédula)</td></tr>
    </table>
    <p style="color:#666;font-size:13px">Por seguridad, te recomendamos cambiar la contraseña después de tu primer ingreso.</p>
  ` : `
    <p>Ya tenés acceso a este curso en el <strong>Aula Virtual</strong>. Ingresá con tu usuario habitual:</p>
    <table style="border-collapse:collapse;margin:8px 0 16px">
      <tr><td style="padding:6px 14px 6px 0;color:#555">Usuario:</td><td style="padding:6px 0"><strong>${email}</strong></td></tr>
    </table>
  `;
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a212c;line-height:1.6">
    <h2 style="font-family:Georgia,serif;color:#0c1a30">Asociación de Magistrados Judiciales del Paraguay</h2>
    <p>${saludo}</p>
    <p>Confirmamos tu inscripción al curso <strong>${course}</strong>. ¡Te damos la bienvenida!</p>
    ${credencialesHtml}
    <p><a href="${AULA_URL}" style="display:inline-block;background:#b08a3c;color:#fff;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:bold">Ir al Aula Virtual</a></p>
    <p style="color:#888;font-size:12px;margin-top:24px">Si no solicitaste esta inscripción, ignorá este correo o comunicate con la Secretaría de la AMJP.</p>
  </div>`;
  const text = [
    saludo,
    `Confirmamos tu inscripción al curso "${course}".`,
    isNew ? `Acceso al Aula Virtual:\n  Usuario: ${email}\n  Contraseña: ${password} (tu número de cédula)` : `Ya tenés acceso a este curso en el Aula Virtual. Usuario: ${email}`,
    `Aula Virtual: ${AULA_URL}`,
  ].join("\n\n");
  return { subject, html, text };
}
