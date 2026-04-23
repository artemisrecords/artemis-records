import { getArtists } from "@/lib/db/queries";
import { ArtistesListClient } from "./ArtistesListClient";

export default async function ArtistesPage() {
  const artists = await getArtists();
  return <ArtistesListClient artists={artists} />;
}
