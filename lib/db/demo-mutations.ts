import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { demos } from "./schema";
import type { DemoLink, DemoRow } from "./schema";
import type { DemoStatus } from "@/lib/adminData";

export async function insertDemo(input: {
  artist: string;
  contact: string;
  email: string;
  pitch: string;
  links: DemoLink[];
}): Promise<string> {
  const id = randomUUID();
  await db.insert(demos).values({
    id,
    artist: input.artist,
    contact: input.contact,
    email: input.email,
    pitch: input.pitch,
    links: input.links,
    status: "nouveau",
  });
  return id;
}

export async function getDemoById(id: string): Promise<DemoRow | null> {
  const [row] = await db.select().from(demos).where(eq(demos.id, id)).limit(1);
  return row ?? null;
}

export async function setDemoStatus(
  id: string,
  status: DemoStatus,
  notes?: string,
): Promise<void> {
  const patch: Partial<typeof demos.$inferInsert> = { status };
  if (notes !== undefined) patch.notes = notes;
  await db.update(demos).set(patch).where(eq(demos.id, id));
}

export async function updateDemoMeta(
  id: string,
  meta: {
    rating?: number | null;
    tags?: string[];
    assignedTo?: string | null;
    notes?: string;
  },
): Promise<void> {
  const patch: Partial<typeof demos.$inferInsert> = {};
  if (meta.rating !== undefined) patch.rating = meta.rating;
  if (meta.tags !== undefined) patch.tags = meta.tags;
  if (meta.assignedTo !== undefined) patch.assignedTo = meta.assignedTo;
  if (meta.notes !== undefined) patch.notes = meta.notes;
  if (Object.keys(patch).length === 0) return;
  await db.update(demos).set(patch).where(eq(demos.id, id));
}
