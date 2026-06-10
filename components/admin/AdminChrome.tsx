"use client";

import { useState, type ReactNode } from "react";
import { Sidebar, type SessionUser } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandPalette, useCommandPaletteShortcut } from "./CommandPalette";
import type { NotifItem } from "@/lib/db/admin-queries";

export function AdminChrome({
  children,
  user,
  notifications = [],
}: {
  children: ReactNode;
  user: SessionUser;
  notifications?: NotifItem[];
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useCommandPaletteShortcut(() => setPaletteOpen((v) => !v));

  // Badges de la sidebar dérivés des notifications réelles (même source que
  // la cloche du topbar) : démos « nouveau », demandes « ouverte », contrats
  // à signer ou à échéance proche.
  const badges = {
    demos: notifications.filter((n) => n.kind === "demo").length,
    demandes: notifications.filter((n) => n.kind === "demande").length,
    contrats: notifications.filter((n) => n.kind === "contrat").length,
  };

  return (
    <div className="flex min-h-screen bg-paper">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[200] focus:bg-bleu-nuit-700 focus:text-beige-sable focus:px-3 focus:py-2 focus:rounded-[2px] focus:text-[12px] focus:tracking-eyebrow focus:uppercase focus:font-bold"
      >
        Aller au contenu
      </a>
      <Sidebar
        user={user}
        badges={badges}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          onOpenPalette={() => setPaletteOpen(true)}
          onOpenMobileMenu={() => setMobileOpen(true)}
          notifications={notifications}
        />
        <main
          id="admin-content"
          className="flex-1 px-[clamp(20px,3vw,40px)] py-[clamp(24px,3vw,40px)]"
        >
          {children}
        </main>
      </div>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
    </div>
  );
}
