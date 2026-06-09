"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-helpers";
import { createContractSchema, updateContractSchema } from "@/lib/validation/contract";
import * as m from "@/lib/db/contract-mutations";

export type ActionResult = { ok: true } | { ok: false; error: string };

function firstError(issues: { message: string }[]): string {
  return issues[0]?.message ?? "Données invalides.";
}

function revalidateContracts(id?: string) {
  revalidatePath("/backoffice/contrats");
  if (id) revalidatePath(`/backoffice/contrats/${id}`);
  // Le KPI Contrats des statistiques et le feed Notifications en dépendent.
  revalidatePath("/backoffice/statistiques");
  revalidatePath("/backoffice", "layout");
}

export async function createContractAction(input: unknown): Promise<ActionResult> {
  await requireRole("superadmin", "admin");
  const parsed = createContractSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  const id = await m.createContract(parsed.data);
  revalidateContracts();
  redirect(`/backoffice/contrats/${id}`);
}

export async function updateContractAction(id: string, input: unknown): Promise<ActionResult> {
  await requireRole("superadmin", "admin");
  const parsed = updateContractSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error.issues) };
  await m.updateContract(id, parsed.data);
  revalidateContracts(id);
  return { ok: true };
}

export async function deleteContractAction(id: string, confirm: string): Promise<ActionResult> {
  await requireRole("superadmin", "admin");
  if (confirm.trim().toLowerCase() !== "oui") {
    return { ok: false, error: "Tapez « oui » pour confirmer la suppression." };
  }
  await m.deleteContract(id);
  revalidateContracts();
  redirect("/backoffice/contrats");
}
