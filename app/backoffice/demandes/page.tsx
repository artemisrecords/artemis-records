import { getDemands } from "@/lib/adminData";
import { DemandesPageClient } from "./DemandesPageClient";

export default async function DemandesPage() {
  const demands = await getDemands();
  return <DemandesPageClient demands={demands} />;
}
