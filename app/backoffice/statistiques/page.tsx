import { getLabelStats } from "@/lib/db/admin-queries";
import { StatistiquesClient } from "./StatistiquesClient";

export default async function StatistiquesPage() {
  const stats = await getLabelStats();
  return <StatistiquesClient stats={stats} />;
}
