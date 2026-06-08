import { NextResponse } from "next/server";
import { purgeProcessedDemos } from "@/lib/db/demo-mutations";

/**
 * Purge des démos traitées (statut != « nouveau ») décidées il y a plus de
 * 2 mois. Déclenchée par le cron Vercel (voir vercel.json), tous les jours.
 *
 * Sécurité : Vercel Cron envoie `Authorization: Bearer <CRON_SECRET>`. Si la
 * variable CRON_SECRET est définie, on l'exige ; sinon (dev local) la route
 * reste ouverte pour pouvoir la tester à la main.
 */
export const dynamic = "force-dynamic";

const MONTHS_BEFORE_PURGE = 2;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const before = new Date();
  before.setMonth(before.getMonth() - MONTHS_BEFORE_PURGE);

  const deleted = await purgeProcessedDemos(before);
  return NextResponse.json({ deleted, before: before.toISOString() });
}
