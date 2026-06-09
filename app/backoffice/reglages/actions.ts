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

  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!email.includes("@")) {
    return { error: "Email de contact invalide." };
  }

  try {
    await upsertSetting(LABEL_EMAIL_KEY, email);
    await upsertSetting(LABEL_PHONE_KEY, phone);
    await upsertSetting(LABEL_ADDRESS_KEY, address);
  } catch (e) {
    console.warn("[reglages] enregistrement échoué:", (e as Error).message);
    return { error: "Enregistrement impossible. Réessayez." };
  }

  revalidatePath("/backoffice/reglages");
  return { ok: true };
}
