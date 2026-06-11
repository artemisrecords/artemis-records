"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/Primitives";
import { authClient } from "@/lib/auth-client";

export type SessionUser = {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email: string;
  role?: string | null;
};

export type SidebarBadges = {
  demos: number;
  demandes: number;
  contrats: number;
};

type Item = {
  href: string;
  label: string;
  /** Compteur dynamique (notifications réelles) affiché en pastille. */
  badgeKey?: keyof SidebarBadges;
  match: (p: string) => boolean;
};

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Direction du label",
  admin: "Équipe label",
  artiste: "Artiste",
};

/** Initiales : 1re lettre du prénom + 1re du nom, sinon 2 lettres du prénom. */
function initials(firstName: string, lastName: string) {
  const f = firstName.trim();
  const l = lastName.trim();
  if (f && l) return (f[0] + l[0]).toUpperCase();
  const parts = (f || l).split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return "?";
}

const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: "Pilotage",
    items: [
      {
        href: "/backoffice",
        label: "Vue d'ensemble",
        match: (p) => p === "/backoffice",
      },
      {
        href: "/backoffice/statistiques",
        label: "Statistiques",
        match: (p) => p.startsWith("/backoffice/statistiques"),
      },
    ],
  },
  {
    title: "Boîte de réception",
    items: [
      {
        href: "/backoffice/demos",
        label: "Démos",
        badgeKey: "demos",
        match: (p) => p.startsWith("/backoffice/demos"),
      },
      {
        href: "/backoffice/demandes",
        label: "Demandes",
        badgeKey: "demandes",
        match: (p) => p.startsWith("/backoffice/demandes"),
      },
    ],
  },
  {
    title: "Contenu",
    items: [
      {
        href: "/backoffice/artistes",
        label: "Artistes",
        match: (p) => p.startsWith("/backoffice/artistes"),
      },
      {
        href: "/backoffice/journal",
        label: "Journal",
        match: (p) => p.startsWith("/backoffice/journal"),
      },
      {
        href: "/backoffice/agenda",
        label: "Agenda des concerts",
        match: (p) => p.startsWith("/backoffice/agenda"),
      },
    ],
  },
  {
    title: "Juridique",
    items: [
      {
        href: "/backoffice/contrats",
        label: "Contrats",
        badgeKey: "contrats",
        match: (p) => p.startsWith("/backoffice/contrats"),
      },
    ],
  },
  {
    title: "Label",
    items: [
      {
        href: "/backoffice/newsletter",
        label: "Newsletter",
        match: (p) => p.startsWith("/backoffice/newsletter"),
      },
      {
        href: "/backoffice/reglages",
        label: "Réglages",
        match: (p) => p.startsWith("/backoffice/reglages"),
      },
      {
        href: "/backoffice/administration",
        label: "Administration",
        match: (p) => p.startsWith("/backoffice/administration"),
      },
    ],
  },
];

