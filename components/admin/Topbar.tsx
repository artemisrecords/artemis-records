"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NotifItem } from "@/lib/db/admin-queries";

const CRUMBS: Record<string, string> = {
  backoffice: "Backoffice",
  demos: "Démos",
  demandes: "Demandes",
  artistes: "Artistes",
  journal: "Journal",
  agenda: "Agenda",
  newsletter: "Newsletter",
  reglages: "Réglages",
  administration: "Administration",
  statistiques: "Statistiques",
  contrats: "Contrats",
  nouveau: "Nouveau",
};

export const Topbar = ({
  onOpenPalette,
  onOpenMobileMenu,
  notifications = [],
}: {
  onOpenPalette?: () => void;
  onOpenMobileMenu?: () => void;
  notifications?: NotifItem[];
} = {}) => {
  const pathname = usePathname() || "";
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((s, i) => ({
    label: CRUMBS[s] || decodeURIComponent(s),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const notifCount = notifications.length;

  useEffect(() => {
    if (!notifOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNotifOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [notifOpen]);

  return (
    <header className="h-[64px] border-b border-ink/10 bg-paper/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-[clamp(16px,3vw,40px)] gap-3 whitespace-nowrap flex-nowrap">
      <div className="flex items-center gap-3 flex-nowrap">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Ouvrir le menu"
          className="lg:hidden w-9 h-9 rounded-full border border-ink/15 bg-paper-soft flex items-center justify-center text-ink hover:border-ink/40 cursor-pointer shrink-0"
        >
          ☰
        </button>
        <nav
          aria-label="Fil d'Ariane"
          className="flex items-center gap-2 text-[11px] tracking-eyebrow uppercase font-bold flex-nowrap"
        >
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <span
                key={c.href}
                className="flex items-center gap-2 flex-nowrap"
              >
                {i > 0 && <span className="text-ink-subtle">/</span>}
                {last ? (
                  <span className="text-ink" aria-current="page">
                    {c.label}
                  </span>
                ) : (
                  <Link
                    href={c.href}
                    className="text-ink-subtle hover:text-ink"
                  >
                    {c.label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2 flex-nowrap">
        <button
          type="button"
          onClick={onOpenPalette}
          className="hidden md:flex items-center gap-3 bg-paper-soft border border-ink/15 rounded-full pl-10 pr-2 py-2 font-serif text-[13px] outline-none hover:border-ink/40 transition-colors cursor-text relative group flex-nowrap"
          aria-label="Ouvrir la palette de commandes"
        >
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle text-[13px]">
            ⌕
          </span>
          <span className="italic text-ink-subtle text-left whitespace-nowrap">
            Chercher un artiste, ouvrir une page, créer…
          </span>
          <kbd className="text-[9px] tracking-eyebrow uppercase font-bold text-ink-subtle border border-ink/15 px-1.5 py-0.5 rounded shrink-0">
            ⌘K
          </kbd>
        </button>
        <button
          type="button"
          onClick={onOpenPalette}
          aria-label="Rechercher"
          className="md:hidden w-9 h-9 rounded-full border border-ink/15 bg-paper-soft flex items-center justify-center text-ink hover:border-ink/40 cursor-pointer"
        >
          ⌕
        </button>
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((o) => !o)}
            className="relative w-9 h-9 rounded-full border border-ink/15 bg-paper-soft flex items-center justify-center text-ink hover:border-ink/40 cursor-pointer"
            aria-label={`Notifications${notifCount ? ` (${notifCount})` : ""}`}
            aria-haspopup="true"
            aria-expanded={notifOpen}
          >
            <span className="text-[14px]">✦</span>
            {notifCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-magenta border border-paper text-beige-sable text-[9px] font-bold flex items-center justify-center">
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-[300px] z-50 bg-paper border border-ink/15 rounded-[2px] shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-ink/10 flex items-center justify-between">
                <span className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle">
                  À traiter
                </span>
                <span className="text-[10px] tracking-eyebrow uppercase font-bold text-magenta">
                  {notifCount}
                </span>
              </div>
              {notifCount === 0 ? (
                <div className="px-4 py-6 text-center font-serif italic text-[13px] text-ink-muted">
                  Rien à traiter. Tout est à jour.
                </div>
              ) : (
                <ul className="max-h-[320px] overflow-auto">
                  {notifications.map((n) => (
                    <li key={n.id} className="border-t border-ink/8 first:border-t-0">
                      <Link
                        href={n.href}
                        onClick={() => setNotifOpen(false)}
                        className="block px-4 py-3 hover:bg-paper-soft transition-colors"
                      >
                        <span className="text-[9px] tracking-eyebrow uppercase font-bold text-ink-subtle">
                          {n.kind === "demo" ? "Démo" : n.kind === "contrat" ? "Contrat" : "Demande"}
                        </span>
                        <span className="block font-serif text-[13px] text-ink truncate mt-0.5">
                          {n.label}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <Link
          href="/"
          title="Voir le site public"
          className="font-serif italic text-[12px] text-ink-muted hover:text-ink cursor-pointer hidden lg:inline-block"
        >
          Site public ↗
        </Link>
      </div>
    </header>
  );
};
