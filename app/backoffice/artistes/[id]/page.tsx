import { notFound } from "next/navigation";
import { findArtist } from "@/lib/db/queries";
import { ArtistEditClient } from "./ArtistEditClient";

export default async function ArtistEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artist = await findArtist(id);
  if (!artist) notFound();
  return <ArtistEditClient artist={artist} />;
}
