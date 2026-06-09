import { getDemos } from "@/lib/db/admin-queries";
import { listAccounts } from "@/lib/invitations";
import { DemosPageClient } from "./DemosPageClient";

export default async function DemosPage() {
  const demos = await getDemos();
  const { users } = await listAccounts();
  const accounts = users
    .filter((u) => u.role === "admin" || u.role === "superadmin")
    .map((u) => ({ id: u.id, name: u.name }));
  return <DemosPageClient demos={demos} accounts={accounts} />;
}
