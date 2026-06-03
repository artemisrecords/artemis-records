import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import type { Role } from "@/lib/permissions";

/** Session courante (ou null), lue côté serveur. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Garde de rôle pour les Server Actions : lève si l'appelant n'a pas un des
 * rôles requis. (Les layouts gèrent la redirection ; ici on protège les
 * mutations.)
 */
export async function requireRole(...roles: Role[]) {
  const session = await getSession();
  const role = session?.user.role as Role | undefined;
  if (!session || !role || !roles.includes(role)) {
    throw new Error("Accès refusé.");
  }
  return { user: session.user, role };
}
