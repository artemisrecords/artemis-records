import { randomUUID, randomBytes } from "node:crypto";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { invitation, user, artists } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import type { Role } from "@/lib/permissions";

/** Qui peut inviter quel rôle (superadmin > admin > artiste). */
const INVITABLE: Record<Role, Role[]> = {
  superadmin: ["admin", "artiste"],
  admin: ["artiste"],
  artiste: [],
};

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 jours

function baseUrl() {
  return process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Crée une invitation et envoie l'email d'activation. Lève en cas d'erreur. */
export async function createInvitation(args: {
  inviterId: string;
  inviterRole: Role;
  email: string;
  role: Role;
  artistId?: string | null;
}) {
  const email = normalizeEmail(args.email);
  if (!email.includes("@")) throw new Error("Email invalide.");

  if (!INVITABLE[args.inviterRole]?.includes(args.role)) {
    throw new Error("Vous ne pouvez pas inviter ce rôle.");
  }

  if (args.role === "artiste") {
    if (!args.artistId) throw new Error("Sélectionnez la fiche artiste à lier.");
    const [artist] = await db
      .select({ id: artists.id })
      .from(artists)
      .where(eq(artists.id, args.artistId))
      .limit(1);
    if (!artist) throw new Error("Fiche artiste introuvable.");
    const [linked] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.artistId, args.artistId))
      .limit(1);
    if (linked) throw new Error("Cette fiche est déjà liée à un compte.");
  } else if (args.artistId) {
    throw new Error("Une fiche artiste ne se lie qu'à un compte artiste.");
  }

  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  if (existing) throw new Error("Un compte existe déjà pour cet email.");

  // Remplace toute invitation en attente pour cet email.
  await db
    .delete(invitation)
    .where(and(eq(invitation.email, email), isNull(invitation.acceptedAt)));

  const token = randomBytes(32).toString("base64url");
  await db.insert(invitation).values({
    id: randomUUID(),
    email,
    role: args.role,
    artistId: args.role === "artiste" ? args.artistId! : null,
    token,
    invitedBy: args.inviterId,
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
  });

  const url = `${baseUrl()}/accept-invitation?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Invitation · Espace ARTémis Records",
    text: `Vous avez été invité à rejoindre l'espace ARTémis Records. Activez votre compte : ${url}`,
    html: invitationEmail(url, args.role),
  });

  return { email, role: args.role };
}

/** Invitation encore valide pour ce token (non acceptée, non expirée), ou null. */
export async function getValidInvitation(token: string) {
  const [inv] = await db
    .select()
    .from(invitation)
    .where(
      and(
        eq(invitation.token, token),
        isNull(invitation.acceptedAt),
        gt(invitation.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return inv ?? null;
}

/**
 * Acceptation : crée le compte (sans mot de passe) avec le rôle de l'invitation,
 * marque l'invitation comme acceptée, puis envoie un magic link de connexion
 * (le compte existe désormais, `disableSignUp` ne bloque donc pas).
 */
export async function acceptInvitation(args: {
  token: string;
  firstName: string;
  lastName: string;
}) {
  const inv = await getValidInvitation(args.token);
  if (!inv) throw new Error("Invitation invalide ou expirée.");

  const firstName = args.firstName.trim();
  const lastName = args.lastName.trim();
  if (firstName.length < 2) throw new Error("Indiquez votre prénom.");
  // `name` (nom complet) reste la valeur canonique pour Better Auth.
  const name = [firstName, lastName].filter(Boolean).join(" ");

  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, inv.email))
    .limit(1);
  if (existing) throw new Error("Un compte existe déjà pour cet email.");

  await db.insert(user).values({
    id: randomUUID(),
    name,
    firstName,
    lastName: lastName || null,
    email: inv.email,
    emailVerified: true,
    role: inv.role,
    artistId: inv.artistId,
  });

  await db
    .update(invitation)
    .set({ acceptedAt: new Date() })
    .where(eq(invitation.id, inv.id));

  await auth.api.signInMagicLink({
    body: { email: inv.email, callbackURL: "/auth/landing" },
    headers: await headers(),
  });

  return { email: inv.email };
}

/** Comptes existants + invitations en attente, pour l'UI de gestion. */
export async function listAccounts() {
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      artistId: user.artistId,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));

  const pending = await db
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      artistId: invitation.artistId,
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
    })
    .from(invitation)
    .where(isNull(invitation.acceptedAt))
    .orderBy(desc(invitation.createdAt));

  return { users, pending };
}

export async function revokeInvitation(id: string) {
  await db
    .delete(invitation)
    .where(and(eq(invitation.id, id), isNull(invitation.acceptedAt)));
}

/** Supprime un compte (sessions/comptes liés supprimés en cascade). */
export async function deleteUserAccount(id: string) {
  await db.delete(user).where(eq(user.id, id));
}

function invitationEmail(url: string, role: Role) {
  const roleLabel =
    role === "admin" ? "administrateur" : role === "superadmin" ? "super administrateur" : "artiste";
  return `<!doctype html>
<html lang="fr"><body style="margin:0;background:#f4efe6;font-family:Georgia,serif;color:#1b1c2e">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:440px;background:#fff;border:1px solid rgba(27,28,46,.12);border-radius:4px;padding:36px">
        <tr><td>
          <p style="text-transform:uppercase;letter-spacing:.18em;font-size:11px;font-weight:bold;color:#c0356e;margin:0 0 8px">ARTémis Records · Espace label</p>
          <h1 style="font-size:24px;margin:0 0 12px;font-weight:normal">Vous êtes invité</h1>
          <p style="font-size:15px;line-height:1.6;color:#555;margin:0 0 24px">Un accès <strong>${roleLabel}</strong> vous a été ouvert. Cliquez pour activer votre compte. Ce lien expire dans 7 jours.</p>
          <a href="${url}" style="display:inline-block;background:#1b1c2e;color:#f4efe6;text-decoration:none;font-size:13px;letter-spacing:.12em;text-transform:uppercase;font-weight:bold;padding:14px 28px;border-radius:2px">Activer mon compte →</a>
          <p style="font-size:12px;line-height:1.6;color:#999;margin:24px 0 0">Si vous n'attendiez pas cette invitation, ignorez cet email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
