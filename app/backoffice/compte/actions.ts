"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth-helpers";

export type ProfileState =
  | { ok?: boolean; message?: string; error?: string }
  | null;

/**
 * Met à jour le prénom / nom du compte connecté. `firstName`/`lastName` sont en
 * `input: false` côté Better Auth (renseignés à l'invitation), on écrit donc
 * directement la ligne `user` en recalculant `name`, valeur canonique.
 */
export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  try {
    const current = await getCurrentUser();
    if (!current) return { error: "Session expirée. Reconnectez-vous." };

    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    if (firstName.length < 2) {
      return { error: "Indiquez votre prénom (2 caractères minimum)." };
    }
    const name = [firstName, lastName].filter(Boolean).join(" ");

    await db
      .update(user)
      .set({ name, firstName, lastName: lastName || null, updatedAt: new Date() })
      .where(eq(user.id, current.id));

    // La sidebar / topbar (layout) affiche le nom : on rafraîchit le layout.
    revalidatePath("/backoffice", "layout");
    return { ok: true, message: "Profil mis à jour." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Une erreur est survenue." };
  }
}

/**
 * Demande un changement d'adresse de connexion. Better Auth envoie un lien de
 * confirmation à l'adresse ACTUELLE (voir `changeEmail` dans lib/auth.ts) ; le
 * changement n'est appliqué qu'après ce clic.
 */
export async function changeEmailAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  try {
    const current = await getCurrentUser();
    if (!current) return { error: "Session expirée. Reconnectez-vous." };

    const newEmail = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) {
      return { error: "Adresse e-mail invalide." };
    }
    if (newEmail === current.email.toLowerCase()) {
      return { error: "C'est déjà votre adresse actuelle." };
    }

    await auth.api.changeEmail({
      body: { newEmail, callbackURL: "/backoffice/compte" },
      headers: await headers(),
    });

    return {
      ok: true,
      message: `Un lien de confirmation a été envoyé à ${current.email}. Cliquez dessus pour valider le passage à ${newEmail}.`,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Une erreur est survenue." };
  }
}

/** Déconnecte le compte courant puis renvoie vers la page de connexion. */
export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/auth");
}
