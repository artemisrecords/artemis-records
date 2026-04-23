import { getAllNews } from "@/lib/db/queries";
import { JournalListClient } from "./JournalListClient";

export default async function JournalPage() {
  const news = await getAllNews();
  return <JournalListClient news={news} />;
}
