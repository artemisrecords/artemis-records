import { notFound } from "next/navigation";
import Link from "next/link";
import { getArtists, findArtist } from "@/lib/db/queries";
import { Badge, Btn, ChapterTitle, Eyebrow } from "@/components/Primitives";
import { ArtistBio } from "@/components/ArtistBio";
import { EmbedPlayer } from "@/components/EmbedPlayer";
import type { CSSProperties } from "react";

export async function generateStaticParams() {
  const all = await getArtists();
  return all.map((a) => ({ id: a.id }));
}

type Params = Promise<{ id: string }>;

export default async function ArtistDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const artist = await findArtist(id);
  if (!artist) notFound();

  const rootStyle: CSSProperties = artist.primaryColor
    ? ({ ["--color-magenta" as string]: artist.primaryColor } as CSSProperties)
    : {};

  return (
    <article style={rootStyle}>
      {/* Hero */}
      <section
        className="grain text-beige-sable px-[clamp(24px,4vw,56px)] pt-[clamp(64px,10vw,140px)] pb-[clamp(80px,12vw,160px)]"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(28,31,74,0.3) 0%, rgba(28,31,74,0.85) 100%), url(${artist.coverUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Link
          href="/artists"
          className="text-[11px] tracking-eyebrow uppercase text-beige-sable/70 font-bold cursor-pointer"
        >
          ⟵ Roster
        </Link>
        <div className="h-8" />
        <Eyebrow inverse className="!text-magenta">
          Artiste · Signée {artist.signedYear}
        </Eyebrow>
        <h1 className="font-display uppercase tracking-display leading-[0.95] text-[clamp(3.5rem,11vw,10rem)] mt-2.5 mb-3.5 font-normal">
          {artist.name}
        </h1>
        <div className="italic text-[clamp(18px,1.8vw,22px)] opacity-90 max-w-[640px]">
          {artist.tagline}
        </div>
        <div className="flex gap-2 mt-6 flex-wrap">
          {artist.genres.map((g) => (
            <Badge key={g} tone="inverse">
              {g}
            </Badge>
          ))}
        </div>
      </section>

      {/* Bio + discography.
          Desktop : la discographie « flotte » en haut à droite et la biographie
          s'écoule à côté puis SOUS elle une fois sa hauteur dépassée (plus de
          colonne vide à droite). `md:flow-root` confine le float dans la section.
          Mobile : pile flex (bio puis discographie) ; la bio longue est repliée
          derrière un « Voir plus » (cf. ArtistBio). */}
      <section className="px-[clamp(24px,4vw,56px)] py-[clamp(56px,8vw,96px)] flex flex-col md:flow-root">
        {artist.discography.length > 0 && (
          <aside className="order-2 mt-12 md:mt-0 md:float-right md:w-[500px] md:ml-12 md:mb-4">
            <Eyebrow>Discographie</Eyebrow>
            <div className="mt-4">
              {artist.discography.map((d) => (
                <div
                  key={d.id}
                  className="grid grid-cols-[72px_1fr_auto] gap-4 py-4 border-t border-ink/15 items-center"
                >
                  <div
                    className="grain w-[72px] h-[72px] rounded-[2px]"
                    style={{
                      background: `center/cover no-repeat url(${d.cover})`,
                    }}
                  />
                  <div>
                    <div className="text-[10px] tracking-eyebrow uppercase text-magenta font-bold">
                      {d.kind}
                    </div>
                    <div className="font-display uppercase tracking-display text-[20px] my-0.5 font-normal">
                      {d.title}
                    </div>
                    {d.note && (
                      <div className="text-[12px] italic text-ink-muted">
                        {d.note}
                      </div>
                    )}
                  </div>
                  <div className="italic text-[13px] text-ink-muted">
                    {d.year}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        <ArtistBio
          className="order-1"
          name={artist.name}
          quote={artist.quote}
          bio={artist.bioLong || artist.bioShort}
          socials={artist.socials}
          newsletterUrl={artist.newsletterUrl}
        />
      </section>

      {/* Embeds */}
      {artist.embeds.length > 0 && (
        <section className="bg-wash-soft px-[clamp(24px,4vw,56px)] py-[clamp(56px,8vw,96px)]">
          <ChapterTitle
            eyebrow="À écouter · à voir"
            title="EN SCÈNE"
            italic="Extraits, clips, sessions"
            size="md"
          />
          <div className="h-8" />
          <div className="flex flex-col gap-12">
            {[...new Set(artist.embeds.map((e) => e.type))].map((type) => (
              <div
                key={type}
                className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-6"
              >
                {artist.embeds
                  .filter((e) => e.type === type)
                  .map((e, i) => (
                    <EmbedPlayer key={i} embed={e} />
                  ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Shows */}
      {artist.shows.length > 0 && (
        <section className="px-[clamp(24px,4vw,56px)] py-[clamp(56px,8vw,96px)]">
          <ChapterTitle
            eyebrow="Tournée"
            title="EN CONCERT"
            italic="Dates à venir"
            size="md"
          />
          <div className="h-8" />
          <div>
            {artist.shows.map((s, i) => {
              const d = new Date(s.date);
              return (
                <div
                  key={s.id}
                  className={`grid grid-cols-[100px_1fr_1fr_auto] gap-5 items-center py-5.5 border-b border-ink/15 ${
                    i === 0 ? "border-t border-t-ink/30" : ""
                  }`}
                >
                  <div>
                    <div className="font-display uppercase tracking-display text-[36px] leading-none font-normal">
                      {String(d.getDate()).padStart(2, "0")}
                    </div>
                    <div className="text-[11px] tracking-eyebrow uppercase text-ink-subtle font-bold mt-1">
                      {d.toLocaleDateString("fr-FR", {
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="font-display uppercase tracking-display text-[22px] font-normal">
                      {s.city}
                    </div>
                    <div className="italic text-[14px] text-ink-muted">
                      {s.venue}
                    </div>
                  </div>
                  <div
                    className={`text-[11px] tracking-eyebrow uppercase font-bold ${
                      s.free ? "text-magenta" : "text-ink-subtle"
                    }`}
                  >
                    {s.free ? "Entrée libre" : s.status}
                  </div>
                  {s.free ? (
                    <span className="text-[11px] tracking-eyebrow uppercase text-ink-subtle font-bold px-1 py-3.5">
                      -
                    </span>
                  ) : (
                    <Btn kind="ghost" href={s.ticketUrl || "#"}>
                      Billetterie
                    </Btn>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Gallery */}
      {artist.gallery.length > 0 && (
        <section className="bg-bleu-nuit-700 px-[clamp(24px,4vw,56px)] py-[clamp(56px,8vw,96px)]">
          <ChapterTitle
            eyebrow="En image"
            title="GALERIE"
            italic="Sessions, scène, portraits"
            inverse
            size="md"
          />
          <div className="h-8" />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
            {artist.gallery.map((g, i) => (
              <div
                key={i}
                className="grain"
                style={{
                  aspectRatio: i % 3 === 0 ? "3/4" : "4/3",
                  background: `center/cover no-repeat url(${g})`,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-[clamp(24px,4vw,56px)] py-[clamp(56px,8vw,96px)] text-center">
        <Eyebrow>Presse · Booking</Eyebrow>
        <h2 className="font-display uppercase tracking-display text-[clamp(2rem,4vw,3rem)] my-3 mb-4 font-normal">
          Écrire au label
        </h2>
        <p className="italic text-[16px] text-ink-muted max-w-[480px] mx-auto mb-6">
          Pour toute demande concernant {artist.name} : presse, booking,
          diffusion radio.
        </p>
        <Btn kind="primary" href="/contact">
          Contacter ARTémis
        </Btn>
      </section>
    </article>
  );
}
