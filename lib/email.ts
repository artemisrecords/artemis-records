import nodemailer from "nodemailer";

export type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const FROM =
  process.env.EMAIL_FROM ?? "ARTémis Records <no-reply@artemis-records.fr>";

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

  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: user && pass ? { user, pass } : undefined,
  });
}

export async function sendEmail({ to, subject, html, text }: SendEmailArgs) {
  const transport = getTransport();
  await transport.sendMail({ from: FROM, to, subject, html, text });
}
