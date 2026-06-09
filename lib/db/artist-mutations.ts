import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "./index";
import { artists, artistShows } from "./schema";
import type { DiscoItem, Embed, ArtistShow } from "./schema";
import { slugify } from "@/lib/slug";

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "artiste";
  let candidate = root;
  let n = 2;
  // Boucle bornée : on s'arrête dès qu'aucune ligne ne porte cet id.
  while (true) {
    const [hit] = await db
      .select({ id: artists.id })
      .from(artists)
      .where(eq(artists.id, candidate))
      .limit(1);
    if (!hit) return candidate;
    candidate = `${root}-${n++}`;
  }
}

export async function createArtist(input: {
  name: string;
  slug?: string;
  tagline?: string;
  genre?: string;
  signedYear?: string;
  bioShort?: string;
}): Promise<string> {
  const id = await uniqueSlug(input.slug && input.slug.length > 0 ? input.slug : input.name);
  await db.insert(artists).values({
    id,
    name: input.name,
    tagline: input.tagline ?? "",
    genre: input.genre ?? "",
    signedYear: input.signedYear ?? "",
    published: false,
    portraitUrl: "",
    coverUrl: "",
    bioShort: input.bioShort ?? "",
    bioLong: "",
  });
  return id;
}

export async function updateIdentity(
  id: string,
  data: {
    name: string;
    tagline: string;
    genre: string;
    signedYear: string;
    primaryColor: string;
    quote: string;
    genres: string[];
  },
): Promise<void> {
  await db
    .update(artists)
    .set({
      name: data.name,
      tagline: data.tagline,
      genre: data.genre,
      signedYear: data.signedYear,
      primaryColor: data.primaryColor === "" ? null : data.primaryColor,
      quote: data.quote === "" ? null : data.quote,
      genres: data.genres,
      updatedAt: new Date(),
    })
    .where(eq(artists.id, id));
}

export async function updateBio(
  id: string,
  data: { bioShort: string; bioLong: string },
): Promise<void> {
  await db
    .update(artists)
    .set({ bioShort: data.bioShort, bioLong: data.bioLong, updatedAt: new Date() })
    .where(eq(artists.id, id));
}

export async function setPublished(id: string, published: boolean): Promise<void> {
  await db
    .update(artists)
    .set({ published, updatedAt: new Date() })
    .where(eq(artists.id, id));
}

export async function replaceDiscography(id: string, items: DiscoItem[]): Promise<void> {
  await db
    .update(artists)
    .set({ discography: items, updatedAt: new Date() })
    .where(eq(artists.id, id));
}

export async function replaceEmbeds(id: string, items: Embed[]): Promise<void> {
  await db
    .update(artists)
    .set({ embeds: items, updatedAt: new Date() })
    .where(eq(artists.id, id));
}

export async function replaceSocials(
  id: string,
  socials: Record<string, string>,
): Promise<void> {
  await db
    .update(artists)
    .set({ socials, updatedAt: new Date() })
    .where(eq(artists.id, id));
}

export async function setMedia(
  id: string,
  media: { portraitUrl?: string; coverUrl?: string; gallery?: string[] },
): Promise<void> {
  const patch: Partial<typeof artists.$inferInsert> = { updatedAt: new Date() };
  if (media.portraitUrl !== undefined) patch.portraitUrl = media.portraitUrl;
  if (media.coverUrl !== undefined) patch.coverUrl = media.coverUrl;
  if (media.gallery !== undefined) patch.gallery = media.gallery;
  await db.update(artists).set(patch).where(eq(artists.id, id));
}

export async function upsertShow(
  artistId: string,
  show: {
    id?: string;
    date: string;
    city: string;
    venue: string;
    status: string;
    free: boolean;
    ticketUrl: string;
  },
): Promise<string> {
  if (show.id) {
    // Borné par artistId : on ne met à jour que les dates de CETTE fiche.
    await db
      .update(artistShows)
      .set({
        date: show.date,
        city: show.city,
        venue: show.venue,
        status: show.status === "" ? null : show.status,
        free: show.free,
        ticketUrl: show.ticketUrl === "" ? null : show.ticketUrl,
      })
      .where(and(eq(artistShows.id, show.id), eq(artistShows.artistId, artistId)));
    return show.id;
  }
  const id = randomUUID();
  await db.insert(artistShows).values({
    id,
    artistId,
    date: show.date,
    city: show.city,
    venue: show.venue,
    status: show.status === "" ? null : show.status,
    free: show.free,
    ticketUrl: show.ticketUrl === "" ? null : show.ticketUrl,
  });
  return id;
}

/** Avec `artistId`, la suppression est bornée aux dates de cette fiche. */
export async function deleteShow(showId: string, artistId?: string): Promise<boolean> {
  const rows = await db
    .delete(artistShows)
    .where(
      artistId
        ? and(eq(artistShows.id, showId), eq(artistShows.artistId, artistId))
        : eq(artistShows.id, showId),
    )
    .returning({ id: artistShows.id });
  return rows.length > 0;
}

export async function deleteArtist(id: string): Promise<void> {
  // Cascade sur artist_shows (FK onDelete: "cascade").
  await db.delete(artists).where(eq(artists.id, id));
}

export type { ArtistShow };