export const Sidebar = ({
  user,
  badges,
  mobileOpen = false,
  onCloseMobile,
}: {
  user: SessionUser;
  badges?: SidebarBadges;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) => {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const authMenuRef = useRef<HTMLDivElement | null>(null);

  const firstName = user.firstName?.trim() ?? "";
  const lastName = user.lastName?.trim() ?? "";
  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    user.name?.trim() ||
    user.email;
  const subtitle = (user.role && ROLE_LABELS[user.role]) || user.email;

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setAuthOpen(false);
    onCloseMobile?.();
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  useEffect(() => {
    if (!authOpen) return;
    const onClick = (e: MouseEvent) => {
      if (
        authMenuRef.current &&
        !authMenuRef.current.contains(e.target as Node)
      ) {
        setAuthOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAuthOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [authOpen]);

  return (
    <>
      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={onCloseMobile}
          className="lg:hidden fixed inset-0 z-40 bg-bleu-nuit-900/50 backdrop-blur-sm cursor-pointer"
        />
      )}
    <aside
      className={`w-[260px] shrink-0 border-r border-ink/10 bg-paper-soft flex-col h-screen sticky top-0 z-50 ${
        mobileOpen
          ? "flex fixed left-0 top-0 shadow-editorial-lg"
          : "hidden lg:flex"
      }`}
    >
      <div className="px-4 py-3 border-b border-ink/10 relative overflow-hidden">
        <span
          aria-hidden
          className="absolute -right-4 -top-6 text-[72px] leading-none text-magenta/8 select-none font-display rotate-12"
        >
          ✦
        </span>
        <div className="flex items-center justify-center relative">
          <Link
            href="/backoffice"
            onClick={onCloseMobile}
            className="flex items-center justify-center"
          >
            <Wordmark size={56} />
          </Link>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Fermer le menu"
            className="lg:hidden absolute right-0 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink text-[18px] cursor-pointer w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>
      </div>

      <nav
        aria-label="Navigation principale du backoffice"
        className="flex-1 overflow-y-auto py-4"
      >
        {SECTIONS.map((sec) => (
          <div key={sec.title} className="mb-4">
            <div className="px-6 mb-2 text-[9px] tracking-eyebrow uppercase font-bold text-ink-subtle">
              {sec.title}
            </div>
            <ul>
              {sec.items.map((it) => {
                const active = it.match(pathname);
                const badge = it.badgeKey ? (badges?.[it.badgeKey] ?? 0) : 0;
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      onClick={onCloseMobile}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center justify-between gap-3 px-6 py-2.5 font-serif text-[13px] cursor-pointer transition-colors relative ${
                        active
                          ? "text-ink bg-paper"
                          : "text-ink-muted hover:text-ink hover:bg-paper/60"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-magenta" />
                      )}
                      <span
                        className={
                          active ? "font-bold" : "font-normal italic"
                        }
                      >
                        {it.label}
                      </span>
                      {badge > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[22px] h-[20px] px-1.5 text-[10px] tracking-eyebrow uppercase font-bold bg-magenta text-white rounded-full">
                          {badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div ref={authMenuRef} className="relative border-t border-ink/10">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={authOpen}
          aria-label="Ouvrir le menu du compte"
          onClick={() => setAuthOpen((v) => !v)}
          className="w-full p-5 flex items-center gap-3 bg-bleu-nuit-700 hover:bg-bleu-nuit-800 text-beige-sable relative overflow-hidden cursor-pointer text-left transition-colors"
        >
          <div className="stars opacity-40 pointer-events-none" aria-hidden />
          <div className="w-9 h-9 rounded-full bg-magenta text-white flex items-center justify-center font-display text-[14px] relative z-10 shrink-0">
            {initials(firstName || displayName, lastName)}
          </div>
          <div className="flex-1 min-w-0 relative z-10">
            <div className="font-serif text-[13px] font-bold truncate">
              {displayName}
            </div>
            <div className="italic text-[11px] text-beige-sable/70 truncate">
              {subtitle}
            </div>
          </div>
          <span
            aria-hidden
            className={`relative z-10 text-[14px] text-beige-sable/70 transition-transform duration-150 ${
              authOpen ? "rotate-180" : ""
            }`}
          >
            ⌄
          </span>
        </button>
        {authOpen && (
          <div
            role="menu"
            className="absolute bottom-full left-3 right-3 mb-2 bg-paper border border-ink/15 rounded-[2px] shadow-editorial-lg overflow-hidden z-[60]"
          >
            <Link
              role="menuitem"
              href="/backoffice/compte"
              onClick={() => {
                setAuthOpen(false);
                onCloseMobile?.();
              }}
              className="block px-4 py-3 font-serif text-[13px] text-ink hover:bg-paper-soft border-b border-ink/10 cursor-pointer"
            >
              Mon compte
            </Link>
            <button
              role="menuitem"
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full text-left px-4 py-3 font-serif text-[13px] text-magenta hover:bg-paper-soft cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              {signingOut ? "Déconnexion…" : "Se déconnecter"}
            </button>
          </div>
        )}
      </div>
    </aside>
    </>
  );
};
