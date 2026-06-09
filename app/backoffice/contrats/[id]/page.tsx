import { notFound } from "next/navigation";
import { getContract } from "@/lib/db/contract-queries";
import { getArtists } from "@/lib/db/queries";
import { ContratEditClient } from "./ContratEditClient";

export default async function ContratEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [contract, artists] = await Promise.all([getContract(id), getArtists()]);
  if (!contract) notFound();
  const artistOptions = artists.map((a) => ({ id: a.id, name: a.name }));
  return <ContratEditClient contract={contract} artistOptions={artistOptions} />;
}
