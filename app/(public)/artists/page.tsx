import { getArtists } from "@/lib/data";
import { ArtistsListClient } from "./ArtistsListClient";

export default async function ArtistsPage() {
  const all = await getArtists();
  const artists = all.filter((a) => a.published);
  return <ArtistsListClient artists={artists} />;
}
