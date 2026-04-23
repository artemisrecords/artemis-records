import { getArtists } from "@/lib/db/queries";
import { StatistiquesClient } from "./StatistiquesClient";

export default async function StatistiquesPage() {
  const artists = await getArtists();
  return <StatistiquesClient artists={artists} />;
}
