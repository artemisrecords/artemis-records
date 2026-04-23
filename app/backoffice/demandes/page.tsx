import { getDemands } from "@/lib/db/admin-queries";
import { DemandesPageClient } from "./DemandesPageClient";

export default async function DemandesPage() {
  const demands = await getDemands();
  return <DemandesPageClient demands={demands} />;
}
