"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Artist, NewsItem } from "@/lib/data";
import { Btn, ChapterTitle, Eyebrow } from "@/components/Primitives";
import { ArtistCard } from "@/components/ArtistCard";
import { NewsCard } from "@/components/NewsCard";
import { NewsletterBand } from "@/components/NewsletterBand";

export function HomeClient({
  artists,
  news,
  newsletterUrl,
}: {
  artists: Artist[];
  news: NewsItem[];
  newsletterUrl?: string | null;
}) {
  return (
    <div>
      <section className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] min-h-[84vh] items-stretch">
        <div className="relative overflow-hidden bg-bleu-nuit-700 text-beige-sable px-[clamp(28px,4vw,56px)] py-[clamp(56px,7vw,96px)] flex flex-col justify-center">
          <div className="stars" aria-hidden="true" />
          <div className="relative z-10">
            <Eyebrow inverse className="!text-magenta">
              ARTémis Records · Music Label
            </Eyebrow>
            <h1 className="font-display uppercase tracking-display text-[clamp(2rem,5vw,64px)] mt-3 mb-4 font-normal leading-[0.98] text-beige-sable">
              Viser la lune, retomber dans les étoiles.
            </h1>
            <p className="italic text-[18px] leading-[1.55] text-beige-sable/75 max-w-[520px]">
              ARTémis Records est un label français dédié aux artistes émergents,
              axé sur le respect du travail, les conditions et le bien-être des
              artistes.
            </p>
            <div className="mt-7 flex gap-3.5 flex-wrap">
              <Btn kind="accent" href="/artists">
                Roster
              </Btn>
              <Btn kind="ghost" href="/about" className="!text-beige-sable">
                Notre histoire
              </Btn>
            </div>
          </div>
        </div>
        <HeroCarousel artists={artists} />
      </section>

      <section className="px-[clamp(24px,4vw,56px)] py-[clamp(56px,7vw,96px)]">
        <ChapterTitle
          eyebrow="Roster"
          title="ARTISTES"
          italic="Nos signatures"
          size="md"
        />
        <div className="h-8" />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
          {artists.map((a) => (
            <ArtistCard key={a.id} artist={a} />
          ))}
        </div>
      </section>

      <section className="bg-bleu-nuit-700 text-beige-sable px-[clamp(24px,4vw,56px)] py-[clamp(56px,7vw,96px)]">
        <ChapterTitle
          eyebrow="Journal"
          title="ACTUALITÉS"
          italic="Ce qui s'écrit chez nous"
          inverse
          size="md"
        />
        <div className="h-8" />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[22px]">
          {news.slice(0, 3).map((n) => (
            <NewsCard key={n.id} news={n} inverse />
          ))}
        </div>
      </section>

      <NewsletterBand href={newsletterUrl} />
    </div>
  );
}

function HeroCarousel({ artists }: { artists: Artist[] }) {
  const [slide, setSlide] = useState(0);
  const [hovering, setHovering] = useState(false);

  // auto-advance, paused while the mouse is over the carousel
  useEffect(() => {
    if (artists.length <= 1 || hovering) return;
    const t = setInterval(
      () => setSlide((s) => (s + 1) % artists.length),
      5000,
    );
    return () => clearInterval(t);
  }, [artists.length, hovering]);

  const cur = artists[slide];
  if (!cur) return null;

  const go = (dir: number) =>
    setSlide((s) => (s + dir + artists.length) % artists.length);

  return (
    <div
      data-cursor="hero"
      className="relative overflow-hidden grain text-beige-sable min-h-[340px] cursor-none"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {artists.map((a, i) => (
        <div
          key={a.id}
          aria-hidden
          className="absolute inset-0 pointer-events-none transition-opacity duration-[1200ms] ease-[var(--ease-soft)]"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(28,31,74,0.1), rgba(28,31,74,0.5)), url(${a.coverUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: i === slide ? 1 : 0,
          }}
        />
      ))}

      {/* center → artist page */}
      <Link
        href={`/artists/${cur.id}`}
        className="absolute inset-0 z-10 flex flex-col justify-end cursor-none no-underline text-beige-sable p-[clamp(28px,4vw,48px)]"
      >
        <Eyebrow inverse className="!text-magenta">
          À la une
        </Eyebrow>
        <div className="font-display uppercase tracking-display text-[clamp(2.5rem,5vw,4.5rem)] leading-none mt-2">
          {cur.name}
        </div>
        <div className="italic text-[16px] opacity-85 mt-2.5 max-w-[420px]">
          {cur.tagline}
        </div>
      </Link>

      {/* edge zones → previous / next slide */}
      {artists.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Artiste précédent"
            className="absolute left-0 inset-y-0 z-20 w-[18%] min-w-[64px] max-w-[140px] cursor-none border-0 bg-transparent"
          />
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Artiste suivant"
            className="absolute right-0 inset-y-0 z-20 w-[18%] min-w-[64px] max-w-[140px] cursor-none border-0 bg-transparent"
          />
        </>
      )}

      {/* progress indicator (visual only) */}
      {artists.length > 1 && (
        <div className="absolute z-30 bottom-[clamp(28px,4vw,48px)] right-[clamp(28px,4vw,48px)] flex gap-2.5 pointer-events-none">
          {artists.map((a, i) => (
            <span
              key={a.id}
              className="h-0.5 transition-all duration-300 ease-[var(--ease-out)]"
              style={{
                width: i === slide ? 36 : 14,
                background:
                  i === slide
                    ? "var(--color-magenta)"
                    : "rgba(237,224,212,0.4)",
              }}
            />
          ))}
        </div>
      )}

    </div>
  );
}
