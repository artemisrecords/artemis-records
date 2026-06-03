import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AdminChrome } from "@/components/admin/AdminChrome";

export default async function BackofficeLayout({ children }: { children: ReactNode }) {
  // Vérif de rôle réelle (le proxy n'a fait qu'un check optimiste du cookie).
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth");
  // Un artiste n'a rien à faire dans le backoffice admin → son espace.
  if (session.user.role === "artiste") redirect("/espace");

  return (
    <AdminChrome
      user={{
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }}
    >
      {children}
    </AdminChrome>
  );
}
