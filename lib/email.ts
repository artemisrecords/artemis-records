import nodemailer from "nodemailer";
import { Resend } from "resend";

export type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const FROM =
  process.env.EMAIL_FROM ?? "ARTémis Records <no-reply@artemisrecordslabel.com>";

/**
 * Transport email choisi par environnement (voir
 * docs/superpowers/specs/2026-05-22-auth-better-auth-design.md §6.1) :
 * - dev    : Nodemailer SMTP → Mailpit (localhost:1025, webmail :8025)
 * - preview: Nodemailer SMTP → Resend SMTP via SMTP_* (domaine vérifié requis)
 * - prod   : Resend via API (RESEND_API_KEY)
 */
async function sendViaResend({ to, subject, html, text }: SendEmailArgs) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY manquante en production.");
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
    text,
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}

function getTransport() {
  // dev + preview : un seul transport SMTP Nodemailer, piloté par SMTP_*.
  // dev → défauts Mailpit ; preview → SMTP_* renseignés vers Resend SMTP.
  const host = process.env.SMTP_HOST ?? "localhost";
  const port = Number(process.env.SMTP_PORT ?? 1025);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // TLS implicite sur 465, STARTTLS sinon (587 / 1025 Mailpit).
  // Surcharge possible via SMTP_SECURE pour les cas exotiques.
  const secure =
    process.env.SMTP_SECURE != null
      ? process.env.SMTP_SECURE === "true"
      : port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });
}

export async function sendEmail({ to, subject, html, text }: SendEmailArgs) {
  const env = process.env.VERCEL_ENV ?? "development";

  // Production : Resend via API. Toute erreur remonte — jamais de lien de
  // connexion dans les logs de prod.
  if (env === "production") {
    await sendViaResend({ to, subject, html, text });
    return;
  }

  // Dev/preview : on tente le SMTP configuré (Mailpit en dev, Resend SMTP en
  // preview). Si AUCUN serveur SMTP n'est joignable — typiquement un preview
  // sans SMTP_* où l'on retombe sur localhost:1025 (ECONNREFUSED) — on ne bloque
  // pas la connexion : on journalise le contenu (lien magique inclus) dans les
  // runtime logs Vercel, qui servent alors de « boîte de réception » de secours.
  try {
    const transport = getTransport();
    await transport.sendMail({ from: FROM, to, subject, html, text });
  } catch (err) {
    console.warn(
      `[email] Envoi SMTP impossible (${(err as Error).message}). ` +
        `Contenu destiné à ${to} — « ${subject} » :\n${text ?? html}`,
    );
  }
}
