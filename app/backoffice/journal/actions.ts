"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { newsSchema, createNewsSchema } from "@/lib/validation/news";
import * as m from "@/lib/db/news-mutations";

export type ActionResult = { ok: true } | { ok: false; error: string };

function firstError(issues: { message: string }[]): string {
  return issues[0]?.message ?? "Données invalides.";
}

function revalidateNews(id: string) {
  revalidatePath("/backoffice/journal");
  revalidatePath(`/backoffice/journal/${id}`);
  revalidatePath("/news");
  revalidatePath("/news/[id]", "page");
}

export async function saveNews(id: string, input: unknown): Promise<ActionResult> {
  const parsed = newsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await m.updateNews(id, parsed.data);
  revalidateNews(id);
  return { ok: true };
}

export async function saveNewsImage(id: string, imageUrl: string): Promise<ActionResult> {
  await m.setNewsImage(id, imageUrl);
  revalidateNews(id);
  return { ok: true };
}

export async function setNewsPublished(id: string, published: boolean): Promise<ActionResult> {
  await m.setPublished(id, published);
  revalidateNews(id);
  return { ok: true };
}

export async function deleteNews(id: string, confirm: string): Promise<ActionResult> {
  if (confirm.trim().toLowerCase() !== "oui") {
    return { ok: false, error: "Tapez « oui » pour confirmer la suppression." };
  }
  await m.deleteNews(id);
  revalidatePath("/backoffice/journal");
  revalidatePath("/news");
  redirect("/backoffice/journal");
}

export async function createNewsAction(input: unknown): Promise<ActionResult> {
  const parsed = createNewsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  const id = await m.createNews(parsed.data);
  revalidatePath("/backoffice/journal");
  redirect(`/backoffice/journal/${id}`);
}
