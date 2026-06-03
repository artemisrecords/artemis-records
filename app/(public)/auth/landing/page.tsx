import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Atterrissage après clic du magic link : Better Auth a posé le cookie de
 * session, on lit le rôle et on aiguille. Server component → redirige avant
 * tout rendu (pas de flash).
 */
export default async function AuthLanding() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/auth");

  if (session.user.role === "artiste") redirect("/espace");
  redirect("/backoffice");
}
