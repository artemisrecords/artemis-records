"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const CRUMBS: Record<string, string> = {
  backoffice: "Backoffice",
  demos: "Démos",
  demandes: "Demandes",
  artistes: "Artistes",
  journal: "Journal",
  agenda: "Agenda",
  newsletter: "Newsletter",
  reglages: "Réglages",
  statistiques: "Statistiques",
  contrats: "Contrats",
  nouveau: "Nouveau",
};

export const Topbar = ({
  onOpenPalette,
  onOpenMobileMenu,
}: {
  onOpenPalette?: () => void;
  onOpenMobileMenu?: () => void;
} = {}) => {
  const pathname = usePathname() || "";
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((s, i) => ({
    label: CRUMBS[s] || decodeURIComponent(s),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));

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
        <button
          type="button"
          className="relative w-9 h-9 rounded-full border border-ink/15 bg-paper-soft flex items-center justify-center text-ink hover:border-ink/40 cursor-pointer"
          aria-label="Notifications"
        >
          <span className="text-[14px]">✦</span>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-magenta border border-paper" />
        </button>
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
