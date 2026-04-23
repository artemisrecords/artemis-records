export type { ArtistWithShows as Artist } from "./db/queries";
export type { NewsRow as NewsItem } from "./db/schema";
export type { Embed, DiscoItem } from "./db/schema";
export type Show = {
  id: string;
  date: string;
  city: string;
  venue: string;
  status?: string | null;
  free?: boolean;
  ticketUrl?: string | null;
};

export { getArtists, findArtist, getNews, findNews } from "./db/queries";

export const formatDate = (iso: string | Date): string => {
  try {
    const d = typeof iso === "string" ? new Date(iso) : iso;
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return String(iso);
  }
};
