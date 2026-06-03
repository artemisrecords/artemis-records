"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Curseur visuel personnalisé. Par défaut : une étoile (sparkle de la marque)
 * au cœur blanc lumineux qui suit la souris instantanément, en laissant une
 * traînée qui épouse le tracé réellement parcouru par le curseur.
 *
 * La SEULE zone qui change la forme est l'image du hero (le carrousel, marqué
 * `data-cursor="hero"`) : selon la position horizontale, l'étoile morphe en
 * douceur vers une flèche « précédent » (gauche), « suivant » (droite), ou une
 * pastille invitant à cliquer (centre). Partout ailleurs c'est l'étoile.
 *
 * Désactivé sur pointeur grossier (tactile) et si prefers-reduced-motion.
 */

type CursorMode = "star" | "arrow-left" | "arrow-right" | "view";

// Nombre de points de traînée (la tête est gérée à part, sans retard).
const TRAIL = 18;
// Écart, en frames, entre deux points consécutifs de la traînée. Plus l'écart
// est grand, plus la traînée s'étire dans le temps.
const GAP = 2;
// Taille de l'historique de positions nécessaire pour alimenter la traînée.
const HISTORY = (TRAIL + 1) * GAP;

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

function StarSvg({ size, className }: { size: number; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={size} height={size}>
      <path d={STAR_PATH} fill="url(#sc-star-grad)" />
    </svg>
  );
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
    // Historique des positions (plus récente en tête).
    const history = Array.from({ length: HISTORY }, () => ({ ...mouse }));
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
      // On enregistre la position courante : l'historique mémorise le tracé.
      history.unshift({ x: mouse.x, y: mouse.y });
      if (history.length > HISTORY) history.pop();

      // On masque la traînée hors mode étoile (le carrousel a ses propres formes).
      const hidden = !visible || lastMode !== "star";
      for (let i = 0; i < TRAIL; i++) {
        const el = trailRefs.current[i];
        if (!el) continue;
        // Chaque point reprend une position passée réelle → la traînée suit le tracé.
        const p = history[Math.min((i + 1) * GAP, history.length - 1)];
        const k = 1 - i / TRAIL; // 1 (près de la tête) → ~0 (queue)
        el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%) scale(${0.35 + 0.55 * k})`;
        el.style.opacity = hidden ? "0" : String(0.72 * k);
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
      {/* Dégradé partagé : cœur blanc lumineux → magenta, pour faire briller. */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <radialGradient id="sc-star-grad" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="22%" stopColor="#ffe6f3" />
            <stop offset="55%" stopColor="#d24a8e" />
            <stop offset="100%" stopColor="#9F2063" />
          </radialGradient>
        </defs>
      </svg>

      {/* Traînée — étoiles qui rejouent le tracé du curseur et s'estompent. */}
      {Array.from({ length: TRAIL }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            trailRefs.current[i] = el;
          }}
          className="star-cursor-trail"
          style={{ opacity: 0 }}
        >
          <StarSvg size={20} />
        </div>
      ))}

      {/* Tête — étoile par défaut, morphe sur l'image du hero. */}
      <div ref={headRef} className="star-cursor-head" data-mode={mode} style={{ opacity: 0 }}>
        <StarSvg className="sc-shape sc-star" size={28} />

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
