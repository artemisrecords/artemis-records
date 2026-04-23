"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "./Primitives";

const LINKS = [
  { href: "/", label: "Accueil", match: (p: string) => p === "/" },
  { href: "/about", label: "À propos", match: (p: string) => p.startsWith("/about") },
  { href: "/artists", label: "Artistes", match: (p: string) => p.startsWith("/artists") },
  { href: "/news", label: "Journal", match: (p: string) => p.startsWith("/news") },
  { href: "/contact", label: "Contact", match: (p: string) => p.startsWith("/contact") },
];

export const Nav = () => {
  const pathname = usePathname() || "/";
  if (pathname === "/auth" || pathname.startsWith("/backoffice")) return null;
  const inverse = pathname === "/";
  return (
    <nav
      className={`flex items-center justify-between h-[100px] px-[clamp(24px,4vw,56px)] sticky top-0 z-50 border-b ${
        inverse
          ? "bg-bleu-nuit-700 border-beige-sable/20 text-beige-sable"
          : "bg-paper/70 border-ink/15 text-ink"
      }`}
      style={{
        backdropFilter: inverse ? "saturate(110%)" : "saturate(140%) blur(12px)",
        WebkitBackdropFilter: inverse ? "saturate(110%)" : "saturate(140%) blur(12px)",
      }}
    >
      <Link href="/" className="cursor-pointer">
        <Wordmark inverse={inverse} size={48} />
      </Link>
      <div className="flex gap-[30px]">
        {LINKS.map((t) => {
          const active = t.match(pathname);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`font-serif text-[11px] tracking-eyebrow uppercase font-bold pb-1 cursor-pointer transition-all duration-200 border-b ${
                active
                  ? "opacity-100 border-magenta"
                  : "opacity-60 border-transparent hover:opacity-100"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
      <Link
        href="/demo"
        className={`font-serif italic font-bold text-[16px] cursor-pointer ${
          inverse ? "text-beige-sable/70" : "text-ink-muted"
        }`}
      >
        Proposer une démo ⟶
      </Link>
    </nav>
  );
};
