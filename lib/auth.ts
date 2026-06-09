import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink, admin as adminPlugin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { authDb } from "@/lib/db/auth-db";
import { user } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { ac, superadmin, admin, artiste } from "@/lib/permissions";

const YEAR_IN_SECONDS = 60 * 60 * 24 * 365;
const WEEK_IN_SECONDS = 60 * 60 * 24 * 7;

export const auth = betterAuth({
  appName: "ARTémis Records",
  database: drizzleAdapter(authDb, { provider: "pg" }),

  // Connexion par magic link uniquement : pas de mot de passe, pas de social.
  user: {
    additionalFields: {
      // Compte artiste → fiche `artists`. Renseigné à l'invitation, jamais par
      // le client (input: false).
      artistId: { type: "string", required: false, input: false },
      // Prénom / nom séparés, renseignés à l'acceptation de l'invitation.
      // Exposés sur la session pour l'affichage (salutation, sidebar).
      firstName: { type: "string", required: false, input: false },
      lastName: { type: "string", required: false, input: false },
    },
    // Changement de l'adresse de connexion. L'email étant vérifié à la première
    // connexion magic link, un lien de confirmation est envoyé à l'adresse
    // ACTUELLE : le changement n'est appliqué qu'une fois ce lien cliqué.
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        await sendEmail({
          to: user.email,
          subject: "Confirmez le changement d'adresse · ARTémis Records",
          text: `Confirmez le changement de votre adresse de connexion vers ${newEmail} : ${url}`,
          html: changeEmailEmail(url, newEmail),
        });
      },
    },
  },

  // Session quasi-permanente : 1 an, rafraîchie chaque semaine d'activité.
  // Révoquée uniquement au signOut explicite.
  session: {
    expiresIn: YEAR_IN_SECONDS,
    updateAge: WEEK_IN_SECONDS,
  },

  plugins: [
    magicLink({
      // Invite-only : un email absent de la base ne reçoit aucun lien.
      disableSignUp: true,
      expiresIn: 60 * 15,
      sendMagicLink: async ({ email, url }) => {
        // `disableSignUp` ne bloque qu'au CLIC du lien (new_user_signup_disabled),
        // pas à l'envoi : sans ce check, un inconnu recevrait quand même un email.
        // Invite-only → compte inexistant = aucun envoi, réponse neutre (pas de
        // fuite d'information sur l'existence du compte).
        const [existing] = await authDb
          .select({ id: user.id })
          .from(user)
          .where(eq(user.email, email.toLowerCase()))
          .limit(1);
        if (!existing) return;

        await sendEmail({
          to: email,
          subject: "Votre lien de connexion · ARTémis Records",
          text: `Connectez-vous à l'espace label : ${url}`,
          html: magicLinkEmail(url),
        });
      },
    }),
    adminPlugin({
      ac,
      roles: { superadmin, admin, artiste },
      adminRoles: ["superadmin", "admin"],
      defaultRole: "artiste",
    }),
    // Doit rester le dernier plugin (gère les cookies dans les Server Actions).
    nextCookies(),
  ],
});

function magicLinkEmail(url: string) {
  return `<!doctype html>
<html lang="fr"><body style="margin:0;background:#f4efe6;font-family:Georgia,serif;color:#1b1c2e">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:440px;background:#fff;border:1px solid rgba(27,28,46,.12);border-radius:4px;padding:36px">
        <tr><td>
          <p style="text-transform:uppercase;letter-spacing:.18em;font-size:11px;font-weight:bold;color:#c0356e;margin:0 0 8px">ARTémis Records · Espace label</p>
          <h1 style="font-size:24px;margin:0 0 12px;font-weight:normal">Votre lien de connexion</h1>
          <p style="font-size:15px;line-height:1.6;color:#555;margin:0 0 24px">Cliquez ci-dessous pour vous connecter. Ce lien expire dans 15 minutes et ne fonctionne qu'une fois.</p>
          <a href="${url}" style="display:inline-block;background:#1b1c2e;color:#f4efe6;text-decoration:none;font-size:13px;letter-spacing:.12em;text-transform:uppercase;font-weight:bold;padding:14px 28px;border-radius:2px">Se connecter →</a>
          <p style="font-size:12px;line-height:1.6;color:#999;margin:24px 0 0">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function changeEmailEmail(url: string, newEmail: string) {
  return `<!doctype html>
<html lang="fr"><body style="margin:0;background:#f4efe6;font-family:Georgia,serif;color:#1b1c2e">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:440px;background:#fff;border:1px solid rgba(27,28,46,.12);border-radius:4px;padding:36px">
        <tr><td>
          <p style="text-transform:uppercase;letter-spacing:.18em;font-size:11px;font-weight:bold;color:#c0356e;margin:0 0 8px">ARTémis Records · Espace label</p>
          <h1 style="font-size:24px;margin:0 0 12px;font-weight:normal">Confirmez le changement d'adresse</h1>
          <p style="font-size:15px;line-height:1.6;color:#555;margin:0 0 24px">Une demande a été faite pour remplacer votre adresse de connexion par <strong>${newEmail}</strong>. Cliquez ci-dessous pour la valider.</p>
          <a href="${url}" style="display:inline-block;background:#1b1c2e;color:#f4efe6;text-decoration:none;font-size:13px;letter-spacing:.12em;text-transform:uppercase;font-weight:bold;padding:14px 28px;border-radius:2px">Confirmer le changement →</a>
          <p style="font-size:12px;line-height:1.6;color:#999;margin:24px 0 0">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre adresse restera inchangée.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export type AppSession = typeof auth.$Infer.Session;
