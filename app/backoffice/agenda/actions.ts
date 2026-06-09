"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import { showSchema } from "@/lib/validation/artist";
import { upsertShow, deleteShow } from "@/lib/db/artist-mutations";

export type ActionResult = { ok: true } | { ok: false; error: string };

function revalidate() {
  revalidatePath("/backoffice/agenda");
  revalidatePath("/backoffice/artistes");
  revalidatePath("/artists");
  revalidatePath("/artists/[id]", "page");
}

export async function saveShow(artistId: string, input: unknown): Promise<ActionResult> {
  await requireRole("superadmin", "admin");
  if (!artistId) return { ok: false, error: "Artiste requis." };
  const parsed = showSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const id =
    typeof (input as { id?: unknown })?.id === "string"
      ? (input as { id: string }).id
      : undefined;
  await upsertShow(artistId, { ...parsed.data, id });
  revalidate();
  return { ok: true };
}

export async function removeShow(showId: string): Promise<ActionResult> {
  await requireRole("superadmin", "admin");
  if (!showId) return { ok: false, error: "Identifiant manquant." };
  await deleteShow(showId);
  revalidate();
  return { ok: true };
}
