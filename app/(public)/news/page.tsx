import { getNews } from "@/lib/db/queries";
import { ChapterTitle } from "@/components/Primitives";
import { NewsCard } from "@/components/NewsCard";

export default async function NewsPage() {
  const news = await getNews();
  return (
    <section className="px-[clamp(24px,4vw,56px)] py-[clamp(56px,8vw,96px)]">
      <ChapterTitle
        eyebrow="Journal · 2026"
        title="ACTUALITÉS"
        italic="Ce qui s'écrit chez nous"
      />
      <div className="h-10" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-7">
        {news.map((n) => (
          <NewsCard key={n.id} news={n} />
        ))}
      </div>
      {news.length === 0 && (
        <div className="text-center py-20 italic text-ink-muted">
          Aucune actualité pour le moment.
        </div>
      )}
    </section>
  );
}
