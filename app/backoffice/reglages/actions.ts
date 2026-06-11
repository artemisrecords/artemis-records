"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth-helpers";
import {
  LABEL_EMAIL_KEY,
  LABEL_PHONE_KEY,
  LABEL_ADDRESS_KEY,
} from "@/lib/db/queries";

export type ReglagesState = { ok?: boolean; error?: string } | null;

async function upsertSetting(key: string, value: string) {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: new Date() },
    });
}

export async function saveLabelSettingsAction(
  _prev: ReglagesState,
  formData: FormData,
): Promise<ReglagesState> {
  await requireRole("superadmin", "admin");

  const emails = formData
    .getAll("emails")
    .map((v) => String(v).trim())
    .filter(Boolean);
  const phones = formData
    .getAll("phones")
    .map((v) => String(v).trim())
    .filter(Boolean);
  const address = String(formData.get("address") ?? "").trim();

  for (const email of emails) {
    if (!email.includes("@")) {
      return { error: `Email invalide : ${email}` };
    }
  }

  try {
    await upsertSetting(LABEL_EMAIL_KEY, JSON.stringify(emails));
    await upsertSetting(LABEL_PHONE_KEY, JSON.stringify(phones));
    await upsertSetting(LABEL_ADDRESS_KEY, address);
  } catch (e) {
    console.warn("[reglages] enregistrement échoué:", (e as Error).message);
    return { error: "Enregistrement impossible. Réessayez." };
  }

  // Le footer (layout racine) et la page contact affichent ces réglages.
  revalidatePath("/", "layout");
  return { ok: true };
}
