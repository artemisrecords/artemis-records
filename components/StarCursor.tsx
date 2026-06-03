"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Curseur visuel personnalisé en forme d'étoile (sparkle de la marque) qui
 * laisse une traînée de comète en se déplaçant, et morphe de façon fluide
 * selon l'élément survolé :
 *   - star  : par défaut
 *   - arrow : sur un média / la zone hero (data-cursor="arrow", img, .grain…)
 *   - text  : sur du texte ou un champ éditable
 *
 * Désactivé sur les pointeurs grossiers (tactile) et si l'utilisateur a
 * demandé une réduction des animations — le curseur natif reste alors visible.
 */

type CursorMode = "star" | "arrow" | "text";

// Nombre de segments de traînée (le 1er nœud est la tête/étoile principale).
const TRAIL = 7;
// Facteur d'interpolation : plus haut = plus réactif, plus bas = plus traînant.
const EASE = 0.34;

const STAR_PATH =
  "M12 0 L13.2 10.8 L24 12 L13.2 13.2 L12 24 L10.8 13.2 L0 12 L10.8 10.8 Z";

const INTERACTIVE =
  "a, button, [role='button'], [role='link'], input[type='button'], input[type='submit'], label, summary";
const EDITABLE =
  "input:not([type='button']):not([type='submit']), textarea, select, [contenteditable=''], [contenteditable='true']";
const TEXT_TAGS = new Set([
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "span", "em", "strong", "blockquote", "li", "figcaption", "label", "small",
]);
const MEDIA_TAGS = new Set(["img", "picture", "video", "svg"]);

function resolveMode(el: Element | null): CursorMode {
  if (!el) return "star";
  // Les surfaces cliquables gardent l'étoile (affordance ludique) et priment
  // sur le texte qu'elles contiennent (libellés de boutons/liens).
  if (el.closest(INTERACTIVE)) return "star";
  if (el.closest(EDITABLE)) return "text";

  // L'élément le plus proche décide : on remonte le DOM et on renvoie au
  // premier match (data-cursor explicite > texte > média).
  for (let node: Element | null = el; node; node = node.parentElement) {
    const ds = (node as HTMLElement).dataset?.cursor;
    if (ds === "arrow" || ds === "text" || ds === "star") return ds;
    const tag = node.tagName.toLowerCase();
    if (TEXT_TAGS.has(tag)) return "text";
    if (MEDIA_TAGS.has(tag) || node.classList.contains("grain")) return "arrow";
  }
  return "star";
}

export function StarCursor() {
  const [mode, setMode] = useState<CursorMode>("star");
  const [enabled, setEnabled] = useState(false);
  const headRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // N'activer que sur pointeur fin sans préférence de réduction de mouvement.
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

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!visible) {
        visible = true;
        if (headRef.current) headRef.current.style.opacity = "1";
        for (const t of trailRefs.current) if (t) t.style.opacity = "";
      }
      const next = resolveMode(e.target as Element);
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

    const onDown = () => headRef.current?.classList.add("is-down");
    const onUp = () => headRef.current?.classList.remove("is-down");

    const loop = () => {
      // Chaîne élastique : la tête suit la souris, chaque segment suit le précédent.
      let px = mouse.x;
      let py = mouse.y;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += (px - n.x) * EASE;
        n.y += (py - n.y) * EASE;
        px = n.x;
        py = n.y;
      }

      const head = headRef.current;
      if (head) {
        const h = nodes[0];
        head.style.transform = `translate3d(${h.x}px, ${h.y}px, 0) translate(-50%, -50%)`;
      }
      for (let i = 1; i < nodes.length; i++) {
        const el = trailRefs.current[i - 1];
        if (!el) continue;
        const n = nodes[i];
        const k = 1 - i / nodes.length; // décroît vers la queue
        el.style.transform = `translate3d(${n.x}px, ${n.y}px, 0) translate(-50%, -50%) scale(${0.85 * k})`;
        el.style.opacity = visible ? String(0.5 * k) : "0";
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.documentElement.classList.remove("star-cursor-active");
    };
  }, []);

  if (!enabled) return null;

  return (
    <div className="star-cursor-root" aria-hidden="true">
      {/* Traînée — petites étoiles qui suivent avec retard et s'estompent. */}
      {Array.from({ length: TRAIL - 1 }).map((_, i) => (
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

      {/* Tête — morphe entre étoile, flèche et texte. */}
      <div ref={headRef} className="star-cursor-head" data-mode={mode} style={{ opacity: 0 }}>
        {/* Étoile */}
        <svg className="sc-shape sc-star" viewBox="0 0 24 24" width="26" height="26">
          <path d={STAR_PATH} fill="var(--color-magenta)" />
        </svg>
        {/* Flèche d'exploration */}
        <svg className="sc-shape sc-arrow" viewBox="0 0 24 24" width="30" height="30">
          <path
            d="M5 5 L19 5 L19 9 L11.8 9 L20 17.2 L17.2 20 L9 11.8 L9 19 L5 19 Z"
            fill="var(--color-magenta)"
            stroke="var(--color-blanc-casse)"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
        </svg>
        {/* Curseur texte (I-beam) */}
        <svg className="sc-shape sc-text" viewBox="0 0 24 24" width="22" height="28">
          <path
            d="M8 3 H16 M8 21 H16 M12 3 V21"
            fill="none"
            stroke="var(--color-magenta)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
