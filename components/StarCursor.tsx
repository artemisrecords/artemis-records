"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Curseur visuel personnalisé. Par défaut : une étoile (sparkle de la marque)
 * au cœur blanc lumineux qui suit la souris instantanément, suivie d'une
 * traînée dessinée sur un <canvas> : un trait continu « néon » (cœur blanc,
 * bords magenta, halo) qui épouse exactement le tracé parcouru et s'estompe.
 *
 * La SEULE zone qui change la forme est l'image du hero (le carrousel, marqué
 * `data-cursor="hero"`) : selon la position horizontale, l'étoile morphe en
 * douceur vers une flèche « précédent » (gauche), « suivant » (droite), ou une
 * pastille invitant à cliquer (centre). La traînée ne s'affiche qu'en mode
 * étoile, et repart de zéro en quittant l'image (pas de réapparition brutale).
 *
 * Désactivé sur pointeur grossier (tactile) et si prefers-reduced-motion.
 */

type CursorMode = "star" | "arrow-left" | "arrow-right" | "view";
type TrailPoint = { x: number; y: number; t: number };

// Durée de vie d'un point de traînée (ms) : la traînée s'efface en douceur.
const TTL = 340;
// Épaisseur max du trait (à la tête), en px.
const MAX_WIDTH = 5;
// Garde-fou sur la taille du buffer (mouvements très rapides = beaucoup de points).
const MAX_POINTS = 160;

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
  const headRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    document.documentElement.classList.add("star-cursor-active");

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    // Tracé récent : points horodatés, le plus récent en tête.
    let points: TrailPoint[] = [];
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
      positionHead(); // la tête suit la souris immédiatement
      if (!visible) {
        visible = true;
        if (headRef.current) headRef.current.style.opacity = "1";
      }
      const next = resolveMode(e.target as Element, e.clientX);
      if (next !== lastMode) {
        lastMode = next;
        setMode(next);
      }
      if (lastMode === "star") {
        // On récupère TOUS les points intermédiaires (sub-frame) pour une
        // trajectoire dense → trait lisse même sur un mouvement rapide.
        let evs: PointerEvent[] =
          typeof e.getCoalescedEvents === "function"
            ? e.getCoalescedEvents()
            : [];
        if (!evs.length) evs = [e];
        for (const ev of evs) {
          points.unshift({ x: ev.clientX, y: ev.clientY, t: ev.timeStamp });
        }
        if (points.length > MAX_POINTS) points.length = MAX_POINTS;
      }
    };

    const onLeave = () => {
      visible = false;
      if (headRef.current) headRef.current.style.opacity = "0";
      points = [];
    };

    const loop = (now: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (!visible || lastMode !== "star") {
        // Sur l'image du hero / curseur sorti : on vide le buffer pour que la
        // traînée reparte de zéro plutôt que de réapparaître d'un bloc.
        if (points.length) points = [];
        raf = requestAnimationFrame(loop);
        return;
      }

      // On élague les points trop vieux (la traînée se résorbe à l'arrêt).
      while (points.length && now - points[points.length - 1].t > TTL) {
        points.pop();
      }

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i];
        const b = points[i + 1];
        const fade = Math.max(0, 1 - (now - b.t) / TTL); // 1 (tête) → 0 (queue)
        if (fade <= 0) continue;
        const w = MAX_WIDTH * fade;

        // Halo + bords magenta.
        ctx.shadowColor = "rgba(210, 74, 142, 0.85)";
        ctx.shadowBlur = 8 * fade + 3;
        ctx.strokeStyle = `rgba(190, 60, 125, ${0.55 * fade})`;
        ctx.lineWidth = w * 2.3;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        // Cœur blanc.
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.92 * fade})`;
        ctx.lineWidth = Math.max(w * 0.85, 0.6);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      document.removeEventListener("mouseleave", onLeave);
      document.documentElement.classList.remove("star-cursor-active");
    };
  }, []);

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

      {/* Traînée — trait continu néon dessiné sur le canvas. */}
      <canvas ref={canvasRef} className="star-cursor-canvas" />

      {/* Tête — étoile par défaut, morphe sur l'image du hero. */}
      <div ref={headRef} className="star-cursor-head" data-mode={mode} style={{ opacity: 0 }}>
        <svg className="sc-shape sc-star" viewBox="0 0 24 24" width="28" height="28">
          <path d={STAR_PATH} fill="url(#sc-star-grad)" />
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
