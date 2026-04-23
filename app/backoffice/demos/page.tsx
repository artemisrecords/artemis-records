import { getDemos } from "@/lib/adminData";
import { DemosPageClient } from "./DemosPageClient";

export default async function DemosPage() {
  const demos = await getDemos();
  return <DemosPageClient demos={demos} />;
}
