"use client";

import { useEffect, useRef, useState } from "react";
import { Btn, Eyebrow } from "@/components/Primitives";

type Props = {
  name: string;
  quote: string | null;
  bio: string;
  socials: Record<string, string>;
  newsletterUrl: string | null;
  className?: string;
};

// Emphase `*texte*` → <em>, comme dans la source statique.
function renderParagraph(p: string) {
  return p.split(/(\*[^*]+\*)/g).map((chunk, j) =>
    chunk.startsWith("*") && chunk.endsWith("*") ? (
      <em key={j}>{chunk.slice(1, -1)}</em>
    ) : (
      <span key={j}>{chunk}</span>
    ),
  );
}

export function ArtistBio({
  name,
  quote,
  bio,
  socials,
  newsletterUrl,
  className = "",
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [clampable, setClampable] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Le « Voir plus » n'existe qu'en mobile : on mesure si le texte dépasse la
  // hauteur repliée. Sur desktop la zone n'est jamais repliée (md:max-h-none),
  // donc scrollHeight ≈ clientHeight → bouton masqué de toute façon (md:hidden).
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const measure = () => {
      if (!expanded) setClampable(el.scrollHeight > el.clientHeight + 4);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [expanded, bio]);

  const paragraphs = bio.split("\n\n");

  return (
    <div className={className}>
      <Eyebrow>Biographie</Eyebrow>
      <div className="h-3" />

      <div
        ref={bodyRef}
        className={`relative overflow-hidden md:overflow-visible md:max-h-none ${
          expanded ? "max-h-none" : "max-h-[19rem]"
        }`}
      >
        {quote && (
          <blockquote className="font-serif italic text-[clamp(20px,2vw,24px)] leading-[1.45] text-ink-muted my-1 mb-6.5 border-l-2 border-magenta pl-[22px] py-1 max-w-[620px]">
            « {quote} »
          </blockquote>
        )}
        {paragraphs.map((p, i) => (
          <p key={i} className="text-[16px] leading-[1.75]">
            {renderParagraph(p)}
          </p>
        ))}

        {/* Fondu de bas de zone quand le texte est replié (mobile uniquement). */}
        {!expanded && clampable && (
          <div className="md:hidden pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-paper" />
        )}
      </div>

      {clampable && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="md:hidden mt-4 font-serif text-[12px] tracking-[0.2em] uppercase font-bold text-magenta inline-flex items-center gap-1.5 cursor-pointer"
        >
          {expanded ? "Voir moins" : "Voir plus"}
          <span
            aria-hidden
            className={`transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          >
            ⌄
          </span>
        </button>
      )}

      <div className="flex gap-2.5 flex-wrap mt-7">
        {Object.entries(socials).map(([k, v]) => (
          <a
            key={k}
            href={v}
            target="_blank"
            rel="noopener noreferrer"
            className="font-serif text-[11px] tracking-eyebrow uppercase font-bold px-4 py-2.5 border border-ink/30 rounded-full cursor-pointer hover:border-ink/60"
          >
            {k}
          </a>
        ))}
      </div>

      {newsletterUrl && (
        <div className="mt-8">
          <Eyebrow>Newsletter</Eyebrow>
          <div className="h-3" />
          <Btn kind="primary" href={newsletterUrl} newTab>
            S&apos;inscrire à la newsletter de {name}
          </Btn>
        </div>
      )}
    </div>
  );
}
