"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Artist, NewsItem } from "@/lib/data";
import { formatDate } from "@/lib/data";
import { BowMark, Btn, ChapterTitle, Eyebrow } from "@/components/Primitives";
import { ArtistCard } from "@/components/ArtistCard";
import { NewsCard } from "@/components/NewsCard";
import { NewsletterBand } from "@/components/NewsletterBand";
import { useTweaks } from "@/lib/tweaks";

export function HomeClient({
  artists,
  news,
}: {
  artists: Artist[];
  news: NewsItem[];
}) {
  const { tweaks } = useTweaks();

  if (tweaks.homeLayout === "magazine")
    return <HomeMagazine artists={artists} news={news} />;
  if (tweaks.homeLayout === "immersive")
    return <HomeImmersive artists={artists} />;
  return <HomeEditorial artists={artists} news={news} />;
}

function HomeEditorial({
  artists,
  news,
}: {
  artists: Artist[];
  news: NewsItem[];
}) {
  return (
    <div>
      <section
        data-cursor="arrow"
        className="relative overflow-hidden bg-bleu-nuit-700 text-beige-sable px-[clamp(24px,4vw,56px)] py-[clamp(64px,9vw,110px)] h-[90vh] flex items-center"
      >
        <div className="stars" aria-hidden="true" />
        <div className="absolute top-10 right-10 opacity-35 z-10">
          <BowMark size={90} inverse />
        </div>
        <div className="relative z-10 w-full">
          <Eyebrow inverse>Label · Paris — Menucourt · 2026</Eyebrow>
          <h1 className="font-display uppercase tracking-[0.01em] leading-[0.98] mt-3.5 mb-1.5 font-normal text-[clamp(3.5rem,10vw,8.5rem)] max-w-[1200px]">
            Viser la lune,
            <br />
            <span className="inline-flex items-baseline gap-5">
              retomber dans
            </span>
            <span className="font-serif italic text-magenta normal-case">
              les étoiles.
            </span>
          </h1>
          <p className="font-serif italic text-[clamp(18px,1.6vw,22px)] leading-[1.55] max-w-[680px] text-beige-sable/80 mt-8">
            ARTémis Records accompagne les artistes émergents dans le respect de
            leur travail, de leurs conditions, et de leur bien-être.
            Inclusivité, ouverture au monde, diversité.
          </p>
          <div className="flex gap-3.5 mt-[42px] flex-wrap">
            <Btn kind="accent" href="/artists">
              Découvrir le roster
            </Btn>
            <Btn kind="secondary" href="/demo">
              Proposer une démo
            </Btn>
          </div>
        </div>
      </section>

      <section className="px-[clamp(24px,4vw,56px)] py-[clamp(64px,9vw,110px)]">
        <div className="flex justify-between items-end mb-10 flex-wrap gap-5">
          <ChapterTitle
            eyebrow="Notre roster · 2026"
            title="ARTISTES"
            italic="Celles et ceux que nous accompagnons"
          />
          <Btn kind="ghost" href="/artists">
            Voir tout le roster
          </Btn>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
          {artists.map((a, i) => (
            <ArtistCard key={a.id} artist={a} featured={i === 0} />
          ))}
          <div className="min-h-[360px] border border-dashed border-ink/30 flex flex-col items-center justify-center text-center p-7 gap-3">
            <BowMark size={48} />
            <Eyebrow>Prochaine signature</Eyebrow>
            <div className="font-display uppercase tracking-display text-[28px]">
              Bientôt
            </div>
            <div className="italic text-[13px] text-ink-muted max-w-[220px]">
              Le roster reste restreint. Chaque signature est une rencontre.
            </div>
          </div>
        </div>
      </section>

      <section className="px-[clamp(24px,4vw,56px)] pb-[clamp(72px,9vw,110px)] grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-12">
        <div>
          <Eyebrow>Ce qui nous guide</Eyebrow>
          <h2 className="font-display uppercase tracking-display text-[clamp(2rem,4vw,3.25rem)] mt-2.5 mb-7 font-normal">
            Nos valeurs
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {(
              [
                ["Inclusivité", "Une safe place pour les personnes LGBTQIA+, handicapées, racisées, ou porteuses d'une différence."],
                ["Féminisme", "Mettre en avant les femmes et lutter contre leur sous-représentation dans la musique."],
                ["Diversité", "Un catalogue pluriel — styles, identités, régions du monde."],
                ["Bienveillance", "Communication, respect, écoute. Une industrie plus saine commence ici."],
              ] as const
            ).map(([h, p]) => (
              <div key={h}>
                <h4 className="font-display uppercase tracking-eyebrow text-[14px] text-magenta mb-2.5 font-normal">
                  {h}
                </h4>
                <p className="text-[14px] leading-[1.6] m-0 text-ink-muted">
                  {p}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-7">
            <Btn kind="ghost" href="/about">
              Lire le manifeste
            </Btn>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-5">
            <div>
              <Eyebrow>À l&apos;affiche</Eyebrow>
              <h2 className="font-display uppercase tracking-display text-[clamp(2rem,4vw,3.25rem)] mt-2.5 font-normal">
                Journal
              </h2>
            </div>
            <Btn kind="ghost" href="/news">
              Tout lire
            </Btn>
          </div>
          <div className="flex flex-col">
            {news.slice(0, 3).map((n) => (
              <Link
                key={n.id}
                href={`/news/${n.id}`}
                className="grid grid-cols-[96px_1fr] gap-[18px] py-5.5 border-t border-ink/15 cursor-pointer items-center"
              >
                <div
                  className="grain w-[96px] h-[72px]"
                  style={{ background: `center/cover no-repeat url(${n.imageUrl})` }}
                />
                <div>
                  <Eyebrow className="!text-magenta mb-1.5">
                    {n.category} · {formatDate(n.date)}
                  </Eyebrow>
                  <h3 className="font-display uppercase tracking-display text-[20px] my-1.5 font-normal">
                    {n.title}
                  </h3>
                  <p className="text-[13px] text-ink-muted italic m-0 leading-[1.55]">
                    {n.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <NewsletterBand />
    </div>
  );
}

function HomeMagazine({
  artists,
  news,
}: {
  artists: Artist[];
  news: NewsItem[];
}) {
  const featured = artists[0];
  return (
    <div>
      <section className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] min-h-[84vh] items-stretch">
        <div className="relative overflow-hidden bg-bleu-nuit-700 text-beige-sable px-[clamp(28px,4vw,56px)] py-[clamp(56px,7vw,96px)] flex flex-col justify-center">
          <div className="stars" aria-hidden="true" />
          <div className="relative z-10">
            <Eyebrow inverse className="!text-magenta">
              ARTémis Records · Music Label
            </Eyebrow>
            <h1 className="font-display uppercase tracking-display text-[clamp(2.5rem,7vw,82px)] mt-3 mb-4 font-normal leading-[0.98] text-beige-sable">
              Viser la lune, retomber dans les étoiles.
            </h1>
            <p className="italic text-[18px] leading-[1.55] text-beige-sable/75 max-w-[520px]">
              ARTémis Records est un label français dédié aux artistes émergents —
              axé sur le respect du travail, les conditions et le bien-être des
              artistes.
            </p>
            <div className="mt-7 flex gap-3.5 flex-wrap">
              <Btn kind="light" href="/artists">
                Roster
              </Btn>
              <Btn kind="ghost" href="/about" className="!text-beige-sable">
                Notre histoire
              </Btn>
            </div>
          </div>
        </div>
        {featured && (
          <Link
            href={`/artists/${featured.id}`}
            className="grain flex flex-col justify-end text-beige-sable cursor-pointer p-[clamp(28px,4vw,48px)]"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(28,31,74,0.1), rgba(28,31,74,0.5)), url(${featured.coverUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <Eyebrow inverse className="!text-magenta">
              À la une
            </Eyebrow>
            <div className="font-display uppercase tracking-display text-[clamp(2.5rem,5vw,4.5rem)] leading-none mt-2">
              {featured.name}
            </div>
            <div className="italic text-[16px] opacity-85 mt-2.5 max-w-[420px]">
              {featured.tagline}
            </div>
          </Link>
        )}
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

      <NewsletterBand />
    </div>
  );
}

function HomeImmersive({ artists }: { artists: Artist[] }) {
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    if (artists.length === 0) return;
    const t = setInterval(
      () => setSlide((s) => (s + 1) % artists.length),
      6000,
    );
    return () => clearInterval(t);
  }, [artists.length]);
  const cur = artists[slide] || artists[0];

  return (
    <div>
      <section className="relative overflow-hidden bg-bleu-nuit-900 h-[90vh]">
        <div className="stars" aria-hidden="true" />
        {artists.map((a, i) => (
          <div
            key={a.id}
            className="grain absolute inset-0 transition-opacity duration-[1200ms] ease-[var(--ease-soft)]"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(28,31,74,0.25) 0%, rgba(28,31,74,0.85) 100%), url(${a.coverUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: i === slide ? 1 : 0,
            }}
          />
        ))}
        <div className="relative h-full flex flex-col justify-center px-[clamp(56px,8vw,120px)] text-beige-sable z-[2]">
          <Eyebrow inverse className="!text-magenta">
            ARTémis Records · Roster 2026
          </Eyebrow>
          <h1 className="font-display uppercase tracking-display text-[clamp(4rem,14vw,12rem)] leading-[0.92] mt-3.5 font-normal max-w-[90%]">
            {cur?.name}
          </h1>
          <div className="italic text-[clamp(16px,1.6vw,22px)] mt-5 max-w-[540px] opacity-90">
            {cur?.tagline}
          </div>
          <div className="mt-9 flex gap-3.5 flex-wrap">
            {cur && (
              <Btn kind="accent" href={`/artists/${cur.id}`}>
                Découvrir
              </Btn>
            )}
            <Btn kind="secondary" href="/artists">
              Tout le roster
            </Btn>
          </div>
          <div className="absolute bottom-12 left-[clamp(56px,8vw,120px)] flex gap-2.5">
            {artists.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSlide(i)}
                aria-label={`Aller à la diapositive ${i + 1}`}
                className="h-0.5 cursor-pointer transition-all duration-300 ease-[var(--ease-out)]"
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
          <div className="absolute bottom-12 right-[clamp(56px,8vw,120px)] text-[11px] tracking-eyebrow uppercase opacity-60 font-bold">
            Défilement auto · {String(slide + 1).padStart(2, "0")} /{" "}
            {String(artists.length).padStart(2, "0")}
          </div>
        </div>
      </section>

      <section className="px-[clamp(24px,4vw,56px)] py-[clamp(64px,9vw,110px)]">
        <div className="max-w-[720px] mx-auto text-center">
          <Eyebrow className="inline-block">Manifeste</Eyebrow>
          <h2 className="font-display uppercase tracking-display text-[clamp(2.25rem,5vw,4rem)] leading-[1.1] mt-4 mb-5 font-normal">
            Une safe place pour tous.
          </h2>
          <p className="italic text-[18px] leading-[1.7] text-ink-muted">
            ARTémis Records est né d&apos;une idée commune : faire du monde de la
            musique un espace respectueux, inclusif, bienveillant. Nous
            accompagnons des artistes émergents — des voix, des textes, des
            regards — en veillant à leurs conditions de travail et à leur
            bien-être.
          </p>
          <div className="mt-7 flex gap-3.5 justify-center flex-wrap">
            <Btn kind="primary" href="/about">
              Lire le manifeste
            </Btn>
            <Btn kind="ghost" href="/artists">
              Roster
            </Btn>
          </div>
        </div>
      </section>

      <NewsletterBand />
    </div>
  );
}
