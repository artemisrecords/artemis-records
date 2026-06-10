"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { artists, settings } from "@/lib/db/schema";
import {
  NEWSLETTER_SIGNUP_KEY,
  NEWSLETTER_DASHBOARD_KEY,
} from "@/lib/db/queries";
import { requireArtistAccess, requireRole } from "@/lib/auth-helpers";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Empty string clears the value; otherwise must be an http(s) URL. */
function normalizeUrl(raw: string): { value: string | null; error?: string } {
  const v = raw.trim();
  if (v === "") return { value: null };
  if (!/^https?:\/\//i.test(v)) {
    return { value: null, error: "Le lien doit commencer par http:// ou https://" };
  }
  return { value: v };
}

async function upsertSetting(key: string, value: string | null) {
  if (value === null) {
    await db.delete(settings).where(eq(settings.key, key));
    return;
  }
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: new Date() },
    });
}

export async function saveNewsletterSettings(input: {
  signupUrl: string;
  dashboardUrl: string;
}): Promise<ActionResult> {
  await requireRole("superadmin", "admin");
  const signup = normalizeUrl(input.signupUrl);
  const dashboard = normalizeUrl(input.dashboardUrl);
  if (signup.error) return { ok: false, error: signup.error };
  if (dashboard.error) return { ok: false, error: dashboard.error };

  await upsertSetting(NEWSLETTER_SIGNUP_KEY, signup.value);
  await upsertSetting(NEWSLETTER_DASHBOARD_KEY, dashboard.value);

  revalidatePath("/backoffice/newsletter");
  revalidatePath("/");
  return { ok: true };
}

export async function saveArtistNewsletter(input: {
  artistId: string;
  url: string;
}): Promise<ActionResult> {
  // Un artiste gère le lien newsletter de SA fiche (depuis /espace).
  await requireArtistAccess(input.artistId);
  const { value, error } = normalizeUrl(input.url);
  if (error) return { ok: false, error };

  await db
    .update(artists)
    .set({ newsletterUrl: value, updatedAt: new Date() })
    .where(eq(artists.id, input.artistId));

  revalidatePath("/backoffice/newsletter");
  revalidatePath(`/backoffice/artistes/${input.artistId}`);
  revalidatePath(`/artists/${input.artistId}`);
  revalidatePath("/espace");
  return { ok: true };
}
