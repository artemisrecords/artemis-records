import { listContracts } from "@/lib/db/contract-queries";
import { ContratsClient } from "./ContratsClient";

export default async function ContratsPage() {
  const contracts = await listContracts();
  return <ContratsClient contracts={contracts} />;
}
