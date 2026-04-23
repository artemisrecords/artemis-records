import { notFound } from "next/navigation";
import { findNews, getAllNews } from "@/lib/db/queries";
import { JournalEditClient } from "./JournalEditClient";

export default async function JournalEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [news, all] = await Promise.all([findNews(id), getAllNews()]);
  if (!news) notFound();
  const others = all.filter((n) => n.id !== news.id);
  return <JournalEditClient news={news} others={others} />;
}
