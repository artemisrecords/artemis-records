import { getArtists, getNews } from "@/lib/data";
import { HomeClient } from "./HomeClient";

export default async function HomePage() {
  const [allArtists, news] = await Promise.all([getArtists(), getNews()]);
  const artists = allArtists.filter((a) => a.published);
  return <HomeClient artists={artists} news={news} />;
}
