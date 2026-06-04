"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [scrolled, setScrolled] = useState(false);

  // Barre de soulignement unique qui glisse d'un lien à l'autre.
  const linksWrapRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, top: 0, ready: false });
  // On désactive la transition au tout premier placement pour éviter
  // un glissement depuis (left:0, width:0) au montage.
  const [animate, setAnimate] = useState(false);
  // Vrai pendant que la nav se rétrécit : on suit la hauteur image par image
  // et on coupe la transition du trait pour qu'il colle au texte sans lag.
  const [following, setFollowing] = useState(false);

  const measure = useCallback(() => {
    const wrap = linksWrapRef.current;
    const activeIndex = LINKS.findIndex((t) => t.match(pathname));
    const el = activeIndex >= 0 ? labelRefs.current[activeIndex] : null;
    if (!wrap || !el) {
      setIndicator((i) => ({ ...i, ready: false }));
      return;
    }
    const w = wrap.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setIndicator({
      left: r.left - w.left,
      width: r.width,
      top: r.bottom - w.top,
      ready: true,
    });
  }, [pathname]);

  // measure dépend de pathname ; on le garde dans un ref pour que les effets
  // de scroll/resize ne se redéclenchent pas à chaque changement de page.
  const measureRef = useRef(measure);
  useEffect(() => {
    measureRef.current = measure;
  });

  useEffect(() => {
    // Hystérésis : on rétrécit au-delà de 80px, on ré-agrandit seulement
    // en repassant sous 20px. La zone tampon évite l'oscillation au seuil.
    const onScroll = () =>
      setScrolled((prev) => {
        const y = window.scrollY;
        if (!prev && y > 80) return true;
        if (prev && y < 20) return false;
        return prev;
      });
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Changement de page : le trait glisse horizontalement (transition active).
  useEffect(() => {
    measureRef.current();
  }, [pathname]);

  // Scroll : la nav anime sa hauteur sur 300ms, donc la position verticale du
  // trait change progressivement. On re-mesure à chaque frame pour le coller à
  // la hauteur en cours (transition coupée via `following`).
  useEffect(() => {
    setFollowing(true);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      measureRef.current();
      if (now - start < 360) {
        raf = requestAnimationFrame(tick);
      } else {
        setFollowing(false);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      setFollowing(false);
    };
  }, [scrolled]);

  // Premier rendu : on place le trait sans transition, puis on l'active.
  useEffect(() => {
    if (indicator.ready && !animate) {
      const id = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(id);
    }
  }, [indicator.ready, animate]);

  // Re-mesure au resize et une fois les polices chargées (la largeur du texte
  // bouge quand la font custom remplace la fallback).
  useEffect(() => {
    const onResize = () => measureRef.current();
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(() => measureRef.current());
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (
    pathname === "/auth" ||
    pathname === "/accept-invitation" ||
    pathname.startsWith("/backoffice") ||
    pathname.startsWith("/espace")
  )
    return null;
  const inverse = pathname === "/";
  return (
    <nav
      className={`flex items-center justify-between px-[clamp(24px,4vw,56px)] sticky top-0 z-50 border-b transition-[height] duration-300 ease-out ${
        scrolled ? "h-[68px]" : "h-[100px]"
      } ${
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
        <Wordmark inverse={inverse} size={scrolled ? 34 : 48} />
      </Link>
      <div ref={linksWrapRef} className="relative flex h-full items-center">
        {LINKS.map((t, i) => {
          const active = t.match(pathname);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`
                h-2/3 px-4
                flex items-center
                font-serif text-[11px] tracking-eyebrow uppercase font-bold cursor-pointer transition-opacity duration-200 ${
                active
                  ? "opacity-100"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <span ref={(el) => { labelRefs.current[i] = el; }} className="pb-1">
                {t.label}
              </span>
            </Link>
          );
        })}
        <span
          aria-hidden
          className={`pointer-events-none absolute h-[1.5px] bg-magenta ${
            animate && !following ? "transition-all duration-300 ease-out" : ""
          }`}
          style={{
            left: indicator.left,
            width: indicator.width,
            top: indicator.top,
            opacity: indicator.ready ? 1 : 0,
          }}
        />
      </div>
      <Link
        href="/demo"
        className={`px-4 h-full flex items-center font-serif italic font-bold text-[16px] cursor-pointer ${
          inverse ? "text-beige-sable/70" : "text-ink-muted"
        }`}
      >
        Proposer une démo ⟶
      </Link>
    </nav>
  );
};
