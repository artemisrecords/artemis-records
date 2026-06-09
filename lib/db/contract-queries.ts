import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "./index";
import { contracts, artists } from "./schema";
import type { ContractRow } from "./schema";

export type ContractListItem = ContractRow & { artistName: string | null };
export type ContractDetail = ContractListItem;

export async function listContracts(): Promise<ContractListItem[]> {
  const rows = await db
    .select({ contract: contracts, artistName: artists.name })
    .from(contracts)
    .leftJoin(artists, eq(contracts.artistId, artists.id))
    .orderBy(desc(contracts.createdAt));
  return rows.map((r) => ({ ...r.contract, artistName: r.artistName ?? null }));
}

export async function getContract(id: string): Promise<ContractDetail | null> {
  const [row] = await db
    .select({ contract: contracts, artistName: artists.name })
    .from(contracts)
    .leftJoin(artists, eq(contracts.artistId, artists.id))
    .where(eq(contracts.id, id))
    .limit(1);
  if (!row) return null;
  return { ...row.contract, artistName: row.artistName ?? null };
}
