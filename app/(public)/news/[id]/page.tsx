import Link from "next/link";
import { notFound } from "next/navigation";
import { NEWS, findNews, formatDate } from "@/lib/data";
import { Eyebrow } from "@/components/Primitives";

export function generateStaticParams() {
  return NEWS.map((n) => ({ id: n.id }));
}

type Params = Promise<{ id: string }>;

export default async function NewsDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const item = findNews(id);
  if (!item) notFound();

  return (
    <article>
      <div
        className="grain text-beige-sable px-[clamp(24px,4vw,56px)] py-[clamp(72px,10vw,130px)]"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(28,31,74,0.25) 0%, rgba(28,31,74,0.7) 100%), url(${item.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Link
          href="/news"
          className="text-[11px] tracking-eyebrow uppercase text-beige-sable/70 font-bold cursor-pointer"
        >
          ⟵ Journal
        </Link>
        <div className="h-6" />
        <Eyebrow inverse className="!text-magenta">
          {item.category} · {formatDate(item.date)}
        </Eyebrow>
        <h1 className="font-display uppercase tracking-display text-[clamp(2.5rem,6vw,5rem)] mt-2.5 font-normal max-w-[900px]">
          {item.title}
        </h1>
      </div>
      <section className="px-[clamp(24px,4vw,56px)] py-[clamp(56px,8vw,96px)] max-w-[760px] mx-auto">
        <p className="italic text-[20px] leading-[1.55] text-ink-muted">
          {item.excerpt}
        </p>
        <p className="text-[16px] leading-[1.75]">
          {item.body || "Article en cours de rédaction."}
        </p>
      </section>
    </article>
  );
}
