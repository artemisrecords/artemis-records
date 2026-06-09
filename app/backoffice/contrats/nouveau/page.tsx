import { getArtists } from "@/lib/db/queries";
import NouveauContratClient from "./NouveauContratClient";

export default async function NouveauContratPage() {
  const artists = await getArtists();
  const artistOptions = artists.map((a) => ({ id: a.id, name: a.name }));
  return <NouveauContratClient artistOptions={artistOptions} />;
}
