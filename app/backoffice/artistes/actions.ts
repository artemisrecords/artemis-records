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

export type ActionResult = { ok: true } | { ok: false; error: string };

function firstError(issues: { message: string }[]): string {
  return issues[0]?.message ?? "Données invalides.";
}

function revalidateArtist(id: string) {
  revalidatePath("/backoffice/artistes");
  revalidatePath(`/backoffice/artistes/${id}`);
  revalidatePath("/artists");
  revalidatePath("/artists/[id]", "page");
}

export async function saveIdentity(id: string, input: unknown): Promise<ActionResult> {
  const parsed = identitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await m.updateIdentity(id, parsed.data);
  revalidateArtist(id);
  return { ok: true };
}

export async function saveBio(id: string, input: unknown): Promise<ActionResult> {
  const parsed = bioSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await m.updateBio(id, parsed.data);
  revalidateArtist(id);
  return { ok: true };
}

export async function setArtistPublished(id: string, published: boolean): Promise<ActionResult> {
  await m.setPublished(id, published);
  revalidateArtist(id);
  return { ok: true };
}

export async function saveDiscography(id: string, items: unknown): Promise<ActionResult> {
  const parsed = discographySchema.safeParse(items);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await m.replaceDiscography(id, parsed.data);
  revalidateArtist(id);
  return { ok: true };
}

export async function saveEmbeds(id: string, items: unknown): Promise<ActionResult> {
  const parsed = embedsSchema.safeParse(items);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await m.replaceEmbeds(id, parsed.data);
  revalidateArtist(id);
  return { ok: true };
}

export async function saveSocials(id: string, socials: unknown): Promise<ActionResult> {
  const parsed = socialsSchema.safeParse(socials);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await m.replaceSocials(id, parsed.data);
  revalidateArtist(id);
  return { ok: true };
}

export async function saveShow(artistId: string, input: unknown): Promise<ActionResult> {
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
  await m.deleteShow(showId);
  revalidateArtist(artistId);
  return { ok: true };
}

export async function saveMedia(
  id: string,
  media: { portraitUrl?: string; coverUrl?: string; gallery?: string[] },
): Promise<ActionResult> {
  await m.setMedia(id, media);
  revalidateArtist(id);
  return { ok: true };
}

export async function archiveArtist(id: string, confirm: string): Promise<ActionResult> {
  if (confirm.trim().toLowerCase() !== "oui") {
    return { ok: false, error: "Tapez « oui » pour confirmer la suppression." };
  }
  await m.deleteArtist(id);
  revalidatePath("/backoffice/artistes");
  revalidatePath("/artists");
  redirect("/backoffice/artistes");
}

export async function createArtistAction(input: unknown): Promise<ActionResult> {
  const parsed = createArtistSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  const id = await m.createArtist(parsed.data);
  revalidatePath("/backoffice/artistes");
  redirect(`/backoffice/artistes/${id}`);
}
