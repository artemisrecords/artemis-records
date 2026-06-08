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

type CursorMode = "star" | "pointer" | "arrow-left" | "arrow-right" | "view";
type TrailPoint = { x: number; y: number; t: number };

// Durée de vie d'un point de traînée (ms) : la traînée s'efface en douceur.
const TTL = 340;
// Épaisseur max du trait (à la tête), en px.
const MAX_WIDTH = 5;
// Garde-fou sur la taille du buffer (mouvements très rapides = beaucoup de points).
const MAX_POINTS = 160;

const STAR_PATH =
  "M12 0 L13.2 10.8 L24 12 L13.2 13.2 L12 24 L10.8 13.2 L0 12 L10.8 10.8 Z";

// Éléments « cliquables » : au survol, l'étoile devient un doigt (mode pointer).
// On couvre les balises interactives natives + l'utilitaire Tailwind
// `cursor-pointer` (le `cursor: none` global masque la détection par style
// calculé, d'où une détection structurelle).
const CLICKABLE_SELECTOR =
  'a[href], button, [role="button"], select, summary, label[for], ' +
  'input[type="submit"], input[type="button"], input[type="checkbox"], ' +
  'input[type="radio"], .cursor-pointer';

/** Détermine la forme selon l'élément survolé et la position du pointeur. */
function resolveMode(el: Element | null, clientX: number): CursorMode {
  const hero = el?.closest<HTMLElement>('[data-cursor="hero"]');
  if (!hero) return el?.closest(CLICKABLE_SELECTOR) ? "pointer" : "star";
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
      if (lastMode === "star" || lastMode === "pointer") {
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

      // On élague les points trop vieux : la traînée s'efface en douceur — à
      // l'arrêt, comme en entrant sur l'image (où l'on cesse d'ajouter des
      // points, sans coupure brutale ni réapparition ultérieure).
      while (points.length && now - points[points.length - 1].t > TTL) {
        points.pop();
      }

      if (visible && points.length >= 2) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        // Courbes quadratiques entre les milieux de segments → trait lissé.
        for (let i = 1; i < points.length; i++) {
          const p0 = points[i - 1];
          const p1 = points[i];
          const p2 = points[i + 1] ?? p1;
          const start = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
          const end = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
          const fade = Math.max(0, 1 - (now - p1.t) / TTL); // 1 (tête) → 0 (queue)
          if (fade <= 0) continue;
          const w = MAX_WIDTH * fade;

          // Glow néon recréé en empilant trois traits translucides plutôt qu'avec
          // shadowBlur : un flou gaussien par segment (~150 segments/frame) est
          // l'opération canvas la plus coûteuse et saturait le thread principal
          // (traînée saccadée ET étoile en retard sur la souris).
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.quadraticCurveTo(p1.x, p1.y, end.x, end.y);

          // Halo externe diffus.
          ctx.strokeStyle = `rgba(210, 74, 142, ${0.14 * fade})`;
          ctx.lineWidth = w * 3.6;
          ctx.stroke();

          // Bords magenta.
          ctx.strokeStyle = `rgba(190, 60, 125, ${0.5 * fade})`;
          ctx.lineWidth = w * 2.1;
          ctx.stroke();

          // Cœur blanc.
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.92 * fade})`;
          ctx.lineWidth = Math.max(w * 0.85, 0.6);
          ctx.stroke();
        }
      }

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

        {/* Main « clic » (index pointé) — tracé néon blanc + halo magenta,
            dans le même langage que la traînée et l'étoile. */}
        <svg
          className="sc-shape sc-pointer"
          viewBox="0 0 24 24"
          width="26"
          height="26"
          fill="none"
          stroke="#ffffff"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 14a8 8 0 0 1-8 8" />
          <path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
          <path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1" />
          <path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10" />
          <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
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
