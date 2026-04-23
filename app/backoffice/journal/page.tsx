import { getAllNews } from "@/lib/data";
import { JournalListClient } from "./JournalListClient";

export default async function JournalPage() {
  const news = await getAllNews();
  return <JournalListClient news={news} />;
}
