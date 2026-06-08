"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import {
  setDemoStatus,
  updateDemoMeta,
  getDemoById,
} from "@/lib/db/demo-mutations";
import { getLabelNotifyEmail } from "@/lib/db/queries";
import { sendEmail } from "@/lib/email";
import { wrapArtistHtml, demoDecisionLabel } from "@/lib/demoEmails";

export type DecisionState = { ok?: boolean; error?: string } | null;

export async function markListenedAction(id: string): Promise<void> {
  await requireRole("superadmin", "admin");
  await setDemoStatus(id, "ecoute");
  revalidatePath("/backoffice/demos");
}

export async function decideDemoAction(
  _prev: DecisionState,
  formData: FormData,
): Promise<DecisionState> {
  const { user } = await requireRole("superadmin", "admin");

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const notesRaw = formData.get("notes");

  if (decision !== "retenu" && decision !== "refuse") {
    return { error: "Décision invalide." };
  }
  if (!subject || !body) {
    return { error: "Le sujet et le message à l'artiste sont requis." };
  }

  const demo = await getDemoById(id);
  if (!demo) return { error: "Démo introuvable." };

  // Source de vérité : le changement de statut. On le persiste d'abord.
  await setDemoStatus(
    id,
    decision,
    notesRaw !== null ? String(notesRaw) : undefined,
  );

  // Mail à l'artiste (corps édité par l'admin) — best-effort.
  try {
    await sendEmail({
      to: demo.email,
      subject,
      text: body,
      html: wrapArtistHtml(subject, body),
    });
  } catch (e) {
    console.warn("[demo] mail décision artiste échoué:", (e as Error).message);
  }

  // Récap au label — best-effort.
  try {
    const labelTo = await getLabelNotifyEmail();
    await sendEmail({
      to: labelTo,
      ...demoDecisionLabel({
        artist: demo.artist,
        decision,
        deciderName: user.name ?? "Un membre du label",
      }),
    });
  } catch (e) {
    console.warn("[demo] récap label décision échoué:", (e as Error).message);
  }

  revalidatePath("/backoffice/demos");
  return { ok: true };
}

export async function updateDemoMetaAction(formData: FormData): Promise<void> {
  await requireRole("superadmin", "admin");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const patch: {
    rating?: number | null;
    tags?: string[];
    assignedTo?: string | null;
    notes?: string;
  } = {};

  if (formData.has("rating")) {
    const r = Number(formData.get("rating"));
    patch.rating = Number.isFinite(r) && r >= 1 && r <= 5 ? r : null;
  }
  if (formData.has("tags")) {
    patch.tags = String(formData.get("tags") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (formData.has("assignedTo")) {
    const a = String(formData.get("assignedTo") ?? "").trim();
    patch.assignedTo = a || null;
  }
  if (formData.has("notes")) {
    patch.notes = String(formData.get("notes") ?? "");
  }

  await updateDemoMeta(id, patch);
  revalidatePath("/backoffice/demos");
}
