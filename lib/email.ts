import nodemailer from "nodemailer";

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
 * - preview: Nodemailer SMTP → sandbox (Mailtrap/Ethereal) via SMTP_*
 * - prod   : Resend (préparé, pas encore implémenté)
 */
function getTransport() {
  const env = process.env.VERCEL_ENV ?? "development";

  if (env === "production") {
    // TODO(auth): brancher Resend via RESEND_API_KEY.
    throw new Error(
      "Transport email production (Resend) pas encore implémenté. Voir lib/email.ts.",
    );
  }

  // dev + preview : un seul transport SMTP Nodemailer, piloté par SMTP_*.
  // dev → défauts Mailpit ; preview → SMTP_* renseignés vers un sandbox.
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

  // Dev/preview : on tente le SMTP configuré (Mailpit en dev, sandbox en
  // preview). Si AUCUN serveur SMTP n'est joignable — typiquement un preview
  // sans SMTP_* où l'on retombe sur localhost:1025 (ECONNREFUSED) — on ne bloque
  // pas la connexion : on journalise le contenu (lien magique inclus) dans les
  // runtime logs Vercel, qui servent alors de « boîte de réception » de secours.
  // En production, `getTransport()` lève déjà (Resend pas branché) : on laisse
  // remonter, jamais de lien de connexion dans les logs de prod.
  try {
    const transport = getTransport();
    await transport.sendMail({ from: FROM, to, subject, html, text });
  } catch (err) {
    if (env === "production") throw err;
    console.warn(
      `[email] Envoi SMTP impossible (${(err as Error).message}). ` +
        `Contenu destiné à ${to} — « ${subject} » :\n${text ?? html}`,
    );
  }
}
