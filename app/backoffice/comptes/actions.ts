"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user, invitation } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth-helpers";
import {
  createInvitation,
  revokeInvitation,
  deleteUserAccount,
} from "@/lib/invitations";
import type { Role } from "@/lib/permissions";

export type InviteState =
  | { ok?: boolean; message?: string; error?: string }
  | null;

export async function inviteAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  try {
    const { user: caller, role } = await requireRole("superadmin", "admin");
    const email = String(formData.get("email") ?? "");
    const targetRole = String(formData.get("role") ?? "") as Role;
    const artistIdRaw = formData.get("artistId");
    const artistId = artistIdRaw ? String(artistIdRaw) : null;

    const res = await createInvitation({
      inviterId: caller.id,
      inviterRole: role,
      email,
      role: targetRole,
      artistId,
    });
    revalidatePath("/backoffice/comptes");
    return { ok: true, message: `Invitation envoyée à ${res.email}.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Une erreur est survenue." };
  }
}

export async function revokeInvitationAction(formData: FormData) {
  const { role } = await requireRole("superadmin", "admin");
  const id = String(formData.get("id") ?? "");
  const [inv] = await db
    .select({ role: invitation.role })
    .from(invitation)
    .where(eq(invitation.id, id))
    .limit(1);
  if (!inv) return;
  // Un admin ne révoque que des invitations d'artistes.
  if (role === "admin" && inv.role !== "artiste") {
    throw new Error("Action non autorisée.");
  }
  await revokeInvitation(id);
  revalidatePath("/backoffice/comptes");
}

export async function deleteUserAction(formData: FormData) {
  const { user: caller, role } = await requireRole("superadmin", "admin");
  const id = String(formData.get("id") ?? "");
  if (id === caller.id) {
    throw new Error("Vous ne pouvez pas supprimer votre propre compte.");
  }
  const [target] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, id))
    .limit(1);
  if (!target) return;
  // Les super admins ne se suppriment pas via l'UI ; un admin ne gère que les artistes.
  if (target.role === "superadmin") {
    throw new Error("Un super admin ne peut pas être supprimé ici.");
  }
  if (role === "admin" && target.role !== "artiste") {
    throw new Error("Action non autorisée.");
  }
  await deleteUserAccount(id);
  revalidatePath("/backoffice/comptes");
}
