import { getDemos } from "@/lib/db/admin-queries";
import { DemosPageClient } from "./DemosPageClient";

export default async function DemosPage() {
  const demos = await getDemos();
  return <DemosPageClient demos={demos} />;
}
