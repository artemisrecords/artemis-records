import "server-only";
import { desc } from "drizzle-orm";
import { db } from "./index";
import { demos, demands, subscribers } from "./schema";
import type { DemoRow, DemandRow, SubscriberRow } from "./schema";

export async function getDemos(): Promise<DemoRow[]> {
  return db.select().from(demos).orderBy(desc(demos.receivedAt));
}

export async function getDemands(): Promise<DemandRow[]> {
  return db.select().from(demands).orderBy(desc(demands.receivedAt));
}

export async function getSubscribers(): Promise<SubscriberRow[]> {
  return db.select().from(subscribers).orderBy(desc(subscribers.subscribedAt));
}
