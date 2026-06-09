import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Wordmark } from "@/components/Primitives";
import { signOutAction } from "@/app/backoffice/compte/actions";

/**
 * Surface artiste : chrome volontairement minimal (pas l'AdminChrome du
 * backoffice). Vérif de rôle réelle ici — le proxy n'a fait qu'un check
 * optimiste du cookie.
 */
export default async function EspaceLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth");
  // Un admin n'a rien à faire ici → son backoffice.
  if (session.user.role !== "artiste") redirect("/backoffice");

  const displayName =
    session.user.firstName?.trim() || session.user.name?.trim() || session.user.email;

  return (
    <div className="min-h-screen bg-paper text-ink font-serif">
      <header className="flex items-center justify-between px-[clamp(24px,4vw,56px)] h-[76px] border-b border-ink/15 bg-paper/70 sticky top-0 z-50 backdrop-blur">
        <div className="flex items-center gap-4">
          <Wordmark size={18} />
          <span className="text-[10px] tracking-eyebrow uppercase font-bold text-magenta border-l border-ink/15 pl-4">
            Espace artiste
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="italic text-[13px] text-ink-muted hidden sm:block">{displayName}</span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle hover:text-magenta cursor-pointer"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </header>
      <main className="px-[clamp(24px,4vw,56px)] py-10 max-w-[1200px] mx-auto">{children}</main>
    </div>
  );
}
