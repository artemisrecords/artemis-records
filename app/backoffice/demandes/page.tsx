import { getDemands } from "@/lib/db/admin-queries";
import { listAccounts } from "@/lib/invitations";
import { DemandesPageClient } from "./DemandesPageClient";

export default async function DemandesPage() {
  const demands = await getDemands();
  const { users } = await listAccounts();
  const accounts = users
    .filter((u) => u.role === "admin" || u.role === "superadmin")
    .map((u) => ({ id: u.id, name: u.name }));
  return <DemandesPageClient demands={demands} accounts={accounts} />;
}
