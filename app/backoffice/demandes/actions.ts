"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import { setDemandStatus, setDemandAssignee } from "@/lib/db/demand-mutations";

const STATUSES = ["ouverte", "en_cours", "close"] as const;
type DemandStatus = (typeof STATUSES)[number];

export async function updateDemandStatus(id: string, status: string): Promise<void> {
  await requireRole("superadmin", "admin");
  if (!id || !STATUSES.includes(status as DemandStatus)) return;
  await setDemandStatus(id, status);
  revalidatePath("/backoffice/demandes");
}

export async function updateDemandAssignee(id: string, assignedTo: string): Promise<void> {
  await requireRole("superadmin", "admin");
  if (!id) return;
  await setDemandAssignee(id, assignedTo.trim() || null);
  revalidatePath("/backoffice/demandes");
}
