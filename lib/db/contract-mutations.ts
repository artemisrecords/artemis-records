import "server-only";
import { eq, like } from "drizzle-orm";
import { db } from "./index";
import { contracts } from "./schema";
import type { ContractStatus } from "@/lib/validation/contract";

type ContractInput = {
  title: string;
  party: string;
  artistId?: string;
  type: string;
  startDate: string;
  endDate: string;
  amount: string;
  status: ContractStatus;
  notes: string;
  signedBy: string[];
};

/** Réf séquentielle par année : ct-YYYY-NNN. Anti-collision comme uniqueSlug. */
async function uniqueRef(year: string): Promise<string> {
  const prefix = `ct-${year}-`;
  const existing = await db
    .select({ id: contracts.id })
    .from(contracts)
    .where(like(contracts.id, `${prefix}%`));
  let n = existing.length + 1;
  while (true) {
    const candidate = `${prefix}${String(n).padStart(3, "0")}`;
    if (!existing.some((e) => e.id === candidate)) return candidate;
    n++;
  }
}

export async function createContract(input: ContractInput): Promise<string> {
  const year = input.startDate.slice(0, 4);
  const id = await uniqueRef(year);
  await db.insert(contracts).values({
    id,
    title: input.title,
    party: input.party,
    artistId: input.artistId ?? null,
    type: input.type,
    startDate: input.startDate,
    endDate: input.endDate,
    amount: input.amount,
    status: input.status,
    notes: input.notes && input.notes.length > 0 ? input.notes : null,
    signedBy: input.signedBy,
  });
  return id;
}

export async function updateContract(id: string, input: ContractInput): Promise<void> {
  await db
    .update(contracts)
    .set({
      title: input.title,
      party: input.party,
      artistId: input.artistId ?? null,
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      amount: input.amount,
      status: input.status,
      notes: input.notes && input.notes.length > 0 ? input.notes : null,
      signedBy: input.signedBy,
      updatedAt: new Date(),
    })
    .where(eq(contracts.id, id));
}

export async function setContractStatus(id: string, status: ContractStatus): Promise<void> {
  await db
    .update(contracts)
    .set({ status, updatedAt: new Date() })
    .where(eq(contracts.id, id));
}

export async function deleteContract(id: string): Promise<void> {
  await db.delete(contracts).where(eq(contracts.id, id));
}
