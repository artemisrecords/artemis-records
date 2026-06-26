"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  identitySchema,
  bioSchema,
  discographySchema,
  embedsSchema,
  socialsSchema,
  showSchema,
  createArtistSchema,
} from "@/lib/validation/artist";
import * as m from "@/lib/db/artist-mutations";
import { requireArtistAccess, requireRole } from "@/lib/auth-helpers";
import { parseEmbedUrl } from "@/lib/embeds";

export type ActionResult = { ok: true } | { ok: false; error: string };

function firstError(issues: { message: string }[]): string {
  return issues[0]?.message ?? "Données invalides.";
}

function revalidateArtist(id: string) {
  revalidatePath("/backoffice/artistes");
  revalidatePath(`/backoffice/artistes/${id}`);
  revalidatePath("/artists");
  revalidatePath("/artists/[id]", "page");
  revalidatePath("/espace");
}

export async function saveIdentity(id: string, input: unknown): Promise<ActionResult> {
  await requireArtistAccess(id);
  const parsed = identitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await m.updateIdentity(id, parsed.data);
  revalidateArtist(id);
  return { ok: true };
}

export async function saveBio(id: string, input: unknown): Promise<ActionResult> {
  await requireArtistAccess(id);
  const parsed = bioSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await m.updateBio(id, parsed.data);
  revalidateArtist(id);
  return { ok: true };
}

export async function setArtistPublished(id: string, published: boolean): Promise<ActionResult> {
  await requireRole("superadmin", "admin");
  await m.setPublished(id, published);
  revalidateArtist(id);
  return { ok: true };
}

export async function saveDiscography(id: string, items: unknown): Promise<ActionResult> {
  await requireArtistAccess(id);
  const parsed = discographySchema.safeParse(items);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await m.replaceDiscography(id, parsed.data);
  revalidateArtist(id);
  return { ok: true };
}

export async function saveEmbeds(id: string, items: unknown): Promise<ActionResult> {
  await requireArtistAccess(id);
  const parsed = embedsSchema.safeParse(items);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await m.replaceEmbeds(id, parsed.data);
  revalidateArtist(id);
  return { ok: true };
}

export async function saveSocials(id: string, socials: unknown): Promise<ActionResult> {
  await requireArtistAccess(id);
  const parsed = socialsSchema.safeParse(socials);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await m.replaceSocials(id, parsed.data);
  revalidateArtist(id);
  return { ok: true };
}

export async function saveShow(artistId: string, input: unknown): Promise<ActionResult> {
  await requireArtistAccess(artistId);
  const parsed = showSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  const id =
    typeof (input as { id?: unknown })?.id === "string"
      ? (input as { id: string }).id
      : undefined;
  await m.upsertShow(artistId, { ...parsed.data, id });
  revalidateArtist(artistId);
  return { ok: true };
}

export async function removeShow(artistId: string, showId: string): Promise<ActionResult> {
  await requireArtistAccess(artistId);
  const removed = await m.deleteShow(showId, artistId);
  if (!removed) return { ok: false, error: "Cette date n'appartient pas à cette fiche." };
  revalidateArtist(artistId);
  return { ok: true };
}

export async function saveMedia(
  id: string,
  media: { portraitUrl?: string; coverUrl?: string; gallery?: string[] },
): Promise<ActionResult> {
  await requireArtistAccess(id);
  await m.setMedia(id, media);
  revalidateArtist(id);
  return { ok: true };
}

export async function archiveArtist(id: string, confirm: string): Promise<ActionResult> {
  await requireRole("superadmin", "admin");
  if (confirm.trim().toLowerCase() !== "oui") {
    return { ok: false, error: "Tapez « oui » pour confirmer la suppression." };
  }
  await m.deleteArtist(id);
  revalidatePath("/backoffice/artistes");
  revalidatePath("/artists");
  redirect("/backoffice/artistes");
}

export async function createArtistAction(input: unknown): Promise<ActionResult> {
  await requireRole("superadmin", "admin");
  const parsed = createArtistSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  const id = await m.createArtist(parsed.data);
  revalidatePath("/backoffice/artistes");
  redirect(`/backoffice/artistes/${id}`);
}

export type ResolveEmbedResult =
  | { ok: true; type: "spotify" | "youtube"; src: string; title: string }
  | { ok: false; error: string };

/**
 * Reformate un lien de partage en URL d'embed et récupère le titre via oEmbed
 * (appel serveur : les endpoints oEmbed de Spotify/YouTube ne sont pas CORS).
 * Si l'oEmbed échoue, l'embed reste valide avec un titre vide.
 */
export async function resolveEmbed(rawUrl: string): Promise<ResolveEmbedResult> {
  await requireRole("superadmin", "admin", "artiste");

  const parsed = parseEmbedUrl(rawUrl);
  if (!parsed) {
    return { ok: false, error: "Lien non reconnu (Spotify ou YouTube attendu)." };
  }

  let title = "";
  try {
    const endpoint =
      parsed.type === "spotify"
        ? `https://open.spotify.com/oembed?url=${encodeURIComponent(parsed.src)}`
        : `https://www.youtube.com/oembed?url=${encodeURIComponent(
            `https://www.youtube.com/watch?v=${parsed.src.split("/embed/")[1]}`,
          )}&format=json`;
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = (await res.json()) as { title?: unknown };
      if (typeof data.title === "string") title = data.title;
    }
  } catch {
    // oEmbed indisponible → on garde title = "" ; l'embed est valide quand même.
  }

  return { ok: true, type: parsed.type, src: parsed.src, title };
}
