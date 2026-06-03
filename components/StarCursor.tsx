"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Curseur visuel personnalisé. Par défaut : une étoile (sparkle de la marque)
 * qui suit la souris instantanément en laissant une traînée de comète.
 *
 * La SEULE zone qui change la forme est l'image du hero (le carrousel, marqué
 * `data-cursor="hero"`) : selon la position horizontale, l'étoile morphe en
 * douceur vers une flèche « précédent » (gauche), « suivant » (droite), ou une
 * pastille invitant à cliquer (centre). Partout ailleurs — textes, panneau
 * hero, liens — c'est l'étoile.
 *
 * Désactivé sur pointeur grossier (tactile) et si prefers-reduced-motion : le
 * curseur natif reste alors visible.
 */

type CursorMode = "star" | "arrow-left" | "arrow-right" | "view";

// Nombre de segments de traînée (la tête est gérée à part, sans retard).
const TRAIL = 6;
// Interpolation de la traînée : plus bas = plus traînant.
const EASE = 0.34;

const STAR_PATH =
  "M12 0 L13.2 10.8 L24 12 L13.2 13.2 L12 24 L10.8 13.2 L0 12 L10.8 10.8 Z";

/** Détermine la forme selon l'élément survolé et la position du pointeur. */
function resolveMode(el: Element | null, clientX: number): CursorMode {
  const hero = el?.closest<HTMLElement>('[data-cursor="hero"]');
  if (!hero) return "star";
  const r = hero.getBoundingClientRect();
  // La largeur des bords doit refléter celle des boutons prev/next du carrousel.
  const edge = Math.min(Math.max(r.width * 0.18, 64), 140);
  const x = clientX - r.left;
  if (x < edge) return "arrow-left";
  if (x > r.width - edge) return "arrow-right";
  return "view";
}

export function StarCursor() {
  const [mode, setMode] = useState<CursorMode>("star");
  const [enabled, setEnabled] = useState(false);
  const headRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    setEnabled(true);
    document.documentElement.classList.add("star-cursor-active");

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const nodes = Array.from({ length: TRAIL }, () => ({ ...mouse }));
    let visible = false;
    let raf = 0;
    let lastMode: CursorMode = "star";

    const positionHead = () => {
      const head = headRef.current;
      if (head) {
        head.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%)`;
      }
    };

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      // La tête suit la souris immédiatement (aucun retard).
      positionHead();
      if (!visible) {
        visible = true;
        if (headRef.current) headRef.current.style.opacity = "1";
      }
      const next = resolveMode(e.target as Element, e.clientX);
      if (next !== lastMode) {
        lastMode = next;
        setMode(next);
      }
    };

    const onLeave = () => {
      visible = false;
      if (headRef.current) headRef.current.style.opacity = "0";
      for (const t of trailRefs.current) if (t) t.style.opacity = "0";
    };

    const loop = () => {
      // La traînée suit la souris avec retard (effet comète).
      let px = mouse.x;
      let py = mouse.y;
      // On masque la traînée hors mode étoile (le carrousel a ses propres formes).
      const hidden = !visible || lastMode !== "star";
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += (px - n.x) * EASE;
        n.y += (py - n.y) * EASE;
        px = n.x;
        py = n.y;
        const el = trailRefs.current[i];
        if (!el) continue;
        const k = 1 - (i + 1) / (nodes.length + 1); // décroît vers la queue
        el.style.transform = `translate3d(${n.x}px, ${n.y}px, 0) translate(-50%, -50%) scale(${0.85 * k})`;
        el.style.opacity = hidden ? "0" : String(0.5 * k);
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.documentElement.classList.remove("star-cursor-active");
    };
  }, []);

  if (!enabled) return null;

  return (
    <div className="star-cursor-root" aria-hidden="true">
      {/* Traînée — petites étoiles qui suivent avec retard et s'estompent. */}
      {Array.from({ length: TRAIL }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            trailRefs.current[i] = el;
          }}
          className="star-cursor-trail"
          style={{ opacity: 0 }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d={STAR_PATH} fill="var(--color-magenta)" />
          </svg>
        </div>
      ))}

      {/* Tête — étoile par défaut, morphe sur l'image du hero. */}
      <div ref={headRef} className="star-cursor-head" data-mode={mode} style={{ opacity: 0 }}>
        <svg className="sc-shape sc-star" viewBox="0 0 24 24" width="26" height="26">
          <path d={STAR_PATH} fill="var(--color-magenta)" />
        </svg>

        <div className="sc-shape sc-arrow sc-arrow-left">
          <Chevron />
        </div>
        <div className="sc-shape sc-arrow sc-arrow-right">
          <Chevron />
        </div>

        <div className="sc-shape sc-view">Voir la page de l&apos;artiste</div>
      </div>
    </div>
  );
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      width="20"
      height="20"
    >
      <line x1="4" y1="12" x2="20" y2="12" />
      <polyline points="13 5 20 12 13 19" />
    </svg>
  );
}
