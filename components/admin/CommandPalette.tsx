"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  href?: string;
  group: string;
  shortcut?: string;
  keywords?: string[];
};

const COMMANDS: CommandItem[] = [
  // Navigation
  { id: "nav-dash", group: "Aller à", label: "Vue d'ensemble", href: "/backoffice", keywords: ["dashboard", "accueil"] },
  { id: "nav-demos", group: "Aller à", label: "Démos reçues", href: "/backoffice/demos", shortcut: "G D" },
  { id: "nav-dem", group: "Aller à", label: "Demandes", href: "/backoffice/demandes", shortcut: "G Q" },
  { id: "nav-art", group: "Aller à", label: "Artistes", href: "/backoffice/artistes", shortcut: "G A" },
  { id: "nav-jrn", group: "Aller à", label: "Journal", href: "/backoffice/journal", shortcut: "G J" },
  { id: "nav-agd", group: "Aller à", label: "Agenda", href: "/backoffice/agenda" },
  { id: "nav-nwl", group: "Aller à", label: "Newsletter", href: "/backoffice/newsletter" },
  { id: "nav-stats", group: "Aller à", label: "Statistiques", href: "/backoffice/statistiques", shortcut: "G S", keywords: ["streams", "chiffres"] },
  { id: "nav-cts", group: "Aller à", label: "Contrats", href: "/backoffice/contrats", shortcut: "G C", keywords: ["juridique"] },
  { id: "nav-reg", group: "Aller à", label: "Réglages", href: "/backoffice/reglages", shortcut: "G ," },
  // Creation
  { id: "new-art", group: "Créer", label: "Signer un·e artiste", href: "/backoffice/artistes/nouveau", shortcut: "N A" },
  { id: "new-news", group: "Créer", label: "Nouvelle entrée journal", href: "/backoffice/journal/nouveau", shortcut: "N J" },
  { id: "new-show", group: "Créer", label: "Ajouter une date", href: "/backoffice/agenda", keywords: ["concert", "tournée"] },
  { id: "new-camp", group: "Créer", label: "Nouvelle campagne newsletter", href: "/backoffice/newsletter" },
  // Utilities
  { id: "util-pub", group: "Outils", label: "Voir le site public", href: "/", keywords: ["front"] },
  { id: "util-logout", group: "Outils", label: "Se déconnecter", href: "/auth" },
];

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter((c) => {
      const hay = `${c.label} ${c.group} ${(c.keywords || []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(c + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      }
      if (e.key === "Enter") {
        const item = filtered[cursor];
        if (item?.href) {
          router.push(item.href);
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, cursor, router, onClose]);

  if (!open) return null;

  // Group by `group`
  const groups = new Map<string, CommandItem[]>();
  filtered.forEach((c) => {
    if (!groups.has(c.group)) groups.set(c.group, []);
    groups.get(c.group)!.push(c);
  });

  let globalIdx = -1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Palette de commandes"
      className="fixed inset-0 z-[100] bg-bleu-nuit-900/50 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[600px] bg-paper-soft border border-ink/15 rounded-[2px] shadow-editorial-lg overflow-hidden flex flex-col max-h-[70vh]"
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-ink/10">
          <span className="text-ink-subtle text-[16px]">⌕</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            placeholder="Aller à, créer, rechercher… (Esc pour fermer)"
            className="flex-1 bg-transparent outline-none font-serif text-[15px] text-ink placeholder:italic placeholder:text-ink-subtle"
          />
          <kbd className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle border border-ink/20 px-1.5 py-0.5 rounded">
            Esc
          </kbd>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <div className="font-display uppercase tracking-display text-[20px]">
                Rien ne correspond
              </div>
              <div className="italic text-[13px] text-ink-muted mt-1">
                Essayez un autre mot — artiste, démo, journal…
              </div>
            </div>
          ) : (
            Array.from(groups.entries()).map(([group, items]) => (
              <div key={group} className="py-2">
                <div className="px-5 py-1.5 text-[9px] tracking-eyebrow uppercase font-bold text-ink-subtle">
                  {group}
                </div>
                <ul>
                  {items.map((c) => {
                    globalIdx++;
                    const active = globalIdx === cursor;
                    const idx = globalIdx;
                    return (
                      <li key={c.id}>
                        <Link
                          href={c.href || "#"}
                          onClick={onClose}
                          onMouseEnter={() => setCursor(idx)}
                          className={`flex items-center justify-between gap-3 px-5 py-2.5 cursor-pointer transition-colors ${
                            active ? "bg-paper" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {active && (
                              <span className="w-1 h-5 bg-magenta rounded-full" />
                            )}
                            <span className="font-serif text-[14px] text-ink truncate">
                              {c.label}
                            </span>
                          </div>
                          {c.shortcut && (
                            <kbd className="text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle border border-ink/15 px-1.5 py-0.5 rounded">
                              {c.shortcut}
                            </kbd>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
        <div className="px-5 py-2.5 border-t border-ink/10 bg-paper text-[10px] tracking-eyebrow uppercase font-bold text-ink-subtle flex items-center gap-4">
          <span>
            <kbd className="border border-ink/20 px-1 py-0.5 rounded">↑</kbd>{" "}
            <kbd className="border border-ink/20 px-1 py-0.5 rounded">↓</kbd>{" "}
            naviguer
          </span>
          <span>
            <kbd className="border border-ink/20 px-1 py-0.5 rounded">↵</kbd>{" "}
            ouvrir
          </span>
          <span className="ml-auto italic normal-case tracking-normal text-[11px] font-serif">
            ARTémis backoffice · palette de commandes
          </span>
        </div>
      </div>
    </div>
  );
}

export function useCommandPaletteShortcut(onToggle: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onToggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onToggle]);
}
