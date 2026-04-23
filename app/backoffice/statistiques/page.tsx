import { getArtists } from "@/lib/data";
import { StatistiquesClient } from "./StatistiquesClient";

export default async function StatistiquesPage() {
  const artists = await getArtists();
  return <StatistiquesClient artists={artists} />;
}
