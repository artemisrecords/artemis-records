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
  // Tiroir de navigation en mobile.
  const [open, setOpen] = useState(false);

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

  // On referme le tiroir à chaque changement de page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Tiroir ouvert : verrou du scroll de page + fermeture à la touche Échap.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (
    pathname === "/auth" ||
    pathname === "/accept-invitation" ||
    pathname.startsWith("/backoffice") ||
    pathname.startsWith("/espace")
  )
    return null;
  const inverse = pathname === "/";
  return (
    <>
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
        {/* Liens inline : tablette et desktop uniquement. */}
        <div ref={linksWrapRef} className="relative hidden h-full items-center md:flex">
          {LINKS.map((t, i) => {
            const active = t.match(pathname);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`
                  h-2/3 px-3 lg:px-4
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
        {/* CTA : « Démo » en tablette, libellé complet en desktop. */}
        <Link
          href="/demo"
          className={`hidden md:flex px-3 lg:px-4 h-full items-center font-serif italic font-bold text-[14px] lg:text-[16px] whitespace-nowrap cursor-pointer ${
            inverse ? "text-beige-sable/70" : "text-ink-muted"
          }`}
        >
          <span className="lg:hidden">Démo</span>
          <span className="hidden lg:inline">Proposer une démo&nbsp;⟶</span>
        </Link>
        {/* Bouton burger : mobile uniquement. */}
        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden relative -mr-2 flex h-10 w-10 items-center justify-center cursor-pointer"
        >
          <span
            className={`absolute h-[1.5px] w-6 bg-current transition-transform duration-300 ease-out ${
              open ? "rotate-45" : "-translate-y-[5px]"
            }`}
          />
          <span
            className={`absolute h-[1.5px] w-6 bg-current transition-transform duration-300 ease-out ${
              open ? "-rotate-45" : "translate-y-[5px]"
            }`}
          />
        </button>
      </nav>

      {/* Tiroir de navigation mobile (hors du <nav> pour échapper à son contexte d'empilement). */}
      <div className="md:hidden" aria-hidden={!open}>
        <div
          onClick={() => setOpen(false)}
          className={`fixed inset-0 z-[60] bg-bleu-nuit-900/55 transition-opacity duration-300 ${
            open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          style={{ backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navigation"
          className={`fixed right-0 top-0 z-[70] flex h-full w-[min(84vw,340px)] flex-col border-l border-beige-sable/15 bg-bleu-nuit-700 px-7 pb-8 pt-6 text-beige-sable transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <Link href="/" className="cursor-pointer">
              <Wordmark inverse size={26} />
            </Link>
            <button
              type="button"
              aria-label="Fermer le menu"
              onClick={() => setOpen(false)}
              className="relative -mr-2 flex h-10 w-10 items-center justify-center cursor-pointer"
            >
              <span className="absolute h-[1.5px] w-5 rotate-45 bg-current" />
              <span className="absolute h-[1.5px] w-5 -rotate-45 bg-current" />
            </button>
          </div>

          <nav className="mt-10 flex flex-col">
            {LINKS.map((t, i) => {
              const active = t.match(pathname);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`group flex items-center gap-3 py-3 font-serif text-[13px] font-bold uppercase tracking-eyebrow transition-[color,transform,opacity] duration-300 ease-out ${
                    active ? "text-beige-sable" : "text-beige-sable/55 hover:text-beige-sable"
                  }`}
                  style={{
                    transitionDelay: open ? `${90 + i * 45}ms` : "0ms",
                    transform: open ? "none" : "translateX(14px)",
                    opacity: open ? 1 : 0,
                  }}
                >
                  <span
                    className={`h-[1.5px] bg-magenta transition-all duration-300 ${
                      active ? "w-6" : "w-0 group-hover:w-4"
                    }`}
                  />
                  {t.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-beige-sable/15 pt-8">
            <Link
              href="/demo"
              className="flex items-center justify-between font-serif text-[15px] font-bold italic text-beige-sable transition-colors duration-200 hover:text-magenta"
            >
              Proposer une démo <span aria-hidden>⟶</span>
            </Link>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-eyebrow opacity-45">
              Viser la lune, retomber dans les étoiles.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
};
