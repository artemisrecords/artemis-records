import "server-only";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { demands } from "./schema";

export async function setDemandStatus(id: string, status: string): Promise<void> {
  await db.update(demands).set({ status }).where(eq(demands.id, id));
}

export async function setDemandAssignee(
  id: string,
  assignedTo: string | null,
): Promise<void> {
  await db.update(demands).set({ assignedTo }).where(eq(demands.id, id));
}
