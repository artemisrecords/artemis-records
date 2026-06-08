// Templates mail purs (aucun accès réseau / DB). Pas de `server-only` :
// `demoDecisionArtistDefaults` et `wrapArtistHtml` sont aussi utilisés côté
// client (DecisionDialog) pour pré-remplir le mot à l'artiste.

export type EmailContent = { subject: string; text: string; html: string };
export type Decision = "retenu" | "refuse";

const BRAND = "#c0356e"; // magenta
const INK = "#1b1c2e";
const PAPER = "#f4efe6";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

function shell(eyebrow: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="fr"><body style="margin:0;background:${PAPER};font-family:Georgia,serif;color:${INK}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:480px;background:#fff;border:1px solid rgba(27,28,46,.12);border-radius:4px;padding:36px">
        <tr><td>
          <p style="text-transform:uppercase;letter-spacing:.18em;font-size:11px;font-weight:bold;color:${BRAND};margin:0 0 16px">ARTémis Records · ${eyebrow}</p>
          ${bodyHtml}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function paras(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => escapeHtml(p).replace(/\n/g, "<br>"))
    .map(
      (p) =>
        `<p style="font-size:15px;line-height:1.65;color:#333;margin:0 0 16px">${p}</p>`,
    )
    .join("");
}

/** Accusé de réception envoyé à l'artiste à la soumission. */
export function demoReceiptArtist(artistName: string): EmailContent {
  const subject = "Votre démo est bien arrivée · ARTémis Records";
  const text = `Bonjour ${artistName},

Nous avons bien reçu votre démo. Merci de votre confiance.

Notre équipe l'écoute avec attention : vous aurez une réponse sous quinze jours ouvrés.

À très vite,
ARTémis Records`;
  return { subject, text, html: shell("Soumission reçue", paras(text)) };
}

/** Notification envoyée au label quand une démo arrive. */
export function demoNewLabel(input: {
  artist: string;
  contact: string;
  email: string;
  backofficeUrl: string;
}): EmailContent {
  const subject = `Nouvelle démo · ${input.artist}`;
  const text = `Une nouvelle démo vient d'arriver.

Projet : ${input.artist}
Contact : ${input.contact} (${input.email})

À traiter dans le backoffice : ${input.backofficeUrl}`;
  const html = shell(
    "Nouvelle démo",
    `${paras(`Projet : ${input.artist}\nContact : ${input.contact} (${input.email})`)}
     // URL construite côté serveur ; échappée par prudence.
     <a href="${escapeAttr(input.backofficeUrl)}" style="display:inline-block;background:${INK};color:${PAPER};text-decoration:none;font-size:13px;letter-spacing:.12em;text-transform:uppercase;font-weight:bold;padding:14px 28px;border-radius:2px">Ouvrir la boîte à démos →</a>`,
  );
  return { subject, text, html };
}

/** Sujet + corps PAR DÉFAUT du mail à l'artiste (éditable dans la modale). */
export function demoDecisionArtistDefaults(
  artistName: string,
  decision: Decision,
): { subject: string; body: string } {
  if (decision === "retenu") {
    return {
      subject: "Votre démo nous a touchés · ARTémis Records",
      body: `Bonjour ${artistName},

Votre démo a retenu toute notre attention. Nous aimerions échanger avec vous pour parler de la suite.

Nous revenons très vite vers vous pour convenir d'un moment.

Chaleureusement,
ARTémis Records`,
    };
  }
  return {
    subject: "Au sujet de votre démo · ARTémis Records",
    body: `Bonjour ${artistName},

Merci d'avoir partagé votre musique avec nous. Nous l'avons écoutée avec sincérité.

Nous ne donnerons pas suite cette fois-ci : ce choix tient à nos priorités du moment, pas à la valeur de votre travail. Continuez, nous serons heureux de vous réécouter.

Avec tout notre respect,
ARTémis Records`,
  };
}

/** Récap envoyé au label après une décision. */
export function demoDecisionLabel(input: {
  artist: string;
  decision: Decision;
  deciderName: string;
}): EmailContent {
  const verb = input.decision === "retenu" ? "retenue" : "refusée";
  const subject = `Démo ${verb} · ${input.artist}`;
  const text = `Décision enregistrée.

Projet : ${input.artist}
Décision : ${verb}
Par : ${input.deciderName}`;
  return { subject, text, html: shell("Décision démo", paras(text)) };
}

/**
 * Enrobe le corps (texte édité par l'admin) dans le HTML de marque.
 * `_subject` n'est pas rendu ici (le sujet du mail est posé par l'appelant
 * dans l'enveloppe SMTP) ; le paramètre est conservé pour la symétrie d'appel.
 */
export function wrapArtistHtml(_subject: string, body: string): string {
  return shell("Réponse à votre démo", paras(body));
}
