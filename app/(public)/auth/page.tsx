import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import AuthClient from "./AuthClient";

/**
 * Page de connexion. Server component : si l'utilisateur a déjà une session
 * active, on l'aiguille vers le backoffice avant tout rendu (pas de flash du
 * formulaire). Sinon on affiche le formulaire magic link (AuthClient).
 */
export default async function AuthPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) redirect("/backoffice");

  return <AuthClient />;
}
