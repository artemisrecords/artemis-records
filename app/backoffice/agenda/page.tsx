import { getArtists } from "@/lib/db/queries";
import { AgendaClient, type AgendaShow } from "./AgendaClient";

export default async function AgendaPage() {
  const artists = await getArtists();
  const shows: AgendaShow[] = artists
    .flatMap((a) =>
      a.shows.map((s) => ({
        id: s.id,
        artistId: a.id,
        artist: a.name,
        date: s.date,
        city: s.city,
        venue: s.venue,
        status: s.status ?? "",
        free: s.free,
        ticketUrl: s.ticketUrl ?? "",
      })),
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  const artistOptions = artists.map((a) => ({ id: a.id, name: a.name }));

  return <AgendaClient shows={shows} artists={artistOptions} />;
}
