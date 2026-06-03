import { getArtists, getNews, getNewsletterSettings } from "@/lib/db/queries";
import { HomeClient } from "./HomeClient";

export default async function HomePage() {
  const [allArtists, news, newsletter] = await Promise.all([
    getArtists(),
    getNews(),
    getNewsletterSettings(),
  ]);
  const artists = allArtists.filter((a) => a.published);
  return (
    <HomeClient
      artists={artists}
      news={news}
      newsletterUrl={newsletter.signupUrl}
    />
  );
}
