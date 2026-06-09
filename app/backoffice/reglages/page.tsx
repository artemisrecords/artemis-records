import { getLabelSettings } from "@/lib/db/queries";
import { ReglagesClient } from "./ReglagesClient";

export default async function ReglagesPage() {
  const label = await getLabelSettings();
  return <ReglagesClient label={label} />;
}
